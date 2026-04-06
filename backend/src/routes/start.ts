import type { FastifyPluginAsync } from "fastify";
import type { StartRequest, StartResponse } from "@hatchquest/shared";
import type { ISessionStore } from "../store/types.js";

// The single open-ended prompt presented to the player at game start.
// Feeds Layer 0 free-text classification — must not be multiple choice.
const LAYER_0_QUESTION =
  "Describe the business you want to build and the problem it solves. " +
  "What makes you the right person to build it?";

// Plugin options carry the store so tests can inject a fresh instance
// rather than relying on the module-level singleton.
interface StartPluginOptions {
  store: ISessionStore;
}

/** JSON Schema for POST /start body validation. */
const startBodySchema = {
  type: "object",
  required: ["playerName", "email", "password"],
  properties: {
    playerName: { type: "string", minLength: 1 },
    email: { type: "string", minLength: 1 },
    // password is validated for presence but never stored — auth is not yet implemented.
    password: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

/** Registers the POST /start route against the injected ISessionStore. */
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
      // password is deliberately not used — no auth implementation yet.

      const session = await store.createSession(playerName, email);

      return reply.status(200).send({
        sessionId: session.id,
        layer0Question: LAYER_0_QUESTION,
      });
    }
  );
};
