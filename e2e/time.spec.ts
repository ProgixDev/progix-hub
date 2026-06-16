import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ — Track work time (spec 013). The seeded member uses the header clock: Start working →
// running timer + Pause/Finish → Take a pause → Resume → Finish, and the control returns to
// "Start working". Reset first in case a prior run left a session open.

test("@cuj CUJ-09: a member clocks in, pauses, resumes, and finishes", async ({ page }) => {
  await page.goto("/");

  // Reset: if a session is already running/paused from a previous run, finish it.
  const finish = page.getByRole("button", { name: "Finish" });
  if (await finish.count()) await finish.first().click();

  const startBtn = page.getByRole("button", { name: "Start working" });
  await expect(startBtn).toBeVisible();
  await shot(page, "clock-off");

  await startBtn.click();
  await expect(page.getByRole("button", { name: "Take a pause" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish" })).toBeVisible();
  await shot(page, "clock-working");

  await page.getByRole("button", { name: "Take a pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await shot(page, "clock-paused");

  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Take a pause" })).toBeVisible();

  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("button", { name: "Start working" })).toBeVisible();

  // The directory reflects work status for the org (AC-4).
  await page.goto("/members");
  await expect(page.getByRole("heading", { name: "Members", exact: true })).toBeVisible();
  await shot(page, "members-status");
});
