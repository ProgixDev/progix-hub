import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import { listProjects, type Project } from "@/features/projects";
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
  const [user, projects, t] = await Promise.all([
    getCurrentUser(),
    listProjects(),
    getTranslations("nav"),
  ]);

  // Defense in depth — the middleware already gates this route to members (AC-7).
  if (!user) redirect("/sign-in");

  return (
    <AppShell
      title={t("settings")}
      recent={toRecent(projects)}
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <SettingsSection />
      {user.isSuperadmin && <CreateMemberCard />}
    </AppShell>
  );
}
