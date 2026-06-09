-- progixHub — secure env vars (spec 003, ADR-0007). Applied to project ldxiildqpnykqhzqlhsw.
--
-- Defense in depth, hardened by the spec-003 design review:
--   * env_vars        — metadata only; members may SELECT (deny-by-default RLS on writes).
--   * env_var_secrets — ciphertext, ISOLATED: RLS on + every grant revoked from anon/authenticated.
--                       Reachable only inside the SECURITY DEFINER RPCs below.
--   * env_var_audit   — append-only trail; members SELECT only; INSERT/UPDATE/DELETE revoked
--                       (rows are written solely by the RPCs, which bind the actor server-side).
-- All secret/audit writes go through SECURITY DEFINER RPCs that re-check app_metadata.is_member,
-- derive the actor from the verified JWT (never client input), and write the audit row in the SAME
-- transaction as the action (so a value is never returned without a durable record).

-- ============================== tables ==============================

create table if not exists public.env_vars (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 256),
  service text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);
create index if not exists env_vars_project_idx on public.env_vars (project_id);

create table if not exists public.env_var_secrets (
  env_var_id uuid primary key references public.env_vars (id) on delete cascade,
  value_ciphertext text not null
);

create table if not exists public.env_var_audit (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  env_var_id uuid references public.env_vars (id) on delete set null,
  env_var_key text not null,
  action text not null check (action in ('create', 'edit', 'delete', 'reveal', 'copy')),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  created_at timestamptz not null default now()
);
create index if not exists env_var_audit_project_idx on public.env_var_audit (project_id, created_at desc);

-- auto-touch updated_at (reuse the search_path-pinned trigger fn from 0001)
drop trigger if exists env_vars_set_updated_at on public.env_vars;
create trigger env_vars_set_updated_at
  before update on public.env_vars
  for each row execute function public.set_updated_at();

-- ============================== RLS ==============================

alter table public.env_vars enable row level security;
alter table public.env_var_secrets enable row level security;
alter table public.env_var_audit enable row level security;

-- env_vars: members may read metadata; all writes go through the RPCs (no write policies = deny).
drop policy if exists "members read env_vars" on public.env_vars;
create policy "members read env_vars" on public.env_vars
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true);

-- env_var_secrets: no policies at all, and grants revoked — unreachable except via the DEFINER RPCs.
revoke all on public.env_var_secrets from anon, authenticated;

-- env_var_audit: members may read the trail; never write/alter it directly (append-only, RPC-written).
drop policy if exists "members read env_var_audit" on public.env_var_audit;
create policy "members read env_var_audit" on public.env_var_audit
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true);

revoke insert, update, delete on public.env_var_audit from anon, authenticated;

-- ============================== RPCs (SECURITY DEFINER) ==============================
-- search_path='' + schema-qualified refs + an internal is_member gate make these safe in public
-- (PostgREST requires public to expose them). EXECUTE is granted to authenticated only.

create or replace function public.create_env_var(
  p_id uuid,
  p_project_id uuid,
  p_key text,
  p_service text,
  p_ciphertext text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is not true then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.projects where id = p_project_id) then
    raise exception 'project not found' using errcode = 'P0002';
  end if;

  insert into public.env_vars (id, project_id, key, service, created_by)
  values (p_id, p_project_id, p_key, nullif(p_service, ''), auth.uid());

  insert into public.env_var_secrets (env_var_id, value_ciphertext)
  values (p_id, p_ciphertext);

  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (p_project_id, p_id, p_key, 'create', auth.uid(), auth.jwt() ->> 'email');
end;
$$;

create or replace function public.update_env_var(
  p_id uuid,
  p_key text,
  p_service text,
  p_ciphertext text -- null = leave the value unchanged
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is not true then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select project_id into v_project from public.env_vars where id = p_id;
  if v_project is null then
    raise exception 'env var not found' using errcode = 'P0002';
  end if;

  update public.env_vars set key = p_key, service = nullif(p_service, '') where id = p_id;
  if p_ciphertext is not null then
    update public.env_var_secrets set value_ciphertext = p_ciphertext where env_var_id = p_id;
  end if;

  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (v_project, p_id, p_key, 'edit', auth.uid(), auth.jwt() ->> 'email');
end;
$$;

create or replace function public.delete_env_var(p_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
  v_key text;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is not true then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select project_id, key into v_project, v_key from public.env_vars where id = p_id;
  if v_project is null then
    raise exception 'env var not found' using errcode = 'P0002';
  end if;

  -- snapshot the key into the audit row BEFORE the row (and its secret) are cascade-deleted
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (v_project, p_id, v_key, 'delete', auth.uid(), auth.jwt() ->> 'email');

  delete from public.env_vars where id = p_id;
end;
$$;

create or replace function public.reveal_env_var(p_id uuid, p_intent text) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
  v_key text;
  v_ciphertext text;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is not true then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_intent not in ('reveal', 'copy') then
    raise exception 'invalid intent' using errcode = '22023';
  end if;

  select ev.project_id, ev.key, s.value_ciphertext
    into v_project, v_key, v_ciphertext
    from public.env_vars ev
    join public.env_var_secrets s on s.env_var_id = ev.id
    where ev.id = p_id;
  if v_ciphertext is null then
    raise exception 'env var not found' using errcode = 'P0002';
  end if;

  -- audit FIRST, same transaction: the ciphertext is never returned without a durable record
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (v_project, p_id, v_key, p_intent, auth.uid(), auth.jwt() ->> 'email');

  return v_ciphertext;
end;
$$;

-- EXECUTE to authenticated only (the RPCs gate membership internally).
revoke execute on function public.create_env_var(uuid, uuid, text, text, text) from public, anon;
revoke execute on function public.update_env_var(uuid, text, text, text) from public, anon;
revoke execute on function public.delete_env_var(uuid) from public, anon;
revoke execute on function public.reveal_env_var(uuid, text) from public, anon;
grant execute on function public.create_env_var(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.update_env_var(uuid, text, text, text) to authenticated;
grant execute on function public.delete_env_var(uuid) to authenticated;
grant execute on function public.reveal_env_var(uuid, text) to authenticated;
