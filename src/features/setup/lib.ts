// Pure, client-safe helpers for the client setup page (spec 017). Uses Web Crypto (global in Node
// 18+ and the browser) so this stays importable from both server actions and client components.

function randomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
}

/** A 43-char base64url share token (matches the portal's token shape). Raw only in the URL. */
export function generateToken(): string {
  let bin = "";
  for (const b of randomBytes(32)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Human-friendly passcode alphabet — no 0/O/1/I/L ambiguity.
const PASSCODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** An 8-char passcode the team relays to the client (shown once; bcrypt-hashed at rest). */
export function generatePasscode(): string {
  return Array.from(randomBytes(8), (b) => PASSCODE_ALPHABET[b % PASSCODE_ALPHABET.length]).join(
    "",
  );
}

/** Reject anything not token-shaped before touching the DB (same rule as the portal). */
export function isTokenShaped(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,80}$/.test(token);
}

/** A passcode the client typed is plausible (length/charset) before we attempt a verify. */
export function isPasscodeShaped(passcode: string): boolean {
  return /^[A-Za-z0-9]{4,32}$/.test(passcode.trim());
}

/**
 * Safe embed src for a tutorial link on the client page — YouTube/Loom/Vimeo only, else null (so the
 * client surface never renders an arbitrary iframe). Mirrors the tutorials slice's parser; the two
 * features can't import each other.
 */
export function videoEmbedSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, "").toLowerCase();
  const safeId = (s: string | null | undefined) => (s && /^[A-Za-z0-9_-]+$/.test(s) ? s : null);
  if (host === "youtu.be") {
    const v = safeId(u.pathname.slice(1).split("/")[0]);
    return v ? `https://www.youtube.com/embed/${v}` : null;
  }
  if (host === "youtube.com") {
    if (u.pathname === "/watch") {
      const v = safeId(u.searchParams.get("v"));
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
    const v = m ? safeId(m[1]) : null;
    return v ? `https://www.youtube.com/embed/${v}` : null;
  }
  if (host === "vimeo.com") {
    const m = u.pathname.match(/^\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (host === "player.vimeo.com") {
    const m = u.pathname.match(/^\/video\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (host === "loom.com") {
    const m = u.pathname.match(/^\/(?:share|embed)\/([A-Za-z0-9]+)/);
    return m ? `https://www.loom.com/embed/${m[1]}` : null;
  }
  return null;
}
