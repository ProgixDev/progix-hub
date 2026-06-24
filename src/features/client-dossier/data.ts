import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ClientDossier } from "./types";

const COLS =
  "project_id,contact_name,contact_email,contact_phone,company,client_role,client_type,it_savviness,temperament,notes,updated_at";

/** The project's client dossier, or null (RLS-gated to members with project access). */
export async function getClientDossier(projectId: string): Promise<ClientDossier | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_dossiers")
    .select(COLS)
    .eq("project_id", projectId)
    .maybeSingle();
  return (data as ClientDossier | null) ?? null;
}
