import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth 2.1 consent decision (spec 024). The consent form posts here; we approve or deny via
 * Supabase Auth as the signed-in user and redirect to the URL Supabase hands back (carrying the
 * authorization code on approval, or an access_denied error on deny). skipBrowserRedirect: true
 * because we redirect server-side, not from a browser context.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const decision = form.get("decision");
  const authorizationId = form.get("authorization_id");
  if (typeof authorizationId !== "string") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const result =
    decision === "approve"
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });

  if (result.error || !result.data) {
    return NextResponse.redirect(new URL("/?error=oauth", request.url));
  }
  return NextResponse.redirect(result.data.redirect_url);
}
