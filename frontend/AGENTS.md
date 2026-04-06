# HatchQuest — Frontend Agent Briefing

> This file is the authoritative context for all AI agent sessions inside `frontend/`.
> Read it fully before writing any code. It supersedes any older docs.

---

## What You Are Building

HatchQuest is a **Entrepreneurship-Oriented Business Simulation with Game-Based Assessment**.
Players respond to scenarios set in **Accra, Ghana**, and the game maps their choices to the
**Lumpkin & Dess EO framework** — 5 dimensions: Autonomy, Innovativeness, Risk-Taking,
Proactiveness, Competitive Aggressiveness.

The EO profile is a **hidden assessment** — players never see it during gameplay.
It is revealed only on the results page at game end.

**Your job:** Build the UI that makes this playable. You are a consumer of the backend API.
No game logic lives in the frontend. Ever.

---

## Architecture Rules (Non-Negotiable)

1. **No game logic in components.** Components render state — they don't calculate it.
2. **Never expose EO dimensions during gameplay.** Only on `/results`.
3. **Disable choice buttons on click.** Re-enable only on API error.
4. **Mobile-first.** Minimum 375px. Everything must be responsive.
5. **TypeScript strict.** No `any`. All types come from `@hatchquest/shared`.
6. **Davis decides architecture. Lois + Ebo implement.** Flag anything structural before building.

---

## Your Scope

You work inside `frontend/` only.

- `frontend/src/app/` — pages and routes
- `frontend/src/components/` — UI components
- `frontend/src/context/` — React context (GameContext)
- `frontend/src/lib/` — utility helpers, API client

Do NOT touch:
- `backend/` — Fastify server (Davis)
- `packages/shared/` — shared types (Davis owns, requires sign-off to change)
- Root `package.json` or workspace config

---

## Getting Set Up

```bash
# Clone the repo
git clone https://github.com/davissekai/hatchquest.git
cd hatchquest

# Install all workspace packages (this sets up @hatchquest/shared)
npm install

# Start frontend dev server
npm run dev:frontend
# → http://localhost:3000

# Type-check only the frontend
cd frontend && npm run type-check
```

**Branch:** Work on `feature/v2-engine`. Do NOT use the stale `frontend` or `packages` remote branches — `feature/v2-engine` has the latest shared types and all backend infrastructure.

For your feature work, branch off `feature/v2-engine`:
```bash
git checkout -b feat/your-feature-name feature/v2-engine
```

PRs go to `feature/v2-engine`, not `develop` or `main`.

---

## Shared Types — Import From `@hatchquest/shared`

All API types are in `packages/shared/src/types/`. Import them — never redefine inline.

```typescript
import type {
  ClientWorldState,
  StartRequest, StartResponse,
  ClassifyRequest, ClassifyResponse,
  ChoiceRequest, ChoiceResponse,
  SessionResponse,
  ResultsResponse,
  ScenarioNode,
  Choice,
  EOProfile,
} from "@hatchquest/shared";
```

---

## The v2 API Contract

Backend runs at `http://localhost:3001` in local dev. Read `docs/API_CONTRACT.md` for the full
reference. Summary:

### Game Flow

```
POST /api/game/start          → { sessionId, layer0Question }
POST /api/game/classify       → { sessionId, layer1NodeId }    ← NEW in v2
POST /api/game/choice (loop)  → { sessionId, clientState, nextNode }
GET  /api/game/results/:id    → { sessionId, eoProfile, clientState, summary }
```

### Endpoint shapes

**POST `/api/game/start`**
```typescript
// Request
{ playerName: string; email: string; password: string }

// Response
{ sessionId: string; layer0Question: string }
```

**POST `/api/game/classify`** — Layer 0 only, runs once
```typescript
// Request
{ sessionId: string; response: string }   // player's free-text answer

// Response
{ sessionId: string; layer1NodeId: string }
```

**POST `/api/game/choice`** — called in a loop until isComplete
```typescript
// Request
{ sessionId: string; nodeId: string; choiceIndex: 0 | 1 | 2 }

// Response
{
  sessionId: string;
  clientState: ClientWorldState;
  nextNode: ScenarioNode | null;   // null when isComplete
}
```

**GET `/api/game/session/:sessionId`** — for reconnects/refreshes
```typescript
// Response
{ sessionId: string; clientState: ClientWorldState; currentNode: ScenarioNode | null }
```

**GET `/api/game/results/:sessionId`** — only when clientState.isComplete = true
```typescript
// Response
{ sessionId: string; eoProfile: EOProfile; clientState: ClientWorldState; summary: string; session: GameSession }
```

### `ScenarioNode` shape (what you render on the play screen)
```typescript
interface ScenarioNode {
  id: string;
  layer: number;
  narrative: string;       // story text (replaces v1 "storyText")
  choices: Choice[];
}

interface Choice {
  index: 0 | 1 | 2;
  text: string;
  tensionHint: string;     // describes the EO tension — show this as a subtitle/hint
}
```

---

## What Exists (Current State)

The visual design system is **solid and usable**. Do not rewrite these:
- `BreathingGrid` — animated background grid
- `RetroTransition` — loading overlay between decisions
- `AnimatedScore` — animated number counter for results
- `RadarChart` — 5-axis EO radar chart (update data source to v2 `EOProfile`)
- `Sidebar`, `ResourceBar`, `NarrativeCard`, `ChoiceButton` — use / update as needed

**What is broken and must be rewritten:**

`GameContext.tsx` — currently wired to v1 API shapes. Full rewrite needed:
- `startGame` expects `{beat, state}` response → v2 returns `{sessionId, layer0Question}`
- No `classifyLayer0` function exists → needed for Layer 0 free-text step
- `makeChoice` sends `choiceId: string` → v2 needs `{sessionId, nodeId, choiceIndex: 0|1|2}`
- `resumeSession` calls `GET /api/game/session?sessionId=...` → v2 is `GET /api/game/session/:sessionId`
- All inline type definitions → replace with imports from `@hatchquest/shared`

---

## Page Routes (What to Build)

### `/` — Landing page
Status: done. Minor: remove the hardcoded UGBS logo URL if it causes issues.

### `/create` — Founder creation form
Status: mostly done. Needs:
- Add `password` field (v2 `StartRequest` requires it — auth not enforced yet but field is required)
- On submit: call `startGame()` → route to `/layer0` (not `/loading`)

### `/layer0` — Layer 0 free-text screen (NEW — does not exist yet)
Build this from scratch:
- Display `layer0Question` from the `startGame` response
- Large textarea for player's free-text answer (no character limit — let them write)
- Submit → call `classifyLayer0()` → route to `/play`
- Show loading state while classifying

### `/play` — Main game loop
Status: exists but wired to v1 state. Update:
- Use `ScenarioNode` from `clientState` context (`node.narrative`, `node.choices[].text`)
- Show `tensionHint` as subtitle text under each choice button
- HUD: show `clientState.capital`, `clientState.reputation`, `clientState.networkStrength`
- Remove `momentumMultiplier` from HUD (not in `ClientWorldState`)
- On choice: POST `/api/game/choice` with `{sessionId, nodeId, choiceIndex}`
- When `nextNode === null` → route to `/results`

### `/results` — EO profile reveal
Status: exists but wired to v1 results. Update:
- Fetch from `GET /api/game/results/:sessionId`
- Display `eoProfile` on the RadarChart (5 dimensions, values 0–10)
- Display `summary` text from the response
- Show final capital from `clientState.capital`

### `/resume` — Reconnect existing session
Status: exists. Update to use `GET /api/game/session/:sessionId` (URL param).

---

## Working Without the Backend

The backend isn't running locally for you — use mock data. Create `frontend/src/lib/mock-api.ts`:

```typescript
// Swap real fetch calls for mocks during dev
// When backend is live, delete this file and update GameContext to use real URLs

export const mockStartResponse: StartResponse = {
  sessionId: "mock-session-001",
  layer0Question: "Describe the business you want to build and the problem it solves in Accra.",
};

export const mockClassifyResponse: ClassifyResponse = {
  sessionId: "mock-session-001",
  layer1NodeId: "L1-node-1",
};

export const mockNode: ScenarioNode = {
  id: "L1-node-1",
  layer: 1,
  narrative: "Three months after launching, your logistics platform has 12 active farmers. A larger competitor has noticed you and is offering your top drivers signing bonuses. Your co-founder thinks you should raise prices now. Your mentor says stay lean.",
  choices: [
    { index: 0, text: "Match the competitor's offer — give your drivers a retention bonus from reserves.", tensionHint: "Capital at risk vs. team loyalty" },
    { index: 1, text: "Ignore the competitor and double down on farmer acquisition — grow faster than they can poach.", tensionHint: "Proactive growth vs. competitive threat" },
    { index: 2, text: "Negotiate with the competitor — explore whether a partnership makes more sense than a fight.", tensionHint: "Collaboration vs. independent control" },
  ],
};
```

---

## Priority Task Order

Build in this order — don't start the next until the current one's tests pass:

1. **Rewrite `GameContext.tsx`** — v2 API shapes, import types from `@hatchquest/shared`, add `classifyLayer0()`. Wire to mock data first.
2. **Build `/layer0` page** — free-text input, submit handler, loading state.
3. **Update `/play` page** — use `ScenarioNode.narrative`, `choices[].tensionHint`, v2 HUD fields.
4. **Update `/results` page** — use `EOProfile` on RadarChart, display `summary`.
5. **Update `/create` page** — add password field, fix routing.
6. **Update `/resume` page** — fix session endpoint URL.
7. **Swap mocks for real API** when backend URL is confirmed.

---

## Verification Before Any PR

```bash
cd frontend
npm run type-check   # zero errors
npm run lint         # zero warnings
npm run test         # all pass
```

Also manually verify at 375px width (mobile).

---

## EO Dimensions Reference

The 5 dimensions the game measures. These are hidden from players during gameplay.
Revealed on `/results` via the radar chart.

| Dimension | What it measures |
|---|---|
| Autonomy | Independent action and execution |
| Innovativeness | Support for new ideas and experimentation |
| Risk-Taking | Bold actions under uncertainty |
| Proactiveness | Opportunity-seeking, forward-looking |
| Competitive Aggressiveness | Direct challenge to competitors |

Each is a float `[0, 10]` in the `EOProfile`.

---

_Frontend briefing — v2 | April 2026 | Davis Dey_
