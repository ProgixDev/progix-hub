import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { DailyReportButton } from "@/features/reports";
import { ClockWidget } from "@/features/time-tracking";
import { ProjectsPortfolio, listProjects, type Project } from "@/features/projects";
import { canViewOrgMembers } from "@/features/members";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

export default async function Home() {
  const [user, projects] = await Promise.all([getCurrentUser(), listProjects()]);
  const showMembers = await canViewOrgMembers();

  return (
    <AppShell
      title="Projects"
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      reportSlot={<DailyReportButton />}
      userSlot={user && <UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <ProjectsPortfolio projects={projects} />
    </AppShell>
  );
}
