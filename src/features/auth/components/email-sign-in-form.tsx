"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "bg-bg-2 border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

/**
 * Email/password sign-in (spec 010). On success we do a FULL-PAGE navigation (not a client
 * router push) so the server/middleware re-read the refreshed auth cookie and apply the
 * membership gate. Accounts are superadmin-created; there is no public sign-up here.
 */
export function EmailSignInForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(t("emailSignInError"));
      setLoading(false);
      return;
    }
    // Full reload so SSR + middleware see the new cookie and apply the membership gate.
    window.location.assign("/");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-text-1 text-[12.5px] font-medium">{t("emailLabel")}</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@progix.com"
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-text-1 text-[12.5px] font-medium">{t("passwordLabel")}</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </label>
      {error && (
        <p
          role="alert"
          className="border-red/30 bg-red-tint text-red-text rounded-md border px-3 py-2 text-[13px]"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary flex h-11 w-full items-center justify-center rounded-full text-sm font-medium transition-all disabled:opacity-60"
      >
        {loading ? t("redirecting") : t("signInEmail")}
      </button>
    </form>
  );
}
