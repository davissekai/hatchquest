import Anthropic from "@anthropic-ai/sdk";
import type {
  BusinessSector,
  EOPoleDistribution,
  EOProfile,
} from "@hatchquest/shared";

export interface Layer0Assessment {
  distribution: EOPoleDistribution;
  sector: BusinessSector;
  initialEOProfile: EOProfile;
  layer1NodeId: string;
}

const CLASSIFIER_TIMEOUT_MS = 10_000;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

const SYSTEM_PROMPT = `You are an entrepreneurial orientation classifier.
Return ONLY valid JSON with exactly this shape:
{
  "values": { "peopleFocused": <0-1>, "profitFocused": <0-1> },
  "risk": { "tolerant": <0-1>, "averse": <0-1> },
  "orientation": { "proactive": <0-1>, "reactive": <0-1> },
  "agency": { "autonomous": <0-1>, "collaborative": <0-1> },
  "competitive": { "aggressive": <0-1>, "measured": <0-1> }
}

Rules:
- Each pair must sum to 1.0
- Use decimals
- Judge the founder's orientation from what they say they value, how they act under stress, and how they react to competition
- Ignore sector naming and focus on behaviour
- No markdown
- No explanation
- No preamble
- No code fence
- Output JSON only`;

const SECTOR_KEYWORDS: Record<BusinessSector, string[]> = {
  tech: [
    "app",
    "platform",
    "software",
    "digital",
    "saas",
    "website",
    "online",
    "fintech",
    "ai",
    "tech",
  ],
  agri: [
    "farm",
    "farmer",
    "agri",
    "agriculture",
    "crop",
    "produce",
    "cassava",
    "maize",
    "poultry",
    "harvest",
  ],
  retail: [
    "shop",
    "store",
    "retail",
    "inventory",
    "goods",
    "fashion",
    "boutique",
    "product",
    "packaging",
    "market stall",
  ],
  food: [
    "food",
    "meal",
    "snack",
    "restaurant",
    "catering",
    "kitchen",
    "drink",
    "juice",
    "bakery",
    "beverage",
  ],
  services: [
    "service",
    "delivery",
    "logistics",
    "agency",
    "marketplace",
    "connect",
    "match",
    "consult",
    "booking",
    "network",
  ],
};

const SECTOR_PRIORITY: BusinessSector[] = [
  "food",
  "agri",
  "tech",
  "services",
  "retail",
];

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  return new Anthropic({
    apiKey,
    timeout: CLASSIFIER_TIMEOUT_MS,
    maxRetries: 0,
  });
}

export async function callAnthropicClassifier(
  response: string
): Promise<EOPoleDistribution | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 180,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: response,
        },
      ],
    });

    const raw = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    if (!raw) return null;

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as EOPoleDistribution;
    return isValidDistribution(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isValidDistribution(dist: unknown): dist is EOPoleDistribution {
  if (typeof dist !== "object" || dist === null) return false;
  const d = dist as Record<string, unknown>;

  const pairs: [string, [string, string]][] = [
    ["values", ["peopleFocused", "profitFocused"]],
    ["risk", ["tolerant", "averse"]],
    ["orientation", ["proactive", "reactive"]],
    ["agency", ["autonomous", "collaborative"]],
    ["competitive", ["aggressive", "measured"]],
  ];

  for (const [dimension, [poleA, poleB]] of pairs) {
    const pair = d[dimension];
    if (typeof pair !== "object" || pair === null) return false;
    const p = pair as Record<string, unknown>;
    if (typeof p[poleA] !== "number" || typeof p[poleB] !== "number") {
      return false;
    }
    const sum = (p[poleA] as number) + (p[poleB] as number);
    if (Math.abs(sum - 1.0) > 0.05) return false;
  }

  return true;
}

export function keywordClassify(response: string): EOPoleDistribution {
  const text = response.toLowerCase();

  const riskTolerant = scorePoles(
    text,
    [
      "bold",
      "risk",
      "bet",
      "venture",
      "invest",
      "disrupt",
      "ambitious",
      "aggressive",
      "compete",
      "dominate",
    ],
    [
      "safe",
      "careful",
      "steady",
      "stable",
      "sustainable",
      "gradual",
      "conservative",
      "protect",
      "secure",
    ]
  );

  const peopleFocused = scorePoles(
    text,
    [
      "community",
      "people",
      "social",
      "impact",
      "help",
      "empower",
      "support",
      "access",
      "inclusion",
      "affordable",
    ],
    ["profit", "revenue", "margin", "scale", "growth", "roi", "return", "money", "income"]
  );

  const autonomous = scorePoles(
    text,
    ["own", "independent", "myself", "solo", "alone", "founder", "control", "decide"],
    ["partner", "team", "network", "together", "collaboration", "join", "alliance", "coalition"]
  );

  const proactive = scorePoles(
    text,
    ["first", "new", "innovate", "pioneer", "launch", "create", "build", "lead", "disrupt"],
    ["reactive", "respond", "wait", "follow"]
  );

  const aggressive = scorePoles(
    text,
    ["compete", "beat", "win", "dominate", "challenge", "outperform", "aggressive"],
    ["measured", "sustainable", "collaborative", "cooperative", "niche"]
  );

  return {
    values: { peopleFocused, profitFocused: 1 - peopleFocused },
    risk: { tolerant: riskTolerant, averse: 1 - riskTolerant },
    orientation: { proactive, reactive: 1 - proactive },
    agency: { autonomous, collaborative: 1 - autonomous },
    competitive: { aggressive, measured: 1 - aggressive },
  };
}

export function scorePoles(
  text: string,
  positiveSignals: string[],
  negativeSignals: string[]
): number {
  let score = 0;
  for (const signal of positiveSignals) {
    if (text.includes(signal)) score += 1;
  }
  for (const signal of negativeSignals) {
    if (text.includes(signal)) score -= 1;
  }

  if (score > 0) return Math.min(0.9, 0.5 + score * 0.1);
  if (score < 0) return Math.max(0.1, 0.5 + score * 0.1);
  return 0.5;
}

export function inferSectorFromText(response: string): BusinessSector {
  const text = response.toLowerCase();
  const scores = Object.fromEntries(
    Object.entries(SECTOR_KEYWORDS).map(([sector, keywords]) => [
      sector,
      keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0),
    ])
  ) as Record<BusinessSector, number>;

  const ranked = [...SECTOR_PRIORITY].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return SECTOR_PRIORITY.indexOf(a) - SECTOR_PRIORITY.indexOf(b);
  });

  return scores[ranked[0]] > 0 ? ranked[0] : "tech";
}

function roundProfileValue(value: number): number {
  return Math.max(0, Math.min(10, Number(value.toFixed(1))));
}

export function seedEOProfileFromDistribution(
  dist: EOPoleDistribution
): EOProfile {
  const innovativenessSignal =
    (dist.orientation.proactive + dist.risk.tolerant + dist.agency.autonomous) /
    3;

  return {
    autonomy: roundProfileValue(dist.agency.autonomous * 10),
    innovativeness: roundProfileValue(innovativenessSignal * 10),
    riskTaking: roundProfileValue(dist.risk.tolerant * 10),
    proactiveness: roundProfileValue(dist.orientation.proactive * 10),
    competitiveAggressiveness: roundProfileValue(
      dist.competitive.aggressive * 10
    ),
  };
}

export function selectLayer1NodeFromDistribution(
  dist: EOPoleDistribution
): string {
  const scores: [string, number][] = [
    ["L1-node-1", dist.risk.tolerant + dist.competitive.aggressive],
    ["L1-node-2", dist.orientation.proactive + dist.risk.averse],
    ["L1-node-3", dist.values.peopleFocused + dist.agency.autonomous],
    ["L1-node-4", dist.values.profitFocused + dist.competitive.aggressive],
    ["L1-node-5", dist.agency.autonomous],
  ];

  return scores.reduce((best, curr) => (curr[1] > best[1] ? curr : best))[0];
}

export function buildLayer0Assessment(
  response: string,
  distribution: EOPoleDistribution
): Layer0Assessment {
  return {
    distribution,
    sector: inferSectorFromText(response),
    initialEOProfile: seedEOProfileFromDistribution(distribution),
    layer1NodeId: selectLayer1NodeFromDistribution(distribution),
  };
}

export async function assessLayer0(
  response: string
): Promise<Layer0Assessment> {
  const distribution =
    (await callAnthropicClassifier(response)) ?? keywordClassify(response);
  return buildLayer0Assessment(response, distribution);
}

export async function classify(response: string): Promise<string> {
  return (await assessLayer0(response)).layer1NodeId;
}
