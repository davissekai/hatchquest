# Director AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the weighted event selector that replaces the hardcoded `nextNodeId = "L2-node-1"` stub in the `/choice` route, driving real scenario divergence based on world state.

**Architecture:** Each `ScenarioNodeFull` gains `theme`, `baseWeight`, `eoTargetDimensions`, and optional `conditions` fields. A pure `director-ai.ts` module scores all eligible next-layer nodes using a multiplicative formula (`baseWeight × themeAffinity × eoAffinity`) and does a weighted random draw. The `/choice` route calls `applyEffect` (new) to get the post-choice state, feeds it to `selectNextNode`, then calls `applyChoice` with the selected id.

**Tech Stack:** TypeScript strict, Vitest, Fastify v5, existing `createPRNG` (mulberry32), `@hatchquest/shared` types.

---

## File Map

| File | Status | Change |
|---|---|---|
| `backend/src/engine/apply-choice.ts` | Modify | Extract `applyEffect`; `applyChoice` becomes a thin wrapper |
| `backend/src/engine/__tests__/apply-choice.test.ts` | Modify | Add tests for `applyEffect` directly |
| `backend/src/scenario-registry.ts` | Modify | Add `NodeTheme`, `NodeConditions`, update `ScenarioNodeFull`; backfill metadata on all 6 nodes; add `getAllNodes`, `getNodesForLayer` |
| `backend/src/engine/director-ai.ts` | Create | `passesConditions`, `computeThemeAffinity`, `computeEOAffinity`, `weightedDraw`, `selectNextNode` |
| `backend/src/engine/__tests__/director-ai.test.ts` | Create | Full unit test coverage for all exported functions |
| `backend/src/routes/choice.ts` | Modify | Add `selectNextNodeId` optional option; replace stub with Director AI call using `applyEffect` |
| `backend/src/routes/__tests__/choice.test.ts` | Modify | Pass `selectNextNodeId` stub in `buildApp`; add Director AI integration test |
| `backend/src/index.ts` | Modify | Wire `selectNextNodeId` using real Director AI + registry |

---

## Task 1: Extract `applyEffect` from `applyChoice`

**Files:**
- Modify: `backend/src/engine/apply-choice.ts`
- Modify: `backend/src/engine/__tests__/apply-choice.test.ts`

### Why
The `/choice` route needs the post-choice world state BEFORE knowing the `nextNodeId` (to feed the Director AI). Splitting `applyEffect` out makes this possible without computing the state transition twice.

- [ ] **Step 1: Add failing tests for `applyEffect`**

Append to `backend/src/engine/__tests__/apply-choice.test.ts`:

```typescript
import { applyChoice, applyEffect } from "../apply-choice.js";

// ... existing imports and tests stay unchanged ...

describe("applyEffect", () => {
  it("applies financial effects without advancing turnsElapsed", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: -2000,
      revenue: 500,
      debt: 0,
      monthlyBurn: 200,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: {},
    };
    const next = applyEffect(state, effect);

    expect(next.capital).toBe(state.capital - 2000);
    expect(next.revenue).toBe(500);
    expect(next.turnsElapsed).toBe(state.turnsElapsed); // NOT incremented
  });

  it("does not set currentNodeId", () => {
    const state = makeState(); // currentNodeId is null
    const effect: ChoiceEffect = {
      capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
      reputation: 0, networkStrength: 0, eoDeltas: {},
    };
    const next = applyEffect(state, effect);

    expect(next.currentNodeId).toBeNull(); // unchanged
  });

  it("applies EO deltas and clamps to [0, 10]", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
      reputation: 0, networkStrength: 0,
      eoDeltas: { riskTaking: 3, autonomy: -6 },
    };
    const next = applyEffect(state, effect);

    expect(next.eoProfile.riskTaking).toBe(8);
    expect(next.eoProfile.autonomy).toBe(0);
  });

  it("does not mutate the original state", () => {
    const state = makeState();
    const original = state.capital;
    applyEffect(state, {
      capital: -5000, revenue: 0, debt: 0, monthlyBurn: 0,
      reputation: 0, networkStrength: 0, eoDeltas: {},
    });
    expect(state.capital).toBe(original);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npx vitest run backend/src/engine/__tests__/apply-choice.test.ts
```

Expected: FAIL — `applyEffect is not a function`

- [ ] **Step 3: Extract `applyEffect` in `apply-choice.ts`**

Replace the full contents of `backend/src/engine/apply-choice.ts` with:

```typescript
import type { EODimension, WorldState } from "@hatchquest/shared";

// Defines how a single choice modifies the world state.
export interface ChoiceEffect {
  capital: number;
  revenue: number;
  debt: number;
  monthlyBurn: number;
  reputation: number;
  networkStrength: number;
  eoDeltas: Partial<Record<EODimension, number>>;
  flags?: Partial<{
    hasBackupPower: boolean;
    hasPremises: boolean;
    susuMember: boolean;
    mentorAccess: boolean;
  }>;
}

// Clamps a number to [min, max].
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Applies a choice's effects to the world state — financial, social, EO, and boolean flags.
 * Does NOT update currentNodeId or turnsElapsed; those are routing concerns set by applyChoice.
 * Returns a new WorldState — never mutates the input.
 */
export function applyEffect(state: WorldState, effect: ChoiceEffect): WorldState {
  const eoProfile = { ...state.eoProfile };
  for (const [dim, delta] of Object.entries(effect.eoDeltas)) {
    const key = dim as EODimension;
    eoProfile[key] = clamp(eoProfile[key] + delta, 0, 10);
  }

  return {
    ...state,
    capital: state.capital + effect.capital,
    revenue: state.revenue + effect.revenue,
    debt: state.debt + effect.debt,
    monthlyBurn: state.monthlyBurn + effect.monthlyBurn,
    reputation: clamp(state.reputation + effect.reputation, 0, 100),
    networkStrength: clamp(state.networkStrength + effect.networkStrength, 0, 100),
    hasBackupPower: effect.flags?.hasBackupPower ?? state.hasBackupPower,
    hasPremises: effect.flags?.hasPremises ?? state.hasPremises,
    susuMember: effect.flags?.susuMember ?? state.susuMember,
    mentorAccess: effect.flags?.mentorAccess ?? state.mentorAccess,
    eoProfile,
  };
}

/**
 * Applies a choice and advances the routing meta (currentNodeId, turnsElapsed).
 * Calls applyEffect internally — the only caller that needs to set nextNodeId.
 * Returns a new WorldState — never mutates the input.
 */
export function applyChoice(
  state: WorldState,
  effect: ChoiceEffect,
  nextNodeId: string
): WorldState {
  return {
    ...applyEffect(state, effect),
    currentNodeId: nextNodeId,
    turnsElapsed: state.turnsElapsed + 1,
  };
}
```

- [ ] **Step 4: Run all tests — verify full suite still passes**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npx vitest run
```

Expected: all 72 existing tests pass + 4 new `applyEffect` tests = **76 passing**

- [ ] **Step 5: Commit**

```bash
git add backend/src/engine/apply-choice.ts backend/src/engine/__tests__/apply-choice.test.ts
git commit -m "refactor: extract applyEffect from applyChoice — enables Director AI pre-selection"
```

---

## Task 2: Add Director AI Metadata to Scenario Registry

**Files:**
- Modify: `backend/src/scenario-registry.ts`

### Why
The Director AI needs `theme`, `baseWeight`, `eoTargetDimensions`, and `conditions` on each node to score them. `getAllNodes()` and `getNodesForLayer()` give the Director AI its candidate pool.

- [ ] **Step 1: Update `ScenarioNodeFull` interface and add new types**

At the top of `backend/src/scenario-registry.ts`, replace the existing interface block:

```typescript
import type { ScenarioNode, Choice, EODimension } from "@hatchquest/shared";
import type { ChoiceEffect } from "./engine/apply-choice.js";

// Thematic categories — used by the Director AI to match scenarios to world state signals.
export type NodeTheme =
  | "financing"
  | "competition"
  | "hiring"
  | "branding"
  | "operations"
  | "networking"
  | "crisis"
  | "general";

// Hard eligibility gates — all defined conditions must pass for a node to be eligible.
export interface NodeConditions {
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

// Full scenario node including server-side choice effects and Director AI metadata.
export interface ScenarioNodeFull {
  id: string;
  layer: number;
  narrative: string;
  choices: Choice[];
  effects: [ChoiceEffect, ChoiceEffect, ChoiceEffect];
  // Director AI metadata
  theme: NodeTheme;
  baseWeight: number;
  eoTargetDimensions: EODimension[];
  conditions?: NodeConditions;
}

// Converts a full node to the client-safe ScenarioNode shape.
export function toClientNode(full: ScenarioNodeFull): ScenarioNode {
  return {
    id: full.id,
    layer: full.layer,
    narrative: full.narrative,
    choices: full.choices,
  };
}
```

- [ ] **Step 2: Run type-check — expect type errors on existing nodes (missing fields)**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npm run type-check --workspace=backend 2>&1 | head -30
```

Expected: errors on `L1_NODE_1` through `L2_NODE_1` — `theme`, `baseWeight`, `eoTargetDimensions` missing.

- [ ] **Step 3: Backfill metadata on all 6 nodes**

Add these three fields to each existing node in `scenario-registry.ts`:

**L1_NODE_1** — distributor deal, week 3:
```typescript
theme: "competition",
baseWeight: 1.0,
eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
```

**L1_NODE_2** — blogger feature offer:
```typescript
theme: "branding",
baseWeight: 1.0,
eoTargetDimensions: ["proactiveness", "innovativeness"],
```

**L1_NODE_3** — underperforming friend/employee:
```typescript
theme: "hiring",
baseWeight: 1.0,
eoTargetDimensions: ["autonomy", "competitiveAggressiveness"],
```

**L1_NODE_4** — competitor pricing below cost:
```typescript
theme: "competition",
baseWeight: 1.0,
eoTargetDimensions: ["competitiveAggressiveness", "innovativeness"],
```

**L1_NODE_5** — packaging rebrand decision:
```typescript
theme: "branding",
baseWeight: 1.0,
eoTargetDimensions: ["innovativeness", "autonomy"],
```

**L2_NODE_1** — GEA loan vs informal loan:
```typescript
theme: "financing",
baseWeight: 1.0,
eoTargetDimensions: ["riskTaking", "autonomy"],
```

- [ ] **Step 4: Add `getAllNodes` and `getNodesForLayer` exports**

Append before the existing `getNode` export in `scenario-registry.ts`:

```typescript
/** Returns all nodes across all layers — used by the Director AI candidate pool. */
export function getAllNodes(): ScenarioNodeFull[] {
  return Array.from(REGISTRY.values());
}

/** Returns all nodes for a specific layer — convenience filter over getAllNodes(). */
export function getNodesForLayer(layer: number): ScenarioNodeFull[] {
  return getAllNodes().filter((n) => n.layer === layer);
}
```

- [ ] **Step 5: Run type-check — expect clean**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npm run type-check --workspace=backend
```

Expected: no errors.

- [ ] **Step 6: Run full test suite — expect all passing**

```bash
npx vitest run
```

Expected: **76 passing** (no regressions).

- [ ] **Step 7: Commit**

```bash
git add backend/src/scenario-registry.ts
git commit -m "feat: add Director AI metadata to scenario nodes + getAllNodes/getNodesForLayer"
```

---

## Task 3: Build `director-ai.ts` (TDD)

**Files:**
- Create: `backend/src/engine/director-ai.ts`
- Create: `backend/src/engine/__tests__/director-ai.test.ts`

- [ ] **Step 1: Create the test file**

Create `backend/src/engine/__tests__/director-ai.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  passesConditions,
  computeThemeAffinity,
  computeEOAffinity,
  weightedDraw,
  selectNextNode,
} from "../director-ai.js";
import { createInitialWorldState } from "../world-state.js";
import type { ScenarioNodeFull, NodeTheme } from "../../scenario-registry.js";
import type { ChoiceEffect } from "../apply-choice.js";

// Minimal ScenarioNodeFull for testing
function makeNode(overrides: Partial<ScenarioNodeFull> = {}): ScenarioNodeFull {
  const effect: ChoiceEffect = {
    capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
    reputation: 0, networkStrength: 0, eoDeltas: {},
  };
  return {
    id: "test-node",
    layer: 2,
    narrative: "test",
    choices: [
      { index: 0, text: "A", tensionHint: "x" },
      { index: 1, text: "B", tensionHint: "y" },
      { index: 2, text: "C", tensionHint: "z" },
    ],
    effects: [effect, effect, effect],
    theme: "general",
    baseWeight: 1.0,
    eoTargetDimensions: [],
    ...overrides,
  };
}

function makeState() {
  return createInitialWorldState({ seed: 42, sector: "tech" });
}

// --- passesConditions ---

describe("passesConditions", () => {
  it("passes when no conditions are defined", () => {
    const node = makeNode({ conditions: undefined });
    expect(passesConditions(node, makeState())).toBe(true);
  });

  it("fails capitalMin when capital is below threshold", () => {
    const node = makeNode({ conditions: { capitalMin: 20_000 } });
    expect(passesConditions(node, makeState())).toBe(false); // capital is 10_000
  });

  it("passes capitalMin when capital meets threshold", () => {
    const node = makeNode({ conditions: { capitalMin: 5_000 } });
    expect(passesConditions(node, makeState())).toBe(true);
  });

  it("fails capitalMax when capital exceeds threshold", () => {
    const node = makeNode({ conditions: { capitalMax: 5_000 } });
    expect(passesConditions(node, makeState())).toBe(false); // capital is 10_000
  });

  it("fails debtMin when debt is below threshold", () => {
    const node = makeNode({ conditions: { debtMin: 1_000 } });
    expect(passesConditions(node, makeState())).toBe(false); // debt is 0
  });

  it("fails requiresMentorAccess when mentorAccess is false", () => {
    const node = makeNode({ conditions: { requiresMentorAccess: true } });
    expect(passesConditions(node, makeState())).toBe(false);
  });

  it("passes requiresMentorAccess when mentorAccess is true", () => {
    const node = makeNode({ conditions: { requiresMentorAccess: true } });
    const state = { ...makeState(), mentorAccess: true };
    expect(passesConditions(node, state)).toBe(true);
  });
});

// --- computeThemeAffinity ---

describe("computeThemeAffinity", () => {
  it("returns 1.0 for general theme at baseline state", () => {
    expect(computeThemeAffinity("general", makeState())).toBe(1.0);
  });

  it("returns 3.0 for financing when capital < 3000", () => {
    const state = { ...makeState(), capital: 2_000 };
    expect(computeThemeAffinity("financing", state)).toBe(3.0);
  });

  it("returns 1.5 for financing when capital is 3000–6000", () => {
    const state = { ...makeState(), capital: 5_000 };
    expect(computeThemeAffinity("financing", state)).toBe(1.5);
  });

  it("returns 1.0 for financing when capital >= 6000 (baseline)", () => {
    const state = { ...makeState(), capital: 10_000 };
    expect(computeThemeAffinity("financing", state)).toBe(1.0);
  });

  it("returns 2.0 for competition when competitorAggression > 60", () => {
    const state = { ...makeState(), competitorAggression: 70 };
    expect(computeThemeAffinity("competition", state)).toBe(2.0);
  });

  it("returns 2.5 for crisis when debt > 5000", () => {
    const state = { ...makeState(), debt: 6_000 };
    expect(computeThemeAffinity("crisis", state)).toBe(2.5);
  });

  it("returns 1.5 for branding when reputation < 20", () => {
    const state = { ...makeState(), reputation: 10 };
    expect(computeThemeAffinity("branding", state)).toBe(1.5);
  });

  it("returns 2.0 for hiring when revenue > 500 and employeeCount < 2", () => {
    const state = { ...makeState(), revenue: 600, employeeCount: 0 };
    expect(computeThemeAffinity("hiring", state)).toBe(2.0);
  });

  it("caps multiplier at 4.0", () => {
    // No theme naturally exceeds 3.0, but test the cap path explicitly
    const state = { ...makeState(), capital: 100, debt: 10_000, competitorAggression: 99 };
    // financing at capital < 3000 = 3.0 — at cap
    expect(computeThemeAffinity("financing", state)).toBeLessThanOrEqual(4.0);
  });
});

// --- computeEOAffinity ---

describe("computeEOAffinity", () => {
  it("returns 1.0 when no eoTargetDimensions", () => {
    const node = makeNode({ eoTargetDimensions: [] });
    expect(computeEOAffinity(node, makeState())).toBe(1.0);
  });

  it("matches strong dimensions in early layers (layer 1)", () => {
    // riskTaking = 5 (midpoint). boost = 1 + 5/10 = 1.5
    const node = makeNode({ eoTargetDimensions: ["riskTaking"] });
    const state = { ...makeState(), layer: 1 };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.5);
  });

  it("challenges weak dimensions in late layers (layer 3)", () => {
    // riskTaking = 5 (midpoint). challenge = 1 + (10-5)/10 = 1.5
    const node = makeNode({ eoTargetDimensions: ["riskTaking"] });
    const state = { ...makeState(), layer: 3 };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.5);
  });

  it("gives high affinity to strong dim in early game", () => {
    // riskTaking = 9 → match score = 1 + 9/10 = 1.9
    const node = makeNode({ eoTargetDimensions: ["riskTaking"] });
    const state = { ...makeState(), layer: 1, eoProfile: { ...makeState().eoProfile, riskTaking: 9 } };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.9);
  });

  it("gives high affinity to weak dim in late game", () => {
    // autonomy = 2 → challenge score = 1 + (10-2)/10 = 1.8
    const node = makeNode({ eoTargetDimensions: ["autonomy"] });
    const state = { ...makeState(), layer: 4, eoProfile: { ...makeState().eoProfile, autonomy: 2 } };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.8);
  });

  it("averages across multiple target dimensions", () => {
    // riskTaking=8, autonomy=2, both in early game
    // score = 1 + mean(8/10, 2/10) = 1 + 0.5 = 1.5
    const node = makeNode({ eoTargetDimensions: ["riskTaking", "autonomy"] });
    const base = makeState().eoProfile;
    const state = { ...makeState(), layer: 1, eoProfile: { ...base, riskTaking: 8, autonomy: 2 } };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.5);
  });
});

// --- weightedDraw ---

describe("weightedDraw", () => {
  it("always returns the only item when there is one", () => {
    const items = [{ item: "only", weight: 1.0 }];
    const rng = () => 0.5;
    expect(weightedDraw(items, rng)).toBe("only");
  });

  it("selects the heavier item more often over many draws", () => {
    const items = [
      { item: "light", weight: 1 },
      { item: "heavy", weight: 9 },
    ];
    const draws: string[] = [];
    let n = 0;
    const deterministicRng = () => {
      n += 0.1;
      return n % 1;
    };
    for (let i = 0; i < 100; i++) {
      draws.push(weightedDraw(items, deterministicRng));
    }
    const heavyCount = draws.filter((d) => d === "heavy").length;
    expect(heavyCount).toBeGreaterThan(50); // should be ~90 out of 100
  });
});

// --- selectNextNode ---

describe("selectNextNode", () => {
  it("returns null when nextLayer > 5", () => {
    const state = { ...makeState(), layer: 5 };
    expect(selectNextNode(state, [], () => 0.5)).toBeNull();
  });

  it("returns null when no nodes exist for the next layer", () => {
    const state = { ...makeState(), layer: 1 };
    const nodes = [makeNode({ layer: 1 })]; // wrong layer
    expect(selectNextNode(state, nodes, () => 0.5)).toBeNull();
  });

  it("selects a node from the correct next layer", () => {
    const state = { ...makeState(), layer: 1 };
    const node = makeNode({ id: "L2-test", layer: 2 });
    const result = selectNextNode(state, [node], () => 0.5);
    expect(result?.id).toBe("L2-test");
  });

  it("filters out nodes that fail hard conditions", () => {
    const state = { ...makeState(), layer: 1, capital: 2_000 };
    const expensive = makeNode({ id: "expensive", layer: 2, conditions: { capitalMin: 8_000 } });
    const cheap = makeNode({ id: "cheap", layer: 2 });
    // rng always selects first eligible — doesn't matter for this test
    const result = selectNextNode(state, [expensive, cheap], () => 0);
    expect(result?.id).toBe("cheap");
  });

  it("falls back to the first node in the layer when all fail conditions", () => {
    const state = { ...makeState(), layer: 1, capital: 100 };
    const node = makeNode({ id: "gated", layer: 2, conditions: { capitalMin: 50_000 } });
    // all candidates fail — should fall back
    const result = selectNextNode(state, [node], () => 0.5);
    expect(result?.id).toBe("gated"); // fallback returns it anyway
  });

  it("selects higher-weighted nodes more often", () => {
    const state = { ...makeState(), layer: 1 };
    const low = makeNode({ id: "low", layer: 2, baseWeight: 0.1 });
    const high = makeNode({ id: "high", layer: 2, baseWeight: 10 });

    const results = new Map<string, number>();
    for (let i = 0; i < 100; i++) {
      const rng = () => Math.random(); // real random — statistical test
      const r = selectNextNode(state, [low, high], rng);
      const id = r?.id ?? "null";
      results.set(id, (results.get(id) ?? 0) + 1);
    }
    expect(results.get("high") ?? 0).toBeGreaterThan(results.get("low") ?? 0);
  });
});
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npx vitest run backend/src/engine/__tests__/director-ai.test.ts
```

Expected: FAIL — module `../director-ai.js` not found

- [ ] **Step 3: Create `director-ai.ts`**

Create `backend/src/engine/director-ai.ts`:

```typescript
import type { WorldState } from "@hatchquest/shared";
import type { ScenarioNodeFull, NodeTheme } from "../scenario-registry.js";

/**
 * Returns true if the world state satisfies all hard eligibility conditions on the node.
 * A node with no conditions is always eligible.
 */
export function passesConditions(
  node: ScenarioNodeFull,
  state: WorldState
): boolean {
  const c = node.conditions;
  if (!c) return true;
  if (c.capitalMin !== undefined && state.capital < c.capitalMin) return false;
  if (c.capitalMax !== undefined && state.capital > c.capitalMax) return false;
  if (c.reputationMin !== undefined && state.reputation < c.reputationMin) return false;
  if (c.reputationMax !== undefined && state.reputation > c.reputationMax) return false;
  if (c.debtMin !== undefined && state.debt < c.debtMin) return false;
  if (c.debtMax !== undefined && state.debt > c.debtMax) return false;
  if (c.requiresMentorAccess && !state.mentorAccess) return false;
  if (c.requiresPremises && !state.hasPremises) return false;
  if (c.employeeCountMin !== undefined && state.employeeCount < c.employeeCountMin) return false;
  return true;
}

/**
 * Returns the theme multiplier for a node given the current world state.
 * Centralizes all world-state-to-theme mappings in one place — nodes only carry a tag.
 * Capped at 4.0 to prevent runaway weights making draws deterministic.
 */
export function computeThemeAffinity(theme: NodeTheme, state: WorldState): number {
  let multiplier = 1.0;

  switch (theme) {
    case "financing":
      if (state.capital < 3_000) multiplier = 3.0;
      else if (state.capital < 6_000) multiplier = 1.5;
      break;
    case "competition":
      if (state.competitorAggression > 60) multiplier = 2.0;
      break;
    case "crisis":
      if (state.debt > 5_000) multiplier = 2.5;
      break;
    case "branding":
      if (state.reputation < 20) multiplier = 1.5;
      break;
    case "hiring":
      if (state.revenue > 500 && state.employeeCount < 2) multiplier = 2.0;
      break;
    case "networking":
      if (state.networkStrength < 20) multiplier = 1.5;
      break;
    case "operations":
      if (state.hasPremises) multiplier = 1.5;
      break;
    case "general":
    default:
      multiplier = 1.0;
  }

  return Math.min(multiplier, 4.0);
}

/**
 * Returns the EO affinity multiplier for a node given the current world state.
 * Layers 1–2: match — strong EO dimensions score higher (divergence phase).
 * Layers 3–5: challenge — weak EO dimensions score higher (assessment phase).
 * Returns [1.0, 2.0].
 */
export function computeEOAffinity(
  node: ScenarioNodeFull,
  state: WorldState
): number {
  if (node.eoTargetDimensions.length === 0) return 1.0;

  const isLateGame = state.layer >= 3;

  const scores = node.eoTargetDimensions.map((dim) => {
    const playerValue = state.eoProfile[dim]; // [0, 10]
    return isLateGame
      ? (10 - playerValue) / 10 // challenge: weak dims score higher
      : playerValue / 10; // match: strong dims score higher
  });

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return 1.0 + mean; // [1.0, 2.0]
}

/**
 * Performs a weighted random draw from a list of scored items.
 * Weight must be > 0 for all items. Caller ensures this.
 */
export function weightedDraw<T>(
  items: { item: T; weight: number }[],
  rng: () => number
): T {
  const total = items.reduce((sum, { weight }) => sum + weight, 0);
  let cursor = rng() * total;

  for (const { item, weight } of items) {
    cursor -= weight;
    if (cursor <= 0) return item;
  }

  // Rounding fallback — should never reach here with valid weights
  return items[items.length - 1].item;
}

/**
 * Selects the next scenario node from the candidate pool based on world state.
 * 1. Filters to nodes in the correct next layer
 * 2. Filters to nodes that pass hard eligibility conditions
 * 3. Scores each by: baseWeight × themeAffinity × eoAffinity
 * 4. Weighted random draw using the provided PRNG
 * Falls back to the first node in the target layer if all fail conditions.
 * Returns null only if no nodes exist for the next layer (game fully over).
 */
export function selectNextNode(
  state: WorldState,
  allNodes: ScenarioNodeFull[],
  rng: () => number
): ScenarioNodeFull | null {
  const nextLayer = state.layer + 1;
  if (nextLayer > 5) return null;

  const layerNodes = allNodes.filter((n) => n.layer === nextLayer);
  if (layerNodes.length === 0) return null;

  const candidates = layerNodes.filter((n) => passesConditions(n, state));

  // Fallback: if all nodes fail conditions, use the full layer pool
  const pool = candidates.length > 0 ? candidates : layerNodes;

  const scored = pool.map((node) => ({
    item: node,
    weight:
      node.baseWeight *
      computeThemeAffinity(node.theme, state) *
      computeEOAffinity(node, state),
  }));

  return weightedDraw(scored, rng);
}
```

- [ ] **Step 4: Run Director AI tests — verify they pass**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npx vitest run backend/src/engine/__tests__/director-ai.test.ts
```

Expected: all director-ai tests pass.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: **76 + new director-ai tests passing** (count exact number).

- [ ] **Step 6: Commit**

```bash
git add backend/src/engine/director-ai.ts backend/src/engine/__tests__/director-ai.test.ts
git commit -m "feat: Director AI — weighted event selector with theme affinity + EO affinity"
```

---

## Task 4: Wire Director AI into `/choice` Route

**Files:**
- Modify: `backend/src/routes/choice.ts`
- Modify: `backend/src/routes/__tests__/choice.test.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Update `ChoiceRouteOptions` to accept optional `selectNextNodeId`**

In `backend/src/routes/choice.ts`, update the imports and `ChoiceRouteOptions`:

```typescript
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ScenarioNode, WorldState } from "@hatchquest/shared";
import type { SessionStore } from "../store/session-store.js";
import type { ChoiceEffect } from "../engine/apply-choice.js";
import { applyEffect, applyChoice } from "../engine/apply-choice.js";
import { toClientState } from "./helpers.js";

export interface ChoiceRegistry {
  getNode: (nodeId: string | null) => ScenarioNode | null;
  getChoiceEffect: (nodeId: string, choiceIndex: 0 | 1 | 2) => ChoiceEffect | null;
}

export interface ChoiceRouteOptions {
  store: SessionStore;
  getNode: ChoiceRegistry["getNode"];
  getChoiceEffect: ChoiceRegistry["getChoiceEffect"];
  /**
   * Director AI node selector — takes the post-effect world state and returns the next nodeId.
   * Optional: defaults to returning null (signals game over) when not injected.
   * Tests inject a stub; production injects the real Director AI.
   */
  selectNextNodeId?: (state: WorldState) => string | null;
}
```

- [ ] **Step 2: Replace stub `nextNodeId` with Director AI call in `handleChoice`**

In `backend/src/routes/choice.ts`, replace the `handleChoice` function signature and the apply-choice section:

```typescript
async function handleChoice(
  request: FastifyRequest<{ Body: ChoiceBody }>,
  reply: FastifyReply,
  store: SessionStore,
  getNode: ChoiceRegistry["getNode"],
  getChoiceEffect: ChoiceRegistry["getChoiceEffect"],
  selectNextNodeId: (state: WorldState) => string | null
): Promise<void> {
  // ... all existing guards stay exactly the same (lines 59-91) ...

  // --- Apply the choice ---
  // applyEffect gives us the post-choice state without committing the nodeId,
  // so the Director AI can evaluate the updated world before selecting the next node.
  const intermediateState = applyEffect(worldState, effect);
  const nextNodeId = selectNextNodeId(intermediateState) ?? "";
  let newState = {
    ...intermediateState,
    currentNodeId: nextNodeId,
    turnsElapsed: worldState.turnsElapsed + 1,
  };

  // Game ends after 5 turns
  const gameOver = newState.turnsElapsed >= 5;
  if (gameOver) {
    newState = { ...newState, isComplete: true };
  }

  store.updateSession(sessionId, {
    worldState: newState,
    status: gameOver ? "complete" : "active",
  });

  const nextNode = gameOver ? null : getNode(newState.currentNodeId);

  return reply.status(200).send({
    sessionId,
    clientState: toClientState(newState),
    nextNode,
  });
}
```

Update the plugin to pass `selectNextNodeId`:

```typescript
export const choiceRoutes: FastifyPluginAsync<ChoiceRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store, getNode, getChoiceEffect, selectNextNodeId = () => null } = options;

  fastify.post<{ Body: ChoiceBody }>("/choice", async (request, reply) => {
    return handleChoice(request, reply, store, getNode, getChoiceEffect, selectNextNodeId);
  });
};
```

- [ ] **Step 3: Run type-check**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npm run type-check --workspace=backend
```

Expected: clean.

- [ ] **Step 4: Update `choice.test.ts` — add `selectNextNodeId` stub to `buildApp`**

In `backend/src/routes/__tests__/choice.test.ts`, update `buildApp`:

```typescript
function buildApp(store: SessionStore): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(choiceRoutes, {
    store,
    getNode: (id: string | null) => (id === "L1-node-1" || id === "L2-node-1" ? STUB_NODE : null),
    getChoiceEffect: (nodeId: string, idx: 0 | 1 | 2) =>
      nodeId === "L1-node-1" ? STUB_EFFECT : null,
    // Stub Director AI — always returns L2-node-1 so route tests stay hermetic
    selectNextNodeId: () => "L2-node-1",
  });
  return app;
}
```

- [ ] **Step 5: Run route tests — verify all 10 choice tests still pass**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npx vitest run backend/src/routes/__tests__/choice.test.ts
```

Expected: 10/10 pass.

- [ ] **Step 6: Wire real Director AI in `index.ts`**

In `backend/src/index.ts`, add imports and wire:

```typescript
import Fastify from "fastify";
import { sessionStore } from "./store/session-store.js";
import { getNode, getChoiceEffect, getAllNodes } from "./scenario-registry.js";
import { selectNextNode } from "./engine/director-ai.js";
import { createPRNG } from "./engine/prng.js";
import type { WorldState } from "@hatchquest/shared";
import { startRoutes } from "./routes/start.js";
import { classifyRoutes } from "./routes/classify.js";
import { choiceRoutes } from "./routes/choice.js";
import { sessionRoutes } from "./routes/session.js";
import { resultsRoutes } from "./routes/results.js";

const server = Fastify({ logger: true });

server.get("/health", async () => {
  return { status: "ok", service: "hatchquest-backend" };
});

/** Director AI node selector — uses seeded PRNG for deterministic sessions. */
function directorSelectNextNodeId(state: WorldState): string | null {
  const rng = createPRNG(state.seed ^ state.turnsElapsed);
  const next = selectNextNode(state, getAllNodes(), rng);
  return next?.id ?? null;
}

await server.register(startRoutes, { prefix: "/api/game", store: sessionStore });
await server.register(classifyRoutes, { prefix: "/api/game", store: sessionStore });
await server.register(choiceRoutes, {
  prefix: "/api/game",
  store: sessionStore,
  getNode,
  getChoiceEffect,
  selectNextNodeId: directorSelectNextNodeId,
});
await server.register(sessionRoutes, { prefix: "/api/game", store: sessionStore, getNode });
await server.register(resultsRoutes, { prefix: "/api/game", store: sessionStore });

const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT ?? 3001);
    await server.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

- [ ] **Step 7: Run full type-check and full test suite**

```bash
cd /c/Users/P/PROJECTS/ProjectS/HQ-new && npm run type-check --workspace=backend && npx vitest run
```

Expected: type-check clean, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/choice.ts backend/src/routes/__tests__/choice.test.ts backend/src/index.ts
git commit -m "feat: wire Director AI into /choice route — replaces hardcoded nextNodeId stub"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `applyEffect` extracted | Task 1 |
| `selectNextNode` pure function | Task 3 |
| `computeThemeAffinity` with all 8 themes | Task 3 |
| `computeEOAffinity` match/challenge split at layer 3 | Task 3 |
| `weightedDraw` | Task 3 |
| `passesConditions` hard gates | Task 3 |
| `NodeTheme`, `NodeConditions`, updated `ScenarioNodeFull` | Task 2 |
| All 6 existing nodes backfilled | Task 2 |
| `getAllNodes`, `getNodesForLayer` | Task 2 |
| `/choice` route uses Director AI | Task 4 |
| `index.ts` wired with real Director AI | Task 4 |
| Seeded PRNG (`seed ^ turnsElapsed`) | Task 4 |
| Fallback when all conditions fail | Task 3 (`selectNextNode`) |
| Existing tests not broken | Tasks 1, 4 |

**Type consistency check:** `ScenarioNodeFull` (defined in Task 2) is imported in `director-ai.ts` (Task 3) and `choice.ts` (Task 4) — consistent. `applyEffect` (Task 1) used in `choice.ts` (Task 4) — consistent. `WorldState` from `@hatchquest/shared` throughout — consistent.

**No placeholders:** All steps contain complete code. No TBDs.
