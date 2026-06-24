import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ — Client onboarding (spec 017). The public /setup link is passcode-gated and leaks nothing
// without the right passcode (AC-2/AC-6). Building the page is a PM-only action on the project
// (gated by can.manageProject) and is covered by the action unit tests + the appsec review.

test("@cuj CUJ-12: the public setup link is passcode-gated and leaks nothing", async ({ page }) => {
  const bogusToken = "a".repeat(43);
  await page.goto(`/setup/${bogusToken}`);

  // The gate shows; no project data is revealed without a valid passcode.
  await expect(page.getByRole("heading", { name: "Enter your passcode" })).toBeVisible();
  await shot(page, "setup-gate");

  // A wrong passcode is refused (AC-2) — and still nothing leaks.
  await page.getByPlaceholder("Passcode").fill("WRONGPAS");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("That passcode isn’t right.")).toBeVisible();
});
