import type { ScenarioNode, Choice } from "@hatchquest/shared";
import type { ChoiceEffect } from "./engine/apply-choice.js";

// Full scenario node including server-side choice effects.
// ScenarioNode (from shared) carries only the client-facing fields.
export interface ScenarioNodeFull {
  id: string;
  layer: number;
  narrative: string;
  choices: Choice[];
  // Parallel array: effects[i] maps to choices[i]
  effects: [ChoiceEffect, ChoiceEffect, ChoiceEffect];
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

// --- Stub Layer 1 node data (hand-crafted for demo) ---
// Each node maps to one of the 5 EO pole-distribution combinations from Layer 0 classification.
// TODO: expand to full 171-node pool once Director AI is in place.

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

/** Layer 2 stub node — used by the Director AI stub until the full pool exists */
const L2_NODE_1: ScenarioNodeFull = {
  id: "L2-node-1",
  layer: 2,
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

// In-memory registry indexed by node id
const REGISTRY: Map<string, ScenarioNodeFull> = new Map([
  [L1_NODE_1.id, L1_NODE_1],
  [L1_NODE_2.id, L1_NODE_2],
  [L1_NODE_3.id, L1_NODE_3],
  [L1_NODE_4.id, L1_NODE_4],
  [L1_NODE_5.id, L1_NODE_5],
  [L2_NODE_1.id, L2_NODE_1],
]);

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
