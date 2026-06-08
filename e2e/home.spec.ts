import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-01 — Land and orient (docs/product/critical-user-journeys.md)
test("@cuj CUJ-01: visitor lands on the projects portfolio and orients", async ({ page }) => {
  await page.goto("/");

  // The app shell is present (brand) and the portfolio is the landing view.
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Atlas Commerce" })).toBeVisible();
  // Project status is legible at a glance.
  await expect(page.getByText("At risk").first()).toBeVisible();
  await shot(page, "home-landing");
});
