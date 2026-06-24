"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import {
  createPortalBlockAction,
  createPortalCardAction,
  updatePortalCardAction,
  type ActionResult,
} from "../actions";
import { usePortalStore } from "../provider";
import { CARD_STATUSES, type PortalBlock } from "../types";
import { STATUS_KEY } from "./status-badge";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function PortalForms({ projectId, blocks }: { projectId: string; blocks: PortalBlock[] }) {
  const modal = usePortalStore((s) => s.modal);
  const close = usePortalStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  return (
    <PortalModal
      key={modal.mode === "edit-card" ? modal.card.id : modal.mode}
      projectId={projectId}
      blocks={blocks}
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

function PortalModal({
  projectId,
  blocks,
  onClose,
}: {
  projectId: string;
  blocks: PortalBlock[];
  onClose: () => void;
}) {
  const t = useTranslations("portal");
  const tCommon = useTranslations("common");
  const modal = usePortalStore((s) => s.modal);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit-card" ? modal.card : null;
  const heading =
    modal.mode === "add-block" ? t("newBlock") : editing ? t("editCard") : t("newCard");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const input = Object.fromEntries(fd.entries());
    start(async () => {
      let res: ActionResult;
      if (modal.mode === "add-block") {
        res = await createPortalBlockAction(projectId, input);
      } else if (modal.mode === "add-card") {
        res = await createPortalCardAction(projectId, { ...input, block_id: modal.blockId });
      } else if (modal.mode === "edit-card") {
        res = await updatePortalCardAction(modal.card.id, projectId, input);
      } else {
        return;
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

      {modal.mode === "add-block" ? (
        <Field label={t("blockName")} error={errors.name}>
          <input
            name="name"
            placeholder={t("blockNamePlaceholder")}
            className={inputCls}
            required
            autoFocus
          />
        </Field>
      ) : (
        <>
          <Field label={t("fieldTitle")} error={errors.title}>
            <input
              name="title"
              defaultValue={editing?.title ?? ""}
              className={inputCls}
              required
              autoFocus
            />
          </Field>
          <Field label={t("fieldDescription")} error={errors.description}>
            <textarea
              name="description"
              defaultValue={editing?.description ?? ""}
              rows={4}
              className={inputCls}
            />
          </Field>
          <Field label={t("fieldStatus")} error={errors.status}>
            <select
              name="status"
              defaultValue={editing?.status ?? "delivered"}
              className={inputCls}
            >
              {CARD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(STATUS_KEY[status])}
                </option>
              ))}
            </select>
          </Field>
          {editing && (
            <Field label={t("fieldBlock")} error={errors.block_id}>
              <select
                name="block_id"
                defaultValue={editing.block_id ?? blocks[0]?.id ?? ""}
                className={inputCls}
              >
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </>
      )}
    </Modal>
  );
}
