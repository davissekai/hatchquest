import type { FastifyPluginAsync } from "fastify";
import type { StartRequest, StartResponse } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";

// World introduction shown before the first question.
// Fills the first viewport — player scrolls to reveal Q1.
const PREAMBLE =
  "Accra, 2026. The city hums with restless energy — mobile money has rewired commerce, " +
  "the streets are dense with ambition. You have an idea, some savings, and a phone. " +
  "Every founder here started the same way. What you do next is entirely up to you.";

// The first open-ended free-text prompt.
// Feeds Layer 0 Q1 classification — must not be multiple choice.
const LAYER_0_QUESTION =
  "Describe the business you want to build and the problem it solves. " +
  "What makes you the right person to build it?";

interface StartPluginOptions {
  store: ISessionStore;
}

const startBodySchema = {
  type: "object",
  required: ["playerName", "email", "password"],
  properties: {
    playerName: { type: "string", minLength: 1 },
    email: { type: "string", minLength: 1 },
    password: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const startRoutes: FastifyPluginAsync<StartPluginOptions> = async (
  fastify,
  opts
) => {
  const { store } = opts;

  fastify.post<{ Body: StartRequest; Reply: StartResponse }>(
    "/start",
    {
      schema: { body: startBodySchema },
    },
    async (request, reply) => {
      const { playerName, email } = request.body;

      const session = await store.createSession(playerName, email);

      return reply.status(200).send({
        sessionId: session.id,
        preamble: PREAMBLE,
        layer0Question: LAYER_0_QUESTION,
      });
    }
  );
};
