# Spec 019 — Tutorial file uploads

- **Status:** shipped
- **Type:** enhancement
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-24
- **Slice / areas touched:** `src/features/tutorials` (form, player, data, actions); migration (tutorials `source_type`/`storage_path` + a private `tutorial-videos` Storage bucket + policies). Extends spec 016.

## Problem (the why)

Spec 016 shipped tutorials as embed links only (YouTube/Loom/Vimeo). Some how-tos aren't on a video host — the team wants to **upload a video file directly** and have it play in the library, without putting it on YouTube.

## Desired behavior (the what)

When adding/editing a tutorial, an authorized member chooses the source: **paste an embed link** (as today) **or upload a video file**. An uploaded file is stored privately and plays inline in the Tutorials library for signed-in members. Everything else about tutorials (tags, language, who can edit) is unchanged. Uploaded videos are **internal**: the client onboarding page continues to show only embed-link videos (an anonymous client can't be issued a private file URL) — to surface a tutorial to clients, use an embed link.

## Acceptance criteria

- **AC-1 (upload & play):** An authorized member can add a tutorial by uploading a video file; it stores privately and plays inline in the library for members.
- **AC-2 (embed still works):** Pasting an embed link works exactly as before; each tutorial is either an embed or an upload, not both.
- **AC-3 (private — non-happy):** The uploaded file lives in a private bucket; it is not anonymously listable or readable, and is served to members only via a short-lived signed URL.
- **AC-4 (validation — non-happy):** A non-video file or one over the size limit is rejected; saving an upload with no file (or an embed with no link) is rejected with a clear message and nothing is written.
- **AC-5 (client surface unchanged):** The client setup page shows only embed-link tutorial videos; an uploaded-only tutorial contributes no video there (no broken/private link leaks).

## Out of scope

- Transcoding, thumbnails, captions, or streaming/HLS (a plain `<video>` of the uploaded file).
- Showing uploaded videos on the client onboarding page (embed links only there).
- Replacing a file in place (edit swaps source; re-upload to change).

## CUJ impact

- Extends CUJ-11 (Browse tutorials) — a tutorial can now be an uploaded file. No new CUJ.

## Open questions

Resolved in planning (2026-06-24): private `tutorial-videos` bucket, members read via signed URL + admin write (mirrors `project-documents`); video MIME whitelist (mp4/webm/quicktime/ogg) + a size cap (e.g. 200 MB); uploaded videos are internal-only (client page stays embed-only).
