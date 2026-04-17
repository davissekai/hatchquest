import { eq } from "drizzle-orm";
import type { GameSession, SessionStatus } from "@hatchquest/shared";
import { db } from "../db/client.js";
import { gameSessions } from "../db/schema.js";
import { createInitialWorldState } from "../engine/index.js";
import { SessionNotFoundError, type ISessionStore } from "./types.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function pickUpdateValue<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

/** Maps a game_sessions DB row to the shared GameSession type. */
function toGameSession(row: typeof gameSessions.$inferSelect): GameSession {
  return {
    id: row.id,
    // player_id FK not wired for demo phase — auth is a separate task
    playerId: row.playerId ?? null,
    worldState: row.worldState,
    status: row.status as SessionStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    layer0Q1Response: row.layer0Q1Response ?? null,
    layer0Q2Prompt: row.layer0Q2Prompt ?? null,
    layer0Q2Response: row.layer0Q2Response ?? null,
    playerContext: row.playerContext ?? null,
    storyMemory: row.storyMemory ?? null,
    generatedCurrentNode: row.generatedCurrentNode ?? null,
    generatedCurrentNodeId: row.generatedCurrentNodeId ?? null,
    generatedCurrentNodeCreatedAt: toIsoString(row.generatedCurrentNodeCreatedAt),
    narrationSource: row.narrationSource ?? null,
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
    void playerName;
    // Pre-generate id so callers get a predictable UUID without a round-trip
    const id = crypto.randomUUID();
    const seed = (Math.random() * 1_000_000) | 0;
    const worldState = createInitialWorldState({ seed });

    const [row] = await db
      .insert(gameSessions)
      .values({
        id,
        playerId: null,
        worldState,
        status: "active",
      })
      .returning();

    void email;
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
        worldState: pickUpdateValue(update.worldState, existing.worldState),
        status: pickUpdateValue(update.status, existing.status),
        layer0Q1Response: pickUpdateValue(update.layer0Q1Response, existing.layer0Q1Response),
        layer0Q2Prompt: pickUpdateValue(update.layer0Q2Prompt, existing.layer0Q2Prompt),
        layer0Q2Response: pickUpdateValue(update.layer0Q2Response, existing.layer0Q2Response),
        playerContext: pickUpdateValue(update.playerContext, existing.playerContext),
        storyMemory: pickUpdateValue(update.storyMemory, existing.storyMemory),
        generatedCurrentNode: pickUpdateValue(
          update.generatedCurrentNode,
          existing.generatedCurrentNode
        ),
        generatedCurrentNodeId: pickUpdateValue(
          update.generatedCurrentNodeId,
          existing.generatedCurrentNodeId
        ),
        generatedCurrentNodeCreatedAt:
          update.generatedCurrentNodeCreatedAt === undefined
            ? existing.generatedCurrentNodeCreatedAt
              ? new Date(existing.generatedCurrentNodeCreatedAt)
              : null
            : update.generatedCurrentNodeCreatedAt
              ? new Date(update.generatedCurrentNodeCreatedAt)
              : null,
        narrationSource: pickUpdateValue(update.narrationSource, existing.narrationSource),
        updatedAt: new Date(),
      })
      .where(eq(gameSessions.id, id))
      .returning();

    return toGameSession(row);
  }
}
