import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Tutorial } from "./types";

const COLS =
  "id,title,description,platform_service_id,source_type,embed_url,storage_path,language,visible_to_clients,created_at,updated_at";

const VIDEO_URL_TTL = 60 * 60; // 1h signed URL for inline playback

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

/** Short-lived signed playback URLs for upload tutorials, keyed by id (members only; spec 019). */
export async function resolveVideoUrls(tutorials: Tutorial[]): Promise<Record<string, string>> {
  const uploads = tutorials.filter((t) => t.source_type === "upload" && t.storage_path);
  if (uploads.length === 0) return {};
  const supabase = await createClient();
  const out: Record<string, string> = {};
  await Promise.all(
    uploads.map(async (t) => {
      const { data } = await supabase.storage
        .from("tutorial-videos")
        .createSignedUrl(t.storage_path!, VIDEO_URL_TTL);
      if (data?.signedUrl) out[t.id] = data.signedUrl;
    }),
  );
  return out;
}

/** Whether the current member may add/edit/delete tutorials (superadmin or global PM). */
export async function canManageTutorials(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && (user.isSuperadmin || user.isGlobalPm);
}
