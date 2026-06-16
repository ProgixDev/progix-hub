import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { WorkSession, WorkStatus } from "./types";

const SESSION_COLS = "id,user_id,started_at,ended_at,break_started_at,break_seconds";

/** The current user's open session, or null when off the clock / signed out. */
export async function getMySession(): Promise<WorkSession | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_sessions")
    .select(SESSION_COLS)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();
  return (data as WorkSession | null) ?? null;
}

/** Every member's current state + seconds-today, via the member-gated RPC (AC-4). */
export async function listWorkStatus(): Promise<WorkStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("work_status_all");
  if (error) return [];
  return (data ?? []) as WorkStatus[];
}
