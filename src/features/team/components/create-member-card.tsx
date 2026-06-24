"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createMemberAccountAction } from "../actions";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-10 w-full rounded-xl border px-3.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

/** Superadmin-only card to create an email/password org member (spec 010). */
export function CreateMemberCard() {
  const t = useTranslations("team");
  const tCommon = useTranslations("common");
  const [pending, start] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setError(null);
    setFieldErrors({});
    setCreated(null);
    start(async () => {
      const res = await createMemberAccountAction({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
      });
      if (res.ok) {
        setCreated(res.email);
        form.reset();
      } else {
        setError(res.fieldErrors ? null : res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-8 sm:px-6">
      <div className="glass rounded-2xl">
        <div className="border-line border-b px-4 py-3">
          <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
          <p className="text-text-3 text-[12px]">{t("subtitle")}</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-text-1 text-[12.5px] font-medium">{t("nameLabel")}</span>
            <input name="name" required className={inputCls} placeholder={t("namePlaceholder")} />
            {fieldErrors.name && (
              <span role="alert" className="text-red-text text-[11px]">
                {fieldErrors.name}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-text-1 text-[12.5px] font-medium">{t("emailLabel")}</span>
            <input
              name="email"
              type="email"
              required
              className={inputCls}
              placeholder="teammate@progix.com"
            />
            {fieldErrors.email && (
              <span role="alert" className="text-red-text text-[11px]">
                {fieldErrors.email}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-text-1 text-[12.5px] font-medium">
              {t("passwordLabel")}
              <span className="text-text-3 font-normal"> — {t("passwordHint")}</span>
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputCls}
            />
            {fieldErrors.password && (
              <span role="alert" className="text-red-text text-[11px]">
                {fieldErrors.password}
              </span>
            )}
          </label>
          {error && (
            <p role="alert" className="text-red-text text-[12px]">
              {error}
            </p>
          )}
          {created && (
            <p
              role="status"
              className="border-green/30 bg-green-tint rounded-md border px-3 py-2 text-[12.5px] text-[#8FE3BB]"
            >
              {t("success", { email: created })}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
            >
              {pending ? tCommon("saving") : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
