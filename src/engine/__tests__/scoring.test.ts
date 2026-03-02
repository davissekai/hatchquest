import { describe, it, expect } from "vitest";
import { calculateEOScores, calculateAcumenScore } from "../scoring";
import { GameState, Dimensions } from "@/types/game";

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

const zeroDimensions: Dimensions = {
  autonomy: 0,
  innovativeness: 0,
  proactiveness: 0,
  riskTaking: 0,
  competitiveAggressiveness: 0,
};

const maxDimensions: Dimensions = {
  autonomy: 20,
  innovativeness: 20,
  proactiveness: 20,
  riskTaking: 20,
  competitiveAggressiveness: 20,
};

const midDimensions: Dimensions = {
  autonomy: 10,
  innovativeness: 5,
  proactiveness: 15,
  riskTaking: 8,
  competitiveAggressiveness: 4,
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

  it("returns 100 for all dimensions when raw scores are at max (20)", () => {
    const result = calculateEOScores(makeState(maxDimensions));
    expect(result.autonomy).toBe(100);
    expect(result.innovativeness).toBe(100);
    expect(result.proactiveness).toBe(100);
    expect(result.riskTaking).toBe(100);
    expect(result.competitiveAggressiveness).toBe(100);
  });

  it("normalizes mid-range scores correctly", () => {
    const result = calculateEOScores(makeState(midDimensions));
    // autonomy: 10/20 * 100 = 50
    expect(result.autonomy).toBe(50);
    // innovativeness: 5/20 * 100 = 25
    expect(result.innovativeness).toBe(25);
    // proactiveness: 15/20 * 100 = 75
    expect(result.proactiveness).toBe(75);
    // riskTaking: 8/20 * 100 = 40
    expect(result.riskTaking).toBe(40);
    // competitiveAggressiveness: 4/20 * 100 = 20
    expect(result.competitiveAggressiveness).toBe(20);
  });

  it("clamps scores above max to 100", () => {
    const overMax: Dimensions = { ...zeroDimensions, autonomy: 25 };
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
      autonomy: 20,
      innovativeness: 0,
      proactiveness: 10,
      riskTaking: 0,
      competitiveAggressiveness: 20,
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
  it("returns 0 when all normalized dimensions are 0", () => {
    const normalized: Dimensions = { ...zeroDimensions };
    expect(calculateAcumenScore(normalized)).toBe(0);
  });

  it("returns 100 when all normalized dimensions are 100", () => {
    const normalized: Dimensions = {
      autonomy: 100,
      innovativeness: 100,
      proactiveness: 100,
      riskTaking: 100,
      competitiveAggressiveness: 100,
    };
    expect(calculateAcumenScore(normalized)).toBe(100);
  });

  it("returns correct average of 5 dimensions", () => {
    const normalized: Dimensions = {
      autonomy: 50,
      innovativeness: 25,
      proactiveness: 75,
      riskTaking: 40,
      competitiveAggressiveness: 20,
    };
    // (50 + 25 + 75 + 40 + 20) / 5 = 42
    expect(calculateAcumenScore(normalized)).toBe(42);
  });

  it("rounds result to 2 decimal places", () => {
    const normalized: Dimensions = {
      autonomy: 100,
      innovativeness: 0,
      proactiveness: 0,
      riskTaking: 0,
      competitiveAggressiveness: 0,
    };
    // 100 / 5 = 20.00
    expect(calculateAcumenScore(normalized)).toBe(20);
  });

  it("handles non-round averages correctly", () => {
    const normalized: Dimensions = {
      autonomy: 33,
      innovativeness: 33,
      proactiveness: 33,
      riskTaking: 33,
      competitiveAggressiveness: 34,
    };
    // (33+33+33+33+34) / 5 = 33.2
    expect(calculateAcumenScore(normalized)).toBeCloseTo(33.2, 1);
  });
});
