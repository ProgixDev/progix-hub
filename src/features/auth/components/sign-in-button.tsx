"use client";

import { useState } from "react";
import { GitHubGlyph } from "@/components/brand/surface-glyphs";
import { createClient } from "@/lib/supabase/client";

/** Starts the GitHub OAuth flow (requests `read:org` so we can verify org membership). */
export function SignInButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: "read:org",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="bg-bg-2 border-line-1 hover:bg-bg-3 text-text flex h-11 w-full items-center justify-center gap-3 rounded-md border text-sm font-medium transition-colors disabled:opacity-60"
    >
      <GitHubGlyph size={18} />
      {loading ? "Redirecting…" : "Continue with GitHub"}
    </button>
  );
}
