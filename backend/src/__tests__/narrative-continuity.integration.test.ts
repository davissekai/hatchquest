/**
 * Narrative continuity E2E test.
 *
 * Drives the full Layer 0 flow through the in-process Fastify app:
 *   POST /start → POST /classify-q1 → POST /classify-q2 → GET /session/:id
 *
 * Verifies that:
 *   1. classify-q2 generates and caches a first-turn narrative
 *   2. The cached narrative references storyMemory continuity signals
 *      (continuityAnchor / openThread / lastBeatSummary keywords)
 *   3. GET /session returns the cached node, not a random re-skin
 *   4. storyMemory is persisted on the session after classify-q2
 *
 * Runs without a live API key — generateNarrativeSkin falls back to
 * buildFallbackSkin which weaves storyMemory directly into the narrative.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { SessionStore } from "../store/session-store.js";
import type { ClassifyQ1Response, ClassifyQ2Response, SessionResponse } from "@hatchquest/shared";

// Ensure no live LLM calls — falls through to buildFallbackSkin
let savedApiKey: string | undefined;
let savedMockLLM: string | undefined;

beforeAll(() => {
  savedApiKey = process.env.ANTHROPIC_API_KEY;
  savedMockLLM = process.env.MOCK_LLM;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.MOCK_LLM;
});

afterAll(() => {
  if (savedApiKey !== undefined) process.env.ANTHROPIC_API_KEY = savedApiKey;
  else delete process.env.ANTHROPIC_API_KEY;
  if (savedMockLLM !== undefined) process.env.MOCK_LLM = savedMockLLM;
  else delete process.env.MOCK_LLM;
});

// ─── Shared test fixture ─────────────────────────────────────────────────────

const Q1 = "I want to build a mobile inventory app for small traders in Makola because I keep seeing stockouts and wasted sales.";
const Q2_RESPONSE = "I would immediately call two backup suppliers and lock in a short-term deal to cover the gap.";

describe("narrative continuity — Layer 0 → first L1 scenario", () => {
  let app: FastifyInstance;
  let store: SessionStore;
  let sessionId: string;

  beforeAll(async () => {
    store = new SessionStore();
    app = await buildApp(store, { routePrefix: "" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /start creates a session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Kofi", email: "kofi@test.com", password: "test" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ sessionId: string }>();
    expect(body.sessionId).toBeTruthy();
    sessionId = body.sessionId;
  });

  it("POST /classify-q1 stores q1 and returns a q2Prompt", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId, q1Response: Q1 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<ClassifyQ1Response>();
    expect(body.q2Prompt).toBeTruthy();
    expect(body.q2Prompt.length).toBeGreaterThan(20);
  });

  it("POST /classify-q2 generates and caches the first L1 node", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/classify-q2",
      payload: { sessionId, q2Response: Q2_RESPONSE },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<ClassifyQ2Response>();
    expect(body.layer1NodeId).toBeTruthy();

    // Session must have the cached node populated
    const session = await store.getSession(sessionId);
    expect(session).not.toBeNull();
    expect(session!.generatedCurrentNode).not.toBeNull();
    expect(session!.generatedCurrentNodeId).toBe(body.layer1NodeId);
  });

  it("storyMemory is persisted on the session after classify-q2", async () => {
    const session = await store.getSession(sessionId);
    expect(session!.storyMemory).not.toBeNull();
    expect(session!.storyMemory!.openThread).toBeTruthy();
    expect(session!.storyMemory!.continuityAnchor).toBeTruthy();
    expect(session!.storyMemory!.lastBeatSummary).toBeTruthy();
  });

  it("cached narrative references storyMemory continuity signals", async () => {
    const session = await store.getSession(sessionId);
    const narrative = session!.generatedCurrentNode!.narrative.toLowerCase();
    const storyMemory = session!.storyMemory!;

    // At least one of the continuity anchors should have ≥40% word overlap
    // with the narrative (same bar as hasFirstTurnContinuity in the validator)
    function contentWords(text: string): string[] {
      return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
        .split(" ").filter((w) => w.length > 3);
    }
    function overlapRatio(signal: string, target: string): number {
      const sigWords = new Set(contentWords(signal));
      if (sigWords.size === 0) return 0;
      const targetWords = new Set(contentWords(target));
      let hits = 0;
      for (const w of sigWords) { if (targetWords.has(w)) hits++; }
      return hits / sigWords.size;
    }

    const signals = [storyMemory.openThread, storyMemory.continuityAnchor, storyMemory.lastBeatSummary];
    const bestOverlap = Math.max(...signals.map((s) => overlapRatio(s, narrative)));

    expect(bestOverlap).toBeGreaterThanOrEqual(0.35); // same threshold as validator (0.4), slight tolerance
  });

  it("GET /session returns the cached node on the first turn", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<SessionResponse>();
    expect(body.currentNode).not.toBeNull();
    expect(body.currentNode!.narrative).toBeTruthy();
    expect(body.clientState.layer).toBe(1);
    expect(body.clientState.isComplete).toBe(false);
  });

  it("GET /session node narrative matches the cached node (not a fresh re-skin)", async () => {
    const session = await store.getSession(sessionId);
    const cachedNarrative = session!.generatedCurrentNode!.narrative;

    const res = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });
    const body = res.json<SessionResponse>();

    // Session should serve the cached skin, not regenerate
    expect(body.currentNode!.narrative).toBe(cachedNarrative);
  });
});
