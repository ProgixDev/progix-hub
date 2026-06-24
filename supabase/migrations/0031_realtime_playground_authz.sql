-- progixHub — gate the playground Realtime channel (private channel) to project members.
-- The topic is 'playground:<projectId>'; extract the uuid and check has_project_access. Without
-- this, a public channel would leak presence/cursor metadata across project boundaries (spec 022).
alter table realtime.messages enable row level security;

drop policy if exists "playground members read realtime" on realtime.messages;
create policy "playground members read realtime" on realtime.messages
  for select to authenticated
  using (
    realtime.topic() like 'playground:%'
    and public.has_project_access(
      nullif(split_part(realtime.topic(), ':', 2), '')::uuid,
      array['pm', 'developer', 'video_editor', 'viewer']
    )
  );

drop policy if exists "playground members write realtime" on realtime.messages;
create policy "playground members write realtime" on realtime.messages
  for insert to authenticated
  with check (
    realtime.topic() like 'playground:%'
    and public.has_project_access(
      nullif(split_part(realtime.topic(), ':', 2), '')::uuid,
      array['pm', 'developer', 'video_editor', 'viewer']
    )
  );
