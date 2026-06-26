"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, SparkleIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import {
  createReleaseNoteAction,
  deleteReleaseNoteAction,
  draftReleaseNoteAction,
  updateReleaseNoteAction,
} from "../actions";
import type { ReleaseNote } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

type Editing = { mode: "new" } | { mode: "edit"; note: ReleaseNote } | null;

export function ReleaseNotesSection({
  projectId,
  notes,
  canWrite,
  aiEnabled,
}: {
  projectId: string;
  notes: ReleaseNote[];
  canWrite: boolean;
  aiEnabled: boolean;
}) {
  const t = useTranslations("releaseNotes");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState<Editing>(null);
  const [pending, start] = useTransition();

  function remove(note: ReleaseNote) {
    if (!confirm(t("deleteConfirm", { title: note.title }))) return;
    start(async () => {
      await deleteReleaseNoteAction(note.id, projectId);
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6">
      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
            <p className="text-text-3 mt-0.5 text-[12.5px]">{t("subtitle")}</p>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={() => setEditing({ mode: "new" })}
              className="btn-primary flex h-9 flex-none items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium"
            >
              <PlusIcon className="size-4" />
              {t("add")}
            </button>
          )}
        </div>

        {notes.length === 0 ? (
          <p className="text-text-3 mt-4 text-[13px]">{t("empty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {notes.map((n) => (
              <li key={n.id} className="border-line border-t pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-text flex items-center gap-2 text-[14px] font-semibold">
                      {n.version && (
                        <span className="text-text-3 font-mono text-[12px]">{n.version}</span>
                      )}
                      {n.title}
                      {n.published ? (
                        <Badge tone="green">{t("published")}</Badge>
                      ) : (
                        <Badge tone="neutral">{t("draft")}</Badge>
                      )}
                    </h3>
                    <p className="text-text-3 mt-0.5 text-[11.5px]">{n.created_at.slice(0, 10)}</p>
                  </div>
                  {canWrite && (
                    <div className="flex flex-none items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditing({ mode: "edit", note: n })}
                        className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-full border px-2.5 text-[12px] font-medium transition-colors"
                      >
                        {tCommon("edit")}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => remove(n)}
                        className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-full border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
                      >
                        {tCommon("delete")}
                      </button>
                    </div>
                  )}
                </div>
                <div className="md-body mt-2 text-[13px]">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{n.body_md}</ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <ReleaseNoteForm
          projectId={projectId}
          editing={editing.mode === "edit" ? editing.note : null}
          aiEnabled={aiEnabled}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function ReleaseNoteForm({
  projectId,
  editing,
  aiEnabled,
  onClose,
}: {
  projectId: string;
  editing: ReleaseNote | null;
  aiEnabled: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("releaseNotes");
  const tCommon = useTranslations("common");
  const [version, setVersion] = useState(editing?.version ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body_md ?? "");
  const [published, setPublished] = useState(editing?.published ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [drafting, startDraft] = useTransition();

  function draft() {
    setError(null);
    startDraft(async () => {
      const res = await draftReleaseNoteAction(projectId);
      if (res.ok) setBody(res.body);
      else setError(res.error);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const input = { version, title, body_md: body, published };
    startSave(async () => {
      const res = editing
        ? await updateReleaseNoteAction(editing.id, projectId, input)
        : await createReleaseNoteAction(projectId, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  return (
    <Modal
      title={editing ? t("editTitle") : t("newTitle")}
      onClose={onClose}
      onSubmit={onSubmit}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full px-3.5 text-[13.5px] font-medium transition-colors"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
          >
            {saving ? tCommon("saving") : editing ? tCommon("save") : t("add")}
          </button>
        </>
      }
    >
      {error && (
        <p className="border-red/30 bg-red-tint text-red-text rounded-xl border px-3.5 py-2.5 text-[13px]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder={t("versionPlaceholder")}
          className={`${inputCls} w-32 flex-none font-mono text-[13px]`}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          required
          autoFocus
          className={inputCls}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-text-1 text-[12.5px] font-medium">{t("bodyLabel")}</span>
        {aiEnabled && (
          <button
            type="button"
            onClick={draft}
            disabled={drafting}
            className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
          >
            <SparkleIcon className="size-3.5" />
            {drafting ? t("drafting") : t("draftWithAi")}
          </button>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        required
        placeholder={t("bodyPlaceholder")}
        className={`${inputCls} font-mono text-[13px] leading-relaxed`}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4"
        />
        <span className="text-text-1 text-[13px]">{t("publishLabel")}</span>
      </label>
    </Modal>
  );
}
