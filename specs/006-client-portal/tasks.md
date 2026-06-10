# Tasks 006 — Client portal

Ordered, executable, checkboxed. `[P]` = parallel-safe. Tick on commit; never reorder silently.

## Phase 0 — foundation

- [ ] T0 Branch `feat/006-client-portal` (exists); ADR-0010 written + indexed · done: `pnpm check:docs` green
- [ ] T1 Migration `0005_portal.sql`: 5 tables (share_links hashed-token + partial-unique active, blocks, cards, comments, attachments), member RLS (no DELETE), 4 `SECURITY DEFINER` RPCs (view/comment/propose/record_attachment — token hash → project; rate limit 10 writes/min; row + length caps), `portal-attachments` private bucket (10 MB, documents MIME whitelist) + member SELECT policy · done: applied via MCP, advisors clean
- [ ] T2 `src/lib/supabase/admin.ts` (`server-only`, service-role, fails closed when key absent) · done: typecheck; never imported by client code

## Phase 1 — slice core

- [ ] T3 `types.ts`: statuses, zod schemas (block, card, comment, proposal, attachment meta, display name), `MAX_ATTACHMENT_BYTES` + whitelist reuse + `types.test.ts` · done: schema tests green
- [ ] T4 `lib.ts`: `validateAttachment` (reason codes), tree-shaping helpers + `lib.test.ts` · done: green
- [ ] T5 `data.ts` (server-only): `getPortal(projectId)` (link + blocks→cards→comments/attachments), `getShareLink` · done: typecheck
- [ ] T6 `actions.ts` (member): block create/edit/archive · card create/edit/status/archive · share link create/rotate/revoke (raw token returned once, only SHA-256 stored) + `actions.test.ts` (authz, validation, token hashing) · done: green
- [ ] T7 `public-actions.ts` (token): `submitPortalComment` / `submitPortalProposal` / `submitPortalAttachment` / `getPortalAttachmentUrl` — zod + honeypot + RPC; attach validates then uploads via admin client + `public-actions.test.ts` (honeypot drop, bad token, size/MIME reject) · done: green
- [ ] T8 `store.ts` + `provider.tsx` (modal state) + `store.test.ts` · done: green

## Phase 2 — UI (member + public)

- [ ] T9 Member components: `portal-section.tsx` (blocks grid + cards + statuses + client activity), `card-form.tsx`, `block-form.tsx`, `share-link-manager.tsx` (create/copy/rotate/revoke) · done: renders all states; `portal-section.test.tsx`
- [ ] T10 Public components: `share-view.tsx` (read-only tree + status badges), `client-comment-form.tsx`, `client-propose-form.tsx`, `client-attach-form.tsx` (display name remembered in localStorage), inactive-link screen · done: `share-view.test.tsx` (renders, client text inert)
- [ ] T11 Routes: `/projects/[id]/portal/{page,loading,error}` (member, AppShell) + portal entry link on the project page; `/share/[token]/{page,loading,error}` (standalone chrome) · done: both serve
- [ ] T12 Middleware: add `/share` to public paths · done: signed-out `/share/x` not redirected
- [ ] T13 i18n: `portal` namespace in `en.json` + `fr.json` (all new strings; FR quality per copy.md) · done: parity test green

## Phase 3 — verification

- [ ] T14 Integration `security.integration.test.ts` (portal): invalid/revoked token → no data; anon table SELECT denied; rate limit raises; RPC scoped to its project · done: `pnpm test:integration` green
- [ ] T15 E2E `e2e/portal.spec.ts` (CUJ-06): member builds blocks/cards + link → anonymous context: view, comment, attach, propose → member sees all, accepts proposal → rotate link → old URL inactive · `shot()` `portal-*` · done: full e2e suite green
- [ ] T16 `/verify-ui 006` + `pnpm verify` green · done: screenshots eyeballed vs ACs

## Phase 4 — review & ship

- [ ] T17 `/review` — appsec MANDATORY (public RPCs, token handling, admin client, rate limits, XSS) + frontend + qa + ux · fix P0/P1
- [ ] T18 `/feature-report 006`
- [ ] T19 Open PR; merge; deploy `vercel --prod`; verify share flow on prod
- [ ] T20 `/update-docs` — feature doc, CUJ-06, specs index → shipped; clean E2E test data

## AC coverage

- [ ] AC-1 → T6,T9,T15 · [ ] AC-2 → T6,T9,T15 · [ ] AC-3 → T1,T10,T11,T15 · [ ] AC-4 → T7,T10,T15 · [ ] AC-5 → T3,T4,T7,T15
- [ ] AC-6 → T7,T10,T15 · [ ] AC-7 → T1,T14,T15 · [ ] AC-8 → T1,T7,T10,T14 · [ ] AC-9 → T12,T15
