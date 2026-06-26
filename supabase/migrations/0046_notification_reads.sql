-- Real notifications (spec 039): per-user read state over the activity feed. A single
-- "last_seen_at" per user; unread = activity events visible to them, newer than that, not their own.
create table if not exists public.notification_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_reads enable row level security;

drop policy if exists "own notification read state" on public.notification_reads;
create policy "own notification read state" on public.notification_reads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Count of unread notifications for the caller. SECURITY INVOKER so activity_events RLS applies —
-- only events on the caller's projects are counted, excluding their own actions.
create or replace function public.unread_notification_count()
returns integer language sql stable set search_path = '' as $$
  select count(*)::int
  from public.activity_events e
  where e.created_at > coalesce(
      (select last_seen_at from public.notification_reads where user_id = auth.uid()),
      to_timestamp(0))
    and e.actor_id is distinct from auth.uid();
$$;
revoke all on function public.unread_notification_count() from public, anon;
grant execute on function public.unread_notification_count() to authenticated;
