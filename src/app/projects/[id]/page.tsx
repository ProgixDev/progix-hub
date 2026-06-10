import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import {
  DocumentsSection,
  listArchivedProjectDocuments,
  listProjectDocuments,
} from "@/features/documents";
import { EnvVarsSection, listEnvVarAudit, listProjectEnvVars } from "@/features/env-vars";
import { getProjectMembers, PeoplePanel } from "@/features/people";
import { ProjectDetail, getProject, listProjects, type Project } from "@/features/projects";
import { getCurrentUser, getProjectRole } from "@/lib/auth/session";
import { capabilities } from "@/lib/auth/roles";

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
  const role = await getProjectRole(id);
  const can = capabilities(role);
  const [user, project, projects, envVars, audit, documents, archivedDocs, members, t] =
    await Promise.all([
      getCurrentUser(),
      getProject(id),
      listProjects(),
      can.seeEnvVars ? listProjectEnvVars(id) : Promise.resolve([]),
      can.seeEnvVars ? listEnvVarAudit(id) : Promise.resolve([]),
      listProjectDocuments(id),
      listArchivedProjectDocuments(id),
      can.managePeople ? getProjectMembers(id) : Promise.resolve([]),
      getTranslations("portal"),
    ]);

  if (!project) notFound();

  return (
    <AppShell
      title={project.name}
      recent={toRecent(projects)}
      userSlot={user && <UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <ProjectDetail project={project} canManage={can.manageProject} />
      <div className="mx-auto w-full max-w-5xl px-4 pb-2 sm:px-6">
        <Link
          href={`/projects/${id}/portal`}
          className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors"
        >
          {t("openPortal")} →
        </Link>
      </div>
      {can.managePeople && <PeoplePanel projectId={id} members={members} />}
      {can.seeEnvVars && (
        <EnvVarsSection
          projectId={id}
          envVars={envVars}
          audit={audit}
          canWrite={can.writeEnvVars}
        />
      )}
      <DocumentsSection
        projectId={id}
        documents={documents}
        archived={archivedDocs}
        canWrite={can.writeContent}
      />
    </AppShell>
  );
}
