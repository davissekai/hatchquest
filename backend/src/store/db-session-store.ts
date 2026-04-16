import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { gameSessions } from "../db/schema.js";
import { createInitialWorldState } from "../engine/index.js";
import type { GameSession, WorldState, SessionStatus } from "@hatchquest/shared";
import { SessionNotFoundError, type ISessionStore } from "./types.js";

/** Maps a game_sessions DB row to the shared GameSession type. */
function toGameSession(row: typeof gameSessions.$inferSelect): GameSession {
  return {
    id: row.id,
    // player_id FK not wired for demo phase — auth is a separate task
    playerId: null,
    worldState: row.worldState as WorldState,
    status: row.status as SessionStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * DB-backed session store — persists sessions to game_sessions via Drizzle.
 * Use this when DATABASE_URL is set (production / staging).
 * Falls back to in-memory SessionStore when DATABASE_URL is absent.
 */
export class DbSessionStore implements ISessionStore {
  /** Inserts a new active session row and returns the hydrated GameSession. */
  async createSession(playerName: string, email: string): Promise<GameSession> {
    // Pre-generate id so callers get a predictable UUID without a round-trip
    const id = crypto.randomUUID();
    const seed = (Math.random() * 1_000_000) | 0;
    const worldState = createInitialWorldState({ seed });

    const [row] = await db
      .insert(gameSessions)
      .values({ id, worldState, status: "active" })
      .returning();

    return toGameSession(row);
  }

  /** Returns the session row for the given id, or undefined if not found. */
  async getSession(id: string): Promise<GameSession | undefined> {
    const rows = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, id));

    return rows.length > 0 ? toGameSession(rows[0]) : undefined;
  }

  /**
   * Fetches existing row, merges the update, writes back.
   * Throws SessionNotFoundError if the id does not exist.
   * App sets updated_at explicitly — no DB trigger.
   */
  async updateSession(id: string, update: Partial<GameSession>): Promise<GameSession> {
    const existing = await this.getSession(id);
    if (!existing) throw new SessionNotFoundError(id);

    const [row] = await db
      .update(gameSessions)
      .set({
        worldState: update.worldState ?? existing.worldState,
        status: update.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(gameSessions.id, id))
      .returning();

    return toGameSession(row);
  }
}
