import { NextResponse } from "next/server";
import { verifyConsent } from "@/lib/oauth-consent";
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
  const csrf = form.get("csrf");
  if (typeof authorizationId !== "string" || typeof csrf !== "string") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  // Explicit anti-CSRF: the token is bound to (authorization_id, this user) and was rendered on the
  // consent page; a blind cross-site POST can't forge it.
  if (!verifyConsent(csrf, authorizationId, userId)) {
    return NextResponse.redirect(new URL("/?error=oauth", request.url));
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
