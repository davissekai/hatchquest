import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L3-node-1: Growth — Second location opportunity ───────────────────────

const L3_SK_1: ScenarioSkeleton = {
  id: "L3-node-1",
  layer: 3,
  theme: "growth",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "proactiveness"],
  situationSeed:
    "Three months in, a second site opportunity has appeared — a small space in a different part of the city at below-market rent. The owner needs an answer in five days. Moving fast means splitting your attention and capital before your first location is stable. Waiting means someone else takes it.",
  conditions: { capitalMin: 4_000 },
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + risk-tolerant",
      archetypeDescription:
        "Take the second site. Move fast, split your focus, and bet that the additional revenue will justify the pressure.",
      tensionAxis: "Growth speed vs. operational stability",
    },
    {
      eoPoleSignal: "measured + innovative",
      archetypeDescription:
        "Negotiate a conditional lease — lower rent with a three-month exit clause. Secure the option without full commitment.",
      tensionAxis: "Securing optionality vs. full commitment",
    },
    {
      eoPoleSignal: "conservative + autonomous",
      archetypeDescription:
        "Pass. Consolidate your first location before opening a second. Grow from a stable base.",
      tensionAxis: "Discipline vs. opportunity cost",
    },
  ],
};

const L3_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -4_000,
    revenue: 2_000,
    debt: 3_000,
    monthlyBurn: 2_000,
    reputation: 10,
    networkStrength: 10,
    eoDeltas: { riskTaking: 2, proactiveness: 2 },
    flags: { hasPremises: true },
  },
  {
    capital: -1_500,
    revenue: 800,
    debt: 1_000,
    monthlyBurn: 800,
    reputation: 5,
    networkStrength: 6,
    eoDeltas: { innovativeness: 1, proactiveness: 1, riskTaking: -1 },
    flags: { hasPremises: true },
  },
  {
    capital: 0,
    revenue: 300,
    debt: 0,
    monthlyBurn: 0,
    reputation: 3,
    networkStrength: 2,
    eoDeltas: { autonomy: 2, proactiveness: -2 },
  },
];

// ── L3-node-2: Crisis — Key person quits suddenly ─────────────────────────

const L3_SK_2: ScenarioSkeleton = {
  id: "L3-node-2",
  layer: 3,
  theme: "crisis",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "innovativeness"],
  situationSeed:
    "The person who runs the most critical part of your operation has handed in an abrupt resignation — one week's notice. No warning. Customers depend on the continuity they provided. You can hire a replacement immediately at a premium, absorb the work yourself temporarily, or use the gap to restructure how that function works entirely.",
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + risk-tolerant",
      archetypeDescription:
        "Hire a replacement immediately, even at a premium. Protect continuity. Customers cannot feel the disruption.",
      tensionAxis: "Continuity vs. cost of urgency",
    },
    {
      eoPoleSignal: "autonomous + resilient",
      archetypeDescription:
        "Absorb the work yourself for four to six weeks while you recruit carefully. Slower, but you do not panic-hire.",
      tensionAxis: "Self-reliance vs. personal bandwidth",
    },
    {
      eoPoleSignal: "innovative + strategic",
      archetypeDescription:
        "Use the gap to restructure. Redistribute the function, update the process, and build something more resilient than what you had before.",
      tensionAxis: "Opportunity in crisis vs. short-term disruption",
    },
  ],
};

const L3_SK_2_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -3_000,
    revenue: 1_000,
    debt: 0,
    monthlyBurn: 2_500,
    reputation: 5,
    networkStrength: 5,
    eoDeltas: { proactiveness: 2, autonomy: -1 },
  },
  {
    capital: 0,
    revenue: -500,
    debt: 0,
    monthlyBurn: 0,
    reputation: 3,
    networkStrength: 3,
    eoDeltas: { autonomy: 2, innovativeness: 1 },
  },
  {
    capital: -1_500,
    revenue: -200,
    debt: 0,
    monthlyBurn: -500,
    reputation: 8,
    networkStrength: 5,
    eoDeltas: { innovativeness: 3, autonomy: 1 },
  },
];

// ── L3-node-3: Market — Original product losing traction ─────────────────

const L3_SK_3: ScenarioSkeleton = {
  id: "L3-node-3",
  layer: 3,
  theme: "market",
  baseWeight: 1.0,
  eoTargetDimensions: ["innovativeness", "competitiveAggressiveness"],
  situationSeed:
    "Your original product is losing traction. Customers are still coming, but orders are smaller and the enthusiasm is gone. Several people have mentioned the same thing: they want something adjacent to what you do — something you have not built yet. The market is sending you a signal.",
  choiceArchetypes: [
    {
      eoPoleSignal: "innovative + bold",
      archetypeDescription:
        "Pivot fully. Stop building what is losing traction and redirect all your energy into what the market is asking for.",
      tensionAxis: "Decisiveness vs. sunk cost",
    },
    {
      eoPoleSignal: "proactive + measured",
      archetypeDescription:
        "Add the new offering alongside the original. Run both for three months and let revenue decide which one survives.",
      tensionAxis: "Hedging vs. operational focus",
    },
    {
      eoPoleSignal: "competitive + autonomous",
      archetypeDescription:
        "Ignore the signal. Double down on your original product, improve it, and compete on execution instead of chasing the market.",
      tensionAxis: "Conviction vs. market reality",
    },
  ],
};

const L3_SK_3_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -2_500,
    revenue: 1_500,
    debt: 0,
    monthlyBurn: 800,
    reputation: 5,
    networkStrength: 5,
    eoDeltas: { innovativeness: 3, proactiveness: 1, autonomy: -1 },
  },
  {
    capital: -1_500,
    revenue: 500,
    debt: 0,
    monthlyBurn: 600,
    reputation: 3,
    networkStrength: 5,
    eoDeltas: { proactiveness: 2, innovativeness: 1, riskTaking: -1 },
  },
  {
    capital: 0,
    revenue: -500,
    debt: 0,
    monthlyBurn: 200,
    reputation: -3,
    networkStrength: 2,
    eoDeltas: { competitiveAggressiveness: 2, innovativeness: -2 },
  },
];

// ── L3-node-4: Partnership — White-label offer from a larger company ──────

const L3_SK_4: ScenarioSkeleton = {
  id: "L3-node-4",
  layer: 3,
  theme: "networking",
  baseWeight: 1.1,
  eoTargetDimensions: ["autonomy", "proactiveness"],
  situationSeed:
    "A larger, established business has noticed your work. They want to white-label your product or service — volume, reliable revenue, their distribution network. In exchange, your brand disappears from the customer relationship entirely. The money is real. The trade-off is also real.",
  conditions: { reputationMin: 15 },
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + collaborative",
      archetypeDescription:
        "Accept the white-label deal. Take the volume, use the revenue to build your own brand in parallel. Your name comes later.",
      tensionAxis: "Cash flow vs. brand building",
    },
    {
      eoPoleSignal: "innovative + autonomous",
      archetypeDescription:
        "Counter-propose a co-branded arrangement. Your brand stays visible, they get the product, and you test the partnership on shared terms.",
      tensionAxis: "Negotiation leverage vs. deal collapse risk",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline. You are building a brand, not a supplier relationship. Your work should carry your name.",
      tensionAxis: "Identity vs. growth capital",
    },
  ],
};

const L3_SK_4_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 5_000,
    revenue: 2_500,
    debt: 0,
    monthlyBurn: 500,
    reputation: -5,
    networkStrength: 15,
    eoDeltas: { proactiveness: 2, autonomy: -3 },
  },
  {
    capital: 2_000,
    revenue: 1_000,
    debt: 0,
    monthlyBurn: 300,
    reputation: 8,
    networkStrength: 10,
    eoDeltas: { innovativeness: 2, autonomy: -1 },
  },
  {
    capital: 0,
    revenue: -200,
    debt: 0,
    monthlyBurn: 0,
    reputation: 5,
    networkStrength: -5,
    eoDeltas: { autonomy: 3, proactiveness: -1 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer3(): void {
  registerSkeleton({ skeleton: L3_SK_1, effects: L3_SK_1_EFFECTS });
  registerSkeleton({ skeleton: L3_SK_2, effects: L3_SK_2_EFFECTS });
  registerSkeleton({ skeleton: L3_SK_3, effects: L3_SK_3_EFFECTS });
  registerSkeleton({ skeleton: L3_SK_4, effects: L3_SK_4_EFFECTS });
}
