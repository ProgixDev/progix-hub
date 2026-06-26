-- Global search (spec 041): one RLS-scoped query across the surfaces a member can reach. SECURITY
-- INVOKER so every table read is gated to the caller — they only ever match their own projects'
-- rows (and org-wide tutorials). Members are searched separately via list_org_members.
create or replace function public.global_search(q text)
returns table (kind text, id uuid, title text, subtitle text, project_id uuid)
language sql stable set search_path = '' as $$
  with n as (
    select '%' || replace(replace(replace(trim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as p
  )
  (select 'project'::text, p.id, p.name, p.status::text, p.id
     from public.projects p, n where p.name ilike n.p escape '\' order by p.name limit 6)
  union all
  (select 'document'::text, d.id, d.title, pr.name, d.project_id
     from public.documents d join public.projects pr on pr.id = d.project_id, n
     where d.title ilike n.p escape '\' limit 6)
  union all
  (select 'spec'::text, s.id, s.title, pr.name, s.project_id
     from public.project_specs s join public.projects pr on pr.id = s.project_id, n
     where s.title ilike n.p escape '\' limit 6)
  union all
  (select 'task'::text, t.id, t.title, pr.name, t.project_id
     from public.plan_items t join public.projects pr on pr.id = t.project_id, n
     where t.type = 'task' and t.title ilike n.p escape '\' limit 6)
  union all
  (select 'tutorial'::text, tu.id, tu.title, null::text, null::uuid
     from public.tutorials tu, n where tu.title ilike n.p escape '\' limit 6);
$$;
revoke all on function public.global_search(text) from public, anon;
grant execute on function public.global_search(text) to authenticated;
