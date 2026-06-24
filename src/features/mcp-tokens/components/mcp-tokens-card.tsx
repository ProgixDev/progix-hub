"use client";

import { useState, useTransition } from "react";
import { createTokenAction, revokeTokenAction } from "../actions";
import type { McpTokenRow } from "../data";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-9 w-full rounded-full border px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function McpTokensCard({ tokens }: { tokens: McpTokenRow[] }) {
  const [label, setLabel] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "/api/mcp";

  function create() {
    start(async () => {
      const res = await createTokenAction(label.trim() || "MCP token");
      if (res.ok) {
        setFresh(res.token);
        setLabel("");
      }
    });
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-12 sm:px-6">
      <div className="glass rounded-2xl p-5">
        <h2 className="text-text text-[15px] font-semibold">MCP access</h2>
        <p className="text-text-2 mt-1 text-[12.5px]">
          Give an AI client (Claude Desktop, Claude Code…) a token to draft project plans into your
          playground. It can only touch projects you can access.
        </p>

        <div className="mt-3">
          <p className="text-text-2 text-[11.5px] font-medium tracking-wide uppercase">Endpoint</p>
          <code className="bg-bg-inset border-line-1 text-text-1 mt-1 block rounded-lg border px-3 py-2 font-mono text-[12px] break-all">
            {endpoint}
          </code>
        </div>

        {fresh && (
          <div className="border-line-blue bg-blue-tint mt-4 rounded-xl border p-3">
            <p className="text-blue-text text-[12px] font-medium">
              Copy this now — it won’t be shown again.
            </p>
            <code className="text-text mt-1.5 block font-mono text-[12.5px] break-all select-all">
              {fresh}
            </code>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
            }}
            placeholder="Token name (e.g. Claude Desktop)"
            className={inputCls}
          />
          <button
            type="button"
            onClick={create}
            disabled={pending}
            className="btn-primary h-9 flex-none rounded-full px-4 text-[13px] font-medium transition-all disabled:opacity-60"
          >
            Create token
          </button>
        </div>

        {tokens.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {tokens.map((t) => (
              <li
                key={t.id}
                className="border-line-1 flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-text truncate text-[13px] font-medium">{t.label}</p>
                  <p className="text-text-3 text-[11.5px]">
                    {t.revoked_at
                      ? "Revoked"
                      : t.last_used_at
                        ? `Last used ${t.last_used_at.slice(0, 10)}`
                        : "Never used"}{" "}
                    · created {t.created_at.slice(0, 10)}
                  </p>
                </div>
                {!t.revoked_at && (
                  <button
                    type="button"
                    onClick={() => start(() => revokeTokenAction(t.id).then(() => undefined))}
                    disabled={pending}
                    className="text-text-2 hover:text-red-text h-8 flex-none rounded-full px-3 text-[12.5px] font-medium transition-colors disabled:opacity-60"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
