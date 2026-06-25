-- Specs/PRDs ingested from a project repo (spec 032), shown in the playground's Specs lens. Synced
-- by the MCP sync_specs tool (upsert by slug). Members read/write (mirrors plan_items RLS).
create table if not exists public.project_specs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  slug text not null,
  number int,
  title text not null,
  status text not null default 'draft',
  kind text not null default 'spec',
  body_md text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);
create index if not exists project_specs_project on public.project_specs(project_id);

alter table public.project_specs enable row level security;
drop policy if exists "members rw specs" on public.project_specs;
create policy "members rw specs" on public.project_specs
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
