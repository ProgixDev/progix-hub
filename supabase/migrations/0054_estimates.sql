-- Scoping & Pricing wizard estimates (spec 045): a saved scope+price for a client project.
-- selections snapshots the chosen catalog blocks (price/effort at estimate time) so a later catalog
-- change can't alter a sent quote. Leadership-only (a sales/scoping tool).
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text,
  ecosystems text[] not null default '{}',
  project_type text,
  selections jsonb not null default '[]'::jsonb,
  buffer_pct numeric not null default 15,
  velocity numeric not null default 10,
  total_price numeric not null default 0,
  total_days numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists estimates_recent on public.estimates(created_at desc);

alter table public.estimates enable row level security;

drop policy if exists "leadership manages estimates" on public.estimates;
create policy "leadership manages estimates" on public.estimates
  for all
  using (public.is_superadmin() or public.is_lead() or public.is_global_pm())
  with check (public.is_superadmin() or public.is_lead() or public.is_global_pm());
