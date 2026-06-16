-- progixHub — superadmins above per-project roles (spec 010). Applied to project ldxiildqpnykqhzqlhsw.
--
-- Decision (spec 010): accounts are superadmin-created (no public sign-up). A superadmin is above
-- per-project roles — never auto-PM'd on a project they create, removed from existing rosters, and
-- not addable to a roster. The sign-in membership gate (app_metadata.is_member) is unchanged; this
-- migration only adjusts who lands in project_members. All 0006 guards are preserved.

-- ============================== creator → PM trigger: skip superadmins ==============================

create or replace function public.projects_owner_pm()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- A superadmin creating a project is NOT seated as its PM (they're above per-project roles).
  -- is_superadmin() reads the current user's JWT, which is the creator at insert time.
  -- (Superadmin-owned projects may legitimately have zero PMs — spec 008 AC-7.)
  if new.created_by is not null and not public.is_superadmin() then
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
revoke execute on function public.projects_owner_pm() from public, anon, authenticated;

-- ============================== remove superadmins from existing rosters ==============================

delete from public.project_members m
using auth.users u
where m.user_id = u.id
  and (u.raw_app_meta_data->>'is_superadmin')::boolean is true;

-- ============================== set_project_member: reject superadmin targets ==============================
-- Identical to 0006 (authz gate, role check, no_account, last-PM guard) plus: a superadmin target
-- can't be added to a roster — they already see every project.

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
  -- Superadmins are above per-project roles and can't be added to a roster (spec 010).
  if v_target_superadmin then raise exception 'is_superadmin' using errcode = '22023'; end if;

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
revoke execute on function public.set_project_member(uuid, text, text) from public, anon;
grant execute on function public.set_project_member(uuid, text, text) to authenticated;
