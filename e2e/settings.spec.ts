import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-05 — Personalize the app: language (EN/FR) + theme (light/dark), persisted per-user.
// The settings action writes the shared test user's metadata, so we always reset to
// English + Dark afterward to keep other specs' English assertions clean across runs.
test.afterEach(async ({ page }) => {
  try {
    await page.goto("/settings");
    await page.getByRole("radio", { name: "English" }).click();
    await expect(page.getByRole("link", { name: "Projects", exact: true })).toBeVisible();
    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  } catch {
    // best-effort cleanup
  }
});

test("@cuj CUJ-05: member switches language to French and theme to light, and it persists", async ({
  page,
}) => {
  // A project gives us a piece of user-authored content to prove it is NOT translated.
  const projectName = `E2E Settings ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: /new project/i });
  await dialog.getByLabel("Name").fill(projectName);
  await dialog.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("main").getByRole("link", { name: projectName })).toBeVisible();

  // AC-1: the controls reflect the current (default English/Dark) settings.
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Language" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "English" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await shot(page, "settings-default");

  // AC-2: switch to French — the app chrome translates, the project name does not.
  await page.getByRole("radio", { name: "Français" }).click();
  await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Projets", exact: true })).toBeVisible();
  await expect(page.getByText(projectName)).toBeVisible(); // user content unchanged

  // AC-3: switch to light — the whole app repaints.
  await page.getByRole("radio", { name: "Clair" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await shot(page, "settings-fr-light");

  // Wait for the server to persist the choices to cookies before reloading (no sleep —
  // poll the actual condition, since the optimistic repaint above lands before the cookie).
  await expect
    .poll(async () => (await page.context().cookies()).find((c) => c.name === "theme")?.value)
    .toBe("light");

  // AC-4: a full reload keeps both choices (persisted to the account + cookie).
  await page.reload();
  await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");

  // AC-5: the first paint is already correct — assert the raw server HTML, pre-hydration.
  const res = await page.request.get("/settings");
  const body = await res.text();
  expect(body).toContain('lang="fr"');
  expect(body).toContain('data-theme="light"');

  // AC-3 coverage on feature screens: the light palette + French apply app-wide, not just
  // on Settings. Capture the portfolio and a project detail (env-vars + documents sections).
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await shot(page, "portfolio-light-fr");
  await page.getByRole("main").getByRole("link", { name: projectName }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await shot(page, "project-light-fr");
  await page.goto("/settings");

  // Toggle back to English + Dark and confirm the chrome reverts (also the cleanup path).
  await page.getByRole("radio", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
