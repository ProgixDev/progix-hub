import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { DailyReportButton } from "@/features/reports";
import { canViewOrgMembers } from "@/features/members";
import { listPlatforms } from "@/features/platforms";
import { listProjects, type Project } from "@/features/projects";
import { ClockWidget } from "@/features/time-tracking";
import {
  canManageTutorials,
  listTutorials,
  resolveVideoUrls,
  TutorialsLibrary,
} from "@/features/tutorials";
import { getCurrentUser } from "@/lib/auth/session";

function toRecent(projects: Project[]): RecentProject[] {
  return projects.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.name.slice(0, 2).toUpperCase(),
    tone: p.status === "active" ? "green" : p.status === "at_risk" ? "amber" : "neutral",
  }));
}

/** Tutorials library (spec 016). Members watch; managers add/edit/delete. */
export default async function TutorialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [tutorials, canManage, platforms, projects, showMembers, t] = await Promise.all([
    listTutorials(),
    canManageTutorials(),
    listPlatforms(),
    listProjects(),
    canViewOrgMembers(),
    getTranslations("tutorials"),
  ]);

  const videoUrls = await resolveVideoUrls(tutorials);

  // Platform-tag options from the registry (dedup by service key).
  const seen = new Set<string>();
  const platformOptions = platforms
    .filter((p) => p.service_id && !seen.has(p.service_id) && seen.add(p.service_id))
    .map((p) => ({ value: p.service_id!, label: p.name }));

  return (
    <AppShell
      title={t("title")}
      recent={toRecent(projects)}
      showMembers={showMembers}
      clockSlot={<ClockWidget />}
      reportSlot={<DailyReportButton />}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <TutorialsLibrary
        tutorials={tutorials}
        canManage={canManage}
        platformOptions={platformOptions}
        videoUrls={videoUrls}
      />
    </AppShell>
  );
}
