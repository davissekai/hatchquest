# HatchQuest — Frontend Team Guide (v2)

Welcome to the HatchQuest frontend. This document covers your scope, setup, and what you need to build.

---

## What You Own

You own everything the player sees and interacts with:

- Landing page — the entry point
- Founder creation form — name, email, password
- Layer 0 screen — the free-text entrepreneurial story prompt (NEW in v2)
- Game screen — narrative text, 3-choice buttons, HUD (capital, reputation, network)
- Results page — EO radar chart, summary text, final capital

## What's not yours :)
- API route logic (Fastify backend)
- Game state calculations (Director AI)
- Database or auth setup
- `packages/shared/` types

---

## Stack

| What | Technology |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript — strict, no `any` |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + React Testing Library |

---

## Getting Set Up

1. **Clone the repo**
   ```bash
   git clone https://github.com/davissekai/hatchquest.git

   cd hatchquest
   ```

2. **Check out the active branch** — this is the only branch you need
   ```bash
   git checkout feature/v2-engine
   ```
   > Do not use the `frontend` or `packages` remote branches — they are stale.

3. **Install dependencies** — this sets up `@hatchquest/shared` via the workspace
   ```bash
   npm install
   ```

4. **Start the frontend dev server**
   ```bash
   npm run dev:frontend
   # → http://localhost:3000
   ```

5. **Create your working branch** — branch off `feature/v2-engine`, not `main`
   ```bash
   git checkout -b feat/your-feature-name
   ```

6. **Read these before writing any code**
   - `FRONTEND.md` — this file (you're here)
   - `frontend/AGENTS.md` — full technical briefing for your AI agent
   - `docs/API_CONTRACT.md` — the API your frontend calls

---

## The New Design (v2)

v1 is dead. Here's what changed and why it matters for you.

### v1 (old, dead)
- Fixed 30-beat FSM — every player converged on similar outcomes
- API returned `beat` objects with v1-specific shapes
- `GameContext.tsx` is wired to v1 — **treat it as a full rewrite target**

### v2 (what you're building)
- **World State + Weighted Event Selector** — the Director AI selects the next scenario based on how the player's business state has evolved
- Different players diverge immediately — your choices change the world, which changes what happens next
- 5 layers (Layer 0 → Layer 5) with 171 total nodes
- **Layer 0 is new** — a free-text prompt where the player describes their business idea; the backend classifies it to determine which Layer 1 scenario they enter
- Each scenario has **exactly 3 choices** (not 2, not 9) — each one sits at the intersection of EO dimensions in tension

The EO profile is a **hidden behavioral assessment**. Players never see their scores during gameplay. Only revealed on the results page.

---

## The API Contract

Read `docs/API_CONTRACT.md` for the full reference. Short version:

```
POST /api/game/start          → { sessionId, layer0Question }
POST /api/game/classify       → { sessionId, layer1NodeId }
POST /api/game/choice (loop)  → { sessionId, clientState, nextNode }
GET  /api/game/session/:id    → { sessionId, clientState, currentNode }
GET  /api/game/results/:id    → { sessionId, eoProfile, clientState, summary }
```

All types are in `@hatchquest/shared`. **Import them — never redefine inline.**

```typescript
import type { ClientWorldState, ScenarioNode, EOProfile, ChoiceResponse } from "@hatchquest/shared";
```

---

## What's Already Built (Reuse These)

The base visual design system is complete. You can build on or modify the aesthetics of it.

| Component | What it does |
|---|---|
| `BreathingGrid` | Animated background grid — the "vibe" |
| `RetroTransition` | Loading overlay between decisions |
| `AnimatedScore` | Animated number counter (results page) |
| `RadarChart` | 5-axis EO radar chart — just update the data source |
| `NarrativeCard`, `ChoiceButton`, `Sidebar`, `ResourceBar` | Use or adapt |

---

## What Needs to Be Built / Fixed

### 1. Rewrite `GameContext.tsx` — Priority 1

The current context is v1 wiring. Full rewrite needed to match v2 API:

| Current (wrong) | v2 (correct) |
|---|---|
| `makeChoice(choiceId: string)` | `makeChoice(nodeId: string, choiceIndex: 0\|1\|2)` |
| Expects `{beat, state.resources}` from `/start` | `/start` returns `{sessionId, layer0Question}` |
| No classify step | `classifyLayer0(sessionId, response)` needed |
| `GET /api/game/session?sessionId=...` | `GET /api/game/session/:sessionId` |
| Inline Beat/Choice type defs | Import from `@hatchquest/shared` |

### 2. Build `/layer0` Page — Priority 2

Doesn't exist yet. Player sees the `layer0Question` and types their answer.
Submit → POST `/api/game/classify` → route to `/play`.

### 3. Update `/play` Page — Priority 3

Uses v1 state shape. Update to `ScenarioNode`:
- `node.narrative` (not `beat.storyText`)
- `choices[].text` + `choices[].tensionHint` (new — show as hint below choice text)
- HUD: `clientState.capital`, `clientState.reputation`, `clientState.networkStrength`
- Remove `momentumMultiplier` (not in v2 `ClientWorldState`)

### 4. Update `/results` Page — Priority 4

Wire `EOProfile` (5 floats, 0–10 each) to RadarChart. Display `summary` from API.

### 5. `/create` — Add Password Field

v2 `StartRequest` requires `password`. Auth isn't enforced yet but the field must be present.
Route to `/layer0` after start (not `/loading`).

### 6. `/resume` — Fix Session URL

Change `GET /api/game/session?sessionId=...` to `GET /api/game/session/:sessionId`.

---

## Working Without the Backend

The Fastify backend runs on Railway — you won't have it locally. Build against mock data first:

Create `frontend/src/lib/mock-api.ts` and wire your hooks to it. The `docs/API_CONTRACT.md`
has example response shapes for every endpoint. Swap in real API calls once the backend URL is confirmed.

Backend local URL: `http://localhost:3001` (when running locally via `npm run dev:backend`).

---

## Key Rules

1. **No game logic in components.** Components render state — never calculate it.
2. **EO scores are hidden during gameplay.** Never display `autonomy`, `innovativeness`, etc. until `/results`.
3. **Disable buttons on click.** Re-enable only on API error.
4. **Mobile-first.** 375px minimum. Check every layout.
5. **TypeScript strict.** Zero `any`. Zero type errors before PR.
6. **No imports from `backend/`.** You only consume the HTTP API.

---

## PR Checklist

Before opening a PR to `feature/v2-engine`:

- [ ] Components work against mock data
- [ ] Layer 0 → play → results full path is walkable
- [ ] Choice buttons disable on click, re-enable on error
- [ ] No EO dimension data exposed during gameplay
- [ ] All layouts responsive at 375px
- [ ] `npm run type-check` — zero errors
- [ ] `npm run test` — all pass

---

## EO Dimensions (What the Radar Chart Displays)

| Dimension | Values |
|---|---|
| Autonomy | 0–10 |
| Innovativeness | 0–10 |
| Risk-Taking | 0–10 |
| Proactiveness | 0–10 |
| Competitive Aggressiveness | 0–10 |

Higher = stronger tendency. The player's profile is unique — two players making different choices end up with different shapes.

---

## Questions & Suggestions

Raise anything that seems off about the API contract or types with me before working around it.
It's faster to align than to unpick a diverged implementation.

For your AI agent: read `frontend/AGENTS.md` — it has the full technical briefing including mock data templates and exact task order.

If you have suggestions also do forward em asap so we can deliberate. Lets's do good work.

---

_v2 | April 2026 | Davis Dey_
