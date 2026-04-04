import type { WorldState } from "./game.js";

export type SessionStatus = "active" | "complete" | "expired";

export interface GameSession {
  id: string;
  playerId: string | null;
  worldState: WorldState;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}
