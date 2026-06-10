"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import { EnvVarsStoreProvider, useEnvVarsStore } from "../provider";
import type { AuditRow, EnvVarMeta } from "../types";
import { EnvVarForm } from "./env-var-form";
import { EnvVarRow } from "./env-var-row";

const ACTION_KEY: Record<AuditRow["action"], string> = {
  create: "actionAdded",
  edit: "actionEdited",
  delete: "actionDeleted",
  reveal: "actionRevealed",
  copy: "actionCopied",
};

export function EnvVarsSection({
  projectId,
  envVars,
  audit,
}: {
  projectId: string;
  envVars: EnvVarMeta[];
  audit: AuditRow[];
}) {
  const t = useTranslations("envVars");
  return (
    <EnvVarsStoreProvider>
      <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6">
        <Header />
        {envVars.length === 0 ? (
          <div className="border-line/60 text-text-3 mt-3 rounded-lg border border-dashed px-4 py-10 text-center text-[13px]">
            {t("empty")}
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {envVars.map((v) => (
              <EnvVarRow key={v.id} envVar={v} projectId={projectId} />
            ))}
          </ul>
        )}

        {audit.length > 0 && <AuditTrail audit={audit} />}
        <EnvVarForm projectId={projectId} />
      </section>
    </EnvVarsStoreProvider>
  );
}

function Header() {
  const t = useTranslations("envVars");
  const openCreate = useEnvVarsStore((s) => s.openCreate);
  const hideAll = useEnvVarsStore((s) => s.hideAll);
  const anyRevealed = useEnvVarsStore((s) => Object.keys(s.revealed).length > 0);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
        <p className="text-text-3 text-[12px]">{t("subtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {anyRevealed && (
          <button
            type="button"
            onClick={hideAll}
            className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-9 rounded-md border px-3 text-[13px] font-medium transition-colors"
          >
            {t("hideAll")}
          </button>
        )}
        <button
          type="button"
          onClick={openCreate}
          className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-3.5 text-[13px] font-medium transition-colors"
        >
          {t("addVariable")}
        </button>
      </div>
    </div>
  );
}

function AuditTrail({ audit }: { audit: AuditRow[] }) {
  const t = useTranslations("envVars");
  const locale = useLocale();
  return (
    <details className="border-line-1 mt-6 rounded-lg border">
      <summary className="text-text-2 hover:text-text cursor-pointer px-4 py-3 text-[13px] font-medium">
        {t("recentActivity", { count: audit.length })}
      </summary>
      <ul className="border-line/60 divide-line/60 divide-y border-t">
        {audit.map((row) => (
          <li
            key={row.id}
            className="text-text-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 text-[12px]"
          >
            <span className="min-w-0 break-all">
              <span className="text-text font-medium">{row.actor_email ?? t("someone")}</span>{" "}
              {t(ACTION_KEY[row.action])}{" "}
              <span className="text-text font-mono">{row.env_var_key}</span>
            </span>
            <time
              dateTime={row.created_at}
              suppressHydrationWarning
              className="text-text-3 flex-none font-mono"
            >
              {formatDate(new Date(row.created_at), locale)}
            </time>
          </li>
        ))}
      </ul>
    </details>
  );
}
