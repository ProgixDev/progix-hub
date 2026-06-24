-- progixHub — defense-in-depth for spec 017 (appsec P2): throttle passcode guesses on the client
-- setup link, matching the portal's posture. Discovery already needs an unguessable 256-bit token
-- and each guess pays a bcrypt cost; this adds a per-link lockout after repeated failures so the
-- anon RPC can't be hammered. setup_public_view becomes volatile to record attempts.

alter table public.project_setups
  add column if not exists failed_attempts int not null default 0,
  add column if not exists locked_until timestamptz;

create or replace function public.setup_public_view(p_token text, p_passcode text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_project uuid; v_ok boolean; v_locked timestamptz;
begin
  v_project := public.setup_project_for_token(p_token);
  if v_project is null then return null; end if;

  select locked_until into v_locked from public.project_setups where project_id = v_project;
  if v_locked is not null and v_locked > now() then return null; end if;

  select (passcode_hash = extensions.crypt(p_passcode, passcode_hash)) into v_ok
    from public.project_setups where project_id = v_project;
  if not coalesce(v_ok, false) then
    update public.project_setups
      set failed_attempts = failed_attempts + 1,
          locked_until = case when failed_attempts + 1 >= 10 then now() + interval '5 minutes' else locked_until end
      where project_id = v_project;
    return null;
  end if;

  update public.project_setups set failed_attempts = 0, locked_until = null where project_id = v_project;
  return jsonb_build_object(
    'project_name', (select name from public.projects where id = v_project),
    'steps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'position', s.position, 'status', s.status,
        'platform', jsonb_build_object(
          'name', p.name, 'access_pattern', p.access_pattern, 'critical', p.critical,
          'steps', p.steps, 'invite_url', p.invite_url, 'invite_role', p.invite_role,
          'invite_email', p.invite_email, 'key_label', p.key_label,
          'video_embed_url', (
            select t.embed_url from public.tutorials t
            where t.visible_to_clients and t.platform_service_id is not null
              and t.platform_service_id = p.service_id
            order by t.created_at desc limit 1)
        )) order by s.position)
      from public.setup_steps s join public.platforms p on p.id = s.platform_id
      where s.project_id = v_project), '[]'::jsonb));
end; $$;
revoke all on function public.setup_public_view(text, text) from public;
grant execute on function public.setup_public_view(text, text) to anon, authenticated;
