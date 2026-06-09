# Sign-in & project registry

**Status:** live · **Slices:** `src/features/auth`, `src/features/projects` · **Routes:** `/sign-in`, `/auth/callback`, `/` (portfolio), `/projects/[id]`
**Spec history:** specs/002-auth-and-projects (shipped 2026-06-08)

## What it does (user terms)

You sign in with GitHub; only members of the **ProgixDev** org get in, everyone else is told they don’t have access. Once in, you see every project, create new ones (name, status, description, and the four surface links — Notion, Slack, GitHub, Live), edit them, and archive them. There is no hard delete — archiving is reversible.

## How it works (the non-obvious 20%)

- **Authorization uses `getClaims()`, never `getSession()`.** `getClaims()` validates the JWT signature; `getSession()` doesn’t and is spoofable in server code. The member flag lives in `app_metadata.is_member` (server-writable only) — never `user_metadata` (user-editable).
- **Membership is verified once, at the OAuth callback.** `src/app/auth/callback/route.ts` exchanges the code, calls GitHub `/user/memberships/orgs/ProgixDev` with the provider token (needs `read:org`), and on success stamps `app_metadata.is_member` via the service-role admin client, then `refreshSession()` so the new JWT carries it. Non-members are signed out → `/sign-in?error=access_denied`. Implication: a member removed from the org keeps access until their token refreshes.
- **Defense in depth, three layers:** `proxy.ts` (the Next 16 gate, renamed from `middleware.ts`) redirects non-members to sign-in; every server action re-checks `requireMember()`; Supabase **RLS is deny-by-default** and is the real backstop (`supabase/migrations/0001_projects.sql`). RLS keys on `app_metadata.is_member`, so even a bug in the app layer can’t leak rows.
- **Supabase clients** live in `src/lib/supabase/{client,server,admin}.ts`; the shared session reader is `src/lib/auth/session.ts` (in `lib`, not a feature, so both slices authorize without importing each other).
- **Server data flows as props**, not into the store. The projects store holds only UI state (active filter + the create/edit modal). Actions call `revalidatePath("/")`, which re-renders the RSC and pushes fresh data down.
- **e2e auth** can’t run real OAuth in CI, so `src/app/auth/test-login/route.ts` seeds a member session — but only when `E2E_AUTH_BYPASS=1` (set solely by the Playwright webServer); it 404s everywhere else.

## Decisions & gotchas

- 2026-06-08 — Dropped magic link; GitHub-only keeps the org-membership check trivial.
- 2026-06-08 — `middleware.ts` → `proxy.ts` (Next 16 deprecated the old name; both still resolve).
- 2026-06-08 — Legacy `anon`/`service_role` keys are used (valid through 2026); switch to publishable/secret keys later.
- Gotcha: a client component must not import the `projects` barrel (`index.ts` re-exports server-only `data.ts`); client islands use relative imports.

## CUJs covered

- CUJ-01 — Land and orient (`e2e/home.spec.ts`)
- CUJ-02 — Create a project (`e2e/projects.spec.ts`)
