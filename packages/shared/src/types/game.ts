import type { PlayerContext } from "./context.js";
import type { WorldEventLogEntry } from "./world.js";
import type { NarrativeSkin } from "./skeleton.js";

// EO framework dimensions (Lumpkin & Dess, 1996)
export type EODimension =
  | "autonomy"
  | "innovativeness"
  | "riskTaking"
  | "proactiveness"
  | "competitiveAggressiveness";

// EO score per dimension — value in [0, 10]
export interface EOProfile {
  autonomy: number;
  innovativeness: number;
  riskTaking: number;
  proactiveness: number;
  competitiveAggressiveness: number;
}

// Layer 0 classifier pole distributions
export interface EOPoleDistribution {
  // Each pole pair sums to 1.0
  values: { peopleFocused: number; profitFocused: number };
  risk: { tolerant: number; averse: number };
  orientation: { proactive: number; reactive: number };
  agency: { autonomous: number; collaborative: number };
  competitive: { aggressive: number; measured: number };
}

// Business sector — set during Layer 0 classification
export type BusinessSector =
  | "tech"
  | "agri"
  | "retail"
  | "food"
  | "services"
  | "other";

// Canonical list of all business sectors — kept in sync with BusinessSector.
// Used for exhaustive checks, iteration, and runtime validation.
export const BUSINESS_SECTORS: readonly BusinessSector[] = [
  "tech",
  "agri",
  "retail",
  "food",
  "services",
  "other",
] as const;

// A compact record of a recent choice — used by Narrator AI to generate
// continuity callbacks ("After you delayed the launch...") and by the
// Director AI for pattern-repeat suppression.
export interface RecentChoice {
  nodeId: string;
  choiceLabel: string;
  effectSummary: string;
}

// Business formality progression
export type BusinessFormality = "unregistered" | "soleProprietorship" | "limitedCompany";

/**
 * Story memory — captures the narrative thread and continuity anchors from the
 * Layer 0 arc so the first gameplay node continues cleanly from Q2.
 */
export interface StoryMemory {
  /** Short summary of what just happened in the story */
  lastBeatSummary: string;
  /** Unresolved narrative tension to pull forward */
  openThread: string;
  /** Specific bridge phrase the next scene should build from */
  continuityAnchor: string;
  /** Optional summary of how the founder tends to decide under pressure */
  recentDecisionStyle?: string;
  /** The current narrative arc name (e.g., "The Makola Launch") */
  currentArc: string;
}

// === WORLD STATE ===
// The brain of the game. All game logic reads from and writes to this.
// Director AI uses these variables to weight event selection.
export interface WorldState {
  // --- Meta ---
  seed: number; // JS PRNG seed — determines procedural market parameters
  layer: number; // Current layer (0–10)
  currentNodeId: string | null; // Which event node the player is on
  turnsElapsed: number; // Total decisions made
  isComplete: boolean; // True at layer 10

  // --- Identity (set during Layer 0 classify) ---
  /** Business sector inferred from Layer 0 — drives narrator framing and director affinity. */
  sector: BusinessSector;
  /** Clean, display-safe business description used in deterministic narration. */
  businessDescription: string;
  /** Most recent choices (newest first, max length 3) — used for narrator callbacks. */
  choiceHistory: RecentChoice[];
  /** Narrative pattern tags of the last 2 scenarios — used to suppress pattern repeats. */
  recentPatterns: string[];
  /** Narrative continuity memory from the Layer 0 arc. */
  storyMemory: StoryMemory | null;
  /** Cached generated content for the current node. */
  currentNodeContent: NarrativeSkin | null;

  // --- Financial (GHS) ---
  capital: number; // Starting: 10,000 GHS
  monthlyBurn: number; // Starting: 1,000–2,000 GHS (varies per player)
  revenue: number; // Monthly revenue, starts at 0
  debt: number; // Accumulated debt, starts at 0

  // --- Business ---
  employeeCount: number; // Starts at 0 (solo founder)
  businessFormality: BusinessFormality; // Starts unregistered
  hasBackupPower: boolean; // Dumsor resilience
  hasPremises: boolean; // Home-based vs rented space
  /** Clean player business identity — set during Layer 0 classification */
  playerContext: PlayerContext | null;

  // --- Social Capital ---
  reputation: number; // [0–100] Trust/credibility in the market. Starts at 0.
  networkStrength: number; // [0–100] Connections, referrals, access. Starts at 0.
  susuMember: boolean; // Rotating savings group membership
  mentorAccess: boolean; // GEA/NEIP/BAC linkage

  // --- Environment (procedural, seeded per session) ---
  marketDemand: number; // [0–100] Sector demand in Accra
  infrastructureReliability: number; // [0–100] Power/internet stability
  regulatoryPressure: number; // [0–100] Compliance burden
  competitorAggression: number; // [0–100] Informal market pressure

  // --- EO Profile (hidden from client during gameplay) ---
  eoProfile: EOProfile;

  // --- World event flags (set by world events, reset each session) ---
  capitalAccessOpen: boolean; // BoG rate cut unlocked cheaper capital
  underAudit: boolean; // Regulatory audit in progress
  vcWindowOpen: boolean; // VC roadshow season active
  hiringDifficulty: number; // [0-100] labour market tightness

  // --- World event history ---
  worldEventHistory: WorldEventLogEntry[];
}
