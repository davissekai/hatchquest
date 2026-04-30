/**
 * Divergence proof — verifies that two players with opposing EO profiles traverse
 * different paths through the 10-layer arc and end with meaningfully different posteriors.
 *
 * Profile A (seed=42): risk-tolerant, profit-focused, aggressive competitor.
 * Profile B (seed=99): risk-averse, people-focused, collaborative.
 *
 * A properly calibrated engine must produce:
 *   - ≥1 different nodeId visited across L2–L9
 *   - final EO posteriors differing by ≥1.5 on ≥2 dimensions
 *
 * Uses MOCK_LLM=1 for deterministic narration so tests run without an API key.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { SessionStore } from "../store/session-store.js";
import type { WorldState, EODimension, ChoiceResponse, ResultsResponse } from "@hatchquest/shared";
import { getAllSkeletons, getSkeleton } from "../skeletons/registry.js";
import { createPRNG } from "../engine/prng.js";
import { selectNextSkeleton } from "../engine/director-ai.js";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ─── MOCK_LLM setup ──────────────────────────────────────────────────────────

let originalMockLLM: string | undefined;

beforeAll(() => {
  originalMockLLM = process.env.MOCK_LLM;
  process.env.MOCK_LLM = "1";
});

afterAll(() => {
  if (originalMockLLM === undefined) {
    delete process.env.MOCK_LLM;
  } else {
    process.env.MOCK_LLM = originalMockLLM;
  }
});

// ─── EO profiles ─────────────────────────────────────────────────────────────

/** Risk-tolerant, profit-focused, competitively aggressive founder. */
const PROFILE_A_EO: Record<EODimension, number> = {
  autonomy: 3,
  innovativeness: 6,
  riskTaking: 9,
  proactiveness: 8,
  competitiveAggressiveness: 9,
};

/** Risk-averse, people-focused, collaborative founder. */
const PROFILE_B_EO: Record<EODimension, number> = {
  autonomy: 8,
  innovativeness: 5,
  riskTaking: 2,
  proactiveness: 3,
  competitiveAggressiveness: 2,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Production-like Director AI for divergence tests — uses the real skeleton pool
 * with EO-affinity weighting, seeded from WorldState.seed for reproducibility.
 */
function productionLikeSelector(state: WorldState): string | null {
  const rng = createPRNG(state.seed ^ state.turnsElapsed);
  const next = selectNextSkeleton(state, getAllSkeletons(), rng);
  return next?.skeleton.id ?? null;
}

const EO_DIMENSIONS: EODimension[] = [
  "autonomy",
  "innovativeness",
  "riskTaking",
  "proactiveness",
  "competitiveAggressiveness",
];

/**
 * Picks the choice index whose eoDeltas best align with the given EO profile.
 * Alignment = dot product of (delta direction × profile deviation from neutral 5).
 * Falls back to choice 0 if all effects are neutral.
 */
function pickMostAligned(
  effects: [ChoiceEffect, ChoiceEffect, ChoiceEffect],
  eoProfile: Record<EODimension, number>
): 0 | 1 | 2 {
  const scores = effects.map((effect) => {
    let score = 0;
    for (const dim of EO_DIMENSIONS) {
      const delta = effect.eoDeltas[dim] ?? 0;
      const deviation = eoProfile[dim] - 5;
      score += delta * deviation;
    }
    return score;
  });

  const maxScore = Math.max(...scores);
  const bestIdx = scores.indexOf(maxScore);
  return (bestIdx >= 0 ? bestIdx : 0) as 0 | 1 | 2;
}

/** Builds a Fastify app with the production-like selector, no route prefix. */
async function buildTestApp(store: SessionStore): Promise<FastifyInstance> {
  return buildApp(store, {
    routePrefix: "",
    selectNextNodeId: productionLikeSelector,
  });
}

/** Creates a session advanced to Layer 1, with a fixed seed + EO profile. */
async function createSeededSession(
  store: SessionStore,
  app: FastifyInstance,
  seed: number,
  eoProfile: Record<EODimension, number>
): Promise<{ sessionId: string; layer1NodeId: string }> {
  const startRes = await app.inject({
    method: "POST",
    url: "/start",
    payload: { playerName: "Test", email: "test@test.com", password: "test" },
  });
  const { sessionId } = startRes.json<{ sessionId: string }>();

  const classifyRes = await app.inject({
    method: "POST",
    url: "/classify",
    payload: { sessionId, response: "I want to build a business in Accra." },
  });
  const { layer1NodeId } = classifyRes.json<{ layer1NodeId: string }>();

  // Patch session with desired seed and EO profile
  const session = await store.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  await store.updateSession(sessionId, {
    worldState: { ...session.worldState, seed, eoProfile },
  });

  return { sessionId, layer1NodeId };
}

/**
 * Plays a full arc aligned to the given EO profile.
 * Returns the list of visited node IDs and the final EO profile from results.
 */
async function playAligned(
  store: SessionStore,
  app: FastifyInstance,
  sessionId: string,
  startNodeId: string,
  eoProfile: Record<EODimension, number>
): Promise<{ visitedNodes: string[]; finalEOProfile: Record<EODimension, number> }> {
  const visitedNodes: string[] = [startNodeId];
  let currentNodeId = startNodeId;

  for (let turn = 0; turn < 10; turn++) {
    const session = await store.getSession(sessionId);
    if (!session || session.worldState.isComplete) break;

    const entry = getSkeleton(currentNodeId);
    if (!entry) break;

    const choiceIndex = pickMostAligned(entry.effects, eoProfile);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: currentNodeId, choiceIndex },
    });

    const body = res.json<ChoiceResponse>();
    if (body.nextNode) {
      currentNodeId = body.nextNode.id;
      visitedNodes.push(currentNodeId);
    }
    if (body.clientState.isComplete) break;
  }

  const resultsRes = await app.inject({ method: "GET", url: `/results/${sessionId}` });
  const { eoProfile: finalEO } = resultsRes.json<ResultsResponse>();
  return { visitedNodes, finalEOProfile: finalEO };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

let storeA: SessionStore;
let storeB: SessionStore;
let appA: FastifyInstance;
let appB: FastifyInstance;

beforeEach(async () => {
  storeA = new SessionStore();
  storeB = new SessionStore();
  appA = await buildTestApp(storeA);
  appB = await buildTestApp(storeB);
  await appA.ready();
  await appB.ready();
});

describe("divergence proof — Profile A vs Profile B", () => {
  it("two opposing profiles visit at least 1 different node across L2–L9", async () => {
    const { sessionId: sidA, layer1NodeId: l1A } = await createSeededSession(
      storeA,
      appA,
      42,
      PROFILE_A_EO
    );
    const { sessionId: sidB, layer1NodeId: l1B } = await createSeededSession(
      storeB,
      appB,
      99,
      PROFILE_B_EO
    );

    const { visitedNodes: nodesA } = await playAligned(storeA, appA, sidA, l1A, PROFILE_A_EO);
    const { visitedNodes: nodesB } = await playAligned(storeB, appB, sidB, l1B, PROFILE_B_EO);

    // Compare nodes at L2–L9 (indices 1–8 in the visited list)
    const l2ToL9A = nodesA.slice(1, 9);
    const l2ToL9B = nodesB.slice(1, 9);

    const sharedLength = Math.min(l2ToL9A.length, l2ToL9B.length);
    const diffCount = Array.from({ length: sharedLength }, (_, i) => l2ToL9A[i] !== l2ToL9B[i]).filter(
      Boolean
    ).length;

    expect(
      diffCount,
      `Expected ≥1 differing node across L2–L9. A: [${l2ToL9A.join(",")}] B: [${l2ToL9B.join(",")}]`
    ).toBeGreaterThanOrEqual(1);
  });

  it("final EO posteriors differ by ≥1.5 on ≥2 dimensions", async () => {
    const { sessionId: sidA, layer1NodeId: l1A } = await createSeededSession(
      storeA,
      appA,
      42,
      PROFILE_A_EO
    );
    const { sessionId: sidB, layer1NodeId: l1B } = await createSeededSession(
      storeB,
      appB,
      99,
      PROFILE_B_EO
    );

    const { finalEOProfile: eoA } = await playAligned(storeA, appA, sidA, l1A, PROFILE_A_EO);
    const { finalEOProfile: eoB } = await playAligned(storeB, appB, sidB, l1B, PROFILE_B_EO);

    const largeDiffs = EO_DIMENSIONS.filter((dim) => Math.abs(eoA[dim] - eoB[dim]) >= 1.5);

    expect(
      largeDiffs.length,
      `Expected ≥2 dims with |diff| ≥ 1.5. Got ${largeDiffs.length}. A: ${JSON.stringify(eoA)}, B: ${JSON.stringify(eoB)}`
    ).toBeGreaterThanOrEqual(2);
  });
});
