"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { projectInputSchema } from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NOT_AUTHORIZED: ActionResult = { ok: false, error: "You aren’t authorized to do that." };

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) out[key] = list[0]!;
  }
  return out;
}

/** Create a project (AC-3, AC-4). Authorized to verified members; RLS is the backstop. */
export async function createProjectAction(input: unknown): Promise<ActionResult> {
  const member = await requireMember();
  if (!member) return NOT_AUTHORIZED;

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, created_by: member.id });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

/** Edit a project (AC-5). */
export async function updateProjectAction(id: string, input: unknown): Promise<ActionResult> {
  const member = await requireMember();
  if (!member) return NOT_AUTHORIZED;

  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown project." };

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

/** Archive a project (AC-5) — reversible; there is no hard delete. */
export async function archiveProjectAction(id: string): Promise<ActionResult> {
  const member = await requireMember();
  if (!member) return NOT_AUTHORIZED;

  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown project." };

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}
