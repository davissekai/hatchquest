# HatchQuest API Contract

> **This document is locked.** The frontend team builds against this contract exactly as written.
> Do not deviate from the request/response shapes. If you believe a change is needed,
> raise it with the backend lead — do not work around it.

---

## Authentication

Every request to `/api/game/*` must include a Supabase JWT in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

The token is obtained after the player logs in via Supabase Auth. All endpoints return `401` if the token is missing or invalid.

---

## Base Types

These types are the shared language between frontend and backend. Do not redefine them inline.

```typescript
interface GlobalState {
  session: {
    currentNarrativeId: string;
    isStoryComplete: boolean;
  };
  resources: {
    v_capital: number;
    momentumMultiplier: number;
    reputation: number;
    network: number;
  };
  dimensions: {
    autonomy: number;
    innovativeness: number;
    proactiveness: number;
    riskTaking: number;
    competitiveAggressiveness: number;
  };
  flags: {
    hasDebt: boolean;
    hiredTeam: boolean;
    [key: string]: boolean;
  };
  history: ChoiceRecord[];
}

interface ChoiceRecord {
  narrativeId: string;
  choiceId: string;
  capitalBefore: number;
  capitalAfter: number;
  timestamp: number;
}

interface NarrativeBeat {
  id: string;           // e.g. "N_005"
  title: string;
  storyText: string;
  choices: PublicChoice[];
}

interface PublicChoice {
  choiceId: string;     // e.g. "C_05A"
  label: string;
  immediateFeedback: string;
}
```

> **Important:** `GlobalState.dimensions` and EO scores are **never displayed to the player
> during gameplay.** They are hidden diagnostic metrics. Only show them on the results page.

---

## Endpoints

### 1. Start a New Game Session

```
POST /api/game/start
```

Creates a new session for the authenticated player with initial state. Call this when the player clicks "Begin" on the landing page.

**Request body:** none

**Response `200`:**
```typescript
{
  sessionId: string;
  state: GlobalState;        // initial state with v_capital: 10000
  narrative: NarrativeBeat;  // always N_001
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid auth token |
| `409` | Player already has an active incomplete session |

---

### 2. Get Current Session

```
GET /api/game/session
```

Returns the current session state and the narrative beat the player is on. Call this on page load/refresh to restore session.

**Request body:** none

**Response `200`:**
```typescript
{
  sessionId: string;
  state: GlobalState;
  narrative: NarrativeBeat;  // the current beat based on state.session.currentNarrativeId
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid auth token |
| `404` | No active session found for this player |

---

### 3. Submit a Choice

```
POST /api/game/choice
```

The core gameplay endpoint. Submits the player's choice for the current narrative beat. The backend applies the game logic and returns the updated state and next beat.

**Request body:**
```typescript
{
  sessionId: string;
  narrativeId: string;   // must match state.session.currentNarrativeId
  choiceId: string;      // must be a valid choice for that narrativeId
}
```

**Response `200`:**
```typescript
{
  state: GlobalState;        // updated state after applying the choice
  narrative: NarrativeBeat;  // the next beat to render (or null if isStoryComplete = true)
  feedback: string;          // the immediateFeedback string for the chosen option
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | Invalid `choiceId` or `narrativeId` |
| `400` | `narrativeId` does not match the player's current position |
| `401` | Missing or invalid auth token |
| `403` | `sessionId` does not belong to the authenticated player |
| `409` | Choice already submitted for this beat (duplicate submission) |

> **UI rule:** Disable the choice buttons immediately on click. Re-enable only if you receive
> a `4xx` response. Never let the player submit twice for the same beat.

---

### 4. Get Session Results

```
GET /api/game/results/[sessionId]
```

Returns the final state of a completed session. Use this to populate the results/dashboard page.

**Request params:** `sessionId` in the URL path

**Response `200`:**
```typescript
{
  sessionId: string;
  state: GlobalState;    // final state, state.session.isStoryComplete === true
  completedAt: string;   // ISO 8601 timestamp
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid auth token |
| `403` | Session does not belong to the authenticated player |
| `404` | Session not found |
| `409` | Session is not yet complete |

---

## What the Frontend Never Receives

The following data **never appears in any API response.** Do not look for it, do not request it:

- Raw choice impact values (capital delta, dimension deltas, flag mutations)
- The private narrative impact schema
- Other players' session data

---

## Mock Data for Local Development

Until the backend endpoints are live, use this mock to build and test your components:

```typescript
// __mocks__/api.ts

export const MOCK_SESSION_RESPONSE = {
  sessionId: "mock-session-001",
  state: {
    session: { currentNarrativeId: "N_001", isStoryComplete: false },
    resources: { v_capital: 10000, momentumMultiplier: 1.0, reputation: 50, network: 10 },
    dimensions: { autonomy: 0, innovativeness: 0, proactiveness: 0, riskTaking: 0, competitiveAggressiveness: 0 },
    flags: { hasDebt: false, hiredTeam: false },
    history: []
  },
  narrative: {
    id: "N_001",
    title: "Day One",
    storyText: "You've just received your first GHS 10,000 in seed capital. Your university mentor gives you 48 hours to make your first move. The market won't wait.",
    choices: [
      { choiceId: "C_01A", label: "Rent a stall at the Accra Mall and launch immediately.", immediateFeedback: "Bold move. You're in the market before anyone else." },
      { choiceId: "C_01B", label: "Spend two weeks researching competitors first.", immediateFeedback: "Careful. You know your landscape — but so does everyone else now." },
      { choiceId: "C_01C", label: "Partner with a classmate to split costs and risk.", immediateFeedback: "You've halved your exposure. You've also halved your control." }
    ]
  }
};

export const MOCK_CHOICE_RESPONSE = {
  state: {
    session: { currentNarrativeId: "N_002", isStoryComplete: false },
    resources: { v_capital: 8500, momentumMultiplier: 1.1, reputation: 55, network: 12 },
    dimensions: { autonomy: 2, innovativeness: 0, proactiveness: 3, riskTaking: 2, competitiveAggressiveness: 0 },
    flags: { hasDebt: false, hiredTeam: false },
    history: [{ narrativeId: "N_001", choiceId: "C_01A", capitalBefore: 10000, capitalAfter: 8500, timestamp: 1709000000000 }]
  },
  narrative: {
    id: "N_002",
    title: "First Week",
    storyText: "Your stall is up. Foot traffic is decent but not what you hoped. A supplier offers you a bulk discount — take it now or lose the deal.",
    choices: [
      { choiceId: "C_02A", label: "Take the bulk deal. Commit the capital.", immediateFeedback: "All in. Your shelves are full." },
      { choiceId: "C_02B", label: "Decline. Preserve cash for flexibility.", immediateFeedback: "You kept your options open. The supplier moves on." }
    ]
  },
  feedback: "Bold move. You're in the market before anyone else."
};
```

---

## Questions or Discrepancies

If an endpoint behaves differently from this contract during integration, flag it immediately — do not work around it. Raise it with the backend lead so the contract can be updated for both sides.
