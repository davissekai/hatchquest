import { describe, it, expect, beforeEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { startRoutes } from "../start.js";
import { SessionStore } from "../../store/session-store.js";

// UUID v4 pattern — used to verify sessionId shape
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Builds a fresh Fastify app with the given store injected — no shared state between tests. */
function buildApp(store: SessionStore): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(startRoutes, { store });
  return app;
}

let store: SessionStore;
let app: FastifyInstance;

beforeEach(() => {
  store = new SessionStore();
  app = buildApp(store);
});

describe("POST /start", () => {
  describe("happy path", () => {
    it("returns 200 with a UUID sessionId", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/start",
        payload: {
          playerName: "Kwame",
          email: "kwame@example.com",
          password: "hunter2",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ sessionId: string; layer0Question: string }>();
      expect(body.sessionId).toMatch(UUID_REGEX);
    });

    it("returns a non-empty string for layer0Question", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/start",
        payload: {
          playerName: "Kwame",
          email: "kwame@example.com",
          password: "hunter2",
        },
      });

      const body = res.json<{ sessionId: string; layer0Question: string }>();
      expect(typeof body.layer0Question).toBe("string");
      expect(body.layer0Question.length).toBeGreaterThan(0);
    });

    it("two successive calls produce different sessionIds", async () => {
      const payload = {
        playerName: "Ama",
        email: "ama@example.com",
        password: "hunter2",
      };

      const [r1, r2] = await Promise.all([
        app.inject({ method: "POST", url: "/start", payload }),
        app.inject({ method: "POST", url: "/start", payload }),
      ]);

      const b1 = r1.json<{ sessionId: string }>();
      const b2 = r2.json<{ sessionId: string }>();
      expect(b1.sessionId).not.toBe(b2.sessionId);
    });
  });

  describe("validation — missing fields", () => {
    it("returns 400 when playerName is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/start",
        payload: { email: "kwame@example.com", password: "hunter2" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when email is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/start",
        payload: { playerName: "Kwame", password: "hunter2" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when password is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/start",
        payload: { playerName: "Kwame", email: "kwame@example.com" },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
