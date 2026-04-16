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
import type { ScenarioSkeleton, NarrativeSkin, PlayerContext } from "@hatchquest/shared";
import { isMockLLM, mockGenerateSkin } from "../lib/mock-anthropic.js";

const NARRATOR_TIMEOUT_MS = 12_000;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

// Accra-specific proper nouns always valid in narration
const GLOBAL_PROPER_NOUN_WHITELIST = ["Accra", "Ghana", "ECG", "BoG", "GHS", "Cedi", "Ghana Cedi"];

const NARRATOR_SYSTEM_PROMPT = `You are a business simulation narrator set in Accra, Ghana, 2026.

You will receive:
1. A SITUATION SEED — the abstract scenario structure
2. A PLAYER CONTEXT — their specific business and motivation
3. Three CHOICE ARCHETYPES — the structural choices available
4. WORLD CONDITIONS — current market signals the player can feel

Your job: generate a personalised scenario that feels like it is happening to THIS player's specific business, in THIS player's specific market, in Accra.

Return ONLY valid JSON with this exact shape:
{
  "narrative": "<2-3 paragraph scenario description, grounded in the player's business>",
  "choices": ["<choice 1 text>", "<choice 2 text>", "<choice 3 text>"],
  "tensionHints": ["<hint 1>", "<hint 2>", "<hint 3>"]
}

Rules:
- Reference the player's specific business by name/description
- Use Accra-specific details (locations, currency in GHS, local business culture)
- Narrative must be ≤600 characters
- Choices must be 1-2 sentences each, action-oriented
- Tension hints must describe the dilemma without using EO terminology
- No markdown, no code fence, JSON only`;

export interface NarrationWorldContext {
  marketHeat: number;          // [0-100]
  competitorThreat: number;    // [0-100]
  infrastructureStability: number; // [0-100]
  capital: number;
  lastEventNarrativeHook: string | null;
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
  if (output.narrative.length > 600) {
    return { ok: false, reason: `narrative too long: ${output.narrative.length} chars` };
  }

  // Proper-noun check: all words starting with a capital letter must be whitelisted
  // or be the player's business name words
  const allowed = new Set([
    ...GLOBAL_PROPER_NOUN_WHITELIST,
    ...skeleton.choiceArchetypes.flatMap((a) => a.archetypeDescription.split(/\s+/)),
    ...(playerBusinessName ? playerBusinessName.split(/\s+/) : []),
  ]);

  const capitalised = output.narrative.match(/\b[A-Z][a-z]{2,}/g) ?? [];
  const violations = capitalised.filter((w) => !allowed.has(w));
  if (violations.length > 0) {
    return { ok: false, reason: `unrecognised proper nouns: ${violations.slice(0, 3).join(", ")}` };
  }

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
  if (!client) return [buildFallbackSkin(skeleton, context), "fallback"];
  const worldBlock = worldCtx ? `\n\n${buildWorldConditionsBlock(worldCtx)}` : "";

  const userPrompt = `SITUATION SEED: ${skeleton.situationSeed}

PLAYER CONTEXT:
- Business: ${context.businessDescription}
- Motivation: ${context.motivation}${worldBlock}

CHOICE ARCHETYPES:
1. ${skeleton.choiceArchetypes[0].archetypeDescription} (tension: ${skeleton.choiceArchetypes[0].tensionAxis})
2. ${skeleton.choiceArchetypes[1].archetypeDescription} (tension: ${skeleton.choiceArchetypes[1].tensionAxis})
3. ${skeleton.choiceArchetypes[2].archetypeDescription} (tension: ${skeleton.choiceArchetypes[2].tensionAxis})`;

  try {
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      system: NARRATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return [buildFallbackSkin(skeleton, context), "fallback"];

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
        return [buildFallbackSkin(skeleton, context), "validator-rejected"];
      }
      return [skin, "llm"];
    }

    return [buildFallbackSkin(skeleton, context), "fallback"];
  } catch {
    return [buildFallbackSkin(skeleton, context), "fallback"];
  }
  /* c8 ignore stop */
}

/**
 * Deterministic fallback — uses the skeleton's situation seed directly.
 * No LLM call required. Always produces a valid NarrativeSkin.
 */
export function buildFallbackSkin(
  skeleton: ScenarioSkeleton,
  _context: PlayerContext
): NarrativeSkin {
  return {
    narrative: skeleton.situationSeed,
    choices: skeleton.choiceArchetypes.map(
      (a) => a.archetypeDescription
    ) as [string, string, string],
    tensionHints: skeleton.choiceArchetypes.map(
      (a) => a.tensionAxis
    ) as [string, string, string],
  };
}
