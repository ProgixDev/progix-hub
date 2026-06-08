import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-02 — Create a project (spec 002). Runs as a seeded member.
test("@cuj CUJ-02: member creates, opens, and archives a project", async ({ page }) => {
  const name = `E2E Atlas ${Date.now()}`;
  await page.goto("/");

  // Open the create modal from the portfolio.
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: /new project/i });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("GitHub").fill("https://github.com/DigitariaWebs/atlas");
  await shot(page, "create-form");
  await dialog.getByRole("button", { name: "Create project" }).click();

  // AC-3: it appears in the portfolio (scope to main — it also shows in the sidebar recents).
  const cardLink = page.getByRole("main").getByRole("link", { name, exact: true });
  await expect(cardLink).toBeVisible();
  await shot(page, "portfolio-after-create");

  // AC-3: it persists across a reload.
  await page.reload();
  await expect(page.getByRole("main").getByRole("link", { name, exact: true })).toBeVisible();

  // Open the detail; AC-6: the set GitHub link is a working shortcut.
  await cardLink.click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub \(opens in a new tab\)/i })).toHaveAttribute(
    "target",
    "_blank",
  );
  await shot(page, "project-detail");

  // AC-5: archive flips the status and the Archive action disappears.
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Archived")).toBeVisible();
  await expect(page.getByRole("button", { name: "Archive" })).toBeHidden();
  await shot(page, "project-archived");
});
