import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L7-node-1: Pivot — Lead customer demands a different product ──────────

const L7_SK_1: ScenarioSkeleton = {
  id: "L7-node-1",
  layer: 7,
  theme: "general",
  baseWeight: 1.0,
  eoTargetDimensions: ["innovativeness", "riskTaking"],
  narrativePattern: "customer_concentration",
  situationSeed:
    "Your biggest customer — the one who accounts for roughly 35 percent of your monthly revenue — has come to you with an unusual request. They want a version of what you do that is quite different from your current offering: adjusted inputs, a different format, a different delivery model. They say they will sign a six-month contract if you can make it work. If you chase this, you are partly pivoting. If you refuse, you risk losing them to someone willing to adapt.",
  choiceArchetypes: [
    {
      eoPoleSignal: "innovative + risk-tolerant",
      archetypeDescription:
        "Pivot fully. Retool your operation around their spec, sign the contract, and treat their requirements as the blueprint for a new product line. High dependency, high upside.",
      tensionAxis: "Revenue security vs. operational transformation risk",
    },
    {
      eoPoleSignal: "measured + innovative",
      archetypeDescription:
        "Build a separate product line just for them while keeping your existing offering intact. More expensive to run, but you hedge the risk and keep existing customers whole.",
      tensionAxis: "Diversification vs. divided focus",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline respectfully. Explain your focus and suggest they find a specialist. Protect what you have built rather than reshaping it around a single customer's needs.",
      tensionAxis: "Strategic focus vs. concentrated revenue loss",
    },
  ],
};

const L7_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -3_000,
    revenue: 4_500,
    debt: 0,
    monthlyBurn: 1_200,
    reputation: 5,
    networkStrength: 8,
    eoDeltas: { innovativeness: 2, riskTaking: 3, autonomy: -2 },
  },
  {
    capital: -2_000,
    revenue: 2_800,
    debt: 0,
    monthlyBurn: 1_800,
    reputation: 8,
    networkStrength: 6,
    eoDeltas: { innovativeness: 3, riskTaking: 1, proactiveness: 1 },
  },
  {
    capital: 0,
    revenue: -2_200,
    debt: 0,
    monthlyBurn: 0,
    reputation: 3,
    networkStrength: -4,
    eoDeltas: { autonomy: 3, riskTaking: -2, innovativeness: -1 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer7(): void {
  registerSkeleton({ skeleton: L7_SK_1, effects: L7_SK_1_EFFECTS });
}
