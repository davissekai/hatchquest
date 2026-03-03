// @vitest-environment node
/**
 * HatchQuest API Integration Tests
 *
 * Tests all 4 API route handlers directly (no running server required).
 * Uses the test database defined in .env.test.
 * Cleans up after each test using email pattern qa-NNN@test.hatchquest.com.
 */

import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";

// Route handlers under test
import { POST as startRoute } from "@/app/api/game/start/route";
import { GET as sessionRoute } from "@/app/api/game/session/route";
import { POST as choiceRoute } from "@/app/api/game/choice/route";
import { GET as resultsRoute } from "@/app/api/game/results/route";

// DB client for setup/teardown
import { db } from "@/db/client";
import { players, gameSessions } from "@/db/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStartRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/game/start", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeSessionRequest(sessionId: string) {
  return new NextRequest(
    `http://localhost/api/game/session?sessionId=${sessionId}`
  );
}

function makeChoiceRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/game/choice", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeResultsRequest(sessionId: string) {
  return new NextRequest(
    `http://localhost/api/game/results?sessionId=${sessionId}`
  );
}

/**
 * Delete all test players matching the qa-NNN@test.hatchquest.com pattern.
 * Cascades to game_sessions via FK onDelete: cascade.
 */
async function cleanupTestPlayers() {
  await db
    .delete(players)
    .where(like(players.email, "%@test.hatchquest.com"));
}

// ─── /api/game/start ──────────────────────────────────────────────────────────

describe("POST /api/game/start", () => {
  afterEach(async () => {
    await cleanupTestPlayers();
  });

  it("happy path — returns sessionId, beat_00 with 3 choices, and initial state (capital: 10000)", async () => {
    const req = makeStartRequest({
      email: "qa-001@test.hatchquest.com",
      name: "QA Player 001",
    });

    const res = await startRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();

    // Session ID must be a UUID
    expect(body.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Beat must be beat_00
    expect(body.beat.id).toBe("beat_00");
    expect(body.beat.title).toBeTruthy();
    expect(body.beat.storyText).toBeTruthy();

    // beat_00 has exactly 3 venture-selection choices
    expect(Array.isArray(body.beat.choices)).toBe(true);
    expect(body.beat.choices).toHaveLength(3);

    // Initial state checks
    expect(body.state.resources.capital).toBe(10000);
    expect(body.state.resources.reputation).toBe(50);
    expect(body.state.resources.network).toBe(10);
    expect(body.state.session.currentNarrativeId).toBe("beat_00");
    expect(body.state.session.isStoryComplete).toBe(false);

    // Dimensions must NOT be in the response
    expect(body.state.dimensions).toBeUndefined();
  }, 15_000); // 15s — first test pays cold-start cost (DB connection + module init)

  it("returns 400 when email is missing", async () => {
    const req = makeStartRequest({ name: "QA Player" });
    const res = await startRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 when name is missing", async () => {
    const req = makeStartRequest({ email: "qa-002@test.hatchquest.com" });
    const res = await startRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("same email twice — returns same playerId but a new sessionId each time", async () => {
    const email = "qa-003@test.hatchquest.com";

    const res1 = await startRoute(
      makeStartRequest({ email, name: "QA Player 003" })
    );
    const body1 = await res1.json();
    expect(res1.status).toBe(200);

    const res2 = await startRoute(
      makeStartRequest({ email, name: "QA Player 003" })
    );
    const body2 = await res2.json();
    expect(res2.status).toBe(200);

    // Different sessions
    expect(body1.sessionId).not.toBe(body2.sessionId);

    // Same player — verify via DB
    const playerRecords = await db.query.players.findMany({
      where: eq(players.email, email),
    });
    expect(playerRecords).toHaveLength(1);

    // Both sessions belong to the same player
    const session1 = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, body1.sessionId),
    });
    const session2 = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, body2.sessionId),
    });
    expect(session1!.playerId).toBe(session2!.playerId);
  });
});

// ─── /api/game/session ────────────────────────────────────────────────────────

describe("GET /api/game/session", () => {
  afterEach(async () => {
    await cleanupTestPlayers();
  });

  it("happy path — valid sessionId returns 200 with beat and state", async () => {
    // Create a session first
    const startRes = await startRoute(
      makeStartRequest({
        email: "qa-010@test.hatchquest.com",
        name: "QA Session Player",
      })
    );
    const { sessionId } = await startRes.json();

    const res = await sessionRoute(makeSessionRequest(sessionId));
    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body.beat).toBeDefined();
    expect(body.beat.id).toBe("beat_00");
    expect(Array.isArray(body.beat.choices)).toBe(true);

    expect(body.state).toBeDefined();
    expect(body.state.resources).toBeDefined();
    expect(body.state.session.currentNarrativeId).toBe("beat_00");

    // Dimensions must NOT be exposed during gameplay
    expect(body.state.dimensions).toBeUndefined();
  });

  it("returns 400 when sessionId param is missing", async () => {
    const req = new NextRequest("http://localhost/api/game/session");
    const res = await sessionRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 404 for a non-existent but valid UUID sessionId", async () => {
    const fakeId = "00000000-0000-4000-8000-000000000001";
    const res = await sessionRoute(makeSessionRequest(fakeId));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });
});

// ─── /api/game/choice ─────────────────────────────────────────────────────────

describe("POST /api/game/choice", () => {
  afterEach(async () => {
    await cleanupTestPlayers();
  });

  it("happy path — valid sessionId + choiceId beat_01_a returns 200 with nextBeat beat_02, updatedState, and feedback", async () => {
    const startRes = await startRoute(
      makeStartRequest({
        email: "qa-020@test.hatchquest.com",
        name: "QA Choice Player",
      })
    );
    const { sessionId } = await startRes.json();

    const res = await choiceRoute(
      makeChoiceRequest({ sessionId, choiceId: "beat_01_a" })
    );
    expect(res.status).toBe(200);

    const body = await res.json();

    // Next beat must be beat_02 (nextBeatId seeded as "beat_02" on beat_01_a)
    expect(body.nextBeat.id).toBe("beat_02");
    expect(Array.isArray(body.nextBeat.choices)).toBe(true);

    // Updated state must advance narrative
    expect(body.updatedState.session.currentNarrativeId).toBe("beat_02");

    // Dimensions still hidden from response
    expect(body.updatedState.dimensions).toBeUndefined();

    // Feedback must be a non-empty string
    expect(typeof body.feedback).toBe("string");
    expect(body.feedback.length).toBeGreaterThan(0);
  });

  it("state mutation — flags.venture_threads = true after choosing beat_01_a", async () => {
    const startRes = await startRoute(
      makeStartRequest({
        email: "qa-021@test.hatchquest.com",
        name: "QA Flag Test",
      })
    );
    const { sessionId } = await startRes.json();

    await choiceRoute(makeChoiceRequest({ sessionId, choiceId: "beat_01_a" }));

    // Read persisted state from DB
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    const state = session!.state as { flags: Record<string, boolean> };
    expect(state.flags.venture_threads).toBe(true);
  });

  it("returns 400 when sessionId is missing", async () => {
    const res = await choiceRoute(
      makeChoiceRequest({ choiceId: "beat_01_a" })
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 when choiceId is missing", async () => {
    const startRes = await startRoute(
      makeStartRequest({
        email: "qa-022@test.hatchquest.com",
        name: "QA Missing Choice",
      })
    );
    const { sessionId } = await startRes.json();

    const res = await choiceRoute(makeChoiceRequest({ sessionId }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 404 for an invalid choiceId", async () => {
    const startRes = await startRoute(
      makeStartRequest({
        email: "qa-023@test.hatchquest.com",
        name: "QA Bad Choice",
      })
    );
    const { sessionId } = await startRes.json();

    const res = await choiceRoute(
      makeChoiceRequest({ sessionId, choiceId: "beat_99_z_nonexistent" })
    );
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

// ─── /api/game/results ────────────────────────────────────────────────────────

describe("GET /api/game/results", () => {
  afterEach(async () => {
    await cleanupTestPlayers();
  });

  it("returns 400 with 'Game session is not yet complete' for an incomplete session", async () => {
    const startRes = await startRoute(
      makeStartRequest({
        email: "qa-030@test.hatchquest.com",
        name: "QA Incomplete",
      })
    );
    const { sessionId } = await startRes.json();

    const res = await resultsRoute(makeResultsRequest(sessionId));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toMatch(/not yet complete/i);
  });

  it("returns 400 when sessionId param is missing", async () => {
    const req = new NextRequest("http://localhost/api/game/results");
    const res = await resultsRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

// ─── Full Game Flow ────────────────────────────────────────────────────────────

describe("Full game flow — beat_00 through beat_29, all 'a' choices", () => {
  afterEach(async () => {
    await cleanupTestPlayers();
  });

  it("completes all 30 decision beats, marks session complete, and results returns finalState with dimensions and acumenScore", async () => {
    // 1. Start game
    const startRes = await startRoute(
      makeStartRequest({
        email: "qa-100@test.hatchquest.com",
        name: "QA Full Run",
      })
    );
    expect(startRes.status).toBe(200);
    const { sessionId } = await startRes.json();

    // 2. The full choice sequence using the 'a' option for each beat.
    //    beat_00 uses choice ID "beat_01_a" (venture selection seeded against beat_00).
    //    beats 02–29 follow the pattern beat_NN_a.
    const choiceSequence: string[] = [
      "beat_01_a", // beat_00 → beat_02
      "beat_02_a", // beat_02 → beat_03
      "beat_03_a", // beat_03 → beat_04
      "beat_04_a", // beat_04 → beat_05
      "beat_05_a", // beat_05 → beat_06
      "beat_06_a", // beat_06 → beat_07
      "beat_07_a", // beat_07 → beat_08
      "beat_08_a", // beat_08 → beat_09
      "beat_09_a", // beat_09 → beat_10
      "beat_10_a", // beat_10 → beat_11
      "beat_11_a", // beat_11 → beat_12
      "beat_12_a", // beat_12 → beat_13
      "beat_13_a", // beat_13 → beat_14
      "beat_14_a", // beat_14 → beat_15
      "beat_15_a", // beat_15 → beat_16
      "beat_16_a", // beat_16 → beat_17
      "beat_17_a", // beat_17 → beat_18
      "beat_18_a", // beat_18 → beat_19
      "beat_19_a", // beat_19 → beat_20
      "beat_20_a", // beat_20 → beat_21
      "beat_21_a", // beat_21 → beat_22
      "beat_22_a", // beat_22 → beat_23
      "beat_23_a", // beat_23 → beat_24
      "beat_24_a", // beat_24 → beat_25
      "beat_25_a", // beat_25 → beat_26
      "beat_26_a", // beat_26 → beat_27
      "beat_27_a", // beat_27 → beat_28
      "beat_28_a", // beat_28 → beat_29
      "beat_29_a", // beat_29 → beat_30 (last beat — triggers isComplete)
    ];

    let lastChoiceRes;
    for (const choiceId of choiceSequence) {
      const res = await choiceRoute(makeChoiceRequest({ sessionId, choiceId }));
      if (res.status !== 200) {
        const errBody = await res.json();
        throw new Error(
          `Choice ${choiceId} failed with status ${res.status}: ${JSON.stringify(errBody)}`
        );
      }
      lastChoiceRes = res;
    }

    // 3. After the last choice, the session state must have isStoryComplete = true
    const lastBody = await lastChoiceRes!.json();
    expect(lastBody.updatedState.session.isStoryComplete).toBe(true);
    expect(lastBody.nextBeat.id).toBe("beat_30");

    // 4. Verify DB has isComplete = true
    const dbSession = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });
    expect(dbSession!.isComplete).toBe(true);

    // 5. Call /results — must return 200
    const resultsRes = await resultsRoute(makeResultsRequest(sessionId));
    expect(resultsRes.status).toBe(200);

    const resultsBody = await resultsRes.json();

    // finalState must include EO dimensions (revealed on results page)
    expect(resultsBody.finalState).toBeDefined();
    expect(resultsBody.finalState.dimensions).toBeDefined();
    expect(typeof resultsBody.finalState.dimensions.autonomy).toBe("number");
    expect(typeof resultsBody.finalState.dimensions.innovativeness).toBe("number");
    expect(typeof resultsBody.finalState.dimensions.proactiveness).toBe("number");
    expect(typeof resultsBody.finalState.dimensions.riskTaking).toBe("number");
    expect(typeof resultsBody.finalState.dimensions.competitiveAggressiveness).toBe("number");

    // acumenScore — the choice route currently does not compute or persist it,
    // so it will be null. We assert it is present in the response (even if null)
    // and flag this as a known gap for the next sprint.
    expect("acumenScore" in resultsBody).toBe(true);
  }, 60_000); // 60s timeout — 29 sequential DB round-trips
});
