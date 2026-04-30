import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import type {
  NarrativeSkin,
  PlayerContext,
  ScenarioSkeleton,
} from "@hatchquest/shared";
import { classifyRoutes } from "../classify.js";
import { startRoutes } from "../start.js";
import type { NarrationWorldContext } from "../../engine/narrator-ai.js";
import type { ChoiceEffect } from "../../engine/apply-choice.js";
import { SessionStore } from "../../store/session-store.js";
import type { RegisteredSkeleton } from "../../skeletons/registry.js";

const VALID_L1_NODE = /^L1-node-[1-5]$/;
const DEFAULT_EFFECT: ChoiceEffect = {
  capital: 0,
  revenue: 0,
  debt: 0,
  monthlyBurn: 0,
  reputation: 0,
  networkStrength: 0,
  eoDeltas: {},
};

function buildRegisteredSkeleton(id: string): RegisteredSkeleton {
  const skeleton: ScenarioSkeleton = {
    id,
    layer: 1,
    theme: "competition",
    baseWeight: 1,
    eoTargetDimensions: ["riskTaking"],
    narrativePattern: "first-turn-test",
    situationSeed: "A competitor is circling the same customers you just fought to keep.",
    choiceArchetypes: [
      {
        eoPoleSignal: "risk-tolerant",
        archetypeDescription: "Spend now to stabilise the situation before rivals move.",
        tensionAxis: "Speed vs runway",
      },
      {
        eoPoleSignal: "measured",
        archetypeDescription: "Slow down and protect cash while you reassess.",
        tensionAxis: "Stability vs momentum",
      },
      {
        eoPoleSignal: "collaborative",
        archetypeDescription: "Pull in partners and customers to absorb the shock together.",
        tensionAxis: "Control vs support",
      },
    ],
  };

  return {
    skeleton,
    effects: [DEFAULT_EFFECT, DEFAULT_EFFECT, DEFAULT_EFFECT],
  };
}

type GenerateSkinFn = (
  skeleton: ScenarioSkeleton,
  context: PlayerContext,
  worldCtx?: NarrationWorldContext
) => Promise<[NarrativeSkin, "llm" | "fallback" | "validator-rejected"]>;

function buildApp(store: SessionStore, generateSkin: GenerateSkinFn): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(startRoutes, { store });
  app.register(classifyRoutes, {
    store,
    getSkeleton: (id: string) => buildRegisteredSkeleton(id),
    generateSkin,
  });
  return app;
}

async function createSession(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/start",
    payload: {
      playerName: "Kwame",
      email: "kwame@example.com",
      password: "hunter2",
    },
  });
  return res.json<{ sessionId: string }>().sessionId;
}

let store: SessionStore;
let app: FastifyInstance;
let generateSkinSpy: ReturnType<typeof vi.fn<GenerateSkinFn>>;

beforeEach(async () => {
  store = new SessionStore();
  generateSkinSpy = vi.fn<GenerateSkinFn>(async (_skeleton, context, worldCtx) => [
    {
      narrative: `Two days after ${
        worldCtx?.storyMemory?.continuityAnchor ?? "your first market test"
      }, ${worldCtx?.storyMemory?.openThread ?? "the pressure"} is still closing in on ${
        context.businessLabel
      }.`,
      choices: ["Choice 1", "Choice 2", "Choice 3"],
      tensionHints: ["hint 1", "hint 2", "hint 3"],
    },
    "fallback",
  ]);
  app = buildApp(store, generateSkinSpy);
  await app.ready();
});

describe("POST /classify", () => {
  it("returns 200 with a valid Layer 1 node id", async () => {
    const sessionId = await createSession(app);

    const res = await app.inject({
      method: "POST",
      url: "/classify",
      payload: {
        sessionId,
        response: "I want to build a solar kiosk network solving Accra's power access gap.",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ layer1NodeId: string }>().layer1NodeId).toMatch(VALID_L1_NODE);
  });

  it("stores a clean business description instead of the raw Q1 essay", async () => {
    const sessionId = await createSession(app);
    const q1 =
      "I want to build a mobile inventory app for small traders in Makola because I keep seeing stockouts and wasted sales.";

    await app.inject({
      method: "POST",
      url: "/classify",
      payload: { sessionId, response: q1 },
    });

    const session = await store.getSession(sessionId);
    expect(session?.layer0Q1Response).toBe(q1);
    expect(session?.worldState.businessDescription).not.toBe(q1);
    expect(session?.worldState.businessDescription).toContain("software venture");
  });
});

describe("POST /classify-q1", () => {
  it("returns 200 with a non-empty q2Prompt and stores raw Layer 0 inputs separately", async () => {
    const sessionId = await createSession(app);
    const q1 = "I want to build a mobile food delivery service in Osu.";

    const res = await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId, q1Response: q1 },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ sessionId: string; q2Prompt: string }>();
    expect(body.sessionId).toBe(sessionId);
    expect(body.q2Prompt.length).toBeGreaterThan(20);

    const session = await store.getSession(sessionId);
    expect(session?.layer0Q1Response).toBe(q1);
    expect(session?.layer0Q2Prompt).toBe(body.q2Prompt);
    expect(session?.playerContext).toBeNull();
  });
});

describe("POST /classify-q2", () => {
  it("persists clean player context, story memory, and the generated first node cache", async () => {
    const sessionId = await createSession(app);
    const q1 =
      "I want to build a mobile inventory app for small traders in Makola because I keep seeing stockouts and wasted sales.";
    const q2 = "I would call two backup suppliers immediately and lock in a short-term deal.";

    await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId, q1Response: q1 },
    });

    const res = await app.inject({
      method: "POST",
      url: "/classify-q2",
      payload: { sessionId, q2Response: q2 },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ layer1NodeId: string }>();
    expect(body.layer1NodeId).toMatch(VALID_L1_NODE);

    const session = await store.getSession(sessionId);
    expect(session?.layer0Q1Response).toBe(q1);
    expect(session?.layer0Q2Response).toBe(q2);
    expect(session?.playerContext).toBeTruthy();
    expect(session?.playerContext?.businessSummary).not.toBe(q1);
    expect(session?.playerContext?.rawQ1Response).toBeUndefined();
    expect(session?.storyMemory?.continuityAnchor).toBeTruthy();
    expect(session?.generatedCurrentNodeId).toBe(body.layer1NodeId);
    expect(session?.generatedCurrentNodeCreatedAt).toBeTruthy();
    expect(session?.narrationSource).toBe("fallback");
    expect(session?.generatedCurrentNode?.narrative).toContain(
      session?.storyMemory?.openThread ?? ""
    );
    expect(session?.generatedCurrentNode?.narrative).not.toContain(q1);
    expect(session?.worldState.currentNodeContent).toEqual(session?.generatedCurrentNode);
  });

  it("generates the first Layer 1 node immediately with first-turn continuity context", async () => {
    const sessionId = await createSession(app);

    await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: {
        sessionId,
        q1Response: "I run a food delivery startup serving office workers around Ridge.",
      },
    });

    await app.inject({
      method: "POST",
      url: "/classify-q2",
      payload: {
        sessionId,
        q2Response: "I would quickly line up a backup cook and speak to the client before lunch.",
      },
    });

    expect(generateSkinSpy).toHaveBeenCalledOnce();
    const [, narratorContext, worldCtx] = generateSkinSpy.mock.calls[0];
    expect(narratorContext.rawQ1Response).toContain("food delivery startup");
    expect(narratorContext.businessSummary).not.toContain("I run a food delivery startup");
    expect(worldCtx?.isFirstScenarioTurn).toBe(true);
    expect(worldCtx?.storyMemory?.continuityAnchor).toBeTruthy();
  });

  it("returns 400 if Q1 was not submitted first", async () => {
    const sessionId = await createSession(app);

    const res = await app.inject({
      method: "POST",
      url: "/classify-q2",
      payload: { sessionId, q2Response: "I would find someone else." },
    });

    expect(res.statusCode).toBe(400);
  });
});
