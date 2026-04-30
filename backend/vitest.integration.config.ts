/**
 * Vitest config for integration tests.
 *
 * Integration tests require a live Supabase connection.
 * Set DATABASE_URL in your environment (Transaction mode, port 6543) before running:
 *
 *   DATABASE_URL=postgresql://... npm run test:integration --workspace=backend
 *
 * These tests are intentionally excluded from the standard `npm test` suite
 * so they never block CI without a DB connection.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.integration.test.ts"],
  },
});
