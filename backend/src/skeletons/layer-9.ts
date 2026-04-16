import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L9-node-1: Scale — Hire 10 people vs. outsource ──────────────────────

const L9_SK_1: ScenarioSkeleton = {
  id: "L9-node-1",
  layer: 9,
  theme: "hiring",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "riskTaking"],
  situationSeed:
    "Demand has outpaced what your current team can handle. You have a real scaling decision in front of you: hire ten people directly and build the team you always imagined, outsource the operations to a specialist firm in Tema that handles this category, or grow incrementally — two hires per month, controlled and affordable. Each path leads to a different kind of company. Payroll for ten would reshape your entire financial structure, outsourcing would mean releasing quality control, and incremental growth risks losing momentum at exactly the wrong time.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + proactive",
      archetypeDescription:
        "Hire all ten now. Build the team, absorb the payroll, and operate at full capacity immediately. You cannot win at scale if you are always one step behind demand.",
      tensionAxis: "Operational capacity vs. payroll exposure",
    },
    {
      eoPoleSignal: "innovative + autonomous",
      archetypeDescription:
        "Outsource operations to the specialist firm. Free yourself from people management, reduce fixed overhead, and focus your energy on the product and customers. Accept that you no longer control every step of delivery.",
      tensionAxis: "Focus and flexibility vs. quality and brand control",
    },
    {
      eoPoleSignal: "measured + conservative",
      archetypeDescription:
        "Grow incrementally. Two hires per quarter, funded from revenue. Slower, safer, sustainable — but you risk losing key accounts if you cannot meet demand in the next 90 days.",
      tensionAxis: "Financial discipline vs. momentum and opportunity cost",
    },
  ],
};

const L9_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -8_000,
    revenue: 12_000,
    debt: 5_000,
    monthlyBurn: 15_000,
    reputation: 18,
    networkStrength: 20,
    eoDeltas: { riskTaking: 3, proactiveness: 2, autonomy: 1, innovativeness: 1, competitiveAggressiveness: 1 },
  },
  {
    capital: -1_000,
    revenue: 7_000,
    debt: 0,
    monthlyBurn: 4_000,
    reputation: 6,
    networkStrength: 12,
    eoDeltas: { innovativeness: 2, autonomy: -2, proactiveness: 1, riskTaking: -1, competitiveAggressiveness: 1 },
  },
  {
    capital: -500,
    revenue: 3_000,
    debt: 0,
    monthlyBurn: 2_400,
    reputation: 5,
    networkStrength: 8,
    eoDeltas: { autonomy: 2, riskTaking: -2, proactiveness: -1, innovativeness: 1, competitiveAggressiveness: -1 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer9(): void {
  registerSkeleton({ skeleton: L9_SK_1, effects: L9_SK_1_EFFECTS });
}
