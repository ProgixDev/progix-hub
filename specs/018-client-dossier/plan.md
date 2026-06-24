# Plan 018 — Client dossier (team-only)

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-24

## Approach

One table `client_dossiers` (project_id PK — one per project) holding plain text fields, RLS-gated to anyone with access to the project (`has_project_access(project, [all roles])`) for both read and write; **no anon policy and never returned by any client-facing RPC**, so it can't leak to a client. A single `upsertDossierAction` (zod-validated: email shape, IT-savviness 1–5) writes via the RLS client. The project page renders a team-only `ClientDossierPanel` (edit-in-place form) for members who can access the project. Pure validation lives in `lib.ts` so AC-4 is unit-tested. No new dep → no ADR.

## Placement

| What  | Where                                                                                    | Notes                                                    |
| ----- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Panel | `src/features/client-dossier/components/dossier-panel.tsx`, rendered on `/projects/[id]` | team-only edit form                                      |
| Slice | `src/features/client-dossier/`                                                           | `types`, `lib`(+test), `data`, `actions`(+test), `index` |
| DB    | `supabase/migrations/0023_client_dossiers.sql`                                           | table + RLS (project members r/w; no anon)               |

## Data & state

- **Table `client_dossiers`:** `project_id` PK → projects, `contact_name/contact_email/contact_phone/company/client_role/client_type/temperament/notes` (text), `it_savviness` (int 1–5, nullable), `updated_by`, timestamps. RLS: `for all to authenticated using has_project_access(project_id, array['pm','developer','video_editor','viewer'])`.
- **Server:** `getClientDossier(projectId)` (server-only, RLS-gated).
- **Action:** `upsertDossierAction(projectId, input)` — `requireMember`, project-access check, zod-parse, upsert, result object.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                               |
| ---- | --------------------------------------------------------------------------------------- |
| AC-1 | unit: `actions.test.ts` (upsert happy path) · e2e: panel saves on the project page      |
| AC-2 | upsert keyed on `project_id` (PK) — unit asserts the row is scoped to the project       |
| AC-3 | RLS policy (project-access only, no anon); not referenced by portal/setup RPCs — appsec |
| AC-4 | unit: `lib.test.ts` (IT-savviness 1–5 + email shape reject) + `actions.test.ts`         |

## Risks & unknowns

- **Sensitivity** — the dossier holds candid notes; the guarantee is "team-only, never client-facing." Enforced by RLS (project members) + the fact that no client/anon code path reads `client_dossiers`. Appsec confirms no leak.
- **Who can edit** — open to all project members (shared context) per the resolved question; not just PMs. Acceptable for an internal note.

## Overlap check

Adds a panel to `/projects/[id]` (alongside the spec-017 setup panel just shipped) — additive, no conflict. New slice + migration. Forward-only on main.
