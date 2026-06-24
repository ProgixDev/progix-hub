-- progixHub — link a platform to a tutorial from the library instead of a free-text URL (spec 020).
-- platforms.video_url (unused by any read path) is dropped in favor of a tutorial_id FK. The client
-- setup page now resolves the platform's CHOSEN tutorial (embed + client-visible only).

alter table public.platforms drop constraint if exists platforms_video_url_http;
alter table public.platforms drop column if exists video_url;
alter table public.platforms
  add column if not exists tutorial_id uuid references public.tutorials(id) on delete set null;

-- setup_public_view: resolve the per-step video from the platform's chosen tutorial (was a by-name
-- match). Embed + visible_to_clients only — uploads/internal tutorials never reach the anon client.
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
            where t.id = p.tutorial_id and t.visible_to_clients and t.source_type = 'embed')
        )) order by s.position)
      from public.setup_steps s join public.platforms p on p.id = s.platform_id
      where s.project_id = v_project), '[]'::jsonb));
end; $$;
revoke all on function public.setup_public_view(text, text) from public;
grant execute on function public.setup_public_view(text, text) to anon, authenticated;
