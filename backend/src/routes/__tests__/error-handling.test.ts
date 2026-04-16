/**
 * Error handling tests — global error handler behaviour.
 *
 * Three scenarios:
 *   1. Store throws on any method (DB down / connection refused) → 500, sanitized
 *   2. Schema validation failure (Fastify) → 400, normalized { error: string } shape
 *   3. Known 4xx from route logic (404 / 409) → shape is still { error: string }
 *
 * Uses buildApp from app.ts with routePrefix: "" so URLs match the route definitions
 * directly (e.g., /start not /api/game/start).
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";
import type { ISessionStore } from "../../store/types.js";
import { SessionStore } from "../../store/session-store.js";
import { getAllSkeletons, getSkeletonsForLayer } from "../../skeletons/registry.js";
import type { WorldState } from "@hatchquest/shared";

// Deterministic selector — mirrors game-loop.test.ts so 5 turns can complete.
// Falls back to first available skeleton when next layer has no content yet.
function deterministicSelector(state: WorldState): string | null {
  const nextLayer = state.layer + 1;
  const layerPool = getSkeletonsForLayer(nextLayer);
  if (layerPool.length > 0) return layerPool[0].skeleton.id;
  const all = getAllSkeletons();
  return all[0]?.skeleton.id ?? null;
}

// ── Throwing store — simulates DB connection failure on every method ──────────

const throwingStore: ISessionStore = {
  createSession: async () => {
    throw new Error("DB: connection refused");
  },
  getSession: async () => {
    throw new Error("DB: connection refused");
  },
  updateSession: async () => {
    throw new Error("DB: connection refused");
  },
};

// ── Store throws (DB failure) ─────────────────────────────────────────────────

describe("store throws on every method — DB failure simulation", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp(throwingStore, { routePrefix: "" });
    await app.ready();
  });

  it("POST /start: store throws → 500 with sanitized message", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Test", email: "t@t.com", password: "pass123" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: "Internal server error. Please try again.",
    });
  });

  it("POST /start: 500 never leaks internal DB error message", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Test", email: "t@t.com", password: "pass123" },
    });

    const body = JSON.stringify(res.json());
    expect(body).not.toContain("connection refused");
    expect(body).not.toContain("DB:");
    expect(body).not.toContain("stack");
  });

  it("POST /classify: store throws → 500 sanitized", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/classify",
      payload: { sessionId: "any-id", response: "I want to build something" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: "Internal server error. Please try again.",
    });
  });

  it("POST /choice: store throws → 500 sanitized", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId: "any-id", nodeId: "L1-node-1", choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: "Internal server error. Please try again.",
    });
  });

  it("GET /session/:id: store throws → 500 sanitized", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/session/any-id",
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: "Internal server error. Please try again.",
    });
  });

  it("GET /results/:id: store throws → 500 sanitized", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/results/any-id",
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: "Internal server error. Please try again.",
    });
  });
});

// ── Schema validation failures ────────────────────────────────────────────────

describe("schema validation failures — normalized to { error: string }", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp(new SessionStore(), { routePrefix: "" });
    await app.ready();
  });

  it("POST /start missing playerName → 400 with { error: string } only", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/start",
      payload: { email: "t@t.com", password: "pass123" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<Record<string, unknown>>();
    expect(typeof body.error).toBe("string");
    // Fastify's default format has these — ours must not
    expect(body).not.toHaveProperty("statusCode");
    expect(body).not.toHaveProperty("code");
  });

  it("POST /start empty playerName → 400 with { error: string } only", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "", email: "t@t.com", password: "pass123" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<Record<string, unknown>>();
    expect(typeof body.error).toBe("string");
    expect(body).not.toHaveProperty("statusCode");
  });

  it("POST /start extra field → stripped silently, still 200 (Fastify strips additionalProperties)", async () => {
    // Fastify with additionalProperties: false removes extra fields — it does not reject.
    // This verifies the route is not corrupted by the extra field.
    const res = await app.inject({
      method: "POST",
      url: "/start",
      payload: {
        playerName: "Test",
        email: "t@t.com",
        password: "pass123",
        hack: "injected",
      },
    });

    expect(res.statusCode).toBe(200);
    // The extra field must not appear in the response
    expect(JSON.stringify(res.json())).not.toContain("injected");
  });

  it("POST /classify missing response → 400 with { error: string } only", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/classify",
      payload: { sessionId: "some-id" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<Record<string, unknown>>();
    expect(typeof body.error).toBe("string");
    expect(body).not.toHaveProperty("statusCode");
  });
});

// ── Double-classification guard ───────────────────────────────────────────────

describe("POST /classify — double-classification guard", () => {
  it("returns 409 when session is already classified", async () => {
    const app = await buildApp(new SessionStore(), { routePrefix: "" });
    await app.ready();

    // Create a session
    const startRes = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Ama", email: "ama@test.com", password: "pass123" },
    });
    const { sessionId } = startRes.json<{ sessionId: string }>();

    // First classify — should succeed (keyword heuristic fallback)
    const first = await app.inject({
      method: "POST",
      url: "/classify",
      payload: { sessionId, response: "I want to build a fintech startup." },
    });
    expect(first.statusCode).toBe(200);

    // Second classify on same session — must be rejected
    const res = await app.inject({
      method: "POST",
      url: "/classify",
      payload: { sessionId, response: "Let me try to classify again." },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/already classified/i);

    await app.close();
  });
});

// ── Results on incomplete session ─────────────────────────────────────────────

describe("GET /results/:sessionId — incomplete session", () => {
  it("returns 409 when session is not yet complete", async () => {
    const app = await buildApp(new SessionStore(), { routePrefix: "" });
    await app.ready();

    // Create a fresh session — isComplete is false by default
    const startRes = await app.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Kwame", email: "kwame@test.com", password: "pass123" },
    });
    const { sessionId } = startRes.json<{ sessionId: string }>();

    // Attempt to fetch results before game is complete
    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    expect(res.statusCode).toBe(409);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/not available until the game is complete/i);

    await app.close();
  });
});

// ── Known 4xx from route logic ────────────────────────────────────────────────

describe("route-generated 4xx — always { error: string }, never Fastify verbose format", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp(new SessionStore(), { routePrefix: "" });
    await app.ready();
  });

  it("GET /session with unknown id → 404 with { error: string } only", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/session/nonexistent",
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<Record<string, unknown>>();
    expect(typeof body.error).toBe("string");
    expect(body).not.toHaveProperty("statusCode");
  });

  it("GET /results with unknown id → 404 with { error: string } only", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/results/nonexistent",
    });

    expect(res.statusCode).toBe(404);
    expect(typeof res.json<{ error: string }>().error).toBe("string");
  });

  it("POST /choice with completed session → 409 with { error: string }", async () => {
    // Use deterministic selector so all 5 turns can complete.
    const goodApp = await buildApp(new SessionStore(), {
      routePrefix: "",
      selectNextNodeId: deterministicSelector,
    });
    await goodApp.ready();

    const startRes = await goodApp.inject({
      method: "POST",
      url: "/start",
      payload: { playerName: "Test", email: "t@t.com", password: "pass123" },
    });
    const { sessionId } = startRes.json<{ sessionId: string }>();

    const classifyRes = await goodApp.inject({
      method: "POST",
      url: "/classify",
      payload: { sessionId, response: "I want to start a business in Accra." },
    });
    const { layer1NodeId } = classifyRes.json<{ layer1NodeId: string }>();

    // Play all 10 turns to completion, tracking the next nodeId each time
    let nodeId = layer1NodeId;
    for (let i = 0; i < 10; i++) {
      const r = await goodApp.inject({
        method: "POST",
        url: "/choice",
        payload: { sessionId, nodeId, choiceIndex: 0 },
      });
      // After turn 5, nextNode is null — keep last nodeId for the post-completion attempt
      nodeId = r.json<{ nextNode: { id: string } | null }>().nextNode?.id ?? nodeId;
    }

    // Attempt a choice on the now-complete session — must get 409, not 400
    const res = await goodApp.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId, choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json<Record<string, unknown>>();
    expect(typeof body.error).toBe("string");
    expect(body).not.toHaveProperty("statusCode");
  });
});
