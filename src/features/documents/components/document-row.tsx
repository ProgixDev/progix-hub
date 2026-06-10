"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import {
  archiveDocumentAction,
  getDocumentDownloadUrlAction,
  restoreDocumentAction,
} from "../actions";
import { formatBytes, mimeLabel } from "../lib";
import { useDocumentsStore } from "../provider";
import { isHttpUrl, type ProjectDocument } from "../types";
import { NoteBody } from "./note-body";

const btn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60";

export function DocumentRow({
  doc,
  projectId,
  archived = false,
  canWrite = true,
}: {
  doc: ProjectDocument;
  projectId: string;
  archived?: boolean;
  canWrite?: boolean;
}) {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const openEdit = useDocumentsStore((s) => s.openEdit);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onArchive() {
    if (!window.confirm(t("confirmArchive", { title: doc.title }))) return;
    start(async () => {
      const res = await archiveDocumentAction(doc.id, projectId);
      if (!res.ok) setError(res.error);
    });
  }

  function onRestore() {
    start(async () => {
      const res = await restoreDocumentAction(doc.id, projectId);
      if (!res.ok) setError(res.error);
    });
  }

  function onDownload() {
    setError(null);
    start(async () => {
      const res = await getDocumentDownloadUrlAction(doc.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  const date = <time suppressHydrationWarning>{formatDate(new Date(doc.created_at), locale)}</time>;
  // Who added it (AC-1/2/3) — stamped at write time, may be null for older rows.
  const by = doc.created_by_email ? <>{doc.created_by_email} · </> : null;

  return (
    <li className="bg-bg-2 border-line-1 rounded-lg border px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {doc.kind === "file" && (
            <>
              <p className="text-text truncate text-[13px] font-medium">{doc.title}</p>
              <p className="text-text-3 text-[11px]">
                {mimeLabel(doc.file_mime) ?? t("fileFallback")} · {formatBytes(doc.file_size)} ·{" "}
                {by}
                {date}
              </p>
            </>
          )}
          {doc.kind === "link" && (
            <>
              <a
                href={isHttpUrl(doc.url) ? doc.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:text-blue-text text-[13px] font-medium break-words"
              >
                {doc.title}
              </a>
              <p className="text-text-2 truncate font-mono text-[11px] break-all">{doc.url}</p>
              <p className="text-text-3 text-[11px]">
                {by}
                {date}
              </p>
            </>
          )}
          {doc.kind === "note" && (
            <>
              <p className="text-text text-[13px] font-medium break-words">{doc.title}</p>
              <div className="mt-1">
                <NoteBody body={doc.body ?? ""} />
              </div>
              <p className="text-text-3 mt-1 text-[11px]">
                {by}
                {date}
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="text-red-text text-[11px]">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-none flex-wrap items-center justify-end gap-1.5">
          {archived ? (
            canWrite && (
              <button
                type="button"
                className={btn}
                disabled={pending}
                aria-label={`${tCommon("restore")} ${doc.title}`}
                onClick={onRestore}
              >
                {tCommon("restore")}
              </button>
            )
          ) : (
            <>
              {doc.kind === "file" && (
                <button type="button" className={btn} disabled={pending} onClick={onDownload}>
                  {pending ? "…" : tCommon("download")}
                </button>
              )}
              {canWrite && doc.kind !== "file" && (
                <button
                  type="button"
                  className={btn}
                  aria-label={`${tCommon("edit")} ${doc.title}`}
                  onClick={() => openEdit(doc)}
                >
                  {tCommon("edit")}
                </button>
              )}
              {canWrite && (
                <button
                  type="button"
                  className={btn}
                  disabled={pending}
                  aria-label={`${tCommon("archive")} ${doc.title}`}
                  onClick={onArchive}
                >
                  {tCommon("archive")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
