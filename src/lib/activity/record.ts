import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Record an activity event (spec 028). Best-effort: a logging failure must never break the action
 * that triggered it. The actor is the current user; RLS gates the insert to the user's projects.
 */
export async function recordActivity(
  projectId: string,
  kind: string,
  summary: string,
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const supabase = await createClient();
    await supabase.from("activity_events").insert({
      project_id: projectId,
      actor_id: user.id,
      actor_label: user.name ?? user.email ?? "Someone",
      kind,
      summary,
    });
  } catch (err) {
    // swallow — activity logging is non-critical, but surface it for diagnosis
    console.error("recordActivity failed", err);
  }
}
