-- Pricing catalog (spec 044): the priced building blocks of a client project. Leadership prices each
-- feature (base price + effort in days); the Scoping & Pricing wizard later sums selections into a
-- quote + cahier des charges. Seeded from the 141 feature blocks; extendable with custom items.
create table if not exists public.pricing_catalog_items (
  id uuid primary key default gen_random_uuid(),
  key text unique,                      -- feature-block key for seeded rows; null for custom
  category text not null,
  name text not null,
  description text,
  base_price numeric not null default 0,
  effort_days numeric not null default 0,
  is_custom boolean not null default false,
  active boolean not null default true,
  sort integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pricing_catalog_category on public.pricing_catalog_items(category, sort, name);

alter table public.pricing_catalog_items enable row level security;

-- Any member may read the catalog (the wizard is leadership-only, but prices aren't secret internally).
drop policy if exists "members read pricing" on public.pricing_catalog_items;
create policy "members read pricing" on public.pricing_catalog_items
  for select using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false));

-- Only leadership (superadmin / global-PM / lead) may price/add/edit items.
drop policy if exists "leadership writes pricing" on public.pricing_catalog_items;
create policy "leadership writes pricing" on public.pricing_catalog_items
  for all
  using (public.is_superadmin() or public.is_lead() or public.is_global_pm())
  with check (public.is_superadmin() or public.is_lead() or public.is_global_pm());
