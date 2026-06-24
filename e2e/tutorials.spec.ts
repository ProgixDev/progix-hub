import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ — Tutorials (spec 016). A member opens the library from the sidebar and watches; an embedded
// video renders as a YouTube/Loom/Vimeo iframe (never a raw/unsafe src). A non-admin sees no
// management controls (AC-4). Admin write paths are covered by unit tests.

test("@cuj CUJ-11: a member browses the tutorials library and a video embeds", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Tutorials" }).first().click();
  await expect(page).toHaveURL(/\/tutorials$/);
  await expect(page.getByRole("heading", { name: "Tutorials", exact: true })).toBeVisible();

  // A non-admin member sees no "Add tutorial" control (AC-4).
  await expect(page.getByRole("button", { name: "Add tutorial" })).toHaveCount(0);

  // The seeded tutorial renders as a safe YouTube embed iframe (AC-1).
  const frame = page.locator('iframe[src^="https://www.youtube.com/embed/"]').first();
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("src", /youtube\.com\/embed\/8VLGMiM-mm8/);

  await shot(page, "tutorials");
});
