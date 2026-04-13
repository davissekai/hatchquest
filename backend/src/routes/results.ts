import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ISessionStore } from "../store/types.js";
import type { EOProfile } from "@hatchquest/shared";
import { toClientState } from "./helpers.js";

// Options injected when registering this plugin.
export interface ResultsRouteOptions {
  store: ISessionStore;
}

// Route params for GET /results/:sessionId.
interface ResultsParams {
  sessionId: string;
}

/**
 * Generates a deterministic summary from an EO profile.
 * Identifies the player's dominant and weakest dimensions and crafts
 * a 2-3 sentence narrative specific to their profile.
 * Exported for unit testing.
 */
export function generateSummary(profile: EOProfile): string {
  const entries = Object.entries(profile) as [keyof EOProfile, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [strongest] = entries[0];
  const [, strongestScore] = entries[0];
  const [, weakestScore] = entries[4];

  const strongLabel: Record<keyof EOProfile, string> = {
    autonomy: "strong independent streak",
    innovativeness: "tendency to experiment and create novel solutions",
    riskTaking: "willingness to commit resources to bold, uncertain ventures",
    proactiveness: "opportunity-seeking, forward-looking mindset",
    competitiveAggressiveness: "intensity in challenging rivals and defending your position",
  };

  const weakLabel: Record<keyof EOProfile, string> = {
    autonomy: "preferred collaboration and seeking input from others",
    innovativeness: "preference for proven approaches over experimentation",
    riskTaking: "careful, risk-aware approach that protects what you've built",
    proactiveness: "thoughtful deliberation before taking action",
    competitiveAggressiveness: "measured, relationship-oriented competitive style",
  };

  let summary = `Your entrepreneurial profile shows a ${strongLabel[strongest]}`;
  summary += `, with ${strongest} scoring ${strongestScore.toFixed(1)} out of 10. `;
  summary += `At the same time, your ${weakestScore.toFixed(1)} score on the opposite end suggests ${weakLabel[entries[4][0]]}. `;

  if (strongestScore >= 7) {
    summary += `This is a strong signal — you consistently favored bold action in this dimension.`;
  } else if (strongestScore >= 4) {
    summary += `This is a moderate signal — you balanced this dimension with other priorities across your decisions.`;
  } else {
    summary += `Your profile suggests you may benefit from leaning into this dimension as you develop as a founder.`;
  }

  return summary;
}

/**
 * Handles GET /results/:sessionId.
 * Only available once isComplete = true.
 * Reveals the eoProfile that was hidden from the client throughout gameplay.
 */
async function handleGetResults(
  request: FastifyRequest<{ Params: ResultsParams }>,
  reply: FastifyReply,
  store: ISessionStore
): Promise<void> {
  const { sessionId } = request.params;

  const session = await store.getSession(sessionId);
  if (!session) {
    return reply.status(404).send({ error: `Session not found: ${sessionId}` });
  }

  const { worldState } = session;

  // Results are only available once the game has ended.
  if (!worldState.isComplete) {
    return reply
      .status(409)
      .send({ error: "Results are not available until the game is complete." });
  }

  return reply.status(200).send({
    sessionId,
    session,
    eoProfile: worldState.eoProfile,
    clientState: toClientState(worldState),
    summary: generateSummary(worldState.eoProfile),
  });
}

/**
 * Fastify plugin that registers GET /results/:sessionId.
 * Accepts store as an option for testability.
 */
export const resultsRoutes: FastifyPluginAsync<ResultsRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store } = options;

  fastify.get<{ Params: ResultsParams }>("/results/:sessionId", async (request, reply) => {
    return handleGetResults(request, reply, store);
  });
};
