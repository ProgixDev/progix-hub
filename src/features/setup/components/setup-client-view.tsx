"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Badge } from "@/components/ui/badge";
import { markStepAction } from "../public-actions";
import { videoEmbedSrc } from "../lib";
import type { PublicSetup, SetupStep } from "../types";

/** The client's guided checklist (spec 017). Renders the access action + video per step; the client
 * ticks steps done. No member chrome, nothing sensitive. */
export function SetupClientView({ token, setup }: { token: string; setup: PublicSetup }) {
  const t = useTranslations("setup");
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8">
      <h1 className="text-text text-[20px] font-semibold">
        {t("clientTitle", { project: setup.project_name })}
      </h1>
      <p className="text-text-2 mt-1 text-[13.5px]">{t("clientIntro")}</p>
      <ol className="mt-6 flex flex-col gap-4">
        {setup.steps.map((step, i) => (
          <StepCard key={step.id} token={token} step={step} index={i + 1} />
        ))}
      </ol>
    </div>
  );
}

function StepCard({ token, step, index }: { token: string; step: SetupStep; index: number }) {
  const t = useTranslations("setup");
  const router = useRouter();
  const [pending, start] = useTransition();
  const p = step.platform;
  const done = step.status !== "pending";
  const videos = p.videos
    .map((v) => ({ label: v.label, src: videoEmbedSrc(v.embed_url), body_md: v.body_md }))
    .filter(
      (v): v is { label: string | null; src: string; body_md: string | null } => v.src !== null,
    );

  function toggle() {
    start(async () => {
      const res = await markStepAction(token, step.id, step.status === "pending");
      if (res.ok) router.refresh();
    });
  }

  return (
    <li className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-text text-[15px] font-semibold">
          {index}. {p.name}
          {p.critical && (
            <Badge tone="amber" className="ml-2 align-middle">
              {t("criticalBadge")}
            </Badge>
          )}
        </h2>
        {step.status === "verified" ? (
          <Badge tone="green">{t("step_verified")}</Badge>
        ) : (
          <label className="flex flex-none items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              className="size-4"
              checked={done}
              disabled={pending}
              onChange={toggle}
            />
            <span className="text-text-2">{t("markDone")}</span>
          </label>
        )}
      </div>

      {videos.map((v, i) => (
        <div key={i} className="mt-3">
          {v.label && <p className="text-text-2 mb-1 text-[12.5px] font-medium">{v.label}</p>}
          <div className="border-line-1 aspect-video w-full overflow-hidden rounded-lg border bg-black">
            <iframe
              src={v.src}
              title={v.label ?? p.name}
              className="size-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          {v.body_md && (
            <div className="md-body border-line-1 mt-2 rounded-lg border px-3.5 py-3 text-[13px]">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{v.body_md}</ReactMarkdown>
            </div>
          )}
        </div>
      ))}

      {p.steps.length > 0 && (
        <ol className="text-text-2 mt-3 list-decimal space-y-1 pl-5 text-[13px]">
          {p.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}

      {p.access_pattern === "invite_collaborator" && p.invite_url && (
        <div className="border-line/60 mt-3 rounded-lg border border-dashed p-3 text-[13px]">
          <p className="text-text-2">
            {t("inviteInstruction", { email: p.invite_email ?? "", role: p.invite_role ?? "" })}
          </p>
          <a
            href={p.invite_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-2 inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-all"
          >
            {t("openInviteSettings")}
          </a>
        </div>
      )}

      {p.access_pattern === "store_key" && p.key_label && (
        <p className="border-line/60 text-text-2 mt-3 rounded-lg border border-dashed p-3 text-[13px]">
          {t("keyInstruction", { label: p.key_label })}
        </p>
      )}
    </li>
  );
}
