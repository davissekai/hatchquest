import { describe, it, expect, beforeEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { SessionStore } from "../../store/session-store.js";
import { choiceRoutes } from "../choice.js";
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
  });
  return app;
}

// Seed a session whose currentNodeId is set to "L1-node-1".
function seedSession(store: SessionStore): string {
  const session = store.createSession("Kwame", "kwame@example.com");
  store.updateSession(session.id, {
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
    const sessionId = seedSession(store);

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

  // --- turnsElapsed increments ---

  it("increments turnsElapsed by 1 after a valid choice", async () => {
    const sessionId = seedSession(store);
    const before = store.getSession(sessionId)!.worldState.turnsElapsed;

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
    const sessionId = seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-1", choiceIndex: 0 },
    });

    const body = res.json();
    expect(body.clientState).not.toHaveProperty("eoProfile");
  });

  it("does not include seed in clientState", async () => {
    const sessionId = seedSession(store);

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
    const sessionId = seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when choiceIndex is 3 (out of range)", async () => {
    const sessionId = seedSession(store);

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
    const sessionId = seedSession(store);
    const session = store.getSession(sessionId)!;
    store.updateSession(sessionId, {
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
    const sessionId = seedSession(store);

    const res = await app.inject({
      method: "POST",
      url: "/choice",
      payload: { sessionId, nodeId: "L1-node-STALE", choiceIndex: 0 },
    });

    expect(res.statusCode).toBe(400);
  });
});
