# Plan 019 — Tutorial file uploads

- **Spec:** [spec.md](spec.md) (open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-24

## Approach

Mirror the documents upload pattern (spec 003): a private Storage bucket `tutorial-videos`, browser-direct upload (RLS-gated), server records metadata. Extend `tutorials` with `source_type ('embed'|'upload')` + `storage_path`; `embed_url` becomes nullable with a check that exactly one source is populated. The form gets a source toggle; on upload it pushes the file to the bucket then records the row. Playback: the library page resolves a short-lived **signed URL** server-side for each upload tutorial (members are authenticated) and the player renders `<video>` for uploads / the iframe for embeds. The client setup page is untouched — its RPC already returns only `embed_url`, so uploaded-only tutorials yield no client-facing video (AC-5). No new dep → no ADR.

## Placement

| What    | Where                                                                                     | Notes                                                                                                      |
| ------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| DB      | `supabase/migrations/0024_tutorial_uploads.sql`                                           | `tutorials` cols + check; `tutorial-videos` bucket + storage.objects policies (members read, admins write) |
| Schema  | `tutorials/lib.ts` (schema: source_type, conditional), `types.ts`                         | embed XOR upload                                                                                           |
| Upload  | `tutorials/components/tutorial-form.tsx` + a `video-upload` control                       | browser upload to the bucket, then record                                                                  |
| Play    | `tutorials/components/tutorial-player.tsx` + page resolves signed URLs                    | `<video>` for upload, iframe for embed                                                                     |
| Actions | `tutorials/actions.ts` (accept source_type + storage_path), `data.ts` (signed-URL helper) | admin-gated as today                                                                                       |

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | unit: schema accepts an upload row; e2e/manual: uploaded video plays in the library                                                   |
| AC-2 | unit: `lib.test.ts` embed still valid; XOR enforced (embed→no storage_path, upload→no embed_url)                                      |
| AC-3 | DB: bucket `public=false` + storage policies (members read / admins write); signed URL TTL · existing documents security test pattern |
| AC-4 | unit: schema rejects upload-without-file + embed-without-link; bucket MIME/size whitelist                                             |
| AC-5 | unchanged `setup_public_view` returns only `embed_url` — uploaded-only ⇒ null video (reasoned + existing tests)                       |

## Risks & unknowns

- **Big files / cost** — videos are large; the bucket caps size (200 MB) + MIME whitelist. This is exactly the cost the embed-first default avoids, so uploads are opt-in.
- **Signed-URL playback** — resolve per upload tutorial at page render (member context); short TTL. Inline (not `download`) so `<video>` can play it.
- **Schema migration on a live table** — `tutorials` already has rows (the seeded YouTube one); add columns with `source_type default 'embed'` so existing rows stay valid; `embed_url` nullable but the check tolerates existing embed rows.

## Overlap check

Extends 016 (tutorials), shipped. No other active spec touches the slice. New bucket + columns are additive. Forward-only on main.
