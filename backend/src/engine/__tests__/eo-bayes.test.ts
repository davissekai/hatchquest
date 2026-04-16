import { describe, it, expect } from "vitest";
import {
  seedFromClassifier,
  computeDifficulty,
  updatePosterior,
  posteriorsToProfile,
} from "../eo-bayes.js";
import type { EOPoleDistribution } from "@hatchquest/shared";

// Helper to build a balanced (neutral) pole distribution
function neutralPoles(): EOPoleDistribution {
  return {
    agency: { autonomous: 0.5, collaborative: 0.5 },
    values: { peopleFocused: 0.5, profitFocused: 0.5 },
    risk: { tolerant: 0.5, averse: 0.5 },
    orientation: { proactive: 0.5, reactive: 0.5 },
    competitive: { aggressive: 0.5, measured: 0.5 },
  };
}

// Helper to build a strongly autonomous, risk-tolerant, proactive pole distribution
function strongAutonomousPoles(): EOPoleDistribution {
  return {
    agency: { autonomous: 0.9, collaborative: 0.1 },
    values: { peopleFocused: 0.2, profitFocused: 0.8 },
    risk: { tolerant: 0.85, averse: 0.15 },
    orientation: { proactive: 0.9, reactive: 0.1 },
    competitive: { aggressive: 0.8, measured: 0.2 },
  };
}

// Helper to build a strongly collaborative, risk-averse pole distribution
function strongCollaborativePoles(): EOPoleDistribution {
  return {
    agency: { autonomous: 0.1, collaborative: 0.9 },
    values: { peopleFocused: 0.8, profitFocused: 0.2 },
    risk: { tolerant: 0.15, averse: 0.85 },
    orientation: { proactive: 0.1, reactive: 0.9 },
    competitive: { aggressive: 0.2, measured: 0.8 },
  };
}

// ─── seedFromClassifier ───────────────────────────────────────────────────────

describe("seedFromClassifier", () => {
  it("returns posteriors for all 5 EO dimensions", () => {
    const posteriors = seedFromClassifier(neutralPoles());
    expect(posteriors).toHaveProperty("autonomy");
    expect(posteriors).toHaveProperty("innovativeness");
    expect(posteriors).toHaveProperty("riskTaking");
    expect(posteriors).toHaveProperty("proactiveness");
    expect(posteriors).toHaveProperty("competitiveAggressiveness");
  });

  it("each posterior has mean and variance", () => {
    const posteriors = seedFromClassifier(neutralPoles());
    for (const dim of Object.values(posteriors)) {
      expect(typeof dim.mean).toBe("number");
      expect(typeof dim.variance).toBe("number");
    }
  });

  it("neutral poles produce mean close to 5 (neutral)", () => {
    const posteriors = seedFromClassifier(neutralPoles());
    // Confidence = |0.5 - 0.5| = 0 → toMean(±1, 0) = 5 + ±1 * 0 * 5 = 5
    expect(posteriors.autonomy.mean).toBeCloseTo(5);
    expect(posteriors.innovativeness.mean).toBeCloseTo(5);
    expect(posteriors.riskTaking.mean).toBeCloseTo(5);
    expect(posteriors.proactiveness.mean).toBeCloseTo(5);
    expect(posteriors.competitiveAggressiveness.mean).toBeCloseTo(5);
  });

  it("strong autonomous poles push autonomy mean above 5", () => {
    const posteriors = seedFromClassifier(strongAutonomousPoles());
    // agency.autonomous=0.9 > 0.5, confidence=|0.9-0.1|=0.8 → mean = 5 + 1*0.8*5 = 9
    expect(posteriors.autonomy.mean).toBeGreaterThan(5);
  });

  it("strong collaborative poles push autonomy mean below 5", () => {
    const posteriors = seedFromClassifier(strongCollaborativePoles());
    // agency.autonomous=0.1 < 0.5, confidence=|0.1-0.9|=0.8 → mean = 5 + (-1)*0.8*5 = 1
    expect(posteriors.autonomy.mean).toBeLessThan(5);
  });

  it("strong profit-focused poles push innovativeness mean above 5", () => {
    const posteriors = seedFromClassifier(strongAutonomousPoles());
    // values.profitFocused=0.8 > 0.5 → mean > 5
    expect(posteriors.innovativeness.mean).toBeGreaterThan(5);
  });

  it("strong risk-tolerant poles push riskTaking mean above 5", () => {
    const posteriors = seedFromClassifier(strongAutonomousPoles());
    expect(posteriors.riskTaking.mean).toBeGreaterThan(5);
  });

  it("high confidence produces lower variance", () => {
    const highConf = seedFromClassifier(strongAutonomousPoles());
    const lowConf = seedFromClassifier(neutralPoles());
    // High confidence confidence=0.8 → variance = 2.5/0.8 ≈ 3.125
    // Low confidence confidence=0 → variance = 2.5/max(0,0.3) ≈ 8.33
    expect(highConf.autonomy.variance).toBeLessThan(lowConf.autonomy.variance);
  });

  it("all means are in [0, 10]", () => {
    for (const poles of [neutralPoles(), strongAutonomousPoles(), strongCollaborativePoles()]) {
      const posteriors = seedFromClassifier(poles);
      for (const dim of Object.values(posteriors)) {
        expect(dim.mean).toBeGreaterThanOrEqual(0);
        expect(dim.mean).toBeLessThanOrEqual(10);
      }
    }
  });
});

// ─── computeDifficulty ────────────────────────────────────────────────────────

describe("computeDifficulty", () => {
  it("returns 0 when capital=5000+, aggression=0, layer=0", () => {
    // capitalPressure = 1 - min(1, 5000/5000) = 0
    // competitorPressure = 0
    // layer contribution = 0
    expect(computeDifficulty(5000, 0, 0)).toBe(0);
  });

  it("returns 1 (clamped) under maximum pressure", () => {
    // capital=0 → capitalPressure=1, aggression=100 → competitorPressure=1, layer=10 → layer/10=1
    // raw = 0.4*1 + 0.3*1 + 0.3*1 = 1.0
    expect(computeDifficulty(0, 100, 10)).toBe(1);
  });

  it("capital beyond 5000 does not increase difficulty below 0", () => {
    // capital=10000 → capitalPressure = 1 - min(1, 10000/5000) = 1 - 1 = 0 (clamped)
    const d = computeDifficulty(10000, 0, 0);
    expect(d).toBe(0);
  });

  it("difficulty increases with lower capital", () => {
    const highCap = computeDifficulty(4000, 50, 5);
    const lowCap = computeDifficulty(500, 50, 5);
    expect(lowCap).toBeGreaterThan(highCap);
  });

  it("difficulty increases with higher competitor aggression", () => {
    const lowAgg = computeDifficulty(2000, 20, 3);
    const highAgg = computeDifficulty(2000, 80, 3);
    expect(highAgg).toBeGreaterThan(lowAgg);
  });

  it("difficulty increases with higher layer", () => {
    const earlyLayer = computeDifficulty(3000, 50, 1);
    const lateLayer = computeDifficulty(3000, 50, 9);
    expect(lateLayer).toBeGreaterThan(earlyLayer);
  });

  it("result is always in [0, 1]", () => {
    const cases = [
      [0, 0, 0],
      [10000, 100, 10],
      [2500, 50, 5],
    ] as const;
    for (const [cap, agg, layer] of cases) {
      const d = computeDifficulty(cap, agg, layer);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(1);
    }
  });
});

// ─── updatePosterior ──────────────────────────────────────────────────────────

describe("updatePosterior", () => {
  it("pulls mean toward evidenceMean", () => {
    const prior = { mean: 5, variance: 2 };
    // Evidence says 8 — posterior mean should be between 5 and 8
    const posterior = updatePosterior(prior, 8, 0.5);
    expect(posterior.mean).toBeGreaterThan(5);
    expect(posterior.mean).toBeLessThan(8);
  });

  it("higher difficulty increases the evidence pull (tau higher)", () => {
    const prior = { mean: 5, variance: 2 };
    const lowDiff = updatePosterior(prior, 8, 0.1);
    const highDiff = updatePosterior(prior, 8, 0.9);
    // Higher difficulty → tau larger → evidence mean pulls harder → posterior mean farther from prior mean
    expect(highDiff.mean).toBeGreaterThan(lowDiff.mean);
  });

  it("variance tightens after update (posterior variance < prior variance)", () => {
    const prior = { mean: 5, variance: 2 };
    const posterior = updatePosterior(prior, 7, 0.5);
    expect(posterior.variance).toBeLessThan(prior.variance);
  });

  it("clamps posterior mean to [0, 10]", () => {
    // Very strong evidence at 9 with high difficulty should push mean toward 9 (≤10)
    const prior = { mean: 5, variance: 0.5 };
    const posterior = updatePosterior(prior, 10, 1.0);
    expect(posterior.mean).toBeLessThanOrEqual(10);
  });

  it("posterior mean does not go below 0", () => {
    const prior = { mean: 5, variance: 0.5 };
    const posterior = updatePosterior(prior, 0, 1.0);
    expect(posterior.mean).toBeGreaterThanOrEqual(0);
  });

  it("returns updated mean and variance fields", () => {
    const prior = { mean: 5, variance: 2 };
    const result = updatePosterior(prior, 7, 0.3);
    expect(result).toHaveProperty("mean");
    expect(result).toHaveProperty("variance");
  });
});

// ─── posteriorsToProfile ──────────────────────────────────────────────────────

describe("posteriorsToProfile", () => {
  it("returns EOProfile with correct mean values for each dimension", () => {
    const posteriors = {
      autonomy: { mean: 3, variance: 1 },
      innovativeness: { mean: 6, variance: 1 },
      riskTaking: { mean: 8, variance: 0.5 },
      proactiveness: { mean: 4, variance: 2 },
      competitiveAggressiveness: { mean: 7, variance: 1 },
    };
    const profile = posteriorsToProfile(posteriors);
    expect(profile.autonomy).toBe(3);
    expect(profile.innovativeness).toBe(6);
    expect(profile.riskTaking).toBe(8);
    expect(profile.proactiveness).toBe(4);
    expect(profile.competitiveAggressiveness).toBe(7);
  });

  it("does not include variance in the returned profile", () => {
    const posteriors = {
      autonomy: { mean: 5, variance: 1 },
      innovativeness: { mean: 5, variance: 1 },
      riskTaking: { mean: 5, variance: 1 },
      proactiveness: { mean: 5, variance: 1 },
      competitiveAggressiveness: { mean: 5, variance: 1 },
    };
    const profile = posteriorsToProfile(posteriors);
    expect(profile).not.toHaveProperty("variance");
  });

  it("round-trips through seedFromClassifier correctly", () => {
    const poles = strongAutonomousPoles();
    const posteriors = seedFromClassifier(poles);
    const profile = posteriorsToProfile(posteriors);
    // Profile should reflect the seeded posteriors
    expect(profile.autonomy).toBe(posteriors.autonomy.mean);
    expect(profile.riskTaking).toBe(posteriors.riskTaking.mean);
  });
});
