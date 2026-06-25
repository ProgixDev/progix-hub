-- Freehand sketch layer for the playground (spec 026): temporary strokes a team draws to think
-- before laying down phases. One row per stroke; cleared in bulk. Members read/write (mirrors
-- plan_items RLS).
create table if not exists public.plan_drawings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  points jsonb not null,
  color text not null default '#4c82fb',
  width real not null default 2.5,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists plan_drawings_project on public.plan_drawings(project_id);

alter table public.plan_drawings enable row level security;
drop policy if exists "members rw plan_drawings" on public.plan_drawings;
create policy "members rw plan_drawings" on public.plan_drawings
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
