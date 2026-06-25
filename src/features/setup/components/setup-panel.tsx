"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  type CreateResult,
  createSetupAction,
  rotateSetupAction,
  setSetupEnabledAction,
  updateSetupAction,
  verifyStepAction,
} from "../actions";
import type { ProjectSetup, SetupStatus, TeamSetupStep } from "../types";

export type PlatformOption = { id: string; name: string };

const STATUS_TONE: Record<SetupStatus, "neutral" | "amber" | "green"> = {
  pending: "neutral",
  client_done: "amber",
  verified: "green",
};

/** Project-page panel to build + manage the client setup page (spec 017). Managers only. */
export function SetupPanel({
  projectId,
  platforms,
  setup,
  steps,
}: {
  projectId: string;
  platforms: PlatformOption[];
  setup: ProjectSetup | null;
  steps: TeamSetupStep[];
}) {
  const t = useTranslations("setup");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [issued, setIssued] = useState<{ token: string; passcode: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPicked, setEditPicked] = useState<string[]>([]);

  function handleResult(res: CreateResult) {
    if (res.ok) setIssued({ token: res.token, passcode: res.passcode });
    else setError(res.error);
  }

  function create() {
    setError(null);
    start(async () => handleResult(await createSetupAction(projectId, picked)));
  }
  function rotate() {
    setError(null);
    start(async () => handleResult(await rotateSetupAction(projectId)));
  }
  function toggleEnabled() {
    setError(null);
    start(async () => {
      const res = await setSetupEnabledAction(projectId, !(setup?.enabled ?? false));
      if (!res.ok) setError(res.error);
    });
  }
  function verify(step: TeamSetupStep) {
    setError(null);
    start(async () => {
      const res = await verifyStepAction(projectId, step.id, step.status !== "verified");
      if (!res.ok) setError(res.error);
    });
  }
  function startEdit() {
    setError(null);
    setIssued(null);
    setEditPicked(steps.map((s) => s.platform_id));
    setEditing(true);
  }
  function saveEdit() {
    setError(null);
    start(async () => {
      const res = await updateSetupAction(projectId, editPicked);
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  }

  const link = issued
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/setup/${issued.token}`
    : null;

  return (
    <section className="glass mt-6 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
        {setup && (
          <Badge tone={setup.enabled ? "green" : "neutral"}>
            {setup.enabled ? t("statusActive") : t("statusDisabled")}
          </Badge>
        )}
      </div>
      <p className="text-text-3 mt-0.5 text-[12.5px]">{t("subtitle")}</p>

      {error && (
        <p role="alert" className="text-red-text mt-3 text-[12px]">
          {error}
        </p>
      )}

      {issued && link && (
        <div className="border-green/30 bg-green/10 mt-4 rounded-lg border p-3.5">
          <p className="text-text text-[12.5px] font-medium">{t("issuedTitle")}</p>
          <p className="text-text-3 mt-0.5 text-[11.5px]">{t("issuedHint")}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <code className="bg-bg-inset text-text rounded px-2 py-1.5 font-mono text-[12px] break-all">
              {link}
            </code>
            <code className="bg-bg-inset text-text w-fit rounded px-2 py-1.5 font-mono text-[14px] tracking-widest">
              {issued.passcode}
            </code>
          </div>
        </div>
      )}

      {!setup ? (
        <div className="mt-4">
          {platforms.length === 0 ? (
            <p className="text-text-3 text-[12.5px]">{t("noPlatforms")}</p>
          ) : (
            <>
              <p className="text-text-2 mb-2 text-[12.5px]">{t("pickPlatforms")}</p>
              <div className="flex flex-col gap-1.5">
                {platforms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={picked.includes(p.id)}
                      onChange={(e) =>
                        setPicked((prev) =>
                          e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                        )
                      }
                    />
                    <span className="text-text">{p.name}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                disabled={pending || picked.length === 0}
                onClick={create}
                className="btn-primary mt-3 h-9 rounded-full px-3.5 text-[13px] font-medium transition-all disabled:opacity-60"
              >
                {t("create")}
              </button>
            </>
          )}
        </div>
      ) : editing ? (
        <div className="mt-4">
          <p className="text-text-2 text-[12.5px]">{t("pickPlatforms")}</p>
          <p className="text-text-3 mt-0.5 mb-2 text-[11.5px]">{t("editHint")}</p>
          <div className="flex flex-col gap-1.5">
            {platforms.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={editPicked.includes(p.id)}
                  onChange={(e) =>
                    setEditPicked((prev) =>
                      e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                    )
                  }
                />
                <span className="text-text">{p.name}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending || editPicked.length === 0}
              onClick={saveEdit}
              className="btn-primary h-9 rounded-full px-3.5 text-[13px] font-medium transition-all disabled:opacity-60"
            >
              {t("save")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
              className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-9 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <ul className="divide-line/60 glass divide-y rounded-2xl">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                <span className="text-text truncate text-[13px]">{s.platform_name}</span>
                <div className="flex flex-none items-center gap-2">
                  <Badge tone={STATUS_TONE[s.status]}>{t(`step_${s.status}`)}</Badge>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => verify(s)}
                    className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-full border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
                  >
                    {s.status === "verified" ? t("unverify") : t("verify")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={startEdit}
              className="btn-primary h-9 rounded-full px-3.5 text-[13px] font-medium transition-all disabled:opacity-60"
            >
              {t("editPlatforms")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={rotate}
              className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
            >
              {t("rotate")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={toggleEnabled}
              className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-9 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
            >
              {setup.enabled ? t("disable") : t("enable")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
