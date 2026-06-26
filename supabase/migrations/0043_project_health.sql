-- Cross-project health board (spec 036): one row of aggregates per project. SECURITY INVOKER
-- (not definer) so every table read is RLS-gated to the caller — they see only their projects and
-- counts within them. Leads/superadmins/global-PMs see all via their existing project RLS.
create or replace function public.project_health()
returns table (
  id uuid, name text, status text,
  task_total bigint, task_done bigint,
  specs bigint, reports bigint, last_report timestamptz,
  has_setup boolean, has_portal boolean, members bigint
) language sql stable set search_path = '' as $$
  select
    p.id, p.name, p.status,
    (select count(*) from public.plan_items pi where pi.project_id = p.id and pi.type = 'task'),
    (select count(*) from public.plan_items pi where pi.project_id = p.id and pi.type = 'task' and pi.status = 'done'),
    (select count(*) from public.project_specs s where s.project_id = p.id),
    (select count(*) from public.project_reports r where r.project_id = p.id),
    (select max(r.created_at) from public.project_reports r where r.project_id = p.id),
    exists (select 1 from public.project_setups ps where ps.project_id = p.id),
    exists (select 1 from public.portal_share_links l where l.project_id = p.id and l.revoked_at is null),
    (select count(*) from public.project_members m where m.project_id = p.id)
  from public.projects p
  order by p.created_at desc;
$$;
revoke all on function public.project_health() from public, anon;
grant execute on function public.project_health() to authenticated;
