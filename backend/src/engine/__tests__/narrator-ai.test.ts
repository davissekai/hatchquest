import { describe, it, expect } from "vitest";
import {
  generateNarrativeSkin,
  buildFallbackSkin,
  validateNarration,
  buildWorldConditionsBlock,
  buildTurnContextBlock,
} from "../narrator-ai.js";
import type { NarrationWorldContext } from "../narrator-ai.js";
import type { ScenarioSkeleton, PlayerContext, NarrativeSkin } from "@hatchquest/shared";

// Factory for NarrationWorldContext test fixtures — keeps call sites compact
// and centralises new required fields (sector, turnNumber, etc.).
function ctx(partial: Partial<NarrationWorldContext> = {}): NarrationWorldContext {
  return {
    marketHeat: 50,
    competitorThreat: 50,
    infrastructureStability: 50,
    capital: 5000,
    lastEventNarrativeHook: null,
    sector: "tech",
    businessDescription: "mobile food delivery service in Osu",
    choiceHistory: [],
    turnNumber: 0,
    isFirstScenarioTurn: false,
    ...partial,
  };
}

const TEST_SKELETON: ScenarioSkeleton = {
  id: "test-skeleton",
  layer: 1,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
  situationSeed:
    "A competitor has appeared in your market with a cheaper alternative. Your first loyal customers are asking questions.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + competitive",
      archetypeDescription:
        "Confront the competition directly — invest to undercut or differentiate aggressively",
      tensionAxis: "Speed vs. financial stability",
    },
    {
      eoPoleSignal: "measured + innovative",
      archetypeDescription:
        "Pivot to a niche the competitor cannot serve — differentiate sideways",
      tensionAxis: "Opportunity vs. risk management",
    },
    {
      eoPoleSignal: "conservative + autonomous",
      archetypeDescription:
        "Ignore the competitor and double down on existing customer relationships",
      tensionAxis: "Growth ambition vs. disciplined restraint",
    },
  ],
};

const TEST_CONTEXT: PlayerContext = {
  businessDescription: "mobile food delivery service in Osu",
  motivation: "I want to make healthy food accessible to office workers",
  rawQ1Response:
    "I want to build a mobile food delivery service in Osu because office workers deserve healthy, affordable lunch options.",
  rawQ2Response: "I would call my three vendors immediately and negotiate emergency supply.",
  q2Prompt: "Your food delivery service...",
};

describe("buildFallbackSkin", () => {
  it("produces a valid NarrativeSkin from skeleton + context", () => {
    const skin = buildFallbackSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.narrative).toBeDefined();
    expect(skin.choices).toHaveLength(3);
    expect(skin.tensionHints).toHaveLength(3);
    skin.choices.forEach((c) => expect(c.length).toBeGreaterThan(10));
    skin.tensionHints.forEach((h) => expect(h.length).toBeGreaterThan(5));
  });

  it("uses the situation seed as narrative directly", () => {
    const skin = buildFallbackSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.narrative).toBe(TEST_SKELETON.situationSeed);
  });

  it("choices map directly to archetype descriptions", () => {
    const skin = buildFallbackSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.choices[0]).toBe(TEST_SKELETON.choiceArchetypes[0].archetypeDescription);
    expect(skin.choices[1]).toBe(TEST_SKELETON.choiceArchetypes[1].archetypeDescription);
    expect(skin.choices[2]).toBe(TEST_SKELETON.choiceArchetypes[2].archetypeDescription);
  });

  it("tensionHints map directly to archetype tensionAxis", () => {
    const skin = buildFallbackSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.tensionHints[0]).toBe(TEST_SKELETON.choiceArchetypes[0].tensionAxis);
    expect(skin.tensionHints[1]).toBe(TEST_SKELETON.choiceArchetypes[1].tensionAxis);
    expect(skin.tensionHints[2]).toBe(TEST_SKELETON.choiceArchetypes[2].tensionAxis);
  });

  it("prepends a time-bridge prefix on the first scenario turn when businessDescription is present", () => {
    const skin = buildFallbackSkin(
      TEST_SKELETON,
      TEST_CONTEXT,
      ctx({ isFirstScenarioTurn: true, businessDescription: "a cocoa export business" })
    );
    expect(skin.narrative.startsWith("A few weeks into building a cocoa export business,")).toBe(
      true
    );
    expect(skin.narrative).toContain(TEST_SKELETON.situationSeed);
  });

  it("does NOT prepend the time-bridge when isFirstScenarioTurn is true but businessDescription is empty", () => {
    const skin = buildFallbackSkin(
      TEST_SKELETON,
      TEST_CONTEXT,
      ctx({ isFirstScenarioTurn: true, businessDescription: "" })
    );
    expect(skin.narrative).toBe(TEST_SKELETON.situationSeed);
  });

  it("does NOT prepend the time-bridge when isFirstScenarioTurn is false", () => {
    const skin = buildFallbackSkin(
      TEST_SKELETON,
      TEST_CONTEXT,
      ctx({ isFirstScenarioTurn: false })
    );
    expect(skin.narrative).toBe(TEST_SKELETON.situationSeed);
  });
});

describe("generateNarrativeSkin", () => {
  it("falls back to buildFallbackSkin when ANTHROPIC_API_KEY is not set", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const [skin, source] = await generateNarrativeSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.narrative).toBeDefined();
    expect(skin.choices).toHaveLength(3);
    expect(skin.tensionHints).toHaveLength(3);
    expect(source).toBe("fallback");

    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  });

  it("uses mock skin when MOCK_LLM=1", async () => {
    const savedKey = process.env.ANTHROPIC_API_KEY;
    const savedMock = process.env.MOCK_LLM;
    delete process.env.ANTHROPIC_API_KEY;
    process.env.MOCK_LLM = "1";

    const [skin, source] = await generateNarrativeSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(source).toBe("fallback");
    expect(skin.narrative).toBeDefined();
    expect(skin.choices).toHaveLength(3);

    process.env.MOCK_LLM = savedMock ?? "";
    if (!savedMock) delete process.env.MOCK_LLM;
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  });
});

describe("buildWorldConditionsBlock", () => {
  it("labels market heat correctly (hot/moderate/cold)", () => {
    expect(buildWorldConditionsBlock(ctx({ marketHeat: 80 }))).toContain("hot");
    expect(buildWorldConditionsBlock(ctx({ marketHeat: 50 }))).toContain("moderate");
    expect(buildWorldConditionsBlock(ctx({ marketHeat: 20 }))).toContain("cold");
  });

  it("labels competitor threat correctly (aggressive/present/quiet)", () => {
    expect(buildWorldConditionsBlock(ctx({ competitorThreat: 80 }))).toContain("aggressive");
    expect(buildWorldConditionsBlock(ctx({ competitorThreat: 50 }))).toContain("present");
    expect(buildWorldConditionsBlock(ctx({ competitorThreat: 20 }))).toContain("quiet");
  });

  it("labels infrastructure correctly (reliable/patchy/unreliable)", () => {
    expect(buildWorldConditionsBlock(ctx({ infrastructureStability: 80 }))).toContain("reliable");
    expect(buildWorldConditionsBlock(ctx({ infrastructureStability: 50 }))).toContain("patchy");
    expect(buildWorldConditionsBlock(ctx({ infrastructureStability: 20 }))).toContain("unreliable");
  });

  it("includes lastEventNarrativeHook when provided", () => {
    expect(
      buildWorldConditionsBlock(ctx({ lastEventNarrativeHook: "ECG outage hit Accra." }))
    ).toContain("ECG outage hit Accra.");
  });

  it("outputs 'none' when lastEventNarrativeHook is null", () => {
    expect(buildWorldConditionsBlock(ctx({ lastEventNarrativeHook: null }))).toContain("none");
  });
});

// ─── buildTurnContextBlock ────────────────────────────────────────────────────

describe("buildTurnContextBlock", () => {
  it("reports sector, business description, and 'none yet' when no choices", () => {
    const block = buildTurnContextBlock(
      ctx({ sector: "retail", businessDescription: "inventory app for shop owners" })
    );
    expect(block).toContain("retail");
    expect(block).toContain("inventory app for shop owners");
    expect(block).toContain("none yet");
    expect(block).toContain("Is first scenario turn: no");
  });

  it("marks first scenario turn when isFirstScenarioTurn is true", () => {
    const block = buildTurnContextBlock(ctx({ isFirstScenarioTurn: true }));
    expect(block).toContain("Is first scenario turn: YES");
  });

  it("labels MOST RECENT choice and prior choices correctly", () => {
    const block = buildTurnContextBlock(
      ctx({
        choiceHistory: [
          { nodeId: "L2-node-1", choiceLabel: "Took the loan", effectSummary: "+5k capital, +2k debt" },
          { nodeId: "L1-node-1", choiceLabel: "Took the deal", effectSummary: "-3k capital" },
        ],
      })
    );
    expect(block).toContain("MOST RECENT");
    expect(block).toContain("Took the loan");
    expect(block).toContain("prior 1");
    expect(block).toContain("Took the deal");
  });

  it("falls back to '(not provided)' when business description is empty", () => {
    const block = buildTurnContextBlock(ctx({ businessDescription: "" }));
    expect(block).toContain("(not provided)");
  });
});

// ─── validateNarration ────────────────────────────────────────────────────────

describe("validateNarration", () => {
  // A completely lowercase narrative with exactly 3 choices — guaranteed to pass validator
  function validSkin(): NarrativeSkin {
    return {
      narrative: "a competitor arrived and the market shifted.",
      choices: ["invest in growth", "pivot sideways", "focus on relationships"],
      tensionHints: ["Speed vs. stability", "Growth vs. restraint", "Ambition vs. discipline"],
    };
  }

  it("returns { ok: true } for a valid skin with no capitalised proper nouns", () => {
    const result = validateNarration(validSkin(), TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("returns { ok: false } when choices.length !== 3 (too many choices)", () => {
    const skin: NarrativeSkin = {
      ...validSkin(),
      // TypeScript won't let us cast [string,string,string,string] directly — use a type cast
      choices: ["a", "b", "c", "d"] as unknown as [string, string, string],
    };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/3 choices/);
  });

  it("returns { ok: false } when choices.length !== 3 (too few choices)", () => {
    const skin: NarrativeSkin = {
      ...validSkin(),
      choices: ["a", "b"] as unknown as [string, string, string],
    };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/3 choices/);
  });

  it("returns { ok: false } when narrative exceeds 600 characters", () => {
    const longNarrative = "a".repeat(601); // lowercase so no proper noun violations
    const skin: NarrativeSkin = { ...validSkin(), narrative: longNarrative };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/narrative too long/);
  });

  it("accepts narrative at exactly 600 characters", () => {
    const narrative = "a".repeat(600); // lowercase — no capitalised word matches
    const skin: NarrativeSkin = { ...validSkin(), narrative };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(true);
  });

  it("returns { ok: false } for unrecognised proper nouns in narrative", () => {
    // "Xyzzy" starts with capital, has 4+ letters, is not in any whitelist
    const skin: NarrativeSkin = {
      ...validSkin(),
      narrative: "Xyzzy has arrived in town and disrupted the market.",
    };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/unrecognised proper nouns/);
  });

  it("whitelists globally recognised Accra proper nouns (Accra, Ghana)", () => {
    // "Accra" and "Ghana" are in GLOBAL_PROPER_NOUN_WHITELIST
    const skin: NarrativeSkin = {
      ...validSkin(),
      narrative: "Accra and Ghana are home to many businesses.",
    };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(true);
  });

  it("whitelists words from the player business name", () => {
    // businessDescription = "mobile food delivery service in Osu"
    // "Osu" is a word in the business name, so it should be whitelisted
    const skin: NarrativeSkin = {
      ...validSkin(),
      narrative: "the Osu market is highly competitive.",
    };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(true);
  });

  it("handles empty playerBusinessName without error", () => {
    const skin: NarrativeSkin = { ...validSkin(), narrative: "Accra is the capital." };
    const result = validateNarration(skin, TEST_SKELETON, "");
    expect(result.ok).toBe(true);
  });

  it("whitelists words from archetype descriptions", () => {
    // archetypeDescription[1] starts with "Pivot"
    const archetypeWord = TEST_SKELETON.choiceArchetypes[1].archetypeDescription.split(/\s+/)[0];
    // archetypeWord = "Pivot"
    const skin: NarrativeSkin = {
      ...validSkin(),
      narrative: `${archetypeWord} the approach when the market shifts.`,
    };
    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT.businessDescription);
    expect(result.ok).toBe(true);
  });
});
