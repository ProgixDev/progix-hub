"use client";

import { byTab } from "../lib";
import { DocumentsStoreProvider, useDocumentsStore } from "../provider";
import type { DocumentTab, ProjectDocument } from "../types";
import { DocForm } from "./doc-form";
import { DocumentRow } from "./document-row";
import { FileUpload } from "./file-upload";

const TABS: { id: DocumentTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "file", label: "Files" },
  { id: "link", label: "Links" },
  { id: "note", label: "Notes" },
];

const PANEL_ID = "documents-panel";
const tabId = (id: DocumentTab) => `documents-tab-${id}`;

export function DocumentsSection({
  projectId,
  documents,
  archived,
}: {
  projectId: string;
  documents: ProjectDocument[];
  archived: ProjectDocument[];
}) {
  return (
    <DocumentsStoreProvider>
      <section className="mx-auto w-full max-w-5xl px-6 pb-12">
        <Header projectId={projectId} />
        <Tabs documents={documents} />
        <List projectId={projectId} documents={documents} />
        {archived.length > 0 && <ArchivedPanel projectId={projectId} archived={archived} />}
        <DocForm projectId={projectId} />
      </section>
    </DocumentsStoreProvider>
  );
}

function ArchivedPanel({
  projectId,
  archived,
}: {
  projectId: string;
  archived: ProjectDocument[];
}) {
  return (
    <details className="border-line-1 mt-6 rounded-lg border">
      <summary className="text-text-2 hover:text-text cursor-pointer px-4 py-3 text-[13px] font-medium">
        Archived ({archived.length})
      </summary>
      <ul className="space-y-2 px-3 pb-3">
        {archived.map((d) => (
          <DocumentRow key={d.id} doc={d} projectId={projectId} archived />
        ))}
      </ul>
    </details>
  );
}

function Header({ projectId }: { projectId: string }) {
  const openAddLink = useDocumentsStore((s) => s.openAddLink);
  const openAddNote = useDocumentsStore((s) => s.openAddNote);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-text text-[15px] font-semibold">Documents</h2>
        <p className="text-text-3 text-[12px]">Files, links, and notes for this project.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FileUpload projectId={projectId} />
        <button
          type="button"
          onClick={openAddLink}
          className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-md border px-3 text-[13px] font-medium transition-colors"
        >
          Add link
        </button>
        <button
          type="button"
          onClick={openAddNote}
          className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-3.5 text-[13px] font-medium transition-colors"
        >
          Add note
        </button>
      </div>
    </div>
  );
}

function Tabs({ documents }: { documents: ProjectDocument[] }) {
  const tab = useDocumentsStore((s) => s.tab);
  const setTab = useDocumentsStore((s) => s.setTab);

  // Roving focus: arrow/Home/End move between tabs (WAI-ARIA tabs pattern).
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = TABS.findIndex((t) => t.id === tab);
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    const nextId = TABS[next]!.id;
    setTab(nextId);
    document.getElementById(tabId(nextId))?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Document type"
      onKeyDown={onKeyDown}
      className="border-line mt-4 flex gap-1 border-b"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            id={tabId(t.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={PANEL_ID}
            tabIndex={active ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
              active ? "border-blue text-text" : "text-text-2 hover:text-text border-transparent"
            }`}
          >
            {t.label} <span className="text-text-3">{byTab(documents, t.id).length}</span>
          </button>
        );
      })}
    </div>
  );
}

function List({ projectId, documents }: { projectId: string; documents: ProjectDocument[] }) {
  const tab = useDocumentsStore((s) => s.tab);
  const shown = byTab(documents, tab);
  const panelProps = {
    id: PANEL_ID,
    role: "tabpanel" as const,
    "aria-labelledby": tabId(tab),
    tabIndex: 0,
  };
  if (shown.length === 0) {
    const msg =
      tab === "file"
        ? "No files yet — upload one to keep it with this project."
        : tab === "link"
          ? "No links yet — add an external URL."
          : tab === "note"
            ? "No notes yet — write one."
            : "No documents yet — upload a file, add a link, or write a note.";
    return (
      <div
        {...panelProps}
        className="border-line/60 text-text-3 mt-3 rounded-lg border border-dashed px-4 py-10 text-center text-[13px]"
      >
        {msg}
      </div>
    );
  }
  return (
    <ul {...panelProps} className="mt-3 space-y-2">
      {shown.map((d) => (
        <DocumentRow key={d.id} doc={d} projectId={projectId} />
      ))}
    </ul>
  );
}
