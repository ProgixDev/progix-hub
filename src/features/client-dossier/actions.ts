"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser, getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dossierInputSchema } from "./lib";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function fieldErrorsOf(error: z.ZodError, t: Translate): Record<string, string> {
  const flat = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) out[key] = t(list[0]!);
  }
  return out;
}

/** Save the project's client dossier (spec 018). Any member with access to the project may edit;
 * a member with no access is refused (RLS is the backstop). */
export async function upsertDossierAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const user = await getCurrentUser();
  const role = await getProjectRole(projectId);
  if (!user || !role) return { ok: false, error: t("errors.notAuthorized") };

  const parsed = dossierInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_dossiers")
    .upsert({ project_id: projectId, ...parsed.data, updated_by: user.id });
  if (error) return { ok: false, error: t("errors.tryAgain") };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
