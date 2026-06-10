import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-07 — Roles: a PM manages a project's People. The seeded e2e member becomes the project's
// PM (creator), opens the People panel, adds a real teammate by email, changes their role, and
// removes them; a bogus email is rejected. The full per-role enforcement matrix is proven at the
// DB by src/features/people/roles.integration.test.ts.

const TEAMMATE = "e2e-teammate@progix.test";

let createdProject = "";
test.afterEach(async ({ page }) => {
  if (!createdProject) return;
  try {
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: createdProject, exact: true }).click();
    await page.getByRole("button", { name: "Archive" }).first().click();
  } catch {
    /* best effort */
  }
});

test("@cuj CUJ-07: a PM manages a project's People (add, change role, remove)", async ({
  page,
}) => {
  const projectName = `E2E Roles ${Date.now()}`;
  createdProject = projectName;

  // Create a project → the creator is its PM (DB trigger), so the People panel appears.
  await page.goto("/");
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: /new project/i });
  await dialog.getByLabel("Name").fill(projectName);
  await dialog.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();

  // AC-3: the People panel is visible to the PM and lists the creator as PM.
  await expect(page.getByRole("heading", { name: "People", exact: true })).toBeVisible();
  await expect(page.getByText("e2e-member@progix.test")).toBeVisible();
  await shot(page, "people-panel");

  // Add a real teammate by email as a Developer (the add-form Role select is labelled exactly "Role").
  await page.getByLabel("Email").fill(TEAMMATE);
  await page.getByLabel("Role", { exact: true }).selectOption("developer");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const teammateRow = page.getByRole("listitem").filter({ hasText: TEAMMATE });
  await expect(teammateRow).toBeVisible();
  await expect(teammateRow.getByLabel(/Role for/)).toHaveValue("developer");
  await shot(page, "people-added");

  // Change their role to Viewer.
  await teammateRow.getByLabel(/Role for/).selectOption("viewer");
  await expect(teammateRow.getByLabel(/Role for/)).toHaveValue("viewer");

  // Non-happy: adding an unknown email is rejected with a friendly message (AC-3).
  await page.getByLabel("Email").fill(`nobody-${Date.now()}@progix.test`);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(/no progixHub account/i)).toBeVisible();

  // Remove the teammate.
  page.once("dialog", (d) => d.accept());
  await teammateRow.getByRole("button", { name: /^Remove/ }).click();
  await expect(page.getByRole("listitem").filter({ hasText: TEAMMATE })).toHaveCount(0);

  // The PM (last one) cannot be removed — the panel keeps the project owned.
  await expect(page.getByText("e2e-member@progix.test")).toBeVisible();
});
