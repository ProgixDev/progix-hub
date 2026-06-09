"use client";

import { useState, useTransition } from "react";
import { archiveDocumentAction, getDocumentDownloadUrlAction } from "../actions";
import { formatBytes, mimeLabel } from "../lib";
import { useDocumentsStore } from "../provider";
import type { ProjectDocument } from "../types";
import { NoteBody } from "./note-body";

const btn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60";

export function DocumentRow({ doc, projectId }: { doc: ProjectDocument; projectId: string }) {
  const openEdit = useDocumentsStore((s) => s.openEdit);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onArchive() {
    if (!window.confirm(`Archive “${doc.title}”? You can restore it later.`)) return;
    start(async () => {
      const res = await archiveDocumentAction(doc.id, projectId);
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

  const date = (
    <time suppressHydrationWarning>{new Date(doc.created_at).toLocaleDateString()}</time>
  );

  return (
    <li className="bg-bg-2 border-line-1 rounded-lg border px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {doc.kind === "file" && (
            <>
              <p className="text-text truncate text-[13px] font-medium">{doc.title}</p>
              <p className="text-text-3 text-[11px]">
                {mimeLabel(doc.file_mime)} · {formatBytes(doc.file_size)} · {date}
              </p>
            </>
          )}
          {doc.kind === "link" && (
            <>
              <a
                href={doc.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:text-blue-text text-[13px] font-medium"
              >
                {doc.title}
              </a>
              <p className="text-text-2 truncate font-mono text-[11px]">
                {doc.url} · {date}
              </p>
            </>
          )}
          {doc.kind === "note" && (
            <>
              <p className="text-text text-[13px] font-medium">{doc.title}</p>
              <div className="mt-1">
                <NoteBody body={doc.body ?? ""} />
              </div>
              <p className="text-text-3 mt-1 text-[11px]">{date}</p>
            </>
          )}
          {error && (
            <p role="alert" className="text-[11px] text-[#FFB6A2]">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-1.5">
          {doc.kind === "file" && (
            <button type="button" className={btn} disabled={pending} onClick={onDownload}>
              {pending ? "…" : "Download"}
            </button>
          )}
          {doc.kind !== "file" && (
            <button
              type="button"
              className={btn}
              aria-label={`Edit ${doc.title}`}
              onClick={() => openEdit(doc)}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className={btn}
            disabled={pending}
            aria-label={`Archive ${doc.title}`}
            onClick={onArchive}
          >
            Archive
          </button>
        </div>
      </div>
    </li>
  );
}
