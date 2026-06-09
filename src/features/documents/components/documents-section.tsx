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

export function DocumentsSection({
  projectId,
  documents,
}: {
  projectId: string;
  documents: ProjectDocument[];
}) {
  return (
    <DocumentsStoreProvider>
      <section className="mx-auto w-full max-w-5xl px-6 pb-12">
        <Header projectId={projectId} />
        <Tabs documents={documents} />
        <List projectId={projectId} documents={documents} />
        <DocForm projectId={projectId} />
      </section>
    </DocumentsStoreProvider>
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
  return (
    <div role="tablist" className="border-line mt-4 flex gap-1 border-b">
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
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
  if (shown.length === 0) {
    const msg =
      tab === "file"
        ? "No files yet — upload one to keep it with this project."
        : tab === "link"
          ? "No links yet — add an external URL."
          : tab === "note"
            ? "No notes yet — write one in Markdown."
            : "No documents yet — upload a file, add a link, or write a note.";
    return (
      <div className="border-line/60 text-text-3 mt-3 rounded-lg border border-dashed px-4 py-10 text-center text-[13px]">
        {msg}
      </div>
    );
  }
  return (
    <ul className="mt-3 space-y-2">
      {shown.map((d) => (
        <DocumentRow key={d.id} doc={d} projectId={projectId} />
      ))}
    </ul>
  );
}
