import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ScenarioNode } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import { narrateScenarioNode } from "../narration/narrator.js";
import { toClientState } from "./helpers.js";

export interface SessionRegistry {
  getNode: (nodeId: string | null) => ScenarioNode | null;
}

export interface SessionRouteOptions {
  store: ISessionStore;
  getNode: SessionRegistry["getNode"];
}

interface SessionParams {
  sessionId: string;
}

async function handleGetSession(
  request: FastifyRequest<{ Params: SessionParams }>,
  reply: FastifyReply,
  store: ISessionStore,
  getNode: SessionRegistry["getNode"]
): Promise<void> {
  const { sessionId } = request.params;

  const session = await store.getSession(sessionId);
  if (!session) {
    return reply.status(404).send({ error: `Session not found: ${sessionId}` });
  }

  const { worldState } = session;
  const currentNode = await narrateScenarioNode(
    getNode(worldState.currentNodeId),
    worldState
  );

  return reply.status(200).send({
    sessionId,
    clientState: toClientState(worldState),
    currentNode,
  });
}

export const sessionRoutes: FastifyPluginAsync<SessionRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store, getNode } = options;

  fastify.get<{ Params: SessionParams }>(
    "/session/:sessionId",
    async (request, reply) => {
      return handleGetSession(request, reply, store, getNode);
    }
  );
};
