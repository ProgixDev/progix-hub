-- progixHub — hard-delete projects (projects-delete feature).
-- Spec 008 only allowed archiving (no DELETE policy existed, so RLS blocked every delete). This
-- adds a PM-gated DELETE policy so a project's PM (and superadmins, via has_project_access) can
-- permanently remove a project. All child rows (env_vars, documents, portal_*, project_members)
-- are ON DELETE CASCADE, so the delete is self-contained at the DB layer. (Storage blobs for
-- documents are not removed by the cascade — they age out via the Storage API, as today.)

drop policy if exists "pm deletes projects" on public.projects;
create policy "pm deletes projects" on public.projects
  for delete to authenticated
  using (public.has_project_access(id, array['pm']));
