import { describe, it, expect } from "vitest";
import { calculateEOScores, calculateAcumenScore } from "../scoring";
import { GameState, Dimensions, Resources } from "@/types/game";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeState(dimensions: Dimensions): GameState {
  return {
    session: {
      playerId: "player_test",
      currentNarrativeId: "beat_30",
      isStoryComplete: true,
      history: [],
    },
    resources: {
      capital: 8000,
      reputation: 50,
      network: 10,
      momentumMultiplier: 1.0,
    },
    dimensions,
    flags: { hasDebt: false, hiredTeam: false },
  };
}

function makeResources(overrides: Partial<Resources> = {}): Resources {
  return {
    capital: 0,
    reputation: 0,
    network: 0,
    momentumMultiplier: 1.0,
    ...overrides,
  };
}

const zeroDimensions: Dimensions = {
  autonomy: 0,
  innovativeness: 0,
  proactiveness: 0,
  riskTaking: 0,
  competitiveAggressiveness: 0,
};

// MAX_DIMENSION_SCORE = 10
const maxDimensions: Dimensions = {
  autonomy: 10,
  innovativeness: 10,
  proactiveness: 10,
  riskTaking: 10,
  competitiveAggressiveness: 10,
};

const midDimensions: Dimensions = {
  autonomy: 5,
  innovativeness: 2.5,
  proactiveness: 7.5,
  riskTaking: 4,
  competitiveAggressiveness: 2,
};

// ─── calculateEOScores ────────────────────────────────────────────────────────

describe("calculateEOScores()", () => {
  it("returns 0 for all dimensions when raw scores are 0", () => {
    const result = calculateEOScores(makeState(zeroDimensions));
    expect(result.autonomy).toBe(0);
    expect(result.innovativeness).toBe(0);
    expect(result.proactiveness).toBe(0);
    expect(result.riskTaking).toBe(0);
    expect(result.competitiveAggressiveness).toBe(0);
  });

  it("returns 100 for all dimensions when raw scores are at max (10)", () => {
    const result = calculateEOScores(makeState(maxDimensions));
    expect(result.autonomy).toBe(100);
    expect(result.innovativeness).toBe(100);
    expect(result.proactiveness).toBe(100);
    expect(result.riskTaking).toBe(100);
    expect(result.competitiveAggressiveness).toBe(100);
  });

  it("normalizes mid-range scores correctly", () => {
    const result = calculateEOScores(makeState(midDimensions));
    // autonomy: 5/10 * 100 = 50
    expect(result.autonomy).toBe(50);
    // innovativeness: 2.5/10 * 100 = 25
    expect(result.innovativeness).toBe(25);
    // proactiveness: 7.5/10 * 100 = 75
    expect(result.proactiveness).toBe(75);
    // riskTaking: 4/10 * 100 = 40
    expect(result.riskTaking).toBe(40);
    // competitiveAggressiveness: 2/10 * 100 = 20
    expect(result.competitiveAggressiveness).toBe(20);
  });

  it("clamps scores above max to 100", () => {
    const overMax: Dimensions = { ...zeroDimensions, autonomy: 15 };
    const result = calculateEOScores(makeState(overMax));
    expect(result.autonomy).toBe(100);
  });

  it("does not mutate the input state", () => {
    const state = makeState(midDimensions);
    const originalAutonomy = state.dimensions.autonomy;
    calculateEOScores(state);
    expect(state.dimensions.autonomy).toBe(originalAutonomy);
  });

  it("each dimension is normalized independently", () => {
    const mixed: Dimensions = {
      autonomy: 10,
      innovativeness: 0,
      proactiveness: 5,
      riskTaking: 0,
      competitiveAggressiveness: 10,
    };
    const result = calculateEOScores(makeState(mixed));
    expect(result.autonomy).toBe(100);
    expect(result.innovativeness).toBe(0);
    expect(result.proactiveness).toBe(50);
    expect(result.riskTaking).toBe(0);
    expect(result.competitiveAggressiveness).toBe(100);
  });
});

// ─── calculateAcumenScore ─────────────────────────────────────────────────────

describe("calculateAcumenScore()", () => {
  it("returns 0 when all normalized dimensions and all resources are 0", () => {
    // eoScore=0, resourceScore=0 → composite=0
    const normalized: Dimensions = { ...zeroDimensions };
    const resources = makeResources();
    expect(calculateAcumenScore(normalized, resources)).toBe(0);
  });

  it("returns 100 when all dimensions are 100 and all resources are maxed", () => {
    // eoScore=100, capital=50K, rep=80, net=80 → resourceScore=100 → composite=100
    const normalized: Dimensions = {
      autonomy: 100,
      innovativeness: 100,
      proactiveness: 100,
      riskTaking: 100,
      competitiveAggressiveness: 100,
    };
    const resources = makeResources({ capital: 50000, reputation: 80, network: 80 });
    expect(calculateAcumenScore(normalized, resources)).toBe(100);
  });

  it("computes composite correctly — equal EO and resource contribution", () => {
    // eoScore = (100+100+100+100+100)/5 = 100
    // capital=25000 → capitalScore=50, rep=40 → repScore=50, net=40 → networkScore=50
    // resourceScore = 50*0.6 + 50*0.2 + 50*0.2 = 50
    // composite = 100*0.5 + 50*0.5 = 75
    const normalized: Dimensions = {
      autonomy: 100,
      innovativeness: 100,
      proactiveness: 100,
      riskTaking: 100,
      competitiveAggressiveness: 100,
    };
    const resources = makeResources({ capital: 25000, reputation: 40, network: 40 });
    expect(calculateAcumenScore(normalized, resources)).toBe(75);
  });

  it("capital dominates resource score (60% weight)", () => {
    // eoScore=0, capital=50000 → capitalScore=100, rep=0, net=0
    // resourceScore = 100*0.6 = 60
    // composite = 0*0.5 + 60*0.5 = 30
    const normalized: Dimensions = { ...zeroDimensions };
    const resources = makeResources({ capital: 50000 });
    expect(calculateAcumenScore(normalized, resources)).toBe(30);
  });

  it("rounds result to 2 decimal places", () => {
    // eoScore = (33+33+33+33+34)/5 = 33.2
    // resources all zero → composite = 33.2 * 0.5 = 16.6
    const normalized: Dimensions = {
      autonomy: 33,
      innovativeness: 33,
      proactiveness: 33,
      riskTaking: 33,
      competitiveAggressiveness: 34,
    };
    const resources = makeResources();
    expect(calculateAcumenScore(normalized, resources)).toBeCloseTo(16.6, 1);
  });
});
