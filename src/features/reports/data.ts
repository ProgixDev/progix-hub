import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProjectReport, ReportableProject } from "./types";

/** A project's reports, newest first (RLS gates to project members). */
export async function listProjectReports(projectId: string): Promise<ProjectReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_reports")
    .select("id,project_id,content_md,author_label,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectReport[];
}

/** Projects the current member can post a report to (RLS-filtered), for the picker. */
export async function listReportableProjects(): Promise<ReportableProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("id,name").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as ReportableProject[];
}
