"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteEnvVarAction, revealEnvVarValueAction } from "../actions";
import { useEnvVarsStore } from "../provider";
import type { EnvVarMeta } from "../types";
import { ServiceLogo } from "./service-logo";

const btn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60";

export function EnvVarRow({ envVar, projectId }: { envVar: EnvVarMeta; projectId: string }) {
  const t = useTranslations("envVars");
  const tCommon = useTranslations("common");
  const revealed = useEnvVarsStore((s) => s.revealed[envVar.id]);
  const setRevealed = useEnvVarsStore((s) => s.setRevealed);
  const hideValue = useEnvVarsStore((s) => s.hideValue);
  const openEdit = useEnvVarsStore((s) => s.openEdit);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function access(intent: "reveal" | "copy") {
    setError(null);
    start(async () => {
      const res = await revealEnvVarValueAction(envVar.id, intent);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (intent === "copy") {
        await navigator.clipboard.writeText(res.value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } else {
        setRevealed(envVar.id, res.value);
      }
    });
  }

  function onDelete() {
    if (!window.confirm(t("confirmDelete", { key: envVar.key }))) return;
    start(async () => {
      const res = await deleteEnvVarAction(envVar.id, projectId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="bg-bg-2 border-line-1 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3.5 py-2.5">
      <ServiceLogo service={envVar.service} />
      <div className="min-w-0 flex-1">
        <p className="text-text font-mono text-[13px] font-medium break-all">{envVar.key}</p>
        <p className="text-text-2 truncate font-mono text-[12px]" aria-label="value">
          {revealed ?? "••••••••••••"}
        </p>
        {error && (
          <p role="alert" className="text-red-text text-[11px]">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={btn}
          disabled={pending}
          aria-pressed={Boolean(revealed)}
          aria-label={`${revealed ? t("hide") : t("reveal")} ${envVar.key}`}
          onClick={() => (revealed ? hideValue(envVar.id) : access("reveal"))}
        >
          {revealed ? t("hide") : t("reveal")}
        </button>
        <button
          type="button"
          className={btn}
          disabled={pending}
          aria-label={`${copied ? t("copied") : t("copy")} ${envVar.key}`}
          onClick={() => access("copy")}
        >
          {copied ? t("copied") : t("copy")}
        </button>
        <button
          type="button"
          className={btn}
          aria-label={`${tCommon("edit")} ${envVar.key}`}
          onClick={() => openEdit(envVar)}
        >
          {tCommon("edit")}
        </button>
        <button
          type="button"
          className={btn}
          disabled={pending}
          aria-label={`${tCommon("delete")} ${envVar.key}`}
          onClick={onDelete}
        >
          {tCommon("delete")}
        </button>
      </div>
    </li>
  );
}
