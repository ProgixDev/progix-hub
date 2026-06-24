"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { verifyPasscodeAction } from "../public-actions";

/** Passcode gate for the client setup link (spec 017 AC-2). Reveals nothing until verified. */
export function SetupPasscodeForm({ token }: { token: string }) {
  const t = useTranslations("setup");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passcode = String(new FormData(event.currentTarget).get("passcode") ?? "");
    setError(false);
    start(async () => {
      const res = await verifyPasscodeAction(token, passcode);
      if (res.ok) router.refresh();
      else setError(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="glass mx-auto mt-16 w-full max-w-sm rounded-2xl p-6">
      <h1 className="text-text text-[16px] font-semibold">{t("gateTitle")}</h1>
      <p className="text-text-2 mt-1 text-[13px]">{t("gateBody")}</p>
      <input
        name="passcode"
        autoFocus
        autoComplete="off"
        placeholder={t("gatePlaceholder")}
        className="bg-bg-inset border-line-1 focus:border-line-blue text-text mt-4 w-full rounded-xl border px-3.5 py-2.5 text-center font-mono text-[16px] tracking-widest uppercase outline-none focus:ring-2 focus:ring-[var(--blue-ring)]"
      />
      {error && <p className="text-red-text mt-2 text-[12px]">{t("gateError")}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-4 h-10 w-full rounded-full text-[14px] font-medium transition-all disabled:opacity-60"
      >
        {pending ? t("gateChecking") : t("gateSubmit")}
      </button>
    </form>
  );
}
