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
import type { EOPoleDistribution } from "@hatchquest/shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSIFIER_TIMEOUT_MS = 30_000; // MiniMax M2.7 is a reasoning model — needs ~19s on average

const SYSTEM_PROMPT = `You are an entrepreneurial orientation classifier. Given a player's statement about their business idea, return a JSON object with exactly this shape:
{
  "values": { "peopleFocused": <0-1>, "profitFocused": <0-1> },
  "risk": { "tolerant": <0-1>, "averse": <0-1> },
  "orientation": { "proactive": <0-1>, "reactive": <0-1> },
  "agency": { "autonomous": <0-1>, "collaborative": <0-1> },
  "competitive": { "aggressive": <0-1>, "measured": <0-1> }
}

Rules:
- Each pair must sum to exactly 1.0
- Use the full range [0.0, 1.0] — avoid defaulting to 0.5/0.5 unless truly ambiguous
- Infer from language, word choice, and framing — not from sector or geography
- Return ONLY the JSON object, no preamble or explanation`;

// ─── LLM Classifier ──────────────────────────────────────────────────────────

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "minimaxai/minimax-m2.7";

/**
 * Calls NVIDIA inference (MiniMax M2.7) to classify free-text into EO pole distributions.
 * Returns null if: NVIDIA_API_KEY is unset, the call times out (8 s),
 * the response is non-200, the JSON is malformed, or any error is thrown.
 * The keyword heuristic in classify() always fires as fallback.
 */
export async function callNvidiaClassifier(
  response: string
): Promise<EOPoleDistribution | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);

  try {
    const res = await fetch(NVIDIA_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: response },
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1024,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content ?? null;
    if (!raw) return null;

    // Strip <think>...</think> reasoning blocks (present when token budget is very tight)
    // and trim surrounding whitespace before attempting JSON parse.
    const text = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (!text) return null;

    const parsed = JSON.parse(text) as EOPoleDistribution;
    return isValidDistribution(parsed) ? parsed : null;
  } catch {
    // AbortError (timeout), network failure, JSON parse error — fall through to keyword heuristic
    clearTimeout(timeoutId);
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
    (await callNvidiaClassifier(response)) ?? keywordClassify(response);
  return selectLayer1NodeFromDistribution(dist);
}
