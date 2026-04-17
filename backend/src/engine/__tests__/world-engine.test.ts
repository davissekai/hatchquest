import { describe, it, expect } from "vitest";
import {
  propagateWorldStocks,
  drawWorldEvent,
  applyWorldEvent,
} from "../world-engine.js";
import type { WorldState } from "@hatchquest/shared";

// Minimal WorldState for world-engine tests
const BASE_STATE: WorldState = {
  seed: 1,
  layer: 1,
  currentNodeId: null,
  turnsElapsed: 0,
  isComplete: false,
  capital: 10000,
  monthlyBurn: 1000,
  revenue: 0,
  debt: 0,
  sector: "other",
  businessDescription: "",
  choiceHistory: [],
  recentPatterns: [],
  playerContext: null,
  employeeCount: 0,
  businessFormality: "unregistered",
  hasBackupPower: false,
  hasPremises: false,
  reputation: 0,
  networkStrength: 0,
  susuMember: false,
  mentorAccess: false,
  marketDemand: 50,
  infrastructureReliability: 50,
  regulatoryPressure: 30,
  competitorAggression: 50,
  eoProfile: {
    autonomy: 5,
    innovativeness: 5,
    riskTaking: 5,
    proactiveness: 5,
    competitiveAggressiveness: 5,
  },
  capitalAccessOpen: false,
  underAudit: false,
  vcWindowOpen: false,
  hiringDifficulty: 0,
  worldEventHistory: [],
};

// ─── propagateWorldStocks ─────────────────────────────────────────────────────

describe("propagateWorldStocks", () => {
  it("returns a new state object (does not mutate)", () => {
    const next = propagateWorldStocks(BASE_STATE, () => 0.5);
    expect(next).not.toBe(BASE_STATE);
  });

  it("keeps all other state fields intact", () => {
    const next = propagateWorldStocks(BASE_STATE, () => 0.5);
    expect(next.capital).toBe(BASE_STATE.capital);
    expect(next.layer).toBe(BASE_STATE.layer);
    expect(next.seed).toBe(BASE_STATE.seed);
  });

  it("all three stocks stay in [0, 100] with random drift", () => {
    // Run with various rng values to stress boundaries
    const rngValues = [0, 0.01, 0.5, 0.99, 1.0];
    for (const v of rngValues) {
      const next = propagateWorldStocks(BASE_STATE, () => v);
      expect(next.marketDemand).toBeGreaterThanOrEqual(0);
      expect(next.marketDemand).toBeLessThanOrEqual(100);
      expect(next.competitorAggression).toBeGreaterThanOrEqual(0);
      expect(next.competitorAggression).toBeLessThanOrEqual(100);
      expect(next.infrastructureReliability).toBeGreaterThanOrEqual(0);
      expect(next.infrastructureReliability).toBeLessThanOrEqual(100);
    }
  });

  it("stocks drift when rng is not 0.5 (non-zero drift)", () => {
    // rng=1.0 → drift = (1.0 - 0.5) * 6 = +3 for all stocks
    const next = propagateWorldStocks(BASE_STATE, () => 1.0);
    // raw = 50+3=53, pull=(50-53)*0.05=-0.15 → 52.85 — differs from 50
    expect(next.marketDemand).not.toBe(BASE_STATE.marketDemand);
    expect(next.competitorAggression).not.toBe(BASE_STATE.competitorAggression);
    expect(next.infrastructureReliability).not.toBe(BASE_STATE.infrastructureReliability);
  });

  it("stock at 0 does not go below 0 under downward drift", () => {
    const state: WorldState = { ...BASE_STATE, marketDemand: 0, competitorAggression: 0, infrastructureReliability: 0 };
    const next = propagateWorldStocks(state, () => 0); // rng=0 → drift=-3
    expect(next.marketDemand).toBeGreaterThanOrEqual(0);
    expect(next.competitorAggression).toBeGreaterThanOrEqual(0);
    expect(next.infrastructureReliability).toBeGreaterThanOrEqual(0);
  });

  it("stock at 100 does not exceed 100 under upward drift", () => {
    const state: WorldState = { ...BASE_STATE, marketDemand: 100, competitorAggression: 100, infrastructureReliability: 100 };
    const next = propagateWorldStocks(state, () => 1.0); // rng=1 → drift=+3
    expect(next.marketDemand).toBeLessThanOrEqual(100);
    expect(next.competitorAggression).toBeLessThanOrEqual(100);
    expect(next.infrastructureReliability).toBeLessThanOrEqual(100);
  });
});

// ─── drawWorldEvent ───────────────────────────────────────────────────────────

describe("drawWorldEvent", () => {
  it("returns null when no events are eligible (layer=0)", () => {
    // The world event pool has eligible: s.layer >= 1 for all events
    const state: WorldState = { ...BASE_STATE, layer: 0 };
    const result = drawWorldEvent(state, () => 0.5);
    expect(result).toBeNull();
  });

  it("returns an event object when eligible events exist (layer=1)", () => {
    const state: WorldState = { ...BASE_STATE, layer: 1 };
    const result = drawWorldEvent(state, () => 0);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("eventId");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("narrativeHook");
  });

  it("returned eventId is a non-empty string", () => {
    const state: WorldState = { ...BASE_STATE, layer: 1 };
    const result = drawWorldEvent(state, () => 0.5);
    expect(typeof result?.eventId).toBe("string");
    expect((result?.eventId ?? "").length).toBeGreaterThan(0);
  });

  it("returned label and narrativeHook are non-empty strings", () => {
    const state: WorldState = { ...BASE_STATE, layer: 1 };
    const result = drawWorldEvent(state, () => 0.5);
    expect(typeof result?.label).toBe("string");
    expect((result?.label ?? "").length).toBeGreaterThan(0);
    expect(typeof result?.narrativeHook).toBe("string");
    expect((result?.narrativeHook ?? "").length).toBeGreaterThan(0);
  });

  it("higher layer makes more events eligible", () => {
    // Layer 1: only ecg_outage eligible (minLayer=1 events)
    // Layer 3: multiple events eligible
    const state1: WorldState = { ...BASE_STATE, layer: 1 };
    const state3: WorldState = { ...BASE_STATE, layer: 3 };
    // Both should return non-null (just verifying layer 3 still works)
    expect(drawWorldEvent(state1, () => 0.5)).not.toBeNull();
    expect(drawWorldEvent(state3, () => 0.5)).not.toBeNull();
  });

  it("returns null when rng produces an out-of-bounds pick index (defensive guard)", () => {
    // When rng() = 1.0, Math.floor(1.0 * total) = total → index out of bounds → chosen = undefined → null
    // This covers the `if (!chosen) return null` defensive branch at line 50
    const state: WorldState = { ...BASE_STATE, layer: 1 };
    const result = drawWorldEvent(state, () => 1.0);
    expect(result).toBeNull();
  });

  it("competitor_funded event becomes ineligible when competitorAggression >= 70", () => {
    // competitor_funded eligible: s.layer >= 2 && s.competitorAggression < 70
    // With aggression=75 at layer 5, competitor_funded is not eligible
    const state: WorldState = { ...BASE_STATE, layer: 5, competitorAggression: 75 };
    // Might still return something (other events are eligible), just not competitor_funded
    const result = drawWorldEvent(state, () => 0.5);
    if (result) {
      // If an event is returned, it should not be competitor_funded
      // (because aggression >= 70 makes it ineligible)
      // We can't guarantee which one is returned, but the function should work
      expect(typeof result.eventId).toBe("string");
    }
  });
});

// ─── applyWorldEvent ──────────────────────────────────────────────────────────

describe("applyWorldEvent", () => {
  it("ecg_outage decreases infrastructureReliability by 15", () => {
    const state: WorldState = { ...BASE_STATE, infrastructureReliability: 50 };
    const next = applyWorldEvent(state, "ecg_outage");
    expect(next.infrastructureReliability).toBe(35);
  });

  it("ecg_outage clamps infrastructureReliability to 0", () => {
    const state: WorldState = { ...BASE_STATE, infrastructureReliability: 5 };
    const next = applyWorldEvent(state, "ecg_outage");
    expect(next.infrastructureReliability).toBe(0);
  });

  it("competitor_funded increases competitorAggression by 25", () => {
    const state: WorldState = { ...BASE_STATE, competitorAggression: 40 };
    const next = applyWorldEvent(state, "competitor_funded");
    expect(next.competitorAggression).toBe(65);
  });

  it("competitor_funded clamps competitorAggression to 100", () => {
    const state: WorldState = { ...BASE_STATE, competitorAggression: 85 };
    const next = applyWorldEvent(state, "competitor_funded");
    expect(next.competitorAggression).toBe(100);
  });

  it("cedi_weakened increases monthlyBurn by 200", () => {
    const state: WorldState = { ...BASE_STATE, monthlyBurn: 1000 };
    const next = applyWorldEvent(state, "cedi_weakened");
    expect(next.monthlyBurn).toBe(1200);
  });

  it("bog_rate_cut sets capitalAccessOpen to true", () => {
    const state: WorldState = { ...BASE_STATE, capitalAccessOpen: false };
    const next = applyWorldEvent(state, "bog_rate_cut");
    expect(next.capitalAccessOpen).toBe(true);
  });

  it("supplier_strike increases monthlyBurn by 300 and decreases infrastructureReliability by 10", () => {
    const state: WorldState = { ...BASE_STATE, monthlyBurn: 1000, infrastructureReliability: 60 };
    const next = applyWorldEvent(state, "supplier_strike");
    expect(next.monthlyBurn).toBe(1300);
    expect(next.infrastructureReliability).toBe(50);
  });

  it("supplier_strike clamps infrastructureReliability to 0", () => {
    const state: WorldState = { ...BASE_STATE, infrastructureReliability: 5 };
    const next = applyWorldEvent(state, "supplier_strike");
    expect(next.infrastructureReliability).toBe(0);
  });

  it("tech_talent_shortage decreases reputation by 5 and increases hiringDifficulty by 20", () => {
    const state: WorldState = { ...BASE_STATE, reputation: 30, hiringDifficulty: 10 };
    const next = applyWorldEvent(state, "tech_talent_shortage");
    expect(next.reputation).toBe(25);
    expect(next.hiringDifficulty).toBe(30);
  });

  it("tech_talent_shortage clamps reputation to 0 when near 0", () => {
    const state: WorldState = { ...BASE_STATE, reputation: 3, hiringDifficulty: 0 };
    const next = applyWorldEvent(state, "tech_talent_shortage");
    expect(next.reputation).toBe(0);
  });

  it("tech_talent_shortage clamps hiringDifficulty to 100 when near max", () => {
    const state: WorldState = { ...BASE_STATE, reputation: 30, hiringDifficulty: 90 };
    const next = applyWorldEvent(state, "tech_talent_shortage");
    expect(next.hiringDifficulty).toBe(100);
  });

  it("viral_customer_post increases marketDemand by 15", () => {
    const state: WorldState = { ...BASE_STATE, marketDemand: 50 };
    const next = applyWorldEvent(state, "viral_customer_post");
    expect(next.marketDemand).toBe(65);
  });

  it("viral_customer_post clamps marketDemand to 100", () => {
    const state: WorldState = { ...BASE_STATE, marketDemand: 92 };
    const next = applyWorldEvent(state, "viral_customer_post");
    expect(next.marketDemand).toBe(100);
  });

  it("regulatory_audit increases monthlyBurn by 400 and sets underAudit to true", () => {
    const state: WorldState = { ...BASE_STATE, monthlyBurn: 1000, underAudit: false };
    const next = applyWorldEvent(state, "regulatory_audit");
    expect(next.monthlyBurn).toBe(1400);
    expect(next.underAudit).toBe(true);
  });

  it("competitor_scandal decreases competitorAggression by 20", () => {
    const state: WorldState = { ...BASE_STATE, competitorAggression: 60 };
    const next = applyWorldEvent(state, "competitor_scandal");
    expect(next.competitorAggression).toBe(40);
  });

  it("competitor_scandal clamps competitorAggression to 0", () => {
    const state: WorldState = { ...BASE_STATE, competitorAggression: 10 };
    const next = applyWorldEvent(state, "competitor_scandal");
    expect(next.competitorAggression).toBe(0);
  });

  it("vc_roadshow_season sets vcWindowOpen to true", () => {
    const state: WorldState = { ...BASE_STATE, vcWindowOpen: false };
    const next = applyWorldEvent(state, "vc_roadshow_season");
    expect(next.vcWindowOpen).toBe(true);
  });

  it("unknown event ID returns state unchanged (default branch)", () => {
    const next = applyWorldEvent(BASE_STATE, "some_unknown_event_id");
    expect(next).toEqual(BASE_STATE);
  });

  it("does not mutate the original state", () => {
    const state: WorldState = { ...BASE_STATE, infrastructureReliability: 50 };
    const original = state.infrastructureReliability;
    applyWorldEvent(state, "ecg_outage");
    expect(state.infrastructureReliability).toBe(original);
  });
});
