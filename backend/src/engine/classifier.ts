/**
 * Layer 0 Classifier — maps a free-text player response to a Layer 1 node id.
 *
 * Pipeline:
 *   classify(response)
 *     → callNvidiaClassifier(response)  — LLM call via NVIDIA inference API (MiniMax M2.7),
 *                                          8 s timeout, returns null on any failure
 *     → keywordClassify(response)       — pure fallback, always returns a valid distribution
 *     → selectLayer1NodeFromDistribution(dist) — maps poles to one of 5 L1 node ids
 *
 * L1 node pole signatures:
 *   L1-node-1: risk.tolerant + competitive.aggressive   (bold + competitive)
 *   L1-node-2: orientation.proactive + risk.averse      (proactive but careful)
 *   L1-node-3: values.peopleFocused + agency.autonomous (people-first, independent)
 *   L1-node-4: values.profitFocused + competitive.aggressive (profit + competitive)
 *   L1-node-5: agency.autonomous                        (autonomous, no strong other pole)
 *
 * Coverage note: callNvidiaClassifier makes an external API call and is excluded
 * from the engine coverage threshold (see vitest.config.ts). The pure logic
 * functions — keywordClassify, selectLayer1NodeFromDistribution, scorePoles —
 * are fully covered by unit tests in classifier.test.ts.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { EOPoleDistribution } from "@hatchquest/shared";

// ─── Constants ────────────────────────────────────────────────────────────────

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
- No markdown
- No explanation
- No preamble
- No code fence
- Output JSON only`;

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  return new Anthropic({
    apiKey,
    timeout: CLASSIFIER_TIMEOUT_MS,
    maxRetries: 0,
  });
}

/**
 * Calls Anthropic to classify free-text into EO pole distributions.
 */
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

    // Defensive parsing: find the first { ... } block
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as EOPoleDistribution;
    return isValidDistribution(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Validates shape and pole-pair sum constraints on a parsed distribution.
 * Each of the 5 pairs must contain the expected keys and sum to ~1.0 (±0.05).
 */
function isValidDistribution(dist: unknown): dist is EOPoleDistribution {
  if (typeof dist !== "object" || dist === null) return false;
  const d = dist as Record<string, unknown>;

  const PAIRS: [string, [string, string]][] = [
    ["values", ["peopleFocused", "profitFocused"]],
    ["risk", ["tolerant", "averse"]],
    ["orientation", ["proactive", "reactive"]],
    ["agency", ["autonomous", "collaborative"]],
    ["competitive", ["aggressive", "measured"]],
  ];

  for (const [dimension, [poleA, poleB]] of PAIRS) {
    const pair = d[dimension];
    if (typeof pair !== "object" || pair === null) return false;
    const p = pair as Record<string, unknown>;
    if (typeof p[poleA] !== "number" || typeof p[poleB] !== "number")
      return false;
    const sum = (p[poleA] as number) + (p[poleB] as number);
    if (Math.abs(sum - 1.0) > 0.05) return false;
  }
  return true;
}

// ─── Keyword Classifier ───────────────────────────────────────────────────────

/**
 * Pure keyword heuristic — no external calls, always returns a valid distribution.
 * Used as fallback when the LLM call fails or ANTHROPIC_API_KEY is unset.
 */
export function keywordClassify(response: string): EOPoleDistribution {
  const text = response.toLowerCase();

  // Risk: tolerant signals push toward 1.0; averse signals push toward 0.0
  const riskTolerant = scorePoles(
    text,
    ["bold", "risk", "bet", "venture", "invest", "disrupt", "ambitious", "aggressive", "compete", "dominate"],
    ["safe", "careful", "steady", "stable", "sustainable", "gradual", "conservative", "protect", "secure"]
  );

  // Values: people-focused vs profit-focused
  const peopleFocused = scorePoles(
    text,
    ["community", "people", "social", "impact", "help", "empower", "support", "access", "inclusion", "affordable"],
    ["profit", "revenue", "margin", "scale", "growth", "roi", "return", "money", "income"]
  );

  // Agency: autonomous vs collaborative
  const autonomous = scorePoles(
    text,
    ["own", "independent", "myself", "solo", "alone", "founder", "control", "decide"],
    ["partner", "team", "network", "together", "collaboration", "join", "alliance", "coalition"]
  );

  // Orientation: proactive (no clear antonyms — defaults toward 0.5 with no signals)
  const proactive = scorePoles(
    text,
    ["first", "new", "innovate", "pioneer", "launch", "create", "build", "lead", "disrupt"],
    ["reactive", "respond", "wait", "follow"]
  );

  // Competitive: aggressive vs measured
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

/**
 * Maps a text's keyword presence to a value in [0.1, 0.9].
 * Each positive signal hit adds 0.1; each negative signal hit subtracts 0.1.
 * Returns 0.5 when no signals fire (neutral / ambiguous).
 */
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
  // Clamp to [0.1, 0.9] — avoids hard 0 / 1 which would imply total certainty
  if (score > 0) return Math.min(0.9, 0.5 + score * 0.1);
  if (score < 0) return Math.max(0.1, 0.5 + score * 0.1);
  return 0.5;
}

// ─── Node Selection ───────────────────────────────────────────────────────────

/**
 * Maps an EOPoleDistribution to one of the 5 Layer 1 node ids.
 * Scores each node by summing its two defining pole scores; highest wins.
 */
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

  // Find the node with the highest score (first in case of tie)
  return scores.reduce((best, curr) => (curr[1] > best[1] ? curr : best))[0];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Classifies a free-text player response to a Layer 1 node id.
 * Tries the LLM classifier first; falls back to keyword heuristic on any failure.
 */
export async function classify(response: string): Promise<string> {
  const dist =
    (await callAnthropicClassifier(response)) ?? keywordClassify(response);
  return selectLayer1NodeFromDistribution(dist);
}
