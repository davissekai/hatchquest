import type { FastifyPluginAsync } from "fastify";
import type { ClassifyRequest, ClassifyResponse } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import { assessLayer0 } from "../engine/classifier.js";

interface ClassifyPluginOptions {
  store: ISessionStore;
}

const classifyBodySchema = {
  type: "object",
  required: ["sessionId", "response"],
  properties: {
    sessionId: { type: "string", minLength: 1 },
    response: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

type ClassifyReply = ClassifyResponse | { error: string };

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

      const session = await store.getSession(sessionId);
      if (!session) {
        return reply
          .status(404)
          .send({ error: `Session not found: ${sessionId}` });
      }

      if (
        session.worldState.layer > 0 ||
        session.worldState.currentNodeId !== null
      ) {
        return reply
          .status(409)
          .send({ error: "Session is already classified." });
      }

      const assessment = await assessLayer0(response);

      await store.updateSession(sessionId, {
        worldState: {
          ...session.worldState,
          layer: 1,
          currentNodeId: assessment.layer1NodeId,
          sector: assessment.sector,
          eoProfile: assessment.initialEOProfile,
        },
      });

      return reply.status(200).send({
        sessionId,
        layer1NodeId: assessment.layer1NodeId,
      });
    }
  );
};
