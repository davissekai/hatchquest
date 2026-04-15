import type { PlayerContext } from "./context.js";

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
export type BusinessSector = "tech" | "agri" | "retail" | "food" | "services";

// Business formality progression
export type BusinessFormality = "unregistered" | "soleProprietorship" | "limitedCompany";

// === WORLD STATE ===
// The brain of the game. All game logic reads from and writes to this.
// Director AI uses these variables to weight event selection.
export interface WorldState {
  // --- Meta ---
  seed: number; // JS PRNG seed — determines procedural market parameters
  layer: number; // Current layer (0–5)
  currentNodeId: string | null; // Which event node the player is on
  turnsElapsed: number; // Total decisions made
  isComplete: boolean; // True at layer 5

  // --- Financial (GHS) ---
  capital: number; // Starting: 10,000 GHS
  monthlyBurn: number; // Starting: 1,000–2,000 GHS (varies per player)
  revenue: number; // Monthly revenue, starts at 0
  debt: number; // Accumulated debt, starts at 0

  // --- Business ---
  sector: BusinessSector; // Set during Layer 0
  employeeCount: number; // Starts at 0 (solo founder)
  businessFormality: BusinessFormality; // Starts unregistered
  hasBackupPower: boolean; // Dumsor resilience
  hasPremises: boolean; // Home-based vs rented space

  /** Player's business identity — set during Layer 0 classification */
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
}
