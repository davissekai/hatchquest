import type { FastifyPluginAsync } from "fastify";
import type { ClassifyRequest, ClassifyResponse } from "@hatchquest/shared";
import type { SessionStore } from "../store/session-store.js";

// Plugin options carry the store so tests can inject a fresh instance
// rather than relying on the module-level singleton.
interface ClassifyPluginOptions {
  store: SessionStore;
}

/** JSON Schema for POST /classify body validation. */
const classifyBodySchema = {
  type: "object",
  required: ["sessionId", "response"],
  properties: {
    sessionId: { type: "string", minLength: 1 },
    response: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

/**
 * Stub classifier — returns a fixed Layer 1 node id.
 * TODO: Replace with real LLM classifier (Claude API) that maps free-text
 * response to EOPoleDistribution and selects among the 5 L1 world-states.
 * Fallback to keyword heuristic if the API call times out.
 */
function classifyResponse(_response: string): string {
  return "L1-node-1";
}

// Union reply type: success shape or a plain error message for 404
type ClassifyReply = ClassifyResponse | { error: string };

/** Registers the POST /classify route against the injected SessionStore. */
export const classifyRoutes: FastifyPluginAsync<ClassifyPluginOptions> = async (
  fastify,
  opts
) => {
  const { store } = opts;

  fastify.post<{ Body: ClassifyRequest; Reply: ClassifyReply }>(
    "/classify",
    {
      schema: { body: classifyBodySchema },
    },
    async (request, reply) => {
      const { sessionId, response } = request.body;

      // Resolve session — surface 404 instead of throwing internally
      const session = store.getSession(sessionId);
      if (!session) {
        return reply
          .status(404)
          .send({ error: `Session not found: ${sessionId}` });
      }

      const layer1NodeId = classifyResponse(response);

      // Advance world state into Layer 1 with the classified node
      store.updateSession(sessionId, {
        worldState: {
          ...session.worldState,
          layer: 1,
          currentNodeId: layer1NodeId,
        },
      });

      return reply.status(200).send({ sessionId, layer1NodeId });
    }
  );
};
