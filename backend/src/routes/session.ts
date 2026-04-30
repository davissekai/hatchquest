import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type {
  GameSession,
  NarrativeSkin,
  PlayerContext,
  ScenarioNode,
  WorldState,
} from "@hatchquest/shared";
import type { NarrationWorldContext } from "../engine/narrator-ai.js";
import { narrateScenarioNode } from "../narration/narrator.js";
import type { RegisteredSkeleton } from "../skeletons/registry.js";
import type { ISessionStore } from "../store/types.js";
import type { GenerateSkinFn } from "./choice.js";
import { toClientState } from "./helpers.js";

export interface SessionRegistry {
  getNode: (nodeId: string | null) => ScenarioNode | null;
}

export interface SessionRouteOptions {
  store: ISessionStore;
  getNode: SessionRegistry["getNode"];
  getSkeleton?: (id: string) => RegisteredSkeleton | null;
  generateSkin?: GenerateSkinFn;
}

interface SessionParams {
  sessionId: string;
}

function isL1OpeningTurn(state: WorldState): boolean {
  return (
    state.layer === 1 &&
    state.choiceHistory.length === 0 &&
    state.currentNodeId !== null
  );
}

function nodeFromSkin(
  nodeId: string,
  layer: number,
  skin: NarrativeSkin
): ScenarioNode {
  return {
    id: nodeId,
    layer,
    narrative: skin.narrative,
    choices: [
      { index: 0, text: skin.choices[0], tensionHint: skin.tensionHints[0] },
      { index: 1, text: skin.choices[1], tensionHint: skin.tensionHints[1] },
      { index: 2, text: skin.choices[2], tensionHint: skin.tensionHints[2] },
    ],
  };
}

function getCleanPlayerContext(session: GameSession, worldState: WorldState): PlayerContext {
  return (
    session.playerContext ??
    worldState.playerContext ?? {
      businessLabel: "Your Venture",
      businessSummary: worldState.businessDescription || "Your business in Accra",
      businessDescription: worldState.businessDescription || "Your business in Accra",
      motivation: "To build something meaningful in Accra.",
      founderEdge: "Resourceful founder",
    }
  );
}

async function renderCurrentNode(
  session: GameSession,
  getNode: SessionRegistry["getNode"],
  getSkeleton: SessionRouteOptions["getSkeleton"],
  generateSkin: GenerateSkinFn | undefined
): Promise<ScenarioNode | null> {
  const { worldState } = session;
  if (worldState.currentNodeId === null) return null;

  if (
    session.generatedCurrentNode &&
    session.generatedCurrentNodeId === worldState.currentNodeId
  ) {
    return nodeFromSkin(
      worldState.currentNodeId,
      worldState.layer,
      session.generatedCurrentNode
    );
  }

  if (worldState.currentNodeContent) {
    return nodeFromSkin(
      worldState.currentNodeId,
      worldState.layer,
      worldState.currentNodeContent
    );
  }

  const canSkin =
    isL1OpeningTurn(worldState) &&
    typeof getSkeleton === "function" &&
    typeof generateSkin === "function";

  if (canSkin) {
    const entry = getSkeleton(worldState.currentNodeId);
    if (entry) {
      const ctx = getCleanPlayerContext(session, worldState);
      const worldCtx: NarrationWorldContext = {
        marketHeat: worldState.marketDemand,
        competitorThreat: worldState.competitorAggression,
        infrastructureStability: worldState.infrastructureReliability,
        capital: worldState.capital,
        lastEventNarrativeHook:
          worldState.worldEventHistory.length > 0
            ? (worldState.worldEventHistory[worldState.worldEventHistory.length - 1]
                ?.narrativeHook ?? null)
            : null,
        sector: worldState.sector,
        businessLabel: ctx.businessLabel,
        businessSummary: ctx.businessSummary,
        storyMemory: session.storyMemory ?? worldState.storyMemory,
        choiceHistory: worldState.choiceHistory,
        turnNumber: 0,
        isFirstScenarioTurn: true,
      };
      const [skin] = await generateSkin(entry.skeleton, ctx, worldCtx);
      return nodeFromSkin(entry.skeleton.id, entry.skeleton.layer, skin);
    }
  }

  return narrateScenarioNode(getNode(worldState.currentNodeId), worldState);
}

async function handleGetSession(
  request: FastifyRequest<{ Params: SessionParams }>,
  reply: FastifyReply,
  store: ISessionStore,
  getNode: SessionRegistry["getNode"],
  getSkeleton: SessionRouteOptions["getSkeleton"],
  generateSkin: GenerateSkinFn | undefined
): Promise<void> {
  const { sessionId } = request.params;

  const session = await store.getSession(sessionId);
  if (!session) {
    return reply.status(404).send({ error: `Session not found: ${sessionId}` });
  }

  const currentNode = await renderCurrentNode(
    session,
    getNode,
    getSkeleton,
    generateSkin
  );

  return reply.status(200).send({
    sessionId,
    clientState: toClientState(session.worldState),
    currentNode,
  });
}

export const sessionRoutes: FastifyPluginAsync<SessionRouteOptions> = async (
  fastify,
  options
): Promise<void> => {
  const { store, getNode, getSkeleton, generateSkin } = options;

  fastify.get<{ Params: SessionParams }>(
    "/session/:sessionId",
    async (request, reply) => {
      return handleGetSession(
        request,
        reply,
        store,
        getNode,
        getSkeleton,
        generateSkin
      );
    }
  );
};
