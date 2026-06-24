import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { canViewOrgMembers } from "@/features/members";
import { canManagePlatforms, listPlatforms, PlatformsManager } from "@/features/platforms";
import { listProjects, type Project } from "@/features/projects";
import { ClockWidget } from "@/features/time-tracking";
import { listTutorials } from "@/features/tutorials";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

/** Settings → Platforms: the org-wide platform registry (spec 015). Members read; managers edit. */
export default async function PlatformsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [platforms, canManage, projects, showMembers, tutorials, t] = await Promise.all([
    listPlatforms(),
    canManagePlatforms(),
    listProjects(),
    canViewOrgMembers(),
    listTutorials(),
    getTranslations("platforms"),
  ]);
  const tutorialOptions = tutorials.map((tut) => ({ id: tut.id, title: tut.title }));

  return (
    <AppShell
      title={t("title")}
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <PlatformsManager
        platforms={platforms}
        canManage={canManage}
        tutorialOptions={tutorialOptions}
      />
    </AppShell>
  );
}
