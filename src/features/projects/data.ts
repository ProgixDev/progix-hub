import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "./types";

/** All projects visible to the signed-in member (RLS scopes this), newest first. */
export async function listProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

/** One project by id, or null if it doesn't exist / isn't visible. */
export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Project | null) ?? null;
}
