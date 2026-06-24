import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ — Configure a platform (spec 015). The seeded member is a regular member (not a superadmin
// or global PM), so they can open the registry but it is read-only: no Add/Edit/Delete (AC-4). The
// manager write paths are covered by unit tests (actions can't run as a superadmin in e2e).

test("@cuj CUJ-10: a member reaches the platform registry read-only", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("link", { name: "Platforms" }).first().click();
  await expect(page).toHaveURL(/\/settings\/platforms$/);

  await expect(page.getByRole("heading", { name: "Platforms", exact: true })).toBeVisible();
  // A non-admin sees the catalog but no management controls (AC-4).
  await expect(page.getByRole("button", { name: "Add platform" })).toHaveCount(0);
  await shot(page, "platforms");
});
