-- Read-only client roadmap for the portal (spec 029): exposes ONLY playground phase names + their
-- task progress (total/done) for the token's project. No task titles, assignees, notes, or any
-- other internal detail. Token-gated via the existing portal_project_for_token resolver.
create or replace function public.portal_roadmap(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_project uuid;
  v_result jsonb;
begin
  v_project := public.portal_project_for_token(p_token);
  if v_project is null then
    return null;
  end if;
  select coalesce(jsonb_agg(ph order by ph_pos, ph_name), '[]'::jsonb) into v_result from (
    select
      jsonb_build_object(
        'id', p.id,
        'name', p.title,
        'total', (select count(*) from public.plan_items t
                  where t.parent_id = p.id and t.type = 'task'),
        'done', (select count(*) from public.plan_items t
                 where t.parent_id = p.id and t.type = 'task' and t.status = 'done')
      ) as ph,
      p.pos_x as ph_pos,
      p.title as ph_name
    from public.plan_items p
    where p.project_id = v_project and p.type = 'phase'
  ) s;
  return v_result;
end; $$;
revoke all on function public.portal_roadmap(text) from public;
grant execute on function public.portal_roadmap(text) to anon, authenticated;
