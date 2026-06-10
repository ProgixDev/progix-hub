import { expect, test, type Page } from "@playwright/test";
import { shot } from "./utils/shot";

// Spec 007 — mobile responsiveness + installable PWA. Runs under the `mobile` Playwright
// project (Pixel 5, 393×851) as a seeded member, plus an anonymous client for the share page.

/** No screen may produce a horizontal scrollbar at a phone width. */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  });
  // 1px tolerance for sub-pixel rounding.
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test("@cuj AC-1/2/3/4: phone layout — no overflow, drawer nav, rows + dialogs fit", async ({
  page,
}) => {
  const projectName = `E2E Mobile ${Date.now()}`;

  // Portfolio: no overflow; the sidebar is collapsed behind a hamburger (AC-2).
  await page.goto("/");
  await expect(page.getByRole("button", { name: /open menu/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await shot(page, "portfolio-mobile");

  // AC-2: open the drawer, see the nav, close it from inside.
  await page.getByRole("button", { name: /open menu/i }).click();
  await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
  await shot(page, "drawer-mobile");
  await page.getByRole("button", { name: /close menu/i }).click();
  await expect(page.getByRole("link", { name: "Settings", exact: true })).not.toBeVisible();

  // AC-4: the new-project dialog fits and its submit is reachable.
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: /new project/i });
  await expect(dialog.getByRole("button", { name: "Create project" })).toBeVisible();
  await dialog.getByLabel("Name").fill(projectName);
  await expectNoHorizontalOverflow(page);
  await dialog.getByRole("button", { name: "Create project" }).click();

  // Project detail: env-vars + documents sections at phone width — no overflow (AC-1/3).
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await shot(page, "project-detail-mobile");

  // Cleanup: archive the project so it doesn't accumulate on the shared DB.
  await page.getByRole("button", { name: "Archive" }).first().click();
});

test("@cuj AC-5: the client portal is usable on a phone", async ({ page }) => {
  const projectName = `E2E Mobile Portal ${Date.now()}`;

  // Build a minimal portal + share link.
  await page.goto("/");
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: /new project/i });
  await dialog.getByLabel("Name").fill(projectName);
  await dialog.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await page.getByRole("link", { name: /client portal/i }).click();
  await page.getByRole("button", { name: "Add block" }).click();
  const blockDialog = page.getByRole("dialog", { name: /new block/i });
  await blockDialog.getByLabel("Name").fill("App");
  await blockDialog.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "Add feature" }).click();
  const cardDialog = page.getByRole("dialog", { name: /new feature/i });
  await cardDialog.getByLabel("Title").fill("Authentication");
  await cardDialog.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "Create share link" }).click();
  const shareUrl = await page.locator("code").innerText();

  // Open the public share page at phone width — no overflow, comment box reachable (AC-5).
  await page.goto(shareUrl);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("Authentication")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.getByPlaceholder(/write a comment/i).first()).toBeVisible();
  await shot(page, "share-mobile");

  // Cleanup.
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await page.getByRole("button", { name: "Archive" }).first().click();
});

test("AC-6: a valid web manifest + icons are served for installability", async ({ page }) => {
  // The manifest is valid and complete (the heart of installability).
  const res = await page.request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.name).toBe("progixHub");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBeTruthy();
  expect(manifest.theme_color).toBeTruthy();
  expect(Array.isArray(manifest.icons) && manifest.icons.length).toBeGreaterThan(0);

  // The icon assets resolve.
  expect((await page.request.get("/icon.svg")).ok()).toBe(true);
  expect((await page.request.get("/apple-icon")).ok()).toBe(true);

  // The server-rendered HTML wires the manifest, apple-touch-icon, and theme-color
  // (raw SSR string — deterministic, no DOM/streaming timing race).
  const html = await (await page.request.get("/sign-in")).text();
  expect(html).toContain("manifest.webmanifest");
  expect(html).toContain("apple-touch-icon");
  expect(html).toContain('name="theme-color"');
});
