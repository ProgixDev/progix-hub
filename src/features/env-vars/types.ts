import { z } from "zod";

/** A stored env var as the client sees it — metadata only; the value never leaves the server unmasked. */
export type EnvVarMeta = {
  id: string;
  project_id: string;
  key: string;
  service: string | null;
  created_at: string;
  updated_at: string;
};

/** One row of the reveal/copy/mutation audit trail (AC-10). */
export type AuditRow = {
  id: string;
  action: "create" | "edit" | "delete" | "reveal" | "copy";
  env_var_key: string;
  actor_email: string | null;
  created_at: string;
};

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Validated add/edit input (AC-1, AC-7): key required, value required, service optional. */
export const envVarInputSchema = z.object({
  key: z.string().trim().min(1, { error: "Key is required" }).max(256),
  value: z.string().min(1, { error: "Value is required" }),
  service: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type EnvVarInput = z.infer<typeof envVarInputSchema>;
