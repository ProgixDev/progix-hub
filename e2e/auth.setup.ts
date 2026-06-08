import path from "node:path";
import { test as setup, expect } from "@playwright/test";

const memberFile = path.join(__dirname, ".auth/member.json");

// @cuj keeps this in the `e2e:shots` (--grep @cuj) run so the member project's
// session dependency is satisfied when capturing CUJ screenshots.
setup("@cuj seed a verified-member session", async ({ page }) => {
  await page.goto("/auth/test-login");
  // The route signs the test member in and redirects to the portfolio.
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await page.context().storageState({ path: memberFile });
});
