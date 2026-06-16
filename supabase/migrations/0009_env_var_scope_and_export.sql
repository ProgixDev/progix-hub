-- progixHub — env-var scope + bulk import + .env export (spec 009). Applied to project ldxiildqpnykqhzqlhsw.
--
-- Extends spec-003 env vars (002) and the spec-008 role gate (0006). Adds a backend/frontend
-- `scope` to each variable, a new `export` audit action, and re-keys the create/update RPCs to
-- carry the scope through. The has_project_access(project, ['pm','developer']) gate from 0006 is
-- preserved verbatim — import goes through create_env_var (gated), and export goes through
-- reveal_env_var (gated, audited per value) with a new 'export' intent.

-- ============================== schema ==============================

alter table public.env_vars
  add column if not exists scope text not null default 'backend' check (scope in ('backend', 'frontend'));

-- Allow the new 'export' action on the audit trail (every exported value is recorded).
alter table public.env_var_audit drop constraint if exists env_var_audit_action_check;
alter table public.env_var_audit
  add constraint env_var_audit_action_check
  check (action in ('create', 'edit', 'delete', 'reveal', 'copy', 'export'));

-- ============================== RPCs (signature change: + p_scope) ==============================
-- Drop the old 0006 signatures first (adding a parameter creates a new overload otherwise, which
-- PostgREST can't disambiguate), then recreate carrying the scope. Role gate copied from 0006.

drop function if exists public.create_env_var(uuid, uuid, text, text, text);
drop function if exists public.update_env_var(uuid, text, text, text);

create or replace function public.create_env_var(
  p_id uuid, p_project_id uuid, p_key text, p_service text, p_ciphertext text,
  p_scope text default 'backend'
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_project_access(p_project_id, array['pm', 'developer']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.projects where id = p_project_id) then
    raise exception 'project not found' using errcode = 'P0002';
  end if;
  insert into public.env_vars (id, project_id, key, service, scope, created_by)
  values (p_id, p_project_id, p_key, nullif(p_service, ''), coalesce(nullif(p_scope, ''), 'backend'), auth.uid());
  insert into public.env_var_secrets (env_var_id, value_ciphertext) values (p_id, p_ciphertext);
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (p_project_id, p_id, p_key, 'create', auth.uid(), auth.jwt() ->> 'email');
end;
$$;

create or replace function public.update_env_var(
  p_id uuid, p_key text, p_service text, p_ciphertext text,
  p_scope text default null -- null = leave the scope unchanged
) returns void language plpgsql security definer set search_path = '' as $$
declare v_project uuid;
begin
  select project_id into v_project from public.env_vars where id = p_id;
  if v_project is null then raise exception 'env var not found' using errcode = 'P0002'; end if;
  if not public.has_project_access(v_project, array['pm', 'developer']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.env_vars
    set key = p_key, service = nullif(p_service, ''), scope = coalesce(nullif(p_scope, ''), scope)
    where id = p_id;
  if p_ciphertext is not null then
    update public.env_var_secrets set value_ciphertext = p_ciphertext where env_var_id = p_id;
  end if;
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (v_project, p_id, p_key, 'edit', auth.uid(), auth.jwt() ->> 'email');
end;
$$;

-- reveal_env_var: same 0006 role gate, now also accepts the 'export' intent (audited as 'export').
create or replace function public.reveal_env_var(p_id uuid, p_intent text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_project uuid; v_key text; v_ciphertext text;
begin
  if p_intent not in ('reveal', 'copy', 'export') then
    raise exception 'invalid intent' using errcode = '22023';
  end if;
  select ev.project_id, ev.key, s.value_ciphertext into v_project, v_key, v_ciphertext
    from public.env_vars ev join public.env_var_secrets s on s.env_var_id = ev.id where ev.id = p_id;
  if v_ciphertext is null then raise exception 'env var not found' using errcode = 'P0002'; end if;
  if not public.has_project_access(v_project, array['pm', 'developer']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (v_project, p_id, v_key, p_intent, auth.uid(), auth.jwt() ->> 'email');
  return v_ciphertext;
end;
$$;

-- EXECUTE to authenticated only (the RPCs gate access internally).
revoke execute on function public.create_env_var(uuid, uuid, text, text, text, text) from public, anon;
revoke execute on function public.update_env_var(uuid, text, text, text, text) from public, anon;
revoke execute on function public.reveal_env_var(uuid, text) from public, anon;
grant execute on function public.create_env_var(uuid, uuid, text, text, text, text) to authenticated;
grant execute on function public.update_env_var(uuid, text, text, text, text) to authenticated;
grant execute on function public.reveal_env_var(uuid, text) to authenticated;
