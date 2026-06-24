-- progixHub — dependency arrows for the playground (spec 022 v2). A link source→target means
-- "source then target" (source is a prerequisite). Team-only; cascades with its items.

create table if not exists public.plan_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_id uuid not null references public.plan_items(id) on delete cascade,
  target_id uuid not null references public.plan_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (source_id, target_id),
  check (source_id <> target_id)
);
create index if not exists plan_links_project on public.plan_links(project_id);

alter table public.plan_links enable row level security;

drop policy if exists "members rw plan_links" on public.plan_links;
create policy "members rw plan_links" on public.plan_links
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
