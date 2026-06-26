-- AI weekly digest (spec 038): a stored, AI-generated summary of a project's week (reports +
-- activity + progress). Generated on demand by a PM/admin; readable by any project member.
create table if not exists public.project_digests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content_md text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  model text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists project_digests_project on public.project_digests(project_id, created_at desc);

alter table public.project_digests enable row level security;

-- Any project member may read digests.
drop policy if exists "members read digests" on public.project_digests;
create policy "members read digests" on public.project_digests
  for select using (
    public.has_project_access(project_id, array['pm','developer','video_editor','viewer'])
  );

-- Only a project PM (incl. global PM / superadmin via has_project_access) may generate one.
drop policy if exists "pm insert digests" on public.project_digests;
create policy "pm insert digests" on public.project_digests
  for insert with check (public.has_project_access(project_id, array['pm']));
