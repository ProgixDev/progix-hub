// Pure + client-safe: the capability matrix gates UI buttons in client islands and the DB
// enforces the same matrix. Server-side role resolution lives in `session.ts` (server-only).
export const PROJECT_ROLES = ["pm", "developer", "video_editor", "viewer"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];
export type EffectiveRole = "superadmin" | ProjectRole;

/** What a role may do on a project (spec 008 / ADR-0011 capability matrix). The DB enforces
 * the same matrix; these flags only let the UI hide what a role can't do. */
export type Capabilities = {
  read: boolean;
  manageProject: boolean; // edit/archive the project
  managePeople: boolean; // add/remove members + set roles
  seeEnvVars: boolean; // see the env-vars section (keys)
  writeEnvVars: boolean; // add/edit/delete/reveal secrets
  writeContent: boolean; // documents + portal mutations
};

const NONE: Capabilities = {
  read: false,
  manageProject: false,
  managePeople: false,
  seeEnvVars: false,
  writeEnvVars: false,
  writeContent: false,
};

export function capabilities(role: EffectiveRole | null): Capabilities {
  switch (role) {
    case "superadmin":
    case "pm":
      return {
        read: true,
        manageProject: true,
        managePeople: true,
        seeEnvVars: true,
        writeEnvVars: true,
        writeContent: true,
      };
    case "developer":
      return { ...NONE, read: true, seeEnvVars: true, writeEnvVars: true, writeContent: true };
    case "video_editor":
      return { ...NONE, read: true, writeContent: true };
    case "viewer":
      return { ...NONE, read: true, seeEnvVars: true };
    default:
      return NONE;
  }
}
