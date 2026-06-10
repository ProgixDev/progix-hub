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
  const [user, project, projects, envVars, audit, documents, archivedDocs, t] = await Promise.all([
    getCurrentUser(),
    getProject(id),
    listProjects(),
    listProjectEnvVars(id),
    listEnvVarAudit(id),
    listProjectDocuments(id),
    listArchivedProjectDocuments(id),
    getTranslations("portal"),
  ]);

  if (!project) notFound();

  return (
    <AppShell
      title={project.name}
      recent={toRecent(projects)}
      userSlot={user && <UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <ProjectDetail project={project} />
      <div className="mx-auto w-full max-w-5xl px-6 pb-2">
        <Link
          href={`/projects/${id}/portal`}
          className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors"
        >
          {t("openPortal")} →
        </Link>
      </div>
      <EnvVarsSection projectId={id} envVars={envVars} audit={audit} />
      <DocumentsSection projectId={id} documents={documents} archived={archivedDocs} />
    </AppShell>
  );
}
