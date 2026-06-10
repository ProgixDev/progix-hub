# 0011 — Roles & permissions: org superadmin + per-project roles, enforced in the database

- **Status:** Accepted
- **Date:** 2026-06-10
- **Deciders:** Achref Arabi (owner), Claude (agent)
- **Supersedes:** the flat `app_metadata.is_member` authorization model (specs 002–006) for _what a member may do_ (it remains the org-membership gate for _who may sign in_).

## Context

[Spec 008](../../../specs/008-roles-permissions/spec.md) replaces flat permissions (any org member can do anything to any project) with a real model: org **superadmins** plus four **per-project roles** (PM / developer / video editor / viewer). Every shipped feature keys its RLS and SECURITY DEFINER RPCs on `is_member`; we need to re-key them on project role **without** weakening the deny-by-default model, and without a per-request DB round-trip for the common checks.

## Decision

1. **Superadmin rides in the JWT.** `app_metadata.is_superadmin` (boolean, not user-editable, stamped out-of-band like `is_member`). Read with no DB call. Achref is seeded; granting more is SQL-only for now.
2. **`project_members` table** — `(project_id, user_id, role)`, PK `(project_id, user_id)`, `role ∈ pm|developer|video_editor|viewer`. A member has **no access to a project until a row exists**. An `AFTER INSERT` trigger on `projects` makes the creator a **PM**; the migration backfills every existing project’s `created_by` as PM.
3. **Two SQL authorization helpers** (SECURITY DEFINER, STABLE, `search_path=''`): `public.is_superadmin()` (reads the JWT) and `public.has_project_access(p_project uuid, p_roles text[])` (superadmin **or** a `project_members` row whose role is in `p_roles`). DEFINER so policies can consult `project_members` without RLS recursion.
4. **Every table’s RLS is re-keyed** to `has_project_access(project_id, <role-set for this operation>)` — see the matrix below. The env-var RPCs (003) and the People RPCs swap their `is_member` gate for the same helper.
5. **People management goes through SECURITY DEFINER RPCs** (`set_project_member(project, email, role)`, `remove_project_member(project, user)`): caller must be PM/superadmin; the function resolves the email against `auth.users` (the RLS client can’t); a **last-PM guard** rejects removing/demoting the final PM so a project is never orphaned. `anon` gets no execute.
6. **UI gates mirror the matrix** (hide what a role can’t do) but the database is the source of truth — forbidden actions are rejected even called directly (AC-8).

### Capability matrix (project role → operation)

| Capability                         | Superadmin | PM  | Developer | Video editor | Viewer |
| ---------------------------------- | :--------: | :-: | :-------: | :----------: | :----: |
| See the project                    |  ✓ (all)   |  ✓  |     ✓     |      ✓       |   ✓    |
| Edit / archive the project         |     ✓      |  ✓  |     ✗     |      ✗       |   ✗    |
| Manage People (add/role/remove)    |     ✓      |  ✓  |     ✗     |      ✗       |   ✗    |
| Env vars: see keys                 |     ✓      |  ✓  |     ✓     |      ✗       |   ✓    |
| Env vars: add/edit/delete + reveal |     ✓      |  ✓  |     ✓     |      ✗       |   ✗    |
| Documents: read                    |     ✓      |  ✓  |     ✓     |      ✓       |   ✓    |
| Documents: add/edit/archive        |     ✓      |  ✓  |     ✓     |      ✓       |   ✗    |
| Portal: read                       |     ✓      |  ✓  |     ✓     |      ✓       |   ✓    |
| Portal: manage cards/blocks/link   |     ✓      |  ✓  |     ✓     |      ✓       |   ✗    |

Client = the external, account-less portal share-link role (spec 006) — unchanged.

## Alternatives considered

| Option                                                                       | Why not                                                                                                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Superadmin + roles in one `project_members` table only (no JWT flag)         | Superadmin is org-wide, not per-project; a JWT flag avoids inserting an owner row into every project and is read with no query.           |
| Inline `EXISTS (… project_members …)` in every policy                        | Verbose and error-prone across ~12 policies; a single DEFINER helper centralizes the logic and avoids RLS recursion on `project_members`. |
| Resolve “add by email” with the service-role admin client in a server action | A SECURITY DEFINER RPC keeps the auth.users lookup + authorization atomic in the DB and out of app code.                                  |
| Per-action custom permissions / multiple roles                               | Out of scope — four roles + superadmin cover the team’s needs; simpler to reason about and enforce.                                       |

## Consequences

- Positive: authorization is enforced in Postgres (RLS + DEFINER RPCs); superadmin is a no-query JWT read; the model is centralized in two helpers; backward-compatible (Achref = superadmin, creators = PM).
- Negative / accepted trade-offs: a large migration rewrites every policy across 002–006 and the env-var RPCs; storage policies become path-project role checks; UI sections must thread role-derived capability flags; “add by email” requires an existing account (no invitations yet).
- Follow-ups: email invitations for non-account users; an in-app way to grant superadmin; a People-change audit log; if a 7th feature lands, it consults the same helpers.
