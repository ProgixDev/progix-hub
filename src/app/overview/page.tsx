import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { NotificationsBell } from "@/features/activity";
import { UserMenu } from "@/features/auth";
import {
  getProjectHealth,
  getTeamWorkload,
  HealthBoard,
  WorkloadPanel,
  type WorkloadRow,
} from "@/features/dashboard";
import { canViewOrgMembers, listOrgMembers } from "@/features/members";
import { listProjects, type Project } from "@/features/projects";
import { DailyReportButton } from "@/features/reports";
import { ClockWidget, listWorkStatus } from "@/features/time-tracking";
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

  // Team workload is an oversight view — only for those who can see the org directory.
  let workload: WorkloadRow[] = [];
  if (showMembers) {
    const [members, status, load] = await Promise.all([
      listOrgMembers(),
      listWorkStatus(),
      getTeamWorkload(),
    ]);
    const statusBy = new Map(status.map((s) => [s.user_id, s]));
    workload = members.map((m) => ({
      userId: m.user_id,
      name: m.display_name || m.email || "Member",
      state: statusBy.get(m.user_id)?.state ?? "off",
      secondsToday: statusBy.get(m.user_id)?.seconds_today ?? 0,
      openTasks: load[m.user_id] ?? 0,
    }));
  }

  return (
    <AppShell
      title="Overview"
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      notificationsSlot={<NotificationsBell />}
      reportSlot={<DailyReportButton />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <HealthBoard rows={rows} />
      {showMembers && <WorkloadPanel rows={workload} />}
    </AppShell>
  );
}
