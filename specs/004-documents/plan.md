# Plan 004 — Documents per project

- **Spec:** [spec.md](spec.md) (open questions resolved: yes — see Approach)
- **Author:** Claude (with Achref Arabi) · **Date:** 2026-06-09

## Approach

A new `documents` feature slice mirrors `projects`/`env-vars`: a UI-only store (active tab + the add/edit modal), `requireMember`-guarded server actions, and a server-only `data.ts`. A `documents` table holds one row per item with a `kind` (`file`/`link`/`note`) and the kind-specific columns; deny-by-default RLS keyed on `app_metadata.is_member` (mirroring 002). **Files** live in a **private Supabase Storage bucket** (`project-documents`); the browser uploads directly (Storage RLS-gated), then a server action records the metadata row (re-validating size + MIME); downloads go through a member-only server action that returns a signed URL. **Notes** store Markdown and render through `react-markdown` + `rehype-sanitize` (XSS-safe, [ADR-0008](../../docs/architecture/decisions/0008-rich-text-notes.md)). **Links** are a title + URL. Remove = soft-delete (`archived_at`), restorable; no hard delete. Composed onto `/projects/[id]` by the app layer. UI is English; the EN/FR toggle is spec 005.

## Placement (per `docs/architecture/module-boundaries.md`)

| What            | Where                                                                                     | Notes                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Route           | `src/app/projects/[id]/page.tsx`                                                          | compose `DocumentsSection` alongside the env section                      |
| Slice           | `src/features/documents/` (store, provider, actions, data, types, lib, components, index) | `/new-module documents`; takes `projectId`                                |
| Database        | `supabase/migrations/0003_documents.sql`                                                  | `documents` table + RLS; private `project-documents` bucket + Storage RLS |
| Markdown render | `src/features/documents/components/note-body.tsx`                                         | `react-markdown` + `rehype-sanitize` (new deps, ADR-0008)                 |

## Data & state

- **Server data:** `listProjectDocuments(projectId)` (server-only, RLS) — non-archived rows; `getDocumentDownloadUrl(id)` is an action (member-only signed URL).
- **Client state:** store holds the active tab (`all|file|link|note`) and the add/edit modal; server data flows as props.
- **Actions** (`requireMember` → zod → RLS client, `ActionResult`): `recordFileDocumentAction` (after the browser uploads to Storage; re-checks size/MIME), `addLinkDocumentAction`, `addNoteDocumentAction`, `updateDocumentAction` (link/note), `archiveDocumentAction`, `restoreDocumentAction`, `getDocumentDownloadUrlAction`. File upload validates size (≤50 MB) + MIME whitelist (PDF, DOCX, images, ZIP) on **both** client and server.

## Acceptance criteria → verification mapping

| AC                          | Proven by                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| AC-1 upload file            | unit `lib.test.ts` (validate size/MIME) + action test; e2e upload a small file → appears (`shot`)  |
| AC-2 add link               | action test; e2e add a link → appears in Links + All                                               |
| AC-3 add note (rich-text)   | unit `note-body.test.tsx` (Markdown renders; script is sanitized away); e2e add a note → renders   |
| AC-4 tabs filter            | unit `lib.test.ts` (`byKind`) + `store.test.ts` (active tab); e2e switch tabs                      |
| AC-5 oversize/type rejected | unit `lib.test.ts` (validation rejects); action test (server re-validates); e2e oversize → message |
| AC-6 membership gate        | unit `actions.test.ts` (NOT_AUTHORIZED without a member); e2e signed-out → redirect; Storage RLS   |
| AC-7 archive & restore      | action tests; e2e archive hides + restore returns                                                  |
| AC-8 edit                   | action test; e2e edit a link/note persists                                                         |
| AC-9 empty state            | component test + e2e: empty tab shows the invite state                                             |

## Risks & unknowns

- **Storage RLS + private bucket** → bucket is private; `storage.objects` policies gate insert/select/delete on `is_member`; downloads via signed URL only (no public access). Verified live (MCP) + an integration check.
- **Upload trust** → never trust the client: the record action re-validates size + MIME, and the bucket/RLS is the backstop; orphaned blobs (upload ok, metadata fails) are cleaned best-effort.
- **XSS via notes** → Markdown + `rehype-sanitize`; never `dangerouslySetInnerHTML`; a unit test asserts a `<script>` in the body does not execute/render.
- **e2e file upload** → use Playwright `setInputFiles` with a tiny in-repo fixture; runs against the live Storage (same shared-project caveat as 002/003).
- **New deps** (react-markdown, rehype-sanitize) → ADR-0008; client-only on the documents view.

## Overlap check

No other spec is `active` (002/003 shipped, 001 abandoned). Integrates with the `projects` route `/projects/[id]` and the spec-002 auth/RLS model — composed in the app layer; reuses `requireMember`, the RLS client, and `is_member`. No new boundary exceptions.
