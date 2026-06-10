-- progixHub — documents per project (spec 004). Applied to project ldxiildqpnykqhzqlhsw.
-- One row per item with a `kind`; deny-by-default RLS keyed on app_metadata.is_member (mirrors 002).
-- No DELETE policy → archive-only (archived_at). Files live in a PRIVATE Storage bucket; downloads
-- go through member-only signed URLs.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('file', 'link', 'note')),
  title text not null check (char_length(title) between 1 and 300),
  file_path text, -- storage object path (kind = file)
  file_size bigint, -- bytes (kind = file)
  file_mime text, -- MIME type (kind = file)
  url text, -- external URL (kind = link)
  body text, -- Markdown (kind = note)
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_project_idx on public.documents (project_id, created_at desc);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists "members read documents" on public.documents;
create policy "members read documents" on public.documents
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true);

drop policy if exists "members insert documents" on public.documents;
create policy "members insert documents" on public.documents
  for insert to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true and created_by = auth.uid()
  );

drop policy if exists "members update documents" on public.documents;
create policy "members update documents" on public.documents
  for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true)
  with check ((auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true);

-- ============================== Storage ==============================
-- Private bucket; the bucket itself enforces the 50 MB limit + MIME whitelist (defense in depth).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents', 'project-documents', false, 52428800,
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

drop policy if exists "members read project-documents" on storage.objects;
create policy "members read project-documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-documents' and (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true
  );

drop policy if exists "members insert project-documents" on storage.objects;
create policy "members insert project-documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-documents' and (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true
  );

drop policy if exists "members update project-documents" on storage.objects;
create policy "members update project-documents" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'project-documents' and (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true
  );

drop policy if exists "members delete project-documents" on storage.objects;
create policy "members delete project-documents" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-documents' and (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true
  );
