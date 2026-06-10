"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createShareLinkAction, revokeShareLinkAction } from "../actions";

const btn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60";

/**
 * The raw link is shown exactly once, right after minting — only its hash is stored, so
 * it can never be re-displayed. Rotate mints a fresh one; revoke closes the portal.
 */
export function ShareLinkManager({
  projectId,
  hasActiveLink,
}: {
  projectId: string;
  hasActiveLink: boolean;
}) {
  const t = useTranslations("portal");
  const [pending, start] = useTransition();
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = hasActiveLink || freshUrl !== null;

  function mint() {
    setError(null);
    start(async () => {
      const res = await createShareLinkAction(projectId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFreshUrl(`${window.location.origin}/share/${res.token}`);
      setCopied(false);
    });
  }

  function onRotate() {
    if (!window.confirm(t("confirmRotate"))) return;
    mint();
  }

  function onRevoke() {
    if (!window.confirm(t("confirmRevoke"))) return;
    setError(null);
    start(async () => {
      const res = await revokeShareLinkAction(projectId);
      if (!res.ok) setError(res.error);
      else setFreshUrl(null);
    });
  }

  async function onCopy() {
    if (!freshUrl) return;
    await navigator.clipboard.writeText(freshUrl);
    setCopied(true);
  }

  return (
    <div className="bg-bg-2 border-line-1 rounded-lg border px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-text text-[13px] font-semibold">{t("shareTitle")}</p>
          <p className="text-text-3 text-[12px]">
            {active ? t("shareHelpActive") : t("shareHelpNone")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {active ? (
            <>
              <span className="text-green border-green/30 bg-green-tint rounded-full border px-2 py-0.5 text-[11px] font-medium">
                {t("linkActive")}
              </span>
              <button type="button" className={btn} disabled={pending} onClick={onRotate}>
                {t("rotateLink")}
              </button>
              <button type="button" className={btn} disabled={pending} onClick={onRevoke}>
                {t("revokeLink")}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={mint}
              className="bg-blue text-primary-foreground hover:bg-blue-hover h-8 rounded-md px-3 text-[12.5px] font-medium transition-colors disabled:opacity-60"
            >
              {t("createLink")}
            </button>
          )}
        </div>
      </div>
      {freshUrl && (
        <div className="border-line/60 mt-3 border-t pt-3">
          <p className="text-amber text-[11.5px]">{t("linkOnce")}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="bg-bg-inset border-line-1 text-text-1 max-w-full overflow-x-auto rounded-md border px-2.5 py-1.5 font-mono text-[12px] break-all">
              {freshUrl}
            </code>
            <button type="button" className={btn} onClick={onCopy}>
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-text mt-2 text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}
