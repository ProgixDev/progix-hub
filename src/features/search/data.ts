import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SearchResult } from "./types";

type Row = {
  kind: SearchResult["kind"];
  id: string;
  title: string;
  subtitle: string | null;
  project_id: string | null;
};
type MemberRow = { user_id: string; email: string | null; display_name: string | null };

/** Search projects, docs, specs, tasks, tutorials (RLS-scoped RPC) + org members, by name/title. */
export async function globalSearch(q: string): Promise<SearchResult[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const supabase = await createClient();

  const [main, members] = await Promise.all([
    supabase.rpc("global_search", { q: term }),
    supabase.rpc("list_org_members"),
  ]);

  const out: SearchResult[] = ((main.data ?? []) as Row[]).map((r) => ({
    kind: r.kind,
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    project_id: r.project_id,
  }));

  // Members are searched in-app (list_org_members is the org directory RPC, not in global_search).
  const lc = term.toLowerCase();
  const memberHits = ((members.data ?? []) as MemberRow[])
    .filter(
      (m) =>
        (m.display_name ?? "").toLowerCase().includes(lc) ||
        (m.email ?? "").toLowerCase().includes(lc),
    )
    .slice(0, 6)
    .map((m) => ({
      kind: "member" as const,
      id: m.user_id,
      title: m.display_name || m.email || "Member",
      subtitle: m.email,
      project_id: null,
    }));

  return [...out, ...memberHits];
}
