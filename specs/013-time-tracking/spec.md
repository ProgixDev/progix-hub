# Spec 013 — Work time tracking (clock in / pause / finish)

- **Status:** shipped
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-16
- **Slice / areas touched:** new `src/features/time-tracking`; a clock control in the app-shell header; an org status surface on `/members`; migration (work_sessions table + RLS + a daily-summary helper); a scheduled daily job. Builds on specs 011 + 012.

## Problem (the why)

Developers announce their working hours by posting in Slack ("starting", "back", "done for today"). It's noisy, unstructured, easy to forget, and there's no record to total up. The org wants this on the platform: a one-click clock so anyone can see who's working right now and how many hours each person put in — without scrolling Slack.

## Desired behavior (the what)

Every signed-in member has a **clock control in the top bar on every page**. When off the clock it shows **Start working**. While working it shows a running timer and two actions: **Take a pause** and **Finish**. While paused it shows **Resume** and **Finish**, and the timer holds. Finishing closes the day's session. A member can start again later the same day (a new session); their daily total is the sum of all sessions, excluding paused time.

Work is tracked as the member's **overall workday** — it is not tied to a project. A member only ever has one open session at a time.

Because the org is transparent (spec 012), **everyone can see everyone's status**: the Members directory shows each person's current state — working, on a break, or off — and their hours today.

A **daily summary** of each member's hours is compiled by a scheduled job at end of day and made available to the daily report, so the team gets a clean per-person total without anyone tallying Slack.

## Acceptance criteria

- **AC-1 (start/pause/resume/finish):** A member can Start working (timer runs), Take a pause (timer holds), Resume (timer runs again), and Finish (session closes); the control reflects the current state on every page.
- **AC-2 (one open session):** Starting while a session is already open is rejected/no-ops; pausing when not working, resuming when not paused, and finishing when off are each safely rejected — the server enforces valid transitions, not just the UI.
- **AC-3 (daily total excludes breaks):** A member's hours-today equals the sum of their sessions' worked time for the day, with paused time excluded.
- **AC-4 (org-wide status):** Every signed-in member sees each member's current state (working / on break / off) and hours today in the directory; a signed-out visitor sees nothing.
- **AC-5 (own data only — non-happy):** A member can only start/pause/resume/finish their **own** sessions; an attempt to mutate someone else's is refused at the database (RLS), not just hidden in the UI.
- **AC-6 (daily summary):** A scheduled job produces a per-member total of the previous day's hours (and closes any session left open across the day boundary so totals are bounded), available to the daily report.

## Out of scope

- Per-project or per-task time attribution (this is the overall workday only).
- Editing or back-dating past sessions, manual time entry, approvals/timesheets.
- Payroll, billing, or exporting to external HR tools.
- Real-time push of others' status (the directory reflects state on load/refresh, not live sockets).
- Posting the summary to Slack automatically (the summary is made available to the daily report; wiring a Slack post is a later step).

## CUJ impact

- Registers a new CUJ — **Track work time:** Start working → see the running timer in the header → take a pause → resume → finish; open Members and see who's working and their hours today. (Update `docs/product/critical-user-journeys.md` at ship.)

## Open questions

Resolved with the owner (2026-06-16): workday-global (no project tag); control in the global header; org-wide visibility; a daily summary job (auto-closing day-spanning sessions so totals are clean).

- [ ] Day boundary / timezone for "today" and the summary job — single org timezone (which?) vs UTC. Decide in `/plan-feature` (affects when a session rolls to a new day).
