-- progixHub — mirror the is_global_pm branch (0017) in the explicit-user access fn so global PMs
-- can plan via the MCP exactly as they can in the web UI (was fail-closed: denied via MCP). Read
-- the flag from the target user's app_metadata, since the MCP caller has no JWT (spec 023, appsec).
create or replace function public.has_project_access_for(p_user uuid, p_project uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select
    coalesce(
      (select (u.raw_app_meta_data ->> 'is_superadmin')::boolean from auth.users u where u.id = p_user),
      false
    )
    or (
      coalesce(
        (select (u.raw_app_meta_data ->> 'is_global_pm')::boolean from auth.users u where u.id = p_user),
        false
      )
      and 'pm' = any (p_roles)
    )
    or exists (
      select 1 from public.project_members m
      where m.project_id = p_project and m.user_id = p_user and m.role = any (p_roles)
    );
$$;
