import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

// DATABASE_URL must be set when using DbSessionStore.
// In dev, point at the test project connection string (Transaction mode).
// In prod (Railway), point at the prod project connection string.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Set it to the Supabase connection string before importing this module."
  );
}

const queryClient = postgres(url);

/** Pre-configured Drizzle client — import this wherever DB access is needed. */
export const db = drizzle(queryClient, { schema });
