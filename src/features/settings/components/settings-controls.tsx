"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Locale, Prefs, Theme } from "@/lib/settings/prefs";
import { updateSettingsAction } from "../actions";

type Option = { value: string; label: string };

export function SettingsControls({ current }: { current: Prefs }) {
  const t = useTranslations("settings");
  const [locale, setLocale] = useState<Locale>(current.locale);
  const [theme, setTheme] = useState<Theme>(current.theme);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(patch: { locale?: Locale; theme?: Theme }) {
    setError(null);
    if (patch.locale) setLocale(patch.locale);
    if (patch.theme) {
      setTheme(patch.theme);
      document.documentElement.dataset.theme = patch.theme; // instant repaint before the server confirms
    }
    start(async () => {
      const res = await updateSettingsAction(patch);
      if (!res.ok) {
        setError(res.error);
        setLocale(current.locale);
        setTheme(current.theme);
        document.documentElement.dataset.theme = current.theme;
      }
    });
  }

  return (
    <div className="space-y-8">
      <Segment
        label={t("languageLabel")}
        help={t("languageHelp")}
        value={locale}
        disabled={pending}
        onChange={(value) => update({ locale: value as Locale })}
        options={[
          { value: "en", label: t("optionEnglish") },
          { value: "fr", label: t("optionFrench") },
        ]}
      />
      <Segment
        label={t("themeLabel")}
        help={t("themeHelp")}
        value={theme}
        disabled={pending}
        onChange={(value) => update({ theme: value as Theme })}
        options={[
          { value: "light", label: t("optionLight") },
          { value: "dark", label: t("optionDark") },
        ]}
      />
      {error && (
        <p role="alert" className="text-red-text text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}

function Segment({
  label,
  help,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  help: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  // Roving focus + arrow-key selection — the WAI-ARIA radiogroup contract.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = options.findIndex((o) => o.value === value);
    let next = current;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (current + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (current - 1 + options.length) % options.length;
    else return;
    event.preventDefault();
    onChange(options[next]!.value);
    const radios = event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]');
    radios[next]?.focus();
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-sm">
        <h2 className="text-text text-[14px] font-medium">{label}</h2>
        <p className="text-text-3 mt-1 text-[12.5px]">{help}</p>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="border-line-1 bg-bg-2 inline-flex flex-none rounded-lg border p-1"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`h-8 rounded-md px-3.5 text-[13px] font-medium transition-colors disabled:opacity-60 ${
                active ? "bg-blue text-primary-foreground" : "text-text-1 hover:text-text"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
