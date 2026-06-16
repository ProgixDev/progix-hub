import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-08 — Member GitHub profile (spec 012). A signed-in member opens their own profile, sees the
// GitHub activity + recent-commits sections (and, with no GitHub linked yet, the Connect prompt),
// then opens the org directory and another member's profile. The GitHub integration is unconfigured
// in CI/local, so the activity sections show their graceful "unavailable" states (AC-6) — proving
// the page never breaks without the GITHUB_TOKEN secret.

test("@cuj CUJ-08: a member views their GitHub profile and the org directory", async ({ page }) => {
  // Reach the personal profile from the account menu (AC-3).
  await page.goto("/");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/profile$/);

  // Identity + standing + both activity sections render.
  await expect(page.getByRole("heading", { name: "GitHub activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent commits" })).toBeVisible();

  // No token configured ⇒ graceful unavailable/empty states, never an error (AC-6).
  await expect(
    page.getByText("GitHub activity isn’t available for this member yet."),
  ).toBeVisible();
  await expect(page.getByText("No recent commits to show.")).toBeVisible();

  // Unlinked member ⇒ the Connect GitHub prompt is offered (AC-1 entry point).
  await expect(page.getByRole("button", { name: "Connect GitHub" })).toBeVisible();
  await shot(page, "profile");

  // The org directory is visible to any member (AC-4) — not just superadmins/leads/PMs.
  await page.goto("/members");
  await expect(page.getByRole("heading", { name: "Members", exact: true })).toBeVisible();
  await shot(page, "members-directory");

  // Opening a member shows their profile + activity sections (AC-3) — here, viewing self.
  const firstMember = page.getByRole("main").getByRole("link").first();
  if (await firstMember.count()) {
    await firstMember.click();
    await expect(page.getByRole("heading", { name: "GitHub activity" })).toBeVisible();
    await shot(page, "member-profile");
  }
});
