import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L5-node-1: Legacy — Who do you want to be? ───────────────────────────

const L5_SK_1: ScenarioSkeleton = {
  id: "L5-node-1",
  layer: 5,
  theme: "general",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "innovativeness"],
  narrativePattern: "formalisation",
  situationSeed:
    "A year in. The business is real. Decisions you make now will shape what it becomes — not just financially, but structurally. You can formalise and register as a limited company, bringing in accountability and legitimacy. You can bring on a co-founder to share the weight and accelerate growth. Or you can stay exactly as you are: lean, profitable, and entirely yours.",
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + innovative",
      archetypeDescription:
        "Formalise. Register as a limited company, set up proper accounts, build the infrastructure that a serious business requires.",
      tensionAxis: "Legitimacy and scale vs. overhead and formality",
    },
    {
      eoPoleSignal: "collaborative + ambitious",
      archetypeDescription:
        "Bring on a co-founder. Share equity for shared effort, find someone whose skills fill your gaps, and build something larger together.",
      tensionAxis: "Shared upside vs. shared control",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Stay lean and informal. You know what you are. Optimise it, protect the margin, and grow only when growth costs nothing essential.",
      tensionAxis: "Independence vs. growth ceiling",
    },
  ],
};

const L5_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -3_000,
    revenue: 2_000,
    debt: 0,
    monthlyBurn: 1_500,
    reputation: 12,
    networkStrength: 8,
    eoDeltas: { proactiveness: 2, innovativeness: 2, autonomy: -1 },
  },
  {
    capital: 5_000,
    revenue: 4_000,
    debt: 0,
    monthlyBurn: 2_000,
    reputation: 7,
    networkStrength: 10,
    eoDeltas: { proactiveness: 2, innovativeness: 2, autonomy: -3 },
  },
  {
    capital: 1_000,
    revenue: 1_000,
    debt: 0,
    monthlyBurn: -500,
    reputation: 8,
    networkStrength: 5,
    eoDeltas: { autonomy: 3, proactiveness: -2 },
  },
];

// ── L5-node-2: Consolidation — Plateau and what comes next ───────────────

const L5_SK_2: ScenarioSkeleton = {
  id: "L5-node-2",
  layer: 5,
  theme: "competition",
  narrativePattern: "strategic_inflection",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
  situationSeed:
    "Revenue is stable and the business is healthy — but growth has plateaued. You have been at the same level for two months. Three paths are open: push aggressively into a new market segment where you have no foothold but real opportunity, optimise your existing operation to extract more from what already works, or sell the business while it is profitable and healthy and direct your energy toward what comes next.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + competitive",
      archetypeDescription:
        "Push into the new market. The plateau means the current model has limits. Break them before a competitor does.",
      tensionAxis: "New growth vs. operational disruption",
    },
    {
      eoPoleSignal: "innovative + measured",
      archetypeDescription:
        "Optimise. More margin, better retention, stronger systems. A more profitable version of what already works.",
      tensionAxis: "Incremental gains vs. competitive stagnation",
    },
    {
      eoPoleSignal: "proactive + autonomous",
      archetypeDescription:
        "Sell. You built something worth owning. Take the outcome, learn the lessons, and direct your energy toward what comes next.",
      tensionAxis: "Realising value vs. abandoning what you built",
    },
  ],
};

const L5_SK_2_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -4_000,
    revenue: 5_000,
    debt: 2_000,
    monthlyBurn: 2_000,
    reputation: 6,
    networkStrength: 8,
    eoDeltas: { riskTaking: 3, competitiveAggressiveness: 2, autonomy: -1 },
  },
  {
    capital: -1_500,
    revenue: 2_000,
    debt: 0,
    monthlyBurn: 500,
    reputation: 10,
    networkStrength: 10,
    eoDeltas: { innovativeness: 2, proactiveness: 1, riskTaking: -1 },
  },
  {
    capital: 8_000,
    revenue: -1_000,
    debt: 0,
    monthlyBurn: -2_000,
    reputation: 5,
    networkStrength: 8,
    eoDeltas: { autonomy: 2, proactiveness: 3, riskTaking: -2 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer5(): void {
  registerSkeleton({ skeleton: L5_SK_1, effects: L5_SK_1_EFFECTS });
  registerSkeleton({ skeleton: L5_SK_2, effects: L5_SK_2_EFFECTS });
}
