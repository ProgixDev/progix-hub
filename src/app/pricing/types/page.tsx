import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { NotificationsBell } from "@/features/activity";
import { UserMenu } from "@/features/auth";
import { canViewOrgMembers } from "@/features/members";
import {
  canManagePricing,
  listProjectTypes,
  PricingTabs,
  ProjectTypesManager,
} from "@/features/pricing";
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

/** Project types the Scoping & Pricing wizard offers (spec 045) — leadership managed. */
export default async function ProjectTypesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!(await canManagePricing())) redirect("/");
  const [types, projects, showMembers] = await Promise.all([
    listProjectTypes(),
    listProjects(),
    canViewOrgMembers(),
  ]);
  return (
    <AppShell
      title="Pricing"
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      notificationsSlot={<NotificationsBell />}
      reportSlot={<DailyReportButton />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <PricingTabs />
      <ProjectTypesManager types={types} />
    </AppShell>
  );
}
