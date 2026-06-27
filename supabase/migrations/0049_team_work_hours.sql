-- Time insights (spec 042): per-member, per-day worked seconds since a cutoff. Surfaces the work
-- clock data (work_sessions has no project_id — this is per-member, not per-project/billing).
-- SECURITY DEFINER like work_status_all (it aggregates all members), gated to is_member via the JWT;
-- result rows are also limited to member-owned sessions (self-consistent with work_status_all).
create or replace function public.team_work_hours(p_since timestamptz)
returns table (user_id uuid, day date, seconds bigint)
language sql stable security definer set search_path = '' as $$
  select s.user_id,
         (date_trunc('day', s.started_at))::date as day,
         sum(public.work_session_seconds(s))::bigint as seconds
  from public.work_sessions s
  where s.started_at >= p_since
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false)
    and exists (
      select 1 from auth.users u
      where u.id = s.user_id
        and coalesce((u.raw_app_meta_data ->> 'is_member')::boolean, false)
    )
  group by s.user_id, (date_trunc('day', s.started_at))::date;
$$;
revoke all on function public.team_work_hours(timestamptz) from public, anon;
grant execute on function public.team_work_hours(timestamptz) to authenticated;
