-- Explicit-user variant of create_env_var (spec 031) so the MCP (service-role, no auth.uid()) can
-- upload a project's .env. Gate uses has_project_access_for(user, project, ['pm','developer']) —
-- env vars are PM/developer only, never viewer. Encryption stays app-side (caller passes ciphertext
-- bound to p_id as AAD, exactly like createEnvVarAction). service_role only.
create or replace function public.create_env_var_for(
  p_user uuid, p_id uuid, p_project_id uuid, p_key text, p_service text,
  p_ciphertext text, p_scope text default 'backend'
) returns void language plpgsql security definer set search_path = '' as $$
declare v_email text;
begin
  if not public.has_project_access_for(p_user, p_project_id, array['pm', 'developer']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.projects where id = p_project_id) then
    raise exception 'project not found' using errcode = 'P0002';
  end if;
  select email into v_email from auth.users where id = p_user;
  insert into public.env_vars (id, project_id, key, service, scope, created_by)
  values (p_id, p_project_id, p_key, nullif(p_service, ''), p_scope, p_user);
  insert into public.env_var_secrets (env_var_id, value_ciphertext) values (p_id, p_ciphertext);
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (p_project_id, p_id, p_key, 'create', p_user, coalesce(v_email, ''));
end; $$;
revoke all on function public.create_env_var_for(uuid, uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_env_var_for(uuid, uuid, uuid, text, text, text, text)
  to service_role;
