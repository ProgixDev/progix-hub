-- progixHub — close the projects-read carve-out (spec 008 review, AppSec P1).
-- 0006 left a `created_by = auth.uid()` disjunct on the projects SELECT policy so a
-- creator could read back their freshly-inserted row (the PM membership is created by an
-- AFTER trigger that runs after the insert's RETURNING clause). But created_by is immutable,
-- so that disjunct permanently leaks a project's metadata to a *removed* creator —
-- contradicting AC-2 ("a non-member sees nothing of the project").
--
-- Fix: create projects through a SECURITY DEFINER RPC that inserts the project AND lets the
-- trigger seat the PM membership atomically, then RETURNS the row to the caller (a function
-- result is not re-filtered by the caller's RLS). The read-back no longer needs the carve-out,
-- so the SELECT policy narrows to has_project_access only.

-- ============================== create_project RPC ==============================

create or replace function public.create_project(
  p_name text,
  p_status text default 'active',
  p_description text default null,
  p_notion_url text default null,
  p_slack_url text default null,
  p_github_url text default null,
  p_live_url text default null
) returns public.projects
language plpgsql security definer set search_path = '' as $$
declare v_project public.projects;
begin
  -- Same gate the old INSERT policy enforced: only org members (or a superadmin) may create.
  if not (public.is_superadmin()
          or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean, false)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into public.projects (name, status, description, notion_url, slack_url, github_url, live_url, created_by)
  values (
    p_name,
    coalesce(nullif(p_status, ''), 'active'),
    nullif(p_description, ''),
    nullif(p_notion_url, ''),
    nullif(p_slack_url, ''),
    nullif(p_github_url, ''),
    nullif(p_live_url, ''),
    auth.uid()
  )
  returning * into v_project;
  -- The AFTER INSERT trigger (projects_owner_pm) has now seated the creator as PM.
  return v_project;
end;
$$;

revoke execute on function public.create_project(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_project(text, text, text, text, text, text, text) to authenticated;

-- ============================== narrow projects SELECT ==============================
-- Drop the created_by carve-out: access is now solely membership-based (a removed creator
-- has no project_members row, so they can no longer read the project — AC-2).

drop policy if exists "members read projects" on public.projects;
create policy "members read projects" on public.projects
  for select to authenticated
  using (public.has_project_access(id, array['pm', 'developer', 'video_editor', 'viewer']));
