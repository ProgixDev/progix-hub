import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOrgMembership, isAllowedMember } from "@/features/auth";

/**
 * GitHub OAuth callback (spec 002). Exchanges the code, verifies ProgixDev membership
 * with the user's GitHub token, and either stamps `app_metadata.is_member` (then refreshes
 * the session so the JWT carries it) or signs the user out with an access-denied message.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const { provider_token: providerToken, user } = data.session;
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
