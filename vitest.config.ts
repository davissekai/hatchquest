import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        environment: "jsdom",
        globals: true,
        include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.test.tsx"],
        setupFiles: ["src/__tests__/setup.ts"],
        coverage: {
            provider: "v8",
            include: ["src/engine/**"],
            thresholds: {
                lines: 100,    // 100% coverage required on engine per TDD spec
                functions: 100,
                branches: 100,
                statements: 100,
            },
        },
    },
});
