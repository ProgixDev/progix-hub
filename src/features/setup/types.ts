export const SETUP_STATUSES = ["pending", "client_done", "verified"] as const;
export type SetupStatus = (typeof SETUP_STATUSES)[number];

export type AccessPattern = "invite_collaborator" | "store_key" | "diy";

/** A platform as the client sees it on a setup step (no secrets — built by the view RPC). */
export type SetupPlatform = {
  name: string;
  access_pattern: AccessPattern;
  critical: boolean;
  steps: string[];
  invite_url: string | null;
  invite_role: string | null;
  invite_email: string | null;
  key_label: string | null;
  /** Client-visible embed videos attached to this platform, each labeled by purpose (spec 020). */
  videos: { label: string | null; embed_url: string }[];
};

export type SetupStep = {
  id: string;
  position: number;
  status: SetupStatus;
  platform: SetupPlatform;
};

/** The client's entire read surface for a setup page. */
export type PublicSetup = { project_name: string; steps: SetupStep[] };

/** The team's view of a step (status + platform name) on the project panel. */
export type TeamSetupStep = {
  id: string;
  position: number;
  status: SetupStatus;
  platform_id: string;
  platform_name: string;
};
export type ProjectSetup = { project_id: string; enabled: boolean; created_at: string };
