"use client";

import { useTranslations } from "next-intl";
import { byTab } from "../lib";
import { DocumentsStoreProvider, useDocumentsStore } from "../provider";
import type { DocumentTab, ProjectDocument } from "../types";
import { DocForm } from "./doc-form";
import { DocumentRow } from "./document-row";
import { FileUpload } from "./file-upload";

const TAB_IDS: DocumentTab[] = ["all", "file", "link", "note"];

const PANEL_ID = "documents-panel";
const tabId = (id: DocumentTab) => `documents-tab-${id}`;

/** Translation key for each tab's label (spec 005). */
const TAB_LABEL_KEY: Record<DocumentTab, "tabAll" | "tabFiles" | "tabLinks" | "tabNotes"> = {
  all: "tabAll",
  file: "tabFiles",
  link: "tabLinks",
  note: "tabNotes",
};

export function DocumentsSection({
  projectId,
  documents,
  archived,
  canWrite = true,
}: {
  projectId: string;
  documents: ProjectDocument[];
  archived: ProjectDocument[];
  canWrite?: boolean;
}) {
  return (
    <DocumentsStoreProvider>
      <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6">
        <Header projectId={projectId} canWrite={canWrite} />
        <Tabs documents={documents} />
        <List projectId={projectId} documents={documents} canWrite={canWrite} />
        {archived.length > 0 && (
          <ArchivedPanel projectId={projectId} archived={archived} canWrite={canWrite} />
        )}
        <DocForm projectId={projectId} />
      </section>
    </DocumentsStoreProvider>
  );
}

function ArchivedPanel({
  projectId,
  archived,
  canWrite,
}: {
  projectId: string;
  archived: ProjectDocument[];
  canWrite: boolean;
}) {
  const t = useTranslations("documents");
  return (
    <details className="border-line-1 mt-6 rounded-lg border">
      <summary className="text-text-2 hover:text-text cursor-pointer px-4 py-3 text-[13px] font-medium">
        {t("archived", { count: archived.length })}
      </summary>
      <ul className="space-y-2 px-3 pb-3">
        {archived.map((d) => (
          <DocumentRow key={d.id} doc={d} projectId={projectId} archived canWrite={canWrite} />
        ))}
      </ul>
    </details>
  );
}

function Header({ projectId, canWrite }: { projectId: string; canWrite: boolean }) {
  const t = useTranslations("documents");
  const openAddLink = useDocumentsStore((s) => s.openAddLink);
  const openAddNote = useDocumentsStore((s) => s.openAddNote);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
        <p className="text-text-3 text-[12px]">{t("subtitle")}</p>
      </div>
      {canWrite && (
        <div className="flex flex-wrap items-center gap-2">
          <FileUpload projectId={projectId} />
          <button
            type="button"
            onClick={openAddLink}
            className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full border px-3 text-[13px] font-medium transition-colors"
          >
            {t("addLink")}
          </button>
          <button
            type="button"
            onClick={openAddNote}
            className="btn-primary h-9 rounded-full px-3.5 text-[13px] font-medium transition-all"
          >
            {t("addNote")}
          </button>
        </div>
      )}
    </div>
  );
}

function Tabs({ documents }: { documents: ProjectDocument[] }) {
  const t = useTranslations("documents");
  const tab = useDocumentsStore((s) => s.tab);
  const setTab = useDocumentsStore((s) => s.setTab);

  // Roving focus: arrow/Home/End move between tabs (WAI-ARIA tabs pattern).
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = TAB_IDS.indexOf(tab);
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % TAB_IDS.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + TAB_IDS.length) % TAB_IDS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TAB_IDS.length - 1;
    else return;
    event.preventDefault();
    const nextId = TAB_IDS[next]!;
    setTab(nextId);
    document.getElementById(tabId(nextId))?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={t("documentType")}
      onKeyDown={onKeyDown}
      className="border-line -mx-1 mt-4 flex gap-1 overflow-x-auto border-b px-1"
    >
      {TAB_IDS.map((id) => {
        const active = tab === id;
        return (
          <button
            key={id}
            id={tabId(id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={PANEL_ID}
            tabIndex={active ? 0 : -1}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
              active ? "border-blue text-text" : "text-text-2 hover:text-text border-transparent"
            }`}
          >
            {t(TAB_LABEL_KEY[id])}{" "}
            <span className="text-text-3">{byTab(documents, id).length}</span>
          </button>
        );
      })}
    </div>
  );
}

function List({
  projectId,
  documents,
  canWrite,
}: {
  projectId: string;
  documents: ProjectDocument[];
  canWrite: boolean;
}) {
  const t = useTranslations("documents");
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
        ? t("emptyFiles")
        : tab === "link"
          ? t("emptyLinks")
          : tab === "note"
            ? t("emptyNotes")
            : t("emptyAll");
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
        <DocumentRow key={d.id} doc={d} projectId={projectId} canWrite={canWrite} />
      ))}
    </ul>
  );
}
