"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { upsertDossierAction } from "../actions";
import type { ClientDossier } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

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

/** Team-only client dossier on the project page (spec 018). Sensitive — never client-facing. */
export function ClientDossierPanel({
  projectId,
  dossier,
}: {
  projectId: string;
  dossier: ClientDossier | null;
}) {
  const t = useTranslations("dossier");
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setErrors({});
    const input = Object.fromEntries(new FormData(event.currentTarget).entries());
    start(async () => {
      const res = await upsertDossierAction(projectId, input);
      if (res.ok) setSaved(true);
      else setErrors(res.fieldErrors ?? { _: res.error });
    });
  }

  return (
    <section className="border-line-1 bg-card mt-4 rounded-xl border p-5">
      <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
      <p className="text-text-3 mt-0.5 text-[12.5px]">{t("subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={t("contactName")} error={errors.contact_name}>
          <input
            name="contact_name"
            defaultValue={dossier?.contact_name ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label={t("contactEmail")} error={errors.contact_email}>
          <input
            name="contact_email"
            type="email"
            defaultValue={dossier?.contact_email ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label={t("contactPhone")} error={errors.contact_phone}>
          <input
            name="contact_phone"
            defaultValue={dossier?.contact_phone ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label={t("company")} error={errors.company}>
          <input name="company" defaultValue={dossier?.company ?? ""} className={inputCls} />
        </Field>
        <Field label={t("clientRole")} error={errors.client_role}>
          <input
            name="client_role"
            defaultValue={dossier?.client_role ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label={t("clientType")} error={errors.client_type}>
          <input
            name="client_type"
            defaultValue={dossier?.client_type ?? ""}
            placeholder={t("clientTypeHint")}
            className={inputCls}
          />
        </Field>
        <Field label={t("itSavviness")} error={errors.it_savviness}>
          <select
            name="it_savviness"
            defaultValue={dossier?.it_savviness ?? ""}
            className={inputCls}
          >
            <option value="">{t("savvinessNone")}</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} — {t(`savviness_${n}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("temperament")} error={errors.temperament}>
          <input
            name="temperament"
            defaultValue={dossier?.temperament ?? ""}
            placeholder={t("temperamentHint")}
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("notes")} error={errors.notes}>
            <textarea
              name="notes"
              defaultValue={dossier?.notes ?? ""}
              rows={3}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-4 text-[13.5px] font-medium transition-colors disabled:opacity-60"
          >
            {pending ? t("saving") : t("save")}
          </button>
          {saved && <span className="text-green text-[12.5px]">{t("saved")}</span>}
          {errors._ && <span className="text-red-text text-[12.5px]">{errors._}</span>}
        </div>
      </form>
    </section>
  );
}
