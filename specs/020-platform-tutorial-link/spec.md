# Spec 020 — Link a tutorial to a platform

- **Status:** active
- **Type:** enhancement
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-24
- **Slice / areas touched:** `src/features/platforms` (form picker, type, action); the platforms Settings page (passes tutorial options); migration (platforms `tutorial_id`, drop `video_url`; update `setup_public_view`). Extends 015; reads 016; updates 017.

## Problem (the why)

The platform form has a free-text "Tutorial video link." But videos are created and managed in the **Tutorials** library — pasting a URL here duplicates that and drifts. A platform should instead **pick one of the existing tutorials**.

## Desired behavior (the what)

In the platform form, the "Tutorial video" row is a **button**. Clicking it opens a **picker modal listing the tutorials** already in the library (title + platform tag); the member selects one and it's attached to the platform (the button then shows the chosen tutorial's title, with a way to change or clear it). No URLs are typed here. On the client setup page, the platform shows **its chosen tutorial's** video (when that tutorial is an embed marked client-visible) instead of guessing by platform name.

## Acceptance criteria

- **AC-1 (pick from library):** The platform form's tutorial field is a button that opens a modal of existing tutorials; selecting one attaches it to the platform and shows its title. No free-text URL entry remains.
- **AC-2 (change / clear):** A member can change the selected tutorial or clear it (no tutorial); the platform persists the reference (or none).
- **AC-3 (client page uses the choice):** The client setup page shows the platform's **chosen** tutorial's video when it's an embed marked client-visible; otherwise no video — never a raw/unsafe or private source.
- **AC-4 (referential safety — non-happy):** Deleting a tutorial that a platform references leaves the platform intact with no tutorial (the reference clears), not a broken link.

## Out of scope

- Creating/editing tutorials from the platform form (still done in the Tutorials library).
- Showing uploaded (non-embed) tutorials on the client page (embed-only there, per 019).
- Multiple tutorials per platform (one chosen tutorial).

## CUJ impact

- Extends CUJ-10 (Configure a platform) — the tutorial is now chosen from the library, not typed. No new CUJ.

## Open questions

Resolved in planning (2026-06-24): the platform stores a `tutorial_id` foreign key (on delete → null); the old free-text `video_url` column is removed (it was unused by any read path). The client setup page resolves the video from the platform's `tutorial_id` (embed + client-visible only).
