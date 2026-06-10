import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// AC-1 — a signed-out visitor only ever sees the sign-in screen.
test("@cuj AC-1: signed-out visitor is redirected from the portfolio to sign-in", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
  await shot(page, "sign-in");
});

test("AC-1: signed-out visitor is redirected from a project URL", async ({ page }) => {
  await page.goto("/projects/11111111-1111-1111-1111-111111111111");
  await expect(page).toHaveURL(/\/sign-in/);
});

// Spec 005 AC-7 — Settings is behind the same membership gate as everything else.
test("AC-7: signed-out visitor is redirected from /settings", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in/);
});

// Spec 006 AC-9 — the member portal page is gated, while /share stays public (no redirect,
// just the friendly inactive screen for a token that doesn't resolve).
test("AC-9: member portal redirects signed-out; /share answers without an account", async ({
  page,
}) => {
  await page.goto("/projects/11111111-1111-1111-1111-111111111111/portal");
  await expect(page).toHaveURL(/\/sign-in/);

  await page.goto(`/share/${"x".repeat(43)}`);
  await expect(page).not.toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: /no longer active/i })).toBeVisible();
});

// AC-2 (UI) — a non-member is told they don't have access (decision is unit-tested too).
test("@cuj AC-2: access-denied message renders for a non-member", async ({ page }) => {
  await page.goto("/sign-in?error=access_denied");
  await expect(page.getByText(/member of the Progix organization/i)).toBeVisible();
  await shot(page, "access-denied");
});
