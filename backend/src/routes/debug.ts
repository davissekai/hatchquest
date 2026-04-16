import type { FastifyPluginAsync } from "fastify";
import { getTrace } from "../engine/trace.js";

export const debugRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  if (process.env["DEBUG_MODE"] !== "1") return;

  fastify.get<{ Params: { sessionId: string } }>(
    "/debug/trace/:sessionId",
    async (request, reply) => {
      const { sessionId } = request.params;
      const traces = getTrace(sessionId);
      return reply.status(200).send({ sessionId, traces });
    }
  );
};
