"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivity } from "@/lib/activity/record";
import { getCurrentUser, getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listReportableProjects } from "./data";
import type { ReportableProject } from "./types";

export type ActionResult = { ok: true } | { ok: false; error: string };

const inputSchema = z.object({
  project_id: z.uuid(),
  content_md: z.string().trim().min(1),
});

/** The projects the current member can post a report to (for the picker; lazy-loaded by the modal). */
export async function listReportableProjectsAction(): Promise<ReportableProject[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return listReportableProjects();
}

/** Post a markdown report against a project (team-only; RLS re-checks access). */
export async function createReportAction(input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("reports.errorEmpty") };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("errors.notAuthorized") };
  const role = await getProjectRole(parsed.data.project_id);
  if (!role) return { ok: false, error: t("errors.notAuthorized") };

  const supabase = await createClient();
  const { error } = await supabase.from("project_reports").insert({
    project_id: parsed.data.project_id,
    content_md: parsed.data.content_md,
    created_by: user.id,
    author_label: user.name || user.email,
  });
  if (error) return { ok: false, error: t("errors.tryAgain") };

  await recordActivity(parsed.data.project_id, "report", "posted a daily report");
  revalidatePath(`/projects/${parsed.data.project_id}`);
  return { ok: true };
}
