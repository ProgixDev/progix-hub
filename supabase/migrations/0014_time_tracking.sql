-- progixHub — work time tracking (spec 013). A member clocks in/out with breaks; the org sees
-- everyone's status + hours. One open session per user (partial unique index). Transitions are
-- SECURITY DEFINER RPCs scoped to auth.uid() so valid-transition + break math are enforced at the
-- DB (AC-2/AC-5); RLS is the backstop — org-wide read for members, own-row writes only.

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  break_started_at timestamptz,
  break_seconds integer not null default 0,
  created_at timestamptz not null default now()
);
-- At most one open (unfinished) session per user.
create unique index if not exists work_sessions_one_open
  on public.work_sessions(user_id) where ended_at is null;
create index if not exists work_sessions_user_started
  on public.work_sessions(user_id, started_at);

alter table public.work_sessions enable row level security;

drop policy if exists "members read work sessions" on public.work_sessions;
create policy "members read work sessions" on public.work_sessions
  for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false));

drop policy if exists "own insert work sessions" on public.work_sessions;
create policy "own insert work sessions" on public.work_sessions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "own update work sessions" on public.work_sessions;
create policy "own update work sessions" on public.work_sessions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Worked seconds of a session right now: elapsed − accumulated break − any in-progress break.
create or replace function public.work_session_seconds(p public.work_sessions)
returns bigint language sql stable set search_path = '' as $$
  select greatest(0,
    floor(extract(epoch from coalesce(p.ended_at, now()) - p.started_at))::bigint
    - p.break_seconds
    - case when p.ended_at is null and p.break_started_at is not null
        then floor(extract(epoch from now() - p.break_started_at))::bigint else 0 end);
$$;

-- ============================== transition RPCs (auth.uid()-scoped) ==============================

create or replace function public.work_start()
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.work_sessions(user_id)
  select auth.uid()
  where not exists (
    select 1 from public.work_sessions where user_id = auth.uid() and ended_at is null);
end; $$;

create or replace function public.work_pause()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.work_sessions set break_started_at = now()
  where user_id = auth.uid() and ended_at is null and break_started_at is null;
end; $$;

create or replace function public.work_resume()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.work_sessions
  set break_seconds = break_seconds + floor(extract(epoch from now() - break_started_at))::int,
      break_started_at = null
  where user_id = auth.uid() and ended_at is null and break_started_at is not null;
end; $$;

create or replace function public.work_finish()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.work_sessions
  set break_seconds = break_seconds + case when break_started_at is not null
        then floor(extract(epoch from now() - break_started_at))::int else 0 end,
      break_started_at = null,
      ended_at = now()
  where user_id = auth.uid() and ended_at is null;
end; $$;

revoke execute on function
  public.work_start(), public.work_pause(), public.work_resume(), public.work_finish()
  from public, anon;
grant execute on function
  public.work_start(), public.work_pause(), public.work_resume(), public.work_finish()
  to authenticated;

-- ============================== org status + daily summary ==============================

-- Every member's current state + seconds worked today (UTC day). Member-gated (AC-4).
create or replace function public.work_status_all()
returns table (user_id uuid, state text, seconds_today bigint)
language sql stable security definer set search_path = '' as $$
  select u.id,
    coalesce((
      select case when s.break_started_at is not null then 'paused' else 'working' end
      from public.work_sessions s where s.user_id = u.id and s.ended_at is null limit 1), 'off'),
    coalesce((
      select sum(public.work_session_seconds(s))::bigint from public.work_sessions s
      where s.user_id = u.id and s.started_at >= date_trunc('day', now())), 0)
  from auth.users u
  where coalesce((u.raw_app_meta_data->>'is_member')::boolean, false) is true
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is true;
$$;
revoke execute on function public.work_status_all() from public, anon;
grant execute on function public.work_status_all() to authenticated;

-- Per-member worked seconds for a given UTC day (defaults to yesterday) — for the daily report.
create or replace function public.work_daily_summary(p_day date default (current_date - 1))
returns table (user_id uuid, seconds bigint)
language sql stable security definer set search_path = '' as $$
  select s.user_id, sum(public.work_session_seconds(s))::bigint
  from public.work_sessions s
  where s.started_at >= p_day::timestamptz and s.started_at < (p_day + 1)::timestamptz
  group by s.user_id;
$$;
revoke execute on function public.work_daily_summary(date) from public, anon;
grant execute on function public.work_daily_summary(date) to authenticated;

-- Close sessions left open across a day boundary so daily totals stay bounded (AC-6). Admin/cron
-- only (not granted to clients); pg_cron / the service role calls it.
create or replace function public.close_stale_work_sessions()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  with closed as (
    update public.work_sessions
    set ended_at = date_trunc('day', started_at) + interval '1 day',
        break_seconds = break_seconds + case when break_started_at is not null
          then floor(extract(epoch from (date_trunc('day', started_at) + interval '1 day')
                                         - break_started_at))::int else 0 end,
        break_started_at = null
    where ended_at is null and started_at < date_trunc('day', now())
    returning 1)
  select count(*) into n from closed;
  return n;
end; $$;
revoke execute on function public.close_stale_work_sessions() from public, anon, authenticated;
