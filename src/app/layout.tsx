import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { MotionProvider } from "@/components/motion";
import { getServerPrefs } from "@/lib/settings/server";
import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "progixHub",
    template: "%s · progixHub",
  },
  description:
    "The internal hub for every Progix project — link its Notion, Slack, and GitHub, and keep its env vars and documents in one secured place.",
  applicationName: "progixHub",
  // Installable as a home-screen shortcut (spec 007). Next emits <link rel="manifest">
  // from app/manifest.ts; these add the iOS standalone behavior + apple-touch-icon.
  appleWebApp: { capable: true, title: "progixHub", statusBarStyle: "black-translucent" },
};

// Mobile-first viewport + theme-color for the browser/OS chrome (spec 007).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0d16",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Locale + theme are resolved server-side (cookie → JWT → default) so the first paint
  // is already correct — no flash of the wrong language or theme (spec 005 AC-5, ADR-0009).
  const { locale, theme } = await getServerPrefs();
  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <body className={`${ibmSans.variable} ${ibmMono.variable} font-sans antialiased`}>
        <NextIntlClientProvider>
          <MotionProvider>{children}</MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
