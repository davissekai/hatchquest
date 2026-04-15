import { describe, it, expect, beforeEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { classifyRoutes } from "../classify.js";
import { startRoutes } from "../start.js";
import { SessionStore } from "../../store/session-store.js";

const VALID_L1_NODE = /^L1-node-[1-5]$/;

/** Builds a fresh Fastify app with both routes registered against the same store. */
function buildApp(store: SessionStore): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(startRoutes, { store });
  app.register(classifyRoutes, { store });
  return app;
}

/** Creates a session via POST /start and returns its sessionId. */
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

beforeEach(() => {
  store = new SessionStore();
  app = buildApp(store);
});

describe("POST /classify", () => {
  describe("happy path", () => {
    it("returns 200 with sessionId and layer1NodeId", async () => {
      const sessionId = await createSession(app);

      const res = await app.inject({
        method: "POST",
        url: "/classify",
        payload: {
          sessionId,
          response:
            "I want to build a solar kiosk network solving Accra's power access gap.",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ sessionId: string; layer1NodeId: string }>();
      expect(body.sessionId).toBe(sessionId);
      expect(body.layer1NodeId).toMatch(VALID_L1_NODE);
    });

    it("classifier returns a valid L1 node id", async () => {
      const sessionId = await createSession(app);

      const res = await app.inject({
        method: "POST",
        url: "/classify",
        payload: { sessionId, response: "Anything at all" },
      });

      const body = res.json<{ layer1NodeId: string }>();
      expect(body.layer1NodeId).toMatch(VALID_L1_NODE);
    });

    it("after classify, session layer is 1", async () => {
      const sessionId = await createSession(app);

      await app.inject({
        method: "POST",
        url: "/classify",
        payload: { sessionId, response: "Building agri-fintech for smallholders." },
      });

      const session = await store.getSession(sessionId);
      expect(session?.worldState.layer).toBe(1);
    });

    it("after classify, session currentNodeId is a valid L1 node", async () => {
      const sessionId = await createSession(app);

      await app.inject({
        method: "POST",
        url: "/classify",
        payload: { sessionId, response: "Building agri-fintech for smallholders." },
      });

      const session = await store.getSession(sessionId);
      expect(session?.worldState.currentNodeId).toMatch(VALID_L1_NODE);
    });
  });

  describe("validation — missing fields", () => {
    it("returns 400 when sessionId is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/classify",
        payload: { response: "Some text" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when response is missing", async () => {
      const sessionId = await createSession(app);

      const res = await app.inject({
        method: "POST",
        url: "/classify",
        payload: { sessionId },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("unknown session", () => {
    it("returns 404 for a sessionId that does not exist", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/classify",
        payload: {
          sessionId: "00000000-0000-0000-0000-000000000000",
          response: "Some text",
        },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});

describe("POST /classify-q1", () => {
  it("returns 200 with a non-empty q2Prompt", async () => {
    const sessionId = await createSession(app);

    const res = await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId, q1Response: "I want to build a mobile food delivery service in Osu." },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ sessionId: string; q2Prompt: string }>();
    expect(body.sessionId).toBe(sessionId);
    expect(body.q2Prompt.length).toBeGreaterThan(20);
  });

  it("stores Q1 in playerContext on the session", async () => {
    const sessionId = await createSession(app);
    const q1 = "I want to build a solar panel installation company.";

    await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId, q1Response: q1 },
    });

    const session = await store.getSession(sessionId);
    expect(session?.worldState.playerContext?.rawQ1Response).toBe(q1);
  });

  it("returns 404 for unknown session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId: "00000000-0000-0000-0000-000000000000", q1Response: "test" },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /classify-q2", () => {
  it("classifies and returns a valid Layer 1 node", async () => {
    const sessionId = await createSession(app);

    await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId, q1Response: "I want to build a solar panel installation company." },
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
    const body = res.json<{ sessionId: string; layer1NodeId: string }>();
    expect(body.layer1NodeId).toMatch(VALID_L1_NODE);
  });

  it("advances session to layer 1 with playerContext populated", async () => {
    const sessionId = await createSession(app);

    await app.inject({
      method: "POST",
      url: "/classify-q1",
      payload: { sessionId, q1Response: "Building agri-fintech for smallholders in the Volta Region." },
    });

    await app.inject({
      method: "POST",
      url: "/classify-q2",
      payload: { sessionId, q2Response: "I would call my uncle for a loan." },
    });

    const session = await store.getSession(sessionId);
    expect(session?.worldState.layer).toBe(1);
    expect(session?.worldState.playerContext?.rawQ2Response).toBe("I would call my uncle for a loan.");
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
