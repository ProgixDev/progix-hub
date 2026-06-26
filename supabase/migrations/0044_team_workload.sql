-- Team workload (spec 037): open (not-done) task count per assignee. SECURITY INVOKER so plan_items
-- RLS applies — the caller only counts tasks on projects they can access.
create or replace function public.team_workload()
returns table (user_id uuid, open_tasks bigint)
language sql stable set search_path = '' as $$
  select pi.assignee, count(*)
  from public.plan_items pi
  where pi.type = 'task' and pi.status <> 'done' and pi.assignee is not null
  group by pi.assignee;
$$;
revoke all on function public.team_workload() from public, anon;
grant execute on function public.team_workload() to authenticated;
