# HatchQuest v2 — Frontend API Contract

> Source of truth for all frontend ↔ backend communication.
> All types live in `packages/shared/src/types/api.ts` — import them, never redefine.

---

## Base URL

| Environment | URL |
|---|---|
| Local dev | `http://localhost:3001` |
| Production | `https://hatchquestbackend-production.up.railway.app` |

All routes are prefixed `/api/game/`.

---

## Authentication

Not yet implemented. `/start` accepts a `password` field but does not validate or store it.
All session continuity uses `sessionId` (UUID returned by `/start`). No tokens required.

---

## Game Flow Overview

```
[Landing] → [Auth] → [Layer 0 Q1] → [Layer 0 Q2] → [Classifying...]
         → [Scenario ×5] → [Game Complete] → [Results]
```

| Screen | Route | API Call |
|---|---|---|
| Landing | `/` | none |
| Auth / Register | `/create` | `POST /start` |
| Layer 0 — Q1 | `/layer0` (step 1) | `POST /classify-q1` |
| Layer 0 — Q2 | `/layer0` (step 2) | `POST /classify-q2` |
| Classifying transition | overlay | `GET /session/:id` |
| Scenario | `/play` | `POST /choice` (loop) |
| Game complete | overlay | none |
| Results | `/results` | `GET /results/:id` |
| Profile | `/profile` | `GET /results/:id` (if complete) |
| Session resume | on app load | `GET /session/:id` |

---

## Endpoints

### `POST /api/game/start`

Start a new session. Called from the Auth/Register screen.

**Request**
```json
{
  "playerName": "Ama Owusu",
  "email": "ama@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "preamble": "Accra, 2026. The city hums with restless energy — mobile money has rewired commerce, the streets are dense with ambition. You have an idea, some savings, and a phone. Every founder here started the same way. What you do next is entirely up to you.",
  "layer0Question": "Describe the business you want to build and the problem it solves. What makes you the right person to build it?"
}
```

- Save `sessionId` to localStorage immediately on success.
- Display `preamble` on the Layer 0 Q1 screen — it fills the first viewport.
- `layer0Question` is the Q1 prompt shown below the preamble.

**Errors**
| Code | Reason |
|---|---|
| 400 | Missing or invalid playerName, email, or password |

---

### `POST /api/game/classify-q1`

Submit the player's first free-text answer (Layer 0, step 1).
Backend stores the response and returns an AI-generated follow-up question.

**Request**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "q1Response": "I want to build a cold-chain logistics platform connecting smallholder farmers to urban markets in Accra. I grew up in a farming family and watched produce rot because there was no way to move it fast enough."
}
```

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "q2Prompt": "You mentioned cold-chain logistics for smallholder farmers. What's the biggest obstacle you expect in your first 90 days, and how would you respond to it?"
}
```

- `q2Prompt` is personalised to the player's Q1 answer — display it as-is.
- Transition to the Q2 input screen on success.

**Errors**
| Code | Reason |
|---|---|
| 400 | Missing sessionId or q1Response |
| 404 | Session not found |
| 409 | Session already classified (Q2 already submitted) |

---

### `POST /api/game/classify-q2`

Submit the player's second free-text answer (Layer 0, step 2).
Backend classifies both responses to determine EO poles → assigns the Layer 1 scenario.

**Request**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "q2Response": "Biggest obstacle is trust — farmers won't hand over their produce to someone they don't know. I'd start by partnering with one community leader and doing the first 10 deliveries myself, no truck."
}
```

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "layer1NodeId": "L1-node-2"
}
```

- After success: show "Reading your story..." loading animation.
- Then call `GET /session/:sessionId` once to fetch `currentNode`.
- Navigate to `/play` once `currentNode` is available.
- `layer1NodeId` is informational — treat `GET /session` as the source of truth.

**Errors**
| Code | Reason |
|---|---|
| 400 | Missing sessionId or q2Response; or Q1 was never submitted |
| 404 | Session not found |
| 409 | Session already classified |

---

### `GET /api/game/session/:sessionId`

Fetch current session state. Use for: loading the first scenario after Q2, reconnects, and page refreshes.

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "clientState": {
    "capital": 10000,
    "monthlyBurn": 1200,
    "revenue": 0,
    "debt": 0,
    "reputation": 0,
    "networkStrength": 0,
    "layer": 1,
    "turnsElapsed": 0,
    "isComplete": false,
    "playerBusinessName": "I want to build a cold-chain logistics platform...",
    "employeeCount": 0,
    "businessFormality": "unregistered",
    "hasBackupPower": false,
    "hasPremises": false,
    "susuMember": false,
    "mentorAccess": false
  },
  "currentNode": {
    "id": "L1-node-2",
    "layer": 1,
    "narrative": "A well-connected mentor at a networking event offers to introduce you to a potential investor. But the meeting is tomorrow, your pitch is not ready, and the investor has a reputation for being unforgiving with unprepared founders.",
    "choices": [
      { "index": 0, "text": "Take the meeting. Stay up all night preparing.", "tensionHint": "Seizing opportunity vs. presenting your best self" },
      { "index": 1, "text": "Ask the mentor to delay the introduction by one week.", "tensionHint": "Preparation vs. momentum" },
      { "index": 2, "text": "Decline the introduction entirely.", "tensionHint": "Independence vs. leveraging help" }
    ]
  }
}
```

- `currentNode` is `null` before `/classify-q2` has completed.
- If `clientState.isComplete === true` on resume, redirect to `/results`.
- Do not poll — call once after classify-q2, or on page load for reconnect.

**Errors**
| Code | Reason |
|---|---|
| 404 | Session not found |

---

### `POST /api/game/choice`

Submit the player's choice for the current scenario. Called in a loop (one call per layer, 5 total).

**Request**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "nodeId": "L1-node-2",
  "choiceIndex": 0
}
```

- `nodeId` must exactly match `currentNode.id` from the previous response.
  The backend rejects mismatches to prevent double-submit and state drift.
- `choiceIndex` is `0`, `1`, or `2` — the array index, not the choice text.
- Disable all choice buttons immediately on click. Re-enable only on API error.

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "clientState": {
    "capital": 9600,
    "monthlyBurn": 1200,
    "revenue": 0,
    "debt": 0,
    "reputation": 8,
    "networkStrength": 15,
    "layer": 2,
    "turnsElapsed": 1,
    "isComplete": false,
    "playerBusinessName": "I want to build a cold-chain logistics platform...",
    "employeeCount": 0,
    "businessFormality": "unregistered",
    "hasBackupPower": false,
    "hasPremises": false,
    "susuMember": false,
    "mentorAccess": false
  },
  "nextNode": {
    "id": "L2-node-4",
    "layer": 2,
    "narrative": "Six months in. Your investor meeting went better than expected...",
    "choices": [
      { "index": 0, "text": "...", "tensionHint": "..." },
      { "index": 1, "text": "...", "tensionHint": "..." },
      { "index": 2, "text": "...", "tensionHint": "..." }
    ]
  }
}
```

- `nextNode` is `null` when `clientState.isComplete === true`.
  When `null`, navigate to the game-complete screen then `/results`.
- Update the HUD from `clientState` after each successful choice.
- `playerBusinessName` is derived from the player's Q1 response — use as the business label in the HUD.

**Errors**
| Code | Reason |
|---|---|
| 400 | Invalid choiceIndex (not 0/1/2), missing fields, or stale nodeId |
| 404 | Session not found |
| 409 | Session already complete |

---

### `GET /api/game/results/:sessionId`

Fetch the final EO profile and summary. Only available after `isComplete === true`.

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "eoProfile": {
    "autonomy": 4.0,
    "innovativeness": 5.5,
    "riskTaking": 8.0,
    "proactiveness": 7.5,
    "competitiveAggressiveness": 3.0
  },
  "clientState": { "...see ClientWorldState above..." },
  "summary": "Your entrepreneurial profile shows a willingness to commit resources to bold, uncertain ventures, with riskTaking scoring 8.0 out of 10. At the same time, your 3.0 score suggests a measured, relationship-oriented competitive style. This is a strong signal — you consistently favored bold action in this dimension."
}
```

- All `eoProfile` values are floats in `[0, 10]`.
- Display on the radar chart (5 axes).
- `summary` is 2–3 sentences — display as-is.
- `clientState.capital` is the player's final capital — show as headline stat.

**Errors**
| Code | Reason |
|---|---|
| 404 | Session not found |
| 409 | Game not yet complete |

---

## `ClientWorldState` Reference

What the frontend receives during gameplay. **EO profile is absent — hidden until `/results`.**

| Field | Type | Notes |
|---|---|---|
| `capital` | `number` | GHS — primary financial metric |
| `monthlyBurn` | `number` | GHS/month — outflows |
| `revenue` | `number` | GHS/month — inflows |
| `debt` | `number` | GHS — accumulated debt |
| `reputation` | `number` | `[0–100]` — market credibility |
| `networkStrength` | `number` | `[0–100]` — connections and referrals |
| `layer` | `number` | `[0–5]` — current game layer |
| `turnsElapsed` | `number` | Total choices made (max 5) |
| `isComplete` | `boolean` | `true` at game end |
| `playerBusinessName` | `string \| null` | From Q1 response — use as HUD business label |
| `employeeCount` | `number` | |
| `businessFormality` | `"unregistered" \| "soleProprietorship" \| "limitedCompany"` | |
| `hasBackupPower` | `boolean` | Dumsor resilience |
| `hasPremises` | `boolean` | Physical space vs. home-based |
| `susuMember` | `boolean` | Rotating savings group |
| `mentorAccess` | `boolean` | GEA/NEIP/BAC access |

---

## Screen-by-Screen Build Guide

### Landing (`/`)
- Static page. No API call.
- CTA button → `/create`.

### Auth / Register (`/create`)
- Fields: player name, email, password.
- On submit → `POST /start`.
- On success: save `sessionId` to localStorage, navigate to `/layer0` carrying `preamble` and `layer0Question` in state.

### Layer 0 — Q1 (`/layer0`, step 1)
- Display `preamble` (full-viewport narrative paragraph).
- Below the preamble: show `layer0Question` as a prompt heading.
- Large `<textarea>` — no character limit, no multiple choice.
- Submit → `POST /classify-q1`.
- Show loading state during the call.
- On success: transition to Q2 step (same route, different UI state).

### Layer 0 — Q2 (`/layer0`, step 2)
- Display `q2Prompt` (AI-generated, personalised to Q1 answer).
- Large `<textarea>` — no character limit.
- Submit → `POST /classify-q2`.
- Show "Reading your story..." loading animation.
- On success: call `GET /session/:sessionId` once, then navigate to `/play`.

### Classifying Transition
- Full-screen loading overlay (`RetroTransition` or similar).
- One `GET /session/:sessionId` call.
- Once `currentNode !== null`, fade into the scenario screen.

### Scenario Screen (`/play`, Layers 1–5)
- Display `currentNode.narrative` — full story paragraph.
- Three choice buttons. Each shows:
  - `choice.text` — the action label.
  - `choice.tensionHint` — shown as a subtitle/hint below the text.
- HUD shows: `capital`, `revenue`, `debt`, `reputation`, `networkStrength`, `turnsElapsed`, `playerBusinessName`.
- On choice click:
  1. Disable all three buttons immediately.
  2. `POST /choice` → `{ sessionId, nodeId: currentNode.id, choiceIndex }`.
  3. Show inter-decision transition animation.
  4. Update HUD from `clientState`.
  5. If `nextNode !== null`: render new scenario.
  6. If `nextNode === null`: navigate to game-complete screen.
- Re-enable buttons only on API error.

### Inter-Decision Transition
- Brief animation between decisions — no API call.
- Use `RetroTransition` component.

### Game Complete Screen
- Shown when `nextNode === null` / `isComplete === true`.
- "Your story is complete. Calculating your entrepreneurial profile..."
- Auto-navigate to `/results` after 2–3 seconds.

### Results (`/results`)
- `GET /results/:sessionId`.
- Radar chart using `eoProfile` (5 axes, values 0–10).
- `summary` paragraph.
- Final `clientState.capital` as headline stat.
- CTA: share / start again.

### Profile (`/profile`)
- No dedicated backend endpoint.
- If session is complete: pull from `GET /results/:sessionId` — display EO profile card.
- If session in progress: display `clientState` from localStorage.
- If no session: redirect to `/`.

### Session Resume (on every app load)
- Check localStorage for `sessionId`.
- If found → `GET /session/:sessionId`.
  - `isComplete === true` → `/results`
  - `currentNode !== null` → `/play`
  - `currentNode === null` and `layer === 0` → `/layer0` (classification incomplete)
- If `404` → clear localStorage, redirect to `/`.

---

## Error Handling

Handle these consistently across all API calls:

| Scenario | UX behaviour |
|---|---|
| Network error / timeout | Show retry prompt. Do not lose `sessionId`. |
| 400 validation error | Show inline error near the relevant field. |
| 404 session not found | Clear localStorage, redirect to `/`. |
| 409 already complete | Redirect to `/results`. |
| 409 already classified | Skip Layer 0, call `GET /session` and continue. |
| 500 server error | "Something went wrong. Try again." — never show internal error text. |

---

## Types — Import From `@hatchquest/shared`

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

_v2 contract — April 2026 | Davis Dey_
