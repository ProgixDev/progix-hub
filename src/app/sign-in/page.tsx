import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { SignInButton } from "@/features/auth";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // A signed-in member never sees the sign-in screen.
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;
  const denied = error === "access_denied";
  const failed = Boolean(error) && !denied;

  return (
    <main className="bg-bg flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark size={22} />
        </div>
        <div className="bg-card border-line rounded-xl border p-7">
          <h1 className="text-text text-lg font-semibold">Sign in</h1>
          <p className="text-text-2 mt-1 text-[13px]">Internal tool — Progix team only.</p>

          {denied && (
            <div className="border-red/30 bg-red-tint mt-4 rounded-md border px-3 py-2.5 text-[13px] text-[#FFB6A2]">
              That account isn’t a member of the Progix organization, so it can’t access progixHub.
            </div>
          )}
          {failed && (
            <div className="border-red/30 bg-red-tint mt-4 rounded-md border px-3 py-2.5 text-[13px] text-[#FFB6A2]">
              Something went wrong signing in. Please try again.
            </div>
          )}

          <div className="mt-5">
            <SignInButton />
          </div>
        </div>
        <p className="text-text-3 mt-5 text-center text-[12px]">
          Access is limited to DigitariaWebs organization members.
        </p>
      </div>
    </main>
  );
}
