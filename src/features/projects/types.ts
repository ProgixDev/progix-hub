import { z } from "zod";

export const PROJECT_STATUSES = ["active", "at_risk", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type StatusFilter = "all" | ProjectStatus;

/** A project row as stored. */
export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  description: string | null;
  notion_url: string | null;
  slack_url: string | null;
  github_url: string | null;
  live_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Blank strings become undefined so optional fields stay optional. */
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.url({ error: "projects.errorUrl" }).optional(),
);

/** Validated create/edit input (AC-4): name required, links optional but valid URLs.
 *  Zod messages are translation keys (spec 005); actions resolve them through next-intl. */
export const projectInputSchema = z.object({
  name: z.string().trim().min(1, { error: "projects.errorNameRequired" }).max(120),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  status: z.enum(PROJECT_STATUSES).default("active"),
  notion_url: optionalUrl,
  slack_url: optionalUrl,
  github_url: optionalUrl,
  live_url: optionalUrl,
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
