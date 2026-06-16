# Tasks 013 — Work time tracking

Ordered, checkboxed. Tick on commit. `[P]` = parallel-safe. ≤ ~30 min each.

## Phase 0 — setup

- [x] T0 Branch `feat/013-time-tracking` (done). Scaffold slice `src/features/time-tracking/` (lib.ts, data.ts, actions.ts, types.ts, index.ts, components/) · done: `pnpm typecheck` green

## Phase 1 — core behavior

- [x] T1 `lib.ts`: pure `WorkState = "off"|"working"|"paused"`, `statusOf(session)`, `workedSeconds(session, nowMs)` (excludes accumulated + in-progress break) · done: `lib.test.ts` covers the state machine, invalid transitions, break exclusion (AC-1/AC-2/AC-3)
- [x] T2 Migration `0014_time_tracking.sql`: `work_sessions` table + partial unique index (one open per user) + RLS (org read for members, own-row insert/update) + RPCs `work_start/pause/resume/finish` (SECURITY DEFINER, `auth.uid()`-scoped, transition guards) + `work_status_all()` + `work_daily_summary(date)` + `close_stale_work_sessions()` · done: applies; a member can start/pause/resume/finish own; cross-user blocked (AC-2/AC-4/AC-5)
- [ ] T3 `data.ts`: `getMySession()` + `listWorkStatus()` (calls `work_status_all`), server-only · done: typechecks, returns typed rows
- [ ] T4 `actions.ts`: `startWorkAction/pauseWorkAction/resumeWorkAction/finishWorkAction` — `requireMember`, call RPC, `revalidatePath`, result objects · done: `actions.test.ts` covers not-authorized + a happy transition (AC-1/AC-5)
- [ ] T5 `components/clock-widget.tsx` (`"use client"`): self-loads state, shows Start / running timer + Pause + Finish / Resume + Finish, ticking display · done: renders all states from a seeded state; copy in en/fr
- [ ] T6 Insert `<ClockWidget/>` into the app-shell top bar once (every page) · done: widget shows on /, /members, /profile, project pages
- [ ] T7 Members directory: show each member's status (working/on break/off) + hours today, merged from `listWorkStatus()` · done: directory rows show status (AC-4); `/members` page fetches it

## Phase 2 — verification

- [ ] T8 E2E `e2e/time.spec.ts` (CUJ): Start → timer → Pause → Resume → Finish; assert header reflects state · done: spec written (screenshots deferred — Playwright not installed)
- [ ] T9 `pnpm verify` green; conventional commits

## Phase 3 — review & ship

- [ ] T10 `/review` (appsec lens: RLS own-row writes, RPC scoping, no time-gaming) ; fix P0/P1
- [ ] T11 Daily summary wiring: confirm `pg_cron` (or GitHub Action fallback) schedules `close_stale_work_sessions()`; expose `work_daily_summary` to the daily report · done: job scheduled + documented (AC-6)
- [ ] T12 Open PR (spec+plan linked); after merge `/update-docs` (CUJ row, spec → shipped); apply migration + deploy `vercel --prod`

## AC coverage (mirror of plan.md)

- [ ] AC-1 → T1,T5,T8 · [ ] AC-2 → T1,T2 · [ ] AC-3 → T1 · [ ] AC-4 → T2,T7 · [ ] AC-5 → T2,T4 · [ ] AC-6 → T2,T11
