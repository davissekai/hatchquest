import { describe, expect, it } from "vitest";
import type {
  NarrativeSkin,
  PlayerContext,
  ScenarioSkeleton,
} from "@hatchquest/shared";
import {
  buildFallbackSkin,
  buildTurnContextBlock,
  buildWorldConditionsBlock,
  generateNarrativeSkin,
  validateNarration,
} from "../narrator-ai.js";
import type { NarrationWorldContext } from "../narrator-ai.js";

function ctx(partial: Partial<NarrationWorldContext> = {}): NarrationWorldContext {
  return {
    marketHeat: 50,
    competitorThreat: 50,
    infrastructureStability: 50,
    capital: 5000,
    lastEventNarrativeHook: null,
    sector: "tech",
    businessLabel: "Market Ops App",
    businessSummary:
      "a software venture helping small businesses run operations with more control",
    storyMemory: null,
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
  baseWeight: 1,
  eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
  narrativePattern: "test-pattern",
  situationSeed:
    "A rival has started sounding out some of the traders you hoped would become repeat customers.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk",
      archetypeDescription: "Spend now to stay visible before the rival settles in.",
      tensionAxis: "Speed vs runway",
    },
    {
      eoPoleSignal: "measured",
      archetypeDescription: "Protect cash and tighten your operating discipline first.",
      tensionAxis: "Stability vs momentum",
    },
    {
      eoPoleSignal: "network",
      archetypeDescription: "Lean on your network to keep customers warm while you adapt.",
      tensionAxis: "Control vs support",
    },
  ],
};

const TEST_CONTEXT: PlayerContext = {
  businessLabel: "Market Ops App",
  businessSummary:
    "a software venture helping small businesses run operations with more control",
  businessDescription:
    "a software venture helping small businesses run operations with more control",
  motivation: "To solve an obvious market problem and turn it into a lasting venture.",
  founderEdge: "Fast-moving operator under pressure",
  rawQ1Response:
    "I want to build a mobile inventory app for small traders in Makola because I keep seeing stockouts and wasted sales.",
  rawQ2Response:
    "I would call two backup suppliers immediately and lock in a short-term deal.",
  q2Prompt:
    "Your main supplier just backed out of a key arrangement and traders are waiting for an answer.",
};

describe("buildFallbackSkin", () => {
  it("continues story memory on the first scenario turn without quoting raw Q1", () => {
    const skin = buildFallbackSkin(
      TEST_SKELETON,
      TEST_CONTEXT,
      ctx({
        isFirstScenarioTurn: true,
        storyMemory: {
          lastBeatSummary:
            "You answered an early supplier disruption with a decisive operational response.",
          openThread: "the unresolved supplier disruption",
          continuityAnchor: "supplier disruption still threatening your first momentum",
          recentDecisionStyle: "decisive operational response",
          currentArc: "First Market Test",
        },
      })
    );

    expect(skin.narrative).toContain("supplier disruption still threatening your first momentum");
    expect(skin.narrative).toContain("the unresolved supplier disruption");
    expect(skin.narrative).not.toContain(TEST_CONTEXT.rawQ1Response ?? "");
  });

  it("adds a continuity callback after later choices", () => {
    const skin = buildFallbackSkin(
      TEST_SKELETON,
      TEST_CONTEXT,
      ctx({
        choiceHistory: [
          {
            nodeId: "L1-node-1",
            choiceLabel: "line up a backup supplier",
            effectSummary: "-2k capital, +reliability",
          },
        ],
      })
    );

    expect(skin.narrative.startsWith("After choosing to line up a backup supplier")).toBe(true);
  });
});

describe("generateNarrativeSkin", () => {
  it("falls back when ANTHROPIC_API_KEY is not set", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const [skin, source] = await generateNarrativeSkin(TEST_SKELETON, TEST_CONTEXT);
    expect(source).toBe("fallback");
    expect(skin.choices).toHaveLength(3);

    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  });
});

describe("buildWorldConditionsBlock", () => {
  it("labels market heat, competitor pressure, and infrastructure", () => {
    const block = buildWorldConditionsBlock(
      ctx({ marketHeat: 80, competitorThreat: 20, infrastructureStability: 30 })
    );
    expect(block).toContain("hot");
    expect(block).toContain("quiet");
    expect(block).toContain("unreliable");
  });
});

describe("buildTurnContextBlock", () => {
  it("includes business summary and recent choices", () => {
    const block = buildTurnContextBlock(
      ctx({
        choiceHistory: [
          {
            nodeId: "L2-node-1",
            choiceLabel: "delay the rollout",
            effectSummary: "+time, -momentum",
          },
        ],
      })
    );
    expect(block).toContain("BUSINESS_SUMMARY");
    expect(block).toContain("MOST RECENT");
    expect(block).toContain("delay the rollout");
  });

  it("adds story memory instructions on the first scenario turn", () => {
    const block = buildTurnContextBlock(
      ctx({
        isFirstScenarioTurn: true,
        storyMemory: {
          lastBeatSummary:
            "You answered an early supplier disruption with a decisive operational response.",
          openThread: "the unresolved supplier disruption",
          continuityAnchor: "supplier disruption still threatening your first momentum",
          recentDecisionStyle: "decisive operational response",
          currentArc: "First Market Test",
        },
      })
    );
    expect(block).toContain("FIRST_TURN_PRIORITY");
    expect(block).toContain("continuityAnchor");
  });
});

describe("validateNarration", () => {
  function validFirstTurnSkin(): NarrativeSkin {
    return {
      // Realistic LLM output: paraphrases storyMemory rather than quoting verbatim.
      // Content words from "supplier disruption still threatening your first momentum"
      // appear at >40% overlap, satisfying hasFirstTurnContinuity.
      narrative:
        "Two days after your supplier backed out, the disruption is still threatening your first wave of traders. Rivals have noticed the gap and are circling. You need to decide whether to patch the supply chain fast or use this pressure as a forcing function.",
      choices: ["invest now", "slow down", "ask partners for cover"],
      tensionHints: ["Speed vs runway", "Stability vs momentum", "Control vs support"],
    };
  }

  it("accepts valid first-turn continuity", () => {
    const result = validateNarration(
      validFirstTurnSkin(),
      TEST_SKELETON,
      TEST_CONTEXT,
      ctx({
        isFirstScenarioTurn: true,
        storyMemory: {
          lastBeatSummary:
            "You answered an early supplier disruption with a decisive operational response.",
          openThread: "the unresolved supplier disruption",
          continuityAnchor: "supplier disruption still threatening your first momentum",
          recentDecisionStyle: "decisive operational response",
          currentArc: "First Market Test",
        },
      })
    );
    expect(result.ok).toBe(true);
  });

  it("rejects narration that leaks raw Layer 0 wording", () => {
    const skin: NarrativeSkin = {
      narrative:
        "I want to build a mobile inventory app for small traders in Makola because I keep seeing stockouts and wasted sales.",
      choices: ["a", "b", "c"],
      tensionHints: ["x", "y", "z"],
    };

    const result = validateNarration(skin, TEST_SKELETON, TEST_CONTEXT);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/raw Layer 0 text/);
  });

  it("accepts first-turn narration that echoes Q2 content via story memory", () => {
    // Q2 content is game-generated scenario text that storyMemory distills into
    // continuityAnchor/openThread/lastBeatSummary. The first L1 beat SHOULD carry
    // those concepts forward — Q2 words appearing in the narrative is the feature,
    // not a leak. Only rawQ1Response (the founder's free-form pitch) must never echo.
    const q2EchoContext: PlayerContext = {
      ...TEST_CONTEXT,
      rawQ2Response:
        "I would call two backup suppliers immediately and lock in a short-term deal.",
      q2Prompt:
        "Your main supplier just backed out of a key arrangement and traders are waiting for an answer.",
    };
    const skin: NarrativeSkin = {
      // Contains the 7-content-word chunk "your main supplier just backed out key"
      // (after filterShort) from q2Prompt — the exact pattern the old leak detector caught.
      narrative:
        "Two days after your main supplier just backed out key arrangement talks, the disruption is still threatening your first momentum. Rivals are circling the gap.",
      choices: ["invest now", "slow down", "ask partners for cover"],
      tensionHints: ["Speed vs runway", "Stability vs momentum", "Control vs support"],
    };

    const result = validateNarration(
      skin,
      TEST_SKELETON,
      q2EchoContext,
      ctx({
        isFirstScenarioTurn: true,
        storyMemory: {
          lastBeatSummary:
            "You answered an early supplier disruption with a decisive operational response.",
          openThread: "the unresolved supplier disruption",
          continuityAnchor: "supplier disruption still threatening your first momentum",
          recentDecisionStyle: "decisive operational response",
          currentArc: "First Market Test",
        },
      })
    );
    expect(result.ok).toBe(true);
  });

  it("accepts first-turn narration without a time marker (continuity is a prompt-side concern, not a validator hard gate)", () => {
    // Time-marker and ≥40% word-overlap checks were removed from the validator:
    // they rejected usable LLM output more often than they caught real drift,
    // and forced buildFallbackSkin to serve a stilted template. The system
    // prompt still instructs the LLM to open with a time marker and continue
    // story memory — if it occasionally doesn't, that's a minor cosmetic miss,
    // not a fatal quality issue worth a fallback.
    const skin: NarrativeSkin = {
      narrative: "A stranger walks into your office with a completely unrelated offer.",
      choices: ["a", "b", "c"],
      tensionHints: ["x", "y", "z"],
    };

    const result = validateNarration(
      skin,
      TEST_SKELETON,
      TEST_CONTEXT,
      ctx({
        isFirstScenarioTurn: true,
        storyMemory: {
          lastBeatSummary:
            "You answered an early supplier disruption with a decisive operational response.",
          openThread: "the unresolved supplier disruption",
          continuityAnchor: "supplier disruption still threatening your first momentum",
          recentDecisionStyle: "decisive operational response",
          currentArc: "First Market Test",
        },
      })
    );
    expect(result.ok).toBe(true);
  });
});
