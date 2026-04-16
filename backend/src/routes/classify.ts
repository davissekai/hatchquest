import type { FastifyPluginAsync } from "fastify";
import type {
  ClassifyRequest,
  ClassifyResponse,
  ClassifyQ1Request,
  ClassifyQ1Response,
  ClassifyQ2Request,
  ClassifyQ2Response,
} from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";
import {
  assessLayer0,
  classify,
  classifyFromBothResponses,
  generateQ2,
  extractPlayerContext,
} from "../engine/classifier.js";

interface ClassifyPluginOptions {
  store: ISessionStore;
}

/** Registers all Layer 0 classify routes against the injected ISessionStore. */
export const classifyRoutes: FastifyPluginAsync<ClassifyPluginOptions> = async (
  fastify,
  opts
) => {
  const { store } = opts;

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

      // Temporarily store Q1 in playerContext so it survives session resume
      await store.updateSession(sessionId, {
        worldState: {
          ...session.worldState,
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

      // Build the final PlayerContext with full extraction
      const playerContext = extractPlayerContext(pc.rawQ1Response, q2Response, pc.q2Prompt);

      // Advance to Layer 1 with full player context
      await store.updateSession(sessionId, {
        worldState: {
          ...session.worldState,
          layer: 1,
          currentNodeId: layer1NodeId,
          playerContext,
        },
      });

      return reply.status(200).send({ sessionId, layer1NodeId });
    }
  );
};
