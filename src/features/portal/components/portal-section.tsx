"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { archivePortalBlockAction } from "../actions";
import type { MemberPortal } from "../data";
import { cardsForBlock } from "../lib";
import { PortalStoreProvider, usePortalStore } from "../provider";
import type { PortalBlock } from "../types";
import { CardItem } from "./card-item";
import { PortalForms } from "./portal-forms";
import { ShareLinkManager } from "./share-link-manager";

export function PortalSection({ projectId, portal }: { projectId: string; portal: MemberPortal }) {
  return (
    <PortalStoreProvider>
      <section className="mx-auto w-full max-w-5xl px-6 pb-12">
        <Header projectId={projectId} hasActiveLink={portal.shareLink !== null} />
        <Blocks projectId={projectId} portal={portal} />
        <ProposalsInbox projectId={projectId} portal={portal} />
        <PortalForms projectId={projectId} blocks={portal.blocks} />
      </section>
    </PortalStoreProvider>
  );
}

function Header({ projectId, hasActiveLink }: { projectId: string; hasActiveLink: boolean }) {
  const t = useTranslations("portal");
  const openAddBlock = usePortalStore((s) => s.openAddBlock);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-text text-[18px] font-semibold">{t("title")}</h1>
          <p className="text-text-3 text-[12.5px]">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openAddBlock}
          className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-3.5 text-[13px] font-medium transition-colors"
        >
          {t("addBlock")}
        </button>
      </div>
      <ShareLinkManager projectId={projectId} hasActiveLink={hasActiveLink} />
    </div>
  );
}

function Blocks({ projectId, portal }: { projectId: string; portal: MemberPortal }) {
  const t = useTranslations("portal");
  if (portal.blocks.length === 0) {
    return (
      <div className="border-line/60 text-text-3 mt-6 rounded-lg border border-dashed px-4 py-12 text-center text-[13px]">
        {t("emptyPortal")}
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-6">
      {portal.blocks.map((block) => (
        <BlockPanel key={block.id} block={block} projectId={projectId} portal={portal} />
      ))}
    </div>
  );
}

function BlockPanel({
  block,
  projectId,
  portal,
}: {
  block: PortalBlock;
  projectId: string;
  portal: MemberPortal;
}) {
  const t = useTranslations("portal");
  const openAddCard = usePortalStore((s) => s.openAddCard);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const cards = cardsForBlock(portal.cards, block.id);

  function onArchiveBlock() {
    if (!window.confirm(t("confirmArchiveBlock", { name: block.name }))) return;
    start(async () => {
      const res = await archivePortalBlockAction(block.id, projectId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="border-line-1 rounded-xl border">
      <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="text-text text-[14px] font-semibold">
          {block.name} <span className="text-text-3 font-normal">{cards.length}</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openAddCard(block.id)}
            className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors"
          >
            {t("addCard")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onArchiveBlock}
            aria-label={`${t("archiveCard")} ${block.name}`}
            className="text-text-3 hover:text-text h-8 rounded-md px-2 text-[12px] transition-colors disabled:opacity-60"
          >
            {t("archiveCard")}
          </button>
        </div>
      </div>
      {cards.length === 0 ? (
        <p className="text-text-3 px-4 py-6 text-center text-[12.5px]">{t("emptyBlock")}</p>
      ) : (
        <ul className="space-y-2 p-3">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              projectId={projectId}
              comments={portal.comments.filter((c) => c.card_id === card.id)}
              attachments={portal.attachments.filter((a) => a.card_id === card.id)}
            />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-red-text px-4 pb-3 text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}

/** Client proposals that arrived without a block — the triage inbox. */
function ProposalsInbox({ projectId, portal }: { projectId: string; portal: MemberPortal }) {
  const t = useTranslations("portal");
  const unassigned = cardsForBlock(portal.cards, null);
  if (unassigned.length === 0) return null;
  return (
    <div className="border-amber/40 mt-6 rounded-xl border">
      <div className="border-line border-b px-4 py-3">
        <h2 className="text-text text-[14px] font-semibold">
          {t("proposalsInbox")} <span className="text-text-3 font-normal">{unassigned.length}</span>
        </h2>
        <p className="text-text-3 text-[12px]">{t("proposalsInboxHelp")}</p>
      </div>
      <ul className="space-y-2 p-3">
        {unassigned.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            projectId={projectId}
            comments={portal.comments.filter((c) => c.card_id === card.id)}
            attachments={portal.attachments.filter((a) => a.card_id === card.id)}
          />
        ))}
      </ul>
    </div>
  );
}
