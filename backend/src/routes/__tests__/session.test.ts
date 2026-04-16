import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { SessionStore } from "../../store/session-store.js";
import { sessionRoutes } from "../session.js";
import type { SessionResponse } from "@hatchquest/shared";

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
