import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { NotificationsBell } from "@/features/activity";
import { UserMenu } from "@/features/auth";
import { DailyReportButton } from "@/features/reports";
import { ClockWidget } from "@/features/time-tracking";
import {
  fetchOrgCommits,
  fetchOrgContributions,
  getOrgMember,
  MemberProfile,
  type OrgMember,
} from "@/features/members";
import { listProjects, type Project } from "@/features/projects";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

/** The signed-in member's own profile + GitHub activity (spec 012 AC-3). */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { error } = await searchParams;

  // Prefer the directory record (carries github_login); fall back to the session identity so the
  // page always renders for the signed-in member even if the activity RPC returns nothing.
  const member: OrgMember = (await getOrgMember(user.id)) ?? {
    user_id: user.id,
    email: user.email,
    display_name: user.name,
    github_login: null,
    is_superadmin: user.isSuperadmin,
    is_lead: user.isLead,
    is_global_pm: user.isGlobalPm,
    created_at: "",
  };

  const [calendar, commits, projects, t] = await Promise.all([
    fetchOrgContributions(member.github_login),
    fetchOrgCommits(member.github_login),
    listProjects(),
    getTranslations("nav"),
  ]);

  return (
    <AppShell
      title={t("profile")}
      recent={toRecent(projects)}
      showMembers
      clockSlot={<ClockWidget />}
      notificationsSlot={<NotificationsBell />}
      reportSlot={<DailyReportButton />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <MemberProfile
        member={member}
        calendar={calendar}
        commits={commits}
        isOwnProfile
        linkConflict={error === "github_linked"}
      />
    </AppShell>
  );
}
