import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type {
  ScenarioNode,
  WorldState,
  PlayerContext,
  ScenarioSkeleton,
  NarrativeSkin,
} from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import type { RegisteredSkeleton } from "../skeletons/registry.js";
import { applyEffect } from "../engine/apply-choice.js";
import { toClientState } from "./helpers.js";
import { SessionLock } from "./session-lock.js";

// Options injected when registering this plugin.
export interface ChoiceRouteOptions {
  store: ISessionStore;
  getSkeleton: (id: string) => RegisteredSkeleton | null;
  generateSkin: (skeleton: ScenarioSkeleton, context: PlayerContext) => Promise<NarrativeSkin>;
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

/**
 * Handles POST /choice.
 * Guard order:
 *   1. Body field presence / type → 400
 *   2. Session existence → 404
 *   3. Session already complete → 409
 *   4. nodeId matches session's currentNodeId (double-submit guard) → 400
 *   5. Skeleton + effect lookup for current node → 400
 *
 * After applying the choice, the Narrator AI skins the next skeleton before
 * returning it to the client. Falls back to a deterministic skin on API failure.
 */
async function handleChoice(
  request: FastifyRequest<{ Body: ChoiceBody }>,
  reply: FastifyReply,
  store: ISessionStore,
  lock: SessionLock,
  getSkeleton: (id: string) => RegisteredSkeleton | null,
  generateSkin: ChoiceRouteOptions["generateSkin"],
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

    const currentEntry = getSkeleton(nodeId);
    if (!currentEntry) {
      return reply.status(400).send({ error: `No skeleton found for node "${nodeId}".` });
    }
    const effect = currentEntry.effects[choiceIndex];

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

    // --- Build the next node via Narrator AI ---
    // If no skeleton exists for the next id (e.g., empty registry during migration),
    // nextNode stays null — the client renders a game-over or waiting state.
    let nextNode: ScenarioNode | null = null;
    if (!gameOver) {
      // currentNodeId may be null if selector returned null — guard before lookup
      const nextEntry = newState.currentNodeId ? getSkeleton(newState.currentNodeId) : null;
      if (nextEntry) {
        // Use a fallback context if playerContext not yet set (e.g., legacy /classify path)
        const ctx: PlayerContext = newState.playerContext ?? {
          businessDescription: "your business",
          motivation: "to build something meaningful in Accra",
          rawQ1Response: "",
          rawQ2Response: "",
          q2Prompt: "",
        };
        const skin = await generateSkin(nextEntry.skeleton, ctx);
        nextNode = {
          id: nextEntry.skeleton.id,
          layer: nextEntry.skeleton.layer,
          narrative: skin.narrative,
          choices: [
            { index: 0, text: skin.choices[0], tensionHint: skin.tensionHints[0] },
            { index: 1, text: skin.choices[1], tensionHint: skin.tensionHints[1] },
            { index: 2, text: skin.choices[2], tensionHint: skin.tensionHints[2] },
          ],
        };
      }
    }

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
 * Accepts store, skeleton registry functions, Narrator AI, and optional Director AI selector.
 */
export const choiceRoutes: FastifyPluginAsync<ChoiceRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store, getSkeleton, generateSkin, selectNextNodeId = () => null } = options;
  const lock = new SessionLock();

  fastify.post<{ Body: ChoiceBody }>("/choice", async (request, reply) => {
    return handleChoice(request, reply, store, lock, getSkeleton, generateSkin, selectNextNodeId);
  });
};
