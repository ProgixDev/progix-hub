import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Tutorial } from "./types";

const COLS =
  "id,title,description,platform_service_id,embed_url,language,visible_to_clients,created_at,updated_at";

/** Every tutorial, newest first (any member may read). */
export async function listTutorials(): Promise<Tutorial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutorials")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Tutorial[];
}

/** Whether the current member may add/edit/delete tutorials (superadmin or global PM). */
export async function canManageTutorials(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && (user.isSuperadmin || user.isGlobalPm);
}
