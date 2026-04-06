import type { EOProfile, BusinessSector, BusinessFormality } from "./game.js";
import type { GameSession } from "./session.js";

// Client-safe world state — what the frontend can see during gameplay.
// Strips eoProfile (revealed only at results) and all environment variables
// (Director AI internals — marketDemand, infrastructureReliability, etc.).
export interface ClientWorldState {
  capital: number;
  monthlyBurn: number;
  revenue: number;
  debt: number;
  reputation: number;
  networkStrength: number;
  layer: number;
  turnsElapsed: number;
  isComplete: boolean;
  sector: BusinessSector;
  employeeCount: number;
  businessFormality: BusinessFormality;
  hasBackupPower: boolean;
  hasPremises: boolean;
  susuMember: boolean;
  mentorAccess: boolean;
}

// POST /api/game/start
// password is accepted to satisfy the frontend contract but auth is not yet implemented.
export interface StartRequest {
  playerName: string;
  email: string;
  password: string;
}
export interface StartResponse {
  sessionId: string;
  layer0Question: string; // single open-ended free-text prompt
}

// POST /api/game/classify — Layer 0 free-text → EO poles → Layer 1 node
export interface ClassifyRequest {
  sessionId: string;
  response: string; // player's free-text answer to the layer0Question
}
export interface ClassifyResponse {
  sessionId: string;
  layer1NodeId: string; // which Layer 1 node the player is routed to — poles stay server-side
}

// POST /api/game/choice
export interface ChoiceRequest {
  sessionId: string;
  nodeId: string;
  choiceIndex: 0 | 1 | 2;
}
export interface ChoiceResponse {
  sessionId: string;
  clientState: ClientWorldState;
  nextNode: ScenarioNode | null; // null = game complete
}

// GET /api/game/session/:sessionId
export interface SessionResponse {
  sessionId: string;
  clientState: ClientWorldState;
  currentNode: ScenarioNode | null;
}

// GET /api/game/results/:sessionId — only available when isComplete = true
export interface ResultsResponse {
  sessionId: string;
  session: GameSession;
  eoProfile: EOProfile; // revealed only at game end
  clientState: ClientWorldState;
  summary: string;
}

// Scenario node returned to the client for rendering
export interface ScenarioNode {
  id: string;
  layer: number;
  narrative: string;
  choices: Choice[];
}

export interface Choice {
  index: 0 | 1 | 2;
  text: string;
  tensionHint: string; // describes the EO tension without labelling the dimensions
}
