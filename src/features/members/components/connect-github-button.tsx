"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { GitHubGlyph } from "@/components/brand/surface-glyphs";
import { createClient } from "@/lib/supabase/client";
import { linkCallbackUrl } from "../connect";

/**
 * Links the signed-in member's GitHub account (spec 012 AC-1) via Supabase manual identity
 * linking. Shown on the member's own profile when no GitHub is connected. On success the browser
 * is redirected into the GitHub flow; on a start error we surface a friendly message.
 */
export function ConnectGitHubButton() {
  const t = useTranslations("members");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: "github",
      options: { scopes: "read:org", redirectTo: linkCallbackUrl(window.location.origin) },
    });
    if (linkError) {
      setError(t("connectError"));
      setLoading(false);
    }
  }

  return (
    <div className="border-line/60 flex flex-col items-start gap-2 rounded-lg border border-dashed px-4 py-4">
      <p className="text-text-2 text-[12.5px]">{t("connectPrompt")}</p>
      <button
        type="button"
        onClick={connect}
        disabled={loading}
        className="bg-bg-2 border-line-1 hover:bg-bg-3 text-text flex h-10 items-center justify-center gap-2.5 rounded-md border px-4 text-[13px] font-medium transition-colors disabled:opacity-60"
      >
        <GitHubGlyph size={16} />
        {loading ? t("connecting") : t("connectGithub")}
      </button>
      {error && (
        <p role="alert" className="text-red-text text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}
