# HatchQuest — Frontend Agent Briefing

> Authoritative context for all AI agent sessions inside `frontend/`.
> Read this fully before writing any code.

---

## What You Are Building

HatchQuest is a **Game-Based Assessment of Entrepreneurial Orientation**.
Players respond to business scenarios set in **Accra, Ghana**, making choices that reveal their
entrepreneurial mindset across 5 dimensions (Lumpkin & Dess EO framework):
Autonomy, Innovativeness, Risk-Taking, Proactiveness, Competitive Aggressiveness.

The EO profile is a **hidden assessment** — players never see scores during gameplay.
It is revealed only on the results page at game end.

**Your job:** Build the UI. You are a consumer of the backend API. No game logic in the frontend. Ever.

---

## Current Backend State

The backend is **fully built and deployed** on Railway:

```
https://hatchquestbackend-production.up.railway.app
```

Routes available:
```
POST /api/game/start           → start session, get Layer 0 preamble + Q1
POST /api/game/classify-q1     → submit Q1 free-text → get AI-generated Q2 prompt
POST /api/game/classify-q2     → submit Q2 free-text → EO classified, Layer 1 assigned
GET  /api/game/session/:id     → get current session state + current scenario node
POST /api/game/choice          → submit choice (choiceIndex 0|1|2) → get next node
GET  /api/game/results/:id     → get EO profile + summary (game-complete only)
```

Full request/response shapes: `docs/API_CONTRACT.md`.

Key facts about the backend:
- Auth is stubbed — password field accepted but not validated. `sessionId` is the session key.
- Layer 0 is a **two-step free-text flow** (Q1 → Q2), not a single classify call. The old `/classify` route exists for backward compat only — do not use it.
- Every scenario has exactly **3 choices** — not 9, not variable. `choiceIndex` is `0`, `1`, or `2`.
- `nextNode` is `null` when the game ends (5 turns complete).
- `eoProfile` is never in `clientState` during gameplay — only in `/results` response.
- `clientState.playerBusinessName` is the player's Q1 text — use it as the HUD business label.

---

## Architecture Rules (Non-Negotiable)

1. **No game logic in components.** Components render state — they don't calculate it.
2. **Never expose EO dimensions during gameplay.** Only on `/results`.
3. **Disable choice buttons on click.** Re-enable only on API error.
4. **Mobile-first.** Minimum 375px. Everything responsive.
5. **TypeScript strict.** No `any`. All types from `@hatchquest/shared`.
6. **Davis decides architecture.** Flag anything structural before building.

---

## Your Scope

Work inside `frontend/` only.

```
frontend/src/app/           ← pages and routes
frontend/src/components/    ← UI components
frontend/src/context/       ← React context (GameContext)
frontend/src/lib/           ← API client, helpers
```

**Do NOT touch:**
- `backend/` — Fastify server, Davis only
- `packages/shared/` — shared types, Davis sign-off required for any change
- Root `package.json` or workspace config files

---

## Development — Getting Set Up

```bash
# Install all workspace packages from repo root
npm install

# Start frontend dev server
npm run dev --workspace=frontend
# → http://localhost:3000

# Type-check frontend only
npm run type-check --workspace=frontend

# Run frontend tests
npm test --workspace=frontend
```

**Branch:** Branch off `develop`:
```bash
git checkout -b feat/your-feature-name develop
```

PRs go to `develop`. Do not PR to `main` directly.

---

## TDD — Tests First, Always

**Write the test before writing the component or function.**

The workflow for every new piece of UI:

1. **RED** — Write a failing test that describes the behavior.
2. **GREEN** — Write the minimum implementation to pass it.
3. **REFACTOR** — Clean up without breaking the test.

Test framework: **Vitest + React Testing Library**.

Good tests:
- Test what the user sees and does, not implementation details
- Test API call behavior (mock `fetch`, assert correct URL and body)
- Test conditional rendering (loading states, error states, null `nextNode`)
- Test that choice buttons are disabled while a request is in flight

Bad tests:
- Testing that a function exists
- Testing that a component renders without crashing (with no assertions)
- Testing implementation internals (state variable names, internal functions)

Every screen should have tests for:
- Happy path (success)
- Loading state
- API error (400, 404, 409, 500)
- Edge cases (null `currentNode`, null `nextNode`, etc.)

---

## Verification Gate

Run before raising any PR. All three must pass — no exceptions.

```bash
# From the frontend directory or workspace root:
npm run type-check --workspace=frontend   # zero errors
npm run lint --workspace=frontend         # zero warnings
npm test --workspace=frontend             # all pass
```

Code is not ready until all three pass. Do not submit a PR with failing checks.

Also manually verify at **375px width** (mobile) before declaring any screen done.

---

## Shared Types — Import From `@hatchquest/shared`

Never redefine types inline. Import from shared:

```typescript
import type {
  ClientWorldState,
  StartRequest, StartResponse,
  ClassifyQ1Request, ClassifyQ1Response,
  ClassifyQ2Request, ClassifyQ2Response,
  ChoiceRequest, ChoiceResponse,
  SessionResponse,
  ResultsResponse,
  ScenarioNode,
  Choice,
  EOProfile,
} from "@hatchquest/shared";
```

---

## Existing Components — Do Not Rewrite

These are solid and reusable:

| Component | Purpose |
|---|---|
| `BreathingGrid` | Animated background grid |
| `RetroTransition` | Loading overlay between decisions |
| `AnimatedScore` | Animated number counter |
| `RadarChart` | 5-axis EO radar chart (update data source to v2 `EOProfile`) |
| `Sidebar`, `ResourceBar` | HUD layout |
| `NarrativeCard` | Story text container |
| `ChoiceButton` | Single choice button |

---

## Screens to Build

### `/` — Landing page
**Status:** Done. No changes needed unless design review flags issues.

---

### `/create` — Auth / Register
**Status:** Exists, needs fixes.

- Fields: player name, email, password.
- On submit → `POST /api/game/start`.
- On success: save `sessionId` to localStorage, navigate to `/layer0` passing `preamble` and `layer0Question`.

Tests to write:
- Renders all three fields
- Disables submit while loading
- Saves sessionId to localStorage on success
- Shows error message on 400

---

### `/layer0` — Layer 0 free-text (two-step) ⬅ BUILD THIS
**Status:** Does not exist. Build from scratch.

**Step 1 — Q1:**
- Full-viewport `preamble` paragraph (narrative world intro from `/start` response).
- Below: `layer0Question` as heading.
- Large `<textarea>` — no character limit, no multiple choice.
- Submit → `POST /classify-q1`.
- Show loading state during call.
- On success: store `q2Prompt`, switch to Q2 UI state.

**Step 2 — Q2:**
- Display `q2Prompt` (AI-generated, personalised to their Q1 answer).
- Large `<textarea>`.
- Submit → `POST /classify-q2`.
- Show "Reading your story..." animation during call.
- On success → `GET /session/:sessionId` once, then navigate to `/play`.

Tests to write:
- Step 1: preamble visible, Q1 prompt visible, textarea present
- Step 1: submit calls `/classify-q1` with correct body
- Step 1: transitions to step 2 on success, q2Prompt visible
- Step 2: submit calls `/classify-q2` with correct body
- Step 2: loading state visible during call
- Step 2: navigates to `/play` after classify-q2 success + session fetch

---

### `/play` — Scenario screen (Layers 1–5)
**Status:** Exists but wired to v1 shapes. Rewrite the API integration.

- `currentNode.narrative` — full story paragraph.
- Three `ChoiceButton` components. Each shows:
  - `choice.text` — the action.
  - `choice.tensionHint` — subtitle hint below the text.
- HUD: `capital`, `revenue`, `debt`, `reputation`, `networkStrength`, `turnsElapsed`, `playerBusinessName`.
- On click:
  1. Disable all buttons immediately.
  2. `POST /choice` → `{ sessionId, nodeId: currentNode.id, choiceIndex }`.
  3. Show `RetroTransition`.
  4. Update HUD from `clientState`.
  5. If `nextNode !== null`: render new scenario.
  6. If `nextNode === null`: navigate to `/game-complete`.
- Re-enable buttons only on API error.

Tests to write:
- Renders `narrative` and 3 choices
- Renders `tensionHint` under each choice
- Disables buttons on click
- Calls `/choice` with correct `nodeId` and `choiceIndex`
- Updates HUD after response
- Navigates to `/game-complete` when `nextNode === null`
- Re-enables buttons on API error

---

### `/game-complete` — Ending transition ⬅ BUILD THIS
**Status:** Does not exist.

- "Your story is complete. Calculating your entrepreneurial profile..."
- Brief animation / pause.
- Auto-navigate to `/results` after 2–3 seconds.

Tests to write:
- Renders completion message
- Navigates to `/results` after delay

---

### `/results` — EO profile reveal
**Status:** Exists but wired to v1. Update.

- `GET /results/:sessionId`.
- Radar chart from `eoProfile` (5 axes, values 0–10).
- `summary` paragraph.
- Final `clientState.capital` as headline stat.
- CTA: share / start again.

Tests to write:
- Calls correct endpoint on mount
- Renders radar chart with 5 data points
- Renders `summary` text
- Renders final capital

---

### `/profile` — Player profile ⬅ BUILD THIS
**Status:** Does not exist. No dedicated backend endpoint.

- If session complete: pull from `GET /results/:sessionId`. Show EO profile card + summary.
- If session in progress: show current `clientState` stats from localStorage.
- If no session: redirect to `/`.

Tests to write:
- Redirects to `/` when no session in localStorage
- Shows EO card when session is complete
- Shows in-progress stats when session is active

---

### Session Resume (on every app load)
**Status:** Partial. Update to use correct endpoint format.

On app load, if `sessionId` in localStorage:
- `GET /session/:sessionId` (URL param, not query string)
  - `isComplete === true` → `/results`
  - `currentNode !== null` → `/play`
  - `currentNode === null`, `layer === 0` → `/layer0`
- If `404` → clear localStorage, redirect to `/`

---

## GameContext Rewrite

`GameContext.tsx` needs a full rewrite. Current version is wired to v1 shapes.

The new context must expose:
```typescript
interface GameContext {
  sessionId: string | null;
  clientState: ClientWorldState | null;
  currentNode: ScenarioNode | null;

  // Actions
  startGame: (playerName: string, email: string, password: string) => Promise<void>;
  submitQ1: (q1Response: string) => Promise<string>;        // returns q2Prompt
  submitQ2: (q2Response: string) => Promise<void>;          // triggers classification
  makeChoice: (choiceIndex: 0 | 1 | 2) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
}
```

Wire to mock data first. Once verified, swap to real API calls.

---

## Mock Data (for dev without backend)

```typescript
// frontend/src/lib/mock-api.ts
import type { StartResponse, ClassifyQ1Response, ClassifyQ2Response, SessionResponse, ScenarioNode } from "@hatchquest/shared";

export const mockStartResponse: StartResponse = {
  sessionId: "mock-session-001",
  preamble: "Accra, 2026. The city hums with restless energy — mobile money has rewired commerce, the streets are dense with ambition. You have an idea, some savings, and a phone. Every founder here started the same way. What you do next is entirely up to you.",
  layer0Question: "Describe the business you want to build and the problem it solves. What makes you the right person to build it?",
};

export const mockQ1Response: ClassifyQ1Response = {
  sessionId: "mock-session-001",
  q2Prompt: "You mentioned building a logistics platform. What's the biggest obstacle you expect in your first 90 days, and how would you respond to it?",
};

export const mockQ2Response: ClassifyQ2Response = {
  sessionId: "mock-session-001",
  layer1NodeId: "L1-node-1",
};

export const mockNode: ScenarioNode = {
  id: "L1-node-1",
  layer: 1,
  narrative: "It is your third week. A distributor offers a bulk order — but the quantity exceeds your current capacity. Fulfilling it means stretching your capital thin and hiring help you cannot yet afford. Declining means losing the opportunity to someone else.",
  choices: [
    { index: 0, text: "Take the deal. Stretch your capital, hire temporary help, deliver on the deadline no matter the cost.", tensionHint: "Speed vs. financial stability" },
    { index: 1, text: "Negotiate a smaller initial order that fits your current capacity. Prove yourself first, scale later.", tensionHint: "Opportunity vs. risk management" },
    { index: 2, text: "Decline the bulk order and focus on building your local customer base directly.", tensionHint: "Growth ambition vs. disciplined restraint" },
  ],
};
```

Delete the mock file and swap for real API calls when backend integration is confirmed.

---

## Priority Build Order

Do not start the next until the current one's tests pass.

1. **Rewrite `GameContext.tsx`** — v2 API shapes, import from `@hatchquest/shared`, add `submitQ1` and `submitQ2`. Wire to mocks first.
2. **Build `/layer0`** — two-step Q1→Q2 flow, loading states, transition.
3. **Update `/play`** — narrative, choice buttons with tensionHint, HUD with v2 fields, choice submission.
4. **Build `/game-complete`** — simple screen, auto-navigate to results.
5. **Update `/results`** — `EOProfile` on RadarChart, `summary` text, final capital.
6. **Update `/create`** — fix routing to `/layer0`, ensure all fields present.
7. **Build `/profile`** — session-aware EO card or in-progress stats.
8. **Fix session resume** — correct endpoint format, routing logic.
9. **Swap mocks for real API** — update base URL in API client, delete mock file.

---

## EO Dimensions (for the results radar chart)

| Key | Label | Description |
|---|---|---|
| `autonomy` | Autonomy | Independent action and execution |
| `innovativeness` | Innovativeness | New ideas and experimentation |
| `riskTaking` | Risk-Taking | Bold action under uncertainty |
| `proactiveness` | Proactiveness | Opportunity-seeking, forward-looking |
| `competitiveAggressiveness` | Competitive Aggressiveness | Direct challenge to competitors |

All values are floats in `[0, 10]`. Never show these labels during gameplay — only on `/results`.

---

_Frontend briefing — v2 | April 2026 | Davis Dey_
