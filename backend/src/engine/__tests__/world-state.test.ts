import { describe, it, expect } from "vitest";
import { createInitialWorldState } from "../world-state.js";

describe("createInitialWorldState", () => {
  it("returns a valid WorldState with correct defaults", () => {
    const state = createInitialWorldState({ seed: 42 });

    // Meta
    expect(state.seed).toBe(42);
    expect(state.layer).toBe(0);
    expect(state.currentNodeId).toBeNull();
    expect(state.turnsElapsed).toBe(0);
    expect(state.isComplete).toBe(false);

    // Financial
    expect(state.capital).toBe(10_000);
    expect(state.monthlyBurn).toBeGreaterThanOrEqual(1_000);
    expect(state.monthlyBurn).toBeLessThanOrEqual(2_000);
    expect(state.revenue).toBe(0);
    expect(state.debt).toBe(0);

    // Business — playerContext null until Layer 0 classify step
    expect(state.playerContext).toBeNull();
    expect(state.employeeCount).toBe(0);
    expect(state.businessFormality).toBe("unregistered");
    expect(state.hasBackupPower).toBe(false);
    expect(state.hasPremises).toBe(false);

    // Social
    expect(state.reputation).toBe(0);
    expect(state.networkStrength).toBe(0);
    expect(state.susuMember).toBe(false);
    expect(state.mentorAccess).toBe(false);

    // EO profile — neutral midpoint
    expect(state.eoProfile).toEqual({
      autonomy: 5,
      innovativeness: 5,
      riskTaking: 5,
      proactiveness: 5,
      competitiveAggressiveness: 5,
    });
  });

  it("produces deterministic environment for the same seed", () => {
    const s1 = createInitialWorldState({ seed: 123 });
    const s2 = createInitialWorldState({ seed: 123 });
    expect(s1.marketDemand).toBe(s2.marketDemand);
    expect(s1.infrastructureReliability).toBe(s2.infrastructureReliability);
    expect(s1.regulatoryPressure).toBe(s2.regulatoryPressure);
    expect(s1.competitorAggression).toBe(s2.competitorAggression);
    expect(s1.monthlyBurn).toBe(s2.monthlyBurn);
  });

  it("produces different environments for different seeds", () => {
    const s1 = createInitialWorldState({ seed: 1 });
    const s2 = createInitialWorldState({ seed: 9999 });
    const envDiffers =
      s1.marketDemand !== s2.marketDemand ||
      s1.infrastructureReliability !== s2.infrastructureReliability ||
      s1.regulatoryPressure !== s2.regulatoryPressure ||
      s1.competitorAggression !== s2.competitorAggression;
    expect(envDiffers).toBe(true);
  });

  it("environment variables are in [0, 100] range", () => {
    for (let seed = 0; seed < 100; seed++) {
      const state = createInitialWorldState({ seed });
      expect(state.marketDemand).toBeGreaterThanOrEqual(0);
      expect(state.marketDemand).toBeLessThanOrEqual(100);
      expect(state.infrastructureReliability).toBeGreaterThanOrEqual(0);
      expect(state.infrastructureReliability).toBeLessThanOrEqual(100);
      expect(state.regulatoryPressure).toBeGreaterThanOrEqual(0);
      expect(state.regulatoryPressure).toBeLessThanOrEqual(100);
      expect(state.competitorAggression).toBeGreaterThanOrEqual(0);
      expect(state.competitorAggression).toBeLessThanOrEqual(100);
    }
  });

  it("monthlyBurn is an integer", () => {
    const state = createInitialWorldState({ seed: 77 });
    expect(Number.isInteger(state.monthlyBurn)).toBe(true);
  });

  it("environment variables are integers", () => {
    const state = createInitialWorldState({ seed: 55 });
    expect(Number.isInteger(state.marketDemand)).toBe(true);
    expect(Number.isInteger(state.infrastructureReliability)).toBe(true);
    expect(Number.isInteger(state.regulatoryPressure)).toBe(true);
    expect(Number.isInteger(state.competitorAggression)).toBe(true);
  });
});
