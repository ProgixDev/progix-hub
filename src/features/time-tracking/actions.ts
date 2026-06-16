"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMySession } from "./data";
import type { WorkSession } from "./types";

export type WorkActionResult =
  | { ok: true; session: WorkSession | null }
  | { ok: false; error: string };

type Transition = "work_start" | "work_pause" | "work_resume" | "work_finish";

/**
 * Run a clock transition for the signed-in member. The DB RPC enforces the valid-transition guards
 * and break math scoped to auth.uid() (AC-2/AC-5); we just authorize, call it, and return the
 * fresh session so the widget can update without a refetch.
 */
async function runTransition(rpc: Transition): Promise<WorkActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };

  const supabase = await createClient();
  const { error } = await supabase.rpc(rpc);
  // Map any DB error to a friendly message — never leak constraint names to the client.
  if (error) return { ok: false, error: t("errors.tryAgain") };

  const session = await getMySession();
  revalidatePath("/", "layout");
  return { ok: true, session };
}

export async function startWorkAction(): Promise<WorkActionResult> {
  return runTransition("work_start");
}
export async function pauseWorkAction(): Promise<WorkActionResult> {
  return runTransition("work_pause");
}
export async function resumeWorkAction(): Promise<WorkActionResult> {
  return runTransition("work_resume");
}
export async function finishWorkAction(): Promise<WorkActionResult> {
  return runTransition("work_finish");
}

/** Load the current member's open session for the header widget's initial render. */
export async function loadMySessionAction(): Promise<WorkSession | null> {
  const member = await requireMember();
  if (!member) return null;
  return getMySession();
}
