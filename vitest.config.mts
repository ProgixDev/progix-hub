import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Live-DB integration tests run via `pnpm test:integration` (vitest.integration.config.mts).
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
