# Tasks 018 — Client dossier (team-only)

Ordered, checkboxed. Tick on commit. ≤ ~30 min each.

## Phase 1 — core

- [x] T1 `types.ts` + `lib.ts`: `ClientDossier`, `dossierInputSchema` (email shape, it_savviness 1–5, optional text) · done: `lib.test.ts` (valid + bad email + out-of-range) (AC-4)
- [x] T2 Migration `0023_client_dossiers.sql`: table + RLS (`has_project_access(project, all roles)` r/w; no anon) · done: applies (AC-3)
- [x] T3 `data.ts`: `getClientDossier(projectId)` (server-only) · done: typechecks
- [x] T4 `actions.ts`: `upsertDossierAction` (requireMember + project access, zod, upsert by project_id) · done: `actions.test.ts` (happy + non-access refusal + bad input) (AC-1/AC-2/AC-4)
- [x] T5 `components/dossier-panel.tsx` (`"use client"`): edit-in-place form (contact, type, IT 1–5, temperament, notes) · done: renders + saves; `index.ts`
- [x] T6 Wire `ClientDossierPanel` into `/projects/[id]` (team-only); copy EN/FR · done: panel shows for project members

## Phase 2 — verify & ship

- [x] T7 `pnpm verify` green
- [ ] T8 `/review` (appsec: RLS project-only, no anon/client leak, validation); fix P0/P1
- [ ] T9 PR; merge; deploy; `/update-docs` (spec shipped)

## AC coverage

- [ ] AC-1 → T4,T5 · [ ] AC-2 → T4 · [ ] AC-3 → T2,T8 · [ ] AC-4 → T1,T4
