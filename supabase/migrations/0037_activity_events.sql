-- Activity feed (spec 028): a lightweight event log across projects. Events are recorded by the
-- recordActivity helper from key actions (report posted, project created, setup created). Members
-- read events for their projects; inserts are gated the same way (mirrors plan_items RLS).
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_label text not null default 'Someone',
  kind text not null,
  summary text not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_events_recent on public.activity_events(created_at desc);
create index if not exists activity_events_project on public.activity_events(project_id);

alter table public.activity_events enable row level security;
drop policy if exists "members rw activity" on public.activity_events;
create policy "members rw activity" on public.activity_events
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
