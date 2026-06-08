import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * TEST-ONLY sign-in for e2e (spec 002 plan). Real GitHub OAuth can't run in CI, so this
 * route seeds a verified member session — but ONLY when `E2E_AUTH_BYPASS=1`, which is set
 * solely by the Playwright webServer. In every other environment (incl. production) the
 * env var is unset and this route returns 404, so it is not a reachable backdoor.
 */
const TEST_EMAIL = "e2e-member@progix.test";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2e-progix-member-pw";

export async function GET(request: Request) {
  if (process.env.E2E_AUTH_BYPASS !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { origin } = new URL(request.url);
  const admin = createAdminClient();

  // Ensure a confirmed test user exists, stamped as a verified member.
  const created = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "E2E Member" },
    app_metadata: { is_member: true },
  });

  if (created.error) {
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email === TEST_EMAIL);
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        password: TEST_PASSWORD,
        app_metadata: { is_member: true },
      });
    }
  }

  // Sign in via the server client so @supabase/ssr writes the correct session cookies.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) {
    return new NextResponse(`test-login failed: ${error.message}`, { status: 500 });
  }

  return NextResponse.redirect(`${origin}/`);
}
