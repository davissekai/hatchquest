import type { EOProfile, BusinessFormality } from "./game.js";
import type { GameSession } from "./session.js";

// Client-safe world state — what the frontend can see during gameplay.
// Strips eoProfile (revealed only at results), environment variables
// (Director AI internals), and the full playerContext (server-side only).
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
  // sector removed — now lives inside playerContext (server-side).
  // playerBusinessName is the display-safe label extracted from playerContext.
  playerBusinessName: string | null;
  employeeCount: number;
  businessFormality: BusinessFormality;
  hasBackupPower: boolean;
  hasPremises: boolean;
  susuMember: boolean;
  mentorAccess: boolean;
  worldSignals: {
    marketHeat: number;              // [0-100] derived from marketDemand
    competitorThreat: number;        // [0-100] derived from competitorAggression
    infrastructureStability: number; // [0-100] from infrastructureReliability
    lastEventLabel: string | null;   // most recent world event label
    /**
     * Up to 2 rotating secondary signals — short human labels like
     * "Capital access open", "Under audit". Chosen deterministically by turn
     * from the active world-event flags so the HUD stays stable across polls.
     */
    secondarySignals: string[];
  };
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
  preamble: string;        // narrative world intro — fills first viewport
  layer0Question: string;  // Q1 — open-ended free-text prompt
}

// POST /api/game/classify — legacy single-step (kept for backward compat)
export interface ClassifyRequest {
  sessionId: string;
  response: string;
}
export interface ClassifyResponse {
  sessionId: string;
  layer1NodeId: string;
}

// POST /api/game/classify-q1 — two-step flow: Q1 response → AI generates Q2 prompt
export interface ClassifyQ1Request {
  sessionId: string;
  q1Response: string;
}
export interface ClassifyQ1Response {
  sessionId: string;
  q2Prompt: string; // AI-generated follow-up question personalised to the player's business
}

// POST /api/game/classify-q2 — Q2 response → EO poles → Layer 1 node assignment
export interface ClassifyQ2Request {
  sessionId: string;
  q2Response: string;
}
export interface ClassifyQ2Response {
  sessionId: string;
  layer1NodeId: string;
}

// POST /api/game/choice
export interface ChoiceRequest {
  sessionId: string;
  nodeId: string;
  choiceIndex: 0 | 1 | 2;
  freeText?: string; // optional — for free-text choice variants
  /** LLM-generated choice text displayed to the player. Used as the narrator
   *  continuity callback on the next turn instead of the generic archetype label. */
  chosenText?: string;
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
