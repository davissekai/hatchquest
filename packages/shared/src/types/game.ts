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

// World state — PLACEHOLDER. Davis defines the actual variables.
// Replace this stub once the world state model is decided.
export interface WorldState {
  // Seed for the JS PRNG — determines procedural market parameters
  seed: number;

  // === PLACEHOLDER FIELDS — Davis to define ===
  // Financial
  capital: number;

  // Reputation & social capital — clamped [0, 80]
  reputation: number;
  network: number;

  // EO profile tracked throughout gameplay (hidden from client during play)
  eoProfile: EOProfile;

  // Current layer (0–5)
  layer: number;

  // Which event node the player is on
  currentNodeId: string | null;

  // Completed at layer 5
  isComplete: boolean;
}
