import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { NotificationsBell } from "@/features/activity";
import { UserMenu } from "@/features/auth";
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
import { canManagePricing, EstimatesList, listEstimates, PricingTabs } from "@/features/pricing";

/** Saved estimates (spec 045) — leadership only. */
export default async function EstimatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!(await canManagePricing())) redirect("/");
  const [estimates, projects, showMembers] = await Promise.all([
    listEstimates(),
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
      <EstimatesList estimates={estimates} />
    </AppShell>
  );
}
