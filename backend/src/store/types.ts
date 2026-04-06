import type { GameSession } from "@hatchquest/shared";

/** Thrown when an operation targets a session id that does not exist. */
export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session not found: ${id}`);
    this.name = "SessionNotFoundError";
  }
}

/**
 * Async session store interface.
 * Both the in-memory store and the DB-backed store implement this.
 * Routes type their `store` option as ISessionStore — not a concrete class.
 */
export interface ISessionStore {
  /** Creates a new active session and persists it. */
  createSession(playerName: string, email: string): Promise<GameSession>;
  /** Returns the session for the given id, or undefined if not found. */
  getSession(id: string): Promise<GameSession | undefined>;
  /**
   * Merges a partial update into the session and bumps updatedAt.
   * Throws SessionNotFoundError if the session does not exist.
   */
  updateSession(id: string, update: Partial<GameSession>): Promise<GameSession>;
}
