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
