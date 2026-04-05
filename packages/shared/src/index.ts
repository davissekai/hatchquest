// HatchQuest shared types — single source of truth for frontend + backend
// Davis defines the world state model; types go here before either side implements.

export type {
  WorldState,
  EOProfile,
  EODimension,
  EOPoleDistribution,
  BusinessSector,
  BusinessFormality,
} from "./types/game.js";
export type { GameSession, SessionStatus } from "./types/session.js";
export type {
  StartRequest,
  StartResponse,
  ClassifyRequest,
  ClassifyResponse,
  ChoiceRequest,
  ChoiceResponse,
  ResultsResponse,
} from "./types/api.js";
