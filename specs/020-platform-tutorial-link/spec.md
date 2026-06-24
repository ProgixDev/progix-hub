# Spec 020 — Link a tutorial to a platform

- **Status:** shipped
- **Type:** enhancement
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-24
- **Slice / areas touched:** `src/features/platforms` (form picker, type, action); the platforms Settings page (passes tutorial options); migration (platforms `tutorial_id`, drop `video_url`; update `setup_public_view`). Extends 015; reads 016; updates 017.

## Problem (the why)

The platform form has a free-text "Tutorial video link." But videos are created and managed in the **Tutorials** library — pasting a URL here duplicates that and drifts. A platform should instead **pick one of the existing tutorials**.

## Desired behavior (the what)

A platform can attach **several tutorials**, each labeled by purpose (e.g. "Create the account", "Invite us", …) — because a platform often needs more than one how-to. In the platform form there's a **Tutorial videos** section: an **Add video** button opens a **picker modal listing the tutorials** already in the library (title + platform tag); the member selects one and gives it a short label. Added videos show as a labeled list, each removable; they can be reordered by add order. No URLs are typed here. On the client setup page, the platform step shows **each attached tutorial's** video (those that are embeds marked client-visible), under its label.

## Acceptance criteria

- **AC-1 (pick from library):** The platform form has an Add-video button opening a modal of existing tutorials; selecting one (with a label) attaches it to the platform and lists it. No free-text URL entry remains.
- **AC-2 (multiple + manage):** A platform can hold several labeled tutorials; a member can add more and remove any; the set persists (order preserved).
- **AC-3 (client page shows them):** The client setup page shows each attached tutorial's video, under its label, when it's an embed marked client-visible; otherwise that one is omitted — never a raw/unsafe or private source.
- **AC-4 (referential safety — non-happy):** Deleting a tutorial that platforms reference just drops those links (cascade); platforms stay intact, no broken video.

## Out of scope

- Creating/editing tutorials from the platform form (still done in the Tutorials library).
- Showing uploaded (non-embed) tutorials on the client page (embed-only there, per 019).
- Drag-to-reorder (kept simple — order follows the add order).

## CUJ impact

- Extends CUJ-10 (Configure a platform) — the tutorial is now chosen from the library, not typed. No new CUJ.

## Open questions

Resolved in planning (2026-06-24): the platform stores a `tutorial_id` foreign key (on delete → null); the old free-text `video_url` column is removed (it was unused by any read path). The client setup page resolves the video from the platform's `tutorial_id` (embed + client-visible only).
