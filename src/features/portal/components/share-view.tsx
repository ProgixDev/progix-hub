"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { formatDate } from "@/lib/format";
import { formatBytes, cardsForBlock, validateAttachment } from "../lib";
import {
  getPortalAttachmentUrlAction,
  submitPortalAttachmentAction,
  submitPortalCommentAction,
  submitPortalProposalAction,
} from "../public-actions";
import type { PortalPhase, PortalReleaseNote, PublicPortal } from "../types";
import { StatusBadge } from "./status-badge";

const NAME_KEY = "portal-client-name";
const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";
const btn =
  "border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-full border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60";

/** The client's whole portal page — read everything, comment, attach, propose (view + comment role). */
export function ShareView({
  portal,
  roadmap,
  releaseNotes = [],
  token,
}: {
  portal: PublicPortal;
  roadmap: PortalPhase[];
  releaseNotes?: PortalReleaseNote[];
  token: string;
}) {
  const t = useTranslations("portal");
  const total = portal.cards.length;
  const delivered = portal.cards.filter((c) => c.status === "delivered").length;
  const inProgress = portal.cards.filter((c) => c.status === "in_progress").length;
  const planned = portal.cards.filter(
    (c) => c.status === "planned" || c.status === "proposed",
  ).length;
  const pct = total ? Math.round((delivered / total) * 100) : 0;
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
          className="btn-primary h-9 rounded-full px-3.5 text-[13px] font-medium transition-all"
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

      {(total > 0 || roadmap.length > 0) && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {total > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-end justify-between">
                <h2 className="text-text text-[14px] font-semibold">{t("progressTitle")}</h2>
                <span className="text-text text-[22px] font-semibold">{pct}%</span>
              </div>
              <div className="bg-line-1 mt-2 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-green h-full rounded-full transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-text-2 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                <span>
                  <b className="text-text">{delivered}</b> {t("delivered")}
                </span>
                <span>
                  <b className="text-text">{inProgress}</b> {t("inProgress")}
                </span>
                <span>
                  <b className="text-text">{planned}</b> {t("planned")}
                </span>
              </div>
            </div>
          )}
          {roadmap.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="text-text text-[14px] font-semibold">{t("roadmapTitle")}</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {roadmap.map((ph) => {
                  const p = ph.total ? Math.round((ph.done / ph.total) * 100) : 0;
                  return (
                    <li key={ph.id}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="text-text truncate font-medium">{ph.name}</span>
                        <span className="text-text-3 flex-none">
                          {ph.done}/{ph.total}
                        </span>
                      </div>
                      <div className="bg-line-1 mt-1 h-1.5 w-full overflow-hidden rounded-full">
                        <div className="bg-blue h-full rounded-full" style={{ width: `${p}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {releaseNotes.length > 0 && (
        <div className="glass mt-8 rounded-2xl p-5">
          <h2 className="text-text text-[15px] font-semibold">{t("whatsNewTitle")}</h2>
          <ul className="mt-3 flex flex-col gap-5">
            {releaseNotes.map((n) => (
              <li key={n.id} className="border-line border-t pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-baseline gap-2">
                  {n.version && (
                    <span className="text-text-3 font-mono text-[12px]">{n.version}</span>
                  )}
                  <h3 className="text-text text-[14px] font-semibold">{n.title}</h3>
                </div>
                <p className="text-text-3 mt-0.5 text-[11.5px]">{n.created_at.slice(0, 10)}</p>
                <div className="md-body mt-2 text-[13px]">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{n.body_md}</ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
    <li className="glass rounded-2xl px-4 py-3.5">
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
          className="bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-8 w-36 rounded-xl border px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="body"
          aria-label={t("commentPlaceholder")}
          placeholder={t("commentPlaceholder")}
          required
          className="bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-8 min-w-40 flex-1 rounded-xl border px-2.5 text-[12.5px] outline-none"
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
      className="glass mt-6 space-y-3 rounded-2xl p-4"
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
          className="btn-primary h-9 rounded-full px-4 text-[13px] font-medium transition-all disabled:opacity-60"
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
