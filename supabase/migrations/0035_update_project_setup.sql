-- Let a PM edit which platforms are on an existing client setup page (spec 017 follow-up) WITHOUT
-- rotating the link or losing client progress: reconcile setup_steps to the new platform list —
-- platforms that stay keep their status, removed ones are dropped, new ones start pending.
create unique index if not exists setup_steps_project_platform
  on public.setup_steps (project_id, platform_id);

create or replace function public.update_project_setup(p_project uuid, p_platform_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_project_access(p_project, array['pm']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  -- never wipe the whole checklist: a setup always keeps at least one platform
  if array_length(p_platform_ids, 1) is null then
    raise exception 'no platforms' using errcode = '22023';
  end if;
  if not exists (select 1 from public.project_setups where project_id = p_project) then
    raise exception 'setup not found' using errcode = 'P0002';
  end if;
  -- drop steps for de-selected platforms
  delete from public.setup_steps
    where project_id = p_project and not (platform_id = any (p_platform_ids));
  -- add newly selected platforms (pending) and reorder all to the new order; existing keep status
  insert into public.setup_steps (project_id, platform_id, position)
  select p_project, pid, ord - 1
  from unnest(p_platform_ids) with ordinality as t(pid, ord)
  on conflict (project_id, platform_id) do update set position = excluded.position;
  update public.project_setups set updated_at = now() where project_id = p_project;
end; $$;
revoke execute on function public.update_project_setup(uuid, uuid[]) from public, anon;
grant execute on function public.update_project_setup(uuid, uuid[]) to authenticated;
