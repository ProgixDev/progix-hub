"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateMemberResult =
  | { ok: true; email: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

// Non-exported (a "use server" file may only export async functions). Email is lowercased; the
// password is bounded to Supabase's 72-byte bcrypt limit and never echoed back.
const createMemberSchema = z.object({
  name: z.string().trim().min(1, { error: "team.errorNameRequired" }).max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "team.errorEmail" })),
  password: z
    .string()
    .min(10, { error: "team.errorPasswordShort" })
    .max(72, { error: "team.errorPasswordLong" }),
});

/**
 * Create an org member account (spec 010 AC-3). Superadmin-only — the check runs server-side,
 * before the admin (service-role) client is ever touched. Creates an already-confirmed user with
 * `is_member: true` (NOT superadmin). The password is never logged or returned; only the email is.
 */
export async function createMemberAccountAction(input: unknown): Promise<CreateMemberResult> {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user || !user.isSuperadmin) return { ok: false, error: t("errors.notAuthorized") };

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const fieldErrors: Record<string, string> = {};
    for (const [key, messages] of Object.entries(flat.fieldErrors)) {
      const list = messages as string[] | undefined;
      if (list?.[0]) fieldErrors[key] = t(list[0]);
    }
    return { ok: false, error: t("errors.fixFields"), fieldErrors };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.name },
    app_metadata: { is_member: true },
  });
  if (error) {
    const code = (error as { code?: string }).code;
    const message = error.message.toLowerCase();
    if (
      code === "email_exists" ||
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists")
    ) {
      const duplicate = t("team.errorDuplicate");
      return { ok: false, error: duplicate, fieldErrors: { email: duplicate } };
    }
    return { ok: false, error: t("team.errorGeneric") };
  }
  return { ok: true, email: parsed.data.email };
}
