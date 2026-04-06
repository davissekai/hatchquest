import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ScenarioNode } from "@hatchquest/shared";
import type { SessionStore } from "../store/session-store.js";
import { toClientState } from "./helpers.js";

// Registry dependency interface — injected by callers so tests can stub it.
export interface SessionRegistry {
  /** Returns the client-safe node for a given id, or null if not found. */
  getNode: (nodeId: string | null) => ScenarioNode | null;
}

// Options injected when registering this plugin.
export interface SessionRouteOptions {
  store: SessionStore;
  getNode: SessionRegistry["getNode"];
}

// Route params for GET /session/:sessionId.
interface SessionParams {
  sessionId: string;
}

/**
 * Handles GET /session/:sessionId.
 * Returns the current session state for reconnect / resume flows.
 * currentNode is null when the player has not yet passed Layer 0 classification.
 */
async function handleGetSession(
  request: FastifyRequest<{ Params: SessionParams }>,
  reply: FastifyReply,
  store: SessionStore,
  getNode: SessionRegistry["getNode"]
): Promise<void> {
  const { sessionId } = request.params;

  const session = store.getSession(sessionId);
  if (!session) {
    return reply.status(404).send({ error: `Session not found: ${sessionId}` });
  }

  const { worldState } = session;

  // currentNodeId is null before /classify has run — getNode handles null safely
  const currentNode: ScenarioNode | null = getNode(worldState.currentNodeId);

  return reply.status(200).send({
    sessionId,
    clientState: toClientState(worldState),
    currentNode,
  });
}

/**
 * Fastify plugin that registers GET /session/:sessionId.
 * Accepts store and registry function as options for testability.
 */
export const sessionRoutes: FastifyPluginAsync<SessionRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store, getNode } = options;

  fastify.get<{ Params: SessionParams }>("/session/:sessionId", async (request, reply) => {
    return handleGetSession(request, reply, store, getNode);
  });
};
