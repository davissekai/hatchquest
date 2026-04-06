import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ISessionStore } from "../store/types.js";
import { toClientState } from "./helpers.js";

// Options injected when registering this plugin.
export interface ResultsRouteOptions {
  store: ISessionStore;
}

// Route params for GET /results/:sessionId.
interface ResultsParams {
  sessionId: string;
}

// Stub summary text — TODO: replace with Claude-generated summary using eoProfile + playthrough data.
const RESULTS_SUMMARY_STUB =
  "Your entrepreneurial orientation profile has been assessed. Review your EO dimensions below.";

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
      .status(400)
      .send({ error: "Results are not available until the game is complete." });
  }

  return reply.status(200).send({
    sessionId,
    session,
    eoProfile: worldState.eoProfile,
    clientState: toClientState(worldState),
    summary: RESULTS_SUMMARY_STUB,
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
