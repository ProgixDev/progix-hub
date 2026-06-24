-- progixHub — a platform can attach MULTIPLE labeled tutorials (spec 020 revised). Replaces the
-- single platforms.tutorial_id with a join table (label = purpose, e.g. "Create account"/"Invite us").
-- Deleting a tutorial cascades the links away (AC-4). The client setup page shows each attached
-- embed + client-visible tutorial under its label.

alter table public.platforms drop column if exists tutorial_id;

create table if not exists public.platform_tutorials (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  tutorial_id uuid not null references public.tutorials(id) on delete cascade,
  label text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists platform_tutorials_platform on public.platform_tutorials(platform_id, position);

alter table public.platform_tutorials enable row level security;

drop policy if exists "members read platform_tutorials" on public.platform_tutorials;
create policy "members read platform_tutorials" on public.platform_tutorials
  for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false));

drop policy if exists "admins write platform_tutorials" on public.platform_tutorials;
create policy "admins write platform_tutorials" on public.platform_tutorials
  for all to authenticated
  using (public.is_superadmin() or public.is_global_pm())
  with check (public.is_superadmin() or public.is_global_pm());

-- setup_public_view: per step, return a labeled array of the platform's client-visible embed videos.
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
          'videos', coalesce((
            select jsonb_agg(jsonb_build_object('label', pt.label, 'embed_url', t.embed_url) order by pt.position)
            from public.platform_tutorials pt
            join public.tutorials t on t.id = pt.tutorial_id
            where pt.platform_id = p.id and t.visible_to_clients and t.source_type = 'embed'),
            '[]'::jsonb)
        )) order by s.position)
      from public.setup_steps s join public.platforms p on p.id = s.platform_id
      where s.project_id = v_project), '[]'::jsonb));
end; $$;
revoke all on function public.setup_public_view(text, text) from public;
grant execute on function public.setup_public_view(text, text) to anon, authenticated;
