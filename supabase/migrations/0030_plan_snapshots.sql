-- progixHub — playground snapshots / save-states (spec 022 v3). A snapshot stores the project's
-- plan (items + links) as jsonb; restore replaces the live plan with it. Team-only.

create table if not exists public.plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null default 'Snapshot',
  data jsonb not null, -- { items: PlanItem[], links: PlanLink[] }
  created_by uuid references auth.users(id),
  author_label text,
  created_at timestamptz not null default now()
);
create index if not exists plan_snapshots_project on public.plan_snapshots(project_id, created_at desc);

alter table public.plan_snapshots enable row level security;

drop policy if exists "members rw plan_snapshots" on public.plan_snapshots;
create policy "members rw plan_snapshots" on public.plan_snapshots
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
