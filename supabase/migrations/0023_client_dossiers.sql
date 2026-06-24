-- progixHub — team-only client dossier per project (spec 018). Sensitive internal context (client
-- type, temperament, IT-savviness, notes). Readable/writable only by members with access to the
-- project; NO anon policy and never returned by any client-facing RPC, so it can't reach a client.

create table if not exists public.client_dossiers (
  project_id uuid primary key references public.projects(id) on delete cascade,
  contact_name text,
  contact_email text,
  contact_phone text,
  company text,
  client_role text,
  client_type text,
  it_savviness int check (it_savviness is null or it_savviness between 1 and 5),
  temperament text,
  notes text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists client_dossiers_set_updated_at on public.client_dossiers;
create trigger client_dossiers_set_updated_at
  before update on public.client_dossiers
  for each row execute function public.set_updated_at();

alter table public.client_dossiers enable row level security;

-- Any member with access to the project (any role) may read + write the dossier. No anon policy.
drop policy if exists "team manage dossier" on public.client_dossiers;
create policy "team manage dossier" on public.client_dossiers
  for all to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
