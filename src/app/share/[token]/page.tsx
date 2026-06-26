import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/logo";
import {
  ShareView,
  getPublicPortal,
  getPublicReleaseNotes,
  getPublicRoadmap,
} from "@/features/portal";

/**
 * The client-facing portal (spec 006, ADR-0010): public route, token-gated inside the
 * data layer. Standalone chrome — no AppShell, no nav into member surfaces (AC-3).
 */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [portal, roadmap, releaseNotes] = await Promise.all([
    getPublicPortal(token),
    getPublicRoadmap(token),
    getPublicReleaseNotes(token),
  ]);
  const t = await getTranslations("portal");

  if (!portal) {
    return (
      <main className="bg-bg flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <Wordmark />
        <h1 className="text-text mt-4 text-[18px] font-semibold">{t("inactiveTitle")}</h1>
        <p className="text-text-2 text-[13.5px]">{t("inactiveBody")}</p>
      </main>
    );
  }

  return (
    <main className="bg-bg min-h-dvh">
      <div className="border-line bg-bg-1 border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <Wordmark />
        </div>
      </div>
      <ShareView portal={portal} roadmap={roadmap} releaseNotes={releaseNotes} token={token} />
    </main>
  );
}
