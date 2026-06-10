import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PortalAttachment, PortalBlock, PortalCard, PortalComment, ShareLink } from "./types";

export type MemberPortal = {
  blocks: PortalBlock[];
  cards: PortalCard[];
  comments: PortalComment[];
  attachments: (PortalAttachment & { file_path: string })[];
  shareLink: ShareLink | null;
};

/** The member-side portal tree, scoped by the member's RLS session. */
export async function getPortal(projectId: string): Promise<MemberPortal> {
  const supabase = await createClient();
  const [blocks, cards, comments, attachments, link] = await Promise.all([
    supabase
      .from("portal_blocks")
      .select("*")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("position")
      .order("created_at"),
    supabase
      .from("portal_cards")
      .select("*")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("created_at"),
    supabase
      .from("portal_comments")
      .select("id, card_id, author_kind, author_name, body, created_at")
      .eq("project_id", projectId)
      .order("created_at"),
    supabase
      .from("portal_attachments")
      .select("id, card_id, file_path, file_name, file_size, file_mime, author_name, created_at")
      .eq("project_id", projectId)
      .order("created_at"),
    supabase
      .from("portal_share_links")
      .select("id, project_id, revoked_at, created_at")
      .eq("project_id", projectId)
      .is("revoked_at", null)
      .maybeSingle(),
  ]);
  const firstError =
    blocks.error ?? cards.error ?? comments.error ?? attachments.error ?? link.error;
  if (firstError) throw new Error(firstError.message);

  return {
    blocks: (blocks.data ?? []) as PortalBlock[],
    cards: (cards.data ?? []) as PortalCard[],
    comments: (comments.data ?? []) as PortalComment[],
    attachments: (attachments.data ?? []) as (PortalAttachment & { file_path: string })[],
    shareLink: (link.data ?? null) as ShareLink | null,
  };
}
