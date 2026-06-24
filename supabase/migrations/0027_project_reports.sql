-- progixHub — per-project daily reports (spec 021). Markdown notes stored against a project,
-- team-only (project members, all roles); no anon path. Author + timestamp recorded.

create table if not exists public.project_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content_md text not null,
  created_by uuid references auth.users(id),
  author_label text, -- denormalized author name/email for display (no joinable user table)
  created_at timestamptz not null default now()
);
alter table public.project_reports add column if not exists author_label text;
create index if not exists project_reports_project on public.project_reports(project_id, created_at desc);

alter table public.project_reports enable row level security;

drop policy if exists "members rw project_reports" on public.project_reports;
create policy "members rw project_reports" on public.project_reports
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
