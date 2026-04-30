import type { FastifyPluginAsync } from "fastify";
import type {
  ClassifyRequest,
  ClassifyResponse,
  ClassifyQ1Request,
  ClassifyQ1Response,
  ClassifyQ2Request,
  ClassifyQ2Response,
  GameSession,
  NarrativeSkin,
  PlayerContext,
  ScenarioSkeleton,
} from "@hatchquest/shared";
import type { NarrationWorldContext } from "../engine/narrator-ai.js";
import {
  assessLayer0,
  assessLayer0FromBothResponses,
  extractPlayerContext,
  generateDisplaySafeContext,
  generateQ2,
  generateStoryMemory,
  inferSectorFromText,
} from "../engine/classifier.js";
import type { RegisteredSkeleton } from "../skeletons/registry.js";
import type { ISessionStore } from "../store/types.js";

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

function toStoredPlayerContext(context: PlayerContext): PlayerContext {
  return {
    businessLabel: context.businessLabel,
    businessSummary: context.businessSummary,
    businessDescription: context.businessDescription,
    motivation: context.motivation,
    founderEdge: context.founderEdge,
  };
}

function getStoredLayer0Q1(session: GameSession): string | null {
  return session.layer0Q1Response ?? session.worldState.playerContext?.rawQ1Response ?? null;
}

function getStoredLayer0Q2Prompt(session: GameSession): string | null {
  return session.layer0Q2Prompt ?? session.worldState.playerContext?.q2Prompt ?? null;
}

/** Registers all Layer 0 classify routes against the injected ISessionStore. */
export const classifyRoutes: FastifyPluginAsync<ClassifyPluginOptions> = async (
  fastify,
  opts
) => {
  const { store, getSkeleton, generateSkin } = opts;

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

      const assessment = await assessLayer0(response);
      const cleanContext = toStoredPlayerContext(
        extractPlayerContext(response, "", "")
      );

      await store.updateSession(sessionId, {
        layer0Q1Response: response,
        layer0Q2Prompt: null,
        layer0Q2Response: null,
        playerContext: cleanContext,
        storyMemory: assessment.storyMemory,
        generatedCurrentNode: null,
        generatedCurrentNodeId: null,
        generatedCurrentNodeCreatedAt: null,
        narrationSource: null,
        worldState: {
          ...session.worldState,
          layer: 1,
          currentNodeId: assessment.layer1NodeId,
          eoProfile: assessment.initialEOProfile,
          sector: assessment.sector,
          businessDescription: cleanContext.businessDescription,
          playerContext: cleanContext,
          storyMemory: assessment.storyMemory,
          currentNodeContent: null,
        },
      });

      return reply.status(200).send({ sessionId, layer1NodeId: assessment.layer1NodeId });
    }
  );

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

      const q2Prompt = await generateQ2(q1Response);
      const cleanContext = extractPlayerContext(q1Response, "", q2Prompt);

      await store.updateSession(sessionId, {
        layer0Q1Response: q1Response,
        layer0Q2Prompt: q2Prompt,
        layer0Q2Response: null,
        playerContext: null,
        storyMemory: null,
        generatedCurrentNode: null,
        generatedCurrentNodeId: null,
        generatedCurrentNodeCreatedAt: null,
        narrationSource: null,
        worldState: {
          ...session.worldState,
          sector: inferSectorFromText(q1Response),
          businessDescription: cleanContext.businessDescription,
          playerContext: null,
          storyMemory: null,
          currentNodeContent: null,
        },
      });

      return reply.status(200).send({ sessionId, q2Prompt });
    }
  );

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

      const q1Response = getStoredLayer0Q1(session);
      const q2Prompt = getStoredLayer0Q2Prompt(session);
      if (!q1Response || !q2Prompt) {
        return reply.status(400).send({ error: "Q1 must be submitted before Q2." });
      }

      const assessment = await assessLayer0FromBothResponses(q1Response, q2Response);
      const layer1NodeId = assessment.layer1NodeId;
      const baseContext = extractPlayerContext(q1Response, q2Response, q2Prompt);
      const refinedContext = await generateDisplaySafeContext(q1Response, q2Response);
      const storedPlayerContext = toStoredPlayerContext({
        ...baseContext,
        businessLabel: refinedContext.businessLabel ?? baseContext.businessLabel,
        businessSummary: refinedContext.businessSummary ?? baseContext.businessSummary,
        businessDescription:
          refinedContext.businessSummary ?? baseContext.businessDescription,
        founderEdge: refinedContext.founderEdge ?? baseContext.founderEdge,
      });
      const narratorContext: PlayerContext = {
        ...storedPlayerContext,
        rawQ1Response: q1Response,
        rawQ2Response: q2Response,
        q2Prompt,
      };
      const storyMemory = await generateStoryMemory(q2Prompt, q2Response);
      const sector = assessment.sector;

      const nextEntry = getSkeleton(layer1NodeId);
      if (!nextEntry) {
        return reply
          .status(500)
          .send({ error: `No skeleton found for node "${layer1NodeId}".` });
      }

      const worldCtx: NarrationWorldContext = {
        marketHeat: session.worldState.marketDemand,
        competitorThreat: session.worldState.competitorAggression,
        infrastructureStability: session.worldState.infrastructureReliability,
        capital: session.worldState.capital,
        lastEventNarrativeHook: null,
        sector,
        businessLabel: storedPlayerContext.businessLabel,
        businessSummary: storedPlayerContext.businessSummary,
        storyMemory,
        choiceHistory: [],
        turnNumber: 0,
        isFirstScenarioTurn: true,
      };
      const [generatedCurrentNode, narrationSource] = await generateSkin(
        nextEntry.skeleton,
        narratorContext,
        worldCtx
      );
      const cacheCreatedAt = new Date().toISOString();

      await store.updateSession(sessionId, {
        layer0Q1Response: q1Response,
        layer0Q2Prompt: q2Prompt,
        layer0Q2Response: q2Response,
        playerContext: storedPlayerContext,
        storyMemory,
        generatedCurrentNode,
        generatedCurrentNodeId: layer1NodeId,
        generatedCurrentNodeCreatedAt: cacheCreatedAt,
        narrationSource,
        worldState: {
          ...session.worldState,
          layer: 1,
          currentNodeId: layer1NodeId,
          eoProfile: assessment.initialEOProfile,
          playerContext: storedPlayerContext,
          sector,
          businessDescription: storedPlayerContext.businessDescription,
          storyMemory,
          currentNodeContent: generatedCurrentNode,
        },
      });

      return reply.status(200).send({ sessionId, layer1NodeId });
    }
  );
};
