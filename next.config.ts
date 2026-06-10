import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

// i18n without locale routing — the request locale is resolved in src/i18n/request.ts
// from the per-user preference (cookie → JWT → default). See ADR-0009.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
