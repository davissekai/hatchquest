import type { PlayerContext } from "./context.js";
import type { StoryMemory } from "./game.js";
import type { NarrativeSkin } from "./skeleton.js";
import type { WorldState } from "./game.js";

export type SessionStatus = "active" | "complete" | "expired";
export type NarrationSource = "llm" | "fallback" | "validator-rejected";

export interface GameSession {
  id: string;
  playerId: string | null;
  worldState: WorldState;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  layer0Q1Response: string | null;
  layer0Q2Prompt: string | null;
  layer0Q2Response: string | null;
  playerContext: PlayerContext | null;
  storyMemory: StoryMemory | null;
  generatedCurrentNode: NarrativeSkin | null;
  generatedCurrentNodeId: string | null;
  generatedCurrentNodeCreatedAt: string | null;
  narrationSource: NarrationSource | null;
}
