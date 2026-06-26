import { NextResponse } from "next/server";
import { globalSearch } from "@/features/search";
import { getCurrentUser } from "@/lib/auth/session";

/** Global search for the ⌘K palette (spec 041). Auth-gated; results are RLS-scoped in the data layer. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ results: [] }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await globalSearch(q);
  return NextResponse.json({ results });
}
