# Tasks 004 — Documents per project

Ordered, executable, checkboxed. `[P]` = parallel-safe. Each names files + a done-check.

## Phase 0 — setup

- [x] T0 Branch `feat/004-documents` (exists); scaffold `/new-module documents`; add deps `react-markdown` + `rehype-sanitize` · done: `pnpm lint` green
- [x] T1 ADR-0008 (Markdown notes) written + indexed · done: `pnpm check:docs` green

## Phase 1 — data layer (AC-1, AC-2, AC-6)

- [x] T2 Migration `0003_documents.sql`: `documents` table (id, project_id→projects cascade, kind check (file/link/note), title, file_path, file_size, file_mime, url, body, created_by, archived_at, timestamps); deny-by-default RLS (members SELECT/INSERT/UPDATE; no DELETE → archive-only); `set_updated_at`; indexes · done: applied via MCP, advisors clean
- [x] T3 Storage: create private bucket `project-documents`; `storage.objects` RLS (members INSERT/SELECT/UPDATE/DELETE on that bucket when `is_member`) · done: bucket exists, advisors clean

## Phase 2 — slice (AC-1..5, AC-9)

- [x] T4 `types.ts`: `Document` type + zod input schemas (link, note, file-metadata) + the MIME/size whitelist + `types.test.ts` · done: schema tests green (AC-1/2/5 input)
- [x] T5 `lib.ts`: `validateFile` (size + MIME), `byKind` filter, `formatBytes` + `lib.test.ts` · done: tests green (AC-4/5)
- [x] T6 `store.ts` + `provider.tsx`: active tab + add/edit modal; `store.test.ts` · done: green
- [x] T7 `data.ts` (`server-only`): `listProjectDocuments` (non-archived) · done: typecheck
- [x] T8 `actions.ts`: record-file / add-link / add-note / update / archive / restore / download-url — `requireMember` + zod + RLS client; server re-validates file size/MIME; download → signed URL + `actions.test.ts` (authz AC-6, validation AC-5) · done: action tests green
- [x] T9 `components/note-body.tsx`: `react-markdown` + `rehype-sanitize` + `note-body.test.tsx` (renders Markdown; strips a `<script>`) · done: test green (AC-3, XSS)
- [x] T10 Components: `documents-section.tsx` (tabs + empty states), `document-row.tsx` (file download / link / note + archive/edit), `file-upload.tsx` (validate + Storage upload + record), `link-form.tsx`, `note-form.tsx` · done: states render; empty-state test (AC-9)
- [x] T11 `index.ts` public API · done: app imports only the barrel (boundaries lint)
- [x] T12 Compose into `src/app/projects/[id]/page.tsx` (RSC fetches docs, passes props) · done: documents area serves under a project

## Phase 3 — verification

- [ ] T13 E2E `e2e/documents.spec.ts` (CUJ-04): upload a small file → add a link → add a note → switch tabs → edit → archive; `shot()` `doc-*` · done: `FEATURE=004-documents` green
- [ ] T14 Integration: a member can’t read another path’s ciphertext-equivalent — here: storage RLS denies anon, and `documents` RLS denies non-members (extend `security.integration.test.ts` or add one) · done: green
- [ ] T15 Run `/verify-ui 004`; `pnpm verify` green

## Phase 4 — review & ship

- [ ] T16 `/review` (appsec mandatory: upload validation, storage RLS, signed URLs, XSS) · fix P0/P1
- [ ] T17 `/feature-report 004`
- [ ] T18 Open PR; merge; deploy `vercel --prod`
- [ ] T19 `/update-docs` — feature doc, register CUJ-04, specs index → shipped, ADR-0008 already Accepted

## AC coverage

- [ ] AC-1 → T4,T8,T13 · [ ] AC-2 → T8,T13 · [ ] AC-3 → T9,T13 · [ ] AC-4 → T5,T6,T13 · [ ] AC-5 → T4,T5,T8,T13
- [ ] AC-6 → T2,T3,T8,T13,T14 · [ ] AC-7 → T8,T13 · [ ] AC-8 → T8,T13 · [ ] AC-9 → T10,T13
