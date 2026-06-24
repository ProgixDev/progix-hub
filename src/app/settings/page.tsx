import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { ClockWidget } from "@/features/time-tracking";
import { listProjects, type Project } from "@/features/projects";
import { canViewOrgMembers } from "@/features/members";
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
  const showMembers = await canViewOrgMembers();

  return (
    <AppShell
      title={t("settings")}
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <SettingsSection />
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <Link
          href="/settings/platforms"
          className="border-line-1 bg-card hover:border-line-strong flex items-center justify-between gap-3 rounded-xl border px-5 py-4 transition-colors"
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
      {user.isSuperadmin && <CreateMemberCard />}
    </AppShell>
  );
}
