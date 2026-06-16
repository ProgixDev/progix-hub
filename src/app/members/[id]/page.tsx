import { notFound, redirect } from "next/navigation";
import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { UserMenu } from "@/features/auth";
import {
  canViewOrgMembers,
  fetchOrgContributions,
  getOrgMember,
  MemberProfile,
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

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!(await canViewOrgMembers())) redirect("/");

  const member = await getOrgMember(id);
  if (!member) notFound();

  const [calendar, projects] = await Promise.all([
    fetchOrgContributions(member.github_login),
    listProjects(),
  ]);

  return (
    <AppShell
      title={member.display_name ?? member.email ?? "Member"}
      recent={toRecent(projects)}
      showMembers
      userSlot={<UserMenu initials={user.initials} name={user.name} email={user.email} />}
    >
      <MemberProfile member={member} calendar={calendar} />
    </AppShell>
  );
}
