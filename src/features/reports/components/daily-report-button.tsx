"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { type ActionResult, createReportAction, listReportableProjectsAction } from "../actions";
import type { ReportableProject } from "../types";

const fieldCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 3.5h7L18 7v13.5H7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 3.5V7.5H18M9.5 12h6M9.5 15.5h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Top-bar action: open a modal to post a daily markdown report against a project (spec 021). */
export function DailyReportButton() {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ReportableProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function openModal() {
    start(async () => {
      const list = await listReportableProjectsAction();
      setProjects(list);
      setProjectId(list[0]?.id ?? "");
      setContent("");
      setError(null);
      setOpen(true);
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => setContent(text));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res: ActionResult = await createReportAction({
        project_id: projectId,
        content_md: content,
      });
      if (res.ok) setOpen(false);
      else setError(res.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={t("button")}
        className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text flex h-9 items-center gap-2 rounded-full border px-2.5 text-[12.5px] font-medium transition-colors sm:px-3.5"
      >
        <ReportIcon className="size-4" />
        <span className="hidden md:inline">{t("button")}</span>
      </button>

      {open && (
        <Modal
          title={t("title")}
          description={t("subtitle")}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
          footer={
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full px-3.5 text-[13.5px] font-medium transition-colors"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="submit"
                disabled={pending || !projectId || !content.trim()}
                className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
              >
                {pending ? tCommon("saving") : t("save")}
              </button>
            </>
          }
        >
          {error && (
            <p className="border-red/30 bg-red-tint text-red-text rounded-xl border px-3.5 py-2.5 text-[13px]">
              {error}
            </p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-text-1 text-[12.5px] font-medium">{t("fieldProject")}</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={fieldCls}
            >
              {projects.length === 0 && <option value="">{t("noProjects")}</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-1 text-[12.5px] font-medium">{t("fieldContent")}</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-blue-text hover:text-blue-hover text-[12px] font-medium"
              >
                {t("loadFile")}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder={t("contentHint")}
              className={`${fieldCls} resize-y font-mono text-[13px] leading-relaxed`}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              onChange={onFile}
              className="hidden"
            />
          </label>
        </Modal>
      )}
    </>
  );
}
