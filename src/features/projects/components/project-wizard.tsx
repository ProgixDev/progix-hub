"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  type ActionResult,
  createProjectAction,
  type GithubRepoInfo,
  verifyGithubRepoAction,
} from "../actions";
import { PROJECT_STATUSES, type ProjectStatus } from "../types";

const STEPS = ["stepBasics", "stepGithub", "stepLinks", "stepReview"] as const;

const STATUS_KEY = {
  active: "statusActive",
  at_risk: "statusAtRisk",
  archived: "statusArchived",
} as const satisfies Record<ProjectStatus, string>;

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

type Form = {
  name: string;
  description: string;
  status: ProjectStatus;
  github_url: string;
  notion_url: string;
  slack_url: string;
  live_url: string;
};

/** Full-screen, multi-step project creation — Basics → GitHub → Links → Review. */
export function ProjectWizard({ onClose }: { onClose: () => void }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    name: "",
    description: "",
    status: "active",
    github_url: "",
    notion_url: "",
    slack_url: "",
    live_url: "",
  });
  const [gh, setGh] = useState<GithubRepoInfo | null>(null);
  const [ghChecking, startGh] = useTransition();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const last = step === STEPS.length - 1;
  const canNext = step !== 0 || form.name.trim().length > 0;

  function verify() {
    setGh(null);
    startGh(async () => setGh(await verifyGithubRepoAction(form.github_url)));
  }
  function create() {
    setError(null);
    start(async () => {
      const res: ActionResult = await createProjectAction(form);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="bg-bg fixed inset-0 z-50 flex flex-col">
      <div className="glow-orb" aria-hidden />
      {/* Header + stepper */}
      <header className="border-line flex flex-none items-center justify-between border-b px-5 py-4">
        <h1 className="text-text text-[15px] font-semibold">{t("newProject")}</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label={tCommon("cancel")}
          className="text-text-2 hover:bg-bg-3 hover:text-text grid size-8 place-items-center rounded-full text-[18px]"
        >
          ×
        </button>
      </header>

      <div className="relative mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 py-8">
        <ol className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid size-7 flex-none place-items-center rounded-full text-[12px] font-semibold transition-colors",
                  i < step && "bg-blue text-bg",
                  i === step && "bg-blue-tint text-blue-text ring-blue-ring ring-2",
                  i > step && "border-line-1 text-text-3 border",
                )}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[12px] font-medium sm:inline",
                  i === step ? "text-text" : "text-text-3",
                )}
              >
                {t(s)}
              </span>
              {i < STEPS.length - 1 && <span className="bg-line-1 h-px flex-1" />}
            </li>
          ))}
        </ol>

        {error && (
          <p className="border-red/30 bg-red-tint text-red-text mb-4 rounded-xl border px-3.5 py-2.5 text-[13px]">
            {error}
          </p>
        )}

        {step === 0 && (
          <div className="page-enter flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-text-1 text-[12.5px] font-medium">
                {t("fieldName")} <span className="text-red-text">*</span>
              </span>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-1 text-[12.5px] font-medium">{t("fieldDescription")}</span>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-1 text-[12.5px] font-medium">{t("fieldStatus")}</span>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProjectStatus)}
                className={inputCls}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_KEY[s])}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="page-enter flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-text-1 text-[12.5px] font-medium">GitHub</span>
              <p className="text-text-3 text-[12px]">{t("githubHint")}</p>
              <div className="mt-1 flex gap-2">
                <input
                  value={form.github_url}
                  onChange={(e) => {
                    set("github_url", e.target.value);
                    setGh(null);
                  }}
                  placeholder="https://github.com/ProgixDev/…"
                  className={`${inputCls} font-mono text-[13px]`}
                />
                <button
                  type="button"
                  onClick={verify}
                  disabled={ghChecking || form.github_url.trim().length === 0}
                  className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text h-auto flex-none rounded-xl border px-3.5 text-[13px] font-medium transition-colors disabled:opacity-50"
                >
                  {ghChecking ? t("verifying") : t("verify")}
                </button>
              </div>
            </label>
            {gh?.ok && (
              <div className="border-green/30 bg-green/10 rounded-xl border p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-green-text text-[13px] font-semibold">{gh.full_name}</span>
                  {gh.private && (
                    <span className="border-line-1 text-text-3 rounded-full border px-1.5 py-0.5 text-[10px]">
                      {t("private")}
                    </span>
                  )}
                  <span className="text-text-3 text-[11.5px]">★ {gh.stars}</span>
                </div>
                {gh.description && (
                  <p className="text-text-2 mt-1 text-[12.5px]">{gh.description}</p>
                )}
              </div>
            )}
            {gh && !gh.ok && (
              <p className="text-amber text-[12.5px]">{t(`gh_${gh.error}` as "githubHint")}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="page-enter flex flex-col gap-4">
            {(
              [
                ["notion_url", "Notion", "https://www.notion.so/…"],
                ["slack_url", "Slack", "https://app.slack.com/…"],
                ["live_url", "Live", "https://…"],
              ] as const
            ).map(([key, label, ph]) => (
              <label key={key} className="flex flex-col gap-1.5">
                <span className="text-text-1 text-[12.5px] font-medium">{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={ph}
                  className={`${inputCls} font-mono text-[13px]`}
                />
              </label>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="page-enter">
            <div className="glass rounded-2xl p-4">
              <Row label={t("fieldName")} value={form.name || "—"} />
              {form.description && <Row label={t("fieldDescription")} value={form.description} />}
              <Row label={t("fieldStatus")} value={t(STATUS_KEY[form.status])} />
              {form.github_url && (
                <Row label="GitHub" value={gh?.ok ? gh.full_name : form.github_url} />
              )}
              {form.notion_url && <Row label="Notion" value={form.notion_url} />}
              {form.slack_url && <Row label="Slack" value={form.slack_url} />}
              {form.live_url && <Row label="Live" value={form.live_url} />}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-line flex flex-none items-center justify-between border-t px-5 py-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full px-3.5 text-[13.5px] font-medium transition-colors disabled:opacity-40"
        >
          {t("back")}
        </button>
        {last ? (
          <button
            type="button"
            onClick={create}
            disabled={pending || form.name.trim().length === 0}
            className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
          >
            {pending ? tCommon("saving") : t("createProject")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canNext}
            className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-50"
          >
            {t("next")}
          </button>
        )}
      </footer>
    </div>,
    document.body,
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line/60 flex justify-between gap-4 border-b py-2 text-[13px] last:border-0">
      <span className="text-text-3 flex-none">{label}</span>
      <span className="text-text min-w-0 truncate text-right">{value}</span>
    </div>
  );
}
