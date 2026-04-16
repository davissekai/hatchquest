import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L8-node-1: Partnership — Larger company offers co-branding ────────────

const L8_SK_1: ScenarioSkeleton = {
  id: "L8-node-1",
  layer: 8,
  theme: "networking",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "proactiveness"],
  situationSeed:
    "A well-established Accra brand — larger than you, with distribution across three regions — has approached you about a co-branding partnership. They want to put their logo alongside yours, sell through their network, and expand your reach significantly. In return, they want input on your product quality standards, pricing, and packaging. The deal would triple your distribution overnight. But you would no longer be working entirely on your own terms.",
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + collaborative",
      archetypeDescription:
        "Accept the full partnership. Give them the co-branding rights, align on their standards, and ride their distribution network to scale. You sacrifice some autonomy but gain reach you could not build alone in three years.",
      tensionAxis: "Distribution scale vs. brand and operational control",
    },
    {
      eoPoleSignal: "autonomous + proactive",
      archetypeDescription:
        "Negotiate hard. Accept co-branding in limited markets only, retain full pricing control, and put a 12-month exit clause in the contract. Take the access without surrendering the business.",
      tensionAxis: "Partnership leverage vs. negotiation complexity",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline. You have spent too long building your identity to attach it to someone else's brand. Grow through your own channels, at your own pace, on your own terms.",
      tensionAxis: "Brand integrity vs. growth ceiling",
    },
  ],
};

const L8_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 2_000,
    revenue: 6_000,
    debt: 0,
    monthlyBurn: 1_500,
    reputation: 15,
    networkStrength: 25,
    eoDeltas: { proactiveness: 2, autonomy: -3, competitiveAggressiveness: 1 },
  },
  {
    capital: 500,
    revenue: 3_000,
    debt: 0,
    monthlyBurn: 600,
    reputation: 10,
    networkStrength: 15,
    eoDeltas: { autonomy: 1, proactiveness: 2, riskTaking: 1 },
  },
  {
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: -2,
    networkStrength: -3,
    eoDeltas: { autonomy: 3, proactiveness: -1 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer8(): void {
  registerSkeleton({ skeleton: L8_SK_1, effects: L8_SK_1_EFFECTS });
}
