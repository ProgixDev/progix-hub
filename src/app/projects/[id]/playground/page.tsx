import { notFound, redirect } from "next/navigation";
import { getProject } from "@/features/projects";
import {
  listAssignees,
  listPlanItems,
  listPlanLinks,
  listSpecs,
  listStrokes,
  Playground,
} from "@/features/playground";
import { getCurrentUser, getProjectRole } from "@/lib/auth/session";

/** Full-screen, per-project planning playground (spec 022). Team-only; no AppShell chrome. */
export default async function PlaygroundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const role = await getProjectRole(id);
  if (!role) notFound();

  const [project, items, links, strokes, specs, assignees] = await Promise.all([
    getProject(id),
    listPlanItems(id),
    listPlanLinks(id),
    listStrokes(id),
    listSpecs(id),
    listAssignees(id),
  ]);
  if (!project) notFound();

  return (
    <Playground
      projectId={id}
      projectName={project.name}
      backHref={`/projects/${id}`}
      items={items}
      links={links}
      strokes={strokes}
      specs={specs}
      assignees={assignees}
      me={{
        id: user.id,
        name: user.name ?? user.email ?? "Member",
        initials: user.initials ?? "?",
      }}
    />
  );
}
