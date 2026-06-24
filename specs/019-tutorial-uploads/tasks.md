# Tasks 019 — Tutorial file uploads

Ordered, checkboxed. Tick on commit. ≤ ~30 min each.

## Phase 1 — core

- [x] T1 `types.ts` + `lib.ts`: add `source_type`/`storage_path`; schema = embed XOR upload (link required for embed, storage_path for upload) · done: `lib.test.ts` (embed ok, upload ok, neither/both rejected) (AC-2/AC-4)
- [x] T2 Migration `0024_tutorial_uploads.sql`: `tutorials` cols + check (default 'embed' keeps existing rows valid); private `tutorial-videos` bucket (video MIME + 200 MB) + storage.objects policies (members read, admins write) · done: applies (AC-3)
- [x] T3 `data.ts`: signed-URL resolver for upload tutorials (members only); `actions.ts` accepts source_type + storage_path · done: `actions.test.ts` updated
- [x] T4 `components/video-upload.tsx` + form toggle: choose embed link or upload; upload to bucket → record · done: form renders both modes
- [x] T5 `tutorial-player.tsx` renders `<video>` (signed URL) for uploads, iframe for embeds; library page resolves signed URLs · done: both play
- [x] T6 Copy EN/FR for the source toggle + errors

## Phase 2 — verify & ship

- [x] T7 `pnpm verify` green; extend `e2e/tutorials.spec.ts` if practical (embed path already covered)
- [x] T8 `/review` (appsec: private bucket not anon-readable, signed-URL TTL, admin write, client page unaffected); fix P0/P1
- [ ] T9 PR; merge; deploy; `/update-docs` (spec shipped)

## AC coverage

- [ ] AC-1 → T1,T4,T5 · [ ] AC-2 → T1 · [ ] AC-3 → T2,T8 · [ ] AC-4 → T1,T2 · [ ] AC-5 → unchanged RPC (T8 confirm)
