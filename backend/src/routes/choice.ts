import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type {
  ScenarioNode,
  WorldState,
  PlayerContext,
  ScenarioSkeleton,
  NarrativeSkin,
  EODimension,
} from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import type { RegisteredSkeleton } from "../skeletons/registry.js";
import { applyEffect, recordChoiceOnState } from "../engine/apply-choice.js";
import { propagateWorldStocks, drawWorldEvent, applyWorldEvent } from "../engine/world-engine.js";
import { computeDifficulty, updatePosterior } from "../engine/eo-bayes.js";
import type { EOPosterior } from "../engine/eo-bayes.js";
import { recordTurn } from "../engine/trace.js";
import type { TurnTrace, EODimensionUpdate } from "../engine/trace.js";
import type { NarrationWorldContext } from "../engine/narrator-ai.js";
import { createPRNG } from "../engine/prng.js";
import { toClientState } from "./helpers.js";
import { SessionLock } from "./session-lock.js";

export type GenerateSkinFn = (
  skeleton: ScenarioSkeleton,
  context: PlayerContext,
  worldCtx?: NarrationWorldContext
) => Promise<[NarrativeSkin, "llm" | "fallback" | "validator-rejected"]>;

// Options injected when registering this plugin.
export interface ChoiceRouteOptions {
  store: ISessionStore;
  getSkeleton: (id: string) => RegisteredSkeleton | null;
  generateSkin: GenerateSkinFn;
  selectNextNodeId?: (state: WorldState) => string | null;
}

interface ChoiceBody {
  sessionId: string;
  nodeId: string;
  choiceIndex: number;
  /** LLM-generated choice text shown to the player — stored as narrator continuity label. */
  chosenText?: string;
}

const EO_DIMENSIONS: EODimension[] = [
  "autonomy",
  "innovativeness",
  "riskTaking",
  "proactiveness",
  "competitiveAggressiveness",
];

function isValidChoiceIndex(v: unknown): v is 0 | 1 | 2 {
  return v === 0 || v === 1 || v === 2;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

/**
 * Computes variance for a given turn: starts at 2.5, tightens as evidence accumulates.
 * Approximates a conjugate prior without storing variance in WorldState.
 */
function turnVariance(turnsElapsed: number): number {
  return 2.5 / (turnsElapsed + 1);
}

/**
 * Applies Bayesian EO updates to a WorldState given the effect's eoDeltas.
 * Uses originalProfile as the prior (pre-applyEffect values) so the Bayesian
 * update is not double-applied on top of the flat delta from applyEffect.
 * Returns the updated WorldState with new eoProfile means.
 */
function applyBayesianEO(
  state: WorldState,
  originalProfile: WorldState["eoProfile"],
  eoDeltas: Partial<Record<EODimension, number>>,
  difficulty: number,
  turnsElapsed: number
): { state: WorldState; eoUpdates: Record<EODimension, EODimensionUpdate> } {
  const variance = turnVariance(turnsElapsed);
  const updatedProfile = { ...state.eoProfile };
  const eoUpdates = {} as Record<EODimension, EODimensionUpdate>;

  for (const dim of EO_DIMENSIONS) {
    const priorMean = originalProfile[dim]; // use pre-choice value as prior
    const prior: EOPosterior = { mean: priorMean, variance };
    const delta = eoDeltas[dim] ?? 0;
    const evidenceMean = priorMean + delta;
    const posterior = updatePosterior(prior, evidenceMean, difficulty);
    updatedProfile[dim] = posterior.mean;
    eoUpdates[dim] = {
      priorMean,
      posteriorMean: posterior.mean,
      priorVar: variance,
      posteriorVar: posterior.variance,
    };
  }

  return { state: { ...state, eoProfile: updatedProfile }, eoUpdates };
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
  const { sessionId, nodeId, choiceIndex, chosenText } = request.body ?? {};

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

    // Capture world state before for trace
    const worldStateBefore = worldState;

    // 1. Apply choice effects (financial, social, boolean flags, flat EO)
    const afterEffectRaw = applyEffect(worldState, effect);

    // 1b. Record choice metadata (history + recent patterns) for narrator continuity
    //     and director pattern-repeat suppression on the next turn.
    // Prefer the LLM-generated choice text the player actually read over the generic
    // archetype description — this makes continuity callbacks vivid and story-specific.
    const choiceLabel =
      (typeof chosenText === "string" && chosenText.trim().length > 0
        ? chosenText.trim()
        : null) ??
      currentEntry.skeleton.choiceArchetypes[choiceIndex]?.archetypeDescription ??
      `choice ${choiceIndex + 1}`;
    const afterEffect = recordChoiceOnState(afterEffectRaw, effect, {
      nodeId: currentEntry.skeleton.id,
      choiceLabel,
      narrativePattern: currentEntry.skeleton.narrativePattern,
    });

    // 2. Propagate world stocks (marketDemand, competitorAggression, infrastructureReliability drift)
    const rng = createPRNG(worldState.seed ^ worldState.turnsElapsed ^ 0xdeadbeef);
    const afterStocks = propagateWorldStocks(afterEffect, rng);

    // 3. Draw and apply world event (max 1 per turn)
    const drawnEvent = drawWorldEvent(afterStocks, rng);
    const afterEvent = drawnEvent ? applyWorldEvent(afterStocks, drawnEvent.eventId) : afterStocks;
    const eventsFired = drawnEvent ? [{ id: drawnEvent.eventId, weight: 1.0 }] : [];

    // 4. Append event to history if fired
    const worldEventHistory = drawnEvent
      ? [
          ...afterEvent.worldEventHistory,
          {
            turn: worldState.turnsElapsed + 1,
            eventId: drawnEvent.eventId,
            label: drawnEvent.label,
            narrativeHook: drawnEvent.narrativeHook,
          },
        ]
      : afterEvent.worldEventHistory;
    const afterHistory = { ...afterEvent, worldEventHistory };

    // 5. Bayesian EO update (replaces flat eoDeltas application)
    const turnsElapsed = worldState.turnsElapsed + 1;
    const difficulty = computeDifficulty(
      afterHistory.capital,
      afterHistory.competitorAggression,
      afterHistory.layer
    );
    const { state: afterEO, eoUpdates } = applyBayesianEO(
      afterHistory,
      worldState.eoProfile, // original prior, before applyEffect flat deltas
      effect.eoDeltas,
      difficulty,
      turnsElapsed
    );

    // 6. Advance routing meta
    const candidateNextNodeId = selectNextNodeId(afterEO);
    const exhaustedContent = candidateNextNodeId === null;
    const reachedTurnCap = turnsElapsed >= 10;
    const gameOver = reachedTurnCap || exhaustedContent;
    const advancedLayer = Math.min(10, worldState.layer + 1);

    const newState: WorldState = {
      ...afterEO,
      currentNodeId: gameOver ? null : candidateNextNodeId,
      turnsElapsed,
      layer: gameOver && worldState.layer === 10 ? 10 : advancedLayer,
      isComplete: gameOver,
    };

    await store.updateSession(sessionId, {
      worldState: newState,
      status: gameOver ? "complete" : "active",
    });

    // --- Build the next node via Narrator AI ---
    // If no skeleton exists for the next id (e.g., empty registry during migration),
    // nextNode stays null — the client renders a game-over or waiting state.
    const narrationStart = Date.now();
    let narrationSource: TurnTrace["narrationSource"] = "llm";
    let nextNode: ScenarioNode | null = null;

    if (!gameOver) {
      const nextEntry = newState.currentNodeId ? getSkeleton(newState.currentNodeId) : null;
      if (nextEntry) {
        const ctx: PlayerContext = newState.playerContext ?? {
          businessDescription: "your business",
          motivation: "to build something meaningful in Accra",
          rawQ1Response: "",
          rawQ2Response: "",
          q2Prompt: "",
        };
        const worldCtx: NarrationWorldContext = {
          marketHeat: newState.marketDemand,
          competitorThreat: newState.competitorAggression,
          infrastructureStability: newState.infrastructureReliability,
          capital: newState.capital,
          lastEventNarrativeHook:
            newState.worldEventHistory.length > 0
              ? (newState.worldEventHistory[newState.worldEventHistory.length - 1]?.narrativeHook ?? null)
              : null,
          sector: newState.sector,
          businessDescription: newState.businessDescription,
          choiceHistory: newState.choiceHistory,
          turnNumber: turnsElapsed,
          // /choice only fires after the player has already seen and answered at least
          // one scenario, so this narration is never the first scenario turn. The L1
          // opening narration is produced by /session → narrateScenarioNode.
          isFirstScenarioTurn: false,
        };
        const [skin, source] = await generateSkin(nextEntry.skeleton, ctx, worldCtx);
        narrationSource = source;
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

    // 7. Record trace for observability
    const trace: TurnTrace = {
      turn: turnsElapsed,
      layer: newState.layer,
      nodeId,
      worldStateBefore,
      worldStateAfter: newState,
      eventsFired,
      choiceIndex,
      difficulty,
      eoUpdates,
      narrationSource,
      narrationLatencyMs: Date.now() - narrationStart,
    };
    recordTurn(sessionId, trace);

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
