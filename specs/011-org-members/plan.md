# Plan 011 — Org members directory, lead role & GitHub activity

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** agent · **Date:** 2026-06-16

## Approach

Add an org-level "lead" flag (`app_metadata.is_lead`) alongside the existing `is_superadmin`, enforced in the DB (a lead reads every project; `my_project_role` resolves to a read-only `lead`). A new `members` slice owns the directory, the member profile, and the GitHub contribution graph. GitHub data is read server-side from the org's contribution calendar for the member's linked login, behind an env-gated client that degrades gracefully to an "unavailable" state — so nothing is required to render the page. Project creation keeps the creator's role via the `projects_owner_pm` trigger (seat as `developer`, skip superadmin). No new dependency; the lead role touches `src/lib/auth`, so this is reviewed carefully (ADR-0011 matrix extended with a read-only role).

## Placement (per `docs/architecture/module-boundaries.md`)

| What      | Where                                                       | Notes                                    |
| --------- | ----------------------------------------------------------- | ---------------------------------------- |
| Migration | `supabase/migrations/0011_org_members.sql`                  | lead role, directory RPC, creator role   |
| Roles     | `src/lib/auth/roles.ts`, `src/lib/auth/session.ts`          | `lead` capability + `isLead` on the user |
| Slice     | `src/features/members/`                                     | data, actions, components, github lib    |
| Routes    | `src/app/members/page.tsx`, `src/app/members/[id]/page.tsx` | RSC, access-gated                        |
| Chrome    | `src/components/app-shell/*`                                | `showMembers` nav flag (default off)     |
| i18n      | `src/messages/{en,fr}.json`                                 | `nav.members`, `members.*`               |

## Data & state

- Server data: `listOrgMembers()` (RPC, superadmin/lead/PM-gated), `getOrgMember(id)`, `fetchOrgContributions(login)` (GitHub GraphQL, env-gated, returns null when unconfigured). Reads `process.env.GITHUB_TOKEN` / `GITHUB_ORG_ID` in a server-only module.
- Client state: none beyond the lead-toggle transition.
- Actions: `setMemberLeadAction(userId, makeLead)` — superadmin-gated server-side, uses the admin client to set `app_metadata.is_lead`; never touches superadmins.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                    |
| ---- | ---------------------------------------------------------------------------- |
| AC-1 | unit: directory render test; page gate; RPC gate review                      |
| AC-2 | unit: `roles.test.ts` lead capability; migration policy review               |
| AC-3 | unit: `github.test.ts` calendar transform; component graceful state          |
| AC-4 | migration: `projects_owner_pm` seats creator as developer / skips superadmin |
| AC-5 | unit: `actions.test.ts` non-superadmin refused before the admin client       |

## Risks & unknowns

- Live GitHub fetch can't be exercised offline; it is env-gated and degrades to an "unavailable" state, so the page is safe without it. Live verification happens in a configured environment.
- Extending the role matrix with a read-only `lead` is additive; existing role tests are unaffected.

## Overlap check

Active specs: 009 (env-vars) and 010 (auth) touch `src/messages/*` only — no functional overlap. 011 extends the 008/010 role model and re-creates `projects_owner_pm` + `set_project_member` so it is self-consistent regardless of 0010.
