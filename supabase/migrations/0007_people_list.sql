-- progixHub — People roster RPC (spec 008). Applied to project ldxiildqpnykqhzqlhsw.
-- Any member of the project may read its roster; the function resolves user_id -> email/name
-- from auth.users (the RLS client can't) after an access check.
create or replace function public.list_project_members(p_project uuid)
returns table (user_id uuid, email text, display_name text, role text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id,
         u.email::text,
         coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email::text),
         m.role,
         m.created_at
  from public.project_members m
  join auth.users u on u.id = m.user_id
  where m.project_id = p_project
    and public.has_project_access(p_project, array['pm','developer','video_editor','viewer'])
  order by
    case m.role when 'pm' then 0 when 'developer' then 1 when 'video_editor' then 2 else 3 end,
    u.email;
$$;
revoke execute on function public.list_project_members(uuid) from public, anon;
grant execute on function public.list_project_members(uuid) to authenticated;
