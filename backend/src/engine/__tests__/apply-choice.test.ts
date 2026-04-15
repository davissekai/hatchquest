import { describe, it, expect } from "vitest";
import { applyChoice, applyEffect } from "../apply-choice.js";
import { createInitialWorldState } from "../world-state.js";
import type { ChoiceEffect } from "../apply-choice.js";

// Helper: create a base state for testing
function makeState() {
  return createInitialWorldState({ seed: 42 });
}

describe("applyChoice", () => {
  it("applies financial effects to world state", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: -2000,
      revenue: 500,
      debt: 0,
      monthlyBurn: 200,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: {},
    };
    const next = applyChoice(state, effect, "node-1");

    expect(next.capital).toBe(state.capital - 2000);
    expect(next.revenue).toBe(500);
    expect(next.monthlyBurn).toBe(state.monthlyBurn + 200);
  });

  it("applies EO deltas and clamps to [0, 10]", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: 0,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: {
        riskTaking: 3,
        autonomy: -6, // 5 - 6 = -1 → clamped to 0
      },
    };
    const next = applyChoice(state, effect, "node-1");

    expect(next.eoProfile.riskTaking).toBe(8);
    expect(next.eoProfile.autonomy).toBe(0);
    // Untouched dimensions stay the same
    expect(next.eoProfile.innovativeness).toBe(5);
  });

  it("clamps EO dimensions to max 10", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: 0,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: { proactiveness: 7 }, // 5 + 7 = 12 → clamped to 10
    };
    const next = applyChoice(state, effect, "node-1");
    expect(next.eoProfile.proactiveness).toBe(10);
  });

  it("advances turnsElapsed and updates currentNodeId", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: 0,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: {},
    };
    const next = applyChoice(state, effect, "node-2");

    expect(next.turnsElapsed).toBe(state.turnsElapsed + 1);
    expect(next.currentNodeId).toBe("node-2");
  });

  it("applies reputation and network effects, clamped to [0, 100]", () => {
    const state = makeState(); // rep=0, network=0
    const effect: ChoiceEffect = {
      capital: 0,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: 15,
      networkStrength: -5, // 0 - 5 → clamped to 0
      eoDeltas: {},
    };
    const next = applyChoice(state, effect, "node-1");

    expect(next.reputation).toBe(15);
    expect(next.networkStrength).toBe(0);
  });

  it("clamps reputation to max 100", () => {
    const state = makeState();
    state.reputation = 95;
    const effect: ChoiceEffect = {
      capital: 0,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: 10,
      networkStrength: 0,
      eoDeltas: {},
    };
    const next = applyChoice(state, effect, "node-1");
    expect(next.reputation).toBe(100);
  });

  it("does not mutate the original state", () => {
    const state = makeState();
    const originalCapital = state.capital;
    const effect: ChoiceEffect = {
      capital: -5000,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: {},
    };
    applyChoice(state, effect, "node-1");

    expect(state.capital).toBe(originalCapital);
  });

  it("applies boolean flags when present in effect", () => {

    const state = makeState();
    const effect: ChoiceEffect = {
      capital: -3000,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: {},
      flags: {
        hasBackupPower: true,
        susuMember: true,
      },
    };
    const next = applyChoice(state, effect, "node-1");

    expect(next.hasBackupPower).toBe(true);
    expect(next.susuMember).toBe(true);
    // Untouched flags stay false
    expect(next.hasPremises).toBe(false);
    expect(next.mentorAccess).toBe(false);
  });
});

describe("applyEffect", () => {
  it("applies financial effects without advancing turnsElapsed", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: -2000,
      revenue: 500,
      debt: 0,
      monthlyBurn: 200,
      reputation: 0,
      networkStrength: 0,
      eoDeltas: {},
    };
    const next = applyEffect(state, effect);

    expect(next.capital).toBe(state.capital - 2000);
    expect(next.revenue).toBe(500);
    expect(next.turnsElapsed).toBe(state.turnsElapsed); // NOT incremented
  });

  it("does not set currentNodeId", () => {
    const state = makeState(); // currentNodeId is null
    const effect: ChoiceEffect = {
      capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
      reputation: 0, networkStrength: 0, eoDeltas: {},
    };
    const next = applyEffect(state, effect);

    expect(next.currentNodeId).toBeNull(); // unchanged
  });

  it("applies EO deltas and clamps to [0, 10]", () => {
    const state = makeState();
    const effect: ChoiceEffect = {
      capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
      reputation: 0, networkStrength: 0,
      eoDeltas: { riskTaking: 3, autonomy: -6 },
    };
    const next = applyEffect(state, effect);

    expect(next.eoProfile.riskTaking).toBe(8);
    expect(next.eoProfile.autonomy).toBe(0);
  });

  it("does not mutate the original state", () => {
    const state = makeState();
    const original = state.capital;
    applyEffect(state, {
      capital: -5000, revenue: 0, debt: 0, monthlyBurn: 0,
      reputation: 0, networkStrength: 0, eoDeltas: {},
    });
    expect(state.capital).toBe(original);
  });
});
