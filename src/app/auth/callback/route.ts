import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOrgMembership, isAllowedMember } from "@/features/auth";
import { githubLoginFromIdentities, isIdentityAlreadyLinked } from "@/features/members";

/**
 * GitHub OAuth callback. Two flows share this route:
 *  - sign-in (spec 002): exchange the code, verify ProgixDev membership with the GitHub token, and
 *    either stamp `app_metadata.is_member` (then refresh so the JWT carries it) or sign out.
 *  - link (`?flow=link`, spec 012): the user is already a signed-in member connecting GitHub —
 *    capture their GitHub username into user metadata and return to the profile. A GitHub account
 *    already linked to someone else is reported with `?error=github_linked` (AC-7).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const isLink = searchParams.get("flow") === "link";
  if (!code) {
    return NextResponse.redirect(`${origin}/${isLink ? "profile" : "sign-in"}?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    if (isLink) {
      const reason = isIdentityAlreadyLinked(error) ? "github_linked" : "auth";
      return NextResponse.redirect(`${origin}/profile?error=${reason}`);
    }
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const { provider_token: providerToken, user } = data.session;

  // Link flow (spec 012): they're already a member. Capture the GitHub login from the freshly
  // linked identity (so the directory + profile show it) and go back to the profile — no gate.
  if (isLink) {
    const login = githubLoginFromIdentities(user.identities);
    if (login) {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, user_name: login },
      });
      await supabase.auth.refreshSession();
    }
    return NextResponse.redirect(`${origin}/profile`);
  }

  const membership = providerToken ? await fetchOrgMembership(providerToken) : null;

  if (!isAllowedMember(membership)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/sign-in?error=access_denied`);
  }

  // Verified member → stamp non-user-editable membership, then refresh so the JWT carries it.
  const admin = createAdminClient();
  const stamp = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { is_member: true },
  });
  if (stamp.error) {
    // Don't drop the user into a silently RLS-denied session — fail closed.
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }
  await supabase.auth.refreshSession();

  return NextResponse.redirect(`${origin}/`);
}
