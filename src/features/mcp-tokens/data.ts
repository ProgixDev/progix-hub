import "server-only";
import { createClient } from "@/lib/supabase/server";

export type McpTokenRow = {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

/** The current member's MCP tokens (RLS: own only), newest first. */
export async function listMcpTokens(): Promise<McpTokenRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mcp_tokens")
    .select("id,label,created_at,last_used_at,revoked_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as McpTokenRow[];
}
