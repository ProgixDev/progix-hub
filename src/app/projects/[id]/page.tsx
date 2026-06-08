import { notFound } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { ProjectDetail, getProject, listProjects, type Project } from "@/features/projects";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, project, projects] = await Promise.all([
    getCurrentUser(),
    getProject(id),
    listProjects(),
  ]);

  if (!project) notFound();

  return (
    <AppShell
      title={project.name}
      recent={toRecent(projects)}
      userSlot={user && <UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <ProjectDetail project={project} />
    </AppShell>
  );
}
