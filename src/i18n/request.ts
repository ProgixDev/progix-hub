import { getRequestConfig } from "next-intl/server";
import { getServerPrefs } from "@/lib/settings/server";
import { messagesFor } from "./messages";

// next-intl without locale routing (ADR-0009): the locale comes from the per-user
// preference (cookie → JWT → default), not the URL. English is underlaid for fallback.
export default getRequestConfig(async () => {
  const { locale } = await getServerPrefs();
  return { locale, messages: messagesFor(locale) };
});
