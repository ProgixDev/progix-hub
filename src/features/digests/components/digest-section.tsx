"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { SparkleIcon } from "@/components/ui/icons";
import { generateDigestAction } from "../actions";
import type { ProjectDigest } from "../types";

/** The project's latest AI weekly digest + a generate button (PM only). spec 038. */
export function DigestSection({
  projectId,
  digest,
  canGenerate,
}: {
  projectId: string;
  digest: ProjectDigest | null;
  canGenerate: boolean;
}) {
  const t = useTranslations("digests");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const res = await generateDigestAction(projectId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6">
      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-text flex items-center gap-1.5 text-[15px] font-semibold">
              <SparkleIcon className="text-text-2 size-4" />
              {t("title")}
            </h2>
            <p className="text-text-3 mt-0.5 text-[12.5px]">{t("subtitle")}</p>
          </div>
          {canGenerate && (
            <button
              type="button"
              onClick={generate}
              disabled={pending}
              className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-9 flex-none rounded-full border px-3.5 text-[13px] font-medium transition-colors disabled:opacity-60"
            >
              {pending ? t("generating") : digest ? t("regenerate") : t("generate")}
            </button>
          )}
        </div>

        {error && (
          <p className="border-red/30 bg-red-tint text-red-text mt-3 rounded-xl border px-3.5 py-2.5 text-[13px]">
            {error}
          </p>
        )}

        {digest ? (
          <>
            <div className="md-body border-line mt-4 border-t pt-4 text-[13.5px]">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{digest.content_md}</ReactMarkdown>
            </div>
            <p className="text-text-3 mt-3 text-[11.5px]">
              {t("meta", {
                date: digest.created_at.slice(0, 10),
                model: digest.model,
              })}
            </p>
          </>
        ) : (
          <p className="text-text-3 mt-4 text-[13px]">
            {canGenerate ? t("emptyManager") : t("empty")}
          </p>
        )}
      </div>
    </section>
  );
}
