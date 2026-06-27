-- Milestones & deadlines (spec 043): a calendar due date on plan items (tasks/phases).
alter table public.plan_items add column if not exists due_date date;
create index if not exists plan_items_due on public.plan_items(project_id, due_date)
  where due_date is not null;

-- Extend the cross-project health board with an overdue count (not-done tasks past their due date).
drop function if exists public.project_health();
create function public.project_health()
returns table (
  id uuid, name text, status text,
  task_total bigint, task_done bigint, overdue bigint,
  specs bigint, reports bigint, last_report timestamptz,
  has_setup boolean, has_portal boolean, members bigint
) language sql stable set search_path = '' as $$
  select
    p.id, p.name, p.status,
    (select count(*) from public.plan_items pi where pi.project_id = p.id and pi.type = 'task'),
    (select count(*) from public.plan_items pi where pi.project_id = p.id and pi.type = 'task' and pi.status = 'done'),
    (select count(*) from public.plan_items pi where pi.project_id = p.id and pi.type = 'task'
       and pi.status <> 'done' and pi.due_date is not null and pi.due_date < current_date),
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
