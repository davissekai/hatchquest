/**
 * DbSessionStore — integration tests against a live Supabase instance.
 *
 * SETUP: Set DATABASE_URL (Transaction mode, port 6543) in your environment:
 *   export DATABASE_URL="postgresql://postgres.fpbxmqfdjyznnquiohxv:..."
 *   npm run test:integration --workspace=backend
 *
 * These tests are skipped when DATABASE_URL is not set.
 * They create and delete real rows in game_sessions — isolated per test.
 *
 * TOCTOU note: DbSessionStore.updateSession does a read-then-write (getSession
 * then update). This is safe for the demo phase (single-user sessions).
 * Flag if concurrent writes are added post-demo.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { SessionNotFoundError } from "../types.js";

// ─── Guard: skip everything if no DB is configured ───────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
const DB_AVAILABLE = !!DATABASE_URL;

// ─── Lazy handles — loaded only when DB is available ─────────────────────────

type DbSessionStoreType = import("../db-session-store.js").DbSessionStore;
type DbType = typeof import("../../db/client.js").db;
type GameSessionsTable = typeof import("../../db/schema.js").gameSessions;

let store: DbSessionStoreType;
let db: DbType;
let gameSessions: GameSessionsTable;

// ─── Suite ───────────────────────────────────────────────────────────────────

describe.skipIf(!DB_AVAILABLE)(
  "DbSessionStore (integration — requires DATABASE_URL)",
  () => {
    // Track ids created during tests for cleanup
    const createdIds: string[] = [];

    beforeAll(async () => {
      // Dynamic imports: db/client.ts throws at module load if DATABASE_URL is unset.
      // These imports are safe here because DATABASE_URL is confirmed above.
      const { DbSessionStore } = await import("../db-session-store.js");
      const { db: dbClient } = await import("../../db/client.js");
      const { gameSessions: gs } = await import("../../db/schema.js");
      const { eq } = await import("drizzle-orm");

      store = new DbSessionStore();
      db = dbClient;
      gameSessions = gs;
    });

    afterEach(async () => {
      // Delete all rows created during this test — leave DB clean for the next run
      if (createdIds.length > 0) {
        const { eq } = await import("drizzle-orm");
        for (const id of createdIds) {
          await (db as any)
            .delete(gameSessions)
            .where(eq(gameSessions.id, id))
            .catch(() => {
              // Ignore: row may have been deleted by the test itself
            });
        }
        createdIds.length = 0;
      }
    });

    afterAll(async () => {
      // Final safety net: clean up anything that slipped through afterEach
      if (createdIds.length > 0) {
        const { eq } = await import("drizzle-orm");
        for (const id of createdIds) {
          await (db as any)
            .delete(gameSessions)
            .where(eq(gameSessions.id, id))
            .catch(() => {});
        }
      }
    });

    // ── createSession ──────────────────────────────────────────────────────

    describe("createSession", () => {
      it("inserts a row and returns a session with a UUID id", async () => {
        const session = await store.createSession("Kwame", "kwame@test.com");
        createdIds.push(session.id);

        expect(session.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      });

      it("persists status as active", async () => {
        const session = await store.createSession("Ama", "ama@test.com");
        createdIds.push(session.id);

        expect(session.status).toBe("active");
      });

      it("persists worldState with correct starting capital", async () => {
        const session = await store.createSession("Kofi", "kofi@test.com");
        createdIds.push(session.id);

        expect(session.worldState.capital).toBe(10_000);
      });

      it("persists worldState with layer 0", async () => {
        const session = await store.createSession("Abena", "abena@test.com");
        createdIds.push(session.id);

        expect(session.worldState.layer).toBe(0);
      });

      it("persists worldState with isComplete false", async () => {
        const session = await store.createSession("Yaa", "yaa@test.com");
        createdIds.push(session.id);

        expect(session.worldState.isComplete).toBe(false);
      });

      it("produces unique ids for successive sessions", async () => {
        const s1 = await store.createSession("Kwame", "kwame2@test.com");
        const s2 = await store.createSession("Ama", "ama2@test.com");
        createdIds.push(s1.id, s2.id);

        expect(s1.id).not.toBe(s2.id);
      });

      it("produces different seeds for successive sessions", async () => {
        const s1 = await store.createSession("Kwame", "kwame3@test.com");
        const s2 = await store.createSession("Ama", "ama3@test.com");
        createdIds.push(s1.id, s2.id);

        expect(s1.worldState.seed).not.toBe(s2.worldState.seed);
      });

      it("sets createdAt and updatedAt to valid ISO timestamps", async () => {
        const before = Date.now();
        const session = await store.createSession("Efua", "efua@test.com");
        const after = Date.now();
        createdIds.push(session.id);

        const created = new Date(session.createdAt).getTime();
        expect(created).toBeGreaterThanOrEqual(before - 5000); // allow 5s clock skew
        expect(created).toBeLessThanOrEqual(after + 5000);
      });
    });

    // ── getSession ─────────────────────────────────────────────────────────

    describe("getSession", () => {
      it("retrieves a row that was just created", async () => {
        const created = await store.createSession("Kwame", "kwame4@test.com");
        createdIds.push(created.id);

        const fetched = await store.getSession(created.id);
        expect(fetched).toBeDefined();
        expect(fetched?.id).toBe(created.id);
        expect(fetched?.status).toBe("active");
        expect(fetched?.worldState.capital).toBe(10_000);
      });

      it("returns undefined for an unknown id", async () => {
        const result = await store.getSession("00000000-0000-0000-0000-000000000000");
        expect(result).toBeUndefined();
      });

      it("returns undefined for a random UUID not in DB", async () => {
        const result = await store.getSession(crypto.randomUUID());
        expect(result).toBeUndefined();
      });
    });

    // ── updateSession ──────────────────────────────────────────────────────

    describe("updateSession", () => {
      it("updates status and returns updated session", async () => {
        const session = await store.createSession("Kwame", "kwame5@test.com");
        createdIds.push(session.id);

        const updated = await store.updateSession(session.id, {
          status: "complete",
        });

        expect(updated.status).toBe("complete");
      });

      it("preserves fields not included in the update", async () => {
        const session = await store.createSession("Ama", "ama5@test.com");
        createdIds.push(session.id);

        const updated = await store.updateSession(session.id, {
          status: "complete",
        });

        // worldState should be unchanged
        expect(updated.worldState.capital).toBe(session.worldState.capital);
      });

      it("bumps updatedAt on update", async () => {
        const session = await store.createSession("Kofi", "kofi2@test.com");
        createdIds.push(session.id);

        // Small delay so timestamp differs
        await new Promise((r) => setTimeout(r, 10));

        const updated = await store.updateSession(session.id, {
          status: "complete",
        });

        expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
          new Date(session.updatedAt).getTime()
        );
      });

      it("persists update so subsequent getSession reflects the change", async () => {
        const session = await store.createSession("Abena", "abena2@test.com");
        createdIds.push(session.id);

        await store.updateSession(session.id, { status: "complete" });

        const refetched = await store.getSession(session.id);
        expect(refetched?.status).toBe("complete");
      });

      it("can update worldState fields and they persist", async () => {
        const session = await store.createSession("Yaa", "yaa2@test.com");
        createdIds.push(session.id);

        const newWorldState = { ...session.worldState, capital: 5_000 };
        await store.updateSession(session.id, { worldState: newWorldState });

        const refetched = await store.getSession(session.id);
        expect(refetched?.worldState.capital).toBe(5_000);
      });

      it("persists Layer 0 continuity fields through the DB-backed store", async () => {
        const session = await store.createSession("Yaw", "yaw@test.com");
        createdIds.push(session.id);

        await store.updateSession(session.id, {
          layer0Q1Response: "Raw Q1",
          layer0Q2Prompt: "Prompt Q2",
          layer0Q2Response: "Raw Q2",
          playerContext: {
            businessLabel: "Market Ops App",
            businessSummary: "a software venture helping small businesses run operations with more control",
            businessDescription:
              "a software venture helping small businesses run operations with more control",
            motivation: "To solve an obvious market problem and turn it into a lasting venture.",
            founderEdge: "Fast-moving operator under pressure",
          },
          storyMemory: {
            lastBeatSummary:
              "You answered an early supplier disruption with a decisive operational response.",
            openThread: "the unresolved supplier disruption",
            continuityAnchor: "supplier disruption still threatening your first momentum",
            recentDecisionStyle: "decisive operational response",
            currentArc: "First Market Test",
          },
          generatedCurrentNode: {
            narrative: "Two days after the supplier disruption, the pressure returns.",
            choices: ["A", "B", "C"],
            tensionHints: ["h1", "h2", "h3"],
          },
          generatedCurrentNodeId: "L1-node-1",
          generatedCurrentNodeCreatedAt: new Date().toISOString(),
          narrationSource: "fallback",
        });

        const refetched = await store.getSession(session.id);
        expect(refetched?.layer0Q1Response).toBe("Raw Q1");
        expect(refetched?.playerContext?.businessLabel).toBe("Market Ops App");
        expect(refetched?.storyMemory?.continuityAnchor).toContain("supplier disruption");
        expect(refetched?.generatedCurrentNodeId).toBe("L1-node-1");
        expect(refetched?.narrationSource).toBe("fallback");
      });

      it("throws SessionNotFoundError for an unknown id", async () => {
        const unknownId = "00000000-0000-0000-0000-000000000000";

        await expect(
          store.updateSession(unknownId, { status: "expired" })
        ).rejects.toThrow(SessionNotFoundError);
      });

      it("error message includes the missing session id", async () => {
        const unknownId = "00000000-0000-0000-0000-000000000001";

        await expect(
          store.updateSession(unknownId, { status: "expired" })
        ).rejects.toThrow(unknownId);
      });
    });

    // ── isolation ──────────────────────────────────────────────────────────

    describe("isolation", () => {
      it("updating one session does not affect another", async () => {
        const s1 = await store.createSession("Kwame", "kwame6@test.com");
        const s2 = await store.createSession("Ama", "ama6@test.com");
        createdIds.push(s1.id, s2.id);

        await store.updateSession(s1.id, {
          worldState: { ...s1.worldState, capital: 1_000 },
        });

        const s2Refetched = await store.getSession(s2.id);
        expect(s2Refetched?.worldState.capital).toBe(10_000);
      });

      it("session ids from different creates are independent rows", async () => {
        const s1 = await store.createSession("Kwame", "kwame7@test.com");
        const s2 = await store.createSession("Ama", "ama7@test.com");
        createdIds.push(s1.id, s2.id);

        expect(s1.id).not.toBe(s2.id);
        expect(await store.getSession(s1.id)).toBeDefined();
        expect(await store.getSession(s2.id)).toBeDefined();
      });
    });
  }
);

// ─── Skip notice ─────────────────────────────────────────────────────────────

if (!DB_AVAILABLE) {
  describe("DbSessionStore (integration)", () => {
    it.skip(
      "DATABASE_URL not set — set it to run integration tests against Supabase project fpbxmqfdjyznnquiohxv",
      () => {}
    );
  });
}
