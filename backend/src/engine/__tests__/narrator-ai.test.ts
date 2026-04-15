import { describe, it, expect } from "vitest";
import { generateNarrativeSkin, buildFallbackSkin } from "../narrator-ai.js";
import type { ScenarioSkeleton, PlayerContext } from "@hatchquest/shared";

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
    expect(skin.narrative).toContain("mobile food delivery");
    expect(skin.choices).toHaveLength(3);
    expect(skin.tensionHints).toHaveLength(3);
    skin.choices.forEach((c) => expect(c.length).toBeGreaterThan(10));
    skin.tensionHints.forEach((h) => expect(h.length).toBeGreaterThan(5));
  });

  it("lowercases the situation seed after 'In your <biz>,'", () => {
    const skin = buildFallbackSkin(TEST_SKELETON, TEST_CONTEXT);
    // Seed starts with "A competitor..." — should become "a competitor..."
    expect(skin.narrative).toMatch(/In your mobile food delivery service in Osu, a competitor/);
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
});

describe("generateNarrativeSkin", () => {
  it("falls back to buildFallbackSkin when ANTHROPIC_API_KEY is not set", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const skin = await generateNarrativeSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(skin.narrative).toBeDefined();
    expect(skin.choices).toHaveLength(3);
    expect(skin.tensionHints).toHaveLength(3);

    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  });
});
