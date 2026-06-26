"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DIGEST_MODEL, digestConfigured, generateDigestContent } from "./generate";

export type DigestResult = { ok: true } | { ok: false; error: string };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Strip an email domain so member PII isn't sent to the OpenAI sub-processor (appsec P2). */
function displayName(label: string | null): string {
  const v = (label ?? "Team").trim();
  return v.includes("@") ? v.split("@")[0]! : v;
}

/** Generate + store a weekly digest for a project. PM / global-PM / superadmin only. */
export async function generateDigestAction(rawProjectId: string): Promise<DigestResult> {
  const t = await getTranslations("digests");
  const parsed = z.string().uuid().safeParse(rawProjectId);
  if (!parsed.success) return { ok: false, error: t("errorNotAuthorized") };
  const projectId = parsed.data;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };

  const supabase = await createClient();

  // Gate to PM access (matches the insert RLS: superadmin / global-PM / project PM).
  let allowed = user.isSuperadmin || user.isGlobalPm;
  if (!allowed) {
    const { data: m } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = (m as { role?: string } | null)?.role === "pm";
  }
  if (!allowed) return { ok: false, error: t("errorNotAuthorized") };

  if (!digestConfigured()) return { ok: false, error: t("errorNotConfigured") };

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - WEEK_MS);
  const sinceIso = periodStart.toISOString();

  const project = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
  const projectName = (project.data as { name?: string } | null)?.name ?? "Project";

  const [reportsRes, activityRes, totalRes, doneRes] = await Promise.all([
    supabase
      .from("project_reports")
      .select("content_md,author_label,created_at")
      .eq("project_id", projectId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_events")
      .select("kind,summary,created_at")
      .eq("project_id", projectId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("plan_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("type", "task"),
    supabase
      .from("plan_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("type", "task")
      .eq("status", "done"),
  ]);

  const reports = (
    (reportsRes.data ?? []) as {
      content_md: string | null;
      author_label: string | null;
      created_at: string;
    }[]
  ).map((r) => ({
    author: displayName(r.author_label),
    date: r.created_at.slice(0, 10),
    body: r.content_md ?? "",
  }));
  const activity = (
    (activityRes.data ?? []) as { kind: string; summary: string; created_at: string }[]
  ).map((a) => ({ kind: a.kind, summary: a.summary, date: a.created_at.slice(0, 10) }));

  if (reports.length === 0 && activity.length === 0) {
    return { ok: false, error: t("errorNoActivity") };
  }

  let content: string;
  try {
    content = await generateDigestContent({
      projectName,
      reports,
      activity,
      taskTotal: totalRes.count ?? 0,
      taskDone: doneRes.count ?? 0,
    });
  } catch {
    return { ok: false, error: t("errorFailed") };
  }

  const { error } = await supabase.from("project_digests").insert({
    project_id: projectId,
    content_md: content,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    model: DIGEST_MODEL,
    created_by: user.id,
  });
  if (error) return { ok: false, error: t("errorFailed") };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
