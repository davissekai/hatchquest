import type { FastifyPluginAsync } from "fastify";
import type { ClassifyRequest, ClassifyResponse } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import { classify } from "../engine/classifier.js";

// Plugin options carry the store so tests can inject a fresh instance
// rather than relying on the module-level singleton.
interface ClassifyPluginOptions {
  store: ISessionStore;
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

// Union reply type: success shape or a plain error message for 404
type ClassifyReply = ClassifyResponse | { error: string };

/** Registers the POST /classify route against the injected ISessionStore. */
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
      const session = await store.getSession(sessionId);
      if (!session) {
        return reply
          .status(404)
          .send({ error: `Session not found: ${sessionId}` });
      }

      // Guard: reject double-classification — layer > 0 means /classify already ran.
      // TOCTOU: known race window — two concurrent classify calls could both pass this guard
      // before either writes the updated layer value. Acceptable for demo scope.
      if (session.worldState.layer > 0 || session.worldState.currentNodeId !== null) {
        return reply.status(409).send({ error: "Session is already classified." });
      }

      // Classify free-text response → Layer 1 node id.
      // Tries LLM (Claude Haiku) first; falls back to keyword heuristic.
      const layer1NodeId = await classify(response);

      // Advance world state into Layer 1 with the classified node
      await store.updateSession(sessionId, {
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
