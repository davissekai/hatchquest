import type { GameSession } from "@hatchquest/shared";
import { createInitialWorldState } from "../engine/index.js";
import { SessionNotFoundError, type ISessionStore } from "./types.js";

// Re-export for callers that import SessionNotFoundError from this module (backward compat)
export { SessionNotFoundError } from "./types.js";

export class SessionStore implements ISessionStore {
  // Internal map keyed by session id
  private readonly sessions: Map<string, GameSession> = new Map();

  /**
   * Creates a new session for a player and stores it.
   * Sector defaults to "tech" — overwritten by /classify once the player's response is classified.
   */
  async createSession(playerName: string, email: string): Promise<GameSession> {
    const id = crypto.randomUUID();
    // Integer seed in [0, 999999] — sufficient entropy for procedural market generation
    const seed = (Math.random() * 1_000_000) | 0;
    const worldState = createInitialWorldState({ seed });
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
  async getSession(id: string): Promise<GameSession | undefined> {
    return this.sessions.get(id);
  }

  /**
   * Merges a partial update into the session and bumps updatedAt.
   * Throws SessionNotFoundError if the session does not exist.
   */
  async updateSession(id: string, update: Partial<GameSession>): Promise<GameSession> {
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
