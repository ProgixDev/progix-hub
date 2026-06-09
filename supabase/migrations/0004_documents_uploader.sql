-- 0004_documents_uploader.sql
-- Spec 004 review fix: each document row must show who added it (AC-1/2/3, PRD MVP #3).
-- The RLS-bound client can't read auth.users, so we denormalize the actor's email at
-- write time — the same pattern the env_var_audit trail uses (actor_email).

alter table public.documents
  add column if not exists created_by_email text;

comment on column public.documents.created_by_email is
  'Email of the member who created the row, stamped at write time (RLS can''t read auth.users).';
