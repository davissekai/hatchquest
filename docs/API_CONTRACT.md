# HatchQuest v2 — API Contract

> This document is the source of truth for all frontend ↔ backend communication.
> All types are defined in `packages/shared/src/types/api.ts` and exported from `packages/shared`.
> Frontend imports types directly — do not redefine them.

---

## Base URL

| Environment | URL |
|---|---|
| Local dev | `http://localhost:3001` |
| Production | Railway (TBD) |

---

## Authentication

Auth is not yet implemented. `/start` accepts `password` but does not validate or store it. All requests use `sessionId` for session continuity — no token required for now.

---

## Endpoints

### POST `/api/game/start`

Start a new game session. Returns the Layer 0 question for the player to answer.

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
  "layer0Question": "Describe the business you want to build and the problem it solves."
}
```

**Errors**
| Code | Reason |
|---|---|
| 400 | Missing or invalid playerName, email, or password |

---

### POST `/api/game/classify`

Submit the player's Layer 0 free-text response. The backend classifies it to determine which Layer 1 scenario the player enters.

> The EO pole distribution is computed server-side and never sent to the client.

**Request**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "response": "I want to build a logistics platform connecting smallholder farmers to urban markets in Accra..."
}
```

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "layer1NodeId": "L1-node-1"
}
```

**Errors**
| Code | Reason |
|---|---|
| 400 | Missing response or sessionId |
| 404 | Session not found |

---

### POST `/api/game/choice`

Submit a player's choice for the current scenario node.

**Request**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "nodeId": "L1-node-1",
  "choiceIndex": 1
}
```

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "clientState": {
    "capital": 10000,
    "monthlyBurn": 1200,
    "revenue": 1500,
    "debt": 0,
    "reputation": 3,
    "networkStrength": 2,
    "layer": 2,
    "turnsElapsed": 1,
    "isComplete": false,
    "sector": "tech",
    "employeeCount": 0,
    "businessFormality": "unregistered",
    "hasBackupPower": false,
    "hasPremises": false,
    "susuMember": false,
    "mentorAccess": false
  },
  "nextNode": {
    "id": "L2-node-1",
    "layer": 2,
    "narrative": "Three months in...",
    "choices": [
      { "index": 0, "text": "...", "tensionHint": "..." },
      { "index": 1, "text": "...", "tensionHint": "..." },
      { "index": 2, "text": "...", "tensionHint": "..." }
    ]
  }
}
```

> `nextNode` is `null` when `isComplete` is `true`.

**Errors**
| Code | Reason |
|---|---|
| 400 | Invalid choiceIndex, missing fields, or stale nodeId (double-submit guard) |
| 404 | Session not found |
| 409 | Session already complete |

---

### GET `/api/game/session/:sessionId`

Retrieve current session state. Use for reconnects and page refreshes.

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "clientState": { "...ClientWorldState fields..." },
  "currentNode": { "...ScenarioNode..." }
}
```

> `currentNode` is `null` before `/classify` is called.

**Errors**
| Code | Reason |
|---|---|
| 404 | Session not found |

---

### GET `/api/game/results/:sessionId`

Retrieve final EO profile and game summary. Only available after `isComplete = true`.

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "eoProfile": {
    "autonomy": 6.5,
    "innovativeness": 7.0,
    "riskTaking": 8.0,
    "proactiveness": 5.5,
    "competitiveAggressiveness": 4.0
  },
  "clientState": { "...ClientWorldState fields..." },
  "summary": "Your entrepreneurial orientation profile...",
  "session": { "...GameSession fields..." }
}
```

**Errors**
| Code | Reason |
|---|---|
| 400 | Session not yet complete |
| 404 | Session not found |

---

## Shared Types Reference

Import from `@hatchquest/shared` — do not redefine:

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
} from "@hatchquest/shared";
```

### `ClientWorldState` fields

| Field | Type | Notes |
|---|---|---|
| `capital` | number | GHS |
| `monthlyBurn` | number | GHS/month |
| `revenue` | number | GHS/month |
| `debt` | number | GHS |
| `reputation` | number | 0–100 |
| `networkStrength` | number | 0–100 |
| `layer` | number | 0–5 |
| `turnsElapsed` | number | Total decisions made |
| `isComplete` | boolean | True at game end |
| `sector` | BusinessSector | tech, agri, retail, food, services |
| `employeeCount` | number | |
| `businessFormality` | BusinessFormality | unregistered, soleProprietorship, limitedCompany |
| `hasBackupPower` | boolean | |
| `hasPremises` | boolean | |
| `susuMember` | boolean | |
| `mentorAccess` | boolean | |

---

## Game Flow

```
POST /start
  → sessionId + layer0Question

POST /classify  (player submits free-text)
  → layer1NodeId

Loop until isComplete:
  POST /choice  (0 | 1 | 2)
    → clientState + nextNode

GET /results  (when isComplete = true)
  → eoProfile + summary
```

---

_v2 contract — April 2026_
