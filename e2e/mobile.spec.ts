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

// Best-effort cleanup so the shared dev/prod DB doesn't accumulate `E2E Mobile …` projects
// even if a test fails mid-way (mirrors settings.spec).
const createdProjects: string[] = [];
test.afterEach(async ({ page }) => {
  for (const name of createdProjects.splice(0)) {
    try {
      await page.goto("/");
      await page.getByRole("main").getByRole("link", { name, exact: true }).click();
      await page.getByRole("button", { name: "Archive" }).first().click();
    } catch {
      // ignore — cleanup is best-effort
    }
  }
});

/** The dialog box stays within the viewport (not just "a button is visible"). */
async function expectDialogWithinViewport(page: Page, dialog: ReturnType<Page["getByRole"]>) {
  const box = await dialog.boundingBox();
  const width = page.viewportSize()?.width ?? 393;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
}

test("@cuj AC-1/2/3/4: phone layout — no overflow, drawer nav, populated rows + dialogs fit", async ({
  page,
}) => {
  const projectName = `E2E Mobile ${Date.now()}`;
  createdProjects.push(projectName);

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

  // AC-4: the new-project dialog fits within the viewport and its submit is reachable.
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: /new project/i });
  await expect(dialog.getByRole("button", { name: "Create project" })).toBeVisible();
  await expectDialogWithinViewport(page, dialog);
  await dialog.getByLabel("Name").fill(projectName);
  await expectNoHorizontalOverflow(page);
  await dialog.getByRole("button", { name: "Create project" }).click();

  // AC-1/3: open the project, add a real env-var row, and confirm the populated list of
  // multi-control rows still doesn't overflow and stays functional at phone width.
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await page.getByRole("button", { name: "Add variable" }).first().click();
  const envDialog = page.getByRole("dialog", { name: /new variable/i });
  await envDialog.getByLabel("Key").fill("STRIPE_SECRET_KEY");
  await envDialog.getByLabel(/^Value/).fill("sk_test_mobile_123");
  await envDialog.getByRole("button", { name: "Add variable" }).click();
  const row = page.getByRole("listitem").filter({ hasText: "STRIPE_SECRET_KEY" });
  await expect(row).toBeVisible();
  await expect(row.getByRole("button", { name: /reveal/i })).toBeVisible(); // row control reachable
  await expectNoHorizontalOverflow(page);
  await shot(page, "project-detail-mobile");
});

test("@cuj AC-5: the client portal is usable on a phone", async ({ page }) => {
  const projectName = `E2E Mobile Portal ${Date.now()}`;
  createdProjects.push(projectName);

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

  // Open the public share page at phone width — read, no overflow, AND actually comment
  // (the interaction AC-5 promises), proving the comment controls work on a phone.
  await page.goto(shareUrl);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("Authentication")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await shot(page, "share-mobile");

  await page
    .getByPlaceholder(/your name/i)
    .first()
    .fill("Mobile Client");
  await page
    .getByPlaceholder(/write a comment/i)
    .first()
    .fill("Looks great on my phone!");
  await page.getByRole("button", { name: "Send" }).first().click();
  await expect(page.getByText("Looks great on my phone!")).toBeVisible();
  await expectNoHorizontalOverflow(page);
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
