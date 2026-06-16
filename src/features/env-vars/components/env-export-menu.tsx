"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { exportEnvFileAction } from "../actions";
import { ENV_EXPORT_SCOPES, type EnvExportScope } from "../types";

const headerBtn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text flex h-9 cursor-pointer items-center rounded-md border px-3 text-[13px] font-medium transition-colors select-none";

/** Export the project's variables as a `.env` (All / Backend / Frontend), downloaded via a Blob. */
export function EnvExportMenu({ projectId }: { projectId: string }) {
  const t = useTranslations("envVars");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const label: Record<EnvExportScope, string> = {
    all: t("exportAll"),
    backend: t("scopeBackend"),
    frontend: t("scopeFrontend"),
  };

  function download(scope: EnvExportScope) {
    setError(null);
    if (detailsRef.current) detailsRef.current.open = false;
    start(async () => {
      const res = await exportEnvFileAction(projectId, scope);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const blob = new Blob([res.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }

  return (
    <div className="relative">
      <details ref={detailsRef}>
        <summary className={`${headerBtn} list-none`}>{t("export")}</summary>
        <div className="border-line-1 bg-card absolute right-0 z-20 mt-1 flex w-40 flex-col rounded-md border p-1 shadow-xl">
          {ENV_EXPORT_SCOPES.map((scope) => (
            <button
              key={scope}
              type="button"
              disabled={pending}
              onClick={() => download(scope)}
              className="text-text-1 hover:bg-bg-3 hover:text-text rounded px-2.5 py-1.5 text-left text-[13px] transition-colors disabled:opacity-60"
            >
              {label[scope]}
            </button>
          ))}
        </div>
      </details>
      {error && (
        <p role="alert" className="text-red-text mt-1 max-w-[16rem] text-[11px]">
          {error}
        </p>
      )}
    </div>
  );
}
