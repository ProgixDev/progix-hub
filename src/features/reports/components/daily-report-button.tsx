"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { type ActionResult, createReportAction, listReportableProjectsAction } from "../actions";
import type { ReportableProject } from "../types";

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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            <div className="glow-orb" aria-hidden />
            <form onSubmit={onSubmit} className="relative flex min-h-0 flex-1 flex-col">
              {/* header */}
              <header className="border-line flex flex-none flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <ReportIcon className="text-text-2 size-4" />
                  <h1 className="text-text text-[15px] font-semibold">{t("title")}</h1>
                </div>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="bg-bg-inset border-line-1 focus:border-line-blue text-text h-9 max-w-[14rem] rounded-full border px-3 text-[13px] outline-none"
                >
                  {projects.length === 0 && <option value="">{t("noProjects")}</option>}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-text-2 hover:text-text hidden h-9 items-center rounded-full px-3 text-[12.5px] font-medium transition-colors sm:flex"
                  >
                    {t("loadFile")}
                  </button>
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
                </div>
              </header>

              {error && (
                <p className="border-red/30 bg-red-tint text-red-text mx-4 mt-3 rounded-xl border px-3.5 py-2.5 text-[13px] sm:mx-5">
                  {error}
                </p>
              )}

              {/* editor + live preview */}
              <div className="grid min-h-0 flex-1 lg:grid-cols-2">
                <div className="flex min-h-0 flex-col border-[var(--line)] lg:border-r">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("contentHint")}
                    autoFocus
                    className="text-text placeholder:text-text-3 min-h-0 flex-1 resize-none bg-transparent px-4 py-4 font-mono text-[13.5px] leading-relaxed outline-none sm:px-6"
                  />
                </div>
                <div className="hidden min-h-0 overflow-y-auto px-6 py-4 lg:block">
                  {content.trim() ? (
                    <div className="md-body mx-auto max-w-2xl">
                      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-text-3 text-[13px]">{t("previewHint")}</p>
                  )}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                onChange={onFile}
                className="hidden"
              />
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}
