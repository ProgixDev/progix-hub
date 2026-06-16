import { z } from "zod";

/** Where a variable is used: backend (server-only) or frontend (shipped to the browser). */
export const ENV_SCOPES = ["backend", "frontend"] as const;
export type EnvScope = (typeof ENV_SCOPES)[number];

/** A stored env var as the client sees it — metadata only; the value never leaves the server unmasked. */
export type EnvVarMeta = {
  id: string;
  project_id: string;
  key: string;
  service: string | null;
  scope: EnvScope;
  created_at: string;
  updated_at: string;
};

/** One row of the reveal/copy/export/mutation audit trail (AC-10 / spec 009 AC-4). */
export type AuditRow = {
  id: string;
  action: "create" | "edit" | "delete" | "reveal" | "copy" | "export";
  env_var_key: string;
  actor_email: string | null;
  created_at: string;
};

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Validated add/edit input (AC-1, AC-7): key required, value required, service optional, scope defaults to backend. */
export const envVarInputSchema = z.object({
  key: z.string().trim().min(1, { error: "envVars.errorKeyRequired" }).max(256),
  value: z.string().min(1, { error: "envVars.errorValueRequired" }),
  service: z.preprocess(emptyToUndefined, z.string().optional()),
  scope: z.enum(ENV_SCOPES).default("backend"),
});

export type EnvVarInput = z.infer<typeof envVarInputSchema>;

/** Edit input: like create, but the value is optional — blank means keep the stored secret (AC-8). */
export const envVarEditSchema = envVarInputSchema.extend({
  value: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type EnvVarEditInput = z.infer<typeof envVarEditSchema>;

/** One row of a bulk import (spec 009 AC-3). */
export const envImportItemSchema = z.object({
  key: z.string().trim().min(1, { error: "envVars.errorKeyRequired" }).max(256),
  value: z.string().min(1, { error: "envVars.errorValueRequired" }),
  service: z.preprocess(emptyToUndefined, z.string().optional()),
  scope: z.enum(ENV_SCOPES).default("backend"),
});

export type EnvImportItem = z.infer<typeof envImportItemSchema>;

/** The whole import payload: a non-empty, bounded list of items (spec 009 AC-3). */
export const envImportSchema = z.array(envImportItemSchema).min(1).max(200);

/** Per-key outcome of an import (AC-3). */
export type ImportResult = {
  created: string[];
  skipped: string[];
  failed: string[];
};

/** Which variables to export (spec 009 AC-4). */
export const ENV_EXPORT_SCOPES = ["all", "backend", "frontend"] as const;
export type EnvExportScope = (typeof ENV_EXPORT_SCOPES)[number];

/** A produced `.env` download, or a friendly error (e.g. empty scope, AC-6). */
export type ExportResult =
  | { ok: true; filename: string; content: string }
  | { ok: false; error: string };
