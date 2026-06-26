"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listActivity } from "./data";
import type { ActivityEvent } from "./types";

export type NotificationsPayload = { unread: number; items: ActivityEvent[] };

/** Unread count + the latest events for the notifications bell (RLS-scoped to the caller). */
export async function loadNotificationsAction(): Promise<NotificationsPayload> {
  const user = await getCurrentUser();
  if (!user) return { unread: 0, items: [] };
  const supabase = await createClient();
  // Seed a read-state row on first ever load so the badge starts at 0 (only NEW events count).
  await supabase.from("notification_reads").insert({ user_id: user.id }).select().maybeSingle();
  const [{ data: count }, items] = await Promise.all([
    supabase.rpc("unread_notification_count"),
    listActivity(8),
  ]);
  return { unread: typeof count === "number" ? count : 0, items };
}

/** Mark all notifications read (advances the caller's last_seen_at to now). */
export async function markNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notification_reads")
    .upsert({ user_id: user.id, last_seen_at: now, updated_at: now }, { onConflict: "user_id" });
  return { ok: !error };
}
