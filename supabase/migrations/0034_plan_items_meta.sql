-- Feature-block cards (spec 025): a task card seeded from a prebuilt block (Stripe, Twilio, …)
-- carries brand/category/checklist data here. jsonb so the catalog can evolve without migrations.
-- Inherits plan_items RLS (members r/w); no policy change needed.
alter table public.plan_items
  add column if not exists meta jsonb not null default '{}'::jsonb;
