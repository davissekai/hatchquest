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
  StoryMemory,
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

// Cap on businessDescription chars in the turn context block.
// worldState.businessDescription is the raw Q1 text — we only need a short hint.
const BUSINESS_DESCRIPTION_PROMPT_CAP = 120;

function decapitalise(s: string): string {
  if (s.length === 0) return s;
  return s[0].toLowerCase() + s.slice(1);
}

const NARRATOR_SYSTEM_PROMPT = `You are a business simulation narrator set in Accra, Ghana, 2026.

You will receive:
1. A SITUATION SEED — the abstract scenario structure
2. Three CHOICE ARCHETYPES — the structural choices available
3. WORLD CONDITIONS — current market signals the player can feel
4. TURN CONTEXT — the player's sector, business label, story memory, recent
   choices, turn number, and whether this is the very first scenario turn.

Your job: generate a scenario that feels like it is happening to THIS player's specific business, in THIS sector, in Accra.

Return ONLY valid JSON with this exact shape:
{
  "narrative": "<2-3 paragraph scenario description, grounded in the player's sector>",
  "choices": ["<choice 1 text>", "<choice 2 text>", "<choice 3 text>"],
  "tensionHints": ["<hint 1>", "<hint 2>", "<hint 3>"]
}

Sector framing rules — use the EXACT sector label from TURN CONTEXT:
- "tech" → mobile app / platform / software business. Frame around users, bugs, features, growth.
- "agri" → farming, produce, supply chain, rural/peri-urban buyers and sellers. Frame around harvests, logistics, market prices, buyers.
- "retail" → physical or online shop. Frame around stock, customers, suppliers, location.
- "food" → restaurant, catering, street food, snacks. Frame around recipe, supply, footfall, quality.
- "services" → consulting, cleaning, logistics, repairs. Frame around clients, capacity, reputation.
- "other" → general small business. Frame around customers, product, operations.
Never mix sector framings. An agri player never deals with app bugs. A tech player never handles a harvest.

Continuity rules:
- If IS_FIRST_SCENARIO_TURN is YES and STORY_MEMORY is provided:
  the narrative MUST be the direct next chapter of the story described in
  STORY_MEMORY. Reference the 'last beat' and continue from the 'open thread'
  within the 'current arc'. Do NOT start a random new event.
  The 3 choices must emerge naturally from this exact narrative thread.
  Open with a short time-marker: "A week after...", "Two days after your decision...".
- If IS_FIRST_SCENARIO_TURN is YES and no STORY_MEMORY is provided:
  open with a short time-bridge only: "A few weeks into building ${businessLabel},..."
  Keep it under 15 words.
- If IS_FIRST_SCENARIO_TURN is no and RECENT CHOICES are present:
  open with one sentence recalling RECENT[0] before the new situation.

Other rules:
- Use the provided BUSINESS_LABEL to refer to the player's business.
- Use Accra-specific details: locations, GHS currency, local business culture.
- Narrative must be rich and immersive, ~3 paragraphs. Up to 1500 characters.
- Choices must be 1–3 sentences each, action-oriented, specific to this exact scenario.
- Tension hints describe the dilemma without EO jargon.
- No markdown, no code fence, JSON only.`;

export interface NarrationWorldContext {
  marketHeat: number;          // [0-100]
  competitorThreat: number;    // [0-100]
  infrastructureStability: number; // [0-100]
  capital: number;
  lastEventNarrativeHook: string | null;
  /** Player's business sector — drives framing ("tech" vs "retail" vs ...). */
  sector: BusinessSector;
  /** Clean, display-safe label for the business (e.g., "Makola Logistics Hub"). */
  businessLabel: string;
  /** Short summary of the business. */
  businessSummary: string;
  /** Narrative continuity memory from the Layer 0 arc. */
  storyMemory: StoryMemory | null;
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
 * businessLabel and businessSummary provide the identity context without
 * raw user text leakage.
 * On the first scenario turn, storyMemory is provided so the LLM can
 * continue the story directly from the player's Layer 0 arc.
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

  let storyBlock = "";
  if (ctx.isFirstScenarioTurn && ctx.storyMemory) {
    storyBlock =
      `\n- STORY_MEMORY: { lastBeat: "${ctx.storyMemory.lastBeatSummary}", openThread: "${ctx.storyMemory.openThread}", arc: "${ctx.storyMemory.currentArc}" }`;
  }

  return `TURN CONTEXT:
- Sector: ${ctx.sector}
- BUSINESS_LABEL: ${ctx.businessLabel}
- BUSINESS_SUMMARY: ${ctx.businessSummary}
- Turn number: ${ctx.turnNumber}
- Is first scenario turn: ${ctx.isFirstScenarioTurn ? "YES" : "no"}
- Recent choices: ${recent}${storyBlock}`;
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

  // Sector and story context travel through worldBlock (TURN CONTEXT).
  // Raw Q1/Q2 text is intentionally excluded from the user prompt — the LLM
  // should frame from sector + Q2 story arc, not echo the player's essay.
  void context; // PlayerContext kept in signature for API stability

  const userPrompt = `SITUATION SEED: ${skeleton.situationSeed}${worldBlock}

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
    if (worldCtx.storyMemory) {
      prefix = `Following your decision — ${decapitalise(worldCtx.storyMemory.lastBeatSummary)} — things move quickly. `;
    } else {
      prefix = `A few weeks into building ${worldCtx.businessLabel || "your business"}, a real decision has arrived. `;
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
