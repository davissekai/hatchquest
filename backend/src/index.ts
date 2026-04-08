import type { ISessionStore } from "./store/types.js";
import { buildApp } from "./app.js";

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

/** Starts the Fastify server on the configured port. */
const start = async (): Promise<void> => {
  try {
    const store = await buildStore();
    const app = await buildApp(store, { logger: true });
    const port = Number(process.env.PORT ?? 3001);
    await app.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
