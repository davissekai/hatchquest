import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ScenarioNode, WorldState } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import type { ChoiceEffect } from "../engine/apply-choice.js";
import { applyEffect } from "../engine/apply-choice.js";
import { toClientState } from "./helpers.js";
import { SessionLock } from "./session-lock.js";

// Registry dependency interface — injected by callers so tests can stub it.
export interface ChoiceRegistry {
  /** Returns the client-safe node for a given id, or null if not found / game over. */
  getNode: (nodeId: string | null) => ScenarioNode | null;
  /** Returns the ChoiceEffect for the given node and choice index, or null if unknown. */
  getChoiceEffect: (nodeId: string, choiceIndex: 0 | 1 | 2) => ChoiceEffect | null;
}

// Options injected when registering this plugin.
export interface ChoiceRouteOptions {
  store: ISessionStore;
  getNode: ChoiceRegistry["getNode"];
  getChoiceEffect: ChoiceRegistry["getChoiceEffect"];
  /**
   * Director AI node selector — takes post-effect world state, returns next nodeId.
   * Optional: defaults to returning null (game over) when not injected.
   * Tests inject a stub; production injects the real Director AI.
   */
  selectNextNodeId?: (state: WorldState) => string | null;
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
 * Guard order:
 *   1. Body field presence / type → 400
 *   2. Session existence → 404
 *   3. Session already complete → 409
 *   4. nodeId matches session's currentNodeId (double-submit guard) → 400
 *   5. ChoiceEffect existence → 400
 *
 * The entire read-modify-write cycle (steps 2–5 + update) is serialized per
 * sessionId via a SessionLock, preventing TOCTOU races from concurrent requests.
 */
async function handleChoice(
  request: FastifyRequest<{ Body: ChoiceBody }>,
  reply: FastifyReply,
  store: ISessionStore,
  lock: SessionLock,
  getNode: ChoiceRegistry["getNode"],
  getChoiceEffect: ChoiceRegistry["getChoiceEffect"],
  selectNextNodeId: (state: WorldState) => string | null
): Promise<void> {
  const { sessionId, nodeId, choiceIndex } = request.body ?? {};

  // --- Step 1: body validation ---
  if (!isNonEmptyString(sessionId) || !isNonEmptyString(nodeId)) {
    return reply.status(400).send({ error: "sessionId and nodeId are required strings." });
  }
  if (!isValidChoiceIndex(choiceIndex)) {
    return reply.status(400).send({ error: "choiceIndex must be 0, 1, or 2." });
  }

  // --- Acquire per-session lock — serializes concurrent requests for this sessionId ---
  const release = await lock.acquire(sessionId);
  try {
    // --- Step 2: session lookup ---
    const session = await store.getSession(sessionId);
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
    // applyEffect gives us the post-choice state without committing nextNodeId,
    // so the Director AI evaluates the updated world before selecting the next node.
    const intermediateState = applyEffect(worldState, effect);
    const nextNodeId = selectNextNodeId(intermediateState) ?? "";
    let newState: WorldState = {
      ...intermediateState,
      currentNodeId: nextNodeId,
      turnsElapsed: worldState.turnsElapsed + 1,
      // Advance layer so Director AI looks at the correct pool next turn
      // and EO affinity transitions to challenge mode at layer 3+.
      layer: worldState.layer + 1,
    };

    // Game ends after 5 turns
    const gameOver = newState.turnsElapsed >= 5;
    if (gameOver) {
      newState = { ...newState, isComplete: true };
    }

    await store.updateSession(sessionId, {
      worldState: newState,
      status: gameOver ? "complete" : "active",
    });

    const nextNode = gameOver ? null : getNode(newState.currentNodeId);

    return reply.status(200).send({
      sessionId,
      clientState: toClientState(newState),
      nextNode,
    });
  } finally {
    release();
  }
}

/**
 * Fastify plugin that registers POST /choice.
 * Accepts store, registry functions, and optional Director AI selector as options.
 */
export const choiceRoutes: FastifyPluginAsync<ChoiceRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store, getNode, getChoiceEffect, selectNextNodeId = () => null } = options;
  const lock = new SessionLock();

  fastify.post<{ Body: ChoiceBody }>("/choice", async (request, reply) => {
    return handleChoice(request, reply, store, lock, getNode, getChoiceEffect, selectNextNodeId);
  });
};
