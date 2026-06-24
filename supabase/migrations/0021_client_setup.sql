-- progixHub — client onboarding "Setup" page (spec 017). A per-project, link+passcode-gated client
-- surface composed from the platform registry (015). Mirrors the portal (006): the raw token lives
-- only in the URL (sha256-hashed at rest); the passcode is bcrypt-hashed. The client reaches data
-- ONLY through anon SECURITY DEFINER RPCs that re-verify token+passcode and return whitelisted,
-- non-sensitive JSON. The tables have NO anon RLS policy, so direct PostgREST reads are denied.

create table if not exists public.project_setups (
  project_id uuid primary key references public.projects(id) on delete cascade,
  token_hash text not null unique,
  passcode_hash text not null,
  enabled boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setup_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  position int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'client_done', 'verified')),
  created_at timestamptz not null default now()
);
create index if not exists setup_steps_project on public.setup_steps(project_id, position);

alter table public.project_setups enable row level security;
alter table public.setup_steps enable row level security;

-- Team (authenticated): only a project's PM / global PM / superadmin may read or write. No anon policy.
drop policy if exists "pm manage setup" on public.project_setups;
create policy "pm manage setup" on public.project_setups
  for all to authenticated
  using (public.has_project_access(project_id, array['pm']))
  with check (public.has_project_access(project_id, array['pm']));

drop policy if exists "pm manage setup steps" on public.setup_steps;
create policy "pm manage setup steps" on public.setup_steps
  for all to authenticated
  using (public.has_project_access(project_id, array['pm']))
  with check (public.has_project_access(project_id, array['pm']));

-- ============================== manager RPCs (hash on write) ==============================

-- Build/rebuild the setup page: hash the raw token+passcode, (re)seed steps from the platform list.
create or replace function public.create_project_setup(
  p_project uuid, p_token text, p_passcode text, p_platform_ids uuid[]
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_project_access(p_project, array['pm']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  insert into public.project_setups (project_id, token_hash, passcode_hash, created_by)
  values (p_project,
          encode(extensions.digest(p_token, 'sha256'), 'hex'),
          extensions.crypt(p_passcode, extensions.gen_salt('bf')),
          auth.uid())
  on conflict (project_id) do update
    set token_hash = excluded.token_hash, passcode_hash = excluded.passcode_hash,
        enabled = true, updated_at = now();
  delete from public.setup_steps where project_id = p_project;
  insert into public.setup_steps (project_id, platform_id, position)
  select p_project, pid, ord - 1
  from unnest(p_platform_ids) with ordinality as t(pid, ord);
end; $$;
revoke execute on function public.create_project_setup(uuid, text, text, uuid[]) from public, anon;
grant execute on function public.create_project_setup(uuid, text, text, uuid[]) to authenticated;

-- Rotate the link + passcode (kills the old link); steps unchanged.
create or replace function public.rotate_project_setup(p_project uuid, p_token text, p_passcode text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_project_access(p_project, array['pm']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.project_setups
    set token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex'),
        passcode_hash = extensions.crypt(p_passcode, extensions.gen_salt('bf')),
        enabled = true, updated_at = now()
  where project_id = p_project;
end; $$;
revoke execute on function public.rotate_project_setup(uuid, text, text) from public, anon;
grant execute on function public.rotate_project_setup(uuid, text, text) to authenticated;

-- ============================== anon client RPCs (verify on read/write) ==============================

-- Token (+enabled) → project id, internal only.
create or replace function public.setup_project_for_token(p_token text)
returns uuid language sql stable security definer set search_path = '' as $$
  select project_id from public.project_setups
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and enabled limit 1;
$$;
revoke execute on function public.setup_project_for_token(text) from public, anon, authenticated;

-- The client's whole read surface: whitelisted JSON, only when token+passcode verify. Never returns
-- hashes or any sensitive field. Tutorial video is matched server-side on visible_to_clients (016).
create or replace function public.setup_public_view(p_token text, p_passcode text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_project uuid; v_ok boolean;
begin
  v_project := public.setup_project_for_token(p_token);
  if v_project is null then return null; end if;
  select (passcode_hash = extensions.crypt(p_passcode, passcode_hash)) into v_ok
    from public.project_setups where project_id = v_project;
  if not coalesce(v_ok, false) then return null; end if;
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

-- Client marks one of its own steps done / not-done (re-verifies token+passcode; can't reach 'verified').
create or replace function public.setup_mark_step(
  p_token text, p_passcode text, p_step_id uuid, p_done boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare v_project uuid; v_ok boolean;
begin
  v_project := public.setup_project_for_token(p_token);
  if v_project is null then raise exception 'invalid' using errcode = '42501'; end if;
  select (passcode_hash = extensions.crypt(p_passcode, passcode_hash)) into v_ok
    from public.project_setups where project_id = v_project;
  if not coalesce(v_ok, false) then raise exception 'invalid' using errcode = '42501'; end if;
  update public.setup_steps
    set status = case when p_done then 'client_done' else 'pending' end
  where id = p_step_id and project_id = v_project and status <> 'verified';
end; $$;
revoke all on function public.setup_mark_step(text, text, uuid, boolean) from public;
grant execute on function public.setup_mark_step(text, text, uuid, boolean) to anon, authenticated;
