import Fastify from "fastify";
import type { WorldState } from "@hatchquest/shared";
import { getNode, getChoiceEffect, getAllNodes } from "./scenario-registry.js";
import { selectNextNode } from "./engine/director-ai.js";
import { createPRNG } from "./engine/prng.js";
import { startRoutes } from "./routes/start.js";
import { classifyRoutes } from "./routes/classify.js";
import { choiceRoutes } from "./routes/choice.js";
import { sessionRoutes } from "./routes/session.js";
import { resultsRoutes } from "./routes/results.js";
import type { ISessionStore } from "./store/types.js";

const server = Fastify({ logger: true });

// Health check — used by Railway and CI to verify the server is up
server.get("/health", async () => {
  return { status: "ok", service: "hatchquest-backend" };
});

/**
 * Builds the session store based on environment.
 * DB-backed when DATABASE_URL is set (Railway / staging).
 * In-memory fallback for local dev and CI — no DB required to run tests.
 *
 * Dynamic import defers client.ts execution until we know DATABASE_URL exists,
 * avoiding the "DATABASE_URL not set" throw during local dev.
 */
async function buildStore(): Promise<ISessionStore> {
  if (process.env.DATABASE_URL) {
    const { DbSessionStore } = await import("./store/db-session-store.js");
    return new DbSessionStore();
  }
  const { SessionStore } = await import("./store/session-store.js");
  return new SessionStore();
}

/**
 * Director AI node selector wired for production.
 * Uses a seeded PRNG derived from session seed XOR turnsElapsed for deterministic sessions.
 */
function directorSelectNextNodeId(state: WorldState): string | null {
  const rng = createPRNG(state.seed ^ state.turnsElapsed);
  const next = selectNextNode(state, getAllNodes(), rng);
  return next?.id ?? null;
}

/** Starts the Fastify server on the configured port. */
const start = async (): Promise<void> => {
  try {
    const store = await buildStore();

    await server.register(startRoutes, { prefix: "/api/game", store });
    await server.register(classifyRoutes, { prefix: "/api/game", store });
    await server.register(choiceRoutes, {
      prefix: "/api/game",
      store,
      getNode,
      getChoiceEffect,
      selectNextNodeId: directorSelectNextNodeId,
    });
    await server.register(sessionRoutes, { prefix: "/api/game", store, getNode });
    await server.register(resultsRoutes, { prefix: "/api/game", store });

    const port = Number(process.env.PORT ?? 3001);
    await server.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
