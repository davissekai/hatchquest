// TODO: replace with Drizzle/Supabase persistence before production
import type { GameSession } from "@hatchquest/shared";
import { createInitialWorldState } from "../engine/index.js";

/** Thrown when an operation targets a session id that does not exist. */
export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session not found: ${id}`);
    this.name = "SessionNotFoundError";
  }
}

export class SessionStore {
  // Internal map keyed by session id
  private readonly sessions: Map<string, GameSession> = new Map();

  /**
   * Creates a new session for a player and stores it.
   * Sector defaults to "tech" — overwritten by /classify once the player's response is classified.
   */
  createSession(playerName: string, email: string): GameSession {
    const id = crypto.randomUUID();
    // Integer seed in [0, 999999] — sufficient entropy for procedural market generation
    const seed = (Math.random() * 1_000_000) | 0;
    const worldState = createInitialWorldState({ seed, sector: "tech" });
    const now = new Date().toISOString();

    const session: GameSession = {
      id,
      playerId: email,
      worldState,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, session);
    return session;
  }

  /** Returns the session for the given id, or undefined if not found. */
  getSession(id: string): GameSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Merges a partial update into the session and bumps updatedAt.
   * Throws SessionNotFoundError if the session does not exist.
   */
  updateSession(id: string, update: Partial<GameSession>): GameSession {
    const existing = this.sessions.get(id);
    if (!existing) throw new SessionNotFoundError(id);

    const updated: GameSession = {
      ...existing,
      ...update,
      id, // id is immutable
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(id, updated);
    return updated;
  }
}

/** Singleton store — routes import this directly. */
export const sessionStore = new SessionStore();
