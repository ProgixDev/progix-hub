import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-01 — Land and orient (docs/product/critical-user-journeys.md)
test("@cuj CUJ-01: visitor lands and understands what progixHub is", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /the home base for every progix project/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /one home per project/i })).toBeVisible();
  // The orientation promise: the four surfaces are named on the landing.
  await expect(page.getByText(/notion explains.*github tracks/i)).toBeVisible();
  await shot(page, "home-landing");
});
