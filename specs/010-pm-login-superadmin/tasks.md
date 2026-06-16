# Tasks 010 — PM email/password login + superadmin above roles

## Phase 0 — setup

- [x] T0 Branch `feat/pm-login-superadmin`; migration `0010_superadmin_not_pm.sql`

## Phase 1 — auth (AC-1)

- [x] T1 `email-sign-in-form.tsx` island; export it; render on `/sign-in` below an “or” divider

## Phase 2 — team slice (AC-2, AC-3, AC-6)

- [x] T2 `team/actions.ts` `createMemberAccountAction` (superadmin-gated, admin createUser)
- [x] T3 `team/components/create-member-card.tsx` + `team/index.ts`
- [x] T4 Render `{user.isSuperadmin && <CreateMemberCard/>}` in `/settings`

## Phase 3 — DB rule (AC-4, AC-5)

- [x] T5 Migration: trigger skip, backfill delete, `set_project_member` reject superadmin

## Phase 4 — i18n + tests

- [x] T6 i18n: `auth.*`, `signIn.or`, `team.*`, both locales
- [x] T7 `team/actions.test.ts`; appsec review; `pnpm verify` green

## AC coverage

- [x] AC-1 → T1 · [x] AC-2 → T4 · [x] AC-3 → T2,T7 · [x] AC-4 → T5 · [x] AC-5 → T5 · [x] AC-6 → T2,T7
