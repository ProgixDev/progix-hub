"use client";

import { useTranslations } from "next-intl";
import type { CardStatus } from "../types";

const TONE: Record<CardStatus, string> = {
  delivered: "border-green/30 bg-green-tint text-green",
  in_progress: "border-blue/40 bg-blue-tint text-blue-text",
  planned: "border-line-1 bg-bg-3 text-text-2",
  proposed: "border-amber/40 bg-amber-tint text-amber",
};

export const STATUS_KEY = {
  delivered: "statusDelivered",
  in_progress: "statusInProgress",
  planned: "statusPlanned",
  proposed: "statusProposed",
} as const;

export function StatusBadge({ status }: { status: CardStatus }) {
  const t = useTranslations("portal");
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONE[status]}`}
    >
      {t(STATUS_KEY[status])}
    </span>
  );
}
