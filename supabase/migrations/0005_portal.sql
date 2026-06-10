-- progixHub — client portal (spec 006, ADR-0010). Applied to project ldxiildqpnykqhzqlhsw.
-- First EXTERNAL surface: an anonymous client holds an unguessable share token (stored
-- SHA-256-hashed). The anon role gets ZERO table grants — its entire surface is the four
-- SECURITY DEFINER RPCs at the bottom, each of which resolves token → one live project and
-- enforces rate limits + caps. Member side uses plain is_member RLS (no DELETE → archive).

create extension if not exists pgcrypto with schema extensions;

-- ============================== Tables ==============================

create table if not exists public.portal_share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_by_email text,
  created_at timestamptz not null default now()
);
-- One ACTIVE link per project; rotate = revoke + insert.
create unique index if not exists portal_share_links_active_idx
  on public.portal_share_links (project_id) where revoked_at is null;

create table if not exists public.portal_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  position int not null default 0,
  archived_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portal_blocks_project_idx on public.portal_blocks (project_id, position);

create table if not exists public.portal_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  -- Nullable: a client proposal may arrive unassigned; members triage it into a block.
  block_id uuid references public.portal_blocks (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'planned'
    check (status in ('delivered', 'in_progress', 'planned', 'proposed')),
  origin text not null default 'team' check (origin in ('team', 'client')),
  client_author text check (client_author is null or char_length(client_author) between 1 and 80),
  archived_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portal_cards_project_idx on public.portal_cards (project_id, created_at desc);
create index if not exists portal_cards_block_idx on public.portal_cards (block_id);

create table if not exists public.portal_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  card_id uuid not null references public.portal_cards (id) on delete cascade,
  author_kind text not null check (author_kind in ('member', 'client')),
  author_name text not null check (char_length(author_name) between 1 and 80),
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists portal_comments_card_idx on public.portal_comments (card_id, created_at);
create index if not exists portal_comments_rate_idx on public.portal_comments (project_id, created_at desc);

create table if not exists public.portal_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  card_id uuid not null references public.portal_cards (id) on delete cascade,
  file_path text not null,
  file_name text not null check (char_length(file_name) between 1 and 300),
  file_size bigint not null check (file_size between 1 and 10485760),
  file_mime text not null,
  author_kind text not null check (author_kind in ('member', 'client')),
  author_name text not null check (char_length(author_name) between 1 and 80),
  created_at timestamptz not null default now()
);
create index if not exists portal_attachments_card_idx on public.portal_attachments (card_id, created_at);
create index if not exists portal_attachments_rate_idx on public.portal_attachments (project_id, created_at desc);

drop trigger if exists portal_blocks_set_updated_at on public.portal_blocks;
create trigger portal_blocks_set_updated_at
  before update on public.portal_blocks
  for each row execute function public.set_updated_at();
drop trigger if exists portal_cards_set_updated_at on public.portal_cards;
create trigger portal_cards_set_updated_at
  before update on public.portal_cards
  for each row execute function public.set_updated_at();

-- ============================== Member RLS ==============================
-- Deny-by-default; members read/insert/update; NO DELETE anywhere (archive instead).
-- anon gets nothing here — its only door is the RPCs below.

alter table public.portal_share_links enable row level security;
alter table public.portal_blocks enable row level security;
alter table public.portal_cards enable row level security;
alter table public.portal_comments enable row level security;
alter table public.portal_attachments enable row level security;

revoke all on public.portal_share_links from anon;
revoke all on public.portal_blocks from anon;
revoke all on public.portal_cards from anon;
revoke all on public.portal_comments from anon;
revoke all on public.portal_attachments from anon;

do $$
declare t text;
begin
  foreach t in array array['portal_share_links','portal_blocks','portal_cards','portal_comments','portal_attachments'] loop
    execute format('drop policy if exists "members read %1$s" on public.%1$I', t);
    execute format($p$create policy "members read %1$s" on public.%1$I
      for select to authenticated
      using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true)$p$, t);
    execute format('drop policy if exists "members insert %1$s" on public.%1$I', t);
    execute format($p$create policy "members insert %1$s" on public.%1$I
      for insert to authenticated
      with check ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true)$p$, t);
    execute format('drop policy if exists "members update %1$s" on public.%1$I', t);
    execute format($p$create policy "members update %1$s" on public.%1$I
      for update to authenticated
      using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true)
      with check ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true)$p$, t);
  end loop;
end $$;

-- ============================== Public RPCs (the anon surface) ==============================

-- Token → live project id (or null). The raw token is hashed here; only hashes are stored.
create or replace function public.portal_project_for_token(p_token text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select project_id
  from public.portal_share_links
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and revoked_at is null
  limit 1;
$$;

-- Shared write guard: ≤ 10 client writes per minute per project, hard row caps.
create or replace function public.portal_assert_write_allowed(p_project uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent int;
begin
  select (
    (select count(*) from public.portal_comments
      where project_id = p_project and author_kind = 'client' and created_at > now() - interval '1 minute')
    + (select count(*) from public.portal_cards
      where project_id = p_project and origin = 'client' and created_at > now() - interval '1 minute')
    + (select count(*) from public.portal_attachments
      where project_id = p_project and author_kind = 'client' and created_at > now() - interval '1 minute')
  ) into recent;
  if recent >= 10 then
    raise exception 'portal_rate_limited';
  end if;
end;
$$;

-- The whole portal as one JSON tree — the client page's only read.
create or replace function public.portal_public_view(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_project uuid;
  v_name text;
  v_result jsonb;
begin
  v_project := public.portal_project_for_token(p_token);
  if v_project is null then
    return null;
  end if;
  select name into v_name from public.projects where id = v_project;

  select jsonb_build_object(
    'project_name', v_name,
    'blocks', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'position', b.position) order by b.position, b.created_at)
      from public.portal_blocks b
      where b.project_id = v_project and b.archived_at is null
    ), '[]'::jsonb),
    'cards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'block_id', c.block_id, 'title', c.title, 'description', c.description,
        'status', c.status, 'origin', c.origin, 'client_author', c.client_author,
        'created_at', c.created_at,
        'comments', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', m.id, 'author_kind', m.author_kind, 'author_name', m.author_name,
            'body', m.body, 'created_at', m.created_at) order by m.created_at)
          from public.portal_comments m where m.card_id = c.id
        ), '[]'::jsonb),
        'attachments', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', a.id, 'file_name', a.file_name, 'file_size', a.file_size,
            'file_mime', a.file_mime, 'author_name', a.author_name, 'created_at', a.created_at)
            order by a.created_at)
          from public.portal_attachments a where a.card_id = c.id
        ), '[]'::jsonb)
      ) order by c.created_at)
      from public.portal_cards c
      where c.project_id = v_project and c.archived_at is null
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.portal_public_comment(
  p_token text, p_card_id uuid, p_author text, p_body text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
begin
  v_project := public.portal_project_for_token(p_token);
  if v_project is null then
    raise exception 'portal_invalid_token';
  end if;
  if not exists (
    select 1 from public.portal_cards
    where id = p_card_id and project_id = v_project and archived_at is null
  ) then
    raise exception 'portal_unknown_card';
  end if;
  perform public.portal_assert_write_allowed(v_project);
  if (select count(*) from public.portal_comments where project_id = v_project) >= 1000 then
    raise exception 'portal_cap_reached';
  end if;
  insert into public.portal_comments (project_id, card_id, author_kind, author_name, body)
  values (v_project, p_card_id, 'client', p_author, p_body);
end;
$$;

create or replace function public.portal_public_propose(
  p_token text, p_block_id uuid, p_title text, p_description text, p_author text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
begin
  v_project := public.portal_project_for_token(p_token);
  if v_project is null then
    raise exception 'portal_invalid_token';
  end if;
  if p_block_id is not null and not exists (
    select 1 from public.portal_blocks
    where id = p_block_id and project_id = v_project and archived_at is null
  ) then
    raise exception 'portal_unknown_block';
  end if;
  perform public.portal_assert_write_allowed(v_project);
  if (select count(*) from public.portal_cards where project_id = v_project and origin = 'client') >= 100 then
    raise exception 'portal_cap_reached';
  end if;
  insert into public.portal_cards (project_id, block_id, title, description, status, origin, client_author)
  values (v_project, p_block_id, p_title, coalesce(p_description, ''), 'proposed', 'client', p_author);
end;
$$;

-- Records metadata AFTER the server action uploaded the object (admin client). The path
-- must live under this project's prefix so a forged path can't point elsewhere.
create or replace function public.portal_public_record_attachment(
  p_token text, p_card_id uuid, p_file_path text, p_file_name text,
  p_file_size bigint, p_file_mime text, p_author text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
begin
  v_project := public.portal_project_for_token(p_token);
  if v_project is null then
    raise exception 'portal_invalid_token';
  end if;
  if not exists (
    select 1 from public.portal_cards
    where id = p_card_id and project_id = v_project and archived_at is null
  ) then
    raise exception 'portal_unknown_card';
  end if;
  if position(v_project::text || '/' in p_file_path) <> 1 then
    raise exception 'portal_bad_path';
  end if;
  if p_file_mime not in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/zip', 'application/x-zip-compressed'
  ) then
    raise exception 'portal_bad_mime';
  end if;
  perform public.portal_assert_write_allowed(v_project);
  if (select count(*) from public.portal_attachments where project_id = v_project) >= 200 then
    raise exception 'portal_cap_reached';
  end if;
  insert into public.portal_attachments
    (project_id, card_id, file_path, file_name, file_size, file_mime, author_kind, author_name)
  values (v_project, p_card_id, p_file_path, p_file_name, p_file_size, p_file_mime, 'client', p_author);
end;
$$;

-- The RPCs are the ONLY thing anon may execute; the helpers are internal-only — callable
-- solely by the definer-owned public functions, by no API role at all.
revoke execute on function public.portal_project_for_token(text) from public, anon, authenticated;
revoke execute on function public.portal_assert_write_allowed(uuid) from public, anon, authenticated;
revoke all on function public.portal_public_view(text) from public;
revoke all on function public.portal_public_comment(text, uuid, text, text) from public;
revoke all on function public.portal_public_propose(text, uuid, text, text, text) from public;
revoke all on function public.portal_public_record_attachment(text, uuid, text, text, bigint, text, text) from public;
grant execute on function public.portal_public_view(text) to anon, authenticated;
grant execute on function public.portal_public_comment(text, uuid, text, text) to anon, authenticated;
grant execute on function public.portal_public_propose(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.portal_public_record_attachment(text, uuid, text, text, bigint, text, text) to anon, authenticated;

-- ============================== Storage ==============================
-- Private bucket; 10 MB cap + the documents MIME whitelist. Client uploads/downloads go
-- through the server (admin client) after token validation; members read via their own client.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portal-attachments', 'portal-attachments', false, 10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/zip', 'application/x-zip-compressed'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members read portal-attachments" on storage.objects;
create policy "members read portal-attachments" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'portal-attachments' and (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true
  );
