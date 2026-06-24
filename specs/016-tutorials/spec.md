# Spec 016 — Tutorials (video library)

- **Status:** shipped
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-24
- **Slice / areas touched:** new `src/features/tutorials`; new sidebar item + route `/tutorials`; migration (`tutorials` table + RLS). Feature ② of the client-onboarding epic — see [PRD](../../docs/product/prd-client-onboarding.md). Builds on 014 (roles), 015 (platforms).

## Problem (the why)

The team re-explains the same how-tos ("create your Stripe account", "invite us to Vercel") on every project. We want to record each explanation once and keep them in one place, so a link replaces a call. This is the video library the platform registry (015) and the client onboarding page (③) point at.

## Desired behavior (the what)

A **Tutorials** item in the sidebar opens a library of short how-to videos, visible to every signed-in member. Each tutorial has a title, an optional description, an optional **platform tag** (one of the configured platforms), an optional **language** (EN/FR, or both), and a flag for whether it may be **shown to clients** (on a future onboarding page). A video is added by **pasting an embed link** — a YouTube (incl. unlisted), Loom, or Vimeo URL — which the page renders as an inline player. The library shows each tutorial with its player and tag; members can filter/scan by platform.

**Superadmins and global PMs** can add, edit, and delete tutorials; every other member can watch but not change them. Bilingual UI (EN/FR).

## Acceptance criteria

- **AC-1 (add & play):** An authorized member can add a tutorial with a title + a YouTube/Loom/Vimeo link; it appears in the library and renders as an inline, playable embed.
- **AC-2 (organize):** A tutorial can carry an optional platform tag, language, and "show to clients" flag; the library displays the tag and lets a member find a platform's videos.
- **AC-3 (edit/delete):** An authorized member can edit a tutorial's fields and delete it.
- **AC-4 (permission — non-happy):** A member who is not a superadmin or global PM can watch the library but cannot add/edit/delete; the change is refused server-side (RLS / action guard), not just hidden.
- **AC-5 (bad link — non-happy):** Saving a link that isn't a recognized YouTube/Loom/Vimeo URL is rejected with a clear message and nothing is written (no arbitrary/unsafe iframe source is ever embedded).

## Out of scope

- **Direct file uploads** (Supabase Storage) — a documented fast-follow; v1 is embed links only (the team hosts on YouTube unlisted to avoid storage cost).
- Surfacing tutorials on the client onboarding page (that's feature ③; this spec only stores them + the "show to clients" flag).
- Comments, view counts, playlists, transcripts, or auto-generated chapters.
- Editing the platform registry (that's spec 015).

## CUJ impact

- Registers a new CUJ — **Add a tutorial:** open Tutorials → add a YouTube link with a platform tag → it plays inline; a non-admin sees the library read-only. (Add to `docs/product/critical-user-journeys.md` at ship.)

## Open questions

Resolved in planning (2026-06-24): v1 is **embed links only** (YouTube/Loom/Vimeo); uploads are a fast-follow. Only http(s) links from those three hosts are accepted and rendered (no arbitrary iframe src). Platform tag references a configured platform (015) by its service key; deleting a platform leaves the tag as a harmless orphan label.
