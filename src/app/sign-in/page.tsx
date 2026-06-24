import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { EmailSignInForm, SignInButton } from "@/features/auth";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // A signed-in member never sees the sign-in screen.
  if (await getCurrentUser()) redirect("/");

  const t = await getTranslations("signIn");
  const { error } = await searchParams;
  const denied = error === "access_denied";
  const failed = Boolean(error) && !denied;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="relative mb-8 flex justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--blue-glow),transparent)] opacity-50 blur-2xl"
          />
          <Wordmark size={30} />
        </div>
        <div className="glass-strong rounded-2xl p-7">
          <h1 className="text-text text-xl font-semibold tracking-[-0.01em]">{t("title")}</h1>
          <p className="text-text-2 mt-1.5 text-[13px]">{t("subtitle")}</p>

          {denied && (
            <div className="border-red/30 bg-red-tint text-red-text mt-4 rounded-xl border px-3.5 py-2.5 text-[13px]">
              {t("accessDenied")}
            </div>
          )}
          {failed && (
            <div className="border-red/30 bg-red-tint text-red-text mt-4 rounded-xl border px-3.5 py-2.5 text-[13px]">
              {t("somethingWrong")}
            </div>
          )}

          <div className="mt-6">
            <SignInButton />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="bg-line h-px flex-1" />
            <span className="text-text-3 text-[12px]">{t("or")}</span>
            <span className="bg-line h-px flex-1" />
          </div>

          <EmailSignInForm />
        </div>
        <p className="text-text-3 mt-5 text-center text-[12px]">{t("limited")}</p>
      </div>
    </main>
  );
}
