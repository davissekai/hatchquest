# HatchQuest Content Architecture v2 — Skeleton + AI Skin

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static scenario registry with a hybrid architecture: fixed EO skeletons define the game mechanics, while an AI narrator generates personalised narrative skin for each player based on their Layer 0 business description.

**Architecture:** Every scenario has two layers — a `ScenarioSkeleton` (pre-written, tested, EO-valid structure with theme, effects, tension dimensions, and choice archetypes) and a `NarrativeSkin` (AI-generated narrative, choice text, and tension hints contextualised to the player's specific business). The Director AI selects skeletons as before; a new Narrator AI service skins them before delivery to the client. The player's Layer 0 free-text response is stored as a `PlayerContext` object that rides with the session through all 5 layers.

**Tech Stack:** TypeScript, Fastify, Anthropic SDK (Claude Haiku 4.5), Vitest

---

## Scope

This plan covers three subsystems. They are dependent — each builds on the previous — so they are kept in a single plan with clear phase boundaries.

**Phase A:** Player Context & Layer 0 Redesign (Tasks 1–5)
**Phase B:** Skeleton Architecture & Narrator AI (Tasks 6–10)
**Phase C:** Layer 1 Skeletons & Integration (Tasks 11–14)

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `packages/shared/src/types/context.ts` | `PlayerContext` interface — the persistent player identity object |
| `packages/shared/src/types/skeleton.ts` | `ScenarioSkeleton`, `ChoiceArchetype`, `NarrativeSkin` types |
| `backend/src/engine/narrator-ai.ts` | AI skin generator — takes skeleton + PlayerContext → NarrativeSkin |
| `backend/src/engine/__tests__/narrator-ai.test.ts` | Narrator AI unit tests |
| `backend/src/skeletons/layer-1.ts` | Layer 1 skeletons (5 nodes) |
| `backend/src/skeletons/layer-2.ts` | Layer 2 skeletons (5 nodes) |
| `backend/src/skeletons/layer-3.ts` | Layer 3 skeletons (4 nodes) |
| `backend/src/skeletons/layer-4.ts` | Layer 4 skeletons (3 nodes) |
| `backend/src/skeletons/layer-5.ts` | Layer 5 skeletons (2 endings) |
| `backend/src/skeletons/registry.ts` | Skeleton registry — replaces `scenario-registry.ts` |
| `backend/src/skeletons/__tests__/skeleton-validation.test.ts` | Content validation for all skeletons |

### Modified files

| File | Change |
|---|---|
| `packages/shared/src/types/game.ts` | Add `playerContext` field to `WorldState`; remove `BusinessSector` dependency |
| `packages/shared/src/types/api.ts` | Update `StartResponse` (add preamble), `ClassifyRequest` (two responses), `ChoiceRequest` (optional freeText field), `ScenarioNode` shape |
| `packages/shared/src/types/session.ts` | No changes needed — `WorldState` already embedded |
| `packages/shared/src/index.ts` | Re-export new types |
| `backend/src/engine/classifier.ts` | Update to handle two-question flow; extract PlayerContext from Q1; generate Q2 dynamically |
| `backend/src/routes/start.ts` | Return preamble text + Q1 prompt |
| `backend/src/routes/classify.ts` | Accept two responses; build PlayerContext; store in world state |
| `backend/src/routes/choice.ts` | Add optional freeText field; call Narrator AI to skin skeletons before returning |
| `backend/src/app.ts` | Wire skeleton registry instead of old scenario-registry |
| `frontend/src/app/layer0/page.tsx` | Two-view scroll layout: preamble fills viewport, scroll reveals Q1 input |

### Deleted files (after migration)

| File | Reason |
|---|---|
| `backend/src/scenario-registry.ts` | Replaced by `backend/src/skeletons/registry.ts` |
| `backend/src/__tests__/content-validation.test.ts` | Replaced by `backend/src/skeletons/__tests__/skeleton-validation.test.ts` |

---

## Phase A: Player Context & Layer 0 Redesign

### Task 1: Define PlayerContext type

**Files:**
- Create: `packages/shared/src/types/context.ts`
- Modify: `packages/shared/src/types/game.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create the PlayerContext interface**

```typescript
// packages/shared/src/types/context.ts

/**
 * Persistent player identity — extracted from Layer 0 free-text responses.
 * Rides with the session through all 5 layers. The Narrator AI reads this
 * to generate personalised scenario narrative for every turn.
 */
export interface PlayerContext {
  /** What business the player described (extracted from Q1) */
  businessDescription: string;
  /** Why they want to build it — their stated motivation (extracted from Q1) */
  motivation: string;
  /** The raw Q1 response, preserved for re-classification if needed */
  rawQ1Response: string;
  /** The raw Q2 response */
  rawQ2Response: string;
  /** AI-generated Q2 text (stored so it can be shown in session resume) */
  q2Prompt: string;
}
```

- [ ] **Step 2: Add playerContext to WorldState**

In `packages/shared/src/types/game.ts`, replace the `sector: BusinessSector` field:

```typescript
// Remove: sector: BusinessSector;
// Remove: the BusinessSector type export (keep the type definition for now — deletion in Task 12)

// Add to WorldState, after the business fields:
  /** Player's business identity — set during Layer 0 classification */
  playerContext: PlayerContext | null;
```

Import `PlayerContext` at the top:

```typescript
import type { PlayerContext } from "./context.js";
```

- [ ] **Step 3: Re-export from shared index**

In `packages/shared/src/index.ts`, add:

```typescript
export type { PlayerContext } from "./types/context.js";
```

- [ ] **Step 4: Run type-check across all workspaces**

Run: `npm run type-check --workspace=packages/shared && npm run type-check --workspace=backend`

Expected: Type errors in files that reference `sector` on WorldState. These are addressed in subsequent tasks. List the errors — do not fix yet.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types/context.ts packages/shared/src/types/game.ts packages/shared/src/index.ts
git commit -m "feat: add PlayerContext type to shared package"
```

---

### Task 2: Update WorldState construction

**Files:**
- Modify: `backend/src/engine/world-state.ts`
- Modify: `backend/src/engine/__tests__/world-state.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test to the existing world-state test file:

```typescript
it("creates initial state with null playerContext and no sector", () => {
  const state = createInitialWorldState({ seed: 42 });
  expect(state.playerContext).toBeNull();
  expect(state.capital).toBe(10_000);
  expect(state.layer).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- --run src/engine/__tests__/world-state.test.ts`

Expected: FAIL — `createInitialWorldState` still requires `sector` parameter.

- [ ] **Step 3: Update createInitialWorldState**

Remove `sector` from `CreateWorldStateParams`. Remove `sector` from the returned object. Add `playerContext: null` to the returned object.

```typescript
// Remove the sector import and the CreateWorldStateParams interface's sector field

interface CreateWorldStateParams {
  seed: number;
}

export function createInitialWorldState(
  params: CreateWorldStateParams
): WorldState {
  const { seed } = params;
  const rng = createPRNG(seed);

  const randInt = (min: number, max: number): number =>
    Math.floor(rng() * (max - min + 1)) + min;

  return {
    seed,
    layer: 0,
    currentNodeId: null,
    turnsElapsed: 0,
    isComplete: false,

    capital: 10_000,
    monthlyBurn: randInt(1_000, 2_000),
    revenue: 0,
    debt: 0,

    // Business — sector removed, playerContext starts null
    playerContext: null,
    employeeCount: 0,
    businessFormality: "unregistered",
    hasBackupPower: false,
    hasPremises: false,

    reputation: 0,
    networkStrength: 0,
    susuMember: false,
    mentorAccess: false,

    marketDemand: randInt(20, 80),
    infrastructureReliability: randInt(30, 70),
    regulatoryPressure: randInt(10, 60),
    competitorAggression: randInt(20, 75),

    eoProfile: {
      autonomy: 5,
      innovativeness: 5,
      riskTaking: 5,
      proactiveness: 5,
      competitiveAggressiveness: 5,
    },
  };
}
```

- [ ] **Step 4: Fix existing tests that pass sector**

Search all test files for `createInitialWorldState` calls and remove the `sector` argument. Update any assertions that check `state.sector`.

- [ ] **Step 5: Run full test suite**

Run: `npm test --workspace=backend`

Expected: Some failures in other files that reference `sector` on WorldState — note them but focus on world-state tests passing.

- [ ] **Step 6: Commit**

```bash
git add backend/src/engine/world-state.ts backend/src/engine/__tests__/world-state.test.ts
git commit -m "refactor: remove sector from WorldState, add playerContext"
```

---

### Task 3: Update ClientWorldState and API types

**Files:**
- Modify: `packages/shared/src/types/api.ts`
- Modify: `backend/src/routes/helpers.ts`

- [ ] **Step 1: Update ClientWorldState**

Remove `sector: BusinessSector` from `ClientWorldState`. Add `playerBusinessName: string | null` — a one-line label extracted from playerContext for the HUD display:

```typescript
export interface ClientWorldState {
  capital: number;
  monthlyBurn: number;
  revenue: number;
  debt: number;
  reputation: number;
  networkStrength: number;
  layer: number;
  turnsElapsed: number;
  isComplete: boolean;
  // Replaced sector with a display-friendly business label
  playerBusinessName: string | null;
  employeeCount: number;
  businessFormality: BusinessFormality;
  hasBackupPower: boolean;
  hasPremises: boolean;
  susuMember: boolean;
  mentorAccess: boolean;
}
```

- [ ] **Step 2: Update StartResponse**

Add the preamble text to the start response:

```typescript
export interface StartResponse {
  sessionId: string;
  preamble: string; // world introduction text — fills the first viewport
  layer0Question: string; // Q1 — "what is the business, why do you want to build it"
}
```

- [ ] **Step 3: Update ClassifyRequest and ClassifyResponse**

The classify endpoint now handles two questions. Q1 is submitted first, then Q2 (which was generated from Q1) is submitted second. To keep it simple for the API, we send both in one call:

```typescript
export interface ClassifyRequest {
  sessionId: string;
  q1Response: string; // answer to "what is the business and why"
  q2Response: string; // answer to the AI-generated follow-up
  q2Prompt: string;   // the Q2 question text (so backend can store it)
}

export interface ClassifyResponse {
  sessionId: string;
  layer1NodeId: string;
}
```

**Alternative — two-step classify:** If Davis prefers two separate API calls (POST /classify-q1 returns the generated Q2 question, then POST /classify-q2 submits the answer), flag this architectural decision. For now, implement the single-call version — the frontend handles Q2 generation client-side or via a dedicated endpoint.

**Davis decision needed:** Single classify call (both answers at once) vs. two-step flow (Q1 → get Q2 → submit Q2). The two-step flow is more natural for the scroll UI because Q2 only appears after Q1 is submitted. **Recommend: two-step.**

If two-step:

```typescript
// POST /api/game/classify-q1
export interface ClassifyQ1Request {
  sessionId: string;
  q1Response: string;
}
export interface ClassifyQ1Response {
  sessionId: string;
  q2Prompt: string; // AI-generated follow-up question
}

// POST /api/game/classify-q2
export interface ClassifyQ2Request {
  sessionId: string;
  q2Response: string;
}
export interface ClassifyQ2Response {
  sessionId: string;
  layer1NodeId: string;
}
```

- [ ] **Step 4: Add optional freeText to ChoiceRequest**

```typescript
export interface ChoiceRequest {
  sessionId: string;
  nodeId: string;
  choiceIndex: 0 | 1 | 2 | 3; // 3 = "write your own" option
  freeText?: string; // required when choiceIndex is 3
}
```

- [ ] **Step 5: Update toClientState helper**

In `backend/src/routes/helpers.ts`, update the `toClientState` function to map `playerContext` to `playerBusinessName`:

```typescript
export function toClientState(state: WorldState): ClientWorldState {
  return {
    capital: state.capital,
    monthlyBurn: state.monthlyBurn,
    revenue: state.revenue,
    debt: state.debt,
    reputation: state.reputation,
    networkStrength: state.networkStrength,
    layer: state.layer,
    turnsElapsed: state.turnsElapsed,
    isComplete: state.isComplete,
    playerBusinessName: state.playerContext?.businessDescription ?? null,
    employeeCount: state.employeeCount,
    businessFormality: state.businessFormality,
    hasBackupPower: state.hasBackupPower,
    hasPremises: state.hasPremises,
    susuMember: state.susuMember,
    mentorAccess: state.mentorAccess,
  };
}
```

- [ ] **Step 6: Run type-check**

Run: `npm run type-check --workspace=packages/shared`

Expected: PASS (the shared types are self-consistent).

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types/api.ts backend/src/routes/helpers.ts
git commit -m "feat: update API types for playerContext, preamble, two-step classify"
```

---

### Task 4: Redesign Layer 0 — start route with preamble

**Files:**
- Modify: `backend/src/routes/start.ts`
- Modify: `backend/src/routes/__tests__/start.test.ts`

- [ ] **Step 1: Define the preamble constant**

```typescript
const PREAMBLE = `The economy is recovering. Inflation is down and the cedi is holding, and there is a quiet optimism in the air that the city has not felt in a while. Business is moving and new money is circulating. Mobile money is everywhere, no longer just a feature but the system through which Accra runs. The city is expanding physically as infrastructure is built, and the energy around entrepreneurship is steadily growing.

But the fundamentals have not changed. Capital is still hard to access without the right connections or collateral, and the informal economy remains enormous, setting the price floor for everything. Power is unreliable, and competition is stiff across local, informal, and foreign players. Survival in the first year is not guaranteed, and most do not make it.

You have GHS 10,000 and an idea. That is where your story starts.`;

const LAYER_0_QUESTION =
  "You are about to spend your first cedi. What is the business, and what is it really about for you?";
```

- [ ] **Step 2: Update the route handler**

Return `preamble` alongside `layer0Question` in the response:

```typescript
return reply.status(200).send({
  sessionId: session.id,
  preamble: PREAMBLE,
  layer0Question: LAYER_0_QUESTION,
});
```

- [ ] **Step 3: Update the start test**

Assert that the response includes both `preamble` and `layer0Question`:

```typescript
it("returns preamble and layer0 question on successful start", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/start",
    payload: { playerName: "Kofi", email: "kofi@test.com", password: "test" },
  });
  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.sessionId).toBeDefined();
  expect(body.preamble).toContain("GHS 10,000");
  expect(body.layer0Question).toContain("business");
});
```

- [ ] **Step 4: Run test**

Run: `npm test --workspace=backend -- --run src/routes/__tests__/start.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/start.ts backend/src/routes/__tests__/start.test.ts
git commit -m "feat: add preamble to start response, update L0 question"
```

---

### Task 5: Two-step classify — Q1 generates Q2, Q2 classifies

**Files:**
- Modify: `backend/src/engine/classifier.ts`
- Modify: `backend/src/engine/__tests__/classifier.test.ts`
- Create or modify: `backend/src/routes/classify.ts` (split into two endpoints)
- Modify: `backend/src/routes/__tests__/classify.test.ts`

This is the most complex task in Phase A. It has two sub-parts.

**Sub-part 5a: Q1 → generate Q2**

- [ ] **Step 1: Write the Q2 generator function**

Add to `classifier.ts`:

```typescript
const Q2_GENERATOR_PROMPT = `You are a business simulation game master set in Accra, Ghana, 2026.

The player just described their business idea. Based on what they said, generate ONE specific follow-up question that:
1. References their specific business (use details they mentioned)
2. Presents a realistic Week 1 challenge they would actually face
3. Forces them to reveal how they handle adversity (risk tolerance, independence vs collaboration)
4. Is phrased as a direct scenario, not an abstract question

Format: Return ONLY the question text. No preamble, no quotes, no explanation.

Example — if they said "mobile food delivery":
"Your mobile food delivery service has been live for five days. Your main cook just told you she has a family emergency and cannot work for the next two weeks. Your first corporate lunch order — forty plates for a bank on the Ring Road — is due Monday. What do you do?"`;

/**
 * Generates a personalised Q2 question based on the player's Q1 response.
 * Falls back to a generic Q2 if the LLM call fails.
 */
export async function generateQ2(q1Response: string): Promise<string> {
  const client = getAnthropicClient();
  if (!client) return FALLBACK_Q2;

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      system: Q2_GENERATOR_PROMPT,
      messages: [{ role: "user", content: q1Response }],
    });

    const text = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    return text.length > 20 ? text : FALLBACK_Q2;
  } catch {
    return FALLBACK_Q2;
  }
}

const FALLBACK_Q2 =
  "Your business has been live for one week. A key part of your plan just fell through — your main supplier cannot deliver for another two weeks, and a potential customer is waiting. What do you do?";
```

- [ ] **Step 2: Write test for Q2 generator**

```typescript
describe("generateQ2", () => {
  it("returns fallback Q2 when no API key is set", async () => {
    const result = await generateQ2("I want to build a mobile tailoring business");
    expect(result).toContain("supplier");
    expect(result.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 3: Run test**

Run: `npm test --workspace=backend -- --run src/engine/__tests__/classifier.test.ts`

Expected: PASS (fallback path exercised since ANTHROPIC_API_KEY is not set in test env)

**Sub-part 5b: Extract PlayerContext from Q1 + Q2, classify**

- [ ] **Step 4: Write the PlayerContext extractor**

Add to `classifier.ts`:

```typescript
/**
 * Extracts a PlayerContext from the player's Q1 and Q2 responses.
 * Uses LLM to extract business description and motivation.
 * Falls back to raw text splitting if LLM fails.
 */
export function extractPlayerContext(
  q1Response: string,
  q2Response: string,
  q2Prompt: string
): PlayerContext {
  // Simple extraction — split Q1 into business description and motivation
  // The LLM classifier already handles the EO profiling;
  // this just structures the narrative context for the Narrator AI.
  const sentences = q1Response.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const businessDescription = sentences[0]?.trim() ?? q1Response.trim();
  const motivation = sentences.length > 1
    ? sentences.slice(1).join(". ").trim()
    : "To build something meaningful in Accra.";

  return {
    businessDescription,
    motivation,
    rawQ1Response: q1Response,
    rawQ2Response: q2Response,
    q2Prompt,
  };
}
```

- [ ] **Step 5: Update the classify function to accept both responses**

```typescript
/**
 * Classifies free-text player responses to a Layer 1 node id.
 * Combines Q1 and Q2 into a single text for EO pole classification.
 */
export async function classify(q1Response: string, q2Response: string): Promise<string> {
  const combinedText = `Business idea: ${q1Response}\n\nResponse to challenge: ${q2Response}`;
  const dist =
    (await callAnthropicClassifier(combinedText)) ?? keywordClassify(combinedText);
  return selectLayer1NodeFromDistribution(dist);
}
```

- [ ] **Step 6: Split classify route into two endpoints**

Rewrite `backend/src/routes/classify.ts`:

```typescript
import type { FastifyPluginAsync } from "fastify";
import type { ISessionStore } from "../store/types.js";
import { generateQ2, classify, extractPlayerContext } from "../engine/classifier.js";

interface ClassifyPluginOptions {
  store: ISessionStore;
}

export const classifyRoutes: FastifyPluginAsync<ClassifyPluginOptions> = async (
  fastify,
  opts
) => {
  const { store } = opts;

  // POST /classify-q1 — submit Q1 answer, get AI-generated Q2
  fastify.post<{
    Body: { sessionId: string; q1Response: string };
  }>("/classify-q1", async (request, reply) => {
    const { sessionId, q1Response } = request.body;

    const session = await store.getSession(sessionId);
    if (!session) {
      return reply.status(404).send({ error: `Session not found: ${sessionId}` });
    }

    if (session.worldState.layer > 0) {
      return reply.status(409).send({ error: "Session is already classified." });
    }

    // Store Q1 response temporarily in world state for session resume
    await store.updateSession(sessionId, {
      worldState: {
        ...session.worldState,
        playerContext: {
          businessDescription: q1Response,
          motivation: "",
          rawQ1Response: q1Response,
          rawQ2Response: "",
          q2Prompt: "",
        },
      },
    });

    const q2Prompt = await generateQ2(q1Response);

    // Update stored Q2 prompt
    const updatedSession = await store.getSession(sessionId);
    if (updatedSession) {
      await store.updateSession(sessionId, {
        worldState: {
          ...updatedSession.worldState,
          playerContext: {
            ...updatedSession.worldState.playerContext!,
            q2Prompt,
          },
        },
      });
    }

    return reply.status(200).send({ sessionId, q2Prompt });
  });

  // POST /classify-q2 — submit Q2 answer, get Layer 1 node assignment
  fastify.post<{
    Body: { sessionId: string; q2Response: string };
  }>("/classify-q2", async (request, reply) => {
    const { sessionId, q2Response } = request.body;

    const session = await store.getSession(sessionId);
    if (!session) {
      return reply.status(404).send({ error: `Session not found: ${sessionId}` });
    }

    if (session.worldState.layer > 0) {
      return reply.status(409).send({ error: "Session is already classified." });
    }

    const pc = session.worldState.playerContext;
    if (!pc || !pc.rawQ1Response) {
      return reply.status(400).send({ error: "Q1 must be submitted before Q2." });
    }

    // Classify using both responses
    const layer1NodeId = await classify(pc.rawQ1Response, q2Response);

    // Build final PlayerContext
    const playerContext = extractPlayerContext(
      pc.rawQ1Response,
      q2Response,
      pc.q2Prompt
    );

    // Advance to Layer 1
    await store.updateSession(sessionId, {
      worldState: {
        ...session.worldState,
        layer: 1,
        currentNodeId: layer1NodeId,
        playerContext,
      },
    });

    return reply.status(200).send({ sessionId, layer1NodeId });
  });
};
```

- [ ] **Step 7: Update classify route tests**

Write tests for both `/classify-q1` and `/classify-q2` endpoints:

```typescript
describe("POST /classify-q1", () => {
  it("returns a generated Q2 prompt", async () => {
    // Start a session first
    const startRes = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Ama", email: "ama@test.com", password: "test" },
    });
    const { sessionId } = startRes.json();

    const res = await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: {
        sessionId,
        q1Response: "I want to build a mobile food delivery service in Osu.",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.q2Prompt).toBeDefined();
    expect(body.q2Prompt.length).toBeGreaterThan(20);
  });
});

describe("POST /classify-q2", () => {
  it("classifies and returns a Layer 1 node", async () => {
    // Start + Q1 first
    const startRes = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Kwame", email: "kwame@test.com", password: "test" },
    });
    const { sessionId } = startRes.json();

    await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: {
        sessionId,
        q1Response: "I want to build a solar panel installation company.",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/classify-q2",
      payload: {
        sessionId,
        q2Response: "I would find an alternative supplier immediately and negotiate a rush order.",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.layer1NodeId).toMatch(/^L1-node-[1-5]$/);
  });

  it("rejects Q2 before Q1 is submitted", async () => {
    const startRes = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Efua", email: "efua@test.com", password: "test" },
    });
    const { sessionId } = startRes.json();

    const res = await app.inject({
      method: "POST",
      url: "/classify-q2",
      payload: { sessionId, q2Response: "I would call my uncle." },
    });

    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 8: Update app.ts route registration**

The classify routes still register under the same plugin — no changes needed if the plugin internally registers both `/classify-q1` and `/classify-q2`. Remove the old `/classify` registration if the route name changed.

- [ ] **Step 9: Run full test suite**

Run: `npm test --workspace=backend`

Expected: Most tests pass. Some old classify tests will fail because the endpoint changed from `/classify` to `/classify-q1` + `/classify-q2`. Update those tests.

- [ ] **Step 10: Commit**

```bash
git add backend/src/engine/classifier.ts backend/src/routes/classify.ts backend/src/routes/__tests__/classify.test.ts backend/src/engine/__tests__/classifier.test.ts
git commit -m "feat: two-step Layer 0 classify — Q1 generates Q2, Q2 classifies"
```

---

## Phase B: Skeleton Architecture & Narrator AI

### Task 6: Define skeleton types

**Files:**
- Create: `packages/shared/src/types/skeleton.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create the skeleton type definitions**

```typescript
// packages/shared/src/types/skeleton.ts

import type { EODimension } from "./game.js";

/**
 * A choice archetype — the EO-valid structure of a choice
 * without the player-specific narrative text.
 *
 * The Narrator AI reads the archetype and generates personalised
 * choice text and tension hints for the player's specific business.
 */
export interface ChoiceArchetype {
  /** Which EO pole this choice reveals (e.g., "risk-tolerant", "people-first") */
  eoPoleSignal: string;
  /** Short description of what this choice type represents — guides the Narrator AI */
  archetypeDescription: string;
  /** The structural tension this choice embodies */
  tensionAxis: string;
}

/**
 * A scenario skeleton — the pre-written, EO-valid structure of a game scenario.
 * Contains no player-specific narrative. The Narrator AI skins this with the
 * player's business context to produce a ScenarioNode for the client.
 */
export interface ScenarioSkeleton {
  id: string;
  layer: number;
  /** Thematic category — used by Director AI for world-state affinity scoring */
  theme: string;
  /** Base selection weight for Director AI weighted draw */
  baseWeight: number;
  /** Which EO dimensions this scenario is designed to test */
  eoTargetDimensions: EODimension[];
  /** Short description of the scenario situation — guides the Narrator AI */
  situationSeed: string;
  /** The three choice archetypes — Narrator AI generates player-specific text for each */
  choiceArchetypes: [ChoiceArchetype, ChoiceArchetype, ChoiceArchetype];
  /** Hard eligibility conditions — same as current NodeConditions */
  conditions?: {
    capitalMin?: number;
    capitalMax?: number;
    reputationMin?: number;
    reputationMax?: number;
    debtMin?: number;
    debtMax?: number;
    requiresMentorAccess?: boolean;
    requiresPremises?: boolean;
    employeeCountMin?: number;
  };
}

/**
 * The AI-generated narrative skin for a specific player.
 * Produced by the Narrator AI from a ScenarioSkeleton + PlayerContext.
 */
export interface NarrativeSkin {
  /** The full narrative paragraph shown to the player */
  narrative: string;
  /** Three player-specific choice texts */
  choices: [string, string, string];
  /** Three tension hints — describe the dilemma without labelling EO dimensions */
  tensionHints: [string, string, string];
}
```

- [ ] **Step 2: Re-export from index**

```typescript
export type { ScenarioSkeleton, ChoiceArchetype, NarrativeSkin } from "./types/skeleton.js";
```

- [ ] **Step 3: Run type-check**

Run: `npm run type-check --workspace=packages/shared`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/skeleton.ts packages/shared/src/index.ts
git commit -m "feat: add ScenarioSkeleton and NarrativeSkin types"
```

---

### Task 7: Build the Narrator AI

**Files:**
- Create: `backend/src/engine/narrator-ai.ts`
- Create: `backend/src/engine/__tests__/narrator-ai.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/engine/__tests__/narrator-ai.test.ts

import { describe, it, expect } from "vitest";
import { generateNarrativeSkin, buildFallbackSkin } from "../narrator-ai.js";
import type { ScenarioSkeleton, PlayerContext } from "@hatchquest/shared";

const TEST_SKELETON: ScenarioSkeleton = {
  id: "test-skeleton",
  layer: 1,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
  situationSeed: "A competitor has appeared in your market with a cheaper alternative. Your first loyal customers are asking questions.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + competitive",
      archetypeDescription: "Confront the competition directly — invest to undercut or differentiate aggressively",
      tensionAxis: "Speed vs. financial stability",
    },
    {
      eoPoleSignal: "measured + innovative",
      archetypeDescription: "Pivot to a niche the competitor cannot serve — differentiate sideways",
      tensionAxis: "Opportunity vs. risk management",
    },
    {
      eoPoleSignal: "conservative + autonomous",
      archetypeDescription: "Ignore the competitor and double down on existing customer relationships",
      tensionAxis: "Growth ambition vs. disciplined restraint",
    },
  ],
};

const TEST_CONTEXT: PlayerContext = {
  businessDescription: "mobile food delivery service in Osu",
  motivation: "I want to make healthy food accessible to office workers",
  rawQ1Response: "I want to build a mobile food delivery service in Osu because office workers deserve healthy, affordable lunch options.",
  rawQ2Response: "I would call my three vendors immediately and negotiate emergency supply.",
  q2Prompt: "Your food delivery service...",
};

describe("buildFallbackSkin", () => {
  it("produces a valid NarrativeSkin from skeleton + context", () => {
    const skin = buildFallbackSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.narrative).toContain("mobile food delivery");
    expect(skin.choices).toHaveLength(3);
    expect(skin.tensionHints).toHaveLength(3);
    // Each choice should be non-empty
    skin.choices.forEach((c) => expect(c.length).toBeGreaterThan(10));
  });
});

describe("generateNarrativeSkin", () => {
  it("falls back to buildFallbackSkin when no API key is set", async () => {
    const skin = await generateNarrativeSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.narrative).toBeDefined();
    expect(skin.choices).toHaveLength(3);
    expect(skin.tensionHints).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- --run src/engine/__tests__/narrator-ai.test.ts`

Expected: FAIL — module does not exist

- [ ] **Step 3: Implement the Narrator AI**

```typescript
// backend/src/engine/narrator-ai.ts

import Anthropic from "@anthropic-ai/sdk";
import type { ScenarioSkeleton, NarrativeSkin, PlayerContext } from "@hatchquest/shared";

const NARRATOR_TIMEOUT_MS = 12_000;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

const NARRATOR_SYSTEM_PROMPT = `You are a business simulation narrator set in Accra, Ghana, 2026.

You will receive:
1. A SITUATION SEED — the abstract scenario structure
2. A PLAYER CONTEXT — their specific business and motivation
3. Three CHOICE ARCHETYPES — the structural choices available

Your job: generate a personalised scenario that feels like it is happening to THIS player's specific business, in THIS player's specific market, in Accra.

Return ONLY valid JSON with this exact shape:
{
  "narrative": "<2-3 paragraph scenario description, grounded in the player's business>",
  "choices": ["<choice 1 text>", "<choice 2 text>", "<choice 3 text>"],
  "tensionHints": ["<hint 1>", "<hint 2>", "<hint 3>"]
}

Rules:
- Reference the player's specific business by name/description
- Use Accra-specific details (locations, currency in GHS, local business culture)
- Choices must be 1-2 sentences each, action-oriented
- Tension hints must describe the dilemma without using EO terminology
- No markdown, no code fence, JSON only`;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, timeout: NARRATOR_TIMEOUT_MS, maxRetries: 0 });
}

/**
 * Generates a personalised NarrativeSkin using the LLM.
 * Falls back to buildFallbackSkin on any failure.
 */
export async function generateNarrativeSkin(
  skeleton: ScenarioSkeleton,
  context: PlayerContext
): Promise<NarrativeSkin> {
  const client = getClient();
  if (!client) return buildFallbackSkin(skeleton, context);

  const userPrompt = `SITUATION SEED: ${skeleton.situationSeed}

PLAYER CONTEXT:
- Business: ${context.businessDescription}
- Motivation: ${context.motivation}

CHOICE ARCHETYPES:
1. ${skeleton.choiceArchetypes[0].archetypeDescription} (tension: ${skeleton.choiceArchetypes[0].tensionAxis})
2. ${skeleton.choiceArchetypes[1].archetypeDescription} (tension: ${skeleton.choiceArchetypes[1].tensionAxis})
3. ${skeleton.choiceArchetypes[2].archetypeDescription} (tension: ${skeleton.choiceArchetypes[2].tensionAxis})`;

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      system: NARRATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return buildFallbackSkin(skeleton, context);

    const parsed = JSON.parse(match[0]) as NarrativeSkin;
    if (
      typeof parsed.narrative === "string" &&
      Array.isArray(parsed.choices) &&
      parsed.choices.length === 3 &&
      Array.isArray(parsed.tensionHints) &&
      parsed.tensionHints.length === 3
    ) {
      return {
        narrative: parsed.narrative,
        choices: parsed.choices as [string, string, string],
        tensionHints: parsed.tensionHints as [string, string, string],
      };
    }

    return buildFallbackSkin(skeleton, context);
  } catch {
    return buildFallbackSkin(skeleton, context);
  }
}

/**
 * Deterministic fallback — injects the player's business name into the skeleton's
 * situation seed and archetype descriptions. No LLM call needed.
 */
export function buildFallbackSkin(
  skeleton: ScenarioSkeleton,
  context: PlayerContext
): NarrativeSkin {
  const biz = context.businessDescription;

  return {
    narrative: `In your ${biz}, ${skeleton.situationSeed.charAt(0).toLowerCase()}${skeleton.situationSeed.slice(1)}`,
    choices: skeleton.choiceArchetypes.map(
      (a) => a.archetypeDescription
    ) as [string, string, string],
    tensionHints: skeleton.choiceArchetypes.map(
      (a) => a.tensionAxis
    ) as [string, string, string],
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test --workspace=backend -- --run src/engine/__tests__/narrator-ai.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/engine/narrator-ai.ts backend/src/engine/__tests__/narrator-ai.test.ts
git commit -m "feat: Narrator AI — generates personalised scenario skin from skeleton + player context"
```

---

### Task 8: Build the skeleton registry

**Files:**
- Create: `backend/src/skeletons/registry.ts`

This task creates the registry infrastructure. Task 11 populates it with Layer 1 content.

- [ ] **Step 1: Create the skeleton registry**

```typescript
// backend/src/skeletons/registry.ts

import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

/**
 * A registered skeleton — the skeleton plus its pre-written effects.
 * Effects are fixed (not AI-generated) because they define the game mechanics.
 */
export interface RegisteredSkeleton {
  skeleton: ScenarioSkeleton;
  effects: [ChoiceEffect, ChoiceEffect, ChoiceEffect];
}

// The master registry — populated by layer modules
const REGISTRY = new Map<string, RegisteredSkeleton>();

/** Registers a skeleton. Throws if the id is already taken. */
export function registerSkeleton(entry: RegisteredSkeleton): void {
  if (REGISTRY.has(entry.skeleton.id)) {
    throw new Error(`Duplicate skeleton id: ${entry.skeleton.id}`);
  }
  REGISTRY.set(entry.skeleton.id, entry);
}

/** Returns a registered skeleton by id, or null if not found. */
export function getSkeleton(id: string): RegisteredSkeleton | null {
  return REGISTRY.get(id) ?? null;
}

/** Returns the ChoiceEffect for a given skeleton id and choice index. */
export function getSkeletonEffect(
  id: string,
  choiceIndex: 0 | 1 | 2
): ChoiceEffect | null {
  const entry = REGISTRY.get(id);
  if (!entry) return null;
  return entry.effects[choiceIndex] ?? null;
}

/** Returns all registered skeletons as an array. */
export function getAllSkeletons(): RegisteredSkeleton[] {
  return Array.from(REGISTRY.values());
}

/** Returns all skeletons for a given layer. */
export function getSkeletonsForLayer(layer: number): RegisteredSkeleton[] {
  return getAllSkeletons().filter((e) => e.skeleton.layer === layer);
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/skeletons/registry.ts
git commit -m "feat: skeleton registry — replaces scenario-registry infrastructure"
```

---

### Task 9: Wire skeleton registry into choice route

**Files:**
- Modify: `backend/src/routes/choice.ts`
- Modify: `backend/src/app.ts`

This task wires the skeleton registry and Narrator AI into the choice route so that each turn skins a skeleton before sending it to the client.

- [ ] **Step 1: Update ChoiceRouteOptions**

Add the Narrator AI dependency and skeleton-based getters:

```typescript
import type { PlayerContext, NarrativeSkin } from "@hatchquest/shared";
import type { RegisteredSkeleton } from "../skeletons/registry.js";

export interface ChoiceRouteOptions {
  store: ISessionStore;
  getSkeleton: (id: string) => RegisteredSkeleton | null;
  getSkeletonEffect: (id: string, choiceIndex: 0 | 1 | 2) => ChoiceEffect | null;
  selectNextNodeId?: (state: WorldState) => string | null;
  /** Narrator AI — skins a skeleton with the player's context */
  generateSkin: (skeleton: ScenarioSkeleton, context: PlayerContext) => Promise<NarrativeSkin>;
}
```

- [ ] **Step 2: Update handleChoice to skin the next node**

After selecting the next node, call the Narrator AI to generate the skin:

```typescript
// After selecting nextNodeId:
const nextSkeleton = nextNodeId ? getSkeleton(nextNodeId) : null;
let nextNode: ScenarioNode | null = null;

if (nextSkeleton && newState.playerContext) {
  const skin = await generateSkin(nextSkeleton.skeleton, newState.playerContext);
  nextNode = {
    id: nextSkeleton.skeleton.id,
    layer: nextSkeleton.skeleton.layer,
    narrative: skin.narrative,
    choices: skin.choices.map((text, i) => ({
      index: i as 0 | 1 | 2,
      text,
      tensionHint: skin.tensionHints[i],
    })),
  };
}
```

- [ ] **Step 3: Update app.ts to wire skeleton registry**

Replace the old `scenario-registry` imports with skeleton registry:

```typescript
import { getSkeleton, getSkeletonEffect, getAllSkeletons } from "./skeletons/registry.js";
import { generateNarrativeSkin } from "./engine/narrator-ai.js";

// In buildApp:
app.register(choiceRoutes, {
  prefix,
  store,
  getSkeleton,
  getSkeletonEffect,
  selectNextNodeId,
  generateSkin: generateNarrativeSkin,
});
```

- [ ] **Step 4: Update productionSelectNextNodeId to use skeletons**

```typescript
function productionSelectNextNodeId(state: WorldState): string | null {
  const rng = createPRNG(state.seed ^ state.turnsElapsed);
  // Convert skeleton entries to the shape selectNextNode expects
  const allEntries = getAllSkeletons();
  const asNodes = allEntries.map((e) => ({
    ...e.skeleton,
    // selectNextNode needs the ScenarioNodeFull shape — adapt
    narrative: "", // not used for selection
    choices: [],   // not used for selection
    effects: e.effects,
  }));
  const next = selectNextNode(state, asNodes, rng);
  return next?.id ?? null;
}
```

**Note:** This requires `selectNextNode` to accept the adapted shape. If the type is too rigid, create a `selectNextSkeleton` variant in `director-ai.ts` that takes `RegisteredSkeleton[]` directly. Flag this decision — Davis may want a clean adapter rather than a type workaround.

- [ ] **Step 5: Run type-check**

Run: `npm run type-check --workspace=backend`

Expected: Errors from old scenario-registry references — these get cleaned up in Task 12.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/choice.ts backend/src/app.ts
git commit -m "feat: wire skeleton registry and Narrator AI into choice route"
```

---

### Task 10: Adapt Director AI for skeletons

**Files:**
- Modify: `backend/src/engine/director-ai.ts`
- Modify: `backend/src/engine/__tests__/director-ai.test.ts`

- [ ] **Step 1: Create selectNextSkeleton function**

Add a new function that works with `RegisteredSkeleton[]` directly:

```typescript
import type { RegisteredSkeleton } from "../skeletons/registry.js";

/**
 * Selects the next scenario skeleton from the pool based on world state.
 * Same algorithm as selectNextNode but works with RegisteredSkeleton entries.
 */
export function selectNextSkeleton(
  state: WorldState,
  allEntries: RegisteredSkeleton[],
  rng: () => number
): RegisteredSkeleton | null {
  const nextLayer = state.layer + 1;
  if (nextLayer > 5) return null;

  const layerEntries = allEntries.filter((e) => e.skeleton.layer === nextLayer);
  if (layerEntries.length === 0) return null;

  // Adapt skeletons to the shape passesConditions expects
  const eligible = layerEntries.filter((e) => {
    const c = e.skeleton.conditions;
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
  });

  const pool = eligible.length > 0 ? eligible : layerEntries;

  const scored = pool.map((entry) => ({
    item: entry,
    weight:
      entry.skeleton.baseWeight *
      computeThemeAffinity(entry.skeleton.theme as NodeTheme, state) *
      computeEOAffinityFromDimensions(entry.skeleton.eoTargetDimensions, state),
  }));

  return weightedDraw(scored, rng);
}

/**
 * EO affinity calculation extracted to work with raw dimension arrays.
 */
function computeEOAffinityFromDimensions(
  dims: EODimension[],
  state: WorldState
): number {
  if (dims.length === 0) return 1.0;
  const isLateGame = state.layer >= 3;
  const scores = dims.map((dim) => {
    const playerValue = state.eoProfile[dim];
    return isLateGame ? (10 - playerValue) / 10 : playerValue / 10;
  });
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return 1.0 + mean;
}
```

- [ ] **Step 2: Write test for selectNextSkeleton**

```typescript
describe("selectNextSkeleton", () => {
  it("selects a skeleton from the correct layer", () => {
    const state = createInitialWorldState({ seed: 42 });
    state.layer = 0; // next layer = 1

    const entries: RegisteredSkeleton[] = [
      {
        skeleton: {
          id: "L1-test",
          layer: 1,
          theme: "general",
          baseWeight: 1.0,
          eoTargetDimensions: ["riskTaking"],
          situationSeed: "test situation",
          choiceArchetypes: [
            { eoPoleSignal: "risk-tolerant", archetypeDescription: "Go bold", tensionAxis: "Risk vs safety" },
            { eoPoleSignal: "measured", archetypeDescription: "Go careful", tensionAxis: "Speed vs caution" },
            { eoPoleSignal: "autonomous", archetypeDescription: "Go alone", tensionAxis: "Independence vs support" },
          ],
        },
        effects: [ZERO_EFFECT, ZERO_EFFECT, ZERO_EFFECT],
      },
    ];

    const rng = () => 0.5;
    const result = selectNextSkeleton(state, entries, rng);
    expect(result).not.toBeNull();
    expect(result!.skeleton.id).toBe("L1-test");
  });

  it("returns null when no skeletons exist for the next layer", () => {
    const state = createInitialWorldState({ seed: 42 });
    state.layer = 5;
    const result = selectNextSkeleton(state, [], () => 0.5);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test --workspace=backend -- --run src/engine/__tests__/director-ai.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/engine/director-ai.ts backend/src/engine/__tests__/director-ai.test.ts
git commit -m "feat: add selectNextSkeleton to Director AI"
```

---

## Phase C: Layer 1 Skeletons & Integration

### Task 11: Write Layer 1 skeletons

**Files:**
- Create: `backend/src/skeletons/layer-1.ts`
- Create: `backend/src/skeletons/__tests__/skeleton-validation.test.ts`

- [ ] **Step 1: Create Layer 1 skeleton definitions**

Each skeleton maps to one of the 5 L1 node classifications. The `situationSeed` is abstract — the Narrator AI will contextualise it.

```typescript
// backend/src/skeletons/layer-1.ts

import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// L1 Skeleton 1: Competition pressure (bold + competitive path)
const L1_SK_1: ScenarioSkeleton = {
  id: "L1-node-1",
  layer: 1,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
  situationSeed:
    "It is your third week. A distributor offers a bulk order — but the quantity exceeds your current capacity. Fulfilling it means stretching your capital thin and hiring help you cannot yet afford. Declining means losing the opportunity to someone else.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + competitive",
      archetypeDescription:
        "Take the deal. Stretch your capital, hire temporary help, deliver on the deadline no matter the cost.",
      tensionAxis: "Speed vs. financial stability",
    },
    {
      eoPoleSignal: "measured + innovative",
      archetypeDescription:
        "Negotiate a smaller initial order that fits your current capacity. Prove yourself first, scale later.",
      tensionAxis: "Opportunity vs. risk management",
    },
    {
      eoPoleSignal: "conservative + autonomous",
      archetypeDescription:
        "Decline the bulk order and focus on building your local customer base directly.",
      tensionAxis: "Growth ambition vs. disciplined restraint",
    },
  ],
};

const L1_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -3_000,
    revenue: 2_000,
    debt: 0,
    monthlyBurn: 500,
    reputation: 10,
    networkStrength: 5,
    eoDeltas: { riskTaking: 2, proactiveness: 1, competitiveAggressiveness: 1 },
  },
  {
    capital: -1_000,
    revenue: 800,
    debt: 0,
    monthlyBurn: 100,
    reputation: 5,
    networkStrength: 8,
    eoDeltas: { proactiveness: 1, innovativeness: 1 },
  },
  {
    capital: 0,
    revenue: 300,
    debt: 0,
    monthlyBurn: 0,
    reputation: 3,
    networkStrength: 3,
    eoDeltas: { autonomy: 2, riskTaking: -1 },
  },
];

// L1 Skeleton 2: Opportunity timing (proactive but careful path)
const L1_SK_2: ScenarioSkeleton = {
  id: "L1-node-2",
  layer: 1,
  theme: "networking",
  baseWeight: 1.0,
  eoTargetDimensions: ["proactiveness", "riskTaking"],
  situationSeed:
    "A well-connected mentor figure at a networking event offers to introduce you to a potential investor. But the meeting is tomorrow, your pitch is not ready, and the investor has a reputation for being unforgiving with unprepared founders.",
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + risk-tolerant",
      archetypeDescription:
        "Take the meeting. Stay up all night preparing. An imperfect pitch in front of the right person beats a perfect pitch to an empty room.",
      tensionAxis: "Seizing opportunity vs. presenting your best self",
    },
    {
      eoPoleSignal: "proactive + measured",
      archetypeDescription:
        "Ask the mentor to delay the introduction by one week. Use the time to refine your pitch and research the investor.",
      tensionAxis: "Preparation vs. momentum",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline the introduction. You do not want to owe favours or depend on someone else's network this early.",
      tensionAxis: "Independence vs. leveraging help",
    },
  ],
};

const L1_SK_2_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: 8,
    networkStrength: 15,
    eoDeltas: { proactiveness: 2, riskTaking: 1 },
  },
  {
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: 5,
    networkStrength: 10,
    eoDeltas: { proactiveness: 1, innovativeness: 1 },
  },
  {
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: 0,
    networkStrength: -5,
    eoDeltas: { autonomy: 2, proactiveness: -1 },
  },
];

// L1 Skeleton 3: People-first dilemma (people-focused + independent path)
const L1_SK_3: ScenarioSkeleton = {
  id: "L1-node-3",
  layer: 1,
  theme: "hiring",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "innovativeness"],
  situationSeed:
    "A childhood friend who is struggling asks to join your business. They are loyal and hardworking but have no relevant skills. Bringing them on would slow you down in the short term but builds a team of people you trust. Saying no would protect your runway but damage a relationship.",
  choiceArchetypes: [
    {
      eoPoleSignal: "people-first + collaborative",
      archetypeDescription:
        "Bring them on. Train them yourself. Loyalty and trust are worth more than skills you can teach.",
      tensionAxis: "Relationships vs. efficiency",
    },
    {
      eoPoleSignal: "innovative + autonomous",
      archetypeDescription:
        "Offer them a specific project role with clear boundaries — help where they can, without derailing your core work.",
      tensionAxis: "Compassion vs. business discipline",
    },
    {
      eoPoleSignal: "profit-first + measured",
      archetypeDescription:
        "Be honest with them — you cannot afford to carry someone right now. Offer to revisit when the business is more stable.",
      tensionAxis: "Honesty vs. loyalty",
    },
  ],
};

const L1_SK_3_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -500,
    revenue: 0,
    debt: 0,
    monthlyBurn: 800,
    reputation: 5,
    networkStrength: 12,
    eoDeltas: { autonomy: -1, innovativeness: 1 },
    flags: { mentorAccess: false },
  },
  {
    capital: -200,
    revenue: 0,
    debt: 0,
    monthlyBurn: 300,
    reputation: 3,
    networkStrength: 8,
    eoDeltas: { innovativeness: 2, autonomy: 1 },
  },
  {
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: -2,
    networkStrength: -3,
    eoDeltas: { competitiveAggressiveness: 1, autonomy: 1 },
  },
];

// L1 Skeleton 4: Profit pressure (profit-focused + competitive path)
const L1_SK_4: ScenarioSkeleton = {
  id: "L1-node-4",
  layer: 1,
  theme: "financing",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "riskTaking"],
  situationSeed:
    "You discover that a competitor is selling a nearly identical product at 40% less. They are cutting corners on quality but customers do not seem to notice. Your price reflects honest work — but the market does not care about honesty when the cheaper option is right there.",
  choiceArchetypes: [
    {
      eoPoleSignal: "competitive + profit-first",
      archetypeDescription:
        "Match their price. Absorb the loss for now — you need market share more than margin at this stage.",
      tensionAxis: "Market share vs. sustainable pricing",
    },
    {
      eoPoleSignal: "innovative + proactive",
      archetypeDescription:
        "Differentiate. Add a visible quality guarantee or a feature the competitor cannot match. Compete on value, not price.",
      tensionAxis: "Innovation vs. market reality",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Hold your price and target a different customer segment that values quality over cost.",
      tensionAxis: "Conviction vs. market signals",
    },
  ],
};

const L1_SK_4_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -1_500,
    revenue: 1_200,
    debt: 0,
    monthlyBurn: 200,
    reputation: -3,
    networkStrength: 5,
    eoDeltas: { competitiveAggressiveness: 2, riskTaking: 1 },
  },
  {
    capital: -800,
    revenue: 500,
    debt: 0,
    monthlyBurn: 100,
    reputation: 8,
    networkStrength: 3,
    eoDeltas: { innovativeness: 2, proactiveness: 1 },
  },
  {
    capital: 0,
    revenue: 200,
    debt: 0,
    monthlyBurn: 0,
    reputation: 5,
    networkStrength: 0,
    eoDeltas: { autonomy: 2, competitiveAggressiveness: -1 },
  },
];

// L1 Skeleton 5: Independence crossroads (autonomous path)
const L1_SK_5: ScenarioSkeleton = {
  id: "L1-node-5",
  layer: 1,
  theme: "operations",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "proactiveness"],
  situationSeed:
    "An established business owner in your area offers a partnership: they provide workspace, equipment, and access to their customer base in exchange for 40% of your revenue. It would solve three problems at once — but you would be building inside someone else's house.",
  choiceArchetypes: [
    {
      eoPoleSignal: "collaborative + proactive",
      archetypeDescription:
        "Accept the partnership. The access and resources accelerate your timeline by months. You can renegotiate terms later once you have leverage.",
      tensionAxis: "Speed vs. ownership",
    },
    {
      eoPoleSignal: "autonomous + innovative",
      archetypeDescription:
        "Counter-propose a time-limited arrangement — three months, 20% revenue share, with a clean exit clause. Test the relationship without committing.",
      tensionAxis: "Pragmatism vs. independence",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline. Build slower with full ownership rather than faster with strings attached.",
      tensionAxis: "Control vs. opportunity cost",
    },
  ],
};

const L1_SK_5_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 0,
    revenue: 800,
    debt: 0,
    monthlyBurn: -300,
    reputation: 5,
    networkStrength: 10,
    eoDeltas: { proactiveness: 2, autonomy: -2 },
    flags: { hasPremises: true },
  },
  {
    capital: 0,
    revenue: 400,
    debt: 0,
    monthlyBurn: -100,
    reputation: 3,
    networkStrength: 5,
    eoDeltas: { innovativeness: 1, autonomy: 1 },
    flags: { hasPremises: true },
  },
  {
    capital: -500,
    revenue: 0,
    debt: 0,
    monthlyBurn: 200,
    reputation: 0,
    networkStrength: -2,
    eoDeltas: { autonomy: 3, proactiveness: -1 },
  },
];

// ── Registration ─────────────────────────────────────────────────────────────

export function registerLayer1(): void {
  registerSkeleton({ skeleton: L1_SK_1, effects: L1_SK_1_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_2, effects: L1_SK_2_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_3, effects: L1_SK_3_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_4, effects: L1_SK_4_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_5, effects: L1_SK_5_EFFECTS });
}
```

- [ ] **Step 2: Write skeleton content validation tests**

```typescript
// backend/src/skeletons/__tests__/skeleton-validation.test.ts

import { describe, it, expect, beforeAll } from "vitest";
import { getAllSkeletons, getSkeletonEffect } from "../registry.js";
import { registerLayer1 } from "../layer-1.js";

beforeAll(() => {
  registerLayer1();
});

describe("Layer 1 skeleton content validation", () => {
  it("has exactly 5 Layer 1 skeletons", () => {
    const l1 = getAllSkeletons().filter((e) => e.skeleton.layer === 1);
    expect(l1).toHaveLength(5);
  });

  it("every skeleton has exactly 3 choice archetypes", () => {
    for (const entry of getAllSkeletons()) {
      expect(entry.skeleton.choiceArchetypes).toHaveLength(3);
    }
  });

  it("every skeleton has exactly 3 effects", () => {
    for (const entry of getAllSkeletons()) {
      expect(entry.effects).toHaveLength(3);
    }
  });

  it("every skeleton has a non-empty situationSeed", () => {
    for (const entry of getAllSkeletons()) {
      expect(entry.skeleton.situationSeed.length).toBeGreaterThan(20);
    }
  });

  it("every choice archetype has non-empty fields", () => {
    for (const entry of getAllSkeletons()) {
      for (const arch of entry.skeleton.choiceArchetypes) {
        expect(arch.eoPoleSignal.length).toBeGreaterThan(0);
        expect(arch.archetypeDescription.length).toBeGreaterThan(10);
        expect(arch.tensionAxis.length).toBeGreaterThan(0);
      }
    }
  });

  it("every effect has valid eoDeltas keys", () => {
    const validDims = new Set([
      "autonomy",
      "innovativeness",
      "riskTaking",
      "proactiveness",
      "competitiveAggressiveness",
    ]);
    for (const entry of getAllSkeletons()) {
      for (const effect of entry.effects) {
        for (const key of Object.keys(effect.eoDeltas)) {
          expect(validDims.has(key)).toBe(true);
        }
      }
    }
  });

  it("no L1 choice has all-positive effects", () => {
    for (const entry of getAllSkeletons()) {
      if (entry.skeleton.layer >= 1 && entry.skeleton.layer <= 4) {
        for (const effect of entry.effects) {
          const values = [
            effect.capital, effect.revenue, effect.debt,
            effect.monthlyBurn, effect.reputation, effect.networkStrength,
          ];
          const eoDeltaValues = Object.values(effect.eoDeltas);
          const allPositive =
            values.every((v) => v >= 0) && eoDeltaValues.every((v) => v >= 0);
          // At least one cost somewhere
          expect(allPositive).toBe(false);
        }
      }
    }
  });

  it("getSkeletonEffect returns correct effect for each choice index", () => {
    for (const entry of getAllSkeletons()) {
      for (const idx of [0, 1, 2] as const) {
        const effect = getSkeletonEffect(entry.skeleton.id, idx);
        expect(effect).toEqual(entry.effects[idx]);
      }
    }
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test --workspace=backend -- --run src/skeletons/__tests__/skeleton-validation.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/skeletons/layer-1.ts backend/src/skeletons/__tests__/skeleton-validation.test.ts
git commit -m "feat: Layer 1 skeletons — 5 EO-valid scenario structures"
```

---

### Task 12: Initialise skeleton registry in app startup

**Files:**
- Create: `backend/src/skeletons/init.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create init module**

```typescript
// backend/src/skeletons/init.ts

import { registerLayer1 } from "./layer-1.js";

/**
 * Registers all skeleton layers. Called once at app startup.
 * Add registerLayer2(), registerLayer3(), etc. as content is written.
 */
export function initSkeletonRegistry(): void {
  registerLayer1();
  // registerLayer2();
  // registerLayer3();
  // registerLayer4();
  // registerLayer5();
}
```

- [ ] **Step 2: Call init in app.ts**

At the top of `buildApp`, before route registration:

```typescript
import { initSkeletonRegistry } from "./skeletons/init.js";

export async function buildApp(
  store: ISessionStore,
  opts?: BuildAppOptions
): Promise<FastifyInstance> {
  // Ensure skeleton registry is populated before routes are registered
  initSkeletonRegistry();
  // ... rest of buildApp
}
```

- [ ] **Step 3: Run full test suite**

Run: `npm test --workspace=backend`

Expected: All tests pass. Old scenario-registry tests may need updating or deletion.

- [ ] **Step 4: Commit**

```bash
git add backend/src/skeletons/init.ts backend/src/app.ts
git commit -m "feat: initialise skeleton registry at app startup"
```

---

### Task 13: Clean up old scenario-registry

**Files:**
- Delete: `backend/src/scenario-registry.ts`
- Delete: `backend/src/__tests__/content-validation.test.ts`
- Modify: any remaining imports

**Precondition:** All tests pass with the new skeleton registry wired in.

- [ ] **Step 1: Search for all imports of scenario-registry**

Run: `grep -r "scenario-registry" backend/src/`

- [ ] **Step 2: Update or remove each import**

Replace references to `getNode`, `getChoiceEffect`, `getAllNodes`, `toClientNode` with skeleton registry equivalents.

- [ ] **Step 3: Delete old files**

```bash
rm backend/src/scenario-registry.ts
rm backend/src/__tests__/content-validation.test.ts
```

- [ ] **Step 4: Run full test suite + type-check**

Run: `npm run type-check --workspace=backend && npm test --workspace=backend`

Expected: PASS — no orphan imports, all tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove old scenario-registry, replaced by skeleton registry"
```

---

### Task 14: Update frontend for two-step Layer 0

**Files:**
- Modify: `frontend/src/context/GameContext.tsx`
- Modify: `frontend/src/app/layer0/page.tsx`
- Modify: `frontend/src/lib/api.ts`

This task updates the frontend to:
1. Display the preamble as the first viewport
2. Show Q1 on scroll
3. Submit Q1, receive AI-generated Q2
4. Show Q2, submit Q2, receive Layer 1 assignment

- [ ] **Step 1: Update API client**

Add two new methods to the API client:

```typescript
// In frontend/src/lib/api.ts

async classifyQ1(sessionId: string, q1Response: string): Promise<{ q2Prompt: string }> {
  const res = await this.post("/classify-q1", { sessionId, q1Response });
  return res;
},

async classifyQ2(sessionId: string, q2Response: string): Promise<{ layer1NodeId: string }> {
  const res = await this.post("/classify-q2", { sessionId, q2Response });
  return res;
},
```

- [ ] **Step 2: Update GameContext**

Replace `classifyLayer0` with `submitQ1` and `submitQ2`:

```typescript
submitQ1: async (q1Response: string) => Promise<string>; // returns q2Prompt
submitQ2: async (q2Response: string) => Promise<void>;   // triggers layer 1
```

- [ ] **Step 3: Redesign Layer 0 page as two-view scroll**

The page structure:

```
View 1 (fills viewport):
  - Preamble text — full-screen narrative
  - Scroll indicator at bottom

View 2 (revealed on scroll):
  - Q1 prompt + textarea + submit
  - After Q1 submit → Q2 prompt appears below (AI-generated)
  - Q2 textarea + submit
  - After Q2 submit → redirect to loading → play
```

- [ ] **Step 4: Run frontend type-check**

Run: `npm run type-check --workspace=frontend`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/context/GameContext.tsx frontend/src/app/layer0/page.tsx
git commit -m "feat: two-view Layer 0 — preamble viewport + two-step classify"
```

---

## Dependency Graph

```
Task 1 (PlayerContext type)
  └→ Task 2 (WorldState update)
       └→ Task 3 (API types)
            ├→ Task 4 (start route + preamble)
            └→ Task 5 (two-step classify)
                 └→ Task 6 (skeleton types)
                      └→ Task 7 (Narrator AI)
                           └→ Task 8 (skeleton registry)
                                └→ Task 9 (wire into choice route)
                                     └→ Task 10 (Director AI adapter)
                                          └→ Task 11 (Layer 1 content)
                                               └→ Task 12 (init + app wiring)
                                                    └→ Task 13 (cleanup old registry)
                                                         └→ Task 14 (frontend update)
```

---

## Decisions Flagged for Davis

1. **Two-step vs. single classify call** — Plan recommends two-step (`/classify-q1` → Q2 → `/classify-q2`). More natural for the scroll UI. Davis to confirm.

2. **"Write your own" choice (choiceIndex 3)** — The plan adds the type but does not implement the Narrator AI handling for free-text choices yet. This is a separate task once L1–L5 skeletons are written.

3. **Director AI adapter** — Task 10 duplicates condition-checking logic from `passesConditions`. Davis may prefer refactoring `passesConditions` to accept a generic conditions object instead.

4. **Old scenario-registry deletion** — Task 13 deletes it entirely. If Davis wants to keep it as a reference during content migration, we can defer deletion.

5. **Sector removal** — `BusinessSector` type is removed from WorldState. The player's business is now free-form text in `PlayerContext`. Frontend HUD shows `playerBusinessName` instead.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Narrator AI returns incoherent skin | Medium | High | `buildFallbackSkin` always produces valid output; validate JSON shape before using |
| Q2 generation is too generic | Medium | Medium | Tune Q2 prompt; add examples of good Q2s in system prompt |
| Type errors cascade during migration | High | Low | Each task runs type-check; errors are expected and tracked |
| Token costs increase significantly | Medium | Low | Using Haiku, ~600 tokens per skin; ~5 skins per game = ~3000 extra tokens |
| Old tests break during registry swap | High | Low | Task 13 only runs after all new tests pass |
