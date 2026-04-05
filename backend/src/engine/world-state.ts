import type { BusinessSector, WorldState } from "@hatchquest/shared";
import { createPRNG } from "./prng.js";

interface CreateWorldStateParams {
  seed: number;
  sector: BusinessSector;
}

// Generates the initial world state for a new game session.
// Environment variables and monthly burn are procedurally derived from the seed.
export function createInitialWorldState(
  params: CreateWorldStateParams
): WorldState {
  const { seed, sector } = params;
  const rng = createPRNG(seed);

  // Helper: random integer in [min, max] inclusive
  const randInt = (min: number, max: number): number =>
    Math.floor(rng() * (max - min + 1)) + min;

  return {
    // Meta
    seed,
    layer: 0,
    currentNodeId: null,
    turnsElapsed: 0,
    isComplete: false,

    // Financial (GHS)
    capital: 10_000,
    monthlyBurn: randInt(1_000, 2_000),
    revenue: 0,
    debt: 0,

    // Business
    sector,
    employeeCount: 0,
    businessFormality: "unregistered",
    hasBackupPower: false,
    hasPremises: false,

    // Social capital
    reputation: 0,
    networkStrength: 0,
    susuMember: false,
    mentorAccess: false,

    // Environment (procedural)
    marketDemand: randInt(20, 80),
    infrastructureReliability: randInt(30, 70),
    regulatoryPressure: randInt(10, 60),
    competitorAggression: randInt(20, 75),

    // EO profile — neutral midpoint
    eoProfile: {
      autonomy: 5,
      innovativeness: 5,
      riskTaking: 5,
      proactiveness: 5,
      competitiveAggressiveness: 5,
    },
  };
}
