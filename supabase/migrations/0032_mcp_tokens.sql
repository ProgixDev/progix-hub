-- progixHub — personal access tokens for the playground MCP (spec 023). A token maps to a user;
-- the MCP server resolves it and acts AS that user, gated by has_project_access_for. Hashed at rest.

create table if not exists public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique, -- sha256 of the raw token; raw is shown once
  label text not null default 'MCP token',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists mcp_tokens_user on public.mcp_tokens(user_id);

alter table public.mcp_tokens enable row level security;

drop policy if exists "own mcp_tokens" on public.mcp_tokens;
create policy "own mcp_tokens" on public.mcp_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Project access for an EXPLICIT user (the MCP resolves a user from a token, not auth.uid()).
-- Mirrors has_project_access; service_role only (the MCP route uses the service client).
create or replace function public.has_project_access_for(p_user uuid, p_project uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select
    coalesce(
      (select (u.raw_app_meta_data ->> 'is_superadmin')::boolean from auth.users u where u.id = p_user),
      false
    )
    or exists (
      select 1 from public.project_members m
      where m.project_id = p_project and m.user_id = p_user and m.role = any (p_roles)
    );
$$;
revoke execute on function public.has_project_access_for(uuid, uuid, text[]) from public, anon, authenticated;
grant execute on function public.has_project_access_for(uuid, uuid, text[]) to service_role;
