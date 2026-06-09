import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-04 — Manage a project's documents (spec 004). Runs as a seeded member.
test("@cuj CUJ-04: member uploads a file, adds a link + note, switches tabs, edits, archives", async ({
  page,
}) => {
  const projectName = `E2E Docs ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const projectDialog = page.getByRole("dialog", { name: /new project/i });
  await projectDialog.getByLabel("Name").fill(projectName);
  await projectDialog.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

  // AC-9: empty state.
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await expect(page.getByText(/no documents yet/i)).toBeVisible();
  await shot(page, "doc-empty");

  // AC-1: upload a file (the input is hidden behind the "Upload file" button).
  await page.locator('input[type="file"]').setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% progixHub e2e\n"),
  });
  const fileRow = page.getByRole("listitem").filter({ hasText: "sample.pdf" });
  await expect(fileRow).toBeVisible();
  await expect(fileRow.getByRole("button", { name: /download/i })).toBeVisible();
  await shot(page, "doc-files");

  // AC-2: add a link.
  await page.getByRole("button", { name: "Add link" }).click();
  const linkDialog = page.getByRole("dialog", { name: /new link/i });
  await linkDialog.getByLabel("Title").fill("Figma board");
  await linkDialog.getByLabel("URL").fill("https://figma.com/board");
  await linkDialog.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("link", { name: "Figma board" })).toBeVisible();

  // AC-3: add a Markdown note.
  await page.getByRole("button", { name: "Add note" }).click();
  const noteDialog = page.getByRole("dialog", { name: /new note/i });
  await noteDialog.getByLabel("Title").fill("Kickoff notes");
  await noteDialog.getByLabel(/Note/).fill("# Goals\n\n- ship **docs**");
  await noteDialog.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Kickoff notes")).toBeVisible();
  await shot(page, "doc-all");

  // AC-4: the Links tab shows only links (not the file).
  await page.getByRole("tab", { name: /Links/ }).click();
  await expect(page.getByRole("link", { name: "Figma board" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "sample.pdf" })).toHaveCount(0);

  // AC-8: edit the link.
  const linkRow = page.getByRole("listitem").filter({ hasText: "Figma board" });
  await linkRow.getByRole("button", { name: /^Edit/ }).click();
  const editDialog = page.getByRole("dialog", { name: /edit link/i });
  await editDialog.getByLabel("Title").fill("Figma board v2");
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("link", { name: "Figma board v2" })).toBeVisible();

  // AC-7: archive (with confirm) hides it.
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("listitem")
    .filter({ hasText: "Figma board v2" })
    .getByRole("button", { name: /^Archive/ })
    .click();
  await expect(page.getByRole("link", { name: "Figma board v2" })).toHaveCount(0);

  // AC-7: restore it from the Archived panel. Wait for the server revalidation to
  // repopulate the archived list before opening the panel (it renders only when non-empty).
  const archivedSummary = page.getByText(/^Archived \(/);
  await expect(archivedSummary).toBeVisible();
  await archivedSummary.click();
  const archivedRow = page.getByRole("listitem").filter({ hasText: "Figma board v2" });
  const restore = archivedRow.getByRole("button", { name: /^Restore/ });
  await expect(restore).toBeVisible();
  await shot(page, "doc-archived"); // the expanded panel + Restore — AC-7 evidence
  await restore.click();
  await expect(page.getByRole("link", { name: "Figma board v2" })).toBeVisible();
});
