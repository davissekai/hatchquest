/**
 * Narrator AI — generates personalised scenario narrative from a skeleton + PlayerContext.
 *
 * The Narrator AI is the bridge between static EO-valid skeleton structure and
 * the player's specific business context. It skins each skeleton with the player's
 * business description and motivation before the scenario is sent to the client.
 *
 * Pipeline:
 *   generateNarrativeSkin(skeleton, context)
 *     → LLM call (Claude Haiku) if ANTHROPIC_API_KEY is set
 *     → buildFallbackSkin(skeleton, context) on any failure or missing key
 *
 * The fallback is deterministic and always produces a valid NarrativeSkin,
 * ensuring the game cannot break due to an API failure.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ScenarioSkeleton, NarrativeSkin, PlayerContext } from "@hatchquest/shared";

const NARRATOR_TIMEOUT_MS = 12_000;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

const NARRATOR_SYSTEM_PROMPT = `You are a business simulation narrator set in Accra, Ghana, 2026.

You will receive:
1. A SITUATION SEED — the abstract scenario structure
2. A PLAYER CONTEXT — their specific business and motivation
3. Three CHOICE ARCHETYPES — the structural choices available

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
- Choices must be 1-2 sentences each, action-oriented
- Tension hints must describe the dilemma without using EO terminology
- No markdown, no code fence, JSON only`;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, timeout: NARRATOR_TIMEOUT_MS, maxRetries: 0 });
}

/**
 * Generates a personalised NarrativeSkin using the LLM.
 * Falls back to buildFallbackSkin on any failure, including timeout or missing API key.
 */
export async function generateNarrativeSkin(
  skeleton: ScenarioSkeleton,
  context: PlayerContext
): Promise<NarrativeSkin> {
  const client = getClient();
  if (!client) return buildFallbackSkin(skeleton, context);

  const userPrompt = `SITUATION SEED: ${skeleton.situationSeed}

PLAYER CONTEXT:
- Business: ${context.businessDescription}
- Motivation: ${context.motivation}

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
    if (!match) return buildFallbackSkin(skeleton, context);

    const parsed = JSON.parse(match[0]) as NarrativeSkin;
    if (
      typeof parsed.narrative === "string" &&
      Array.isArray(parsed.choices) &&
      parsed.choices.length === 3 &&
      Array.isArray(parsed.tensionHints) &&
      parsed.tensionHints.length === 3
    ) {
      return {
        narrative: parsed.narrative,
        choices: parsed.choices as [string, string, string],
        tensionHints: parsed.tensionHints as [string, string, string],
      };
    }

    return buildFallbackSkin(skeleton, context);
  } catch {
    return buildFallbackSkin(skeleton, context);
  }
}

/**
 * Deterministic fallback — injects the player's business name into the skeleton's
 * situation seed and archetype descriptions. No LLM call required.
 */
export function buildFallbackSkin(
  skeleton: ScenarioSkeleton,
  context: PlayerContext
): NarrativeSkin {
  const biz = context.businessDescription;
  const seed = skeleton.situationSeed;
  // Lowercase the first character so the sentence reads naturally after "In your <biz>,"
  const seedLower = seed.charAt(0).toLowerCase() + seed.slice(1);

  return {
    narrative: `In your ${biz}, ${seedLower}`,
    choices: skeleton.choiceArchetypes.map(
      (a) => a.archetypeDescription
    ) as [string, string, string],
    tensionHints: skeleton.choiceArchetypes.map(
      (a) => a.tensionAxis
    ) as [string, string, string],
  };
}
