-- progixHub — roles & permissions (spec 008, ADR-0011). Applied to project ldxiildqpnykqhzqlhsw.
-- Replaces flat is_member authorization with: org superadmin (JWT app_metadata.is_superadmin)
-- + per-project roles in project_members. Every policy/RPC across 002–006 is re-keyed to
-- has_project_access(project, roles[]). is_member stays the sign-in gate (middleware).

-- ============================== project_members ==============================

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('pm', 'developer', 'video_editor', 'viewer')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  primary key (project_id, user_id)
);
create index if not exists project_members_user_idx on public.project_members (user_id);

-- ============================== authorization helpers ==============================
-- SECURITY DEFINER so policies may consult project_members without recursing into its own RLS.

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false);
$$;

create or replace function public.has_project_access(p_project uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_superadmin() or exists (
    select 1 from public.project_members m
    where m.project_id = p_project and m.user_id = auth.uid() and m.role = any(p_roles)
  );
$$;

-- The caller's effective role on a project ('superadmin' | a role | null) — for the UI to gate sections.
create or replace function public.my_project_role(p_project uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when public.is_superadmin() then 'superadmin'
    else (select role from public.project_members
          where project_id = p_project and user_id = auth.uid())
  end;
$$;

-- A new project's creator becomes its PM (works even on a direct insert).
create or replace function public.projects_owner_pm()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null then
    insert into public.project_members (project_id, user_id, role, created_by)
    values (new.id, new.created_by, 'pm', new.created_by)
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists projects_owner_pm on public.projects;
create trigger projects_owner_pm
  after insert on public.projects
  for each row execute function public.projects_owner_pm();

alter table public.project_members enable row level security;
revoke all on public.project_members from anon;
-- Any member of a project may read its roster (the People panel). Writes go through the RPCs.
drop policy if exists "members read project_members" on public.project_members;
create policy "members read project_members" on public.project_members
  for select to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
revoke insert, update, delete, truncate on public.project_members from authenticated;

-- Helpers are callable in RLS for authenticated, but not by anon; the trigger fn is not an RPC.
revoke execute on function public.projects_owner_pm() from public, anon, authenticated;
revoke execute on function public.is_superadmin() from public, anon;
revoke execute on function public.has_project_access(uuid, text[]) from public, anon;
revoke execute on function public.my_project_role(uuid) from public, anon;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.has_project_access(uuid, text[]) to authenticated;
grant execute on function public.my_project_role(uuid) to authenticated;

-- ============================== re-key existing RLS ==============================

-- projects: any role sees it; only a PM (or superadmin) edits/archives it. The creator can
-- always read it back — the PM membership is created by an AFTER trigger that runs after the
-- insert's RETURNING clause, and created_by is immutable.
drop policy if exists "members read projects" on public.projects;
create policy "members read projects" on public.projects
  for select to authenticated
  using (
    created_by = auth.uid()
    or public.has_project_access(id, array['pm', 'developer', 'video_editor', 'viewer'])
  );
drop policy if exists "members update projects" on public.projects;
create policy "members update projects" on public.projects
  for update to authenticated
  using (public.has_project_access(id, array['pm']))
  with check (public.has_project_access(id, array['pm']));
-- INSERT policy (any org member may create; created_by = self) is unchanged from 0001.

-- env_vars + audit: visible to pm/developer/viewer (NOT video_editor); writes via the RPCs.
drop policy if exists "members read env_vars" on public.env_vars;
create policy "members read env_vars" on public.env_vars
  for select to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'viewer']));
drop policy if exists "members read env_var_audit" on public.env_var_audit;
create policy "members read env_var_audit" on public.env_var_audit
  for select to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'viewer']));

-- documents: all roles read; pm/developer/video_editor write.
drop policy if exists "members read documents" on public.documents;
create policy "members read documents" on public.documents
  for select to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor', 'viewer']));
drop policy if exists "members insert documents" on public.documents;
create policy "members insert documents" on public.documents
  for insert to authenticated
  with check (
    public.has_project_access(project_id, array['pm', 'developer', 'video_editor'])
    and created_by = auth.uid()
  );
drop policy if exists "members update documents" on public.documents;
create policy "members update documents" on public.documents
  for update to authenticated
  using (public.has_project_access(project_id, array['pm', 'developer', 'video_editor']))
  with check (public.has_project_access(project_id, array['pm', 'developer', 'video_editor']));

-- portal tables: all roles read; pm/developer/video_editor write.
do $$
declare t text;
begin
  foreach t in array array['portal_share_links','portal_blocks','portal_cards','portal_comments','portal_attachments'] loop
    execute format('drop policy if exists "members read %1$s" on public.%1$I', t);
    execute format($p$create policy "members read %1$s" on public.%1$I
      for select to authenticated
      using (public.has_project_access(project_id, array['pm','developer','video_editor','viewer']))$p$, t);
    execute format('drop policy if exists "members insert %1$s" on public.%1$I', t);
    execute format($p$create policy "members insert %1$s" on public.%1$I
      for insert to authenticated
      with check (public.has_project_access(project_id, array['pm','developer','video_editor']))$p$, t);
    execute format('drop policy if exists "members update %1$s" on public.%1$I', t);
    execute format($p$create policy "members update %1$s" on public.%1$I
      for update to authenticated
      using (public.has_project_access(project_id, array['pm','developer','video_editor']))
      with check (public.has_project_access(project_id, array['pm','developer','video_editor']))$p$, t);
  end loop;
end $$;

-- storage: read for any role on the path's project; write for content roles. Path = projectId/...
drop policy if exists "members read project-documents" on storage.objects;
create policy "members read project-documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-documents'
    and public.has_project_access((split_part(name, '/', 1))::uuid, array['pm','developer','video_editor','viewer'])
  );
drop policy if exists "members insert project-documents" on storage.objects;
create policy "members insert project-documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-documents'
    and public.has_project_access((split_part(name, '/', 1))::uuid, array['pm','developer','video_editor'])
  );
drop policy if exists "members update project-documents" on storage.objects;
create policy "members update project-documents" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'project-documents'
    and public.has_project_access((split_part(name, '/', 1))::uuid, array['pm','developer','video_editor'])
  );
drop policy if exists "members delete project-documents" on storage.objects;
create policy "members delete project-documents" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-documents'
    and public.has_project_access((split_part(name, '/', 1))::uuid, array['pm','developer','video_editor'])
  );
drop policy if exists "members read portal-attachments" on storage.objects;
create policy "members read portal-attachments" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'portal-attachments'
    and public.has_project_access((split_part(name, '/', 1))::uuid, array['pm','developer','video_editor','viewer'])
  );

-- ============================== env-var RPCs: re-key to pm/developer ==============================
-- Resolve the project first, then require has_project_access(project, ['pm','developer']).

create or replace function public.create_env_var(
  p_id uuid, p_project_id uuid, p_key text, p_service text, p_ciphertext text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_project_access(p_project_id, array['pm', 'developer']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.projects where id = p_project_id) then
    raise exception 'project not found' using errcode = 'P0002';
  end if;
  insert into public.env_vars (id, project_id, key, service, created_by)
  values (p_id, p_project_id, p_key, nullif(p_service, ''), auth.uid());
  insert into public.env_var_secrets (env_var_id, value_ciphertext) values (p_id, p_ciphertext);
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (p_project_id, p_id, p_key, 'create', auth.uid(), auth.jwt() ->> 'email');
end;
$$;

create or replace function public.update_env_var(
  p_id uuid, p_key text, p_service text, p_ciphertext text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_project uuid;
begin
  select project_id into v_project from public.env_vars where id = p_id;
  if v_project is null then raise exception 'env var not found' using errcode = 'P0002'; end if;
  if not public.has_project_access(v_project, array['pm', 'developer']) then
    raise exception 'not authorized' using errcode = '42501';
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
language plpgsql security definer set search_path = '' as $$
declare v_project uuid; v_key text;
begin
  select project_id, key into v_project, v_key from public.env_vars where id = p_id;
  if v_project is null then raise exception 'env var not found' using errcode = 'P0002'; end if;
  if not public.has_project_access(v_project, array['pm', 'developer']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  insert into public.env_var_audit (project_id, env_var_id, env_var_key, action, actor_id, actor_email)
  values (v_project, p_id, v_key, 'delete', auth.uid(), auth.jwt() ->> 'email');
  delete from public.env_vars where id = p_id;
end;
$$;

create or replace function public.reveal_env_var(p_id uuid, p_intent text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_project uuid; v_key text; v_ciphertext text;
begin
  if p_intent not in ('reveal', 'copy') then raise exception 'invalid intent' using errcode = '22023'; end if;
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

-- ============================== People management RPCs ==============================

create or replace function public.set_project_member(p_project uuid, p_email text, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_pm_count int;
begin
  if not (public.is_superadmin() or public.has_project_access(p_project, array['pm'])) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_role not in ('pm', 'developer', 'video_editor', 'viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_user is null then raise exception 'no_account' using errcode = 'P0002'; end if;

  -- Last-PM guard: don't demote the only PM out of the PM role.
  if p_role <> 'pm'
     and exists (select 1 from public.project_members where project_id = p_project and user_id = v_user and role = 'pm') then
    select count(*) into v_pm_count from public.project_members where project_id = p_project and role = 'pm';
    if v_pm_count <= 1 then raise exception 'last_pm' using errcode = 'P0001'; end if;
  end if;

  insert into public.project_members (project_id, user_id, role, created_by)
  values (p_project, v_user, p_role, auth.uid())
  on conflict (project_id, user_id) do update set role = excluded.role;
end;
$$;

create or replace function public.remove_project_member(p_project uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_pm_count int;
begin
  if not (public.is_superadmin() or public.has_project_access(p_project, array['pm'])) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if exists (select 1 from public.project_members where project_id = p_project and user_id = p_user and role = 'pm') then
    select count(*) into v_pm_count from public.project_members where project_id = p_project and role = 'pm';
    if v_pm_count <= 1 then raise exception 'last_pm' using errcode = 'P0001'; end if;
  end if;
  delete from public.project_members where project_id = p_project and user_id = p_user;
end;
$$;

revoke execute on function public.set_project_member(uuid, text, text) from public, anon;
revoke execute on function public.remove_project_member(uuid, uuid) from public, anon;
grant execute on function public.set_project_member(uuid, text, text) to authenticated;
grant execute on function public.remove_project_member(uuid, uuid) to authenticated;

-- ============================== backfill (backward compatibility) ==============================

-- Every existing project's creator becomes its PM.
insert into public.project_members (project_id, user_id, role, created_by)
select id, created_by, 'pm', created_by from public.projects where created_by is not null
on conflict (project_id, user_id) do nothing;

-- Seed the org owner as superadmin so nothing breaks for them.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_superadmin": true}'::jsonb
where lower(email) = 'achrefarabi414@gmail.com';
