import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L10-node-1: Legacy — Exit, keep, or transform ────────────────────────

const L10_SK_1: ScenarioSkeleton = {
  id: "L10-node-1",
  layer: 10,
  theme: "general",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "innovativeness"],
  narrativePattern: "exit",
  situationSeed:
    "You have built something real. The business is profitable, it has a reputation, and people know your name in this part of Accra. Now a buyer has made a serious offer — not life-changing money, but a fair multiple that rewards the years of work. At the same time, a younger entrepreneur from your neighbourhood has asked to take over operations so you can step back but retain ownership. And there is a third path: reinvest everything, evolve the business into something more ambitious, and see what the next chapter looks like when you remove the ceiling entirely.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + autonomous",
      archetypeDescription:
        "Sell. Take the offer, close the chapter, and start clean. You proved you can build. The capital and the freedom to begin something new from a position of strength is its own kind of win.",
      tensionAxis: "Certainty and liquidity vs. ownership and continuity",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Hand over operations to the younger entrepreneur. Retain ownership and a revenue share, mentor them into your role, and free your own time while the business continues under your name.",
      tensionAxis: "Passive income and legacy vs. loss of operational control",
    },
    {
      eoPoleSignal: "innovative + proactive",
      archetypeDescription:
        "Decline the offer and reinvest. Transform the business — formalise it, expand the model, enter a new market or product category. The work you have done so far was the foundation, not the ceiling.",
      tensionAxis: "Transformational upside vs. concentration risk and complexity",
    },
  ],
};

const L10_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 40_000,
    revenue: -8_000,
    debt: -10_000,
    monthlyBurn: -8_000,
    reputation: 6,
    networkStrength: 5,
    eoDeltas: { autonomy: 2, riskTaking: 1, innovativeness: -1 },
  },
  {
    capital: 0,
    revenue: 2_500,
    debt: 0,
    monthlyBurn: -3_000,
    reputation: 10,
    networkStrength: 8,
    eoDeltas: { autonomy: 1, proactiveness: 1, innovativeness: -1 },
  },
  {
    capital: -10_000,
    revenue: 8_000,
    debt: 5_000,
    monthlyBurn: 5_000,
    reputation: 7,
    networkStrength: 9,
    eoDeltas: { innovativeness: 3, proactiveness: 2, autonomy: -1, riskTaking: 1 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer10(): void {
  registerSkeleton({ skeleton: L10_SK_1, effects: L10_SK_1_EFFECTS });
}
