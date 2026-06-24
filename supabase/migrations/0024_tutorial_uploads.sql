-- progixHub — tutorial file uploads (spec 019). Adds an upload source alongside embed links. The
-- file lives in a PRIVATE bucket; members watch via a short-lived signed URL, only admins write.
-- Existing rows default to 'embed' (with their embed_url) so they stay valid.

alter table public.tutorials
  add column if not exists source_type text not null default 'embed'
    check (source_type in ('embed', 'upload')),
  add column if not exists storage_path text;

alter table public.tutorials alter column embed_url drop not null;

alter table public.tutorials drop constraint if exists tutorials_source_chk;
alter table public.tutorials add constraint tutorials_source_chk check (
  (source_type = 'embed' and embed_url is not null)
  or (source_type = 'upload' and storage_path is not null)
);

-- Private bucket: 200 MB cap + video MIME whitelist (defense in depth, mirrors project-documents).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutorial-videos', 'tutorial-videos', false, 209715200,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members read tutorial-videos" on storage.objects;
create policy "members read tutorial-videos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tutorial-videos'
    and (auth.jwt() -> 'app_metadata' ->> 'is_member')::boolean is true
  );

drop policy if exists "admins insert tutorial-videos" on storage.objects;
create policy "admins insert tutorial-videos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tutorial-videos' and (public.is_superadmin() or public.is_global_pm())
  );

drop policy if exists "admins update tutorial-videos" on storage.objects;
create policy "admins update tutorial-videos" on storage.objects
  for update to authenticated
  using (bucket_id = 'tutorial-videos' and (public.is_superadmin() or public.is_global_pm()));

drop policy if exists "admins delete tutorial-videos" on storage.objects;
create policy "admins delete tutorial-videos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tutorial-videos' and (public.is_superadmin() or public.is_global_pm()));
