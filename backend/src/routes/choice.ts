import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { ScenarioNode, WorldState } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import type { ChoiceEffect } from "../engine/apply-choice.js";
import { applyEffect } from "../engine/apply-choice.js";
import { narrateScenarioNode } from "../narration/narrator.js";
import { toClientState } from "./helpers.js";
import { SessionLock } from "./session-lock.js";

export interface ChoiceRegistry {
  getNode: (nodeId: string | null) => ScenarioNode | null;
  getChoiceEffect: (nodeId: string, choiceIndex: 0 | 1 | 2) => ChoiceEffect | null;
}

export interface ChoiceRouteOptions {
  store: ISessionStore;
  getNode: ChoiceRegistry["getNode"];
  getChoiceEffect: ChoiceRegistry["getChoiceEffect"];
  selectNextNodeId?: (state: WorldState) => string | null;
}

interface ChoiceBody {
  sessionId: string;
  nodeId: string;
  choiceIndex: number;
}

function isValidChoiceIndex(v: unknown): v is 0 | 1 | 2 {
  return v === 0 || v === 1 || v === 2;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

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

  if (!isNonEmptyString(sessionId) || !isNonEmptyString(nodeId)) {
    return reply
      .status(400)
      .send({ error: "sessionId and nodeId are required strings." });
  }
  if (!isValidChoiceIndex(choiceIndex)) {
    return reply.status(400).send({ error: "choiceIndex must be 0, 1, or 2." });
  }

  const release = await lock.acquire(sessionId);
  try {
    const session = await store.getSession(sessionId);
    if (!session) {
      return reply.status(404).send({ error: `Session not found: ${sessionId}` });
    }

    const { worldState } = session;
    if (worldState.isComplete) {
      return reply.status(409).send({ error: "Session is already complete." });
    }

    if (nodeId !== worldState.currentNodeId) {
      return reply.status(400).send({
        error:
          "nodeId does not match current session node (stale client or double-submit).",
      });
    }

    const effect = getChoiceEffect(nodeId, choiceIndex);
    if (!effect) {
      return reply.status(400).send({
        error: `No effect found for node "${nodeId}" choice ${choiceIndex}.`,
      });
    }

    const intermediateState = applyEffect(worldState, effect);
    const candidateNextNodeId = selectNextNodeId(intermediateState);
    const turnsElapsed = worldState.turnsElapsed + 1;
    const exhaustedContent = candidateNextNodeId === null;
    const reachedTurnCap = turnsElapsed >= 5;
    const gameOver = reachedTurnCap || exhaustedContent;
    const advancedLayer = Math.min(5, worldState.layer + 1);

    const newState: WorldState = {
      ...intermediateState,
      currentNodeId: gameOver ? null : candidateNextNodeId,
      turnsElapsed,
      layer: gameOver && worldState.layer === 5 ? 5 : advancedLayer,
      isComplete: gameOver,
    };

    await store.updateSession(sessionId, {
      worldState: newState,
      status: gameOver ? "complete" : "active",
    });

    const nextNode = gameOver
      ? null
      : await narrateScenarioNode(getNode(newState.currentNodeId), newState);

    return reply.status(200).send({
      sessionId,
      clientState: toClientState(newState),
      nextNode,
    });
  } finally {
    release();
  }
}

export const choiceRoutes: FastifyPluginAsync<ChoiceRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const {
    store,
    getNode,
    getChoiceEffect,
    selectNextNodeId = () => null,
  } = options;
  const lock = new SessionLock();

  fastify.post<{ Body: ChoiceBody }>("/choice", async (request, reply) => {
    return handleChoice(
      request,
      reply,
      store,
      lock,
      getNode,
      getChoiceEffect,
      selectNextNodeId
    );
  });
};
