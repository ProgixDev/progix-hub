-- progixHub — project planning playground (spec 022). One table renders both lenses (canvas + board).
-- Team-only (project members, all roles); no anon. type: task | note | phase (frame).

create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null default 'task' check (type in ('task', 'note', 'phase')),
  title text not null default '',
  body text,
  status text not null default 'backlog'
    check (status in ('backlog', 'in_progress', 'in_review', 'done')),
  assignee uuid references auth.users(id),
  estimate_hours numeric,
  parent_id uuid references public.plan_items(id) on delete set null, -- task → phase frame
  pos_x integer not null default 0,
  pos_y integer not null default 0,
  width integer,
  height integer,
  board_order integer not null default 0,
  color text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plan_items_project on public.plan_items(project_id);

alter table public.plan_items enable row level security;

drop policy if exists "members rw plan_items" on public.plan_items;
create policy "members rw plan_items" on public.plan_items
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
