-- progixHub — the org-wide "global PM" role (spec 014). Like "lead" (org-wide read) but one rung
-- up: PM-level access to every project, current and future, with no per-project roster row. Carried
-- in app_metadata.is_global_pm (set by a superadmin). Ranks: superadmin > global_pm > lead.

create or replace function public.is_global_pm()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_global_pm')::boolean, false);
$$;
revoke execute on function public.is_global_pm() from public, anon;
grant execute on function public.is_global_pm() to authenticated;

-- A global PM satisfies any check that accepts the 'pm' role, on every project. Superadmin-only
-- abilities check is_superadmin() directly and are unaffected (no privilege bleed — spec 014 AC-5).
create or replace function public.has_project_access(p_project uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_superadmin()
    or (public.is_global_pm() and 'pm' = any(p_roles))
    or exists (
      select 1 from public.project_members m
      where m.project_id = p_project and m.user_id = auth.uid() and m.role = any(p_roles));
$$;

-- Resolved role: superadmin > global_pm > explicit membership > lead. A global PM is never reduced
-- below 'pm' by this (explicit lower roles are elevated, never the reverse).
create or replace function public.my_project_role(p_project uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when public.is_superadmin() then 'superadmin'
    when public.is_global_pm() then 'pm'
    when exists (select 1 from public.project_members where project_id = p_project and user_id = auth.uid())
      then (select role from public.project_members where project_id = p_project and user_id = auth.uid())
    when public.is_lead() then 'lead'
    else null
  end;
$$;

-- list_org_members gains is_global_pm (return type changes ⇒ drop + recreate).
drop function if exists public.list_org_members();
create function public.list_org_members()
returns table (
  user_id uuid,
  email text,
  display_name text,
  github_login text,
  is_superadmin boolean,
  is_lead boolean,
  is_global_pm boolean,
  created_at timestamptz
) language sql stable security definer set search_path = '' as $$
  select u.id,
         u.email::text,
         coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email::text),
         coalesce(u.raw_user_meta_data->>'user_name', u.raw_user_meta_data->>'preferred_username'),
         coalesce((u.raw_app_meta_data->>'is_superadmin')::boolean, false),
         coalesce((u.raw_app_meta_data->>'is_lead')::boolean, false),
         coalesce((u.raw_app_meta_data->>'is_global_pm')::boolean, false),
         u.created_at
  from auth.users u
  where coalesce((u.raw_app_meta_data->>'is_member')::boolean, false) is true
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is true
  order by
    coalesce((u.raw_app_meta_data->>'is_superadmin')::boolean, false) desc,
    coalesce((u.raw_app_meta_data->>'is_global_pm')::boolean, false) desc,
    coalesce((u.raw_app_meta_data->>'is_lead')::boolean, false) desc,
    u.email;
$$;
revoke execute on function public.list_org_members() from public, anon;
grant execute on function public.list_org_members() to authenticated;
