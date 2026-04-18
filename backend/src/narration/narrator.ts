import type { EOProfile, ScenarioNode, WorldState } from "@hatchquest/shared";
import { callLLM } from "../lib/llm-client.js";

const NARRATION_TIMEOUT_MS = 3_500;

const SCENARIO_SYSTEM_PROMPT = `You are the narrative voice for HatchQuest, a serious entrepreneurship simulation set in Accra, Ghana.
Rewrite the supplied scenario into immersive but concise second-person game copy.
Rules:
- Preserve the business decision and stakes exactly
- Keep it under 95 words
- Use 2 to 4 sentences
- Keep the setting grounded in Accra and small-business reality
- Mention the supplied world-state pressures naturally if helpful
- Do not mention EO, scoring, assessment, metadata, JSON, or analysis
- Return plain text only`;

const RESULTS_SYSTEM_PROMPT = `You are the closing narrative voice for HatchQuest.
Write a short results summary for the founder.
Rules:
- Keep it under 110 words
- Use 2 to 4 sentences
- Reference the founder's specific business description and sector — make the
  summary feel like it is about their venture, not a generic founder.
- The EO DIMENSION SCORES block lists autonomy, innovativeness, riskTaking,
  proactiveness, and competitiveAggressiveness each on a 0–10 scale. Your
  language MUST match those numbers. Never call a score of 6+ "low" or "held
  back". Never call a score of 4 or less "strong".
- If final capital is negative AND revenue is positive, describe it as cash
  burn exceeding gross revenue — acknowledge the loss explicitly. Do not
  frame a negative-capital ending as "building something real" without first
  naming the shortfall in plain language.
- Encouraging but honest; never generic hype
- Do not mention EO labels as a list
- Return plain text only`;

function formatCurrency(value: number): string {
  return `GHS ${Math.round(value).toLocaleString()}`;
}

function describeDemand(demand: number): string {
  if (demand >= 70) return "the market is running hot";
  if (demand >= 45) return "demand feels steady but not forgiving";
  return "buyers are cautious and every sale is hard won";
}

function describeInfrastructure(reliability: number): string {
  if (reliability >= 70) return "operations feel unusually stable for Accra right now";
  if (reliability >= 45) return "power and logistics could wobble at any moment";
  return "dumsor and operational disruption are hanging over the week";
}

function describeCompetition(aggression: number): string {
  if (aggression >= 70) return "competitors are moving aggressively and watching every opening";
  if (aggression >= 45) return "rivals are alert and ready to react";
  return "competitors are present, but not yet dictating your next move";
}

function strongestDimension(profile: EOProfile): [keyof EOProfile, number] {
  return (Object.entries(profile) as [keyof EOProfile, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0];
}

function weakestDimension(profile: EOProfile): [keyof EOProfile, number] {
  return (Object.entries(profile) as [keyof EOProfile, number][]).sort(
    (a, b) => a[1] - b[1]
  )[0];
}

function dimensionLabel(dimension: keyof EOProfile): string {
  switch (dimension) {
    case "autonomy":
      return "independent calls";
    case "innovativeness":
      return "experimentation";
    case "riskTaking":
      return "bold commitments";
    case "proactiveness":
      return "moving before the market settles";
    case "competitiveAggressiveness":
      return "direct competitive pressure";
  }
}

export function buildScenarioWorldStateBrief(state: WorldState): string {
  const business = state.playerContext?.businessLabel || state.playerContext?.businessDescription || "undisclosed";
  return [
    `Business: ${business}`,
    `Capital: ${formatCurrency(state.capital)}`,
    `Monthly burn: ${formatCurrency(state.monthlyBurn)}`,
    `Revenue: ${formatCurrency(state.revenue)}`,
    `Debt: ${formatCurrency(state.debt)}`,
    `Reputation: ${state.reputation}/100`,
    `Network: ${state.networkStrength}/100`,
    `Market demand: ${describeDemand(state.marketDemand)}`,
    `Infrastructure: ${describeInfrastructure(state.infrastructureReliability)}`,
    `Competition: ${describeCompetition(state.competitorAggression)}`,
  ].join("\n");
}

export function buildDeterministicScenarioNarrative(
  node: ScenarioNode,
  state: WorldState
): string {
  const pressureSentence = `${describeDemand(state.marketDemand)}, ${describeCompetition(
    state.competitorAggression
  )}, and ${describeInfrastructure(state.infrastructureReliability)}.`;

  const runwaySentence = `You are carrying ${formatCurrency(
    state.capital
  )} in capital against a monthly burn of ${formatCurrency(
    state.monthlyBurn
  )}, so the next move will land immediately.`;

  return `${node.narrative}\n\n${pressureSentence} ${runwaySentence}`;
}

export function buildDeterministicResultsSummary(state: WorldState): string {
  const [strongest, strongestScore] = strongestDimension(state.eoProfile);
  const [weakest] = weakestDimension(state.eoProfile);
  const businessHealth =
    state.capital < 0
      ? "You finished in the red — cash burn outran gross revenue and the run closed with a shortfall"
      : state.capital >= 20_000
        ? "You finished with real financial breathing room"
        : state.capital >= 8_000
          ? "You kept the business alive with disciplined resource management"
          : "You finished under pressure, but still standing";

  return `${businessHealth}: ${formatCurrency(state.capital)} in capital, ${state.reputation}/100 reputation, and ${state.networkStrength}/100 network strength. Your path was defined most by ${dimensionLabel(
    strongest
  )} (${strongestScore.toFixed(1)}/10), while ${dimensionLabel(
    weakest
  )} stayed more restrained — a reminder of where your next growth edge may sit.`;
}

async function callAnthropicNarration(
  system: string,
  userPrompt: string,
  maxTokens: number
): Promise<string | null> {
  return callLLM({ system, user: userPrompt, maxTokens, timeoutMs: NARRATION_TIMEOUT_MS });
}

export async function narrateScenarioNode(
  node: ScenarioNode | null,
  state: WorldState
): Promise<ScenarioNode | null> {
  if (!node) return null;

  const fallbackNarrative = buildDeterministicScenarioNarrative(node, state);
  const aiNarrative = await callAnthropicNarration(
    SCENARIO_SYSTEM_PROMPT,
    [
      `Base scenario: ${node.narrative}`,
      "World state:",
      buildScenarioWorldStateBrief(state),
      "Keep the same decision stakes.",
    ].join("\n\n"),
    140
  );

  return {
    ...node,
    narrative: aiNarrative ?? fallbackNarrative,
  };
}

export async function narrateResultsSummary(
  state: WorldState
): Promise<string> {
  const fallbackSummary = buildDeterministicResultsSummary(state);
  const [strongest, strongestScore] = strongestDimension(state.eoProfile);
  const [weakest, weakestScore] = weakestDimension(state.eoProfile);

  // Explicit EO scores + capital/revenue reconciliation are surfaced to
  // the LLM so its narrative language has to match the radar chart and
  // cannot contradict a negative capital result.
  const aiSummary = await callAnthropicNarration(
    RESULTS_SYSTEM_PROMPT,
    [
      `Business: ${state.playerContext?.businessLabel || "undisclosed"}`,
      `Sector: ${state.sector}`,
      `Final capital: ${formatCurrency(state.capital)}${state.capital < 0 ? " (NEGATIVE — cash shortfall)" : ""}`,
      `Final revenue: ${formatCurrency(state.revenue)}`,
      `Debt: ${formatCurrency(state.debt)}`,
      `Reputation: ${state.reputation}/100`,
      `Network: ${state.networkStrength}/100`,
      "",
      "EO DIMENSION SCORES (0-10, must match your language):",
      `- autonomy: ${state.eoProfile.autonomy.toFixed(1)}`,
      `- innovativeness: ${state.eoProfile.innovativeness.toFixed(1)}`,
      `- riskTaking: ${state.eoProfile.riskTaking.toFixed(1)}`,
      `- proactiveness: ${state.eoProfile.proactiveness.toFixed(1)}`,
      `- competitiveAggressiveness: ${state.eoProfile.competitiveAggressiveness.toFixed(1)}`,
      "",
      `Strongest signal: ${strongest} (${strongestScore.toFixed(1)}/10)`,
      `Weakest signal: ${weakest} (${weakestScore.toFixed(1)}/10)`,
      `Context: ${describeDemand(state.marketDemand)}; ${describeCompetition(
        state.competitorAggression
      )}; ${describeInfrastructure(state.infrastructureReliability)}.`,
    ].join("\n"),
    170
  );

  return aiSummary ?? fallbackSummary;
}
