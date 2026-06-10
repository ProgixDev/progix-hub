"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import {
  addMemberCommentAction,
  archivePortalCardAction,
  getMemberAttachmentUrlAction,
  updatePortalCardAction,
} from "../actions";
import { formatBytes } from "../lib";
import { usePortalStore } from "../provider";
import {
  CARD_STATUSES,
  type PortalAttachment,
  type PortalCard,
  type PortalComment,
} from "../types";
import { STATUS_KEY, StatusBadge } from "./status-badge";

const btn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60";

/** A feature card on the member side: quick status change, edit, archive, dialogue. */
export function CardItem({
  card,
  projectId,
  comments,
  attachments,
}: {
  card: PortalCard;
  projectId: string;
  comments: PortalComment[];
  attachments: PortalAttachment[];
}) {
  const t = useTranslations("portal");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const openEditCard = usePortalStore((s) => s.openEditCard);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onStatusChange(status: string) {
    setError(null);
    start(async () => {
      const res = await updatePortalCardAction(card.id, projectId, { status });
      if (!res.ok) setError(res.error);
    });
  }

  function onArchive() {
    if (!window.confirm(t("confirmArchiveCard", { title: card.title }))) return;
    start(async () => {
      const res = await archivePortalCardAction(card.id, projectId);
      if (!res.ok) setError(res.error);
    });
  }

  function onDownload(attachmentId: string) {
    setError(null);
    start(async () => {
      const res = await getMemberAttachmentUrlAction(attachmentId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <li className="bg-bg-2 border-line-1 rounded-lg border px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-text text-[13.5px] font-medium">{card.title}</p>
            <StatusBadge status={card.status} />
            {card.origin === "client" && (
              <span className="border-line-1 bg-bg-3 text-text-2 rounded-full border px-2 py-0.5 text-[11px]">
                {t("byClient")}
                {card.client_author ? ` · ${card.client_author}` : ""}
              </span>
            )}
          </div>
          {card.description && (
            <p className="text-text-2 mt-1 text-[12.5px] whitespace-pre-line">{card.description}</p>
          )}
          <p className="text-text-3 mt-1 text-[11px]">
            <time suppressHydrationWarning>{formatDate(new Date(card.created_at), locale)}</time>
          </p>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <select
            value={card.status}
            aria-label={t("fieldStatus")}
            disabled={pending}
            onChange={(e) => onStatusChange(e.target.value)}
            className="border-line-1 bg-bg-inset text-text-1 h-8 rounded-md border px-1.5 text-[12px] disabled:opacity-60"
          >
            {CARD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(STATUS_KEY[status])}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={btn}
            aria-label={`${tCommon("edit")} ${card.title}`}
            onClick={() => openEditCard(card)}
          >
            {tCommon("edit")}
          </button>
          <button
            type="button"
            className={btn}
            disabled={pending}
            aria-label={`${t("archiveCard")} ${card.title}`}
            onClick={onArchive}
          >
            {t("archiveCard")}
          </button>
        </div>
      </div>

      {(comments.length > 0 || attachments.length > 0) && (
        <div className="border-line/60 mt-2.5 space-y-2 border-t pt-2.5">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between gap-2">
              <p className="text-text-2 min-w-0 flex-1 truncate text-[12px]">
                📎 {attachment.file_name}{" "}
                <span className="text-text-3">
                  · {formatBytes(attachment.file_size)} · {attachment.author_name}
                </span>
              </p>
              <button
                type="button"
                className={btn}
                disabled={pending}
                onClick={() => onDownload(attachment.id)}
              >
                {tCommon("download")}
              </button>
            </div>
          ))}
          {comments.map((comment) => (
            <p key={comment.id} className="text-text-2 text-[12.5px]">
              <span
                className={
                  comment.author_kind === "client"
                    ? "text-amber font-medium"
                    : "text-text font-medium"
                }
              >
                {comment.author_name}
              </span>{" "}
              {comment.body}
            </p>
          ))}
        </div>
      )}

      <MemberCommentForm cardId={card.id} projectId={projectId} />
      {error && (
        <p role="alert" className="text-red-text mt-1.5 text-[11px]">
          {error}
        </p>
      )}
    </li>
  );
}

function MemberCommentForm({ cardId, projectId }: { cardId: string; projectId: string }) {
  const t = useTranslations("portal");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form).get("body");
    setError(null);
    start(async () => {
      const res = await addMemberCommentAction(cardId, projectId, { body });
      if (!res.ok) setError(res.error);
      else form.reset();
    });
  }

  return (
    <div className="mt-2.5">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          name="body"
          aria-label={t("commentPlaceholder")}
          placeholder={t("commentPlaceholder")}
          required
          className="bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-8 w-full rounded-md border px-2.5 text-[12.5px] outline-none"
        />
        <button type="submit" disabled={pending} className={btn}>
          {pending ? t("sending") : t("send")}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-red-text mt-1 text-[11px]">
          {error}
        </p>
      )}
    </div>
  );
}
