"use client";

import { EnvVarsStoreProvider } from "../provider";
import type { EnvVarMeta } from "../types";

/** Env-vars surface for a project (T13 fleshes out rows, reveal/copy, and the add/edit form). */
export function EnvVarsSection({ envVars }: { projectId: string; envVars: EnvVarMeta[] }) {
  return (
    <EnvVarsStoreProvider>
      <section className="mx-auto w-full max-w-5xl px-6 pb-12">
        <h2 className="text-text text-[15px] font-semibold">Environment variables</h2>
        {envVars.length === 0 ? (
          <div className="border-line/60 text-text-3 mt-3 rounded-lg border border-dashed px-4 py-8 text-center text-[13px]">
            No variables yet — add the first one to keep this project’s secrets in one secured
            place.
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {envVars.map((v) => (
              <li key={v.id} className="text-text-2 font-mono text-[13px]">
                {v.key}
              </li>
            ))}
          </ul>
        )}
      </section>
    </EnvVarsStoreProvider>
  );
}
