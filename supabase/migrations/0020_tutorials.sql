-- progixHub — tutorials video library (spec 016). Short how-tos, embed-only v1 (YouTube/Loom/Vimeo).
-- Read by any member; written only by superadmins / global PMs. The app validates that embed_url is
-- an embeddable host before writing; the player derives a safe iframe src from it.

create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  platform_service_id text,
  embed_url text not null,
  language text check (language in ('en', 'fr')),
  visible_to_clients boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tutorials_set_updated_at on public.tutorials;
create trigger tutorials_set_updated_at
  before update on public.tutorials
  for each row execute function public.set_updated_at();

alter table public.tutorials enable row level security;

drop policy if exists "members read tutorials" on public.tutorials;
create policy "members read tutorials" on public.tutorials
  for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false));

drop policy if exists "admins insert tutorials" on public.tutorials;
create policy "admins insert tutorials" on public.tutorials
  for insert to authenticated
  with check (public.is_superadmin() or public.is_global_pm());

drop policy if exists "admins update tutorials" on public.tutorials;
create policy "admins update tutorials" on public.tutorials
  for update to authenticated
  using (public.is_superadmin() or public.is_global_pm())
  with check (public.is_superadmin() or public.is_global_pm());

drop policy if exists "admins delete tutorials" on public.tutorials;
create policy "admins delete tutorials" on public.tutorials
  for delete to authenticated
  using (public.is_superadmin() or public.is_global_pm());
