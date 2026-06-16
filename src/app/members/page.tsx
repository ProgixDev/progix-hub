import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import {
  canViewOrgMembers,
  listOrgMembers,
  type MemberWorkStatus,
  MembersDirectory,
} from "@/features/members";
import { listProjects, type Project } from "@/features/projects";
import { ClockWidget, formatDuration, listWorkStatus } from "@/features/time-tracking";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!(await canViewOrgMembers())) redirect("/");

  const [members, projects, workStatus, t] = await Promise.all([
    listOrgMembers(),
    listProjects(),
    listWorkStatus(),
    getTranslations("nav"),
  ]);

  const statuses: Record<string, MemberWorkStatus> = Object.fromEntries(
    workStatus.map((w) => [w.user_id, { state: w.state, hours: formatDuration(w.seconds_today) }]),
  );

  return (
    <AppShell
      title={t("members")}
      recent={toRecent(projects)}
      showMembers
      clockSlot={<ClockWidget />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <MembersDirectory members={members} canPromote={user.isSuperadmin} statuses={statuses} />
    </AppShell>
  );
}
