/**
 * Game loop integration tests — all routes wired together with the real registry.
 *
 * These tests exercise the full request lifecycle:
 *   POST /start → POST /classify → POST /choice × 5 → GET /results
 *
 * They use a deterministic node selector (first eligible node in the next
 * layer) so results are repeatable without seeding the PRNG.
 *
 * They do NOT mock the registry — real nodes mean real effect application,
 * catching calibration bugs that pure route unit tests cannot reach.
 *
 * Migration note: These tests use the old scenario-registry while the skeleton
 * registry is being populated (Tasks 11–12). The adapter functions below bridge
 * old ScenarioNodeFull entries into RegisteredSkeleton shape so the choice route
 * can skin them. This adapter is removed in Task 13 when migration is complete.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";
import { SessionStore } from "../../store/session-store.js";
import { getNode, getChoiceEffect, getNodesForLayer } from "../../scenario-registry.js";
import { buildFallbackSkin } from "../../engine/narrator-ai.js";
import type { WorldState, ChoiceResponse, ResultsResponse } from "@hatchquest/shared";
import type { RegisteredSkeleton } from "../../skeletons/registry.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Deterministic Director AI for tests — always selects the first available
 * node in the next layer. Eliminates PRNG variance, so tests are repeatable.
 */
function deterministicSelector(state: WorldState): string | null {
  const nextLayer = state.layer + 1;
  const pool = getNodesForLayer(nextLayer);
  return pool[0]?.id ?? null;
}

/**
 * Adapter — wraps an old ScenarioNodeFull as a RegisteredSkeleton so the
 * choice route can use the skeleton path with old registry content.
 * Removed in Task 13 when the skeleton registry is fully populated.
 */
function skeletonFromOldNode(id: string): RegisteredSkeleton | null {
  const node = getNode(id);
  if (!node) return null;
  const e0 = getChoiceEffect(node.id, 0);
  const e1 = getChoiceEffect(node.id, 1);
  const e2 = getChoiceEffect(node.id, 2);
  if (!e0 || !e1 || !e2) return null;
  return {
    skeleton: {
      id: node.id,
      layer: node.layer,
      theme: "general",
      baseWeight: 1.0,
      eoTargetDimensions: [],
      situationSeed: node.narrative,
      choiceArchetypes: [
        { eoPoleSignal: "", archetypeDescription: node.choices[0].text, tensionAxis: node.choices[0].tensionHint },
        { eoPoleSignal: "", archetypeDescription: node.choices[1].text, tensionAxis: node.choices[1].tensionHint },
        { eoPoleSignal: "", archetypeDescription: node.choices[2].text, tensionAxis: node.choices[2].tensionHint },
      ],
    },
    effects: [e0, e1, e2],
  };
}

/** Builds a Fastify app with all routes, deterministic selector, and no route prefix. */
async function buildTestApp(store: SessionStore): Promise<FastifyInstance> {
  return buildApp(store, {
    routePrefix: "",
    selectNextNodeId: deterministicSelector,
    getSkeleton: skeletonFromOldNode,
    generateSkin: (skeleton, context) => Promise.resolve(buildFallbackSkin(skeleton, context)),
  });
}

/** Creates a session and returns its sessionId. */
async function startSession(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/start",
    payload: { playerName: "Kwame", email: "kwame@test.com", password: "hunter2" },
  });
  return res.json<{ sessionId: string }>().sessionId;
}

/**
 * Runs classify on a session — advances it to Layer 1.
 * Returns the layer1NodeId from the response.
 */
async function classifySession(
  app: FastifyInstance,
  sessionId: string
): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/classify",
    payload: {
      sessionId,
      response: "I want to build a solar kiosk network in Accra.",
    },
  });
  return res.json<{ layer1NodeId: string }>().layer1NodeId;
}

/**
 * Makes a single choice and returns the response body.
 * choiceIndex defaults to 0 for deterministic traversal.
 */
async function makeChoice(
  app: FastifyInstance,
  sessionId: string,
  nodeId: string,
  choiceIndex: 0 | 1 | 2 = 0
): Promise<ChoiceResponse> {
  const res = await app.inject({
    method: "POST",
    url: "/choice",
    payload: { sessionId, nodeId, choiceIndex },
  });
  return res.json<ChoiceResponse>();
}

/**
 * Plays through all 5 layers and returns the final ChoiceResponse.
 * Uses choice index 0 at every turn.
 */
async function playToCompletion(
  app: FastifyInstance,
  sessionId: string,
  startNodeId: string
): Promise<ChoiceResponse> {
  let currentNodeId = startNodeId;
  let lastResponse!: ChoiceResponse;

  for (let turn = 0; turn < 5; turn++) {
    lastResponse = await makeChoice(app, sessionId, currentNodeId, 0);
    currentNodeId = lastResponse.nextNode?.id ?? "";
  }

  return lastResponse;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

let store: SessionStore;
let app: FastifyInstance;

beforeEach(async () => {
  store = new SessionStore();
  app = await buildTestApp(store);
  await app.ready();
});

// ── Health check ──────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
  });
});

// ── Full game loop ─────────────────────────────────────────────────────────────

describe("full game loop — start → classify → 5 choices → results", () => {
  it("completes a full playthrough without errors", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);

    const finalTurn = await playToCompletion(app, sessionId, layer1NodeId);

    expect(finalTurn.clientState.isComplete).toBe(true);
    expect(finalTurn.clientState.turnsElapsed).toBe(5);
    expect(finalTurn.nextNode).toBeNull();
  });

  it("session layer increments by 1 each turn", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);

    // After classify we're at layer 1
    let currentNode = layer1NodeId;
    for (let expectedLayer = 2; expectedLayer <= 6; expectedLayer++) {
      const res = await makeChoice(app, sessionId, currentNode, 0);
      expect(res.clientState.layer).toBe(expectedLayer);
      currentNode = res.nextNode?.id ?? "";
    }
  });

  it("turnsElapsed increments by 1 each turn", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);

    let currentNode = layer1NodeId;
    for (let turn = 1; turn <= 5; turn++) {
      const res = await makeChoice(app, sessionId, currentNode, 0);
      expect(res.clientState.turnsElapsed).toBe(turn);
      currentNode = res.nextNode?.id ?? "";
    }
  });

  it("GET /results returns 200 after game completes", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);
    await playToCompletion(app, sessionId, layer1NodeId);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<ResultsResponse>();
    expect(body.sessionId).toBe(sessionId);
    expect(body.eoProfile).toBeDefined();
  });

  it("GET /results returns 409 before game completes", async () => {
    const sessionId = await startSession(app);
    await classifySession(app, sessionId);
    // Only play 2 turns — not complete

    const session = await store.getSession(sessionId);
    await makeChoice(app, sessionId, session!.worldState.currentNodeId!, 0);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    expect(res.statusCode).toBe(409);
  });
});

// ── EO profile validity ────────────────────────────────────────────────────────

describe("EO profile after game completion", () => {
  it("all 5 EO dimensions are present in results", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);
    await playToCompletion(app, sessionId, layer1NodeId);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    const { eoProfile } = res.json<ResultsResponse>();
    expect(eoProfile).toHaveProperty("autonomy");
    expect(eoProfile).toHaveProperty("innovativeness");
    expect(eoProfile).toHaveProperty("riskTaking");
    expect(eoProfile).toHaveProperty("proactiveness");
    expect(eoProfile).toHaveProperty("competitiveAggressiveness");
  });

  it("all EO dimension values are in [0, 10]", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);
    await playToCompletion(app, sessionId, layer1NodeId);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    const { eoProfile } = res.json<ResultsResponse>();
    for (const [dim, value] of Object.entries(eoProfile)) {
      expect(value, `${dim} out of [0,10] range`).toBeGreaterThanOrEqual(0);
      expect(value, `${dim} out of [0,10] range`).toBeLessThanOrEqual(10);
    }
  });

  it("eoProfile is not in clientState during gameplay", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);

    const choiceRes = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: layer1NodeId, choiceIndex: 0 },
    });

    expect(choiceRes.json().clientState).not.toHaveProperty("eoProfile");
  });

  it("eoProfile is not in GET /session response", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);

    const sessionRes = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });

    expect(sessionRes.json().clientState).not.toHaveProperty("eoProfile");
    // The full worldState (with eoProfile) must not leak through any field
    expect(JSON.stringify(sessionRes.json())).not.toContain("eoProfile");
  });
});

// ── Effect application ─────────────────────────────────────────────────────────

describe("choice effects are applied to world state", () => {
  it("capital changes after a choice with a capital effect", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);

    // Get the starting capital before the first choice
    const sessionBefore = await store.getSession(sessionId);
    const capitalBefore = sessionBefore!.worldState.capital;

    // L1-node-1, choice 0 has capital: -3000 (from registry)
    const choiceRes = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: layer1NodeId, choiceIndex: 0 },
    });

    expect(choiceRes.statusCode).toBe(200);
    // Capital should have changed (either up or down depending on choice)
    const capitalAfter = choiceRes.json<ChoiceResponse>().clientState.capital;
    expect(capitalAfter).not.toBe(capitalBefore);
  });

  it("choice 0 and choice 2 on the same node produce different world states", async () => {
    // Session 1 — choice 0
    const sessionId1 = await startSession(app);
    const nodeId1 = await classifySession(app, sessionId1);
    const res0 = await makeChoice(app, sessionId1, nodeId1, 0);

    // Session 2 — choice 2
    const sessionId2 = await startSession(app);
    const nodeId2 = await classifySession(app, sessionId2);
    const res2 = await makeChoice(app, sessionId2, nodeId2, 2);

    // Capital should differ between choice 0 and choice 2
    expect(res0.clientState.capital).not.toBe(res2.clientState.capital);
  });
});

// ── Double-submit guard ────────────────────────────────────────────────────────

describe("double-submit guard", () => {
  it("returns 409 on the second identical choice (session already advanced)", async () => {
    const sessionId = await startSession(app);
    const layer1NodeId = await classifySession(app, sessionId);

    // First choice — valid
    await makeChoice(app, sessionId, layer1NodeId, 0);

    // Second choice with the same (now stale) nodeId — should fail
    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: layer1NodeId, choiceIndex: 0 },
    });

    // The session has advanced — nodeId no longer matches currentNodeId
    expect(res.statusCode).toBe(400);
  });
});
