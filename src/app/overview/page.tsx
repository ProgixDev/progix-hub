import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { getProjectHealth, HealthBoard } from "@/features/dashboard";
import { canViewOrgMembers } from "@/features/members";
import { listProjects, type Project } from "@/features/projects";
import { DailyReportButton } from "@/features/reports";
import { ClockWidget } from "@/features/time-tracking";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

/** Cross-project health board (spec 036). */
export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const [rows, projects, showMembers] = await Promise.all([
    getProjectHealth(),
    listProjects(),
    canViewOrgMembers(),
  ]);
  return (
    <AppShell
      title="Overview"
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      reportSlot={<DailyReportButton />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <HealthBoard rows={rows} />
    </AppShell>
  );
}
