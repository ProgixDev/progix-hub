import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Wordmark } from "@/components/brand/logo";
import { getPublicSetup, SetupClientView, SetupPasscodeForm } from "@/features/setup";

/**
 * The client-facing setup page (spec 017): public route, token + passcode validated in the data
 * layer. Standalone chrome — no AppShell, no nav into member surfaces. Nothing renders until the
 * passcode (held in an httpOnly cookie scoped to this link) verifies.
 */
export default async function SetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const jar = await cookies();
  const passcode = jar.get(`setup_pc_${token}`)?.value ?? "";
  const setup = passcode ? await getPublicSetup(token, passcode) : null;
  const t = await getTranslations("setup");

  return (
    <main className="bg-bg min-h-dvh">
      <div className="border-line bg-bg-1 border-b">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
          <Wordmark />
        </div>
      </div>
      {setup ? (
        <SetupClientView token={token} setup={setup} />
      ) : (
        <div className="px-5">
          <SetupPasscodeForm token={token} />
          <p className="text-text-3 mx-auto mt-4 max-w-sm text-center text-[12px]">
            {t("gateHelp")}
          </p>
        </div>
      )}
    </main>
  );
}
