import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type {
  ScenarioNode,
  PlayerContext,
  WorldState,
} from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import type { RegisteredSkeleton } from "../skeletons/registry.js";
import type { GenerateSkinFn } from "./choice.js";
import type { NarrationWorldContext } from "../engine/narrator-ai.js";
import { narrateScenarioNode } from "../narration/narrator.js";
import { toClientState } from "./helpers.js";

export interface SessionRegistry {
  getNode: (nodeId: string | null) => ScenarioNode | null;
}

export interface SessionRouteOptions {
  store: ISessionStore;
  getNode: SessionRegistry["getNode"];
  /**
   * Optional: skeleton accessor. Required for L1-opening narration via
   * generateSkin (so isFirstScenarioTurn + businessDescription plumb into
   * the Narrator AI prompt). If not supplied, /session falls back to the
   * deterministic narrateScenarioNode path for all nodes.
   */
  getSkeleton?: (id: string) => RegisteredSkeleton | null;
  /** Optional: Narrator AI skin generator, same one /choice uses. */
  generateSkin?: GenerateSkinFn;
}

interface SessionParams {
  sessionId: string;
}

/**
 * Detects whether the current render is the L1 opening scenario — the
 * very first node the player sees after Layer 0 classification. On this
 * turn and only this turn we want isFirstScenarioTurn=true so the
 * Narrator AI emits a time-bridge opener referencing businessDescription.
 */
function isL1OpeningTurn(state: WorldState): boolean {
  return (
    state.layer === 1 &&
    state.choiceHistory.length === 0 &&
    state.currentNodeId !== null
  );
}

/**
 * Renders the current scenario node for /session.
 * - L1 opening (no choices applied yet) AND a skin pipeline is wired up
 *   → generate a Narrator AI skin with isFirstScenarioTurn=true.
 * - Every other turn → use narrateScenarioNode (cheap deterministic
 *   rewrite that adds world-state context to the skeleton seed).
 */
async function renderCurrentNode(
  worldState: WorldState,
  getNode: SessionRegistry["getNode"],
  getSkeleton: SessionRouteOptions["getSkeleton"],
  generateSkin: GenerateSkinFn | undefined
): Promise<ScenarioNode | null> {
  if (worldState.currentNodeId === null) return null;

  const canSkin =
    isL1OpeningTurn(worldState) &&
    typeof getSkeleton === "function" &&
    typeof generateSkin === "function";

  if (canSkin) {
    const entry = getSkeleton(worldState.currentNodeId);
    if (entry) {
      const ctx: PlayerContext = worldState.playerContext ?? {
        businessDescription: worldState.businessDescription || "your business",
        motivation: "to build something meaningful in Accra",
        rawQ1Response: "",
        rawQ2Response: "",
        q2Prompt: "",
      };
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
        businessDescription: worldState.businessDescription,
        choiceHistory: worldState.choiceHistory,
        turnNumber: 0,
        // Critical: this is the L1 opening — the narrator must emit
        // a time-bridge opener referencing the player's business.
        isFirstScenarioTurn: true,
      };
      const [skin] = await generateSkin(entry.skeleton, ctx, worldCtx);
      return {
        id: entry.skeleton.id,
        layer: entry.skeleton.layer,
        narrative: skin.narrative,
        choices: [
          { index: 0, text: skin.choices[0], tensionHint: skin.tensionHints[0] },
          { index: 1, text: skin.choices[1], tensionHint: skin.tensionHints[1] },
          { index: 2, text: skin.choices[2], tensionHint: skin.tensionHints[2] },
        ],
      };
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

  const { worldState } = session;
  const currentNode = await renderCurrentNode(
    worldState,
    getNode,
    getSkeleton,
    generateSkin
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
