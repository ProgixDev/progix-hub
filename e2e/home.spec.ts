import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-01 — Land and orient (docs/product/critical-user-journeys.md). Runs as a signed-in
// member (seeded session); the middleware would redirect a signed-out visitor to /sign-in.
test("@cuj CUJ-01: member lands on the projects portfolio and orients", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  // The primary action is always present, empty or not.
  await expect(
    page.getByRole("main").getByRole("button", { name: "New project" }).first(),
  ).toBeVisible();
  await shot(page, "portfolio");
});
