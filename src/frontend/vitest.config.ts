import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the frontend suite.
 *
 * The DOM environment is set here as well as in the `test` script so a focused
 * `vitest run <file>` invocation behaves the same as the gated `pnpm test`.
 * Aliases mirror `vite.config.js` so tests import through the same `@` and
 * `declarations` specifiers the application uses.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@icp-sdk/core"],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
    // The build container pins thread counts through the environment, which
    // makes Vitest's default pool reject its own min/max as conflicting. A
    // single forked worker sidesteps that and is plenty for this suite.
    pool: "forks",
    poolOptions: {
      forks: { minForks: 1, maxForks: 1 },
    },
  },
});
