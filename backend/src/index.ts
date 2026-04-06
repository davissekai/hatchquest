import Fastify from "fastify";
import type { WorldState } from "@hatchquest/shared";
import { sessionStore } from "./store/session-store.js";
import { getNode, getChoiceEffect, getAllNodes } from "./scenario-registry.js";
import { selectNextNode } from "./engine/director-ai.js";
import { createPRNG } from "./engine/prng.js";
import { startRoutes } from "./routes/start.js";
import { classifyRoutes } from "./routes/classify.js";
import { choiceRoutes } from "./routes/choice.js";
import { sessionRoutes } from "./routes/session.js";
import { resultsRoutes } from "./routes/results.js";

const server = Fastify({ logger: true });

// Health check — used by Railway and CI to verify the server is up
server.get("/health", async () => {
  return { status: "ok", service: "hatchquest-backend" };
});

/**
 * Director AI node selector wired for production.
 * Uses a seeded PRNG derived from session seed XOR turnsElapsed for deterministic sessions.
 */
function directorSelectNextNodeId(state: WorldState): string | null {
  const rng = createPRNG(state.seed ^ state.turnsElapsed);
  const next = selectNextNode(state, getAllNodes(), rng);
  return next?.id ?? null;
}

// Game routes — all under /api/game, all backed by the process-wide session store
await server.register(startRoutes, { prefix: "/api/game", store: sessionStore });
await server.register(classifyRoutes, { prefix: "/api/game", store: sessionStore });
await server.register(choiceRoutes, {
  prefix: "/api/game",
  store: sessionStore,
  getNode,
  getChoiceEffect,
  selectNextNodeId: directorSelectNextNodeId,
});
await server.register(sessionRoutes, { prefix: "/api/game", store: sessionStore, getNode });
await server.register(resultsRoutes, { prefix: "/api/game", store: sessionStore });

/** Starts the Fastify server on the configured port. */
const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT ?? 3001);
    await server.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
