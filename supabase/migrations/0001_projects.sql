-- progixHub — projects registry (spec 002). Applied to project ldxiildqpnykqhzqlhsw.
-- Deny-by-default RLS; only verified Progix members (app_metadata.is_member, stamped at the
-- GitHub OAuth callback — not user-editable). No DELETE policy → archive-only.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'at_risk', 'archived')),
  description text,
  notion_url text,
  slack_url text,
  github_url text,
  live_url text,
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

-- auto-touch updated_at (search_path pinned per the security advisor)
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

drop policy if exists "members read projects" on public.projects;
create policy "members read projects" on public.projects
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true);

drop policy if exists "members insert projects" on public.projects;
create policy "members insert projects" on public.projects
  for insert to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true
    and created_by = auth.uid()
  );

drop policy if exists "members update projects" on public.projects;
create policy "members update projects" on public.projects
  for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true)
  with check ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true);
