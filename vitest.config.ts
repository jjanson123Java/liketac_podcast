import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    exclude: ["companion/**", "tests/e2e/**", "tests/smoke/**", "**/node_modules/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
