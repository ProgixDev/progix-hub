import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-03 — Manage a project's env vars (spec 003). Runs as a seeded member.
test("@cuj CUJ-03: member adds, reveals, copies, edits, and deletes an env var", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  // A fresh project to attach variables to.
  const projectName = `E2E Env ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const projectDialog = page.getByRole("dialog", { name: /new project/i });
  await projectDialog.getByLabel("Name").fill(projectName);
  await projectDialog.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

  // AC-9: empty state before any variable.
  await expect(page.getByText(/no variables yet/i)).toBeVisible();
  await shot(page, "env-empty");

  // AC-1: add a variable; the service logo auto-detects from the key.
  const key = "STRIPE_SECRET_KEY";
  const value = "sk_live_e2e_secret_123";
  await page.getByRole("button", { name: "Add variable" }).click();
  const dialog = page.getByRole("dialog", { name: /new variable/i });
  await dialog.getByLabel("Key").fill(key);
  await dialog.getByLabel("Value").fill(value);
  await shot(page, "env-create-form");
  await dialog.getByRole("button", { name: "Add variable" }).click();

  // The env row is the listitem with the key that also carries an Edit control
  // (the audit trail lists the same key but has no row buttons).
  const row = page
    .getByRole("listitem")
    .filter({ hasText: key })
    .filter({ has: page.getByRole("button", { name: /^Edit/ }) });
  await expect(row).toBeVisible();
  await expect(row.getByLabel("value")).toHaveText("••••••••••••");
  await shot(page, "env-list");

  // AC-7: a second variable with the same key is rejected with a clear message.
  await page.getByRole("button", { name: "Add variable" }).click();
  const dup = page.getByRole("dialog", { name: /new variable/i });
  await dup.getByLabel("Key").fill(key);
  await dup.getByLabel("Value").fill("another");
  await dup.getByRole("button", { name: "Add variable" }).click();
  await expect(dup.getByText(/already exists/i).first()).toBeVisible();
  await dup.getByRole("button", { name: "Cancel" }).click();

  // AC-3: reveal shows the real value.
  await row.getByRole("button", { name: /^Reveal/ }).click();
  await expect(row.getByLabel("value")).toHaveText(value);
  await shot(page, "env-revealed");

  // AC-4: copy places it on the clipboard.
  await row.getByRole("button", { name: /^Copy/ }).click();
  await expect(row.getByRole("button", { name: /^Copied/ })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);

  // AC-8: edit (keep the value) then delete with confirmation.
  await row.getByRole("button", { name: /^Edit/ }).click();
  const editDialog = page.getByRole("dialog", { name: /edit variable/i });
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(editDialog).toBeHidden();

  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: /^Delete/ }).click();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: key })
      .filter({ has: page.getByRole("button", { name: /^Edit/ }) }),
  ).toHaveCount(0);
  await shot(page, "env-deleted");

  // AC-3 / AC-4 / AC-10: the delete's revalidate refreshes the trail, which now shows the full
  // history — reveal, copy, and delete — and OUTLIVES the variable (the key is still recorded).
  await page
    .locator("details")
    .first()
    .evaluate((d) => ((d as HTMLDetailsElement).open = true));
  await expect(page.getByText(/revealed/i).first()).toBeVisible();
  await expect(page.getByText(/copied/i).first()).toBeVisible();
  await expect(page.getByText(/deleted/i).first()).toBeVisible();
  await expect(page.getByText(key).first()).toBeVisible();
  await shot(page, "env-audit");
});

// CUJ-03 (spec 009) — bulk import with auto-scope + grouped list, then export a scoped .env.
test("@cuj CUJ-03: member imports a .env and exports a scoped .env", async ({ page }) => {
  const projectName = `E2E Env IO ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const projectDialog = page.getByRole("dialog", { name: /new project/i });
  await projectDialog.getByLabel("Name").fill(projectName);
  await projectDialog.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

  // Open the import dialog, upload a frontend-hinted file and paste a backend var.
  await page.getByRole("button", { name: /^Import$/ }).click();
  const dialog = page.getByRole("dialog", { name: /import \.env/i });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: ".env.frontend",
    mimeType: "text/plain",
    buffer: Buffer.from("API_BASE=https://api.example.com\n"),
  });
  await dialog.getByLabel(/paste/i).fill("DB_SECRET=shh_backend_value");

  // AC-1: scope is auto-detected — the frontend file hints frontend, the pasted var is backend.
  await expect(dialog.getByLabel("Scope API_BASE")).toHaveValue("frontend");
  await expect(dialog.getByLabel("Scope DB_SECRET")).toHaveValue("backend");
  await shot(page, "env-import-preview");

  await dialog.getByRole("button", { name: /^Import/ }).click();
  await dialog.getByRole("button", { name: /^Close/ }).click();

  // The list now groups under Backend and Frontend headings.
  await expect(page.getByRole("heading", { name: "Backend" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frontend" })).toBeVisible();
  await expect(page.getByText("API_BASE")).toBeVisible();
  await expect(page.getByText("DB_SECRET")).toBeVisible();
  await shot(page, "env-import-grouped");

  // AC-4: export the backend scope and assert the downloaded .env contents.
  const downloadPromise = page.waitForEvent("download");
  await page.getByText(/^Export$/).click();
  await page.getByRole("button", { name: "Backend" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(".env.backend");
  const path = await download.path();
  const contents = readFileSync(path, "utf8");
  expect(contents).toContain("DB_SECRET=shh_backend_value");
  expect(contents).not.toContain("API_BASE");
});
