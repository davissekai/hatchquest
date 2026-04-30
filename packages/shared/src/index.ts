// HatchQuest shared types — single source of truth for frontend + backend
// World state model and shared types — single source of truth for frontend + backend.

export type {
  WorldState,
  EOProfile,
  EODimension,
  EOPoleDistribution,
  BusinessSector,
  BusinessFormality,
  RecentChoice,
  StoryMemory,
} from "./types/game.js";
export { BUSINESS_SECTORS } from "./types/game.js";
export type { GameSession, SessionStatus, NarrationSource } from "./types/session.js";
export type { PlayerContext } from "./types/context.js";
export type {
  ClientWorldState,
  StartRequest,
  StartResponse,
  ClassifyRequest,
  ClassifyResponse,
  ClassifyQ1Request,
  ClassifyQ1Response,
  ClassifyQ2Request,
  ClassifyQ2Response,
  ChoiceRequest,
  ChoiceResponse,
  SessionResponse,
  ResultsResponse,
  ScenarioNode,
  Choice,
} from "./types/api.js";
export type { ScenarioSkeleton, ChoiceArchetype, NarrativeSkin } from "./types/skeleton.js";
export type { WorldEvent, WorldEventLogEntry } from "./types/world.js";
