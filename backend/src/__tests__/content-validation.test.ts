/**
 * Content Validation — Brie Godslayer Suite
 *
 * 18 rules that catch every class of content bug that passes TypeScript but breaks the game.
 * Run with: npm test --workspace=backend
 *
 * These tests run against the live registry — any new node Brie adds is automatically covered.
 */

import { describe, it, expect } from "vitest";
import { getAllNodes } from "../scenario-registry.js";
import type { ScenarioNodeFull } from "../scenario-registry.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const NODES = getAllNodes();

const VALID_EO_DIMENSIONS = new Set([
  "autonomy",
  "innovativeness",
  "riskTaking",
  "proactiveness",
  "competitiveAggressiveness",
]);

const VALID_THEMES = new Set([
  "financing",
  "competition",
  "hiring",
  "branding",
  "operations",
  "networking",
  "crisis",
  "general",
]);

/**
 * Per-layer calibration ranges from docs/brie-world-conditions.md.
 * Layer 1 uses conservative hand-crafted bounds (not in the calibration table).
 */
const CALIBRATION: Record<
  number,
  {
    capital: [number, number];
    revenue: [number, number];
    debt: [number, number];
    monthlyBurn: [number, number];
    reputation: [number, number];
    networkStrength: [number, number];
    eoDelta: [number, number];
  }
> = {
  1: {
    capital: [-5_000, 5_000],
    revenue: [-500, 2_000],
    debt: [0, 5_000],
    monthlyBurn: [-200, 600],
    reputation: [-15, 20],
    networkStrength: [-10, 15],
    eoDelta: [-2, 3],
  },
  2: {
    capital: [-5_000, 25_000],
    revenue: [-500, 3_000],
    debt: [0, 20_000],
    monthlyBurn: [-200, 800],
    reputation: [-15, 20],
    networkStrength: [-10, 15],
    eoDelta: [-2, 3],
  },
  3: {
    capital: [-8_000, 30_000],
    revenue: [-1_000, 5_000],
    debt: [0, 30_000],
    monthlyBurn: [-400, 1_500],
    reputation: [-20, 25],
    networkStrength: [-12, 18],
    eoDelta: [-2, 3],
  },
  4: {
    capital: [-10_000, 40_000],
    revenue: [-2_000, 8_000],
    debt: [0, 40_000],
    monthlyBurn: [-600, 2_000],
    reputation: [-25, 30],
    networkStrength: [-15, 20],
    eoDelta: [-2, 3],
  },
  5: {
    capital: [0, 0],
    revenue: [0, 0],
    debt: [0, 0],
    monthlyBurn: [0, 0],
    reputation: [0, 0],
    networkStrength: [0, 0],
    eoDelta: [0, 0],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the effect has at least one meaningful cost.
 * Costs include: negative financials, debt, increased burn, reputation/network loss,
 * OR a negative EO delta — losing autonomy, riskTaking, etc. is a real cost.
 */
function hasCost(effect: ScenarioNodeFull["effects"][number]): boolean {
  const hasNegativeEoDelta = Object.values(effect.eoDeltas).some(
    (delta) => (delta ?? 0) < 0
  );
  return (
    effect.capital < 0 ||
    effect.revenue < 0 ||
    effect.debt > 0 ||
    effect.monthlyBurn > 0 ||
    effect.reputation < 0 ||
    effect.networkStrength < 0 ||
    hasNegativeEoDelta
  );
}

/** Returns true if every numeric field of a Layer 5 effect is exactly 0. */
function isZeroEffect(effect: ScenarioNodeFull["effects"][number]): boolean {
  return (
    effect.capital === 0 &&
    effect.revenue === 0 &&
    effect.debt === 0 &&
    effect.monthlyBurn === 0 &&
    effect.reputation === 0 &&
    effect.networkStrength === 0 &&
    Object.keys(effect.eoDeltas).length === 0
  );
}

// ─── Rule 1: Every node has exactly 3 choices ────────────────────────────────

describe("Rule 1 — every node has exactly 3 choices", () => {
  it("all nodes have choices.length === 3", () => {
    const violations = NODES.filter((n) => n.choices.length !== 3).map(
      (n) => `${n.id}: ${n.choices.length} choices`
    );
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 2: Every node has exactly 3 effects ────────────────────────────────

describe("Rule 2 — every node has exactly 3 effects", () => {
  it("all nodes have effects.length === 3", () => {
    const violations = NODES.filter((n) => n.effects.length !== 3).map(
      (n) => `${n.id}: ${n.effects.length} effects`
    );
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 3: Parallel array integrity — choices[i].index === i ───────────────

describe("Rule 3 — choices[i].index === i (parallel array integrity)", () => {
  it("all choice indices match their position", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      node.choices.forEach((choice, i) => {
        if (choice.index !== i) {
          violations.push(
            `${node.id} choices[${i}].index === ${choice.index}, expected ${i}`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 4: No duplicate node IDs ───────────────────────────────────────────

describe("Rule 4 — no duplicate node IDs", () => {
  it("all node IDs are unique", () => {
    const ids = NODES.map((n) => n.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates, `Duplicate IDs: ${duplicates.join(", ")}`).toHaveLength(0);
  });
});

// ─── Rule 5: Registry is not empty and node IDs are non-empty strings ────────

describe("Rule 5 — registry is populated and all IDs are valid strings", () => {
  it("registry contains at least one node", () => {
    expect(NODES.length).toBeGreaterThan(0);
  });

  it("all node IDs are non-empty strings", () => {
    const violations = NODES.filter(
      (n) => typeof n.id !== "string" || n.id.trim() === ""
    ).map((n) => `node with id: "${n.id}"`);
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 6: All eoDeltas keys are valid EODimension values ──────────────────

describe("Rule 6 — all eoDeltas keys are valid EODimension values", () => {
  it("no invalid dimension keys in any effect", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      node.effects.forEach((effect, i) => {
        for (const key of Object.keys(effect.eoDeltas)) {
          if (!VALID_EO_DIMENSIONS.has(key)) {
            violations.push(
              `${node.id} effects[${i}].eoDeltas has invalid key: "${key}"`
            );
          }
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 7: All eoTargetDimensions values are valid EODimension values ───────

describe("Rule 7 — all eoTargetDimensions values are valid EODimension values", () => {
  it("no invalid dimension values in eoTargetDimensions", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      for (const dim of node.eoTargetDimensions) {
        if (!VALID_EO_DIMENSIONS.has(dim)) {
          violations.push(
            `${node.id} eoTargetDimensions has invalid value: "${dim}"`
          );
        }
      }
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 8: All theme values are valid NodeTheme values ─────────────────────

describe("Rule 8 — all theme values are valid NodeTheme values", () => {
  it("no invalid themes", () => {
    const violations = NODES.filter((n) => !VALID_THEMES.has(n.theme)).map(
      (n) => `${n.id}: invalid theme "${n.theme}"`
    );
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 9: All layer values are integers in [1, 5] ─────────────────────────

describe("Rule 9 — all layer values are integers in [1, 5]", () => {
  it("all layers are in valid range", () => {
    const violations = NODES.filter(
      (n) => !Number.isInteger(n.layer) || n.layer < 1 || n.layer > 5
    ).map((n) => `${n.id}: layer ${n.layer}`);
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 10: baseWeight is positive ─────────────────────────────────────────

describe("Rule 10 — baseWeight is positive (> 0)", () => {
  it("all nodes have positive baseWeight", () => {
    const violations = NODES.filter((n) => n.baseWeight <= 0).map(
      (n) => `${n.id}: baseWeight ${n.baseWeight}`
    );
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 11: Capital delta within per-layer calibration range ───────────────

describe("Rule 11 — capital delta within per-layer calibration range", () => {
  it("all capital effects are in range", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      const [min, max] = CALIBRATION[node.layer].capital;
      node.effects.forEach((effect, i) => {
        if (effect.capital < min || effect.capital > max) {
          violations.push(
            `${node.id} effects[${i}].capital = ${effect.capital} (L${node.layer} range: ${min} to ${max})`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 12: Revenue delta within per-layer calibration range ───────────────

describe("Rule 12 — revenue delta within per-layer calibration range", () => {
  it("all revenue effects are in range", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      const [min, max] = CALIBRATION[node.layer].revenue;
      node.effects.forEach((effect, i) => {
        if (effect.revenue < min || effect.revenue > max) {
          violations.push(
            `${node.id} effects[${i}].revenue = ${effect.revenue} (L${node.layer} range: ${min} to ${max})`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 13: Debt delta within range and non-negative ───────────────────────

describe("Rule 13 — debt delta within per-layer range and non-negative", () => {
  it("all debt effects are non-negative and in range", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      const [min, max] = CALIBRATION[node.layer].debt;
      node.effects.forEach((effect, i) => {
        if (effect.debt < min || effect.debt > max) {
          violations.push(
            `${node.id} effects[${i}].debt = ${effect.debt} (L${node.layer} range: ${min} to ${max})`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 14: Monthly burn delta within per-layer calibration range ───────────

describe("Rule 14 — monthlyBurn delta within per-layer calibration range", () => {
  it("all monthlyBurn effects are in range", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      const [min, max] = CALIBRATION[node.layer].monthlyBurn;
      node.effects.forEach((effect, i) => {
        if (effect.monthlyBurn < min || effect.monthlyBurn > max) {
          violations.push(
            `${node.id} effects[${i}].monthlyBurn = ${effect.monthlyBurn} (L${node.layer} range: ${min} to ${max})`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 15: Reputation delta within per-layer calibration range ─────────────

describe("Rule 15 — reputation delta within per-layer calibration range", () => {
  it("all reputation effects are in range", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      const [min, max] = CALIBRATION[node.layer].reputation;
      node.effects.forEach((effect, i) => {
        if (effect.reputation < min || effect.reputation > max) {
          violations.push(
            `${node.id} effects[${i}].reputation = ${effect.reputation} (L${node.layer} range: ${min} to ${max})`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 16: Network strength delta within per-layer calibration range ───────

describe("Rule 16 — networkStrength delta within per-layer calibration range", () => {
  it("all networkStrength effects are in range", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      const [min, max] = CALIBRATION[node.layer].networkStrength;
      node.effects.forEach((effect, i) => {
        if (effect.networkStrength < min || effect.networkStrength > max) {
          violations.push(
            `${node.id} effects[${i}].networkStrength = ${effect.networkStrength} (L${node.layer} range: ${min} to ${max})`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 17: No all-positive effects on L1–L4 ───────────────────────────────

describe("Rule 17 — no all-positive effects on L1–L4 (every choice has a cost)", () => {
  it("every L1–L4 effect has at least one cost", () => {
    const violations: string[] = [];
    for (const node of NODES.filter((n) => n.layer < 5)) {
      node.effects.forEach((effect, i) => {
        if (!hasCost(effect)) {
          violations.push(
            `${node.id} effects[${i}] has no cost — all fields are zero or positive`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 18: All L5 effects are exactly zero ────────────────────────────────

describe("Rule 18 — all L5 effects are exactly zero", () => {
  it("every L5 effect has all fields at 0 and empty eoDeltas", () => {
    const l5Nodes = NODES.filter((n) => n.layer === 5);
    const violations: string[] = [];
    for (const node of l5Nodes) {
      node.effects.forEach((effect, i) => {
        if (!isZeroEffect(effect)) {
          violations.push(
            `${node.id} effects[${i}] is not zero — L5 endings must have no mechanical effect`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 19 (bonus): Non-empty tensionHints on all L1–L4 choices ────────────

describe("Rule 19 — non-empty tensionHints on all L1–L4 choices", () => {
  it("every L1–L4 choice has a tensionHint", () => {
    const violations: string[] = [];
    for (const node of NODES.filter((n) => n.layer < 5)) {
      node.choices.forEach((choice, i) => {
        if (!choice.tensionHint || choice.tensionHint.trim() === "") {
          violations.push(
            `${node.id} choices[${i}] is missing tensionHint`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});

// ─── Rule 20 (bonus): EO deltas touch at most 3 dimensions per effect ────────
// Design rule: "touch 1–2 dimensions per node, not all 5" — 3 is permitted for
// intentional multi-signal bold choices; 4–5 makes EO profiles indistinguishable.

describe("Rule 20 — EO deltas touch at most 3 dimensions per effect", () => {
  it("no effect modifies more than 3 EO dimensions", () => {
    const violations: string[] = [];
    for (const node of NODES) {
      node.effects.forEach((effect, i) => {
        const dimCount = Object.keys(effect.eoDeltas).length;
        if (dimCount > 3) {
          violations.push(
            `${node.id} effects[${i}] modifies ${dimCount} EO dimensions (max 3)`
          );
        }
      });
    }
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});
