# Plan 012 — GitHub member profiles & sign-in

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-16

## Approach

Most of this feature already exists and just isn't wired together. GitHub OAuth sign-in (members-only, `read:org` gate) shipped in spec 002 (`SignInButton` + `/auth/callback` + `membership.ts`), and Supabase auto-captures the GitHub `user_name` that `list_org_members` (migration 0011) already reads. So spec 012 adds the missing connective tissue rather than a new auth system: (1) a **Connect GitHub** action using `supabase.auth.linkIdentity` so email/password members link their GitHub without changing how they sign in, with the callback stamping `github_login` from the linked identity; (2) a personal **`/profile`** route reusing the existing `MemberProfile`; (3) a **commit list** read via the GitHub Search-commits API scoped to the org + author + current year; (4) wiring the **contribution graph** (it already calls GitHub GraphQL — it just needs `GITHUB_TOKEN`/`GITHUB_ORG_ID`); (5) a migration relaxing org-member **visibility to any signed-in member** (012 supersedes 011's superadmin/lead/PM gate). The key trade-off (resolved in the spec): one server-side `GITHUB_TOKEN` for all activity reads, never per-user tokens. No new dependency, no boundary exception → **no ADR needed**; env additions are documented in `core/env.ts` + `.env.example`.

## Placement (per `docs/architecture/module-boundaries.md`)

| What             | Where                                   | Notes                                                                                  |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| Route(s)         | `src/app/profile/page.tsx`              | thin RSC; reads current user + member record + activity, renders `MemberProfile`       |
| Route(s)         | `src/app/auth/callback/route.ts` (edit) | handle the link return: stamp `github_login`, surface link-conflict error              |
| Slice            | `src/features/members/`                 | add `commits.ts` (pure transform + fetch), `connect-github-button.tsx`, commit-list UI |
| Slice            | `src/features/members/data.ts` (edit)   | `canViewOrgMembers` (any member), member-by-id stays gated-RPC                         |
| Slice            | `src/features/auth/` (edit)             | export a `ConnectGitHubButton`; callback link handling                                 |
| Config           | `src/core/env.ts`, `.env.example`       | register `GITHUB_TOKEN`, `GITHUB_ORG_ID` (optional-at-parse, fail-soft at use)         |
| DB               | `supabase/migrations/0012_*.sql`        | relax `list_org_members` visibility; capture `github_login` on link                    |
| Shared additions | none                                    | reuse `components/ui` + existing `ContributionGraph`                                   |

## Data & state

- **Server data:**
  - Members: existing gated RPC `list_org_members` (relaxed in 0012 to any `is_member`). `/profile` reads `getCurrentUser()` + that member's row.
  - Contribution graph: existing `fetchOrgContributions(login)` — GraphQL `contributionsCollection(organizationID)`, gated on `GITHUB_TOKEN` + `GITHUB_ORG_ID`, returns `null` on any miss (fail-soft).
  - Commits (new `members/commits.ts`): GitHub Search API `GET /search/commits?q=org:<ORG>+author:<login>+author-date:>=<jan1>`, `Authorization: Bearer GITHUB_TOKEN`, sorted newest-first, capped (e.g. 30). Returns `[]` on any non-200/missing config — never throws. A pure `parseCommits(raw)` transform is unit-tested without network.
- **Client state:** none beyond local button loading state (Connect GitHub).
- **Actions:** `linkIdentity` is a client Supabase call (manual linking) from `ConnectGitHubButton`; the redirect returns to `/auth/callback`. No new server action with mutable input beyond the callback. Authz: `/profile` requires a signed-in member (redirect to `/sign-in` otherwise); member-detail reads stay behind the gated RPC.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                                                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | unit: `members/connect.test.ts` (link-flow helper builds correct redirect + handles success) · e2e: `e2e/members.spec.ts` "connect" step (button visible when unlinked)           |
| AC-2 | unit: `auth/membership.test.ts` (existing `isAllowedMember` — active member only; non-member refused) — already covers members-only GitHub sign-in                                |
| AC-3 | e2e: `e2e/members.spec.ts` step — `/profile` renders own identity, standing, GitHub state, activity sections                                                                      |
| AC-4 | unit: `members/data` visibility helper test (any signed-in member → true; signed-out → false) · DB: migration test that a plain member can `list_org_members`                     |
| AC-5 | unit: `members/commits.test.ts` (`parseCommits` maps raw → newest-first, year-scoped) + `github.test.ts` (existing calendar build) · e2e: commit list + graph render when stubbed |
| AC-6 | unit: `commits.test.ts` + `github.test.ts` return `[]`/`null` on missing token/login/error · e2e: profile of an unlinked member shows "unavailable", page still renders           |
| AC-7 | unit: callback/link-conflict helper maps `identity_already_exists` → friendly error (no data change)                                                                              |

## Risks & unknowns

- **Supabase "Manual Linking" must be enabled** for `linkIdentity` to work — a dashboard setting, not code. De-risk: build the button + callback to fail-soft (clear error if linking is disabled) and add it to the go-live checklist; the rest of the feature works without it.
- **External credentials I can't create** (`GITHUB_TOKEN`, `GITHUB_ORG_ID`, the Supabase GitHub OAuth app) — feature must ship **dormant and degrade gracefully** (AC-6 makes this a first-class requirement, not an afterthought). E2E stubs the GitHub API so CI proves behavior without secrets.
- **GitHub Search-commits rate limits** (30 req/min) and eventual-consistency lag — cap results, `cache: no-store` but tolerate emptiness; never block the page on it.
- **`github.ts` reads `process.env` directly** (011) which bends the "env only in core/env.ts" rule. De-risk: keep activity fetchers reading env at their server boundary (they're not `server-only` by design for testability) but register + document the vars in `core/env.ts` and `.env.example` so they're discoverable and validated.
- **Org-wide visibility changes 011's shipped behavior** — intentional, owner-approved; called out in Overlap check.

## Overlap check

Active specs touching the same areas:

- **Spec 011 (org-members)** — heavy, intentional overlap: 012 extends the `members` slice and **relaxes `list_org_members` visibility** from superadmin/lead/PM to any signed-in member (supersedes 011 AC-1's directory gate; owner-approved). 011 is already merged + deployed, so no branch conflict — 012 is a forward change. Migration 0012 re-creates the RPC.
- **Spec 010 (pm-login-superadmin)** — additive overlap in `auth`: 010 added email/password sign-in; 012 adds GitHub _linking_ + reaffirms GitHub _sign-in_ alongside it and edits `/auth/callback`. No file conflict (different components); coordinate by keeping all three sign-in paths on the sign-in page. 010 merged + deployed.
- **Spec 009 (env-vars)** — no overlap.

Resolution: **sequence after 011/010 (already shipped); no coordination needed.** All changes are forward-only on `main`.
