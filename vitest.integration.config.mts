import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": directory,
      "server-only": path.join(directory, "tests/helpers/server-only.ts"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    passWithNoTests: false,
    setupFiles: ["dotenv/config"],
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
