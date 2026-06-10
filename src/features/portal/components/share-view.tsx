"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import { formatBytes, cardsForBlock, validateAttachment } from "../lib";
import {
  getPortalAttachmentUrlAction,
  submitPortalAttachmentAction,
  submitPortalCommentAction,
  submitPortalProposalAction,
} from "../public-actions";
import type { PublicPortal } from "../types";
import { StatusBadge } from "./status-badge";

const NAME_KEY = "portal-client-name";
const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-md border px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";
const btn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60";

/** The client's whole portal page — read everything, comment, attach, propose (view + comment role). */
export function ShareView({ portal, token }: { portal: PublicPortal; token: string }) {
  const t = useTranslations("portal");
  // Lazy-init from localStorage (SSR renders empty; the client value wins on hydration —
  // the inputs carry suppressHydrationWarning for exactly this).
  const [name, setName] = useState(() =>
    typeof window === "undefined" ? "" : (window.localStorage.getItem(NAME_KEY) ?? ""),
  );
  const [proposeOpen, setProposeOpen] = useState(false);

  function rememberName(value: string) {
    setName(value);
    window.localStorage.setItem(NAME_KEY, value);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-text text-[22px] font-semibold">{portal.project_name}</h1>
          <p className="text-text-2 mt-1 max-w-xl text-[13.5px]">{t("publicIntro")}</p>
        </div>
        <button
          type="button"
          onClick={() => setProposeOpen((open) => !open)}
          className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-3.5 text-[13px] font-medium transition-colors"
        >
          {t("propose")}
        </button>
      </header>

      {proposeOpen && (
        <ProposeForm
          token={token}
          blocks={portal.blocks}
          name={name}
          onName={rememberName}
          onDone={() => setProposeOpen(false)}
        />
      )}

      <div className="mt-8 space-y-8">
        {portal.blocks.map((block) => {
          const cards = cardsForBlock(portal.cards, block.id);
          if (cards.length === 0) return null;
          return (
            <section key={block.id}>
              <h2 className="text-text text-[15px] font-semibold">{block.name}</h2>
              <ul className="mt-3 space-y-3">
                {cards.map((card) => (
                  <PublicCard
                    key={card.id}
                    card={card}
                    token={token}
                    name={name}
                    onName={rememberName}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {/* Proposals not yet assigned to a block still show for the client. */}
        {cardsForBlock(portal.cards, null).length > 0 && (
          <section>
            <h2 className="text-text text-[15px] font-semibold">{t("proposalsInbox")}</h2>
            <ul className="mt-3 space-y-3">
              {cardsForBlock(portal.cards, null).map((card) => (
                <PublicCard
                  key={card.id}
                  card={card}
                  token={token}
                  name={name}
                  onName={rememberName}
                />
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="text-text-3 mt-12 text-center text-[11.5px]">{t("poweredBy")}</footer>
    </div>
  );
}

type PublicCardData = PublicPortal["cards"][number];

function PublicCard({
  card,
  token,
  name,
  onName,
}: {
  card: PublicCardData;
  token: string;
  name: string;
  onName: (value: string) => void;
}) {
  const t = useTranslations("portal");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = await submitPortalCommentAction(token, card.id, {
        author_name: fd.get("author_name"),
        body: fd.get("body"),
        website: fd.get("website"),
      });
      if (!res.ok) {
        setError(res.fieldErrors ? Object.values(res.fieldErrors)[0]! : res.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!name.trim()) {
      setError(t("errorNameRequired"));
      return;
    }
    const invalid = validateAttachment(file);
    if (invalid) {
      setError(invalid === "type" ? t("errorFileType") : t("errorFileSize"));
      return;
    }
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("author_name", name.trim());
      const res = await submitPortalAttachmentAction(token, card.id, fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function onDownload(attachmentId: string) {
    setError(null);
    start(async () => {
      const res = await getPortalAttachmentUrlAction(token, attachmentId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <li className="bg-bg-1 border-line-1 rounded-xl border px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-text min-w-0 text-[14px] font-medium break-words">{card.title}</p>
        <StatusBadge status={card.status} />
        {card.origin === "client" && (
          <span className="border-line-1 bg-bg-3 text-text-2 rounded-full border px-2 py-0.5 text-[11px]">
            {t("byClient")}
            {card.client_author ? ` · ${card.client_author}` : ""}
          </span>
        )}
      </div>
      {card.description && (
        <p className="text-text-2 mt-1.5 text-[13px] whitespace-pre-line">{card.description}</p>
      )}

      {card.attachments.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {card.attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between gap-2">
              <p className="text-text-2 min-w-0 flex-1 truncate text-[12px]">
                📎 {attachment.file_name}{" "}
                <span className="text-text-3">· {formatBytes(attachment.file_size)}</span>
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
        </div>
      )}

      {card.comments.length > 0 && (
        <div className="border-line/60 mt-3 space-y-1.5 border-t pt-2.5">
          {card.comments.map((comment) => (
            <p key={comment.id} className="text-text-2 text-[12.5px]">
              <span className="text-text font-medium">{comment.author_name}</span>{" "}
              <span className="text-text-3 text-[11px]">
                <time suppressHydrationWarning>
                  {formatDate(new Date(comment.created_at), locale)}
                </time>
              </span>
              <br />
              {comment.body}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={onComment} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />
        <input
          name="author_name"
          aria-label={t("yourName")}
          suppressHydrationWarning
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={t("yourName")}
          required
          className="bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-8 w-36 rounded-md border px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="body"
          aria-label={t("commentPlaceholder")}
          placeholder={t("commentPlaceholder")}
          required
          className="bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-8 min-w-40 flex-1 rounded-md border px-2.5 text-[12.5px] outline-none"
        />
        <button type="submit" disabled={pending} className={btn}>
          {pending ? t("sending") : t("send")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
          className={btn}
        >
          {pending ? t("attaching") : t("attachFile")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip"
          className="hidden"
          onChange={onPickFile}
        />
      </form>
      {error && (
        <p role="alert" className="text-red-text mt-1.5 text-[11.5px]">
          {error}
        </p>
      )}
    </li>
  );
}

function ProposeForm({
  token,
  blocks,
  name,
  onName,
  onDone,
}: {
  token: string;
  blocks: PublicPortal["blocks"];
  name: string;
  onName: (value: string) => void;
  onDone: () => void;
}) {
  const t = useTranslations("portal");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError(null);
    start(async () => {
      const res = await submitPortalProposalAction(token, {
        author_name: fd.get("author_name"),
        block_id: fd.get("block_id"),
        title: fd.get("title"),
        description: fd.get("description"),
        website: fd.get("website"),
      });
      if (!res.ok) {
        setError(res.fieldErrors ? Object.values(res.fieldErrors)[0]! : res.error);
        return;
      }
      setSent(true);
      router.refresh();
      window.setTimeout(onDone, 1600);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-line-1 bg-bg-1 mt-6 space-y-3 rounded-xl border p-4"
      aria-label={t("propose")}
    >
      <div>
        <h2 className="text-text text-[14px] font-semibold">{t("propose")}</h2>
        <p className="text-text-3 text-[12px]">{t("proposeHelp")}</p>
      </div>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <div className="flex flex-wrap gap-2">
        <input
          name="author_name"
          aria-label={t("yourName")}
          suppressHydrationWarning
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={t("yourName")}
          required
          className={`${inputCls} max-w-48`}
        />
        <select
          name="block_id"
          aria-label={t("fieldBlock")}
          defaultValue=""
          className={`${inputCls} max-w-56`}
        >
          <option value="">{t("anyBlock")}</option>
          {blocks.map((block) => (
            <option key={block.id} value={block.id}>
              {block.name}
            </option>
          ))}
        </select>
      </div>
      <input
        name="title"
        aria-label={t("fieldTitle")}
        placeholder={t("fieldTitle")}
        required
        className={inputCls}
      />
      <textarea
        name="description"
        aria-label={t("fieldDescription")}
        placeholder={t("fieldDescription")}
        rows={3}
        className={inputCls}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || sent}
          className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-4 text-[13px] font-medium transition-colors disabled:opacity-60"
        >
          {pending ? t("sending") : t("proposeSubmit")}
        </button>
        {sent && <p className="text-green text-[12.5px]">{t("proposeSent")}</p>}
        {error && (
          <p role="alert" className="text-red-text text-[12px]">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
