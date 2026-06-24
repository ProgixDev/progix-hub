import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { DailyReportButton } from "@/features/reports";
import { ClockWidget } from "@/features/time-tracking";
import { listProjects, type Project } from "@/features/projects";
import { canViewOrgMembers } from "@/features/members";
import { listMcpTokens, McpTokensCard } from "@/features/mcp-tokens";
import { SettingsSection } from "@/features/settings";
import { CreateMemberCard } from "@/features/team";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

export default async function SettingsPage() {
  const [user, projects, t, tPlatforms] = await Promise.all([
    getCurrentUser(),
    listProjects(),
    getTranslations("nav"),
    getTranslations("platforms"),
  ]);

  // Defense in depth — the middleware already gates this route to members (AC-7).
  if (!user) redirect("/sign-in");
  const [showMembers, mcpTokens] = await Promise.all([canViewOrgMembers(), listMcpTokens()]);

  return (
    <AppShell
      title={t("settings")}
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      reportSlot={<DailyReportButton />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <SettingsSection />
      <div className="mx-auto w-full max-w-2xl px-4 pb-6 sm:px-6">
        <Link
          href="/settings/platforms"
          className="glass card-hover flex items-center justify-between gap-3 rounded-2xl px-5 py-4"
        >
          <div className="min-w-0">
            <p className="text-text text-[14px] font-semibold">{tPlatforms("title")}</p>
            <p className="text-text-3 text-[12.5px]">{tPlatforms("subtitle")}</p>
          </div>
          <span className="text-text-3" aria-hidden>
            →
          </span>
        </Link>
      </div>
      <McpTokensCard tokens={mcpTokens} />
      {user.isSuperadmin && <CreateMemberCard />}
    </AppShell>
  );
}
