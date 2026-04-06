import type { ScenarioNode, Choice, EODimension } from "@hatchquest/shared";
import type { ChoiceEffect } from "./engine/apply-choice.js";

// Thematic categories — used by the Director AI to match scenarios to world state signals.
export type NodeTheme =
  | "financing"
  | "competition"
  | "hiring"
  | "branding"
  | "operations"
  | "networking"
  | "crisis"
  | "general";

// Hard eligibility gates — all defined conditions must pass for a node to be eligible.
export interface NodeConditions {
  capitalMin?: number;
  capitalMax?: number;
  reputationMin?: number;
  reputationMax?: number;
  debtMin?: number;
  debtMax?: number;
  requiresMentorAccess?: boolean;
  requiresPremises?: boolean;
  employeeCountMin?: number;
}

// Full scenario node including server-side choice effects and Director AI metadata.
export interface ScenarioNodeFull {
  id: string;
  layer: number;
  narrative: string;
  choices: Choice[];
  // Parallel array: effects[i] maps to choices[i]
  effects: [ChoiceEffect, ChoiceEffect, ChoiceEffect];
  // Director AI metadata
  theme: NodeTheme;
  baseWeight: number;
  eoTargetDimensions: EODimension[];
  conditions?: NodeConditions;
}

// Converts a full node to the client-safe ScenarioNode shape.
export function toClientNode(full: ScenarioNodeFull): ScenarioNode {
  return {
    id: full.id,
    layer: full.layer,
    narrative: full.narrative,
    choices: full.choices,
  };
}

// --- Layer 1–2 node data (hand-crafted for demo) ---
// Each L1 node maps to one of the 5 EO pole-distribution combinations from Layer 0 classification.
// Director AI selects from this pool each turn using theme + EO affinity scoring.

const ZERO_EFFECT: ChoiceEffect = {
  capital: 0,
  revenue: 0,
  debt: 0,
  monthlyBurn: 0,
  reputation: 0,
  networkStrength: 0,
  eoDeltas: {},
};

/** Layer 1 node: risk-tolerant / proactive player path */
const L1_NODE_1: ScenarioNodeFull = {
  id: "L1-node-1",
  layer: 1,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "competitiveAggressiveness"],
  narrative:
    "It is your third week in business. A distributor in Kumasi offers to stock your product — but only if you can guarantee 500 units by month-end. You have the raw materials but no extra cash for overtime labour. What do you do?",
  choices: [
    {
      index: 0,
      text: "Take the deal. Hire two casual workers immediately and stretch your capital.",
      tensionHint: "Speed vs. financial stability",
    },
    {
      index: 1,
      text: "Negotiate a smaller initial order — 200 units — to stay within your current capacity.",
      tensionHint: "Opportunity vs. risk management",
    },
    {
      index: 2,
      text: "Decline and focus on building a local customer base first.",
      tensionHint: "Growth ambition vs. disciplined restraint",
    },
  ],
  effects: [
    {
      // Choice 0: high-risk, proactive, competitive
      capital: -3_000,
      revenue: 2_000,
      debt: 0,
      monthlyBurn: 500,
      reputation: 10,
      networkStrength: 5,
      eoDeltas: { riskTaking: 2, proactiveness: 1, competitiveAggressiveness: 1 },
    },
    {
      // Choice 1: balanced, moderately proactive
      capital: -1_000,
      revenue: 800,
      debt: 0,
      monthlyBurn: 100,
      reputation: 5,
      networkStrength: 8,
      eoDeltas: { proactiveness: 1, innovativeness: 1 },
    },
    {
      // Choice 2: conservative, autonomy-focused
      capital: 0,
      revenue: 300,
      debt: 0,
      monthlyBurn: 0,
      reputation: 3,
      networkStrength: 3,
      eoDeltas: { autonomy: 2, riskTaking: -1 },
    },
  ],
};

/** Layer 1 node: risk-averse / reactive player path */
const L1_NODE_2: ScenarioNodeFull = {
  id: "L1-node-2",
  layer: 1,
  theme: "branding",
  baseWeight: 1.0,
  eoTargetDimensions: ["proactiveness", "innovativeness"],
  narrative:
    "A popular blogger in your space wants to feature your product in exchange for 10 free units. It is free marketing, but 10 units is a week of your current output. What do you do?",
  choices: [
    {
      index: 0,
      text: "Send the units immediately — exposure is worth more than short-term stock.",
      tensionHint: "Brand investment vs. production cost",
    },
    {
      index: 1,
      text: "Counter-offer: 3 units and a discount code for their audience.",
      tensionHint: "Relationship-building vs. resource protection",
    },
    {
      index: 2,
      text: "Decline — you cannot afford to give inventory away at this stage.",
      tensionHint: "Survival discipline vs. growth opportunity",
    },
  ],
  effects: [
    {
      capital: -500,
      revenue: 1_200,
      debt: 0,
      monthlyBurn: 0,
      reputation: 15,
      networkStrength: 10,
      eoDeltas: { innovativeness: 1, proactiveness: 2 },
    },
    {
      capital: -150,
      revenue: 400,
      debt: 0,
      monthlyBurn: 0,
      reputation: 8,
      networkStrength: 6,
      eoDeltas: { autonomy: 1, competitiveAggressiveness: 1 },
    },
    {
      capital: 0,
      revenue: 0,
      debt: 0,
      monthlyBurn: 0,
      reputation: -2,
      networkStrength: -1,
      eoDeltas: { riskTaking: -1, autonomy: 1 },
    },
  ],
};

/** Layer 1 node: people-first / collaborative player path */
const L1_NODE_3: ScenarioNodeFull = {
  id: "L1-node-3",
  layer: 1,
  theme: "hiring",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "competitiveAggressiveness"],
  narrative:
    "Your first employee — a childhood friend — is underperforming. Sales targets are being missed. Another applicant with no personal connection but strong references is available. What do you do?",
  choices: [
    {
      index: 0,
      text: "Give your friend a structured 30-day improvement plan. Loyalty must be earned both ways.",
      tensionHint: "People investment vs. performance urgency",
    },
    {
      index: 1,
      text: "Replace them now. The business cannot absorb soft performance at this stage.",
      tensionHint: "Competitive ruthlessness vs. relational capital",
    },
    {
      index: 2,
      text: "Reassign your friend to a role they are better suited for and hire the applicant.",
      tensionHint: "Creative problem-solving vs. decisive action",
    },
  ],
  effects: [
    {
      capital: 0,
      revenue: -200,
      debt: 0,
      monthlyBurn: 0,
      reputation: 5,
      networkStrength: 8,
      eoDeltas: { autonomy: 1, innovativeness: 1 },
    },
    {
      capital: 0,
      revenue: 500,
      debt: 0,
      monthlyBurn: 100,
      reputation: -5,
      networkStrength: -3,
      eoDeltas: { competitiveAggressiveness: 2, riskTaking: 1 },
    },
    {
      capital: -200,
      revenue: 300,
      debt: 0,
      monthlyBurn: 150,
      reputation: 3,
      networkStrength: 4,
      eoDeltas: { innovativeness: 2, proactiveness: 1 },
    },
  ],
};

/** Layer 1 node: profit-first / aggressive player path */
const L1_NODE_4: ScenarioNodeFull = {
  id: "L1-node-4",
  layer: 1,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "innovativeness"],
  narrative:
    "A competitor in your market is pricing 15% below your cost of goods. You suspect they are running at a loss to capture market share. How do you respond?",
  choices: [
    {
      index: 0,
      text: "Match their price temporarily. Absorb the loss and outlast them.",
      tensionHint: "Market dominance vs. financial health",
    },
    {
      index: 1,
      text: "Hold your price and double down on quality messaging.",
      tensionHint: "Positioning discipline vs. competitive pressure",
    },
    {
      index: 2,
      text: "Pivot to a premium segment where they cannot follow.",
      tensionHint: "Adaptive strategy vs. staying the course",
    },
  ],
  effects: [
    {
      capital: -2_000,
      revenue: 1_500,
      debt: 1_000,
      monthlyBurn: 200,
      reputation: 5,
      networkStrength: 2,
      eoDeltas: { competitiveAggressiveness: 3, riskTaking: 2 },
    },
    {
      capital: 0,
      revenue: 200,
      debt: 0,
      monthlyBurn: 0,
      reputation: 10,
      networkStrength: 3,
      eoDeltas: { autonomy: 1, proactiveness: 1 },
    },
    {
      capital: -500,
      revenue: 800,
      debt: 0,
      monthlyBurn: 100,
      reputation: 8,
      networkStrength: 5,
      eoDeltas: { innovativeness: 3, proactiveness: 2 },
    },
  ],
};

/** Layer 1 node: mixed / autonomous player path */
const L1_NODE_5: ScenarioNodeFull = {
  id: "L1-node-5",
  layer: 1,
  theme: "branding",
  baseWeight: 1.0,
  eoTargetDimensions: ["innovativeness", "autonomy"],
  narrative:
    "Your product works but the packaging looks cheap compared to rivals. A designer quotes GHS 4,000 for a rebrand. You have the capital but it would cut your runway by two months. What do you do?",
  choices: [
    {
      index: 0,
      text: "Commission the full rebrand. First impressions compound.",
      tensionHint: "Brand investment vs. runway preservation",
    },
    {
      index: 1,
      text: "DIY a minimal upgrade using free tools and your own eye.",
      tensionHint: "Resourcefulness vs. professional quality",
    },
    {
      index: 2,
      text: "Ignore packaging for now — prove the product first.",
      tensionHint: "Execution focus vs. market positioning",
    },
  ],
  effects: [
    {
      capital: -4_000,
      revenue: 600,
      debt: 0,
      monthlyBurn: 0,
      reputation: 12,
      networkStrength: 4,
      eoDeltas: { innovativeness: 2, proactiveness: 1 },
    },
    {
      capital: -200,
      revenue: 300,
      debt: 0,
      monthlyBurn: 0,
      reputation: 5,
      networkStrength: 2,
      eoDeltas: { autonomy: 2, innovativeness: 1 },
    },
    {
      capital: 0,
      revenue: 100,
      debt: 0,
      monthlyBurn: 0,
      reputation: 1,
      networkStrength: 1,
      eoDeltas: { riskTaking: -1, autonomy: 1 },
    },
  ],
};

/** Layer 2 stub node — used by the Director AI until the full pool exists */
const L2_NODE_1: ScenarioNodeFull = {
  id: "L2-node-1",
  layer: 2,
  theme: "financing",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "autonomy"],
  narrative:
    "Three months in. A GEA advisor offers to connect you to a low-interest GEA loan — GHS 20,000 at 12% — but the paperwork is heavy and approval takes 6 weeks. Meanwhile, your cousin offers the same amount informally, interest-free, repayable 'when you can.' What do you do?",
  choices: [
    {
      index: 0,
      text: "Take the GEA loan. Formal financing builds credit history.",
      tensionHint: "Long-term positioning vs. short-term cost",
    },
    {
      index: 1,
      text: "Take the informal loan. Speed matters more than formality right now.",
      tensionHint: "Speed vs. relationship risk",
    },
    {
      index: 2,
      text: "Decline both and bootstrap through this quarter.",
      tensionHint: "Independence vs. growth capital",
    },
  ],
  effects: [
    {
      capital: 20_000,
      revenue: 0,
      debt: 20_000,
      monthlyBurn: 300,
      reputation: 8,
      networkStrength: 10,
      eoDeltas: { proactiveness: 1, autonomy: -1 },
      flags: { mentorAccess: true },
    },
    {
      capital: 20_000,
      revenue: 0,
      debt: 20_000,
      monthlyBurn: 0,
      reputation: 2,
      networkStrength: 5,
      eoDeltas: { riskTaking: 1, autonomy: 1 },
    },
    {
      capital: 0,
      revenue: 200,
      debt: 0,
      monthlyBurn: 0,
      reputation: 3,
      networkStrength: 1,
      eoDeltas: { autonomy: 2, riskTaking: -1 },
    },
  ],
};


// --- Layer 2: Early challenges (continued) ---

/** L2-node-2: Competition — A rival opens in Madina selling a near-identical product */
const L2_NODE_2: ScenarioNodeFull = {
  id: "L2-node-2",
  layer: 2,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "proactiveness"],
  narrative:
    "It is month five. A new stall has opened in Madina market selling something almost identical to yours — and they dropped their prices by 30 percent. Your customers start drifting across. What do you do?",
  choices: [
    {
      index: 0,
      text: "Drop your prices to match them. Start a price war — whoever runs out of capital first loses.",
      tensionHint: "Market dominance vs. financial survival",
    },
    {
      index: 1,
      text: "Differentiate — reposition your product with better quality messaging and target a slightly different customer segment.",
      tensionHint: "Positioning shift vs. direct confrontation",
    },
    {
      index: 2,
      text: "Hold your prices steady and invest in a MoMo loyalty discount for repeat customers.",
      tensionHint: "Relationship retention vs. competitive response",
    },
  ],
  effects: [
    {
      capital: -2_000,
      revenue: 1_500,
      debt: 0,
      monthlyBurn: 200,
      reputation: 3,
      networkStrength: 0,
      eoDeltas: { competitiveAggressiveness: 3, riskTaking: 2 },
    },
    {
      capital: -1_000,
      revenue: 800,
      debt: 0,
      monthlyBurn: 100,
      reputation: 8,
      networkStrength: 4,
      eoDeltas: { innovativeness: 2, proactiveness: 1 },
    },
    {
      capital: -300,
      revenue: 500,
      debt: 0,
      monthlyBurn: 100,
      reputation: 6,
      networkStrength: 8,
      eoDeltas: { proactiveness: 1, innovativeness: 0 },
    },
  ],
};

/** L2-node-3: Operations — Extended dumsor is paralyzing your ability to deliver */
const L2_NODE_3: ScenarioNodeFull = {
  id: "L2-node-3",
  layer: 2,
  theme: "operations",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "innovativeness"],
  narrative:
    "The latest dumsor cycle has been going for ten days straight. You cannot fulfill orders to two key clients because your equipment needs constant power. Both clients are asking for updates. What do you do?",
  choices: [
    {
      index: 0,
      text: "Buy a GHS 5,000 generator. It is a heavy capital hit but it solves the problem permanently.",
      tensionHint: "Heavy investment vs. operational paralysis",
    },
    {
      index: 1,
      text: "Rent workspace for the next month at a co-working hub with backup power — cheaper upfront, less flexibility.",
      tensionHint: "Adaptive workaround vs. infrastructure ownership",
    },
    {
      index: 2,
      text: "Tell clients you need an extra week, shift to manual processes where possible, and absorb the delay.",
      tensionHint: "Relationship honesty vs. operational cost",
    },
  ],
  effects: [
    {
      capital: -5_000,
      revenue: 1_000,
      debt: 0,
      monthlyBurn: 300,
      reputation: 10,
      networkStrength: 2,
      eoDeltas: { riskTaking: 3 },
      flags: { hasBackupPower: true },
    },
    {
      capital: -2_000,
      revenue: 800,
      debt: 0,
      monthlyBurn: 400,
      reputation: 6,
      networkStrength: 5,
      eoDeltas: { innovativeness: 3, proactiveness: 1 },
    },
    {
      capital: 0,
      revenue: -300,
      debt: 0,
      monthlyBurn: 0,
      reputation: -5,
      networkStrength: -3,
      eoDeltas: { autonomy: 1, riskTaking: -2 },
    },
  ],
};

/** L2-node-4: Networking — An invitation to a major startup event in Kumasi */
const L2_NODE_4: ScenarioNodeFull = {
  id: "L2-node-4",
  layer: 2,
  theme: "networking",
  baseWeight: 1.0,
  eoTargetDimensions: ["proactiveness", "autonomy"],
  narrative:
    "The Ghana Innovation Summit in Kumasi is happening in two weeks. The ticket costs GHS 1,200, plus transport and accommodation — GHS 3,000 all in. You have heard that investors and potential partners will be there. What do you do?",
  choices: [
    {
      index: 0,
      text: "Pay for the ticket and travel. This is your moment to pitch and connect.",
      tensionHint: "Strategic networking vs. capital deployment",
    },
    {
      index: 1,
      text: "Find someone already going — a peer, a BAC contact — and attend with them to share costs.",
      tensionHint: "Resource pooling vs. independent presence",
    },
    {
      index: 2,
      text: "Skip it. You will focus that capital and time on closing deals with the clients you already have.",
      tensionHint: "Immediate traction vs. long-term connections",
    },
  ],
  effects: [
    {
      capital: -3_000,
      revenue: 500,
      debt: 0,
      monthlyBurn: 0,
      reputation: 10,
      networkStrength: 15,
      eoDeltas: { proactiveness: 3, riskTaking: 1 },
    },
    {
      capital: -1_500,
      revenue: 300,
      debt: 0,
      monthlyBurn: 0,
      reputation: 5,
      networkStrength: 10,
      eoDeltas: { proactiveness: 1, innovativeness: 1 },
    },
    {
      capital: -200,
      revenue: 800,
      debt: 0,
      monthlyBurn: 0,
      reputation: 1,
      networkStrength: -2,
      eoDeltas: { autonomy: 2, riskTaking: -1 },
    },
  ],
};

/** L2-node-5: Hiring — A talented person wants equity, not salary */
const L2_NODE_5: ScenarioNodeFull = {
  id: "L2-node-5",
  layer: 2,
  theme: "hiring",
  baseWeight: 1.0,
  eoTargetDimensions: ["autonomy", "competitiveAggressiveness"],
  narrative:
    "A sharp operations manager from a competitor wants to join you. She has the skills and market knowledge you need — but she will not work for salary alone. She wants 15 percent equity and a seat at the table on every major call. What do you do?",
  choices: [
    {
      index: 0,
      text: "Give her the 15 percent. You need her skills more than you need full control.",
      tensionHint: "Shared power vs. operational capability",
    },
    {
      index: 1,
      text: "Counter with 5 percent equity and tie the remaining 10 percent to hitting milestones in her first year.",
      tensionHint: "Performance accountability vs. full buy-in",
    },
    {
      index: 2,
      text: "Decline. You will hire someone less seasoned and build your own team your own way.",
      tensionHint: "Complete autonomy vs. proven expertise",
    },
  ],
  effects: [
    {
      capital: 0,
      revenue: 1_500,
      debt: 0,
      monthlyBurn: 400,
      reputation: 5,
      networkStrength: 10,
      eoDeltas: { proactiveness: 1, innovativeness: 1 },
    },
    {
      capital: 0,
      revenue: 800,
      debt: 0,
      monthlyBurn: 300,
      reputation: 3,
      networkStrength: 5,
      eoDeltas: { innovativeness: 2, proactiveness: 1 },
    },
    {
      capital: 0,
      revenue: 300,
      debt: 0,
      monthlyBurn: 200,
      reputation: 0,
      networkStrength: -2,
      eoDeltas: { autonomy: 3, riskTaking: 1 },
    },
  ],
};

// --- Layer 3: Growth decisions ---

/** L3-node-1: Financing — Scale up with GEA debt or grow organically */
const L3_NODE_1: ScenarioNodeFull = {
  id: "L3-node-1",
  layer: 3,
  theme: "financing",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "proactiveness"],
  narrative:
    "Your revenue is climbing. A GEA advisor offers to fast-track you for a GHS 40,000 loan at 12 percent. It would fund your expansion into two new markets — but the monthly repayment would be GHS 4,000 for twelve months. You could also stay small, grow slowly, and take no debt at all. What do you do?",
  choices: [
    {
      index: 0,
      text: "Take the full GHS 40,000. Two new markets means two new revenue streams — the math works.",
      tensionHint: "Aggressive expansion vs. debt burden",
    },
    {
      index: 1,
      text: "Take half — GHS 20,000 — and expand into one new market first. Prove it works before going further.",
      tensionHint: "Measured growth vs. opportunity cost",
    },
    {
      index: 2,
      text: "Decline the loan. You will reinvest from your own revenue and grow at your own pace.",
      tensionHint: "Financial independence vs. growth speed",
    },
  ],
  effects: [
    {
      capital: 40_000,
      revenue: 3_000,
      debt: 40_000,
      monthlyBurn: 1_200,
      reputation: 10,
      networkStrength: 12,
      eoDeltas: { riskTaking: 3, proactiveness: 2 },
    },
    {
      capital: 20_000,
      revenue: 1_500,
      debt: 20_000,
      monthlyBurn: 600,
      reputation: 6,
      networkStrength: 8,
      eoDeltas: { proactiveness: 1, innovativeness: 1 },
    },
    {
      capital: 0,
      revenue: 800,
      debt: 0,
      monthlyBurn: 0,
      reputation: 4,
      networkStrength: 2,
      eoDeltas: { autonomy: 2, riskTaking: -1 },
    },
  ],
};

/** L3-node-2: Competition — A larger player enters your space */
const L3_NODE_2: ScenarioNodeFull = {
  id: "L3-node-2",
  layer: 3,
  theme: "competition",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "innovativeness"],
  conditions: { reputationMin: 15 },
  narrative:
    "A well-funded startup from Accra has entered your market. They have better branding, faster delivery, and a war chest that could last a year. They are targeting your exact customer base with introductory pricing. How do you respond?",
  choices: [
    {
      index: 0,
      text: "Go on the offensive — launch a counter-campaign highlighting your local knowledge and personalised service. Attack directly.",
      tensionHint: "Direct combat vs. resource disadvantage",
    },
    {
      index: 1,
      text: "Differentiate hard — launch a product extension they cannot easily copy, something hyper-local they would not understand.",
      tensionHint: "Creative differentiation vs. head-on clash",
    },
    {
      index: 2,
      text: "Reach out to them for a partnership conversation. If you cannot beat them, integrate with them.",
      tensionHint: "Collaborative pragmatism vs. competitive pride",
    },
  ],
  effects: [
    {
      capital: -3_000,
      revenue: 2_000,
      debt: 5_000,
      monthlyBurn: 800,
      reputation: 12,
      networkStrength: 5,
      eoDeltas: { competitiveAggressiveness: 3, riskTaking: 1 },
    },
    {
      capital: -4_000,
      revenue: 3_500,
      debt: 0,
      monthlyBurn: 600,
      reputation: 15,
      networkStrength: 8,
      eoDeltas: { innovativeness: 3, proactiveness: 2 },
    },
    {
      capital: 0,
      revenue: 1_000,
      debt: 0,
      monthlyBurn: 0,
      reputation: 8,
      networkStrength: 18,
      eoDeltas: { proactiveness: 2, autonomy: 0 },
    },
  ],
};

/** L3-node-3: Crisis — A key client defaults on a large payment */
const L3_NODE_3: ScenarioNodeFull = {
  id: "L3-node-3",
  layer: 3,
  theme: "crisis",
  baseWeight: 1.0,
  eoTargetDimensions: ["riskTaking", "autonomy"],
  conditions: { capitalMax: 15_000 },
  narrative:
    "Your biggest client — the one that made up 40 percent of your monthly revenue — has not paid their GHS 8,000 invoice for two months now. You have chased them and gotten only promises. Your own supplier payments are due this week. What do you do?",
  choices: [
    {
      index: 0,
      text: "Escalate publicly — post about it on social media, tag them, apply public pressure. It will burn the relationship but it might force payment.",
      tensionHint: "Nuclear option vs. relationship burning",
    },
    {
      index: 1,
      text: "Take a short-term bridging loan of GHS 10,000 from a susu group to cover suppliers, and wait out the client payment.",
      tensionHint: "Borrowed stability vs. patience",
    },
    {
      index: 2,
      text: "Accept the loss, write it off, and urgently replace that revenue by acquiring two smaller clients who pay on time.",
      tensionHint: "Pivoting vs. pursuing the debt",
    },
  ],
  effects: [
    {
      capital: 2_000,
      revenue: -500,
      debt: 0,
      monthlyBurn: 0,
      reputation: -15,
      networkStrength: -12,
      eoDeltas: { competitiveAggressiveness: 3, riskTaking: 2 },
    },
    {
      capital: 10_000,
      revenue: -800,
      debt: 10_000,
      monthlyBurn: 400,
      reputation: 3,
      networkStrength: 8,
      eoDeltas: { proactiveness: 1, innovativeness: 1 },
      flags: { susuMember: true },
    },
    {
      capital: 0,
      revenue: 2_000,
      debt: 0,
      monthlyBurn: -200,
      reputation: 5,
      networkStrength: 10,
      eoDeltas: { autonomy: 2, proactiveness: 1 },
    },
  ],
};

/** L3-node-4: Branding — A new customer segment opens up */
const L3_NODE_4: ScenarioNodeFull = {
  id: "L3-node-4",
  layer: 3,
  theme: "branding",
  baseWeight: 1.0,
  eoTargetDimensions: ["innovativeness", "proactiveness"],
  conditions: { reputationMin: 20 },
  narrative:
    "Your customer base is shifting — young professionals and corporate buyers are showing interest, but your current brand feels too informal for them. You have built trust with your existing market, but this new segment could triple your revenue. What do you do?",
  choices: [
    {
      index: 0,
      text: "Full rebrand — new identity, new positioning, built for this professional market. Leave your old image behind.",
      tensionHint: "Bold repositioning vs. alienating existing customers",
    },
    {
      index: 1,
      text: "Launch a sub-brand — keep your current identity for existing customers and create a separate premium line for the new market.",
      tensionHint: "Audience expansion vs. brand dilution",
    },
    {
      index: 2,
      text: "Stay the course. Your current brand is what got you here — chase quality improvements, not repositioning.",
      tensionHint: "Focus discipline vs. market expansion",
    },
  ],
  effects: [
    {
      capital: -5_000,
      revenue: 3_000,
      debt: 0,
      monthlyBurn: 400,
      reputation: 20,
      networkStrength: 10,
      eoDeltas: { innovativeness: 3, riskTaking: 2 },
    },
    {
      capital: -2_500,
      revenue: 2_000,
      debt: 0,
      monthlyBurn: 300,
      reputation: 12,
      networkStrength: 8,
      eoDeltas: { innovativeness: 2, proactiveness: 1 },
    },
    {
      capital: 0,
      revenue: 800,
      debt: 0,
      monthlyBurn: 0,
      reputation: 5,
      networkStrength: 3,
      eoDeltas: { autonomy: 1, riskTaking: -1 },
    },
  ],
};

// --- Layer 4: Strategic inflection ---

/** L4-node-1: Operations — Scaling commitment: rent premises or hire */
const L4_NODE_1: ScenarioNodeFull = {
  id: "L4-node-1",
  layer: 4,
  theme: "operations",
  baseWeight: 1.0,
  eoTargetDimensions: ["proactiveness", "riskTaking"],
  narrative:
    "You are twelve months in. Demand is outpacing your current setup. You could rent a proper shop in Osu for GHS 2,500 per month and look like a real business — or you could hire two more people and run lean and remote. Both require serious commitment. What do you do?",
  choices: [
    {
      index: 0,
      text: "Rent the Osu space. Physical presence matters for the clients you want to attract.",
      tensionHint: "Brand positioning vs. fixed overhead",
    },
    {
      index: 1,
      text: "Hire two more people and stay remote. Scale your capacity, not your rent.",
      tensionHint: "Capacity building vs. market positioning",
    },
    {
      index: 2,
      text: "Wait another quarter. Make sure this demand is sustainable before making a big commitment.",
      tensionHint: "Prudent caution vs. missed moment",
    },
  ],
  effects: [
    {
      capital: -8_000,
      revenue: 4_000,
      debt: 0,
      monthlyBurn: 1_800,
      reputation: 20,
      networkStrength: 12,
      eoDeltas: { riskTaking: 3, proactiveness: 2 },
      flags: { hasPremises: true },
    },
    {
      capital: -3_000,
      revenue: 3_000,
      debt: 0,
      monthlyBurn: 1_200,
      reputation: 8,
      networkStrength: 8,
      eoDeltas: { proactiveness: 1, innovativeness: 1 },
    },
    {
      capital: 0,
      revenue: 1_000,
      debt: 0,
      monthlyBurn: 0,
      reputation: 2,
      networkStrength: 1,
      eoDeltas: { autonomy: 2, riskTaking: -2 },
    },
  ],
};

/** L4-node-2: Networking — A strategic partnership offer */
const L4_NODE_2: ScenarioNodeFull = {
  id: "L4-node-2",
  layer: 4,
  theme: "networking",
  baseWeight: 1.0,
  eoTargetDimensions: ["competitiveAggressiveness", "autonomy"],
  conditions: { reputationMin: 40 },
  narrative:
    "A well-established Accra-based distribution company wants to white-label your product under their brand. They offer a flat monthly licensing fee of GHS 15,000 for a two-year contract. It is guaranteed income — but you lose control of your brand in their market.",
  choices: [
    {
      index: 0,
      text: "Accept the deal. GHS 15,000 a month for two years is stability you cannot ignore.",
      tensionHint: "Financial security vs. brand control",
    },
    {
      index: 1,
      text: "Counter with co-branding — they distribute under their label, but your name stays visible side by side.",
      tensionHint: "Compromise visibility vs. clean deal",
    },
    {
      index: 2,
      text: "Decline. You will build your own distribution network and keep your identity intact.",
      tensionHint: "Full independence vs. guaranteed income",
    },
  ],
  effects: [
    {
      capital: 0,
      revenue: 500,
      debt: 0,
      monthlyBurn: 0,
      reputation: 5,
      networkStrength: 20,
      eoDeltas: { proactiveness: 1, riskTaking: 0 },
    },
    {
      capital: 0,
      revenue: 5_000,
      debt: 0,
      monthlyBurn: 0,
      reputation: 15,
      networkStrength: 15,
      eoDeltas: { innovativeness: 2, proactiveness: 1 },
    },
    {
      capital: 0,
      revenue: 2_000,
      debt: 0,
      monthlyBurn: 0,
      reputation: 10,
      networkStrength: -5,
      eoDeltas: { autonomy: 3, competitiveAggressiveness: 1 },
    },
  ],
};

/** L4-node-3: Crisis — A market shift forces a pivot */
const L4_NODE_3: ScenarioNodeFull = {
  id: "L4-node-3",
  layer: 4,
  theme: "crisis",
  baseWeight: 1.0,
  eoTargetDimensions: ["innovativeness", "proactiveness"],
  narrative:
    "A new government regulation has made your core product category subject to sudden licensing fees of GHS 25,000. You cannot afford it. Your competitors with connections are already finding loopholes. You have six months before the regulation is enforced. What do you do?",
  choices: [
    {
      index: 0,
      text: "Pivot everything — reposition your business into an unregulated category. It is a complete identity shift but you survive.",
      tensionHint: "Total reinvention vs. built identity",
    },
    {
      index: 1,
      text: "Find a loophole — partner with a registered entity and operate under their license while you build a new product line.",
      tensionHint: "Pragmatic workaround vs. authenticity",
    },
    {
      index: 2,
      text: "Pay the fee. Borrow GHS 25,000, absorb the debt, and compete from a position of compliance legitimacy.",
      tensionHint: "Compliance capital vs. financial risk",
    },
  ],
  effects: [
    {
      capital: -5_000,
      revenue: 1_000,
      debt: 0,
      monthlyBurn: 200,
      reputation: 10,
      networkStrength: 5,
      eoDeltas: { innovativeness: 3, proactiveness: 2 },
    },
    {
      capital: -1_000,
      revenue: 2_000,
      debt: 0,
      monthlyBurn: 300,
      reputation: -5,
      networkStrength: 12,
      eoDeltas: { proactiveness: 2, riskTaking: 1 },
    },
    {
      capital: -10_000,
      revenue: 4_000,
      debt: 25_000,
      monthlyBurn: 600,
      reputation: 25,
      networkStrength: 15,
      eoDeltas: { riskTaking: 3, proactiveness: 1 },
    },
  ],
};

// --- Layer 5: Endings ---

/** L5-ending-1: The Thriving Founder */
const L5_ENDING_1: ScenarioNodeFull = {
  id: "L5-ending-1",
  layer: 5,
  theme: "general",
  baseWeight: 1.0,
  eoTargetDimensions: [],
  narrative:
    "Two years after you sat in that front room in Madina, laptop on your knees and GHS 10,000 in your MoMo account, you have built something real. The business has revenue, a small team, and a name that people in your sector know. It was not easy — there were nights you wondered if you should have just taken that civil service job. But you did not. And look at what you made.",
  choices: [
    {
      index: 0,
      text: "You are grateful for every risk you took. The bold calls were the ones that made this happen.",
      tensionHint: "",
    },
    {
      index: 1,
      text: "You are grateful for the people who believed in you. You did not build this alone.",
      tensionHint: "",
    },
    {
      index: 2,
      text: "You are ready for what comes next — bigger markets, bigger risks, bigger wins.",
      tensionHint: "",
    },
  ],
  effects: [
    { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
    { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
    { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
  ],
};

/** L5-ending-2: The Resilient Founder */
const L5_ENDING_2: ScenarioNodeFull = {
  id: "L5-ending-2",
  layer: 5,
  theme: "general",
  baseWeight: 1.0,
  eoTargetDimensions: [],
  narrative:
    "Two years after you sat in that front room in Madina with GHS 10,000 and a plan, you are still here. The business is alive — barely, sometimes, but alive. You have survived things that would have ended a less stubborn venture: the clients who did not pay, the dumsor weeks, the competitors who tried to push you aside. You are not the founder with the biggest story, but you might be the toughest.",
  choices: [
    {
      index: 0,
      text: "You know you have more fight left. This is not the end — it is the floor. You are climbing.",
      tensionHint: "",
    },
    {
      index: 1,
      text: "You learned more about yourself in the struggle than any success could have taught you.",
      tensionHint: "",
    },
    {
      index: 2,
      text: "You would do it all over again. Every loss, every doubt — it made you who you are now.",
      tensionHint: "",
    },
  ],
  effects: [
    { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
    { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
    { capital: 0, revenue: 0, debt: 0, monthlyBurn: 0, reputation: 0, networkStrength: 0, eoDeltas: {} },
  ],
};


// In-memory registry indexed by node id
const REGISTRY: Map<string, ScenarioNodeFull> = new Map([
  // Layer 1
  [L1_NODE_1.id, L1_NODE_1],
  [L1_NODE_2.id, L1_NODE_2],
  [L1_NODE_3.id, L1_NODE_3],
  [L1_NODE_4.id, L1_NODE_4],
  [L1_NODE_5.id, L1_NODE_5],
  // Layer 2
  [L2_NODE_1.id, L2_NODE_1],
  [L2_NODE_2.id, L2_NODE_2],
  [L2_NODE_3.id, L2_NODE_3],
  [L2_NODE_4.id, L2_NODE_4],
  [L2_NODE_5.id, L2_NODE_5],
  // Layer 3
  [L3_NODE_1.id, L3_NODE_1],
  [L3_NODE_2.id, L3_NODE_2],
  [L3_NODE_3.id, L3_NODE_3],
  [L3_NODE_4.id, L3_NODE_4],
  // Layer 4
  [L4_NODE_1.id, L4_NODE_1],
  [L4_NODE_2.id, L4_NODE_2],
  [L4_NODE_3.id, L4_NODE_3],
  // Layer 5
  [L5_ENDING_1.id, L5_ENDING_1],
  [L5_ENDING_2.id, L5_ENDING_2],
]);

/** Returns all nodes across all layers — used by the Director AI candidate pool. */
export function getAllNodes(): ScenarioNodeFull[] {
  return Array.from(REGISTRY.values());
}

/** Returns all nodes for a specific layer — convenience filter over getAllNodes(). */
export function getNodesForLayer(layer: number): ScenarioNodeFull[] {
  return getAllNodes().filter((n) => n.layer === layer);
}

/**
 * Looks up a node by id and returns the client-safe ScenarioNode.
 * Returns null if the id is not found (game complete or unknown id).
 */
export function getNode(nodeId: string | null): ScenarioNode | null {
  if (nodeId === null || nodeId === "") return null;
  const full = REGISTRY.get(nodeId);
  return full ? toClientNode(full) : null;
}

/**
 * Returns the ChoiceEffect for a given node and choice index.
 * Returns null if the node does not exist or the index is out of range.
 */
export function getChoiceEffect(
  nodeId: string,
  choiceIndex: 0 | 1 | 2
): ChoiceEffect | null {
  const full = REGISTRY.get(nodeId);
  if (!full) return null;
  return full.effects[choiceIndex];
}
