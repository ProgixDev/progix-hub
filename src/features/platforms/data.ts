import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Platform } from "./types";

const COLS =
  "id,name,service_id,access_pattern,critical,steps,video_url,invite_url,invite_role,invite_email,key_label,disabled,created_at,updated_at";

/** Every configured platform, ordered by name (any member may read). */
export async function listPlatforms(): Promise<Platform[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("platforms").select(COLS).order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Platform[];
}

/** Whether the current member may add/edit/disable/delete platforms (superadmin or global PM). */
export async function canManagePlatforms(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && (user.isSuperadmin || user.isGlobalPm);
}
