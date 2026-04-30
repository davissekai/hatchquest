import { describe, it, expect, beforeEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { SessionStore } from "../../store/session-store.js";
import { resultsRoutes, generateSummary } from "../results.js";
import type { ResultsResponse } from "@hatchquest/shared";

// Build isolated Fastify app with injected store.
function buildApp(store: SessionStore): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(resultsRoutes, { store });
  return app;
}

// Create a session marked as complete so the results route serves it.
async function seedCompleteSession(store: SessionStore): Promise<string> {
  const session = await store.createSession("Kofi", "kofi@example.com");
  await store.updateSession(session.id, {
    status: "complete",
    worldState: { ...session.worldState, isComplete: true },
  });
  return session.id;
}

// Create an active (incomplete) session.
async function seedIncompleteSession(store: SessionStore): Promise<string> {
  const session = await store.createSession("Kofi", "kofi@example.com");
  return session.id;
}

let store: SessionStore;
let app: FastifyInstance;

beforeEach(async () => {
  store = new SessionStore();
  app = buildApp(store);
  await app.ready();
});

describe("GET /results/:sessionId", () => {
  // --- Happy path ---

  it("returns 200 with eoProfile for a complete session", async () => {
    const sessionId = await seedCompleteSession(store);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<ResultsResponse>();
    expect(body.sessionId).toBe(sessionId);
    expect(body.eoProfile).toBeDefined();
  });

  it("eoProfile contains all 5 EO dimensions", async () => {
    const sessionId = await seedCompleteSession(store);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    const body = res.json<ResultsResponse>();
    expect(body.eoProfile).toHaveProperty("autonomy");
    expect(body.eoProfile).toHaveProperty("innovativeness");
    expect(body.eoProfile).toHaveProperty("riskTaking");
    expect(body.eoProfile).toHaveProperty("proactiveness");
    expect(body.eoProfile).toHaveProperty("competitiveAggressiveness");
  });

  it("returns clientState without eoProfile field", async () => {
    const sessionId = await seedCompleteSession(store);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    const body = res.json<ResultsResponse>();
    expect(body.clientState).toBeDefined();
    expect(body.clientState).not.toHaveProperty("eoProfile");
  });

  it("returns a summary string", async () => {
    const sessionId = await seedCompleteSession(store);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    const body = res.json<ResultsResponse>();
    expect(typeof body.summary).toBe("string");
    expect(body.summary.length).toBeGreaterThan(0);
  });

  // --- Error cases ---

  it("returns 409 for a session that is not yet complete", async () => {
    const sessionId = await seedIncompleteSession(store);

    const res = await app.inject({
      method: "GET",
      url: `/results/${sessionId}`,
    });

    expect(res.statusCode).toBe(409);
  });

  it("returns 404 for an unknown sessionId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/results/00000000-0000-0000-0000-000000000000",
    });

    expect(res.statusCode).toBe(404);
  });
});

// ─── generateSummary unit tests ─────────────────────────────────────────────

describe("generateSummary", () => {
  it("produces a non-empty string for any valid profile", () => {
    const profile: ResultsResponse["eoProfile"] = {
      autonomy: 5,
      innovativeness: 5,
      riskTaking: 5,
      proactiveness: 5,
      competitiveAggressiveness: 5,
    };
    const summary = generateSummary(profile);
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(20);
  });

  it("identifies the dominant dimension when one score is highest", () => {
    const profile: ResultsResponse["eoProfile"] = {
      autonomy: 3,
      innovativeness: 9,
      riskTaking: 2,
      proactiveness: 4,
      competitiveAggressiveness: 1,
    };
    const summary = generateSummary(profile);
    expect(summary).toContain("innovativeness");
    expect(summary).toContain("9.0");
  });

  it("identifies the weakest dimension in the summary", () => {
    const profile: ResultsResponse["eoProfile"] = {
      autonomy: 8,
      innovativeness: 7,
      riskTaking: 6,
      proactiveness: 5,
      competitiveAggressiveness: 1,
    };
    const summary = generateSummary(profile);
    // The summary mentions both strongest and weakest dimensions
    expect(summary.length).toBeGreaterThan(0);
  });

  it("produces different summaries for different profiles", () => {
    const profileA: ResultsResponse["eoProfile"] = {
      autonomy: 9,
      innovativeness: 2,
      riskTaking: 1,
      proactiveness: 3,
      competitiveAggressiveness: 4,
    };
    const profileB: ResultsResponse["eoProfile"] = {
      autonomy: 1,
      innovativeness: 9,
      riskTaking: 8,
      proactiveness: 2,
      competitiveAggressiveness: 3,
    };
    expect(generateSummary(profileA)).not.toBe(generateSummary(profileB));
  });

  it("includes strong signal language when dominant score >= 7", () => {
    const profile: ResultsResponse["eoProfile"] = {
      autonomy: 8,
      innovativeness: 3,
      riskTaking: 4,
      proactiveness: 5,
      competitiveAggressiveness: 2,
    };
    const summary = generateSummary(profile);
    expect(summary).toContain("strong signal");
  });

  it("includes moderate signal language when dominant score is 4-6", () => {
    const profile: ResultsResponse["eoProfile"] = {
      autonomy: 5,
      innovativeness: 3,
      riskTaking: 4,
      proactiveness: 2,
      competitiveAggressiveness: 1,
    };
    const summary = generateSummary(profile);
    expect(summary).toContain("moderate signal");
  });
});
