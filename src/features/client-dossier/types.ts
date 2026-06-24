/** Team-only client context for a project (spec 018). Never exposed on a client surface. */
export type ClientDossier = {
  project_id: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company: string | null;
  client_role: string | null;
  client_type: string | null;
  it_savviness: number | null;
  temperament: string | null;
  notes: string | null;
  updated_at: string;
};
