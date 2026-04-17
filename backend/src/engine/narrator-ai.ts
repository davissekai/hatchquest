/**
 * Narrator AI — generates personalised scenario narrative from a skeleton + PlayerContext.
 *
 * Pipeline:
 *   generateNarrativeSkin(skeleton, context, worldCtx?)
 *     → LLM call (Claude Haiku) if ANTHROPIC_API_KEY is set and MOCK_LLM != "1"
 *     → buildFallbackSkin on any failure, including timeout or missing key
 *     → validateNarration on LLM output; validator-rejected → buildFallbackSkin
 *
 * The fallback is deterministic and always valid.
 */
import Anthropic from "@anthropic-ai/sdk";
import type {
  BusinessSector,
  NarrativeSkin,
  PlayerContext,
  RecentChoice,
  ScenarioSkeleton,
} from "@hatchquest/shared";
import { isMockLLM, mockGenerateSkin } from "../lib/mock-anthropic.js";

const NARRATOR_TIMEOUT_MS = 12_000;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

// Hard-banned proper nouns the narrator must never use (foreign brands, off-setting names).
// We allow any other capitalised word — the whitelist approach was too strict and was
// silently knocking nearly every LLM response into the fallback path.
const BANNED_PROPER_NOUNS = new Set([
  "Apple",
  "Google",
  "Amazon",
  "Microsoft",
  "Stripe",
  "Shopify",
]);

// Hard caps on PlayerContext fields sent to the LLM.
// Q1 answers are often multi-paragraph essays. Sending them uncapped causes the
// LLM to echo the raw text verbatim into the narrative instead of paraphrasing.
const BUSINESS_DESCRIPTION_PROMPT_CAP = 120;
const MOTIVATION_PROMPT_CAP = 100;

function decapitalise(s: string): string {
  if (s.length === 0) return s;
  return s[0].toLowerCase() + s.slice(1);
}

const NARRATOR_SYSTEM_PROMPT = `You are a business simulation narrator set in Accra, Ghana, 2026.

You will receive:
1. A SITUATION SEED — the abstract scenario structure
2. A PLAYER CONTEXT — their specific business and motivation
3. Three CHOICE ARCHETYPES — the structural choices available
4. WORLD CONDITIONS — current market signals the player can feel
5. TURN CONTEXT — sector, a short business hint, recent choices, and whether
   this is the very first scenario after Layer 0 classification. On the first
   turn, Q2 SCENARIO and Q2 DECISION may also be provided.

Your job: generate a personalised scenario that feels like it is happening to THIS player's specific business, in THIS player's specific market, in Accra.

Return ONLY valid JSON with this exact shape:
{
  "narrative": "<2-3 paragraph scenario description, grounded in the player's business>",
  "choices": ["<choice 1 text>", "<choice 2 text>", "<choice 3 text>"],
  "tensionHints": ["<hint 1>", "<hint 2>", "<hint 3>"]
}

Rules:
- Frame the scenario in the player's specific SECTOR and BUSINESS DESCRIPTION.
  Never introduce physical-retail framing (shop space, shelves, packaging) for
  a 'tech' sector player. Never introduce software-only framing for a 'retail',
  'food', or 'agri' player. Use the sector you are given.
- NEVER quote, copy, or closely paraphrase the raw business description text.
  Use only short sector nouns: "your app", "your shop", "your farm", "your business".
- If IS_FIRST_SCENARIO_TURN is YES and Q2 SCENARIO + Q2 DECISION are provided:
  the narrative MUST be the direct next chapter of that exact story — the next
  day, week, or beat after the Q2 decision. Reference the specific situation
  they faced and the path they chose. Do NOT start with a random new event.
  The 3 choices must emerge naturally from that Q2 outcome.
  Open with a short time-marker ("A week after...", "The day after your decision...").
- If IS_FIRST_SCENARIO_TURN is YES and no Q2 context is provided:
  open with a short time-bridge phrase only ("A few weeks into building your app,..."
  or "A few months in,..."). Keep the opener under 15 words.
- If IS_FIRST_SCENARIO_TURN is no and RECENT CHOICES are present, open
  with a single-sentence callback to the most recent choice (RECENT[0])
  BEFORE the new scenario seed, so the player feels continuity.
- Use Accra-specific details (locations, currency in GHS, local business culture)
- Narrative must be rich and immersive, around 3 paragraphs long, to take advantage of a wide desktop reading format. Up to 1500 characters.
- Choices must be substantive (1-3 sentences each), action-oriented, specific to the scenario.
- Tension hints must describe the dilemma without using EO terminology
- No markdown, no code fence, JSON only`;

export interface NarrationWorldContext {
  marketHeat: number;          // [0-100]
  competitorThreat: number;    // [0-100]
  infrastructureStability: number; // [0-100]
  capital: number;
  lastEventNarrativeHook: string | null;
  /** Player's business sector — drives framing ("tech" vs "retail" vs ...). */
  sector: BusinessSector;
  /** Q1 free-text — used as a short paraphrase hint, never echoed verbatim. */
  businessDescription: string;
  /** Most recent choices (newest first, max 3) for continuity callbacks. */
  choiceHistory: RecentChoice[];
  /** Number of scenario turns completed so far. 0 means we are heading into the first. */
  turnNumber: number;
  /** True iff this is the very first scenario turn after Layer 0 classify. */
  isFirstScenarioTurn: boolean;
  /** The AI-generated Q2 scenario text — used on the first playable turn for story continuity. */
  q2Prompt?: string;
  /** The player's raw Q2 response — their decision in the Layer 0 story scenario. */
  q2Response?: string;
}

/* c8 ignore start */
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, timeout: NARRATOR_TIMEOUT_MS, maxRetries: 0 });
}
/* c8 ignore stop */

export function buildWorldConditionsBlock(ctx: NarrationWorldContext): string {
  const heatLabel = ctx.marketHeat > 65 ? "hot" : ctx.marketHeat > 35 ? "moderate" : "cold";
  const threatLabel = ctx.competitorThreat > 65 ? "aggressive" : ctx.competitorThreat > 35 ? "present" : "quiet";
  const infraLabel =
    ctx.infrastructureStability > 65 ? "reliable" : ctx.infrastructureStability > 35 ? "patchy" : "unreliable";
  const capitalStr = `GHS ${ctx.capital.toLocaleString("en-GH")}`;

  return `WORLD CONDITIONS:
- Market demand: ${heatLabel} (${Math.round(ctx.marketHeat)}/100)
- Competitor pressure: ${threatLabel} (${Math.round(ctx.competitorThreat)}/100)
- Infrastructure: ${infraLabel} (${Math.round(ctx.infrastructureStability)}/100)
- Current capital: ${capitalStr}
- Last world event: ${ctx.lastEventNarrativeHook ?? "none"}`;
}

/**
 * Formats the turn + continuity block for the narrator prompt.
 * Exposed so it is coverable and stable across LLM/mock paths.
 *
 * businessDescription is capped at BUSINESS_DESCRIPTION_PROMPT_CAP and labeled
 * as a paraphrase hint — never as "verbatim" — to prevent LLM from echoing Q1.
 * On the first scenario turn, Q2 scenario + decision are appended when present
 * so the LLM can continue the story directly from the player's Layer 0 arc.
 */
export function buildTurnContextBlock(ctx: NarrationWorldContext): string {
  const recent =
    ctx.choiceHistory.length === 0
      ? "none yet"
      : ctx.choiceHistory
          .map(
            (c, i) =>
              `${i === 0 ? "MOST RECENT" : `prior ${i}`}: "${c.choiceLabel}" (${c.effectSummary})`
          )
          .join("; ");

  const businessShort =
    ctx.businessDescription.length > BUSINESS_DESCRIPTION_PROMPT_CAP
      ? `${ctx.businessDescription.slice(0, BUSINESS_DESCRIPTION_PROMPT_CAP).trim()}…`
      : ctx.businessDescription || "(not provided)";

  let q2Block = "";
  if (ctx.isFirstScenarioTurn && ctx.q2Prompt && ctx.q2Response) {
    const q2PromptShort =
      ctx.q2Prompt.length > 300
        ? `${ctx.q2Prompt.slice(0, 300).trim()}…`
        : ctx.q2Prompt;
    const q2RespShort =
      ctx.q2Response.length > 250
        ? `${ctx.q2Response.slice(0, 250).trim()}…`
        : ctx.q2Response;
    q2Block =
      `\n- Q2 SCENARIO the player just faced: "${q2PromptShort}"` +
      `\n- Q2 DECISION the player made: "${q2RespShort}"`;
  }

  return `TURN CONTEXT:
- Sector: ${ctx.sector}
- Business (paraphrase hint, never echo verbatim): ${businessShort}
- Turn number: ${ctx.turnNumber}
- Is first scenario turn: ${ctx.isFirstScenarioTurn ? "YES" : "no"}
- Recent choices: ${recent}${q2Block}`;
}

/**
 * Validates LLM-generated narration against structural and content rules.
 * Returns { ok: true } or { ok: false, reason: string }.
 */
export function validateNarration(
  output: NarrativeSkin,
  skeleton: ScenarioSkeleton,
  playerBusinessName: string
): { ok: boolean; reason?: string } {
  if (output.choices.length !== 3) {
    return { ok: false, reason: "expected exactly 3 choices" };
  }
  if (output.narrative.length > 1500) {
    return { ok: false, reason: `narrative too long: ${output.narrative.length} chars` };
  }

  // Reject only on hard-banned brand/foreign names. Anything else (Accra street names,
  // local first names, market names) is allowed — the previous whitelist was so narrow
  // that almost every LLM output was rejected and the player only ever saw skeleton seeds.
  const capitalised = output.narrative.match(/\b[A-Z][a-z]{2,}/g) ?? [];
  const violations = capitalised.filter((w) => BANNED_PROPER_NOUNS.has(w));
  if (violations.length > 0) {
    return { ok: false, reason: `banned proper nouns: ${violations.slice(0, 3).join(", ")}` };
  }

  // Reference args are kept for signature stability with callers/tests.
  void skeleton;
  void playerBusinessName;
  return { ok: true };
}

/**
 * Generates a personalised NarrativeSkin using the LLM.
 * Falls back to buildFallbackSkin on any failure or validation rejection.
 * Returns a tuple: [skin, source] where source tracks whether LLM, fallback, or validator-rejected was used.
 */
export async function generateNarrativeSkin(
  skeleton: ScenarioSkeleton,
  context: PlayerContext,
  worldCtx?: NarrationWorldContext
): Promise<[NarrativeSkin, "llm" | "fallback" | "validator-rejected"]> {
  if (isMockLLM()) {
    const skin = await mockGenerateSkin(skeleton, context);
    return [skin, "fallback"];
  }

  const client = getClient();
  /* c8 ignore start -- requires live Anthropic API key; not testable in CI */
  if (!client) return [buildFallbackSkin(skeleton, context, worldCtx), "fallback"];
  const worldBlock = worldCtx
    ? `\n\n${buildWorldConditionsBlock(worldCtx)}\n\n${buildTurnContextBlock(worldCtx)}`
    : "";

  const businessShort =
    context.businessDescription.length > BUSINESS_DESCRIPTION_PROMPT_CAP
      ? `${context.businessDescription.slice(0, BUSINESS_DESCRIPTION_PROMPT_CAP).trim()}…`
      : context.businessDescription;

  const motivationShort =
    context.motivation.length > MOTIVATION_PROMPT_CAP
      ? `${context.motivation.slice(0, MOTIVATION_PROMPT_CAP).trim()}…`
      : context.motivation;

  const userPrompt = `SITUATION SEED: ${skeleton.situationSeed}

PLAYER CONTEXT (use for framing only — do NOT reproduce these fields verbatim in the narrative):
- Business: ${businessShort}
- Motivation: ${motivationShort}${worldBlock}

CHOICE ARCHETYPES:
1. ${skeleton.choiceArchetypes[0].archetypeDescription} (tension: ${skeleton.choiceArchetypes[0].tensionAxis})
2. ${skeleton.choiceArchetypes[1].archetypeDescription} (tension: ${skeleton.choiceArchetypes[1].tensionAxis})
3. ${skeleton.choiceArchetypes[2].archetypeDescription} (tension: ${skeleton.choiceArchetypes[2].tensionAxis})`;

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      system: NARRATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return [buildFallbackSkin(skeleton, context, worldCtx), "fallback"];

    const parsed = JSON.parse(match[0]) as NarrativeSkin;
    if (
      typeof parsed.narrative === "string" &&
      Array.isArray(parsed.choices) &&
      parsed.choices.length === 3 &&
      Array.isArray(parsed.tensionHints) &&
      parsed.tensionHints.length === 3
    ) {
      const skin: NarrativeSkin = {
        narrative: parsed.narrative,
        choices: parsed.choices as [string, string, string],
        tensionHints: parsed.tensionHints as [string, string, string],
      };
      const validation = validateNarration(
        skin,
        skeleton,
        context.businessDescription
      );
      if (!validation.ok) {
        return [buildFallbackSkin(skeleton, context, worldCtx), "validator-rejected"];
      }
      return [skin, "llm"];
    }

    return [buildFallbackSkin(skeleton, context, worldCtx), "fallback"];
  } catch {
    return [buildFallbackSkin(skeleton, context, worldCtx), "fallback"];
  }
  /* c8 ignore stop */
}

/**
 * Deterministic fallback — uses the skeleton's situation seed directly.
 * No LLM call required. Always produces a valid NarrativeSkin.
 *
 * When the caller passes worldCtx and this is the first scenario turn,
 * prepend a simple time-marker so the fallback still feels like a landing
 * into the player's story rather than an abstract scenario seed.
 */
export function buildFallbackSkin(
  skeleton: ScenarioSkeleton,
  _context: PlayerContext,
  worldCtx?: NarrationWorldContext
): NarrativeSkin {
  let prefix = "";
  if (worldCtx?.isFirstScenarioTurn) {
    if (worldCtx.q2Response) {
      // Continue from Q2 decision rather than opening cold
      const respShort =
        worldCtx.q2Response.length > 80
          ? `${worldCtx.q2Response.slice(0, 80).trim()}…`
          : worldCtx.q2Response;
      prefix = `Following your decision — ${decapitalise(respShort)} — things move quickly. `;
    } else {
      prefix = `A few weeks into building your business, a real decision has arrived. `;
    }
  } else if (worldCtx && worldCtx.choiceHistory.length > 0) {
    const last = worldCtx.choiceHistory[0];
    prefix = `After choosing to ${decapitalise(last.choiceLabel)} (${last.effectSummary}), the next moment lands. `;
  }
  return {
    narrative: `${prefix}${skeleton.situationSeed}`,
    choices: skeleton.choiceArchetypes.map(
      (a) => a.archetypeDescription
    ) as [string, string, string],
    tensionHints: skeleton.choiceArchetypes.map(
      (a) => a.tensionAxis
    ) as [string, string, string],
  };
}
