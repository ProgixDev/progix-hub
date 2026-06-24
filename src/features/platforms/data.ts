import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Platform, PlatformTutorial } from "./types";

const COLS =
  "id,name,service_id,access_pattern,critical,steps,invite_url,invite_role,invite_email,key_label,disabled,created_at,updated_at," +
  "platform_tutorials(tutorial_id,label,position,tutorials(title))";

type PlatformLink = {
  tutorial_id: string;
  label: string | null;
  position: number;
  tutorials: { title?: string } | null;
};
type RawPlatformRow = Record<string, unknown> & { platform_tutorials?: PlatformLink[] };

/** Every configured platform with its attached tutorials, ordered by name (any member may read). */
export async function listPlatforms(): Promise<Platform[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("platforms").select(COLS).order("name");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as RawPlatformRow[];
  return rows.map(({ platform_tutorials = [], ...rest }) => {
    const tutorials: PlatformTutorial[] = [...platform_tutorials]
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ tutorial_id: l.tutorial_id, label: l.label, title: l.tutorials?.title }));
    return { ...(rest as object), tutorials } as Platform;
  });
}

/** Whether the current member may add/edit/disable/delete platforms (superadmin or global PM). */
export async function canManagePlatforms(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && (user.isSuperadmin || user.isGlobalPm);
}
