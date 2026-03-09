# HatchQuest API Contract

> **This document is locked.** The frontend team builds against this contract exactly as written.
> Do not deviate from the request/response shapes. If you believe a change is needed,
> raise it with the backend lead — do not work around it.

---

## Authentication

Authentication is **not yet implemented.** No token is required. All endpoints are currently open.

This section will be updated when Supabase Auth is integrated.

---

## Base URL

```
https://hatchquest.vercel.app
```

For local development:

```
http://localhost:3000
```

---

## Base Types

These types are the shared language between frontend and backend. Do not redefine them inline.

```typescript
// State returned during gameplay — dimensions are hidden until results
interface GameplayState {
  session: {
    playerId: string;
    currentNarrativeId: string;   // e.g. "beat_00", "beat_01"
    isStoryComplete: boolean;
    history: HistoryEntry[];
  };
  resources: {
    capital: number;              // GHS — starts at 10,000
    reputation: number;           // Scale: 0–100, starts at 50
    network: number;              // Scale: 0–100, starts at 10
    momentumMultiplier: number;   // Starts at 1.0
  };
  flags: {
    hasDebt: boolean;
    hiredTeam: boolean;
    [key: string]: boolean;       // Dynamic venture flags e.g. venture_threads
  };
}

// Full state — only returned on results page
interface FinalState extends GameplayState {
  dimensions: {
    autonomy: number;
    innovativeness: number;
    proactiveness: number;
    riskTaking: number;
    competitiveAggressiveness: number;
  };
}

interface HistoryEntry {
  narrativeId: string;
  choiceId: string;
}

interface Beat {
  id: string;               // e.g. "beat_00", "beat_01"
  round: number;            // 0 = preamble, 1–3 = game rounds
  title: string;
  storyText: string;
  orderIndex: number;
  choices: Choice[];
}

interface Choice {
  id: string;               // e.g. "beat_01_a"
  beatId: string;
  label: string;
  immediateFeedback: string;
  nextBeatId: string | null; // null = default linear progression
}
```

> **Rule:** `FinalState.dimensions` and EO scores are **never displayed during gameplay.**
> Only reveal them on the results page.

---

## Endpoints

### 1. Start a New Game Session

```
POST /api/game/start
```

Creates a new player (or finds existing by email) and starts a fresh game session.
Call this when the player submits the landing page form.

**Request body:**
```typescript
{
  email: string;   // player's email — used to upsert the player record
  name: string;    // display name
}
```

**Response `200`:**
```typescript
{
  sessionId: string;    // UUID — store this, needed for all subsequent calls
  beat: Beat;           // always beat_00 (the preamble)
  state: GameplayState; // initial state: capital 10000, reputation 50, network 10
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | `email` or `name` missing or not a string |
| `404` | Preamble beat (beat_00) not found in DB |
| `500` | Internal server error |

---

### 2. Get Current Session

```
GET /api/game/session?sessionId=<sessionId>
```

Returns the current session state and the beat the player is on.
Call this on page load or refresh to restore an in-progress session.

**Query params:**
| Param | Type | Required |
|-------|------|----------|
| `sessionId` | string (UUID) | yes |

**Response `200`:**
```typescript
{
  beat: Beat;           // the current beat based on state.session.currentNarrativeId
  state: GameplayState;
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | `sessionId` query param missing |
| `404` | Session not found |
| `404` | Narrative beat not found |
| `500` | Internal server error |

---

### 3. Submit a Choice

```
POST /api/game/choice
```

The core gameplay endpoint. Submits the player's choice for the current beat.
The backend applies game logic and returns the updated state and next beat.

**Request body:**
```typescript
{
  sessionId: string;  // UUID from /start
  choiceId: string;   // e.g. "beat_01_a" — must be a valid choice ID
}
```

**Response `200`:**
```typescript
{
  nextBeat: Beat;           // the next beat to render
  updatedState: GameplayState;
  feedback: string;         // immediateFeedback text for the chosen option
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | `sessionId` or `choiceId` missing |
| `404` | Session not found |
| `404` | Choice not found |
| `404` | Next beat not found |
| `409` | Session is already complete |
| `500` | Internal server error |

> **UI rule:** Disable choice buttons immediately on click. Re-enable only if you receive
> a `4xx` response. Never allow double submission.

---

### 4. Get Session Results

```
GET /api/game/results?sessionId=<sessionId>
```

Returns the final state of a completed session. Only available after all 30 beats are played.
Use this to populate the results page.

**Query params:**
| Param | Type | Required |
|-------|------|----------|
| `sessionId` | string (UUID) | yes |

**Response `200`:**
```typescript
{
  finalState: FinalState;     // full state including dimensions — reveal EO scores here
  acumenScore: number | null; // composite score — may be null if not yet calculated
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | `sessionId` missing or session not yet complete |
| `404` | Session not found |
| `500` | Internal server error |

---

## What the Frontend Never Receives

The following data **never appears in any API response:**

- Raw choice impact values (capital delta, dimension deltas, flag mutations)
- `GameplayState.dimensions` — stripped from all responses except `/results`
- Other players' session data

---

## Mock Data for Local Development

Use this mock to build and test components before hitting the live API.

```typescript
// __mocks__/api.ts

export const MOCK_START_RESPONSE = {
  sessionId: "mock-session-001",
  beat: {
    id: "beat_00",
    round: 0,
    title: "The GHS 10,000 Moment",
    storyText: "Your room is small but your screen is bright. GHS 10,000 sits in your mobile money account — every pesewa earned through late nights, odd jobs, and stubborn saving.\n\nThe city outside your window is already moving. Accra doesn't pause for anyone. You've had this dream for a while. Now the money is real, and there are no more excuses.\n\nThe question isn't whether you're ready. The question is: what are you building?",
    orderIndex: 0,
    choices: [
      {
        id: "beat_01_a",
        beatId: "beat_00",
        label: "Urban Threads — The streets need better style. I'm giving it to them.",
        immediateFeedback: "Fashion and hustle. You're betting on your eye for style and the city's appetite for it.",
        nextBeatId: "beat_02"
      },
      {
        id: "beat_01_b",
        beatId: "beat_00",
        label: "Campus Kitchen — The food situation is a crime. I'm fixing it.",
        immediateFeedback: "Food is the most honest business there is. People eat every day.",
        nextBeatId: "beat_02"
      },
      {
        id: "beat_01_c",
        beatId: "beat_00",
        label: "Digital Solve — Local businesses are stuck offline. I'm dragging them forward.",
        immediateFeedback: "You're selling something most people know they need but don't know how to get.",
        nextBeatId: "beat_02"
      }
    ]
  },
  state: {
    session: {
      playerId: "mock-player-001",
      currentNarrativeId: "beat_00",
      isStoryComplete: false,
      history: []
    },
    resources: {
      capital: 10000,
      reputation: 50,
      network: 10,
      momentumMultiplier: 1.0
    },
    flags: { hasDebt: false, hiredTeam: false }
  }
};

export const MOCK_CHOICE_RESPONSE = {
  nextBeat: {
    id: "beat_02",
    round: 1,
    title: "All In or Play It Safe?",
    storyText: "You've told two people about your venture. One hyped you up. The other asked if you had a 'backup plan.' Classic.\n\nNow comes your first real test: how do you deploy your capital?",
    orderIndex: 2,
    choices: [
      {
        id: "beat_02_a",
        beatId: "beat_02",
        label: "Go big. Spend GHS 4,000 upfront. Make a statement.",
        immediateFeedback: "Bold move. You're putting real skin in the game early.",
        nextBeatId: "beat_03"
      },
      {
        id: "beat_02_b",
        beatId: "beat_02",
        label: "Start lean. Spend GHS 1,000, test fast, learn faster.",
        immediateFeedback: "Smart. You're buying information before you buy inventory.",
        nextBeatId: "beat_03"
      }
    ]
  },
  updatedState: {
    session: {
      playerId: "mock-player-001",
      currentNarrativeId: "beat_02",
      isStoryComplete: false,
      history: [{ narrativeId: "beat_00", choiceId: "beat_01_a" }]
    },
    resources: {
      capital: 10000,
      reputation: 50,
      network: 10,
      momentumMultiplier: 1.0
    },
    flags: { hasDebt: false, hiredTeam: false, venture_threads: true }
  },
  feedback: "Fashion and hustle. You're betting on your eye for style and the city's appetite for it."
};

export const MOCK_RESULTS_RESPONSE = {
  finalState: {
    session: {
      playerId: "mock-player-001",
      currentNarrativeId: "beat_30",
      isStoryComplete: true,
      history: []
    },
    resources: {
      capital: 12500,
      reputation: 68,
      network: 24,
      momentumMultiplier: 1.3
    },
    dimensions: {
      autonomy: 14,
      innovativeness: 11,
      proactiveness: 16,
      riskTaking: 13,
      competitiveAggressiveness: 9
    },
    flags: { hasDebt: false, hiredTeam: true, venture_threads: true }
  },
  acumenScore: 72.4
};
```

---

## Questions or Discrepancies

If an endpoint behaves differently from this contract during integration, flag it immediately.
Do not work around it — raise it with the backend lead so both sides stay in sync.
