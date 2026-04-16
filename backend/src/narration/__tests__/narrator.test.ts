import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { ScenarioNode } from "@hatchquest/shared";
import { createInitialWorldState } from "../../engine/world-state.js";
import {
  buildScenarioWorldStateBrief,
  buildDeterministicScenarioNarrative,
  buildDeterministicResultsSummary,
  narrateScenarioNode,
  narrateResultsSummary,
} from "../narrator.js";

function makeState() {
  return {
    ...createInitialWorldState({ seed: 42 }),
    capital: 12_000,
    monthlyBurn: 1_500,
    reputation: 18,
    networkStrength: 14,
    marketDemand: 72,
    infrastructureReliability: 38,
    competitorAggression: 81,
    eoProfile: {
      autonomy: 6,
      innovativeness: 7,
      riskTaking: 8,
      proactiveness: 6,
      competitiveAggressiveness: 4,
    },
  };
}

const node: ScenarioNode = {
  id: "L2-node-test",
  layer: 2,
  narrative:
    "A trader at Makola offers you shelf space if you can deliver inventory every Friday for the next month.",
  choices: [
    { index: 0, text: "Take it", tensionHint: "Speed vs runway" },
    { index: 1, text: "Negotiate", tensionHint: "Reach vs control" },
    { index: 2, text: "Decline", tensionHint: "Focus vs expansion" },
  ],
};

const savedApiKey = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  if (savedApiKey !== undefined) {
    process.env.ANTHROPIC_API_KEY = savedApiKey;
  }
});

describe("narrator fallback builders", () => {
  it("buildScenarioWorldStateBrief includes key world-state signals", () => {
    const brief = buildScenarioWorldStateBrief(makeState());
    expect(brief).toContain("Business:");
    expect(brief).toContain("Capital: GHS 12,000");
    expect(brief).toContain("Competition:");
  });

  it("buildDeterministicScenarioNarrative preserves the base narrative and adds context", () => {
    const narrative = buildDeterministicScenarioNarrative(node, makeState());
    expect(narrative).toContain(node.narrative);
    expect(narrative).toContain("GHS 12,000");
    expect(narrative).toContain("monthly burn of GHS 1,500");
  });

  it("buildDeterministicResultsSummary references business health and EO signals", () => {
    const summary = buildDeterministicResultsSummary(makeState());
    expect(summary).toContain("GHS 12,000");
    expect(summary).toContain("bold commitments");
    expect(summary).toContain("direct competitive pressure");
  });
});

describe("narrateScenarioNode", () => {
  it("returns null when node is null", async () => {
    await expect(narrateScenarioNode(null, makeState())).resolves.toBeNull();
  });

  it("falls back to deterministic narration when Anthropic is unavailable", async () => {
    const narrated = await narrateScenarioNode(node, makeState());
    expect(narrated?.narrative).toContain(node.narrative);
    expect(narrated?.narrative).toContain("GHS 12,000");
  });

  it("preserves choices and ids when narrating", async () => {
    const narrated = await narrateScenarioNode(node, makeState());
    expect(narrated?.id).toBe(node.id);
    expect(narrated?.choices).toEqual(node.choices);
  });
});

describe("narrateResultsSummary", () => {
  it("falls back to deterministic results narration when Anthropic is unavailable", async () => {
    const summary = await narrateResultsSummary(makeState());
    expect(summary).toContain("GHS 12,000");
    expect(summary).toContain("bold commitments");
  });
});
