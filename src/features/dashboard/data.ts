import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MyTask, ProjectHealth, RecentReport } from "./types";

/** Per-project health aggregates across the user's projects (RLS-scoped via the RPC). */
export async function getProjectHealth(): Promise<ProjectHealth[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("project_health");
  if (error) return [];
  return (data ?? []) as ProjectHealth[];
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
  projects: { name: string } | null;
};

/** The current user's open (not done) plan items across all their projects (RLS-gated). */
export async function getMyOpenTasks(userId: string): Promise<MyTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_items")
    .select("id,title,status,project_id,projects(name)")
    .eq("assignee", userId)
    .eq("type", "task")
    .neq("status", "done")
    .order("created_at", { ascending: true })
    .limit(12);
  if (error) return [];
  return ((data ?? []) as unknown as TaskRow[]).map((r) => ({
    id: r.id,
    title: r.title || "Untitled",
    status: r.status,
    project_id: r.project_id,
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
