import { registerSkeleton } from "./registry.js";
import type { ScenarioSkeleton } from "@hatchquest/shared";
import type { ChoiceEffect } from "../engine/apply-choice.js";

// ── L2-node-1: Financing — Microfinance offer ─────────────────────────────

const L2_SK_1: ScenarioSkeleton = {
  id: "L2-node-1",
  layer: 2,
  theme: "financing",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "proactiveness"],
  narrativePattern: "fundraising",
  situationSeed:
    "A microfinance officer has noticed your operation and is offering a GHS 5,000 loan at 15% annual interest. Six weeks in, your revenue is growing but slowly. The capital could unlock inventory, hire part-time help, or improve your setup — but if growth stalls, the repayments will eat your margin.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + proactive",
      archetypeDescription:
        "Take the full GHS 5,000. Invest immediately in inventory and a part-time hire. Move faster than the market expects and repay from growth.",
      tensionAxis: "Capital leverage vs. debt burden",
    },
    {
      eoPoleSignal: "measured + innovative",
      archetypeDescription:
        "Take GHS 2,000 only. Deploy it on inventory alone, validate the demand, then decide on more capital.",
      tensionAxis: "Caution vs. momentum",
    },
    {
      eoPoleSignal: "conservative + autonomous",
      archetypeDescription:
        "Decline. You will grow only from revenue. No obligations, no interest, full control.",
      tensionAxis: "Independence vs. competitive speed",
    },
  ],
};

const L2_SK_1_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 3_500,
    revenue: 800,
    debt: 5_000,
    monthlyBurn: 700,
    reputation: 3,
    networkStrength: 5,
    eoDeltas: { riskTaking: 2, proactiveness: 1, autonomy: -1 },
  },
  {
    capital: 1_500,
    revenue: 300,
    debt: 2_000,
    monthlyBurn: 200,
    reputation: 2,
    networkStrength: 2,
    eoDeltas: { innovativeness: 1, riskTaking: -1 },
  },
  {
    capital: 0,
    revenue: -200,
    debt: 0,
    monthlyBurn: 0,
    reputation: -3,
    networkStrength: -2,
    eoDeltas: { autonomy: 3, riskTaking: -2 },
  },
];

// ── L2-node-2: Competition — Better-funded rival enters ───────────────────

const L2_SK_2: ScenarioSkeleton = {
  id: "L2-node-2",
  layer: 2,
  theme: "competition",
  narrativePattern: "competition_entry",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "innovativeness"],
  situationSeed:
    "A better-funded competitor has just entered your area. They have slicker branding, lower prices, and backing you do not have. Your customers are noticing. You have six weeks of relationships and local knowledge they are still building — but that window will not stay open.",
  choiceArchetypes: [
    {
      eoPoleSignal: "competitive + aggressive",
      archetypeDescription:
        "Match their price. Compress your margin, capture the market share comparison, and outlast them on customer relationships.",
      tensionAxis: "Market share vs. sustainable margin",
    },
    {
      eoPoleSignal: "innovative + proactive",
      archetypeDescription:
        "Do not compete on price. Build something they cannot copy quickly — specialisation, reliability, or a service layer that transforms what you offer.",
      tensionAxis: "Differentiation vs. immediate pressure",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Ignore them. Double down on your existing customers. Not every competitor deserves a reaction.",
      tensionAxis: "Focus vs. competitive blindness",
    },
  ],
};

const L2_SK_2_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -1_500,
    revenue: 1_200,
    debt: 0,
    monthlyBurn: 300,
    reputation: -2,
    networkStrength: 3,
    eoDeltas: { competitiveAggressiveness: 2, innovativeness: -1 },
  },
  {
    capital: -1_000,
    revenue: 800,
    debt: 0,
    monthlyBurn: 200,
    reputation: 8,
    networkStrength: 5,
    eoDeltas: { innovativeness: 2, proactiveness: 1 },
  },
  {
    capital: 0,
    revenue: -300,
    debt: 0,
    monthlyBurn: 0,
    reputation: 2,
    networkStrength: 0,
    eoDeltas: { autonomy: 2, competitiveAggressiveness: -1 },
  },
];

// ── L2-node-3: Operations — Dumsor power crisis ───────────────────────────

const L2_SK_3: ScenarioSkeleton = {
  id: "L2-node-3",
  layer: 2,
  theme: "operations",
  narrativePattern: "infrastructure_shock",
  // Dumsor / generator framing — assumes on-premises operations.
  // Pure-software businesses mostly live in the cloud, so down-weight.
  sectorAffinities: { tech: 0.5 },
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "riskTaking"],
  situationSeed:
    "Dumsor has been erratic for two straight weeks and your operation is taking the hit. You have three options: buy a generator on credit to end the problem permanently, rent access to a neighbour's setup for a weekly fee, or redesign your process to work around the outages entirely.",
  choiceArchetypes: [
    {
      eoPoleSignal: "risk-tolerant + autonomous",
      archetypeDescription:
        "Buy a generator on credit. End the problem permanently. You own the solution.",
      tensionAxis: "Operational independence vs. capital risk",
    },
    {
      eoPoleSignal: "collaborative + measured",
      archetypeDescription:
        "Rent space on a neighbour's generator. Cheaper, faster, but you depend on them every time the lights go out.",
      tensionAxis: "Cost savings vs. dependency",
    },
    {
      eoPoleSignal: "innovative + conservative",
      archetypeDescription:
        "Redesign your operation to not require continuous power. Harder upfront, more resilient long-term.",
      tensionAxis: "Structural resilience vs. short-term pain",
    },
  ],
};

const L2_SK_3_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -2_500,
    revenue: 500,
    debt: 2_000,
    monthlyBurn: 150,
    reputation: 5,
    networkStrength: 2,
    eoDeltas: { autonomy: 2, riskTaking: 1 },
    flags: { hasBackupPower: true },
  },
  {
    capital: -500,
    revenue: 200,
    debt: 0,
    monthlyBurn: 400,
    reputation: 2,
    networkStrength: 5,
    eoDeltas: { autonomy: -1, innovativeness: 1 },
  },
  {
    capital: -800,
    revenue: -200,
    debt: 0,
    monthlyBurn: -200,
    reputation: 3,
    networkStrength: 2,
    eoDeltas: { innovativeness: 2, autonomy: 1 },
  },
];

// ── L2-node-4: Networking — Mentor offer ──────────────────────────────────

const L2_SK_4: ScenarioSkeleton = {
  id: "L2-node-4",
  layer: 2,
  theme: "networking",
  narrativePattern: "mentorship",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "proactiveness"],
  situationSeed:
    "A respected entrepreneur in your sector has taken notice of your work and offered monthly one-on-one mentorship. It is a genuine opportunity — access, connections, hard-earned wisdom. But they have a strong point of view on how businesses like yours should be built, and they will push you toward it.",
  choiceArchetypes: [
    {
      eoPoleSignal: "collaborative + proactive",
      archetypeDescription:
        "Accept fully. Show up every month, implement their guidance, leverage their network. Let their experience compress your timeline.",
      tensionAxis: "Speed via leverage vs. direction ownership",
    },
    {
      eoPoleSignal: "autonomous + measured",
      archetypeDescription:
        "Accept selectively. Take the meetings, use what fits, quietly discard what does not. Their network, your direction.",
      tensionAxis: "Independence vs. relationship authenticity",
    },
    {
      eoPoleSignal: "autonomous + conservative",
      archetypeDescription:
        "Decline politely. You did not come this far to build someone else's version of your business.",
      tensionAxis: "Full independence vs. missed leverage",
    },
  ],
};

const L2_SK_4_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: 0,
    revenue: 400,
    debt: 0,
    monthlyBurn: 200,
    reputation: 7,
    networkStrength: 10,
    eoDeltas: { proactiveness: 2, autonomy: -2 },
    flags: { mentorAccess: true },
  },
  {
    capital: 0,
    revenue: 200,
    debt: 0,
    monthlyBurn: 100,
    reputation: 6,
    networkStrength: 6,
    eoDeltas: { autonomy: 1, proactiveness: 1, innovativeness: -1 },
    flags: { mentorAccess: true },
  },
  {
    capital: 0,
    revenue: 0,
    debt: 0,
    monthlyBurn: 0,
    reputation: -3,
    networkStrength: -5,
    eoDeltas: { autonomy: 3, proactiveness: -1 },
  },
];

// ── L2-node-5: Hiring — First real employee ───────────────────────────────

const L2_SK_5: ScenarioSkeleton = {
  id: "L2-node-5",
  layer: 2,
  theme: "hiring",
  narrativePattern: "hiring",
  baseWeight: 1.0,
  eoTargetDimensions: ["innovativeness", "proactiveness"],
  situationSeed:
    "You have grown to the point where you cannot do everything alone and maintain quality. Three paths: hire a skilled professional at GHS 2,500 per month who delivers immediately, hire a willing but unskilled person at GHS 1,200 who you develop over time, or stay lean with on-demand freelancers and no fixed payroll.",
  choiceArchetypes: [
    {
      eoPoleSignal: "proactive + risk-tolerant",
      archetypeDescription:
        "Hire the skilled professional. Pay the premium, get the quality, move faster. The cost is real but so is the gap.",
      tensionAxis: "Immediate capability vs. monthly pressure",
    },
    {
      eoPoleSignal: "innovative + people-first",
      archetypeDescription:
        "Hire the trainable person. Invest the time, build loyalty, shape someone who understands your business from the ground up.",
      tensionAxis: "Short-term capacity vs. long-term team",
    },
    {
      eoPoleSignal: "measured + autonomous",
      archetypeDescription:
        "Use freelancers only. Pay per project, keep overheads low, retain flexibility. No permanent commitment yet.",
      tensionAxis: "Agility vs. team cohesion",
    },
  ],
};

const L2_SK_5_EFFECTS: [ChoiceEffect, ChoiceEffect, ChoiceEffect] = [
  {
    capital: -2_500,
    revenue: 1_500,
    debt: 0,
    monthlyBurn: 2_500,
    reputation: 8,
    networkStrength: 5,
    eoDeltas: { proactiveness: 2, riskTaking: 1 },
  },
  {
    capital: -500,
    revenue: 500,
    debt: 0,
    monthlyBurn: 1_200,
    reputation: 5,
    networkStrength: 8,
    eoDeltas: { innovativeness: 2, autonomy: -1 },
  },
  {
    capital: 0,
    revenue: 200,
    debt: 0,
    monthlyBurn: 400,
    reputation: 2,
    networkStrength: 3,
    eoDeltas: { autonomy: 2, innovativeness: -1 },
  },
];

// ── Registration ──────────────────────────────────────────────────────────

export function registerLayer2(): void {
  registerSkeleton({ skeleton: L2_SK_1, effects: L2_SK_1_EFFECTS });
  registerSkeleton({ skeleton: L2_SK_2, effects: L2_SK_2_EFFECTS });
  registerSkeleton({ skeleton: L2_SK_3, effects: L2_SK_3_EFFECTS });
  registerSkeleton({ skeleton: L2_SK_4, effects: L2_SK_4_EFFECTS });
  registerSkeleton({ skeleton: L2_SK_5, effects: L2_SK_5_EFFECTS });
}
