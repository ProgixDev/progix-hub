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

  // The env row is the listitem with the key that also carries an Edit button
  // (the audit trail lists the same key but has no row controls).
  const row = page
    .getByRole("listitem")
    .filter({ hasText: key })
    .filter({ has: page.getByRole("button", { name: "Edit" }) });
  await expect(row).toBeVisible();
  await expect(row.getByLabel("value")).toHaveText("••••••••••••");
  await shot(page, "env-list");

  // AC-3: reveal shows the real value.
  await row.getByRole("button", { name: "Reveal" }).click();
  await expect(row.getByLabel("value")).toHaveText(value);
  await shot(page, "env-revealed");

  // AC-4: copy places it on the clipboard.
  await row.getByRole("button", { name: "Copy" }).click();
  await expect(row.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);

  // AC-10: the audit trail records the activity (open the collapsible).
  await page.getByText(/recent activity/i).click();
  await expect(page.getByText(/revealed/i).first()).toBeVisible();
  await shot(page, "env-audit");

  // AC-8: edit (keep the value) then delete with confirmation.
  await row.getByRole("button", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog", { name: /edit variable/i });
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(editDialog).toBeHidden();

  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: key })
      .filter({ has: page.getByRole("button", { name: "Edit" }) }),
  ).toHaveCount(0);
  await shot(page, "env-deleted");
});
