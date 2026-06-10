import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-06 — Share the portal (spec 006). The member side runs with the seeded session; the
// client side runs in a FRESH anonymous context (no storage state) — exactly like a real
// client opening the share link without an account.
// Best-effort: archive the project this spec creates so it doesn't accumulate on the shared
// dev/prod DB (other member specs follow the same discipline). Archived projects drop out of
// the portfolio's default view.
let createdProjectName = "";
test.afterEach(async ({ page }) => {
  if (!createdProjectName) return;
  try {
    await page.goto("/");
    await page
      .getByRole("main")
      .getByRole("link", { name: createdProjectName, exact: true })
      .click();
    await page.getByRole("button", { name: "Archive" }).first().click();
  } catch {
    // ignore — cleanup is best-effort
  }
});

test("@cuj CUJ-06: member builds the portal + share link; client views, comments, proposes; member triages; rotate kills the old link", async ({
  page,
  browser,
}) => {
  const projectName = `E2E Portal ${Date.now()}`;
  createdProjectName = projectName;

  // Member: create a project and open its portal.
  await page.goto("/");
  await page.getByRole("main").getByRole("button", { name: "New project" }).first().click();
  const projectDialog = page.getByRole("dialog", { name: /new project/i });
  await projectDialog.getByLabel("Name").fill(projectName);
  await projectDialog.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("main").getByRole("link", { name: projectName, exact: true }).click();
  await page.getByRole("link", { name: /client portal/i }).click();
  await expect(page.getByRole("heading", { name: "Client portal" })).toBeVisible();
  await shot(page, "portal-member-empty");

  // AC-1: block + feature card.
  await page.getByRole("button", { name: "Add block" }).click();
  const blockDialog = page.getByRole("dialog", { name: /new block/i });
  await blockDialog.getByLabel("Name").fill("App");
  await blockDialog.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: /^App/ })).toBeVisible();

  await page.getByRole("button", { name: "Add feature" }).click();
  const cardDialog = page.getByRole("dialog", { name: /new feature/i });
  await cardDialog.getByLabel("Title").fill("Authentication");
  await cardDialog.getByLabel("Description").fill("GitHub sign-in, org-gated.");
  await cardDialog.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Authentication")).toBeVisible();

  // AC-2: mint the share link — the raw URL is shown exactly once.
  await page.getByRole("button", { name: "Create share link" }).click();
  const shareUrl = await page.locator("code").innerText();
  expect(shareUrl).toMatch(/\/share\/[A-Za-z0-9_-]{40,50}$/);
  await shot(page, "portal-member-filled");

  // Client: a brand-new anonymous browser context (AC-3).
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  await client.goto(shareUrl);
  await expect(client.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(client.getByText("Authentication")).toBeVisible();
  await expect(client.getByText("Delivered")).toBeVisible();

  // AC-4: comment with a display name.
  await client.getByPlaceholder("Your name").first().fill("Claire Client");
  await client.getByPlaceholder(/write a comment/i).fill("Love this — works perfectly.");
  await client.getByRole("button", { name: "Send" }).click();
  await expect(client.getByText("Love this — works perfectly.")).toBeVisible();

  // AC-5: attach a small PDF to the card.
  await client.locator('input[type="file"]').setInputFiles({
    name: "feedback.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% portal e2e\n"),
  });
  await expect(client.getByText("feedback.pdf")).toBeVisible();

  // AC-6: propose a feature.
  await client.getByRole("button", { name: "Propose a feature" }).click();
  const propose = client.getByRole("form", { name: "Propose a feature" });
  await propose.getByPlaceholder("Title").fill("Mobile app");
  await propose.getByPlaceholder("Description").fill("An iOS version, please.");
  await propose.getByRole("button", { name: "Submit proposal" }).click();
  await expect(client.getByText(/the team will review/i)).toBeVisible();
  await shot(client, "portal-client");

  // Member sees the client activity and accepts the proposal (status → Planned).
  await page.reload();
  await expect(page.getByText("Love this — works perfectly.")).toBeVisible();
  await expect(page.getByText("feedback.pdf")).toBeVisible();
  await expect(page.getByRole("heading", { name: /client proposals/i })).toBeVisible();
  const proposalCard = page.getByRole("listitem").filter({ hasText: "Mobile app" });
  await proposalCard.getByLabel("Status").selectOption("planned");
  // The controlled select reflects the revalidated server state once the action lands.
  await expect(proposalCard.getByLabel("Status")).toHaveValue("planned");
  await shot(page, "portal-member-triage");

  // AC-2: rotate — the old link goes dark for the client.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Rotate" }).click();
  await expect(page.locator("code")).toBeVisible(); // fresh URL minted
  await client.goto(shareUrl);
  await expect(client.getByRole("heading", { name: /no longer active/i })).toBeVisible();
  await shot(client, "portal-inactive");

  await clientContext.close();
});
