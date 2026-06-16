import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { PortalSection, getPortal } from "@/features/portal";
import { canViewOrgMembers } from "@/features/members";
import { getProject, listProjects, type Project } from "@/features/projects";
import { capabilities } from "@/lib/auth/roles";
import { getCurrentUser, getProjectRole } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

export default async function ProjectPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getProjectRole(id);
  const [user, project, projects, portal, t] = await Promise.all([
    getCurrentUser(),
    getProject(id),
    listProjects(),
    getPortal(id),
    getTranslations("portal"),
  ]);
  if (!project) notFound();
  const showMembers = await canViewOrgMembers();
  const canWrite = capabilities(role).writeContent;

  return (
    <AppShell
      title={`${project.name} · ${t("title")}`}
      recent={toRecent(projects)}
      showMembers={showMembers}
      userSlot={user && <UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <div className="mx-auto w-full max-w-5xl px-6 pt-6">
        <Link
          href={`/projects/${id}`}
          className="text-text-2 hover:text-text text-[12.5px] transition-colors"
        >
          ← {t("backToProject")}
        </Link>
      </div>
      <PortalSection projectId={id} portal={portal} canWrite={canWrite} />
    </AppShell>
  );
}
