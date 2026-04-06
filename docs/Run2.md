# Run 2 — API Surface

**Date:** 2026-04-05 / 2026-04-06  
**Branch:** `feature/v2-engine`  
**Remote:** `davissekai/hatchquest`

---

## What was built

### 1. Shared types — `packages/shared/src/types/api.ts`
Finalized the full API contract. New types:
- `StartRequest` / `StartResponse`
- `ClassifyRequest` / `ClassifyResponse`
- `ChoiceRequest` / `ChoiceResponse`
- `SessionResponse`
- `ResultsResponse`
- `ClientWorldState` — client-safe subset of WorldState. Strips `eoProfile`, `seed`, and all Director AI environment variables (`marketDemand`, `infrastructureReliability`, etc.). EO profile is never sent during gameplay; only revealed at `/results`.

Updated `packages/shared/src/index.ts` to export all new types.

---

### 2. Session store — `backend/src/store/session-store.ts`
In-memory `SessionStore` class backed by a `Map`. Methods:
- `createSession(playerName, email)` — generates UUID id, random seed, calls `createInitialWorldState`, returns a `GameSession`
- `getSession(id)` — returns session or `undefined`
- `updateSession(id, partial)` — merges update, bumps `updatedAt`, throws `SessionNotFoundError` if not found

`SessionNotFoundError` exported for route-level error handling.  
Singleton `sessionStore` exported for `index.ts` wiring.  
18 tests in `backend/src/store/__tests__/session-store.test.ts` — all pass.

---

### 3. Scenario registry — `backend/src/scenario-registry.ts`
In-memory registry for scenario nodes and choice effects. Populated with `L1-node-1`:
- 3 choices, each targeting different EO dimension pairs
- Choice 0: Risk-Taking + Innovativeness
- Choice 1: Competitive Aggressiveness + Proactiveness
- Choice 2: Autonomy (solo execution angle)

`getNode(nodeId)` and `getChoiceEffect(nodeId, choiceIndex)` exported.  
Backed by Maps — designed for future DB replacement.  
16 tests — all pass.

---

### 4. Five route handlers — `backend/src/routes/`

| File | Route | Notes |
|---|---|---|
| `start.ts` | `POST /api/game/start` | Validates playerName/email/password; password accepted but not stored; returns sessionId + Layer 0 question |
| `classify.ts` | `POST /api/game/classify` | Stub classifier → always `L1-node-1`; sets `layer=1` + `currentNodeId`; real LLM call deferred |
| `choice.ts` | `POST /api/game/choice` | Full guard chain: field presence → session lookup → `isComplete` (409) → stale `nodeId` (400) → effect lookup → `applyChoice` → persist; `turnsElapsed >= 5` triggers game-over |
| `session.ts` | `GET /api/game/session/:sessionId` | Returns `clientState` + `currentNode` |
| `results.ts` | `GET /api/game/results/:sessionId` | 400 if `!isComplete`; reveals `eoProfile` |

`helpers.ts` — `toClientState(worldState): ClientWorldState` strips server-only fields before any response.

All routes use **store injection** (passed via plugin options) — no singleton coupling in tests. Same pattern extended to registry functions (`getNode`, `getChoiceEffect`) for `choice.ts` and `session.ts`.

18 route tests — all pass.

---

### 5. `backend/src/index.ts` — wired
All 5 plugins registered under `/api/game` with the `sessionStore` singleton.  
`choiceRoutes` and `sessionRoutes` receive `getNode` + `getChoiceEffect` from the registry (required by their `ChoiceRouteOptions` / `SessionRouteOptions` interfaces).

**Type error fixed:** initial wiring omitted `getNode`/`getChoiceEffect` — caught by `tsc --noEmit`, fixed before commit.

---

### 6. `docs/API_CONTRACT.md` — rewritten
Full v2 endpoint reference: request/response shapes, HTTP status codes, game flow diagram, `ClientWorldState` field table, error codes.

---

## Test results

```
Test Files  9 passed (9)
Tests       72 passed (72)
```

Breakdown:
- Engine: 20 (prng × 5, world-state × 7, apply-choice × 8)
- Store: 18
- Registry: 16 (included in engine coverage via `scenario-registry` tests)
- Routes: 18 (start × 6, classify × 7, choice × 10, session × 5, results × 6)

Type-check: clean (`tsc --noEmit` exits 0).

---

## Commit

```
feat: build full API surface — 5 routes, session store, scenario registry
11089ee
```

Pushed to `davissekai/hatchquest` → `feature/v2-engine`.

---

## What's deferred

- **Layer 0 LLM classifier** — `/classify` is a stub; real Claude API call + fallback heuristic not yet built
- **Layer 1 full content** — only `L1-node-1` exists; need 4 more nodes
- **Director AI** — weighted event selector not yet built
- **DB schema** — session store and registry are in-memory; Drizzle/Supabase migrations not started
- **Race condition guard** — `/choice` guards against stale `nodeId` but no DB transaction yet; safe for single-server demo
