import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ActivityEvent } from "./types";

type Row = {
  id: string;
  project_id: string;
  actor_label: string;
  kind: string;
  summary: string;
  created_at: string;
  projects: { name: string } | null;
};

/** Recent activity across the user's projects, newest first (RLS-gated). */
export async function listActivity(limit = 60): Promise<ActivityEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("id,project_id,actor_label,kind,summary,created_at,projects(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    project_name: r.projects?.name ?? "Project",
    actor_label: r.actor_label,
    kind: r.kind,
    summary: r.summary,
    created_at: r.created_at,
  }));
}
