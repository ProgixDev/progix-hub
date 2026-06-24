-- progixHub — org-wide platform registry (spec 015). The reusable catalog of external platforms
-- (Stripe, Vercel, …) used to onboard clients. Configured once; the client onboarding page
-- (feature ③) will compose from it. Read by any member; written only by superadmins / global PMs.

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_id text,
  access_pattern text not null check (access_pattern in ('invite_collaborator', 'store_key', 'diy')),
  critical boolean not null default false,
  steps text[] not null default '{}',
  video_url text,
  invite_url text,
  invite_role text,
  invite_email text,
  key_label text,
  disabled boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists platforms_set_updated_at on public.platforms;
create trigger platforms_set_updated_at
  before update on public.platforms
  for each row execute function public.set_updated_at();

alter table public.platforms enable row level security;

drop policy if exists "members read platforms" on public.platforms;
create policy "members read platforms" on public.platforms
  for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false));

-- Write is superadmin / global PM only (spec 014). Backstops the server-action guard (AC-4).
drop policy if exists "admins insert platforms" on public.platforms;
create policy "admins insert platforms" on public.platforms
  for insert to authenticated
  with check (public.is_superadmin() or public.is_global_pm());

drop policy if exists "admins update platforms" on public.platforms;
create policy "admins update platforms" on public.platforms
  for update to authenticated
  using (public.is_superadmin() or public.is_global_pm())
  with check (public.is_superadmin() or public.is_global_pm());

drop policy if exists "admins delete platforms" on public.platforms;
create policy "admins delete platforms" on public.platforms
  for delete to authenticated
  using (public.is_superadmin() or public.is_global_pm());
