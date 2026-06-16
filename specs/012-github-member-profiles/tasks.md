# Tasks 012 — GitHub member profiles & sign-in

Ordered, executable, checkboxed. Work top-to-bottom, tick boxes as you commit, never reorder silently. `[P]` = parallel-safe. Each task names its files + done-check. ≤ ~30 min each.

Much already exists (GitHub OAuth sign-in, `MemberProfile`, `ContributionGraph`, `fetchOrgContributions`) — these tasks add the missing connective tissue, not a new auth system.

## Phase 0 — setup

- [x] T0 Branch `feat/012-github-member-profiles` (done). Register `GITHUB_TOKEN` + `GITHUB_ORG_ID` in `src/core/env.ts` schema (optional) and `.env.example` with comments · done: `pnpm typecheck` green, vars documented

## Phase 1 — core behavior

- [x] T1 Migration `supabase/migrations/0012_github_profiles.sql`: re-create `list_org_members` so visibility is **any `is_member`** (drop the superadmin/lead/PM gate); keep ordering + columns. Add a comment block (spec 012). · done: SQL applies on a branch, a non-PM member can call it (AC-4)
- [ ] T2 `members/data.ts`: add `canViewOrgMembers()` → true for any signed-in member, false signed-out; keep `canManageOrgMembers` for lead-promotion gating · done: unit covers both (AC-4)
- [ ] T3 `members/commits.ts`: pure `parseCommits(raw)` (newest-first, fields: sha, message, repo, url, date) + `fetchOrgCommits(login)` (Search API, `GITHUB_TOKEN`, org + author + `author-date:>=<jan1 of current year>`, capped 30, fail-soft → `[]`) · done: `commits.test.ts` green incl. empty/error/no-token (AC-5, AC-6)
- [ ] T4 [P] `members/components/commit-list.tsx`: render commits (repo · message · date · link) + empty/unavailable state · done: renders all states from props
- [ ] T5 `members/components/connect-github-button.tsx` (`"use client"`): calls `supabase.auth.linkIdentity({provider:'github', options:{redirectTo:/auth/callback}})`, loading + error states; shown only when unlinked · done: `connect.test.ts` for the link helper (AC-1)
- [ ] T6 Extend `MemberProfile` to render `CommitList` and (on own profile, when unlinked) `ConnectGitHubButton`; add `members.commits.*` / `connect.*` copy to `en.json` + `fr.json` · done: profile shows commits + connect prompt (AC-3, AC-5)
- [ ] T7 `app/profile/page.tsx` RSC: require signed-in member (else redirect `/sign-in`); load current member + `fetchOrgContributions` + `fetchOrgCommits`; render `MemberProfile` in own-profile mode · done: `/profile` serves for a member (AC-3)
- [ ] T8 Edit `app/auth/callback/route.ts`: on the link return, stamp `github_login` into user metadata from the linked GitHub identity; map `identity_already_exists` → redirect with a friendly `?error=github_linked`; surface on sign-in/profile · done: callback unit/helper test maps conflict (AC-1, AC-7)
- [ ] T9 [P] Surface a "GitHub activity" / profile entry: add `/profile` to the user menu (and sidebar if members link present) · done: signed-in user can reach `/profile` from chrome

## Phase 2 — verification

- [ ] T10 E2E: extend/author `e2e/members.spec.ts` — register **CUJ Member GitHub profile** with `shot()` captures: open `/profile` → see activity sections → Connect GitHub visible when unlinked → open another member from directory. Stub the GitHub API so it runs without secrets · done: `FEATURE=012-github-member-profiles pnpm e2e:shots` green
- [ ] T11 Run `/verify-ui` — inspect screenshots against AC-3/5/6; fix what you see
- [ ] T12 `pnpm verify` green; conventional commits

## Phase 3 — review & ship

- [ ] T13 Run `/review`; fix P0/P1 (appsec lens on linkIdentity, token handling, the relaxed RPC, callback)
- [ ] T14 Run `/feature-report` → `docs/reports/012-github-member-profiles.md`
- [ ] T15 Open PR (template filled, spec + plan + report linked); include the **go-live secrets checklist** (GITHUB_TOKEN, GITHUB_ORG_ID, Supabase GitHub OAuth app, Manual Linking enabled)
- [ ] T16 After merge: `/update-docs` (members feature doc, **CUJ table new row**, specs index → shipped); deploy `vercel --prod`

## AC coverage (mirror of plan.md — keep ticked in sync)

- [ ] AC-1 → T5, T8, T10 · [ ] AC-2 → existing `membership.test.ts` · [ ] AC-3 → T6, T7, T10 · [ ] AC-4 → T1, T2 · [ ] AC-5 → T3, T4, T6 · [ ] AC-6 → T3, T11 · [ ] AC-7 → T8
