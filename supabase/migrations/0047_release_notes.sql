-- Release notes / changelog (spec 040): per-project dated entries the team composes; published ones
-- surface on the client portal as "What's new". Members read; PMs write.
create table if not exists public.release_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version text,
  title text not null,
  body_md text not null,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists release_notes_project on public.release_notes(project_id, created_at desc);

alter table public.release_notes enable row level security;

drop policy if exists "members read release notes" on public.release_notes;
create policy "members read release notes" on public.release_notes
  for select using (
    public.has_project_access(project_id, array['pm','developer','video_editor','viewer'])
  );

drop policy if exists "pm write release notes" on public.release_notes;
create policy "pm write release notes" on public.release_notes
  for all using (public.has_project_access(project_id, array['pm']))
  with check (public.has_project_access(project_id, array['pm']));

-- Client-facing published release notes for the portal (spec 040). Token-gated, whitelisted fields
-- only (no created_by, no internal flags). Mirrors portal_roadmap.
create or replace function public.portal_release_notes(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_project uuid; v_result jsonb;
begin
  v_project := public.portal_project_for_token(p_token);
  if v_project is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'version', r.version, 'title', r.title,
    'body_md', r.body_md, 'created_at', r.created_at
  ) order by r.created_at desc), '[]'::jsonb) into v_result
  from public.release_notes r
  where r.project_id = v_project and r.published;
  return v_result;
end; $$;
revoke all on function public.portal_release_notes(text) from public;
grant execute on function public.portal_release_notes(text) to anon, authenticated;
