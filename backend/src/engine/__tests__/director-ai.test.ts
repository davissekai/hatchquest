import { describe, it, expect } from "vitest";
import {
  passesConditions,
  computeThemeAffinity,
  computeEOAffinity,
  weightedDraw,
  selectNextNode,
} from "../director-ai.js";
import { createInitialWorldState } from "../world-state.js";
import type { ScenarioNodeFull, NodeTheme } from "../../scenario-registry.js";
import type { ChoiceEffect } from "../apply-choice.js";

// Minimal ScenarioNodeFull for testing
function makeNode(overrides: Partial<ScenarioNodeFull> = {}): ScenarioNodeFull {
  const effect: ChoiceEffect = {
    capital: 0, revenue: 0, debt: 0, monthlyBurn: 0,
    reputation: 0, networkStrength: 0, eoDeltas: {},
  };
  return {
    id: "test-node",
    layer: 2,
    narrative: "test",
    choices: [
      { index: 0, text: "A", tensionHint: "x" },
      { index: 1, text: "B", tensionHint: "y" },
      { index: 2, text: "C", tensionHint: "z" },
    ],
    effects: [effect, effect, effect],
    theme: "general",
    baseWeight: 1.0,
    eoTargetDimensions: [],
    ...overrides,
  };
}

function makeState() {
  return createInitialWorldState({ seed: 42, sector: "tech" });
}

// --- passesConditions ---

describe("passesConditions", () => {
  it("passes when no conditions are defined", () => {
    const node = makeNode({ conditions: undefined });
    expect(passesConditions(node, makeState())).toBe(true);
  });

  it("fails capitalMin when capital is below threshold", () => {
    const node = makeNode({ conditions: { capitalMin: 20_000 } });
    expect(passesConditions(node, makeState())).toBe(false); // capital is 10_000
  });

  it("passes capitalMin when capital meets threshold", () => {
    const node = makeNode({ conditions: { capitalMin: 5_000 } });
    expect(passesConditions(node, makeState())).toBe(true);
  });

  it("fails capitalMax when capital exceeds threshold", () => {
    const node = makeNode({ conditions: { capitalMax: 5_000 } });
    expect(passesConditions(node, makeState())).toBe(false); // capital is 10_000
  });

  it("fails debtMin when debt is below threshold", () => {
    const node = makeNode({ conditions: { debtMin: 1_000 } });
    expect(passesConditions(node, makeState())).toBe(false); // debt is 0
  });

  it("fails requiresMentorAccess when mentorAccess is false", () => {
    const node = makeNode({ conditions: { requiresMentorAccess: true } });
    expect(passesConditions(node, makeState())).toBe(false);
  });

  it("passes requiresMentorAccess when mentorAccess is true", () => {
    const node = makeNode({ conditions: { requiresMentorAccess: true } });
    const state = { ...makeState(), mentorAccess: true };
    expect(passesConditions(node, state)).toBe(true);
  });
});

// --- computeThemeAffinity ---

describe("computeThemeAffinity", () => {
  it("returns 1.0 for general theme at baseline state", () => {
    expect(computeThemeAffinity("general", makeState())).toBe(1.0);
  });

  it("returns 3.0 for financing when capital < 3000", () => {
    const state = { ...makeState(), capital: 2_000 };
    expect(computeThemeAffinity("financing", state)).toBe(3.0);
  });

  it("returns 1.5 for financing when capital is 3000–6000", () => {
    const state = { ...makeState(), capital: 5_000 };
    expect(computeThemeAffinity("financing", state)).toBe(1.5);
  });

  it("returns 1.0 for financing when capital >= 6000", () => {
    const state = { ...makeState(), capital: 10_000 };
    expect(computeThemeAffinity("financing", state)).toBe(1.0);
  });

  it("returns 2.0 for competition when competitorAggression > 60", () => {
    const state = { ...makeState(), competitorAggression: 70 };
    expect(computeThemeAffinity("competition", state)).toBe(2.0);
  });

  it("returns 2.5 for crisis when debt > 5000", () => {
    const state = { ...makeState(), debt: 6_000 };
    expect(computeThemeAffinity("crisis", state)).toBe(2.5);
  });

  it("returns 1.5 for branding when reputation < 20", () => {
    const state = { ...makeState(), reputation: 10 };
    expect(computeThemeAffinity("branding", state)).toBe(1.5);
  });

  it("returns 2.0 for hiring when revenue > 500 and employeeCount < 2", () => {
    const state = { ...makeState(), revenue: 600, employeeCount: 0 };
    expect(computeThemeAffinity("hiring", state)).toBe(2.0);
  });

  it("caps multiplier at 4.0", () => {
    const state = { ...makeState(), capital: 100 };
    expect(computeThemeAffinity("financing", state)).toBeLessThanOrEqual(4.0);
  });
});

// --- computeEOAffinity ---

describe("computeEOAffinity", () => {
  it("returns 1.0 when no eoTargetDimensions", () => {
    const node = makeNode({ eoTargetDimensions: [] });
    expect(computeEOAffinity(node, makeState())).toBe(1.0);
  });

  it("matches strong dimensions in early layers (layer 1)", () => {
    // riskTaking = 5 → match score = 1 + 5/10 = 1.5
    const node = makeNode({ eoTargetDimensions: ["riskTaking"] });
    const state = { ...makeState(), layer: 1 };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.5);
  });

  it("challenges weak dimensions in late layers (layer 3)", () => {
    // riskTaking = 5 → challenge = 1 + (10-5)/10 = 1.5
    const node = makeNode({ eoTargetDimensions: ["riskTaking"] });
    const state = { ...makeState(), layer: 3 };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.5);
  });

  it("gives high affinity to strong dim in early game", () => {
    // riskTaking = 9 → match = 1 + 9/10 = 1.9
    const node = makeNode({ eoTargetDimensions: ["riskTaking"] });
    const base = makeState();
    const state = { ...base, layer: 1, eoProfile: { ...base.eoProfile, riskTaking: 9 } };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.9);
  });

  it("gives high affinity to weak dim in late game", () => {
    // autonomy = 2 → challenge = 1 + (10-2)/10 = 1.8
    const node = makeNode({ eoTargetDimensions: ["autonomy"] });
    const base = makeState();
    const state = { ...base, layer: 4, eoProfile: { ...base.eoProfile, autonomy: 2 } };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.8);
  });

  it("averages across multiple target dimensions", () => {
    // riskTaking=8, autonomy=2, early game → 1 + mean(8/10, 2/10) = 1.5
    const node = makeNode({ eoTargetDimensions: ["riskTaking", "autonomy"] });
    const base = makeState();
    const state = { ...base, layer: 1, eoProfile: { ...base.eoProfile, riskTaking: 8, autonomy: 2 } };
    expect(computeEOAffinity(node, state)).toBeCloseTo(1.5);
  });
});

// --- weightedDraw ---

describe("weightedDraw", () => {
  it("always returns the only item when there is one", () => {
    const items = [{ item: "only", weight: 1.0 }];
    expect(weightedDraw(items, () => 0.5)).toBe("only");
  });

  it("selects the item proportional to weight", () => {
    // With rng = 0.05, cursor = 0.05 * 10 = 0.5, light(1) → 0.5-1 = -0.5 ≤ 0 → "light"
    const items = [{ item: "light", weight: 1 }, { item: "heavy", weight: 9 }];
    expect(weightedDraw(items, () => 0.05)).toBe("light");
    // With rng = 0.5, cursor = 5.0, light → 5-1=4 > 0, heavy → 4-9=-5 ≤ 0 → "heavy"
    expect(weightedDraw(items, () => 0.5)).toBe("heavy");
  });
});

// --- selectNextNode ---

describe("selectNextNode", () => {
  it("returns null when nextLayer > 5", () => {
    const state = { ...makeState(), layer: 5 };
    expect(selectNextNode(state, [], () => 0.5)).toBeNull();
  });

  it("returns null when no nodes exist for the next layer", () => {
    const state = { ...makeState(), layer: 1 };
    const nodes = [makeNode({ layer: 1 })]; // wrong layer
    expect(selectNextNode(state, nodes, () => 0.5)).toBeNull();
  });

  it("selects a node from the correct next layer", () => {
    const state = { ...makeState(), layer: 1 };
    const node = makeNode({ id: "L2-test", layer: 2 });
    expect(selectNextNode(state, [node], () => 0.5)?.id).toBe("L2-test");
  });

  it("filters out nodes that fail hard conditions", () => {
    const state = { ...makeState(), layer: 1, capital: 2_000 };
    const expensive = makeNode({ id: "expensive", layer: 2, conditions: { capitalMin: 8_000 } });
    const cheap = makeNode({ id: "cheap", layer: 2 });
    // cheap has weight = 1, expensive fails conditions → only cheap eligible
    expect(selectNextNode(state, [expensive, cheap], () => 0)?.id).toBe("cheap");
  });

  it("falls back to the full layer pool when all fail conditions", () => {
    const state = { ...makeState(), layer: 1, capital: 100 };
    const node = makeNode({ id: "gated", layer: 2, conditions: { capitalMin: 50_000 } });
    // all fail → fallback returns the node anyway
    expect(selectNextNode(state, [node], () => 0.5)?.id).toBe("gated");
  });
});
