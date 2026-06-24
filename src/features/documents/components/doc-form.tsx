"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import {
  addLinkDocumentAction,
  addNoteDocumentAction,
  updateDocumentAction,
  type ActionResult,
} from "../actions";
import { useDocumentsStore } from "../provider";
import type { ProjectDocument } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

type Mode = "add-link" | "add-note" | "edit";

export function DocForm({ projectId }: { projectId: string }) {
  const modal = useDocumentsStore((s) => s.modal);
  const close = useDocumentsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.doc : null;
  // Only links and notes are editable in this form (files are re-uploaded, not edited).
  if (editing && editing.kind === "file") return null;
  const kind: "link" | "note" =
    modal.mode === "add-link"
      ? "link"
      : modal.mode === "add-note"
        ? "note"
        : (editing!.kind as "link" | "note"); // file is excluded by the guard above
  return (
    <DocFormModal
      key={editing?.id ?? modal.mode}
      projectId={projectId}
      mode={modal.mode as Mode}
      kind={kind}
      editing={editing}
      onClose={close}
    />
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-1 text-[12.5px] font-medium">{label}</span>
      {children}
      {error && <span className="text-red-text text-[12px]">{error}</span>}
    </label>
  );
}

function DocFormModal({
  projectId,
  kind,
  editing,
  onClose,
}: {
  projectId: string;
  mode: Mode;
  kind: "link" | "note";
  editing: ProjectDocument | null;
  onClose: () => void;
}) {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const heading = editing
    ? kind === "link"
      ? t("editLink")
      : t("editNote")
    : kind === "link"
      ? t("newLink")
      : t("newNote");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const input = Object.fromEntries(fd.entries());
    start(async () => {
      let res: ActionResult;
      if (editing) {
        res = await updateDocumentAction(editing.id, projectId, kind, input);
      } else if (kind === "link") {
        res = await addLinkDocumentAction(projectId, input);
      } else {
        res = await addNoteDocumentAction(projectId, input);
      }
      if (res.ok) {
        onClose();
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
      }
    });
  }

  return (
    <Modal
      title={heading}
      onClose={onClose}
      onSubmit={onSubmit}
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
            disabled={pending}
            className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
          >
            {pending ? tCommon("saving") : editing ? tCommon("save") : tCommon("add")}
          </button>
        </>
      }
    >
      {formError && (
        <p className="border-red/30 bg-red-tint text-red-text rounded-xl border px-3.5 py-2.5 text-[13px]">
          {formError}
        </p>
      )}

      <Field label={t("fieldTitle")} error={errors.title}>
        <input
          name="title"
          defaultValue={editing?.title ?? ""}
          className={inputCls}
          required
          autoFocus
        />
      </Field>

      {kind === "link" ? (
        <Field label={t("fieldUrl")} error={errors.url}>
          <input
            name="url"
            type="url"
            defaultValue={editing?.url ?? ""}
            placeholder="https://…"
            className={`${inputCls} font-mono text-[13px]`}
            required
          />
        </Field>
      ) : (
        <Field label={t("fieldNote")} error={errors.body}>
          <textarea
            name="body"
            defaultValue={editing?.body ?? ""}
            rows={8}
            placeholder={"# Heading\n\n- bullet\n- **bold**, _italic_, [link](https://…)"}
            className={`${inputCls} font-mono text-[13px]`}
            required
          />
        </Field>
      )}
    </Modal>
  );
}
