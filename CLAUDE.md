# HatchQuest — Project Briefing for Claude Code

> This file is the authoritative context for all Claude Code sessions in this repo.
> Read it fully before touching any code. It overrides the AGENT_MANIFEST.md (which is v1 and outdated).

---

## What HatchQuest Is

HatchQuest is an **Entrepreneurship-Oriented Business Simulation with Game-Based Assessment (GBA)**.
It is a serious game that maps player behavior to the **Lumpkin & Dess Entrepreneurial Orientation (EO) framework** — measuring risk-taking, innovativeness, proactiveness, competitive aggressiveness, and autonomy across 5 dimensions.

Most business simulations measure financial performance only. HatchQuest measures **behavioral orientation**. That is the novel angle. It is being built for the **UGBS Nest** (University of Ghana Business School entrepreneurship hub) as a diagnostic gateway for incoming founders.

The game is set in **Accra, Ghana**, with economic figures grounded in Ghana Statistical Service / World Bank SME context.

---

## The Stakes

- **Demo deadline:** ~April 16, 2026 (two weeks from April 2, 2026)
- **Audience:** Oliver Aggrey (AfriVenture Lab / UGBS) and Prof. Acheampong
- **What they need to see:** A fully playable prototype with genuine divergence — two players making different choices end up in meaningfully different world-states. EO profiling output. Complete path from Layer 0 through a Layer 5 ending.
- **What this proves:** The architecture works. Everything after the demo is content and depth.

This is not a toy prototype. Oliver and Prof. Acheampong are evaluating whether this becomes the Nest's intake system. The quality of the engineering and the validity of the behavioral assessment matter.

---

## We Are Building v2. v1 Is Dead.

The codebase in this repo is v1. **v1 is being gutted and replaced.** Do not build on top of v1 architecture.

### Why v1 failed architecturally

v1 used a **Finite State Machine (FSM)** with 30 fixed sequential beats. Every player, regardless of choices, converged on similar outcomes and similar EO profiles. The branching factor was essentially 1. Different choices didn't produce meaningfully different worlds — which defeats the purpose of a behavioral assessment tool.

### What v2 is

v2 replaces the FSM with a **World State + Weighted Event Selector** pattern:

- The game maintains a **world state** — a rich set of variables describing the player's business and environment
- Instead of a fixed sequence, the next scenario is selected from an **event pool**, weighted dynamically by the current world state
- Early choices shift state → shifted state changes which events are likely next → this compounds across all 5 layers
- Two players making different choices diverge immediately and keep diverging

---

## The New Architecture

### Game Structure

A full playthrough = **Layer 0 (fixed opening) + 5 scenario layers**.

| Layer | Branches per Node | Total Nodes |
|---|---|---|
| Layer 0 | — (fixed opening, free-text) | 1 |
| Layer 1 | 5 | 5 |
| Layer 2 | 3 per L1 node | 15 |
| Layer 3 | 2 per L2 node | 30 |
| Layer 4 | 2 per L3 node | 60 |
| Layer 5 | 1 per L4 node (convergence endings) | 60 |
| **Total** | | **171 nodes** |

**For the demo:** Build the engine to support all 5 layers structurally. Populate Layer 1 fully (5 nodes), Layer 2 partially, enough of Layer 3+ to show one complete path. Oliver needs to see divergence, not all 171 nodes.

### Layer 0 — Free-Text + LLM Classifier (highest-risk component)

Layer 0 is the path-defining moment. Before any state variables have diverged, the player responds to **guiding open questions in free text** — no multiple choice.

The backend sends the free-text responses to an **LLM classifier** (Claude API) that maps them to EO pole distributions:
- Values poles: People-first / Profit-first / Mixed
- Risk poles: Risk-tolerant / Risk-averse
- Orientation poles: Proactive / Reactive
- Agency poles: Autonomous / Collaborative
- Competitive poles: Aggressive / Measured

The classifier returns a **confidence distribution** (not a hard label) that seeds the player's starting EO profile and determines which of the 5 Layer 1 world-states they enter.

**Implementation note:** The LLM call must have a fallback. If it fails or times out, use a simplified keyword heuristic that gives reasonable pole distributions. The demo cannot break because of an API timeout.

### Layers 1–5 — Weighted Event Selector + 3-Choice Scenarios

Each layer: the Director AI scores every eligible event in the pool against the current world state, runs a weighted random draw, and presents the selected scenario.

**Choice format:** 3 choices per scenario (not 9). Each choice sits at the intersection of EO dimensions in tension — e.g., Risk-taking vs. Competitive Aggressiveness, Autonomy vs. Proactiveness. This satisfies Prof. Acheampong's "dimension tensions baked into choices" requirement without the UX cost of 9 options. Do NOT change this back to 9 without Davis making that call explicitly.

Each choice:
- Has an ambiguous preamble (no obviously right answer)
- Forces a reveal of true EO priorities
- Modifies world state variables (cascading consequence chains)
- Modifies weights of future events in the pool

### The Four Core Systems

1. **Weighted Random Event System ("Director AI")** — pool of events, base weights modified by world state, weighted random draw per turn
2. **Cascading Consequence Chains** — events modify state → state modifies next-event weights → compounds across layers
3. **Procedural Scenario Seeds** — randomized starting market parameters per session (seed-based JS PRNG, not Postgres `setseed()`)
4. **Hidden Competitor Personalities** — 3–5 AI competitors with hidden traits. For the demo: pre-scripted reaction patterns (lookup table) rather than full utility-function AI

---

## Tech Stack (Locked In)

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript strict, Tailwind CSS, Shadcn/ui |
| Backend | **Fastify** (standalone Node.js server) |
| Shared Types | `packages/shared/` — TypeScript interfaces shared by frontend + backend |
| Database | Supabase / PostgreSQL |
| ORM | Drizzle |
| Testing | Vitest |
| Frontend hosting | Vercel |
| Backend hosting | **Railway** |
| LLM | Claude API (via Anthropic SDK) for Layer 0 classifier |

### Monorepo Structure (Target)

```
/
├── frontend/          ← Next.js app (moved from root)
├── backend/           ← Fastify game engine server (new)
├── packages/
│   └── shared/        ← types/game.ts and shared interfaces (new)
└── package.json       ← workspace root
```

**This restructure has not happened yet.** The repo currently has the v1 Next.js app at root. The monorepo migration is part of the v2 cleanout.

---

## The Build Plan

### Phase 0 — Cleanout + Foundation (in progress)
- [ ] Create branch `feature/v2-engine`
- [ ] Restructure to monorepo layout
- [ ] Move Next.js to `frontend/`, gut `src/engine/`, `src/db/schema.ts`, API routes
- [ ] Scaffold `backend/` with Fastify
- [ ] Create `packages/shared/` with new type definitions
- [ ] Design and define **World State model** (Davis decides the variables)
- [ ] New DB schema (`scenario_nodes`, `choice_matrices`, `world_state_effects`, `game_events`)

### Phase 1 — Core Loop
- [ ] `createInitialWorldState()` with seed support
- [ ] Event pool data model + weighted selector ("Director AI")
- [ ] `applyChoice()` — new transition function (replaces v1's `processChoice`)
- [ ] Layer 0: free-text input → LLM classifier → pole distributions → initial EO profile
- [ ] Layer 1 fully playable (5 nodes, hand-crafted)
- [ ] API routes: `/start`, `/classify` (Layer 0), `/choice`, `/session`, `/results`

### Phase 2 — Depth + Divergence
- [ ] Cascading consequence chain logic
- [ ] Hidden competitor AI (pre-scripted reaction patterns for demo)
- [ ] Layers 2–3 populated (enough for one full demo path)
- [ ] End-of-game EO scoring with distribution-based profile

### Phase 3 — Demo Polish
- [ ] Complete path from Layer 0 through Layer 5
- [ ] Results page with EO radar chart
- [ ] Content generation agent fills remaining nodes
- [ ] Integration tests for full playthrough

---

## The Team

**Davis** — Architect and lead. All architectural decisions belong to Davis. Claude Code implements; Davis decides. When a decision has architectural implications, flag it and wait.

**Lois** — Frontend engineer. Builds the Next.js frontend against the API contract. Her entry point is `frontend/`. She should never touch `backend/` or `packages/shared/` directly.

**Ebo** — Frontend engineer. Works alongside Lois on the Next.js frontend. His entry point is also `frontend/`. He should never touch `backend/` or `packages/shared/` directly.

Shared types in `packages/shared/` are owned jointly — any change to `packages/shared/` requires Davis sign-off as it affects both sides of the contract.

---

## EO Framework Reference (Lumpkin & Dess, 1996)

The five dimensions the game measures. These are the foundation of everything — scoring, choice design, classifier output, results display.

1. **Autonomy** — independent action of an individual or team in bringing forth an idea and carrying it through to completion
2. **Innovativeness** — tendency to engage in and support new ideas, novelty, experimentation, and creative processes
3. **Risk-Taking** — taking bold actions by venturing into the unknown, committing large portions of resources to uncertain outcomes
4. **Proactiveness** — opportunity-seeking, forward-looking perspective; introducing products/services ahead of competition
5. **Competitive Aggressiveness** — propensity to directly and intensely challenge competitors to achieve entry or improve position

These dimensions **may vary independently**. A player can be highly proactive but risk-averse. The game must tease apart these combinations, not confirm stereotypes.

---

## Key Lessons from v1 (Do Not Repeat)

These are bugs and design mistakes found in the v1 codebase during code review. Do not carry them forward.

1. **`createInitialState` had `reputation: 0, network: 0`** but the contract said `reputation: 50, network: 10`. Initial state must match the API contract exactly.
2. **`transition.test.ts` was all `.todo`** — the most critical engine logic had zero test coverage. TDD is non-negotiable.
3. **Race condition in the choice route** — multiple concurrent POSTs from the same session could corrupt state. The new choice endpoint must use a DB transaction or `WHERE NOT is_complete` guard.
4. **`ResultsResponse` type mismatched the actual API response** — types diverged from implementation. `packages/shared/` is the single source of truth; the API must match it exactly.
5. **`completeStory()` was dead code** — the route did it inline. Don't export functions that aren't used.
6. **`deriveNextBeatId` was a silent fallback** — silently advancing on null `nextBeatId` masked seeding errors. Any unexpected null should log a warning.

---

## Architecture Rules (v2)

1. **World state is the brain.** All game logic reads from and writes to the world state. No game logic inside React components.
2. **`packages/shared/` is the contract.** All interfaces live there. Frontend and backend import from it. Never define ad-hoc types inline.
3. **TDD is non-negotiable.** Engine functions have tests before implementation. 100% coverage on the engine.
4. **The frontend is a consumer.** `frontend/` only renders state. It calls the API, receives new state, re-renders. No game logic in the frontend.
5. **The backend is the source of truth.** EO dimensions are never sent to the client during gameplay — only revealed on the results page.
6. **The Director AI lives in the backend.** Event selection, weight calculation, consequence chains — all backend. Never expose the weight system to the client.
7. **Davis decides architecture. Claude implements.** Flag any decision with architectural implications before writing code.

---

## Branch Strategy

- `main` — protected, production-ready only
- `develop` — staging, all PRs merge here first
- `feature/v2-engine` — the active v2 rebuild branch
- `feat/<name>` — individual feature branches off `feature/v2-engine`

No PR merges to `main` if engine tests fail.

---

## Verification

Run before declaring any code complete:

```bash
# From repo root
npm run type-check
npm run lint
npm run test
```

Project-specific: the engine must have 100% test coverage. Run `npm run test:coverage` and check.

---

_Document owner: Davis Dey | Last updated: April 2026 | This file supersedes AGENT_MANIFEST.md_
