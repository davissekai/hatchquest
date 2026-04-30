/**
 * Layer 1 skeletons — 5 EO-valid scenario structures.
 *
 * Each skeleton maps to one of the 5 L1 node classifications produced by the
 * Layer 0 classifier. The situationSeed is abstract — the Narrator AI will
 * contextualise it to the player's specific business.
 */

import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ─── L1 Skeleton 1: Competition pressure (bold + competitive path) ────────────

const L1_SK_1: ScenarioSkeleton = {
  id: "L1-node-1",
  layer: 1,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
  narrativePattern: "supply_chain_stretch",
  situationSeed:
    "It is your third week. A distributor offers a bulk order — but the quantity exceeds your current capacity. Fulfilling it means stretching your capital thin and hiring help you cannot yet afford. Declining means losing the opportunity to someone else.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + competitive",
      archetypeDescription:
        "Take the deal. Stretch your capital, hire temporary help, deliver on the deadline no matter the cost.",
      tensionAxis: "Speed vs. financial stability",
    },
    {
      eoPoleSignal: "measured + innovative",
      archetypeDescription:
        "Negotiate a smaller initial order that fits your current capacity. Prove yourself first, scale later.",
      tensionAxis: "Opportunity vs. risk management",
    },
    {
      eoPoleSignal: "conservative + autonomous",
      archetypeDescription:
        "Decline the bulk order and focus on building your local customer base directly.",
      tensionAxis: "Growth ambition vs. disciplined restraint",
    },
  ],
};

const L1_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -3_000,
    revenue: 2_000,
    debt: 0,
    monthlyBurn: 500,
    reputation: 10,
    networkStrength: 5,
    eoDeltas: { riskTaking: 2, proactiveness: 1, competitiveAggressiveness: 1 },
  },
  {
    capital: -1_000,
    revenue: 800,
    debt: 0,
    monthlyBurn: 100,
    reputation: 5,
    networkStrength: 8,
    eoDeltas: { proactiveness: 1, innovativeness: 1 },
  },
  {
    capital: 0,
    revenue: 300,
    debt: 0,
    monthlyBurn: 0,
    reputation: 3,
    networkStrength: 3,
    eoDeltas: { autonomy: 2, riskTaking: -1 },
  },
];

// ─── L1 Skeleton 2: Opportunity timing (proactive but careful path) ───────────

const L1_SK_2: ScenarioSkeleton = {
  id: "L1-node-2",
  layer: 1,
  theme: "networking",
  narrativePattern: "fundraising",
  baseWeight: 1.0,
  eoTargetDimensions: ["proactiveness", "riskTaking"],
  situationSeed:
    "A well-connected mentor figure at a networking event offers to introduce you to a potential investor. But the meeting is tomorrow, your pitch is not ready, and the investor has a reputation for being unforgiving with unprepared founders.",
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + risk-tolerant",
      archetypeDescription:
        "Take the meeting. Stay up all night preparing. An imperfect pitch in front of the right person beats a perfect pitch to an empty room.",
      tensionAxis: "Seizing opportunity vs. presenting your best self",
    },
    {
      eoPoleSignal: "proactive + measured",
      archetypeDescription:
        "Ask the mentor to delay the introduction by one week. Use the time to refine your pitch and research the investor.",
      tensionAxis: "Preparation vs. momentum",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline the introduction. You do not want to owe favours or depend on someone else's network this early.",
      tensionAxis: "Independence vs. leveraging help",
    },
  ],
};

const L1_SK_2_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    // Rush the meeting — opportunity seized but prep costs and reputational risk
    capital: -400,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: 6,
    networkStrength: 8,
    eoDeltas: { proactiveness: 2, riskTaking: 1 },
  },
  {
    // Delay by a week — better prepared but lose momentum with the mentor
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: 5,
    networkStrength: -3,
    eoDeltas: { proactiveness: 1, innovativeness: 1 },
  },
  {
    // Decline entirely — protect independence at the cost of a missed connection
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: 0,
    networkStrength: -5,
    eoDeltas: { autonomy: 2, proactiveness: -1 },
  },
];

// ─── L1 Skeleton 3: People-first dilemma (people-focused + independent path) ──

const L1_SK_3: ScenarioSkeleton = {
  id: "L1-node-3",
  layer: 1,
  theme: "hiring",
  narrativePattern: "team_dilemma",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "innovativeness"],
  situationSeed:
    "A childhood friend who is struggling asks to join your business. They are loyal and hardworking but have no relevant skills. Bringing them on would slow you down in the short term but builds a team of people you trust. Saying no would protect your runway but damage a relationship.",
  choiceArchetypes: [
    {
      eoPoleSignal: "people-first + collaborative",
      archetypeDescription:
        "Bring them on. Train them yourself. Loyalty and trust are worth more than skills you can teach.",
      tensionAxis: "Relationships vs. efficiency",
    },
    {
      eoPoleSignal: "innovative + autonomous",
      archetypeDescription:
        "Offer them a specific project role with clear boundaries — help where they can, without derailing your core work.",
      tensionAxis: "Compassion vs. business discipline",
    },
    {
      eoPoleSignal: "profit-first + measured",
      archetypeDescription:
        "Be honest with them — you cannot afford to carry someone right now. Offer to revisit when the business is more stable.",
      tensionAxis: "Honesty vs. loyalty",
    },
  ],
};

const L1_SK_3_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -500,
    revenue: 0,
    debt: 0,
    monthlyBurn: 800,
    reputation: 5,
    networkStrength: 6,
    eoDeltas: { autonomy: -1, innovativeness: 1 },
    flags: { mentorAccess: false },
  },
  {
    capital: -200,
    revenue: 0,
    debt: 0,
    monthlyBurn: 300,
    reputation: 3,
    networkStrength: 8,
    eoDeltas: { innovativeness: 2, autonomy: 1 },
  },
  {
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: -2,
    networkStrength: -3,
    eoDeltas: { competitiveAggressiveness: 1, autonomy: 1 },
  },
];

// ─── L1 Skeleton 4: Profit pressure (profit-focused + competitive path) ────────

const L1_SK_4: ScenarioSkeleton = {
  id: "L1-node-4",
  layer: 1,
  theme: "financing",
  narrativePattern: "price_pressure",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "riskTaking"],
  situationSeed:
    "You discover that a competitor is selling a nearly identical product at 40% less. They are cutting corners on quality but customers do not seem to notice. Your price reflects honest work — but the market does not care about honesty when the cheaper option is right there.",
  choiceArchetypes: [
    {
      eoPoleSignal: "competitive + profit-first",
      archetypeDescription:
        "Match their price. Absorb the loss for now — you need market share more than margin at this stage.",
      tensionAxis: "Market share vs. sustainable pricing",
    },
    {
      eoPoleSignal: "innovative + proactive",
      archetypeDescription:
        "Differentiate. Add a visible quality guarantee or a feature the competitor cannot match. Compete on value, not price.",
      tensionAxis: "Innovation vs. market reality",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Hold your price and target a different customer segment that values quality over cost.",
      tensionAxis: "Conviction vs. market signals",
    },
  ],
};

const L1_SK_4_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -1_500,
    revenue: 1_200,
    debt: 0,
    monthlyBurn: 200,
    reputation: -3,
    networkStrength: 5,
    eoDeltas: { competitiveAggressiveness: 2, riskTaking: 1 },
  },
  {
    capital: -800,
    revenue: 500,
    debt: 0,
    monthlyBurn: 100,
    reputation: 8,
    networkStrength: 3,
    eoDeltas: { innovativeness: 2, proactiveness: 1 },
  },
  {
    capital: 0,
    revenue: 200,
    debt: 0,
    monthlyBurn: 0,
    reputation: 5,
    networkStrength: 0,
    eoDeltas: { autonomy: 2, competitiveAggressiveness: -1 },
  },
];

// ─── L1 Skeleton 5: Independence crossroads (autonomous path) ─────────────────

const L1_SK_5: ScenarioSkeleton = {
  id: "L1-node-5",
  layer: 1,
  theme: "operations",
  narrativePattern: "partnership",
  // Physical-workspace partnership — heavily penalised for pure-software/tech
  // and remote-services plays where a shared shop floor is nonsensical.
  sectorAffinities: { tech: 0.3, services: 0.7 },
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "proactiveness"],
  situationSeed:
    "An established business owner in your area offers a partnership: they provide workspace, equipment, and access to their customer base in exchange for 40% of your revenue. It would solve three problems at once — but you would be building inside someone else's house.",
  choiceArchetypes: [
    {
      eoPoleSignal: "collaborative + proactive",
      archetypeDescription:
        "Accept the partnership. The access and resources accelerate your timeline by months. You can renegotiate terms later once you have leverage.",
      tensionAxis: "Speed vs. ownership",
    },
    {
      eoPoleSignal: "autonomous + innovative",
      archetypeDescription:
        "Counter-propose a time-limited arrangement — three months, 20% revenue share, with a clean exit clause. Test the relationship without committing.",
      tensionAxis: "Pragmatism vs. independence",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline. Build slower with full ownership rather than faster with strings attached.",
      tensionAxis: "Control vs. opportunity cost",
    },
  ],
};

const L1_SK_5_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 0,
    revenue: 800,
    debt: 0,
    monthlyBurn: -300,
    reputation: 5,
    networkStrength: 10,
    eoDeltas: { proactiveness: 2, autonomy: -2 },
    flags: { hasPremises: true },
  },
  {
    capital: 0,
    revenue: 400,
    debt: 0,
    monthlyBurn: -100,
    reputation: 3,
    networkStrength: 5,
    eoDeltas: { innovativeness: 1, autonomy: 1 },
    flags: { hasPremises: true },
  },
  {
    capital: -500,
    revenue: 0,
    debt: 0,
    monthlyBurn: 200,
    reputation: 0,
    networkStrength: -2,
    eoDeltas: { autonomy: 3, proactiveness: -1 },
  },
];

// ─── Registration ─────────────────────────────────────────────────────────────

/** Registers all 5 Layer 1 skeletons into the global registry. */
export function registerLayer1(): void {
  registerSkeleton({ skeleton: L1_SK_1, effects: L1_SK_1_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_2, effects: L1_SK_2_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_3, effects: L1_SK_3_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_4, effects: L1_SK_4_EFFECTS });
  registerSkeleton({ skeleton: L1_SK_5, effects: L1_SK_5_EFFECTS });
}
