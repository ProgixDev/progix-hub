import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MyTask, ProjectHealth, RecentReport, TimeMember } from "./types";

/** Per-project health aggregates across the user's projects (RLS-scoped via the RPC). */
export async function getProjectHealth(): Promise<ProjectHealth[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("project_health");
  if (error) return [];
  return (data ?? []) as ProjectHealth[];
}

type MemberLite = { user_id: string; email: string | null; display_name: string | null };

/**
 * Per-member time insights: hours this week (7-day sparkline) + last 30 days. Member-gated via the
 * RPC. Date math lives here (data layer), not in a component render. Pass the org members for names.
 */
export async function getTimeInsights(members: MemberLite[]): Promise<TimeMember[]> {
  const supabase = await createClient();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("team_work_hours", { p_since: monthAgo });
  if (error) return [];
  const rows = (data ?? []) as { user_id: string; day: string; seconds: number }[];

  // Day keys for the last 7 days (UTC), oldest → newest, to align with the RPC's day grouping.
  const weekKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    weekKeys.push(new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  }
  const byUser = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const m = byUser.get(r.user_id) ?? new Map<string, number>();
    m.set(String(r.day).slice(0, 10), Number(r.seconds));
    byUser.set(r.user_id, m);
  }
  return members
    .map((m) => {
      const dm = byUser.get(m.user_id) ?? new Map<string, number>();
      const weekDaily = weekKeys.map((k) => dm.get(k) ?? 0);
      const weekSeconds = weekDaily.reduce((a, b) => a + b, 0);
      let monthSeconds = 0;
      for (const v of dm.values()) monthSeconds += v;
      return {
        userId: m.user_id,
        name: m.display_name || m.email || "Member",
        weekSeconds,
        monthSeconds,
        weekDaily,
      };
    })
    .filter((r) => r.monthSeconds > 0);
}

/** Open task count per assignee across the caller's projects (RLS-scoped via the RPC). */
export async function getTeamWorkload(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("team_workload");
  if (error) return {};
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as { user_id: string; open_tasks: number }[]) {
    out[r.user_id] = Number(r.open_tasks);
  }
  return out;
}

type TaskRow = {
  id: string;
  title: string;
  status: string;
  project_id: string;
  due_date: string | null;
  projects: { name: string } | null;
};

/** The current user's open (not done) plan items across all their projects (RLS-gated).
 *  Due/overdue items sort first (nulls last) so deadlines lead the Today panel. */
export async function getMyOpenTasks(userId: string): Promise<MyTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_items")
    .select("id,title,status,project_id,due_date,projects(name)")
    .eq("assignee", userId)
    .eq("type", "task")
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(12);
  if (error) return [];
  const today = new Date().toISOString().slice(0, 10);
  return ((data ?? []) as unknown as TaskRow[]).map((r) => ({
    id: r.id,
    title: r.title || "Untitled",
    status: r.status,
    project_id: r.project_id,
    due_date: r.due_date,
    overdue: r.due_date != null && r.due_date < today,
    project_name: r.projects?.name ?? "Project",
  }));
}

type ReportRow = {
  id: string;
  project_id: string;
  content_md: string | null;
  author_label: string | null;
  created_at: string;
  projects: { name: string } | null;
};

/** The most recent daily reports across the user's projects (RLS-gated), for a team pulse. */
export async function listRecentReports(limit = 6): Promise<RecentReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_reports")
    .select("id,project_id,content_md,author_label,created_at,projects(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as unknown as ReportRow[]).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    project_name: r.projects?.name ?? "Project",
    author_label: r.author_label,
    created_at: r.created_at,
    snippet: (r.content_md ?? "")
      .replace(/[#*`>_~-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 130),
  }));
}
