import { z } from "zod";
import { ACCESS_PATTERNS, type AccessPattern } from "./types";

// Known logo keys (mirrors the env-vars service set — features can't import each other, so the
// list is repeated). Anything outside this set falls back to a lettered badge.
export const PLATFORM_SERVICES = [
  "stripe",
  "twilio",
  "supabase",
  "vercel",
  "github",
  "redis",
  "openai",
  "anthropic",
  "aws",
  "postgres",
  "sendgrid",
  "notion",
  "slack",
] as const;

/** The extra fields each access pattern requires (AC-2) — single source for schema + form. */
export function requiredFieldsFor(pattern: AccessPattern): readonly string[] {
  switch (pattern) {
    case "invite_collaborator":
      return ["invite_url", "invite_role", "invite_email"] as const;
    case "store_key":
      return ["key_label"] as const;
    case "diy":
      return [] as const;
  }
}

const isHttpUrl = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

/**
 * Validate platform input. Messages are i18n keys resolved by the action (like the projects slice).
 * Per-pattern required fields + URL/email shapes are enforced here so AC-2/AC-5 are testable without
 * a DB, and the form/schema/validator stay in agreement.
 */
export const platformInputSchema = z
  .object({
    name: z.string().trim().min(1, "platforms.errorName"),
    service_id: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    access_pattern: z.enum(ACCESS_PATTERNS),
    critical: z.boolean().default(false),
    steps: z.array(z.string().trim().min(1)).default([]),
    video_url: optionalTrimmed,
    invite_url: optionalTrimmed,
    invite_role: optionalTrimmed,
    invite_email: optionalTrimmed,
    key_label: optionalTrimmed,
  })
  .superRefine((val, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (val.video_url && !isHttpUrl(val.video_url)) issue("video_url", "platforms.errorVideoUrl");

    if (val.access_pattern === "invite_collaborator") {
      if (!val.invite_url || !isHttpUrl(val.invite_url))
        issue("invite_url", "platforms.errorInviteUrl");
      if (!val.invite_role) issue("invite_role", "platforms.errorInviteRole");
      if (!val.invite_email || !z.string().email().safeParse(val.invite_email).success)
        issue("invite_email", "platforms.errorInviteEmail");
    }
    if (val.access_pattern === "store_key" && !val.key_label) {
      issue("key_label", "platforms.errorKeyLabel");
    }
  });

export type PlatformInput = z.infer<typeof platformInputSchema>;
