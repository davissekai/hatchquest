import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L4-node-1: Pivot — Core model is stalling ─────────────────────────────

const L4_SK_1: ScenarioSkeleton = {
  id: "L4-node-1",
  layer: 4,
  theme: "operations",
  baseWeight: 1.0,
  eoTargetDimensions: ["innovativeness", "riskTaking"],
  narrativePattern: "pivot",
  situationSeed:
    "Five months in and your core revenue line is stalling. The model that got you here is not going to get you to the next level. You have identified a fundamental change that could double your business — but it means dismantling what you have built and rebuilding while managing the existing operation.",
  choiceArchetypes: [
    {
      eoPoleSignal: "innovative + bold",
      archetypeDescription:
        "Execute the pivot fully. Shut down the stalling model, absorb the transitional losses, and rebuild for what the business can become.",
      tensionAxis: "Transformational change vs. transitional risk",
    },
    {
      eoPoleSignal: "measured + proactive",
      archetypeDescription:
        "Run the pivot in parallel. Keep existing revenue while building the new model on the side. Slower, messier, but safer.",
      tensionAxis: "Risk management vs. divided focus",
    },
    {
      eoPoleSignal: "conservative + autonomous",
      archetypeDescription:
        "Hold the line. Optimise the existing model and compete harder rather than rebuilding from scratch.",
      tensionAxis: "Operational discipline vs. stagnation",
    },
  ],
};

const L4_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -5_000,
    revenue: 3_000,
    debt: 0,
    monthlyBurn: 1_500,
    reputation: 8,
    networkStrength: 8,
    eoDeltas: { innovativeness: 3, riskTaking: 2, autonomy: -1 },
  },
  {
    capital: -2_500,
    revenue: 1_000,
    debt: 0,
    monthlyBurn: 1_000,
    reputation: 5,
    networkStrength: 5,
    eoDeltas: { proactiveness: 2, innovativeness: 1, riskTaking: -1 },
  },
  {
    capital: 0,
    revenue: -500,
    debt: 0,
    monthlyBurn: -300,
    reputation: 3,
    networkStrength: 2,
    eoDeltas: { autonomy: 2, innovativeness: -2 },
  },
];

// ── L4-node-2: Capital — Equity investment offer ──────────────────────────

const L4_SK_2: ScenarioSkeleton = {
  id: "L4-node-2",
  layer: 4,
  theme: "financing",
  narrativePattern: "fundraising",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "competitiveAggressiveness"],
  situationSeed:
    "An investor has found your business and is offering GHS 30,000 for a 20% equity stake. They have a portfolio of Accra businesses, relevant connections, and a clear playbook for scaling operations like yours. You have never given up equity before. You have also never had GHS 30,000 available at once.",
  conditions: { reputationMin: 20 },
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + competitive",
      archetypeDescription:
        "Take the full investment. GHS 30,000 is a real competitive advantage. Use it to scale aggressively before your window closes.",
      tensionAxis: "Growth capital vs. ownership dilution",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Counter-propose: GHS 15,000 for 10%. Test the investor relationship at a smaller stake before giving up significant ownership.",
      tensionAxis: "Negotiation integrity vs. deal collapse risk",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline. Equity is permanent. You would rather grow slower and own everything than grow faster and answer to someone.",
      tensionAxis: "Full ownership vs. competitive disadvantage",
    },
  ],
};

const L4_SK_2_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 25_000,
    revenue: 3_000,
    debt: 0,
    monthlyBurn: 2_000,
    reputation: 8,
    networkStrength: 10,
    eoDeltas: { proactiveness: 2, competitiveAggressiveness: 2, autonomy: -3 },
  },
  {
    capital: 12_000,
    revenue: 1_500,
    debt: 0,
    monthlyBurn: 1_000,
    reputation: 6,
    networkStrength: 6,
    eoDeltas: { autonomy: -1, innovativeness: 2, proactiveness: 1 },
  },
  {
    capital: 0,
    revenue: -300,
    debt: 0,
    monthlyBurn: 0,
    reputation: 5,
    networkStrength: 3,
    eoDeltas: { autonomy: 3, competitiveAggressiveness: -2 },
  },
];

// ── L4-node-3: Reputation — Public complaint spreads ─────────────────────

const L4_SK_3: ScenarioSkeleton = {
  id: "L4-node-3",
  layer: 4,
  theme: "competition",
  narrativePattern: "reputation_crisis",
  baseWeight: 1.0,
  eoTargetDimensions: ["proactiveness", "autonomy"],
  situationSeed:
    "A customer complaint has spread through your community — on WhatsApp groups, in conversation, through the informal networks that actually govern your reputation in this market. Some of it is fair. Some of it is exaggerated. But it is circulating, and people are talking.",
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + accountable",
      archetypeDescription:
        "Respond publicly and specifically. Acknowledge what went wrong, explain what you are doing about it, and do it before the story hardens.",
      tensionAxis: "Transparency vs. vulnerability",
    },
    {
      eoPoleSignal: "measured + autonomous",
      archetypeDescription:
        "Contact the affected customer directly and resolve it privately. No public statement — handle it personally and let your actions speak.",
      tensionAxis: "Direct resolution vs. public perception",
    },
    {
      eoPoleSignal: "conservative + risk-averse",
      archetypeDescription:
        "Say nothing and let it pass. Responding amplifies it. Your existing customers know your work.",
      tensionAxis: "Discretion vs. narrative vacuum",
    },
  ],
};

const L4_SK_3_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -500,
    revenue: 800,
    debt: 0,
    monthlyBurn: 200,
    reputation: 8,
    networkStrength: 6,
    eoDeltas: { proactiveness: 3, autonomy: 1 },
  },
  {
    capital: -200,
    revenue: 300,
    debt: 0,
    monthlyBurn: 0,
    reputation: 8,
    networkStrength: 5,
    eoDeltas: { autonomy: 2, proactiveness: 1, competitiveAggressiveness: -1 },
  },
  {
    capital: 0,
    revenue: -400,
    debt: 0,
    monthlyBurn: 0,
    reputation: -8,
    networkStrength: -5,
    eoDeltas: { autonomy: 1, proactiveness: -2 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer4(): void {
  registerSkeleton({ skeleton: L4_SK_1, effects: L4_SK_1_EFFECTS });
  registerSkeleton({ skeleton: L4_SK_2, effects: L4_SK_2_EFFECTS });
  registerSkeleton({ skeleton: L4_SK_3, effects: L4_SK_3_EFFECTS });
}
