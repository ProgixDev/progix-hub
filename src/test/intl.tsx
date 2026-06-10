import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import en from "@/messages/en.json";

/** Wraps children in an English next-intl provider for unit tests. */
export function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * `render()` wrapped in an English next-intl provider. Use for any component that calls
 * `useTranslations`/`useLocale` (spec 005). Assertions stay in English (the default catalog).
 */
export function renderWithIntl(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: IntlWrapper, ...options });
}

export { en as enMessages };
