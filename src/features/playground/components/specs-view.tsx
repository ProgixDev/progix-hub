"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";
import type { PlanSpec } from "../types";

const STATUS_TONE: Record<string, string> = {
  draft: "border-line-1 text-text-3",
  active: "border-line-blue bg-blue-tint text-blue-text",
  shipped: "border-green/40 bg-green/10 text-green-text",
  approved: "border-green/40 bg-green/10 text-green-text",
};

/** The playground's Specs lens: specs/PRDs synced from the repo, list + markdown reader. */
export function SpecsView({ specs }: { specs: PlanSpec[] }) {
  const [openId, setOpenId] = useState<string | null>(specs[0]?.id ?? null);
  const open = specs.find((s) => s.id === openId) ?? null;

  if (specs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="glass-strong mx-auto mb-4 grid size-14 place-items-center rounded-2xl text-[22px]">
            📑
          </div>
          <p className="text-text text-[15px] font-semibold">No specs yet</p>
          <p className="text-text-3 mt-1 text-[12.5px] leading-relaxed">
            Sync a repo’s specs with the MCP <code className="text-text">sync_specs</code> tool and
            they’ll appear here alongside the plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* spec list */}
      <aside className="border-line w-72 flex-none overflow-y-auto border-r p-3">
        <ul className="flex flex-col gap-1">
          {specs.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setOpenId(s.id)}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                  s.id === openId ? "bg-bg-inset" : "hover:bg-bg-2",
                )}
              >
                <div className="flex items-center gap-2">
                  {s.number != null && (
                    <span className="text-text-3 font-mono text-[11px]">
                      {String(s.number).padStart(3, "0")}
                    </span>
                  )}
                  <span className="text-text min-w-0 flex-1 truncate text-[13px] font-medium">
                    {s.title}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      STATUS_TONE[s.status] ?? STATUS_TONE.draft,
                    )}
                  >
                    {s.status}
                  </span>
                  <span className="text-text-3 text-[10px] uppercase">{s.kind}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* spec reader */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {open && (
          <article className="mx-auto max-w-3xl px-6 py-8">
            <div className="flex flex-wrap items-center gap-2">
              {open.number != null && (
                <span className="text-text-3 font-mono text-[13px]">
                  {String(open.number).padStart(3, "0")}
                </span>
              )}
              <h1 className="text-text text-[22px] font-semibold">{open.title}</h1>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  STATUS_TONE[open.status] ?? STATUS_TONE.draft,
                )}
              >
                {open.status}
              </span>
            </div>
            <p className="text-text-3 mt-1 text-[11.5px]">
              {open.kind.toUpperCase()} · updated {open.updated_at.slice(0, 10)}
            </p>
            <div className="md-body border-line mt-5 border-t pt-5">
              {open.body_md ? (
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{open.body_md}</ReactMarkdown>
              ) : (
                <p className="text-text-3 text-[13px]">No content.</p>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
