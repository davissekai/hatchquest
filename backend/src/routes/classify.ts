import type { FastifyPluginAsync } from "fastify";
import type {
  ClassifyRequest,
  ClassifyResponse,
  ClassifyQ1Request,
  ClassifyQ1Response,
  ClassifyQ2Request,
  ClassifyQ2Response,
  PlayerContext,
  ScenarioSkeleton,
  NarrativeSkin,
} from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import {
  assessLayer0,
  classifyFromBothResponses,
  generateQ2,
  extractPlayerContext,
  inferSectorFromText,
  generateDisplaySafeContext,
  generateStoryMemory,
} from "../engine/classifier.js";
import type { RegisteredSkeleton } from "../skeletons/registry.js";
import type { NarrationWorldContext } from "../engine/narrator-ai.js";

type GenerateSkinFn = (
  skeleton: ScenarioSkeleton,
  context: PlayerContext,
  worldCtx?: NarrationWorldContext
) => Promise<[NarrativeSkin, "llm" | "fallback" | "validator-rejected"]>;

interface ClassifyPluginOptions {
  store: ISessionStore;
  getSkeleton: (id: string) => RegisteredSkeleton | null;
  generateSkin: GenerateSkinFn;
}

/** Registers all Layer 0 classify routes against the injected ISessionStore. */
export const classifyRoutes: FastifyPluginAsync<ClassifyPluginOptions> = async (
  fastify,
  opts
) => {
  const { store, getSkeleton, generateSkin } = opts;

  // ─── Legacy: POST /classify (single-step, kept for backward compat) ──────────

  fastify.post<{ Body: ClassifyRequest; Reply: ClassifyResponse | { error: string } }>(
    "/classify",
    {
      schema: {
        body: {
          type: "object",
          required: ["sessionId", "response"],
          properties: {
            sessionId: { type: "string", minLength: 1 },
            response: { type: "string", minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { sessionId, response } = request.body;

      const session = await store.getSession(sessionId);
      if (!session) {
        return reply.status(404).send({ error: `Session not found: ${sessionId}` });
      }

      if (session.worldState.layer > 0 || session.worldState.currentNodeId !== null) {
        return reply.status(409).send({ error: "Session is already classified." });
      }

      // Use full assessment to seed EO profile from Layer 0 signal
      const assessment = await assessLayer0(response);

      await store.updateSession(sessionId, {
        worldState: {
          ...session.worldState,
          layer: 1,
          currentNodeId: assessment.layer1NodeId,
          eoProfile: assessment.initialEOProfile,
          sector: assessment.sector,
          businessDescription: response,
        },
      });

      return reply.status(200).send({ sessionId, layer1NodeId: assessment.layer1NodeId });
    }
  );

  // ─── Two-step: POST /classify-q1 ─────────────────────────────────────────────
  // Player submits Q1 answer. Backend stores it in playerContext and returns Q2.

  fastify.post<{ Body: ClassifyQ1Request; Reply: ClassifyQ1Response | { error: string } }>(
    "/classify-q1",
    {
      schema: {
        body: {
          type: "object",
          required: ["sessionId", "q1Response"],
          properties: {
            sessionId: { type: "string", minLength: 1 },
            q1Response: { type: "string", minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { sessionId, q1Response } = request.body;

      const session = await store.getSession(sessionId);
      if (!session) {
        return reply.status(404).send({ error: `Session not found: ${sessionId}` });
      }

      if (session.worldState.layer > 0) {
        return reply.status(409).send({ error: "Session is already classified." });
      }

      // Generate personalised Q2 from Q1 response
      const q2Prompt = await generateQ2(q1Response);

      // Temporarily store Q1 in playerContext so it survives session resume.
      // Also persist sector + businessDescription immediately so Narrator AI
      // has sector-aware framing even if Q2 classification later fails.
      await store.updateSession(sessionId, {
        worldState: {
          ...session.worldState,
          sector: inferSectorFromText(q1Response),
          businessDescription: q1Response,
          playerContext: {
            businessDescription: q1Response,
            motivation: "",
            rawQ1Response: q1Response,
            rawQ2Response: "",
            q2Prompt,
          },
        },
      });

      return reply.status(200).send({ sessionId, q2Prompt });
    }
  );

  // ─── Two-step: POST /classify-q2 ─────────────────────────────────────────────
  // Player submits Q2 answer. Backend classifies both responses → Layer 1 node.

  fastify.post<{ Body: ClassifyQ2Request; Reply: ClassifyQ2Response | { error: string } }>(
    "/classify-q2",
    {
      schema: {
        body: {
          type: "object",
          required: ["sessionId", "q2Response"],
          properties: {
            sessionId: { type: "string", minLength: 1 },
            q2Response: { type: "string", minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { sessionId, q2Response } = request.body;

      const session = await store.getSession(sessionId);
      if (!session) {
        return reply.status(404).send({ error: `Session not found: ${sessionId}` });
      }

      if (session.worldState.layer > 0) {
        return reply.status(409).send({ error: "Session is already classified." });
      }

      const pc = session.worldState.playerContext;
      if (!pc?.rawQ1Response) {
        return reply.status(400).send({ error: "Q1 must be submitted before Q2." });
      }

      // Classify using both responses for richer EO signal
      const layer1NodeId = await classifyFromBothResponses(pc.rawQ1Response, q2Response);

      // Build the final PlayerContext with full extraction and AI refinement
      const basePC = extractPlayerContext(pc.rawQ1Response, q2Response, pc.q2Prompt);
      const refinedContext = await generateDisplaySafeContext(pc.rawQ1Response, q2Response);
      const playerContext: PlayerContext = {
        ...basePC,
        businessLabel: refinedContext.businessLabel ?? basePC.businessLabel,
        businessSummary: refinedContext.businessSummary ?? basePC.businessSummary,
        founderEdge: refinedContext.founderEdge ?? "Resourceful founder",
      };

      // Generate StoryMemory from Q2 arc
      const storyMemory = await generateStoryMemory(pc.q2Prompt, q2Response);

      // Advance to Layer 1 with full player context.
      const sector = inferSectorFromText(`${pc.rawQ1Response} ${q2Response}`);

      // Generate the skin for the first node immediately and persist it.
      let currentNodeContent: NarrativeSkin | null = null;
      const nextEntry = getSkeleton(layer1NodeId);
      if (nextEntry) {
        const worldCtx: NarrationWorldContext = {
          marketHeat: session.worldState.marketDemand,
          competitorThreat: session.worldState.competitorAggression,
          infrastructureStability: session.worldState.infrastructureReliability,
          capital: session.worldState.capital,
          lastEventNarrativeHook: null,
          sector,
          businessLabel: playerContext.businessLabel,
          businessSummary: playerContext.businessSummary,
          storyMemory,
          choiceHistory: [],
          turnNumber: 0,
          isFirstScenarioTurn: true,
          q2Prompt: pc.q2Prompt,
          q2Response,
        };
        const [skin] = await generateSkin(nextEntry.skeleton, playerContext, worldCtx);
        currentNodeContent = skin;
      }

      await store.updateSession(sessionId, {
        worldState: {
          ...session.worldState,
          layer: 1,
          currentNodeId: layer1NodeId,
          playerContext,
          sector,
          businessDescription: pc.rawQ1Response,
          storyMemory,
          currentNodeContent,
        },
      });

      return reply.status(200).send({ sessionId, layer1NodeId });
    }
  );
};
