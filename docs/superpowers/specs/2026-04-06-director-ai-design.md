# Director AI — Design Spec

**Date:** 2026-04-06  
**Status:** Approved for implementation  
**Author:** Architecture decisions by Claude; review by Davis Dey

---

## 1. What It Is

The Director AI is the weighted event selector that drives scenario progression across Layers 1–5. It replaces the current hardcoded `nextNodeId` stub in the `/choice` route. Its job: given the current world state, select the most contextually appropriate next scenario node from the eligible pool.

This is the core of divergence. Two players who start the same game but make different choices accumulate different world states — and different world states produce different next scenarios. The divergence compounds across layers.

---

## 2. Architecture

### 2.1 New module

`backend/src/engine/director-ai.ts`

Pure functions only. No I/O, no side effects, no imports from routes or store. Takes world state + node candidates, returns selected node. Fully unit-testable.

### 2.2 Engine refactor

`applyChoice` is split into two functions:

| Function | Signature | Purpose |
|---|---|---|
| `applyEffect` | `(state, effect) => WorldState` | Applies financial + EO deltas. Does NOT set `currentNodeId` or `turnsElapsed`. |
| `applyChoice` | `(state, effect, nextNodeId) => WorldState` | Calls `applyEffect`, then sets `currentNodeId` and increments `turnsElapsed`. Existing callers unchanged. |

This allows the `/choice` route to get the post-choice state (for Director AI to evaluate) before the `currentNodeId` is locked in.

### 2.3 Updated `/choice` route flow

```
1. Validate request
2. Look up current session state
3. Look up ChoiceEffect from registry
4. applyEffect(state, effect) → intermediateState
5. selectNextNode(intermediateState, getAllNodes(), rng) → nextNode
6. applyChoice(state, effect, nextNode?.id ?? null) → finalState
7. Persist finalState
8. Return clientState + nextNode (client-safe)
```

### 2.4 Node metadata additions

`ScenarioNodeFull` (in `scenario-registry.ts`) gains three new fields:

```typescript
theme: NodeTheme;                          // thematic category
baseWeight: number;                        // default 1.0
eoTargetDimensions: EODimension[];         // which EO dims this node primarily tests
conditions?: NodeConditions;               // hard eligibility gates (optional)
```

```typescript
type NodeTheme =
  | "financing"
  | "competition"
  | "hiring"
  | "branding"
  | "operations"
  | "networking"
  | "crisis"
  | "general";

interface NodeConditions {
  capitalMin?: number;
  capitalMax?: number;
  reputationMin?: number;
  reputationMax?: number;
  debtMin?: number;
  debtMax?: number;
  requiresMentorAccess?: boolean;
  requiresPremises?: boolean;
  employeeCountMin?: number;
}
```

---

## 3. Weight Formula

```
finalWeight = baseWeight × themeAffinity × eoAffinity
```

All three are multiplicative. A node with weight 0 is excluded from the draw. A node with high weight is proportionally more likely to be selected.

### 3.1 Hard eligibility (pre-scoring filter)

Before scoring, all candidates are filtered:

- `node.layer === state.layer + 1` — must be the next layer
- `node.conditions` — all declared conditions must pass (thresholds, flags)

Nodes that fail eligibility are removed entirely. They don't participate in the weighted draw.

### 3.2 Theme affinity

The Director AI maps world state signals to theme multipliers. This is centralized in the Director AI — nodes don't carry the math, just the tag.

| Condition | Theme boosted | Multiplier |
|---|---|---|
| `capital < 3000` | `financing` | ×3.0 |
| `capital < 6000` | `financing` | ×1.5 |
| `competitorAggression > 60` | `competition` | ×2.0 |
| `debt > 5000` | `crisis` | ×2.5 |
| `reputation < 20` | `branding` | ×1.5 |
| `revenue > 500 && employeeCount < 2` | `hiring` | ×2.0 |
| `networkStrength < 20` | `networking` | ×1.5 |
| `hasPremises === true` | `operations` | ×1.5 |
| All other themes | — | ×1.0 |

Multiple conditions can stack if they point to the same theme (cap at ×4.0 to prevent runaway weights).

### 3.3 EO affinity

Each node declares `eoTargetDimensions` — the EO dimensions it primarily tests. The affinity score is the mean of per-dimension scores.

**Layers 1–2 (matching):** dimensions the player is strong in score higher.
```
perDimScore = playerEOValue / 10        // range [0, 1]
```

**Layers 3–5 (challenging):** dimensions the player is weak in score higher.
```
perDimScore = (10 - playerEOValue) / 10  // range [0, 1]
```

`eoAffinity = 1.0 + mean(perDimScores)`  → range [1.0, 2.0]

This means EO affinity can at most double a node's weight, and at minimum leaves it unchanged (1.0).

### 3.4 Weighted random draw

After scoring, a weighted random draw selects one node. Uses a seeded PRNG:

```typescript
const rng = createPRNG(state.seed ^ state.turnsElapsed);
```

XOR with `turnsElapsed` ensures each turn draws from a different part of the PRNG sequence, while remaining deterministic per session.

---

## 4. Fallback Behaviour

If `candidates` is empty after filtering (no eligible nodes for the next layer), the Director AI:

1. Logs a warning (server-side only)
2. Falls back to the first node in the target layer (by insertion order in the registry)
3. If no nodes exist for the target layer at all, returns `null` → game ends (treated as completion)

The demo cannot break because a layer has sparse content. The fallback ensures there's always a path forward.

---

## 5. Registry Changes

`scenario-registry.ts` gains:

- All existing nodes (`L1-node-1` through `L1-node-5`, `L2-node-1`) get `theme`, `baseWeight`, `eoTargetDimensions` fields backfilled
- New export: `getAllNodes(): ScenarioNodeFull[]` — returns all nodes across all layers
- New export: `getNodesForLayer(layer: number): ScenarioNodeFull[]` — filtered by layer

The `/choice` route uses `getAllNodes()` to feed the Director AI candidates.

---

## 6. New Files

| File | Purpose |
|---|---|
| `backend/src/engine/director-ai.ts` | Core Director AI logic: `selectNextNode`, `computeThemeAffinity`, `computeEOAffinity`, `weightedDraw` |
| `backend/src/engine/__tests__/director-ai.test.ts` | Unit tests for all Director AI functions |

### Modified files

| File | Change |
|---|---|
| `backend/src/engine/apply-choice.ts` | Extract `applyEffect`, keep `applyChoice` as wrapper |
| `backend/src/engine/__tests__/apply-choice.test.ts` | Add tests for `applyEffect` |
| `backend/src/scenario-registry.ts` | Add metadata fields to all nodes; add `getAllNodes`, `getNodesForLayer` |
| `backend/src/routes/choice.ts` | Replace stub `nextNodeId` with Director AI call |

---

## 7. What This Doesn't Cover

- **Hidden competitor AI** — pre-scripted reaction patterns (demo: lookup table). Separate spec.
- **Layer 0 LLM classifier** — separate spec.
- **Full node content** — 171 nodes total; only enough for demo path needed by April 16.
- **DB persistence** — Director AI is designed as pure functions; plugging in Drizzle later requires no logic changes.

---

## 8. Review Notes (for Davis)

Decisions made autonomously — flag any you want changed:

1. **Multiplicative formula** — could be additive; multiplicative produces more dramatic divergence at extremes
2. **EO affinity cap at 2.0** — keeps the formula from being dominated by EO alone
3. **Theme multiplier cap at 4.0** — prevents one condition from making all draws deterministic
4. **`seed ^ turnsElapsed` PRNG** — simplest deterministic approach; could use a better hash if needed
5. **Fallback to first node in layer** — alternative is to throw and let the route handle it; chosen fallback keeps the demo stable
