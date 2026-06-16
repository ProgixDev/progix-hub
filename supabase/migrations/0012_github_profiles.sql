-- progixHub — org-wide member visibility for GitHub profiles (spec 012).
-- Spec 011 gated the members directory to superadmins, leads, and PMs. Spec 012 makes the org
-- transparent: any signed-in member can see every member and their GitHub activity. This only
-- relaxes WHO may read the directory — promoting a member to lead stays superadmin-only
-- (set_member_lead, unchanged). github_login is still resolved from the member's GitHub identity
-- metadata (captured at GitHub sign-in or when they Connect GitHub).

-- Re-create list_org_members with the visibility gate widened to any org member. Columns,
-- ordering, and the github_login resolution are unchanged from 0011.
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
    -- spec 012: visible to any signed-in member (was superadmin/lead/PM in 0011).
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false) is true
  order by
    coalesce((u.raw_app_meta_data->>'is_superadmin')::boolean, false) desc,
    coalesce((u.raw_app_meta_data->>'is_lead')::boolean, false) desc,
    u.email;
$$;
revoke execute on function public.list_org_members() from public, anon;
grant execute on function public.list_org_members() to authenticated;
