"use client";

import { EnvVarsStoreProvider, useEnvVarsStore } from "../provider";
import type { AuditRow, EnvVarMeta } from "../types";
import { EnvVarForm } from "./env-var-form";
import { EnvVarRow } from "./env-var-row";

const ACTION_LABEL: Record<AuditRow["action"], string> = {
  create: "added",
  edit: "edited",
  delete: "deleted",
  reveal: "revealed",
  copy: "copied",
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
  return (
    <EnvVarsStoreProvider>
      <section className="mx-auto w-full max-w-5xl px-6 pb-12">
        <Header />
        {envVars.length === 0 ? (
          <div className="border-line/60 text-text-3 mt-3 rounded-lg border border-dashed px-4 py-10 text-center text-[13px]">
            No variables yet — add the first one to keep this project’s secrets in one secured
            place.
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
  const openCreate = useEnvVarsStore((s) => s.openCreate);
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-text text-[15px] font-semibold">Environment variables</h2>
        <p className="text-text-3 text-[12px]">
          Encrypted at rest · revealed and copied are audited.
        </p>
      </div>
      <button
        type="button"
        onClick={openCreate}
        className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-3.5 text-[13px] font-medium transition-colors"
      >
        Add variable
      </button>
    </div>
  );
}

function AuditTrail({ audit }: { audit: AuditRow[] }) {
  return (
    <details className="border-line-1 mt-6 rounded-lg border">
      <summary className="text-text-2 hover:text-text cursor-pointer px-4 py-3 text-[13px] font-medium">
        Recent activity ({audit.length})
      </summary>
      <ul className="border-line/60 divide-line/60 divide-y border-t">
        {audit.map((row) => (
          <li
            key={row.id}
            className="text-text-2 flex items-center justify-between gap-3 px-4 py-2 text-[12px]"
          >
            <span>
              <span className="text-text font-medium">{row.actor_email ?? "Someone"}</span>{" "}
              {ACTION_LABEL[row.action]}{" "}
              <span className="text-text font-mono">{row.env_var_key}</span>
            </span>
            <time className="text-text-3 flex-none font-mono">
              {new Date(row.created_at).toLocaleString()}
            </time>
          </li>
        ))}
      </ul>
    </details>
  );
}
