import { defineConfig, devices } from "@playwright/test";

/**
 * E2E + screenshot evidence config.
 * - Locally: reuses your `pnpm dev` server (or starts one).
 * - CI: expects a production build (`pnpm build`) and starts `pnpm start`.
 * Screenshots are written by e2e/utils/shot.ts into artifacts/screenshots/.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Seeds a verified-member session via the env-gated test-login route.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // Signed-out journeys (no stored session).
    {
      name: "signed-out",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Signed-in journeys reuse the seeded member session.
    {
      name: "member",
      testMatch: /(home|projects|env-vars|documents|settings|portal)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/member.json" },
      dependencies: ["setup"],
    },
    // Mobile-viewport checks (spec 007): responsiveness, the nav drawer, the PWA manifest.
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"], storageState: "e2e/.auth/member.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Enables the test-only sign-in route for the e2e run only (never set in production).
    env: { E2E_AUTH_BYPASS: "1" },
  },
});
