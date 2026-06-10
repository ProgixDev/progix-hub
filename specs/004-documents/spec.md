# Spec 004 — Documents per project

- **Status:** draft
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-09
- **Slice / areas touched:** `src/features/documents` (new), route `/projects/[id]` (documents area under the project detail), Supabase **Storage** (new private bucket) + a `documents` table. Reuses the spec-002 auth/RLS model. UI ships **English** like 002/003 — the EN/FR toggle is spec 005 (Settings).

## Problem (the why)

A project’s loose documents — specs, contracts, design exports, reference links, scratch notes — have no home; they live in DMs, local folders, and people’s heads, so picking a project back up means hunting. progixHub is the registry everything hangs off (002, 003); the documents belong there too, on the project, behind the same login. This is MVP signature scope #3.

## Desired behavior (the what)

Inside a project, a signed-in member sees a **Documents** area with four tabs — **All / Files / Links / Notes**:

- **Files:** pick or drop a file (PDF, DOCX, image, or ZIP, up to **50 MB**) to upload; it appears with its type, size, who uploaded it, and when, and a member can download it.
- **Links:** add an external URL with a title; it appears as a clickable shortcut with who added it and when.
- **Notes:** write a **rich-text** note (headings, bold/italic, lists, links); it’s saved and shown with author + date, and can be edited later.
- **All:** the three kinds together, newest first.

Each row shows type/size (files), uploader, and date. A member can **edit** a link’s title/URL or a note’s content, and **archive** any document — archived items disappear from the tabs but are kept and can be **restored** (no hard delete). An oversized or disallowed file is rejected with a clear message and nothing is stored. A tab with nothing in it shows a friendly empty state. Nobody outside the org reaches any of this: the same membership gate as sign-in protects it, files live in a **private** store, and only a member can download one.

## Acceptance criteria

- **AC-1 (upload a file):** Given a member on a project, when they upload an allowed file ≤ 50 MB, then it appears in **Files** and **All** with its type, size, uploader, and date, and a member can download it.
- **AC-2 (add a link):** Given a member, when they add an external URL + title, then it appears in **Links** and **All** as a clickable shortcut with uploader and date.
- **AC-3 (add a note):** Given a member, when they write a rich-text note, then it appears in **Notes** and **All** with author and date and can be edited in place.
- **AC-4 (tabs filter):** Given documents of each kind, when the member switches tabs, then **Files/Links/Notes** show only their kind and **All** shows everything newest-first.
- **AC-5 (oversize / wrong type — non-happy):** Given a file over 50 MB or of a disallowed type, when the member tries to upload it, then it is rejected with a clear message and nothing is stored.
- **AC-6 (membership gate — non-happy):** Given a signed-out visitor or a non-member, when they try to view, upload, download, or add a document, then they are denied/redirected and nothing is exposed — and a stored file is not fetchable without membership.
- **AC-7 (archive & restore):** Given a document, when a member archives it, it disappears from the tabs but is kept; when they restore it, it returns. There is no hard delete.
- **AC-8 (edit):** Given a link or a note, when a member edits its title/URL or content, the change persists.
- **AC-9 (empty state — empty path):** Given a tab with no items, when the member opens it, then they see an invite empty state, not an error.

## Out of scope

- Folders / nested organization; file versioning or history.
- Full-text search inside documents; inline preview / thumbnails (download to view).
- Real-time collaborative note editing; OCR / content extraction.
- **Hard delete** — archive-only here; a storage-cleanup job for archived files’ blobs is a later concern.
- **Bilingual UI (EN + FR)** — the language toggle is spec 005 (Settings); Documents ships English like 002/003.

## CUJ impact

- Registers **CUJ-04 — Manage a project’s documents:** open a project → Documents → upload a file / add a link / write a note → see them in the tabs → edit → archive. New e2e spec + `doc-*` screenshots.

## Open questions

Resolved before `/plan-feature` proceeds.

- [ ] Download mechanism for the private bucket — a member-only signed URL (the owner chose “member-gated, non-expiring” → a generous-expiry signed URL or an authed stream route); a plan.md decision.
- [ ] Rich-text note storage format (sanitized HTML vs a JSON doc model) — plan.md decision; must be XSS-safe on render.
- [ ] Storage cleanup of archived files’ blobs — keep for now; revisit if storage grows.
