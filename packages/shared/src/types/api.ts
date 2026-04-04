import type { EOPoleDistribution, WorldState } from "./game.js";
import type { GameSession } from "./session.js";

// POST /start
export interface StartRequest {
  playerId?: string;
}
export interface StartResponse {
  sessionId: string;
  layer0Questions: string[];
}

// POST /classify  (Layer 0 free-text → EO poles)
export interface ClassifyRequest {
  sessionId: string;
  responses: string[]; // one per layer0Question
}
export interface ClassifyResponse {
  sessionId: string;
  poleDistribution: EOPoleDistribution;
  // Which of the 5 Layer 1 nodes the player is routed to
  layer1NodeId: string;
}

// POST /choice
export interface ChoiceRequest {
  sessionId: string;
  nodeId: string;
  choiceIndex: 0 | 1 | 2;
}
export interface ChoiceResponse {
  sessionId: string;
  worldState: Omit<WorldState, "eoProfile">; // EO hidden during play
  nextNode: ScenarioNode | null; // null = game over
}

// GET /results/:sessionId
export interface ResultsResponse {
  sessionId: string;
  session: GameSession;
  // EO profile revealed only at game end
  eoProfile: WorldState["eoProfile"];
  summary: string;
}

// Scenario node shape returned to the client
export interface ScenarioNode {
  id: string;
  layer: number;
  narrative: string;
  choices: Choice[];
}

export interface Choice {
  index: 0 | 1 | 2;
  text: string;
  // Preamble hint — describes the tension without revealing EO labels
  tensionHint: string;
}
