-- Catalog v2 (spec 045): the structure that scales to 2000+ blocks.
--  block_type: essential (free baseline) | screen | feature | option (nested under a feature) | crosscutting
--  parent_id : an option/sub-item hangs under its feature
--  is_free   : essentials/skeletons documented but not charged
--  platforms : which ecosystems it applies to (web/mobile/desktop); empty = all
alter table public.pricing_catalog_items
  add column if not exists block_type text not null default 'feature',
  add column if not exists parent_id uuid references public.pricing_catalog_items(id) on delete cascade,
  add column if not exists is_free boolean not null default false,
  add column if not exists platforms text[] not null default '{}';

do $$ begin
  alter table public.pricing_catalog_items
    add constraint pricing_block_type_chk
    check (block_type in ('essential', 'screen', 'feature', 'option', 'crosscutting'));
exception when duplicate_object then null; end $$;

create index if not exists pricing_catalog_parent on public.pricing_catalog_items(parent_id);
