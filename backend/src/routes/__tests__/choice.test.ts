import { describe, it, expect, beforeEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { SessionStore } from "../../store/session-store.js";
import { choiceRoutes } from "../choice.js";
import { SessionLock } from "../session-lock.js";
import type { ChoiceResponse } from "@hatchquest/shared";

// --- Test-double registry ---
// Injected instead of the real scenario-registry so tests are hermetic.
// The node and effect here are deliberately minimal — enough for route logic.

const STUB_EFFECT = {
  capital: -500,
  revenue: 200,
  debt: 0,
  monthlyBurn: 0,
  reputation: 5,
  networkStrength: 3,
  eoDeltas: { riskTaking: 1 },
};

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

// Build a Fastify app with injected store and registry stubs.
// This pattern mirrors the real app construction but keeps state isolated per test.
function buildApp(store: SessionStore): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(choiceRoutes, {
    store,
    getNode: (id: string | null) => (id === "L1-node-1" || id === "L2-node-1" ? STUB_NODE : null),
    getChoiceEffect: (nodeId: string, idx: 0 | 1 | 2) =>
      nodeId === "L1-node-1" ? STUB_EFFECT : null,
    // Stub Director AI — always returns L2-node-1 so route tests stay hermetic
    selectNextNodeId: () => "L2-node-1",
  });
  return app;
}

// Seed a session whose currentNodeId is set to "L1-node-1".
async function seedSession(store: SessionStore): Promise<string> {
  const session = await store.createSession("Kwame", "kwame@example.com");
  await store.updateSession(session.id, {
    worldState: { ...session.worldState, currentNodeId: "L1-node-1" },
  });
  return session.id;
}

let store: SessionStore;
let app: FastifyInstance;

beforeEach(async () => {
  store = new SessionStore();
  app = buildApp(store);
  await app.ready();
});

describe("POST /choice", () => {
  // --- Happy path ---

  it("returns 200 with clientState and nextNode for a valid choice on an active session", async () => {
    const sessionId = await seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<ChoiceResponse>();
    expect(body.sessionId).toBe(sessionId);
    expect(body.clientState).toBeDefined();
    expect(body.nextNode).toBeDefined();
  });

  // --- layer and turnsElapsed advance ---

  it("increments layer by 1 after a valid choice", async () => {
    const sessionId = await seedSession(store);
    const before = (await store.getSession(sessionId))!.worldState.layer;

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<ChoiceResponse>();
    expect(body.clientState.layer).toBe(before + 1);
  });

  it("increments turnsElapsed by 1 after a valid choice", async () => {
    const sessionId = await seedSession(store);
    const before = (await store.getSession(sessionId))!.worldState.turnsElapsed;

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 1 },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<ChoiceResponse>();
    expect(body.clientState.turnsElapsed).toBe(before + 1);
  });

  // --- clientState does not leak server-only fields ---

  it("does not include eoProfile in clientState", async () => {
    const sessionId = await seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
    });

    const body = res.json();
    expect(body.clientState).not.toHaveProperty("eoProfile");
  });

  it("does not include seed in clientState", async () => {
    const sessionId = await seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
    });

    const body = res.json();
    expect(body.clientState).not.toHaveProperty("seed");
  });

  // --- Validation errors ---

  it("returns 400 when sessionId is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { nodeId: "L1-node-1", choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when nodeId is missing", async () => {
    const sessionId = await seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when choiceIndex is 3 (out of range)", async () => {
    const sessionId = await seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 3 },
    });

    expect(res.statusCode).toBe(400);
  });

  // --- Session errors ---

  it("returns 404 for an unknown sessionId", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: {
        sessionId: "00000000-0000-0000-0000-000000000000",
        nodeId: "L1-node-1",
        choiceIndex: 0,
      },
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 409 when the session is already complete", async () => {
    const sessionId = await seedSession(store);
    const session = (await store.getSession(sessionId))!;
    await store.updateSession(sessionId, {
      worldState: { ...session.worldState, isComplete: true },
    });

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(409);
  });

  it("returns 400 when nodeId does not match session's currentNodeId (stale client)", async () => {
    const sessionId = await seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-STALE", choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(400);
  });

  // --- Concurrency guard — TOCTOU race prevention ---

  it("serializes concurrent choices on the same session — second request sees advanced state", async () => {
    const sessionId = await seedSession(store);

    // Fire two concurrent requests with the same nodeId (both valid at the time of dispatch)
    const [res1, res2] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/choice",
        payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
      }),
      app.inject({
        method: "POST",
        url: "/choice",
        payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
      }),
    ]);

    // One should succeed (first to acquire the lock)
    // The other should fail because the nodeId is now stale
    const results = [res1.statusCode, res2.statusCode].sort();
    // One 200 (first acquires lock), one 400 (stale nodeId after first advanced)
    expect(results).toContain(200);
    expect(results).toContain(400);
  });
});

// ─── SessionLock unit tests ──────────────────────────────────────────────────

describe("SessionLock", () => {
  it("serializes access — second acquire waits for first release", async () => {
    const lock = new SessionLock();
    const order: string[] = [];

    const release1 = await lock.acquire("session-1");
    const p2 = lock.acquire("session-1").then((release2) => {
      order.push("acquired-2");
      release2();
    });

    order.push("acquired-1");
    release1();
    await p2;

    expect(order).toEqual(["acquired-1", "acquired-2"]);
  });

  it("different sessionIds do not block each other", async () => {
    const lock = new SessionLock();
    const order: string[] = [];

    const release1 = await lock.acquire("session-a");
    const release2 = await lock.acquire("session-b");

    order.push("got-both");
    release1();
    release2();

    expect(order).toEqual(["got-both"]);
  });

  it("releases clean up — subsequent acquire on same id is not blocked", async () => {
    const lock = new SessionLock();
    const release1 = await lock.acquire("session-x");
    release1();
    const release2 = await lock.acquire("session-x");
    release2();
    // If we reach here without hanging, the lock cleaned up correctly
    expect(true).toBe(true);
  });
});
