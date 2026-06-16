-- progixHub — org members directory, the "lead" org role, and creator-keeps-role (spec 011).
-- Applied to project ldxiildqpnykqhzqlhsw. Builds on the spec-008 role model (0006) and the
-- spec-010 superadmin rules (0010). Re-creates the creator->role trigger and set_project_member
-- so this migration is self-consistent whether or not 0010 has been applied.

-- ============================== seed org superadmins ==============================
-- The four founding accounts are org superadmins (decided with the owner). Conditional on the
-- account existing — a no-op until each user is created (same pattern as 0006).
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_superadmin": true}'::jsonb
where lower(email) in (
  'achrefarabi414@gmail.com',
  'ghorieb.ilyes@yahoo.com',
  'ilyes.ghorieb@yahoo.com',
  'contact@progix.com'
);

-- ============================== the "lead" org role ==============================
-- A lead is an org-wide reader: they can see every project (read-only) without being on its
-- roster. Set via app_metadata.is_lead by a superadmin (server action, admin client).

create or replace function public.is_lead()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_lead')::boolean, false);
$$;
revoke execute on function public.is_lead() from public, anon;
grant execute on function public.is_lead() to authenticated;

-- projects: a lead reads every project; everyone else by membership (unchanged from 0008).
drop policy if exists "members read projects" on public.projects;
create policy "members read projects" on public.projects
  for select to authenticated
  using (
    public.is_lead()
    or public.has_project_access(id, array['pm', 'developer', 'video_editor', 'viewer'])
  );

-- A lead with no explicit membership resolves to the org-wide read-only 'lead' role.
create or replace function public.my_project_role(p_project uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when public.is_superadmin() then 'superadmin'
    when exists (select 1 from public.project_members where project_id = p_project and user_id = auth.uid())
      then (select role from public.project_members where project_id = p_project and user_id = auth.uid())
    when public.is_lead() then 'lead'
    else null
  end;
$$;

-- ============================== creator keeps their role ==============================
-- Decided with the owner: a developer who creates a project keeps a working role on it (added as
-- 'developer', not auto-promoted to PM); a PM is assigned later (a project may start PM-less, which
-- spec 008 AC-7 already allows). Superadmins are still never seated (spec 010).

create or replace function public.projects_owner_pm()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null and not public.is_superadmin() then
    insert into public.project_members (project_id, user_id, role, created_by)
    values (new.id, new.created_by, 'developer', new.created_by)
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists projects_owner_pm on public.projects;
create trigger projects_owner_pm
  after insert on public.projects
  for each row execute function public.projects_owner_pm();
revoke execute on function public.projects_owner_pm() from public, anon, authenticated;

-- set_project_member: keep every 0006 guard, plus reject a superadmin target (spec 010).
create or replace function public.set_project_member(p_project uuid, p_email text, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
  v_pm_count int;
  v_target_superadmin boolean;
begin
  if not (public.is_superadmin() or public.has_project_access(p_project, array['pm'])) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_role not in ('pm', 'developer', 'video_editor', 'viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  select id, coalesce((raw_app_meta_data->>'is_superadmin')::boolean, false)
    into v_user, v_target_superadmin
    from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_user is null then raise exception 'no_account' using errcode = 'P0002'; end if;
  if v_target_superadmin then raise exception 'is_superadmin' using errcode = '22023'; end if;
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
revoke execute on function public.set_project_member(uuid, text, text) from public, anon;
grant execute on function public.set_project_member(uuid, text, text) to authenticated;

-- ============================== org members directory ==============================
-- Lists every org member with their org standing + GitHub login. Visible to a superadmin, a lead,
-- or any PM (they manage people). Resolves names/logins from auth.users (the RLS client can't).
create or replace function public.list_org_members()
returns table (
  user_id uuid,
  email text,
  display_name text,
  github_login text,
  is_superadmin boolean,
  is_lead boolean,
  created_at timestamptz
) language sql stable security definer set search_path = '' as $$
  select u.id,
         u.email::text,
         coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email::text),
         coalesce(u.raw_user_meta_data->>'user_name', u.raw_user_meta_data->>'preferred_username'),
         coalesce((u.raw_app_meta_data->>'is_superadmin')::boolean, false),
         coalesce((u.raw_app_meta_data->>'is_lead')::boolean, false),
         u.created_at
  from auth.users u
  where coalesce((u.raw_app_meta_data->>'is_member')::boolean, false) is true
    and (
      public.is_superadmin()
      or public.is_lead()
      or exists (select 1 from public.project_members m where m.user_id = auth.uid() and m.role = 'pm')
    )
  order by
    coalesce((u.raw_app_meta_data->>'is_superadmin')::boolean, false) desc,
    coalesce((u.raw_app_meta_data->>'is_lead')::boolean, false) desc,
    u.email;
$$;
revoke execute on function public.list_org_members() from public, anon;
grant execute on function public.list_org_members() to authenticated;
