import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ScenarioNode } from "@hatchquest/shared";
import type { SessionStore } from "../store/session-store.js";
import type { ChoiceEffect } from "../engine/apply-choice.js";
import { applyChoice } from "../engine/apply-choice.js";
import { toClientState } from "./helpers.js";

// Registry dependency interface — injected by callers so tests can stub it.
export interface ChoiceRegistry {
  /** Returns the client-safe node for a given id, or null if not found / game over. */
  getNode: (nodeId: string | null) => ScenarioNode | null;
  /** Returns the ChoiceEffect for the given node and choice index, or null if unknown. */
  getChoiceEffect: (nodeId: string, choiceIndex: 0 | 1 | 2) => ChoiceEffect | null;
}

// Options injected when registering this plugin.
export interface ChoiceRouteOptions {
  store: SessionStore;
  getNode: ChoiceRegistry["getNode"];
  getChoiceEffect: ChoiceRegistry["getChoiceEffect"];
}

// Expected shape of the POST /choice request body.
interface ChoiceBody {
  sessionId: string;
  nodeId: string;
  choiceIndex: number; // validated to 0|1|2 at runtime
}

/** Validates that a value is a legal choice index (0, 1, or 2). */
function isValidChoiceIndex(v: unknown): v is 0 | 1 | 2 {
  return v === 0 || v === 1 || v === 2;
}

/** Validates that a body field is a non-empty string. */
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

/**
 * Handles POST /choice.
 * Validates the request, looks up the session, applies the player's choice,
 * and returns the updated client state plus the next scenario node.
 *
 * Guard order:
 *   1. Body field presence / type → 400
 *   2. Session existence → 404
 *   3. Session already complete → 409
 *   4. nodeId matches session's currentNodeId (double-submit guard) → 400
 *   5. ChoiceEffect existence → 400
 */
async function handleChoice(
  request: FastifyRequest<{ Body: ChoiceBody }>,
  reply: FastifyReply,
  store: SessionStore,
  getNode: ChoiceRegistry["getNode"],
  getChoiceEffect: ChoiceRegistry["getChoiceEffect"]
): Promise<void> {
  const { sessionId, nodeId, choiceIndex } = request.body ?? {};

  // --- Step 1: body validation ---
  if (!isNonEmptyString(sessionId) || !isNonEmptyString(nodeId)) {
    return reply.status(400).send({ error: "sessionId and nodeId are required strings." });
  }
  if (!isValidChoiceIndex(choiceIndex)) {
    return reply.status(400).send({ error: "choiceIndex must be 0, 1, or 2." });
  }

  // --- Step 2: session lookup ---
  const session = store.getSession(sessionId);
  if (!session) {
    return reply.status(404).send({ error: `Session not found: ${sessionId}` });
  }

  const { worldState } = session;

  // --- Step 3: completed-session guard ---
  if (worldState.isComplete) {
    return reply.status(409).send({ error: "Session is already complete." });
  }

  // --- Step 4: stale-nodeId guard (prevents double-submit and client/server drift) ---
  if (nodeId !== worldState.currentNodeId) {
    return reply
      .status(400)
      .send({ error: "nodeId does not match current session node (stale client or double-submit)." });
  }

  // --- Step 5: choice effect lookup ---
  const effect = getChoiceEffect(nodeId, choiceIndex);
  if (!effect) {
    return reply.status(400).send({ error: `No effect found for node "${nodeId}" choice ${choiceIndex}.` });
  }

  // --- Apply the choice ---
  // TODO: replace "L2-node-1" with Director AI weighted selector once implemented.
  const nextNodeId = "L2-node-1";
  let newState = applyChoice(worldState, effect, nextNodeId);

  // If the player has completed 5 turns the game ends.
  // applyChoice already incremented turnsElapsed, so we check the new value.
  const gameOver = newState.turnsElapsed >= 5;
  if (gameOver) {
    newState = { ...newState, isComplete: true };
  }

  // Persist the updated world state
  store.updateSession(sessionId, {
    worldState: newState,
    status: gameOver ? "complete" : "active",
  });

  // Look up next node — null when game is over
  const nextNode = gameOver ? null : getNode(newState.currentNodeId);

  return reply.status(200).send({
    sessionId,
    clientState: toClientState(newState),
    nextNode,
  });
}

/**
 * Fastify plugin that registers POST /choice.
 * Accepts store and registry functions as options for testability.
 */
export const choiceRoutes: FastifyPluginAsync<ChoiceRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store, getNode, getChoiceEffect } = options;

  fastify.post<{ Body: ChoiceBody }>("/choice", async (request, reply) => {
    return handleChoice(request, reply, store, getNode, getChoiceEffect);
  });
};
