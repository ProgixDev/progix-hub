# Documents

**Status:** live · **Slice:** `src/features/documents` · **Routes:** `/projects/[id]` (Documents section)
**Spec history:** specs/004-documents (shipped 2026-06-10)

## What it does (user terms)

Inside a project, a signed-in Progix member keeps that project’s reference material in one place, under a tabbed **All / Files / Links / Notes** area. **Files** are uploaded to a private store (PDF, DOCX, images, ZIP, up to 50 MB) and downloaded on demand; **Links** are an external URL with a title; **Notes** are rich text written in Markdown. Each row shows its type/size, who added it, and when. Removing something is a reversible **archive** — archived items leave the tabs but stay in an Archived panel and can be restored; there is no hard delete.

## How it works (the non-obvious 20%)

- **One table, three kinds.** `documents` (`supabase/migrations/0003_documents.sql`) holds a `kind` ∈ `file|link|note` plus kind-specific columns (`file_path/size/mime`, `url`, `body`). Deny-by-default RLS keyed on `app_metadata.is_member`: members SELECT/INSERT/UPDATE, and **no DELETE policy exists** — “remove” sets `archived_at`, so archive/restore is the only deletion path.
- **Files: the browser uploads, the server records.** `file-upload.tsx` validates client-side, then uploads straight to the **private** `project-documents` Storage bucket via the RLS-gated browser client; only then does `recordFileDocumentAction` write the metadata row (re-validating size + MIME). If the record fails, the orphaned blob is removed best-effort. The bucket independently enforces the 50 MB + MIME whitelist, so the client validation is convenience, not the trust boundary.
- **Downloads are member-only, short-lived, and forced to attachment.** `getDocumentDownloadUrlAction` mints a 1-hour signed URL with `download: true`. The TTL realizes the spec’s “member-gated, non-expiring” intent (every click mints a fresh URL, so a member can always download) while bounding link leakage. `download: true` (`Content-Disposition: attachment`) means an uploaded SVG/HTML can never render-and-run-script inline — which is why SVG can safely stay in the whitelist.
- **Link URLs are pinned to `http(s)`.** `z.url()` alone accepts `javascript:`/`data:`, which would be a stored-XSS sink once rendered as an `<a href>`. `linkInputSchema` rejects non-http(s) on write, and `isHttpUrl` guards the render sink for any legacy/forged row (`types.ts`).
- **Notes are XSS-safe Markdown.** `note-body.tsx` renders via `react-markdown` + `rehype-sanitize` with no `dangerouslySetInnerHTML` — raw HTML/script in a body never executes (**[ADR-0008](../../architecture/decisions/0008-rich-text-notes.md)**).
- **Uploader is denormalized.** The RLS-bound client can’t read `auth.users`, so `created_by_email` is stamped at write time (`0004_documents_uploader.sql`), mirroring 003’s `actor_email`. That’s what each row’s “who added it” shows.
- **UI-only store.** The Zustand store holds just the active tab + the add/edit modal; the documents and archived lists are server props fetched in parallel by the RSC and refreshed by each action’s `revalidatePath` (no client cache of server data).

## Decisions & gotchas

- 2026-06-10 — **Superseded by roles (008):** the `is_member` RLS above is now per-project. Documents read = any project role (pm/developer/video_editor/viewer); write (insert/update/archive) = **pm/developer/video_editor** (a viewer is read-only). Storage `project-documents` policies mirror this via the path's project id. See [roles-permissions.md](roles-permissions.md).
- 2026-06-10 — Mutations (`update`/`archive`/`restore`) bind to `(id, project_id)` via `.match(...)`, not just `id`, so a mismatched `projectId` can’t touch another project’s row or leave its cache stale.
- 2026-06-10 — Storage/RLS invariants (member reads; non-member denied on `documents` + Storage; anon can’t list the private bucket) are covered by **`src/features/documents/security.integration.test.ts`** — `pnpm test:integration`, same disposable-project caveat as 003.
- Gotcha: the tabs are a hand-rolled WAI-ARIA tablist (`role=tablist/tab/tabpanel`, `aria-controls`, roving arrow/Home/End focus) — keep that wiring if you refactor `documents-section.tsx`.
- Consistency notes (repo-wide, not documents-specific): archive uses `window.confirm` and error text uses the literal `#FFB6A2` — both match the env-vars sibling. A styled confirm dialog and a `--red-text` token are deferred repo-wide cleanups.
- Gotcha: a client component must not import the slice barrel (`index.ts` re-exports server-only `data.ts`); client islands use relative imports (same as `projects`/`env-vars`).

## CUJs covered

- CUJ-04 — Manage a project’s documents (`e2e/documents.spec.ts`)
