import Fastify from "fastify";
import type { FastifyInstance, FastifyError } from "fastify";
import type { WorldState, PlayerContext, ScenarioSkeleton, NarrativeSkin } from "@hatchquest/shared";
import { getNode } from "./scenario-registry.js";
import { getSkeleton, getAllSkeletons } from "./skeletons/registry.js";
import { selectNextSkeleton } from "./engine/director-ai.js";
import { generateNarrativeSkin } from "./engine/narrator-ai.js";
import { createPRNG } from "./engine/prng.js";
import { startRoutes } from "./routes/start.js";
import { classifyRoutes } from "./routes/classify.js";
import { choiceRoutes } from "./routes/choice.js";
import { sessionRoutes } from "./routes/session.js";
import { resultsRoutes } from "./routes/results.js";
import type { ISessionStore } from "./store/types.js";
import type { RegisteredSkeleton } from "./skeletons/registry.js";

export interface BuildAppOptions {
  /** Enable Fastify's built-in logger. Default: false (tests stay quiet). */
  logger?: boolean;
  /**
   * Route prefix applied to all game routes.
   * Default: "/api/game" (production).
   * Pass "" in tests to keep URLs short (/start, /choice, etc.).
   */
  routePrefix?: string;
  /**
   * Director AI node selector. Injected so tests can use a deterministic
   * stub without coupling to the PRNG. Default: production weighted selector.
   */
  selectNextNodeId?: (state: WorldState) => string | null;
  /**
   * Skeleton getter override for integration tests.
   * Default: real skeleton registry (getSkeleton from skeletons/registry.ts).
   * Tests that use old scenario-registry node IDs inject an adapter here.
   */
  getSkeleton?: (id: string) => RegisteredSkeleton | null;
  /**
   * Narrator AI override for integration tests.
   * Default: generateNarrativeSkin (calls Anthropic API, falls back to deterministic skin).
   * Tests inject a synchronous buildFallbackSkin wrapper to avoid any API dependency.
   */
  generateSkin?: (skeleton: ScenarioSkeleton, context: PlayerContext) => Promise<NarrativeSkin>;
}

/**
 * Production Director AI — uses selectNextSkeleton with a seeded PRNG.
 * XOR of seed and turnsElapsed adds cheap entropy so each turn draws from
 * a different position in the sequence.
 */
function productionSelectNextNodeId(state: WorldState): string | null {
  const rng = createPRNG(state.seed ^ state.turnsElapsed);
  const next = selectNextSkeleton(state, getAllSkeletons(), rng);
  return next?.skeleton.id ?? null;
}

/**
 * Builds and returns a configured Fastify instance.
 *
 * Responsibilities:
 *   - Register global error handler (normalizes all errors to { error: string })
 *   - Register /health check
 *   - Register all 5 game routes under the given prefix
 *
 * Does NOT call app.listen() — callers do that (index.ts for production,
 * app.inject() for tests).
 */
export async function buildApp(
  store: ISessionStore,
  opts?: BuildAppOptions
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts?.logger ?? false });
  const prefix = opts?.routePrefix ?? "/api/game";

  const selectNextNodeId = opts?.selectNextNodeId ?? productionSelectNextNodeId;
  const effectiveGetSkeleton = opts?.getSkeleton ?? getSkeleton;
  const effectiveGenerateSkin = opts?.generateSkin ?? generateNarrativeSkin;

  // ── Global error handler ────────────────────────────────────────────────────
  // Catches: (1) errors thrown from route handlers, (2) Fastify schema
  // validation failures. Route handlers that return reply.send() directly
  // do NOT pass through here — those are already handled.
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    // Log full error server-side (Railway logs) — never send to client
    app.log.error({ err: error, message: error.message }, "Route error");

    // Fastify schema validation errors carry a `validation` array
    if (error.validation) {
      return reply.status(400).send({ error: error.message });
    }

    const status = error.statusCode ?? 500;

    // Sanitize 5xx — never leak internal details (stack, DB messages, etc.)
    if (status >= 500) {
      return reply
        .status(500)
        .send({ error: "Internal server error. Please try again." });
    }

    // 4xx thrown by route code — pass message through (these are intentional)
    return reply.status(status).send({ error: error.message });
  });

  // ── Health check ────────────────────────────────────────────────────────────
  // No prefix — Railway health checks hit /health directly
  app.get("/health", async () => ({ status: "ok", service: "hatchquest-backend" }));

  // ── Game routes ─────────────────────────────────────────────────────────────
  app.register(startRoutes, { prefix, store });
  app.register(classifyRoutes, { prefix, store });
  app.register(choiceRoutes, {
    prefix,
    store,
    getSkeleton: effectiveGetSkeleton,
    generateSkin: effectiveGenerateSkin,
    selectNextNodeId,
  });
  // sessionRoutes still uses getNode from old scenario-registry until Task 13 migration
  app.register(sessionRoutes, { prefix, store, getNode });
  app.register(resultsRoutes, { prefix, store });

  return app;
}
