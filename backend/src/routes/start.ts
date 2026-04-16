import type { FastifyPluginAsync } from "fastify";
import type { StartRequest, StartResponse } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";

const LAYER_0_QUESTION = [
  "It is a humid evening in Accra. You are sitting in a front room in Madina with GHS 10,000 in working capital, one business idea you cannot ignore, and too many people telling you to choose a safer life.",
  "Reply in 4 short parts so we can understand how you think under pressure:",
  "1) What are you building in Accra? Name the kind of business.",
  "2) Why are you starting now — what problem or opportunity is pulling you in?",
  "3) Your first supplier backs out one week before launch. What do you do?",
  "4) You hear that someone nearby is building something similar. What is your move?",
].join("\n\n");

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
        layer0Question: LAYER_0_QUESTION,
      });
    }
  );
};
