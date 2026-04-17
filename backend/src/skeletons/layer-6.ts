import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L6-node-1: Competition — Competitor undercuts your pricing ────────────

const L6_SK_1: ScenarioSkeleton = {
  id: "L6-node-1",
  layer: 6,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "innovativeness"],
  narrativePattern: "price_pressure",
  situationSeed:
    "A competitor from Tema has moved into your patch of Accra and dropped their prices by 20 percent below yours. They are new, they are loud, and your regulars are listening. You have been here long enough to know that price wars rarely end well for anyone — but standing still is also a choice. You have relationships, local knowledge, and a product they have not had time to understand.",
  choiceArchetypes: [
    {
      eoPoleSignal: "competitive + aggressive",
      archetypeDescription:
        "Match their prices immediately and absorb the margin hit. Make it clear to your customers that you will always be competitive. Outlast them on loyalty and volume.",
      tensionAxis: "Market share vs. sustainable margin",
    },
    {
      eoPoleSignal: "innovative + proactive",
      archetypeDescription:
        "Do not touch your prices. Instead, bundle in something they cannot replicate quickly — faster delivery, a loyalty card, free small repairs, or a genuinely better experience. Let price be their game, not yours.",
      tensionAxis: "Differentiation speed vs. immediate customer churn",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Hold your prices and double down on your most loyal segment. Some customers will leave. The ones who stay are worth more long-term. Not every competitor deserves a reaction.",
      tensionAxis: "Customer concentration vs. short-term revenue loss",
    },
  ],
};

const L6_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -2_000,
    revenue: 1_800,
    debt: 0,
    monthlyBurn: 500,
    reputation: -3,
    networkStrength: 4,
    eoDeltas: { competitiveAggressiveness: 3, innovativeness: -1, riskTaking: 1 },
  },
  {
    capital: -1_200,
    revenue: 1_200,
    debt: 0,
    monthlyBurn: 300,
    reputation: 10,
    networkStrength: 6,
    eoDeltas: { innovativeness: 3, proactiveness: 1, competitiveAggressiveness: -1 },
  },
  {
    capital: 0,
    revenue: -600,
    debt: 0,
    monthlyBurn: 0,
    reputation: 4,
    networkStrength: 2,
    eoDeltas: { autonomy: 2, competitiveAggressiveness: -2 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer6(): void {
  registerSkeleton({ skeleton: L6_SK_1, effects: L6_SK_1_EFFECTS });
}
