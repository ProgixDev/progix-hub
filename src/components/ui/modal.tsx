"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Shared responsive modal: a centered glass dialog on desktop, a bottom sheet (slide-up, grab
 * handle, safe-area) on mobile. Sticky header + footer, scrollable body. Handles Escape, focus
 * trap, body-scroll-lock, and focus restore. Pass `onSubmit` to make the panel a <form> so a
 * footer submit button works.
 */
export function Modal({
  title,
  description,
  onClose,
  onSubmit,
  footer,
  children,
  size = "md",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const t = useTranslations("common");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        overlayRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus?.();
    };
  }, [onClose]);

  const panelClass = cn(
    "modal-panel glass-strong flex max-h-[92dvh] w-full flex-col rounded-t-2xl sm:max-h-[88vh] sm:rounded-2xl",
    size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
  );

  const panelInner = (
    <>
      {/* mobile grab handle */}
      <div className="bg-line-strong mx-auto mt-2.5 h-1 w-9 flex-none rounded-full sm:hidden" />

      <div className="flex flex-none items-start justify-between gap-3 px-5 pt-4 pb-3 sm:pt-5">
        <div className="min-w-0">
          <h2 className="text-text text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="text-text-2 mt-0.5 text-[13px]">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cancel")}
          className="text-text-2 hover:bg-bg-3 hover:text-text -mt-1 -mr-1.5 flex size-8 flex-none items-center justify-center rounded-full text-[20px] leading-none transition-colors"
        >
          ×
        </button>
      </div>

      <div className="min-h-0 flex-auto space-y-4 overflow-y-auto px-5 py-1">{children}</div>

      {footer && (
        <div className="border-line flex flex-none items-center justify-end gap-2 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </>
  );

  // Portal to <body> so the fixed overlay escapes any transformed/backdrop-blurred ancestor
  // (e.g. the sticky top bar) that would otherwise become its containing block and clip it.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form onSubmit={onSubmit} className={panelClass}>
          {panelInner}
        </form>
      ) : (
        <div className={panelClass}>{panelInner}</div>
      )}
    </div>,
    document.body,
  );
}
