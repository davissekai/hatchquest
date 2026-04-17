import Anthropic from "@anthropic-ai/sdk";
import type {
  BusinessSector,
  EOPoleDistribution,
  EOProfile,
  PlayerContext,
  StoryMemory,
} from "@hatchquest/shared";

export interface Layer0Assessment {
  distribution: EOPoleDistribution;
  sector: BusinessSector;
  initialEOProfile: EOProfile;
  layer1NodeId: string;
  storyMemory: StoryMemory;
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
  other: [],
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

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function trimWords(text: string, maxWords: number): string {
  const words = normalizeWhitespace(text).split(" ").filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function cleanSentence(text: string, maxLength = 160): string {
  const cleaned = normalizeWhitespace(text)
    .replace(/^[-–—:,;]+/, "")
    .replace(/["'`]+/g, "")
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trimEnd()}…`;
}

function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function containsAny(text: string, signals: string[]): boolean {
  return signals.some((signal) => text.includes(signal));
}

function looksTooVerbatim(candidate: string, raw: string): boolean {
  const cleanCandidate = normalizeForComparison(candidate);
  const cleanRaw = normalizeForComparison(raw);
  return cleanCandidate.length >= 24 && cleanRaw.includes(cleanCandidate);
}

function extractPrimarySentence(text: string): string {
  const normalized = normalizeWhitespace(text);
  const [first] = normalized.split(/(?<=[.!?])\s+/);
  return cleanSentence(first || normalized, 140);
}

function inferAudience(text: string): string {
  const lower = text.toLowerCase();
  if (containsAny(lower, ["office worker", "bank staff", "corporate"])) return "busy office workers";
  if (containsAny(lower, ["smallholder", "farmer", "grower"])) return "smallholder farmers";
  if (containsAny(lower, ["market women", "trader", "shop owner"])) return "small businesses in local markets";
  if (containsAny(lower, ["student", "campus"])) return "students";
  if (containsAny(lower, ["family", "household", "parent"])) return "households";
  return "customers in Accra";
}

function inferBusinessLabel(q1Response: string, sector: BusinessSector): string {
  const lower = q1Response.toLowerCase();

  if (sector === "food" && containsAny(lower, ["delivery", "lunch"])) {
    return "Accra Lunch Run";
  }
  if (sector === "food" && containsAny(lower, ["snack", "bakery", "juice"])) {
    return "City Food Studio";
  }
  if (sector === "tech" && containsAny(lower, ["inventory", "stock"])) {
    return "Market Ops App";
  }
  if (sector === "tech" && containsAny(lower, ["fintech", "payment", "wallet"])) {
    return "Market Money App";
  }
  if (sector === "agri" && containsAny(lower, ["logistics", "buyer", "supply"])) {
    return "FarmLink Hub";
  }
  if (sector === "agri") {
    return "FarmLink Venture";
  }
  if (sector === "retail") {
    return "City Retail Studio";
  }
  if (sector === "services" && containsAny(lower, ["delivery", "logistics"])) {
    return "Accra Service Hub";
  }
  if (sector === "services") {
    return "Accra Service Desk";
  }
  return "Accra Venture Studio";
}

function inferBusinessSummary(q1Response: string, sector: BusinessSector): string {
  const lower = q1Response.toLowerCase();
  const audience = inferAudience(q1Response);

  switch (sector) {
    case "food":
      if (containsAny(lower, ["delivery", "lunch"])) {
        return `a food venture delivering practical meal options for ${audience}`;
      }
      return `a food business serving ${audience} with reliable everyday products`;
    case "tech":
      if (containsAny(lower, ["inventory", "stock"])) {
        return "a software venture helping small businesses run operations with more control";
      }
      if (containsAny(lower, ["payment", "fintech", "wallet"])) {
        return `a digital finance venture improving access and convenience for ${audience}`;
      }
      return `a technology venture solving a practical business problem for ${audience}`;
    case "agri":
      return "an agriculture venture improving market access, logistics, or income for growers";
    case "retail":
      return `a retail venture offering dependable products for ${audience}`;
    case "services":
      if (containsAny(lower, ["delivery", "logistics"])) {
        return "a service business focused on dependable logistics and fulfilment in Accra";
      }
      return `a service business helping ${audience} solve recurring operational problems`;
    default:
      return "a small business tackling a clear local need in Accra";
  }
}

function inferMotivation(q1Response: string): string {
  const lower = q1Response.toLowerCase();

  if (containsAny(lower, ["affordable", "access", "community", "help", "support"])) {
    return "To make a useful solution more accessible while building a durable business.";
  }
  if (containsAny(lower, ["gap", "problem", "challenge", "fix"])) {
    return "To solve an obvious market problem and turn it into a lasting venture.";
  }
  if (containsAny(lower, ["job", "income", "earn", "family"])) {
    return "To create stable income and build something the founder can grow over time.";
  }
  return "To build something meaningful and resilient in Accra.";
}

function inferFounderEdge(q2Response: string): string {
  const lower = q2Response.toLowerCase();

  if (containsAny(lower, ["call", "partner", "network", "uncle", "friend", "supplier"])) {
    return "Relationship-driven operator";
  }
  if (containsAny(lower, ["negotiate", "immediately", "rush", "lock in", "backup"])) {
    return "Fast-moving operator under pressure";
  }
  if (containsAny(lower, ["delay", "pause", "assess", "review", "wait"])) {
    return "Measured decision-maker under pressure";
  }
  if (containsAny(lower, ["test", "pilot", "experiment", "prototype"])) {
    return "Experimental founder";
  }
  return "Resourceful founder";
}

function inferDecisionStyle(q2Response: string): string {
  const lower = q2Response.toLowerCase();

  if (containsAny(lower, ["call", "partner", "network", "borrow", "uncle", "friend"])) {
    return "relationship-led response";
  }
  if (containsAny(lower, ["negotiate", "backup", "replace", "immediately", "rush"])) {
    return "decisive operational response";
  }
  if (containsAny(lower, ["delay", "pause", "review", "assess"])) {
    return "measured stabilisation";
  }
  if (containsAny(lower, ["test", "pilot", "experiment", "prototype"])) {
    return "experimental adjustment";
  }
  return "resourceful first move";
}

function inferChallengeLabel(q2Prompt: string): string {
  const lower = q2Prompt.toLowerCase();

  if (containsAny(lower, ["supplier", "vendor", "stock", "ingredient"])) {
    return "supplier disruption";
  }
  if (containsAny(lower, ["cook", "staff", "worker", "team", "employee"])) {
    return "staffing crunch";
  }
  if (containsAny(lower, ["order", "client", "customer", "deadline", "monday"])) {
    return "delivery deadline";
  }
  if (containsAny(lower, ["bug", "launch", "beta", "app", "platform"])) {
    return "launch risk";
  }
  if (containsAny(lower, ["permit", "license", "audit", "regulator", "compliance"])) {
    return "compliance pressure";
  }
  if (containsAny(lower, ["cash", "payment", "loan", "debt", "money"])) {
    return "cash-flow squeeze";
  }
  if (containsAny(lower, ["competitor", "rival", "cheaper"])) {
    return "competitive pressure";
  }
  return "opening-week setback";
}

function buildFallbackStoryMemory(q2Prompt: string, q2Response: string): StoryMemory {
  const challenge = inferChallengeLabel(q2Prompt);
  const decisionStyle = inferDecisionStyle(q2Response);

  return {
    lastBeatSummary: `You answered an early ${challenge} with a ${decisionStyle}.`,
    openThread: `the unresolved ${challenge}`,
    continuityAnchor: `${challenge} still threatening your first momentum`,
    recentDecisionStyle: decisionStyle,
    currentArc: "First Market Test",
  };
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

  return scores[ranked[0]] > 0 ? ranked[0] : "other";
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
    storyMemory: {
      lastBeatSummary: "You stepped into the Accra market with a new venture taking shape.",
      openThread: "how the market will answer your first move",
      continuityAnchor: "your first weeks of proving the business can hold",
      recentDecisionStyle: "founder instinct",
      currentArc: "The Beginning",
    },
  };
}

/**
 * Full Layer 0 assessment from a single free-text response.
 * Returns node id, inferred sector, and seeded EO profile.
 * Used by the backward-compat /classify route.
 */
export async function assessLayer0(response: string): Promise<Layer0Assessment> {
  const distribution =
    (await callAnthropicClassifier(response)) ?? keywordClassify(response);
  return buildLayer0Assessment(response, distribution);
}

const Q2_GENERATOR_PROMPT = `You are a business simulation game master set in Accra, Ghana, 2026.

The player just described their business idea. Based on what they said, generate ONE specific follow-up question that:
1. References their specific business (use details they mentioned)
2. Presents a realistic Week 1 challenge they would actually face
3. Forces them to reveal how they handle adversity (risk tolerance, independence vs collaboration)
4. Is phrased as a direct scenario, not an abstract question

Format: Return ONLY the question text. No preamble, no quotes, no explanation.

Example — if they said "mobile food delivery":
"Your mobile food delivery service has been live for five days. Your main cook just told you she has a family emergency and cannot work for the next two weeks. Your first corporate lunch order — forty plates for a bank on the Ring Road — is due Monday. What do you do?"`;

const FALLBACK_Q2 =
  "Your business has been live for one week. A key part of your plan just fell through — " +
  "your main supplier cannot deliver for another two weeks, and a potential customer is waiting. What do you do?";

/**
 * Generates a personalised Q2 question from the player's Q1 response.
 * Falls back to a generic scenario if the LLM call fails or API key is missing.
 */
export async function generateQ2(q1Response: string): Promise<string> {
  const client = getAnthropicClient();
  if (!client) return FALLBACK_Q2;

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      system: Q2_GENERATOR_PROMPT,
      messages: [{ role: "user", content: q1Response }],
    });

    const text = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    return text.length > 20 ? text : FALLBACK_Q2;
  } catch {
    return FALLBACK_Q2;
  }
}

/**
 * Extracts a clean PlayerContext from the player's Layer 0 responses.
 * Raw Q1/Q2 are kept only as optional internal fields for validation and are
 * not meant to be persisted in the clean player_context DB column.
 */
export function extractPlayerContext(
  q1Response: string,
  q2Response: string,
  q2Prompt: string
): PlayerContext {
  const sector = inferSectorFromText(q1Response);
  const businessSummary = inferBusinessSummary(q1Response, sector);

  return {
    businessLabel: inferBusinessLabel(q1Response, sector),
    businessSummary,
    businessDescription: businessSummary,
    motivation: inferMotivation(q1Response),
    founderEdge: inferFounderEdge(q2Response),
    rawQ1Response: normalizeWhitespace(q1Response),
    rawQ2Response: normalizeWhitespace(q2Response),
    q2Prompt: normalizeWhitespace(q2Prompt),
  };
}

const CONTEXT_GENERATOR_PROMPT = `You are a business analyst.
The player just described their business idea (Q1) and how they handle a challenge (Q2).
Extract a clean, display-safe context for the game engine.

Return ONLY valid JSON with exactly this shape:
{
  "businessLabel": "<2-4 word catchy label>",
  "businessSummary": "<1-sentence clear summary of what they do>",
  "founderEdge": "<short phrase describing their unique advantage>"
}

Rules:
- No verbatim echoing of long user text
- Professional but grounded in Accra
- No markdown
- Output JSON only`;

/**
 * Uses AI to refine raw user input into display-safe context fields.
 */
export async function generateDisplaySafeContext(
  q1Response: string,
  q2Response: string
): Promise<Partial<PlayerContext>> {
  const client = getAnthropicClient();
  const fallback = extractPlayerContext(q1Response, q2Response, "");
  const combined = `Q1: ${q1Response}\n\nQ2: ${q2Response}`;

  if (!client) {
    return {
      businessLabel: fallback.businessLabel,
      businessSummary: fallback.businessSummary,
      founderEdge: fallback.founderEdge,
    };
  }

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 250,
      system: CONTEXT_GENERATOR_PROMPT,
      messages: [{ role: "user", content: combined }],
    });

    const text = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    const parsed = JSON.parse(match[0]) as Partial<PlayerContext>;

    const businessLabel =
      typeof parsed.businessLabel === "string" &&
      parsed.businessLabel.trim().length > 2 &&
      !looksTooVerbatim(parsed.businessLabel, q1Response)
        ? cleanSentence(parsed.businessLabel, 40)
        : fallback.businessLabel;
    const businessSummary =
      typeof parsed.businessSummary === "string" &&
      parsed.businessSummary.trim().length > 12 &&
      !looksTooVerbatim(parsed.businessSummary, q1Response)
        ? cleanSentence(parsed.businessSummary, 140)
        : fallback.businessSummary;
    const founderEdge =
      typeof parsed.founderEdge === "string" && parsed.founderEdge.trim().length > 3
        ? cleanSentence(parsed.founderEdge, 60)
        : fallback.founderEdge;

    return {
      businessLabel,
      businessSummary,
      founderEdge,
    };
  } catch {
    return {
      businessLabel: fallback.businessLabel,
      businessSummary: fallback.businessSummary,
      founderEdge: fallback.founderEdge,
    };
  }
}

const STORY_MEMORY_PROMPT = `You are a game storyteller.
The player just faced a challenge (Q2 SCENARIO) and gave a response (Q2 DECISION).
Summarize this for narrative continuity.

Return ONLY valid JSON with exactly this shape:
{
  "lastBeatSummary": "<1-sentence summary of what happened and what the player did>",
  "openThread": "<short unresolved tension>",
  "continuityAnchor": "<specific bridge phrase the next scene should continue from>",
  "recentDecisionStyle": "<short description of how the founder acted under pressure>",
  "currentArc": "<2-4 word arc title>"
}

Rules:
- Do not echo raw user text verbatim
- Focus on the story beat
- No markdown
- Output JSON only`;

/**
 * Uses AI to generate a StoryMemory object for narrative continuity.
 */
export async function generateStoryMemory(
  q2Prompt: string,
  q2Response: string
): Promise<StoryMemory> {
  const client = getAnthropicClient();
  const fallback = buildFallbackStoryMemory(q2Prompt, q2Response);
  const combined = `Q2 SCENARIO: ${q2Prompt}\n\nQ2 DECISION: ${q2Response}`;

  if (!client) {
    return fallback;
  }

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 250,
      system: STORY_MEMORY_PROMPT,
      messages: [{ role: "user", content: combined }],
    });

    const text = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    const parsed = JSON.parse(match[0]) as Partial<StoryMemory>;

    return {
      lastBeatSummary:
        typeof parsed.lastBeatSummary === "string" &&
        parsed.lastBeatSummary.trim().length > 12 &&
        !looksTooVerbatim(parsed.lastBeatSummary, q2Response)
          ? cleanSentence(parsed.lastBeatSummary, 180)
          : fallback.lastBeatSummary,
      openThread:
        typeof parsed.openThread === "string" &&
        parsed.openThread.trim().length > 6 &&
        !looksTooVerbatim(parsed.openThread, q2Response)
          ? cleanSentence(parsed.openThread, 90)
          : fallback.openThread,
      continuityAnchor:
        typeof parsed.continuityAnchor === "string" &&
        parsed.continuityAnchor.trim().length > 8 &&
        !looksTooVerbatim(parsed.continuityAnchor, q2Response)
          ? cleanSentence(parsed.continuityAnchor, 120)
          : fallback.continuityAnchor,
      recentDecisionStyle:
        typeof parsed.recentDecisionStyle === "string" &&
        parsed.recentDecisionStyle.trim().length > 3
          ? cleanSentence(parsed.recentDecisionStyle, 60)
          : fallback.recentDecisionStyle,
      currentArc:
        typeof parsed.currentArc === "string" && parsed.currentArc.trim().length > 3
          ? trimWords(cleanSentence(parsed.currentArc, 40), 5)
          : fallback.currentArc,
    };
  } catch {
    return fallback;
  }
}

/** Backward-compat single-step classifier. */
export async function classify(response: string): Promise<string> {
  return (await assessLayer0(response)).layer1NodeId;
}

/**
 * Two-step classify: combines Q1 + Q2 for a richer EO signal.
 * Q2 reveals adversity response which Q1 alone cannot capture.
 */
export async function assessLayer0FromBothResponses(
  q1Response: string,
  q2Response: string
): Promise<Layer0Assessment> {
  const combinedText = `Business idea: ${q1Response}\n\nResponse to challenge: ${q2Response}`;
  const distribution =
    (await callAnthropicClassifier(combinedText)) ?? keywordClassify(combinedText);

  return {
    distribution,
    sector: inferSectorFromText(`${q1Response} ${q2Response}`),
    initialEOProfile: seedEOProfileFromDistribution(distribution),
    layer1NodeId: selectLayer1NodeFromDistribution(distribution),
    storyMemory: buildFallbackStoryMemory("", q2Response),
  };
}

export async function classifyFromBothResponses(
  q1Response: string,
  q2Response: string
): Promise<string> {
  return (await assessLayer0FromBothResponses(q1Response, q2Response)).layer1NodeId;
}
