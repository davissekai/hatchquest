import { describe, it, expect } from "vitest";
import {
  applyChoice,
  applyEffect,
  buildEffectSummary,
  recordChoiceOnState,
} from "../apply-choice.js";
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

// ─── buildEffectSummary ───────────────────────────────────────────────────────

describe("buildEffectSummary", () => {
  it("returns 'no material change' when all deltas are zero", () => {
    expect(
      buildEffectSummary({
        capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
        reputation: 0, networkStrength: 0, eoDeltas: {},
      })
    ).toBe("no material change");
  });

  it("formats kilo-amounts with a k suffix and signed prefix", () => {
    const summary = buildEffectSummary({
      capital: -3000, revenue: 2000, debt: 1500,
      monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {},
    });
    expect(summary).toContain("-3k capital");
    expect(summary).toContain("+2k revenue");
    expect(summary).toContain("+1.5k debt");
  });

  it("formats small (<1000) numeric deltas without a k suffix", () => {
    const summary = buildEffectSummary({
      capital: -200, revenue: 500, debt: 0,
      monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {},
    });
    expect(summary).toContain("-200 capital");
    expect(summary).toContain("+500 revenue");
  });

  it("includes reputation and network deltas with explicit signs", () => {
    const summary = buildEffectSummary({
      capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
      reputation: 6, networkStrength: -3, eoDeltas: {},
    });
    expect(summary).toContain("+6 rep");
    expect(summary).toContain("-3 network");
  });
});

// ─── recordChoiceOnState ──────────────────────────────────────────────────────

describe("recordChoiceOnState", () => {
  const zeroEffect: ChoiceEffect = {
    capital: -1000, revenue: 0, debt: 0, monthlyBurn: 0,
    reputation: 0, networkStrength: 0, eoDeltas: {},
  };

  it("prepends a new RecentChoice to choiceHistory, newest-first", () => {
    const state = makeState();
    const next = recordChoiceOnState(state, zeroEffect, {
      nodeId: "L1-node-1",
      choiceLabel: "Took the deal",
      narrativePattern: "supply_chain_stretch",
    });
    expect(next.choiceHistory).toHaveLength(1);
    expect(next.choiceHistory[0]?.nodeId).toBe("L1-node-1");
    expect(next.choiceHistory[0]?.effectSummary).toContain("-1k capital");
  });

  it("trims choiceHistory to MAX_CHOICE_HISTORY=5", () => {
    let state = makeState();
    for (let i = 0; i < 7; i++) {
      state = recordChoiceOnState(state, zeroEffect, {
        nodeId: `node-${i}`,
        choiceLabel: `choice ${i}`,
      });
    }
    expect(state.choiceHistory).toHaveLength(5);
    expect(state.choiceHistory[0]?.nodeId).toBe("node-6"); // newest first
    expect(state.choiceHistory[4]?.nodeId).toBe("node-2");
  });

  it("prepends narrativePattern to recentPatterns and trims to 2", () => {
    let state = makeState();
    state = recordChoiceOnState(state, zeroEffect, {
      nodeId: "n1", choiceLabel: "a", narrativePattern: "fundraising",
    });
    state = recordChoiceOnState(state, zeroEffect, {
      nodeId: "n2", choiceLabel: "b", narrativePattern: "hiring",
    });
    state = recordChoiceOnState(state, zeroEffect, {
      nodeId: "n3", choiceLabel: "c", narrativePattern: "pivot",
    });
    expect(state.recentPatterns).toEqual(["pivot", "hiring"]);
  });

  it("leaves recentPatterns untouched when narrativePattern is absent", () => {
    const state = makeState();
    const next = recordChoiceOnState(state, zeroEffect, {
      nodeId: "n1", choiceLabel: "a",
    });
    expect(next.recentPatterns).toEqual(state.recentPatterns);
  });

  it("does not mutate the input state", () => {
    const state = makeState();
    recordChoiceOnState(state, zeroEffect, {
      nodeId: "n1", choiceLabel: "a", narrativePattern: "exit",
    });
    expect(state.choiceHistory).toEqual([]);
    expect(state.recentPatterns).toEqual([]);
  });
});
