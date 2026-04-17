import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import type {
  NarrativeSkin,
  ScenarioSkeleton,
  SessionResponse,
} from "@hatchquest/shared";
import type { ChoiceEffect } from "../../engine/apply-choice.js";
import type { NarrationWorldContext } from "../../engine/narrator-ai.js";
import { sessionRoutes } from "../session.js";
import type { GenerateSkinFn } from "../choice.js";
import { SessionStore } from "../../store/session-store.js";
import type { RegisteredSkeleton } from "../../skeletons/registry.js";

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

const EFFECT: ChoiceEffect = {
  capital: 0,
  revenue: 0,
  debt: 0,
  monthlyBurn: 0,
  reputation: 0,
  networkStrength: 0,
  eoDeltas: {},
};

const SKELETON: ScenarioSkeleton = {
  id: "L1-node-1",
  layer: 1,
  theme: "competition",
  baseWeight: 1,
  eoTargetDimensions: ["riskTaking"],
  narrativePattern: "test",
  situationSeed: "A rival is quietly targeting the same customer segment.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk",
      archetypeDescription: "Move fast and spend to stay ahead.",
      tensionAxis: "speed vs capital",
    },
    {
      eoPoleSignal: "measured",
      archetypeDescription: "Slow down and protect cash.",
      tensionAxis: "stability vs momentum",
    },
    {
      eoPoleSignal: "network",
      archetypeDescription: "Bring partners in to share the pressure.",
      tensionAxis: "control vs support",
    },
  ],
};

const REGISTERED: RegisteredSkeleton = {
  skeleton: SKELETON,
  effects: [EFFECT, EFFECT, EFFECT],
};

function buildApp(store: SessionStore, generateSkin?: GenerateSkinFn): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(sessionRoutes, {
    store,
    getNode: (id: string | null) => (id === "L1-node-1" ? STUB_NODE : null),
    getSkeleton: (id: string) => (id === "L1-node-1" ? REGISTERED : null),
    generateSkin,
  });
  return app;
}

async function createOpeningSession(store: SessionStore): Promise<string> {
  const session = await store.createSession("Ama", "ama@example.com");
  await store.updateSession(session.id, {
    playerContext: {
      businessLabel: "Market Ops App",
      businessSummary: "a software venture helping small businesses run operations with more control",
      businessDescription:
        "a software venture helping small businesses run operations with more control",
      motivation: "To solve an obvious market problem and turn it into a lasting venture.",
      founderEdge: "Fast-moving operator under pressure",
    },
    storyMemory: {
      lastBeatSummary: "You answered an early supplier disruption with a decisive operational response.",
      openThread: "the unresolved supplier disruption",
      continuityAnchor: "supplier disruption still threatening your first momentum",
      recentDecisionStyle: "decisive operational response",
      currentArc: "First Market Test",
    },
    worldState: {
      ...session.worldState,
      layer: 1,
      currentNodeId: "L1-node-1",
      sector: "tech",
      businessDescription:
        "a software venture helping small businesses run operations with more control",
      playerContext: {
        businessLabel: "Market Ops App",
        businessSummary: "a software venture helping small businesses run operations with more control",
        businessDescription:
          "a software venture helping small businesses run operations with more control",
        motivation: "To solve an obvious market problem and turn it into a lasting venture.",
        founderEdge: "Fast-moving operator under pressure",
      },
      storyMemory: {
        lastBeatSummary: "You answered an early supplier disruption with a decisive operational response.",
        openThread: "the unresolved supplier disruption",
        continuityAnchor: "supplier disruption still threatening your first momentum",
        recentDecisionStyle: "decisive operational response",
        currentArc: "First Market Test",
      },
      currentNodeContent: null,
    },
  });
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
  it("returns 200 with clientState for a known sessionId", async () => {
    const sessionId = await createOpeningSession(store);

    const res = await app.inject({ method: "GET", url: `/session/${sessionId}` });

    expect(res.statusCode).toBe(200);
    expect(res.json<SessionResponse>().sessionId).toBe(sessionId);
  });

  it("returns 404 for an unknown sessionId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/session/00000000-0000-0000-0000-000000000000",
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns the cached generated node on resume without regenerating it", async () => {
    const sessionId = await createOpeningSession(store);
    const cachedSkin: NarrativeSkin = {
      narrative:
        "Two days after supplier disruption still threatening your first momentum, the unresolved supplier disruption is still closing in on Market Ops App.",
      choices: ["Choice 1", "Choice 2", "Choice 3"],
      tensionHints: ["hint 1", "hint 2", "hint 3"],
    };

    await store.updateSession(sessionId, {
      generatedCurrentNode: cachedSkin,
      generatedCurrentNodeId: "L1-node-1",
      generatedCurrentNodeCreatedAt: new Date().toISOString(),
      narrationSource: "fallback",
      worldState: {
        ...(await store.getSession(sessionId))!.worldState,
        currentNodeContent: null,
      },
    });

    const skinSpy = vi.fn<GenerateSkinFn>().mockResolvedValue([
      {
        narrative: "SHOULD_NOT_RUN",
        choices: ["x", "y", "z"],
        tensionHints: ["a", "b", "c"],
      },
      "fallback",
    ]);
    const cachedApp = buildApp(store, skinSpy);
    await cachedApp.ready();

    const res = await cachedApp.inject({ method: "GET", url: `/session/${sessionId}` });

    expect(res.statusCode).toBe(200);
    expect(skinSpy).not.toHaveBeenCalled();
    expect(res.json<SessionResponse>().currentNode?.narrative).toBe(cachedSkin.narrative);
  });

  it("uses first-turn continuity context when a legacy opening session needs regeneration", async () => {
    const sessionId = await createOpeningSession(store);
    const skinSpy = vi.fn<GenerateSkinFn>().mockResolvedValue([
      {
        narrative: "Two days after the supplier disruption, the next pressure lands.",
        choices: ["c1", "c2", "c3"],
        tensionHints: ["h1", "h2", "h3"],
      },
      "fallback",
    ]);
    const skinnedApp = buildApp(store, skinSpy);
    await skinnedApp.ready();

    const res = await skinnedApp.inject({ method: "GET", url: `/session/${sessionId}` });

    expect(res.statusCode).toBe(200);
    expect(skinSpy).toHaveBeenCalledOnce();
    const worldCtx = skinSpy.mock.calls[0][2] as NarrationWorldContext;
    expect(worldCtx.isFirstScenarioTurn).toBe(true);
    expect(worldCtx.businessSummary).toContain("software venture");
    expect(worldCtx.storyMemory?.continuityAnchor).toContain("supplier disruption");
  });
});
