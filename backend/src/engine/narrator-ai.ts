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
const BUSINESS_SUMMARY_PROMPT_CAP = 140;

const BANNED_PROPER_NOUNS = new Set([
  "Apple",
  "Google",
  "Amazon",
  "Microsoft",
  "Stripe",
  "Shopify",
]);

function decapitalise(s: string): string {
  if (s.length === 0) return s;
  return s[0].toLowerCase() + s.slice(1);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxChars: number): string {
  const clean = normalizeWhitespace(text);
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}…`;
}

function buildLeakPhrases(raw: string): string[] {
  const words = normalizeForComparison(raw).split(" ").filter((word) => word.length > 2);
  if (words.length < 5) return [];

  const phrases: string[] = [];
  const windowSize = Math.min(7, words.length);
  const maxWindows = Math.min(4, words.length - windowSize + 1);

  for (let i = 0; i < maxWindows; i += 1) {
    phrases.push(words.slice(i, i + windowSize).join(" "));
  }

  return phrases;
}

function containsRawLeakage(output: NarrativeSkin, context: PlayerContext): boolean {
  // Filter short words to match the same token stream buildLeakPhrases produces.
  const filterShort = (text: string) =>
    normalizeForComparison(text).split(" ").filter((w) => w.length > 2).join(" ");

  const renderedFiltered = filterShort(
    `${output.narrative} ${output.choices.join(" ")}`
  );
  // Only rawQ1Response is contraband. Q2 prompt is game-generated scenario text
  // and Q2 response is summarised into storyMemory — both are meant to carry
  // forward into the first L1 beat, so detecting them here blocks legitimate
  // narrative continuity. Q1 is the founder's free-form pitch and must never echo.
  const rawSources = [context.rawQ1Response];

  return rawSources.some((source) => {
    if (!source) return false;
    return buildLeakPhrases(source).some(
      (phrase) => phrase.length >= 28 && renderedFiltered.includes(phrase)
    );
  });
}

function startsWithTimeMarker(narrative: string): boolean {
  return /^(A|An|One|Two|Three|Several)\b.+?(day|days|week|weeks|month|months)\b/i.test(
    narrative
  );
}

function contentWords(text: string): Set<string> {
  return new Set(
    normalizeForComparison(text).split(" ").filter((w) => w.length > 3)
  );
}

function wordOverlapRatio(signal: string, narrative: string): number {
  const signalWords = contentWords(signal);
  if (signalWords.size === 0) return 0;
  const narrativeWords = contentWords(narrative);
  let matches = 0;
  for (const word of signalWords) {
    if (narrativeWords.has(word)) matches++;
  }
  return matches / signalWords.size;
}

// Passes when ≥40% of content words from any storyMemory signal appear in
// the narrative — tolerant of LLM paraphrasing while still blocking drift.
function hasFirstTurnContinuity(
  narrative: string,
  storyMemory: StoryMemory
): boolean {
  const signals = [
    storyMemory.openThread,
    storyMemory.continuityAnchor,
    storyMemory.lastBeatSummary,
  ].filter((s) => s.length >= 10);

  return signals.some((signal) => wordOverlapRatio(signal, narrative) >= 0.4);
}

const NARRATOR_SYSTEM_PROMPT = `You are a business simulation narrator set in Accra, Ghana, 2026.

You will receive:
1. A CONTINUITY PRIORITY block when this is the first gameplay turn
2. A SITUATION SEED — the abstract scenario structure
3. Three CHOICE ARCHETYPES — the structural choices available
4. WORLD CONDITIONS — current market signals the player can feel
5. TURN CONTEXT — clean, display-safe business identity plus story memory

Your job: generate a scenario that feels like it is happening to THIS player's business, in THIS sector, in Accra.

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
Never mix sector framings.

Continuity rules:
- If IS_FIRST_SCENARIO_TURN is YES and STORY_MEMORY is provided, STORY_MEMORY is the highest priority instruction.
- Continue directly from the last beat, unresolved thread, and continuity anchor before introducing the situation seed.
- Treat the situation seed as the next escalation in the same story, not a reset.
- Open with a short time-marker such as "Two days after..." or "A week after...".
- Never quote or closely echo the founder's raw Layer 0 answers.
- The 3 choices must emerge naturally from this exact narrative thread.
- If IS_FIRST_SCENARIO_TURN is no and RECENT CHOICES are present, open with one sentence recalling the most recent choice.

Other rules:
- Use the provided BUSINESS_LABEL to refer to the player's business.
- Use Accra-specific details: locations, GHS currency, local business culture.
- Narrative must be rich and immersive, ~3 paragraphs. Up to 1500 characters.
- Choices must be 1–3 sentences each, action-oriented, specific to this exact scenario.
- Tension hints describe the dilemma without EO jargon.
- No markdown, no code fence, JSON only.`;

export interface NarrationWorldContext {
  marketHeat: number;
  competitorThreat: number;
  infrastructureStability: number;
  capital: number;
  lastEventNarrativeHook: string | null;
  sector: BusinessSector;
  businessLabel: string;
  businessSummary: string;
  storyMemory: StoryMemory | null;
  choiceHistory: RecentChoice[];
  turnNumber: number;
  isFirstScenarioTurn: boolean;
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
  const threatLabel =
    ctx.competitorThreat > 65 ? "aggressive" : ctx.competitorThreat > 35 ? "present" : "quiet";
  const infraLabel =
    ctx.infrastructureStability > 65
      ? "reliable"
      : ctx.infrastructureStability > 35
        ? "patchy"
        : "unreliable";
  const capitalStr = `GHS ${ctx.capital.toLocaleString("en-GH")}`;

  return `WORLD CONDITIONS:
- Market demand: ${heatLabel} (${Math.round(ctx.marketHeat)}/100)
- Competitor pressure: ${threatLabel} (${Math.round(ctx.competitorThreat)}/100)
- Infrastructure: ${infraLabel} (${Math.round(ctx.infrastructureStability)}/100)
- Current capital: ${capitalStr}
- Last world event: ${ctx.lastEventNarrativeHook ?? "none"}`;
}

export function buildTurnContextBlock(ctx: NarrationWorldContext): string {
  const recent =
    ctx.choiceHistory.length === 0
      ? "none yet"
      : ctx.choiceHistory
          .map(
            (choice, index) =>
              `${index === 0 ? "MOST RECENT" : `prior ${index}`}: "${choice.choiceLabel}" (${choice.effectSummary})`
          )
          .join("; ");

  const businessSummary = ctx.businessSummary.trim().length > 0
    ? truncate(ctx.businessSummary, BUSINESS_SUMMARY_PROMPT_CAP)
    : "(not provided)";

  const storyBlock =
    ctx.isFirstScenarioTurn && ctx.storyMemory
      ? `
- STORY_MEMORY: { lastBeat: "${ctx.storyMemory.lastBeatSummary}", openThread: "${ctx.storyMemory.openThread}", continuityAnchor: "${ctx.storyMemory.continuityAnchor}", decisionStyle: "${ctx.storyMemory.recentDecisionStyle ?? "not provided"}", arc: "${ctx.storyMemory.currentArc}" }
- FIRST_TURN_PRIORITY: Continue directly from STORY_MEMORY before using the situation seed.`
      : "";

  return `TURN CONTEXT:
- Sector: ${ctx.sector}
- BUSINESS_LABEL: ${ctx.businessLabel}
- BUSINESS_SUMMARY: ${businessSummary}
- Turn number: ${ctx.turnNumber}
- Is first scenario turn: ${ctx.isFirstScenarioTurn ? "YES" : "no"}
- Recent choices: ${recent}${storyBlock}`;
}

export function validateNarration(
  output: NarrativeSkin,
  skeleton: ScenarioSkeleton,
  context: PlayerContext,
  worldCtx?: NarrationWorldContext
): { ok: boolean; reason?: string } {
  if (output.choices.length !== 3) {
    return { ok: false, reason: "expected exactly 3 choices" };
  }
  if (output.narrative.length > 1500) {
    return { ok: false, reason: `narrative too long: ${output.narrative.length} chars` };
  }
  if (containsRawLeakage(output, context)) {
    return { ok: false, reason: "narrative appears to leak raw Layer 0 text" };
  }

  const capitalised = output.narrative.match(/\b[A-Z][a-z]{2,}/g) ?? [];
  const violations = capitalised.filter((word) => BANNED_PROPER_NOUNS.has(word));
  if (violations.length > 0) {
    return { ok: false, reason: `banned proper nouns: ${violations.slice(0, 3).join(", ")}` };
  }

  if (worldCtx?.isFirstScenarioTurn && worldCtx.storyMemory) {
    if (!startsWithTimeMarker(output.narrative)) {
      return { ok: false, reason: "first-turn narration must open with a time marker" };
    }
    if (!hasFirstTurnContinuity(output.narrative, worldCtx.storyMemory)) {
      return { ok: false, reason: "first-turn narration drifted away from story memory" };
    }
  }

  void skeleton;
  return { ok: true };
}

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
  const continuityDirective =
    worldCtx?.isFirstScenarioTurn && worldCtx.storyMemory
      ? `FIRST TURN CONTINUITY PRIORITY:\n- Continue directly from STORY_MEMORY and CONTINUITY_ANCHOR.\n- Treat the SITUATION SEED as the next escalation in the same story.\n- Do not quote the founder's raw wording.`
      : "";

  const userPrompt = `${continuityDirective ? `${continuityDirective}\n\n` : ""}SITUATION SEED: ${
    skeleton.situationSeed
  }${worldBlock}

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
      const validation = validateNarration(skin, skeleton, context, worldCtx);
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

export function buildFallbackSkin(
  skeleton: ScenarioSkeleton,
  _context: PlayerContext,
  worldCtx?: NarrationWorldContext
): NarrativeSkin {
  let narrative = skeleton.situationSeed;

  if (worldCtx?.isFirstScenarioTurn) {
    if (worldCtx.storyMemory) {
      narrative = `Two days after ${decapitalise(
        worldCtx.storyMemory.continuityAnchor
      )}, ${worldCtx.storyMemory.openThread} is still hanging over ${
        worldCtx.businessLabel
      }. ${worldCtx.storyMemory.lastBeatSummary} ${skeleton.situationSeed}`;
    } else {
      narrative = `A few weeks into building ${
        worldCtx.businessLabel || "your business"
      }, pressure is starting to concentrate. ${skeleton.situationSeed}`;
    }
  } else if (worldCtx && worldCtx.choiceHistory.length > 0) {
    const last = worldCtx.choiceHistory[0];
    narrative = `After choosing to ${decapitalise(last.choiceLabel)} (${last.effectSummary}), the next pressure lands. ${skeleton.situationSeed}`;
  }

  return {
    narrative,
    choices: skeleton.choiceArchetypes.map(
      (archetype) => archetype.archetypeDescription
    ) as [string, string, string],
    tensionHints: skeleton.choiceArchetypes.map(
      (archetype) => archetype.tensionAxis
    ) as [string, string, string],
  };
}
