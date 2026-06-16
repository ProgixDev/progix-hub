# Plan 013 — Work time tracking

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-16

## Approach

A small clock on top of one table. `work_sessions(user_id, started_at, ended_at, break_started_at, break_seconds)` holds at most one open row per user (partial unique index). Four SECURITY DEFINER RPCs — `work_start/work_pause/work_resume/work_finish` — each scoped to `auth.uid()` enforce valid transitions and the break arithmetic atomically at the DB (so AC-2/AC-5 hold regardless of the UI); RLS is the backstop (own-row writes, org-wide read). The header gets one client `ClockWidget` that loads its state via a server action and ticks locally — dropped into `AppShell` once so it shows on every page without threading props through each route. The Members directory gains a per-person status (working / on break / off) + hours-today, read via a gated `work_status_all()` RPC and merged into the existing list. Worked-seconds is a pure TS function (`workedSeconds(session, now)`) so it's unit-tested without a clock. The daily summary is a `work_daily_summary(day)` SQL function plus a `pg_cron` job that closes day-spanning sessions at 00:05 UTC; **day boundary + summary are UTC for v1** (resolved open question — a single org TZ can come later via one constant). No new dependency, no boundary exception → no ADR.

## Placement (per `docs/architecture/module-boundaries.md`)

| What           | Where                                              | Notes                                                                                                    |
| -------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Slice          | `src/features/time-tracking/`                      | `lib.ts` (pure state/seconds), `data.ts`, `actions.ts`, `components/clock-widget.tsx`, `index.ts`, tests |
| Header control | `src/components/app-shell/*` (one insertion)       | render `<ClockWidget/>` in the top bar for every page                                                    |
| Org status     | `src/features/members` directory (consumes status) | merge work status into the member rows                                                                   |
| DB             | `supabase/migrations/0014_time_tracking.sql`       | table + partial unique index + RLS + 4 RPCs + summary + pg_cron                                          |

## Data & state

- **Server data:** current user's open session (`getMySession()`); all members' status + seconds-today (`work_status_all()` RPC, member-gated). Both server-read in the relevant RSC / via a server action for the widget.
- **Client state:** `ClockWidget` holds the loaded session + a local 1s ticking timer (display only); no store needed. Mutations call server actions then refresh.
- **Actions (`"use server"`):** `startWorkAction / pauseWorkAction / resumeWorkAction / finishWorkAction` — no input (operate on `auth.uid()`), call the matching RPC, `revalidatePath` the shell; return result objects. Authorization is `requireMember` + the RPC's `auth.uid()` scoping + RLS.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | unit: `lib.test.ts` (state machine: off→working→paused→working→finished) · e2e: `e2e/time.spec.ts` clock steps               |
| AC-2 | unit: `lib.test.ts` invalid transitions are no-ops · DB: RPC `where` guards (each transition conditional)                    |
| AC-3 | unit: `lib.test.ts` `workedSeconds` excludes break time (incl. an in-progress break)                                         |
| AC-4 | e2e: directory shows a status + hours; unit: `statusOf(session)` mapping · RLS: member-gated `work_status_all`               |
| AC-5 | RLS policies (own-row insert/update) + RPC `auth.uid()` scoping — unit-asserted on the policy logic where feasible           |
| AC-6 | unit: `work_daily_summary` shape via SQL reasoning + `workedSeconds`; the pg_cron close-stale job is documented + idempotent |

## Risks & unknowns

- **Clock skew / long-open sessions** — break arithmetic uses server `now()` in the RPC, not client time, so the timer can't be gamed; the client tick is display-only. The pg_cron close-stale job bounds a forgotten session to the day.
- **`pg_cron` availability** — confirm the extension is enabled (`list_extensions`); if absent, ship the SQL function and schedule it via a GitHub Action cron instead (same as `daily-report.yml`). The core feature doesn't depend on it.
- **Per-page header read cost** — `ClockWidget` self-loads via one server action on mount rather than blocking every RSC; cheap, and avoids prop-threading.
- **Timezone** — UTC day boundary for v1 may split workdays for non-UTC members; called out, single-constant change later.

## Overlap check

Active specs touching the same areas: **spec 012** (just shipped) owns `src/features/members` + the app-shell header — 013 adds a column to the directory and a sibling widget in the header; additive, no conflict (012 is merged). No other active spec touches time tracking. Resolution: **no coordination needed.**
