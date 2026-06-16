-- progixHub — schedule the daily work-time job (spec 013 AC-6). At 00:05 UTC each day, close any
-- session left open across the day boundary so daily totals stay bounded. The daily report reads
-- per-member hours from public.work_daily_summary(). pg_cron runs as the table owner, so the
-- SECURITY DEFINER function executes fine.

create extension if not exists pg_cron;

-- Name-based schedule: re-running replaces the existing job rather than duplicating it.
select cron.schedule(
  'close-stale-work-sessions',
  '5 0 * * *',
  $$select public.close_stale_work_sessions()$$
);
