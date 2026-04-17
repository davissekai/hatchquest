import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { SessionStore } from "../../store/session-store.js";
import { sessionRoutes } from "../session.js";
import type {
  NarrativeSkin,
  ScenarioSkeleton,
  SessionResponse,
} from "@hatchquest/shared";
import type { RegisteredSkeleton } from "../../skeletons/registry.js";
import type { GenerateSkinFn } from "../choice.js";
import type { NarrationWorldContext } from "../../engine/narrator-ai.js";
import type { ChoiceEffect } from "../../engine/apply-choice.js";

// Minimal stub node returned when currentNodeId matches.
const STUB_NODE = {
  id: "L1-node-1",
  layer: 1,
  narrative: "A test scenario.",
  choices: [
    { index: 0 as const, text: "Option A", tensionHint: "hint A" },
    { index: 1 as const, text: "Option B", tensionHint: "hint B" },
    { index: 2 as const, text: "Option C", tensionHint: "hint C" },
  ],
};

// Build isolated Fastify app with injected store and registry stubs.
function buildApp(store: SessionStore): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(sessionRoutes, {
    store,
    getNode: (id: string | null) => (id === "L1-node-1" ? STUB_NODE : null),
  });
  return app;
}

// Create a session and set its currentNodeId to a known node.
async function seedSessionWithNode(store: SessionStore): Promise<string> {
  const session = await store.createSession("Ama", "ama@example.com");
  await store.updateSession(session.id, {
    worldState: { ...session.worldState, currentNodeId: "L1-node-1" },
  });
  return session.id;
}

// Create a session whose currentNodeId is still null (pre-classify state).
async function seedSessionNoNode(store: SessionStore): Promise<string> {
  const session = await store.createSession("Ama", "ama@example.com");
  // currentNodeId starts as null from createInitialWorldState — no override needed
  return session.id;
}

const savedApiKey = process.env.ANTHROPIC_API_KEY;

let store: SessionStore;
let app: FastifyInstance;

beforeEach(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  store = new SessionStore();
  app = buildApp(store);
  await app.ready();
});

afterEach(() => {
  if (savedApiKey !== undefined) {
    process.env.ANTHROPIC_API_KEY = savedApiKey;
  }
});

describe("GET /session/:sessionId", () => {
  // --- Happy path ---

  it("returns 200 with clientState for a known sessionId", async () => {
    const sessionId = await seedSessionWithNode(store);

    const res = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<SessionResponse>();
    expect(body.sessionId).toBe(sessionId);
    expect(body.clientState).toBeDefined();
  });

  it("returns currentNode when one exists", async () => {
    const sessionId = await seedSessionWithNode(store);

    const res = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });

    const body = res.json<SessionResponse>();
    expect(body.currentNode).not.toBeNull();
    expect(body.currentNode?.id).toBe("L1-node-1");
  });

  it("returns narrated currentNode text with world-state context", async () => {
    const sessionId = await seedSessionWithNode(store);

    const res = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });

    const body = res.json<SessionResponse>();
    expect(body.currentNode?.narrative).toContain("A test scenario.");
    expect(body.currentNode?.narrative).toContain("GHS 10,000");
  });

  // --- clientState does not leak server-only fields ---

  it("does not include eoProfile in clientState", async () => {
    const sessionId = await seedSessionWithNode(store);

    const res = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });

    const body = res.json();
    expect(body.clientState).not.toHaveProperty("eoProfile");
  });

  // --- Pre-classify state ---

  it("returns currentNode as null when currentNodeId is null (pre-classify)", async () => {
    const sessionId = await seedSessionNoNode(store);

    const res = await app.inject({
      method: "GET",
      url: `/session/${sessionId}`,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<SessionResponse>();
    expect(body.currentNode).toBeNull();
  });

  // --- Error cases ---

  it("returns 404 for an unknown sessionId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/session/00000000-0000-0000-0000-000000000000",
    });

    expect(res.statusCode).toBe(404);
  });
});

// ── L1-opening narration path — Item 1 plumbing ──────────────────────────
//
// When /session renders the L1 opening (layer=1, choiceHistory empty), it
// must route through the skin pipeline with isFirstScenarioTurn=true so
// the Narrator AI emits the time-bridge prefix referencing the player's
// business. On turn 2+ the flag must be false.

const FAKE_SKELETON: ScenarioSkeleton = {
  id: "L1-node-1",
  layer: 1,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking"],
  narrativePattern: "fake",
  situationSeed: "Fake seed.",
  choiceArchetypes: [
    { eoPoleSignal: "a", archetypeDescription: "A", tensionAxis: "t1" },
    { eoPoleSignal: "b", archetypeDescription: "B", tensionAxis: "t2" },
    { eoPoleSignal: "c", archetypeDescription: "C", tensionAxis: "t3" },
  ],
};

const FAKE_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
  { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
  { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
];

const FAKE_REGISTERED: RegisteredSkeleton = {
  skeleton: FAKE_SKELETON,
  effects: FAKE_EFFECTS,
};

function buildSkinnedApp(
  store: SessionStore,
  generateSkin: GenerateSkinFn
): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(sessionRoutes, {
    store,
    getNode: (id: string | null) =>
      id === "L1-node-1" ? STUB_NODE : null,
    getSkeleton: (id: string) =>
      id === "L1-node-1" ? FAKE_REGISTERED : null,
    generateSkin,
  });
  return app;
}

describe("GET /session/:sessionId — L1-opening narration", () => {
  it("calls generateSkin with isFirstScenarioTurn=true on the L1 opening", async () => {
    const skinSpy = vi.fn<GenerateSkinFn>().mockResolvedValue([
      {
        narrative: "SKINNED_L1_OPENING",
        choices: ["c1", "c2", "c3"],
        tensionHints: ["h1", "h2", "h3"],
      } satisfies NarrativeSkin,
      "fallback",
    ]);

    const s = new SessionStore();
    const session = await s.createSession("Ama", "ama@example.com");
    await s.updateSession(session.id, {
      worldState: {
        ...session.worldState,
        layer: 1,
        currentNodeId: "L1-node-1",
        businessDescription: "a mobile inventory app for small traders",
        sector: "tech",
      },
    });

    const skinnedApp = buildSkinnedApp(s, skinSpy);
    await skinnedApp.ready();

    const res = await skinnedApp.inject({
      method: "GET",
      url: `/session/${session.id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(skinSpy).toHaveBeenCalledOnce();
    const args = skinSpy.mock.calls[0];
    expect(args[0].id).toBe("L1-node-1");
    const worldCtx = args[2] as NarrationWorldContext;
    expect(worldCtx.isFirstScenarioTurn).toBe(true);
    expect(worldCtx.businessDescription).toBe(
      "a mobile inventory app for small traders"
    );
    expect(worldCtx.sector).toBe("tech");

    const body = res.json<SessionResponse>();
    expect(body.currentNode?.narrative).toBe("SKINNED_L1_OPENING");
  });

  it("does NOT invoke the skin pipeline once a choice has been applied", async () => {
    const skinSpy = vi.fn<GenerateSkinFn>().mockResolvedValue([
      {
        narrative: "SHOULD_NOT_BE_USED",
        choices: ["c1", "c2", "c3"],
        tensionHints: ["h1", "h2", "h3"],
      } satisfies NarrativeSkin,
      "fallback",
    ]);

    const s = new SessionStore();
    const session = await s.createSession("Ama", "ama@example.com");
    await s.updateSession(session.id, {
      worldState: {
        ...session.worldState,
        layer: 2,
        currentNodeId: "L1-node-1",
        businessDescription: "a mobile inventory app",
        sector: "tech",
        choiceHistory: [
          {
            nodeId: "L1-node-1",
            choiceLabel: "Prior choice",
            effectSummary: "no material change",
          },
        ],
      },
    });

    const skinnedApp = buildSkinnedApp(s, skinSpy);
    await skinnedApp.ready();

    const res = await skinnedApp.inject({
      method: "GET",
      url: `/session/${session.id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(skinSpy).not.toHaveBeenCalled();
    const body = res.json<SessionResponse>();
    // Deterministic fallback from narrateScenarioNode, not the skin stub
    expect(body.currentNode?.narrative).toContain("A test scenario.");
  });
});
