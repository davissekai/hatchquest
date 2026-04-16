import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    hookTimeout: 30000,
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**"],
      // Barrel re-export file — no executable logic, nothing to cover
      // Classifier wraps an external LLM call (callClaudeClassifier). The pure
      // logic functions are tested, but the API-call branches are external by design.
      // index.ts and rng.ts are barrel re-exports — no executable logic.
      // classifier.ts wraps an external LLM call tested via integration only.
      exclude: ["src/engine/index.ts", "src/engine/classifier.ts", "src/engine/rng.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
