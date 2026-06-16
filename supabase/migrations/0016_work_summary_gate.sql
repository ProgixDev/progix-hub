-- progixHub — defense-in-depth: gate work_daily_summary to member callers (appsec P2, spec 013).
-- Every sibling function checks the caller is a member; this one didn't. Not exploitable today
-- (only members hold an authenticated JWT), but make it fail closed by the same rule so a future
-- non-member authenticated principal can't read the org's hours.
create or replace function public.work_daily_summary(p_day date default (current_date - 1))
returns table (user_id uuid, seconds bigint)
language sql stable security definer set search_path = '' as $$
  select s.user_id, sum(public.work_session_seconds(s))::bigint
  from public.work_sessions s
  where s.started_at >= p_day::timestamptz and s.started_at < (p_day + 1)::timestamptz
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is true
  group by s.user_id;
$$;
