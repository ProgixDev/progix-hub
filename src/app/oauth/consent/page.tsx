import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SCOPE_LABELS: Record<string, string> = {
  openid: "Confirm your identity",
  profile: "Read your basic profile",
  email: "Read your email address",
};

/**
 * OAuth 2.1 consent screen (spec 024). Supabase Auth (the authorization server) redirects the user
 * here with an `authorization_id`; we confirm the session, show what the app wants, and approve or
 * deny via the decision route. Tools are still gated per-project downstream — consent only grants a
 * token that acts AS this user.
 */
export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  const { authorization_id: authId } = await searchParams;
  if (!authId) redirect("/");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    redirect(`/sign-in?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authId}`)}`);
  }

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authId);
  if (error || !data) redirect("/?error=oauth");
  // Already consented → Supabase hands back a ready redirect URL.
  if (!("authorization_id" in data)) redirect(data.redirect_url);

  const scopes = data.scope.split(" ").filter(Boolean);

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="glow-orb" aria-hidden />
      <div className="glass-strong spotlight relative w-full max-w-md rounded-2xl p-6 sm:p-7">
        <p className="text-text-3 text-[11.5px] font-medium tracking-wide uppercase">Authorize</p>
        <h1 className="text-text mt-1 text-[20px] font-semibold">{data.client.name}</h1>
        <p className="text-text-2 mt-2 text-[13px] leading-relaxed">
          <span className="text-text font-medium">{data.client.name}</span> wants to connect to your
          ProgixHub account. It will be able to act on your behalf — and only ever reach the
          projects you can access.
        </p>

        <div className="border-line-1 mt-5 rounded-xl border p-3.5">
          <p className="text-text-2 text-[11.5px] font-medium tracking-wide uppercase">
            This will allow it to
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {scopes.length > 0 ? (
              scopes.map((s) => (
                <li key={s} className="text-text flex items-center gap-2 text-[13px]">
                  <span className="bg-blue size-1.5 flex-none rounded-full" aria-hidden />
                  {SCOPE_LABELS[s] ?? s}
                </li>
              ))
            ) : (
              <li className="text-text flex items-center gap-2 text-[13px]">
                <span className="bg-blue size-1.5 flex-none rounded-full" aria-hidden />
                Access your account
              </li>
            )}
          </ul>
        </div>

        <p className="text-text-3 mt-3 text-[11.5px] break-all">Redirects to {data.redirect_uri}</p>

        <form action="/api/oauth/decision" method="post" className="mt-5 flex items-center gap-2.5">
          <input type="hidden" name="authorization_id" value={authId} />
          <button
            type="submit"
            name="decision"
            value="deny"
            className="border-line-1 text-text-2 hover:text-text h-11 flex-1 rounded-full border text-[13px] font-medium transition-colors"
          >
            Deny
          </button>
          <button
            type="submit"
            name="decision"
            value="approve"
            className="btn-primary h-11 flex-1 rounded-full text-[13px] font-semibold transition-all"
          >
            Approve
          </button>
        </form>
      </div>
    </main>
  );
}
