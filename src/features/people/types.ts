import { z } from "zod";
import { PROJECT_ROLES, type ProjectRole } from "@/lib/auth/roles";

export type { ProjectRole };
export { PROJECT_ROLES };

export type ProjectMember = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: ProjectRole;
  created_at: string;
};

export const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "people.errorEmail" })),
  role: z.enum(PROJECT_ROLES),
});

export const ROLE_LABEL_KEY: Record<ProjectRole, string> = {
  pm: "rolePm",
  developer: "roleDeveloper",
  video_editor: "roleVideoEditor",
  viewer: "roleViewer",
};
