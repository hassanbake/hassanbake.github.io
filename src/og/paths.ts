import type { Locale } from "../i18n";

export const prefix = (locale: Locale) => (locale === "en" ? "" : "/fa");

/** Public URL path of a generated share image. */
export const ogPath = {
  site: (locale: Locale) => `/og${prefix(locale)}/site.png`,
  note: (locale: Locale, slug: string) => `/og${prefix(locale)}/notes/${slug}.png`,
  art: (locale: Locale, id: string) => `/og${prefix(locale)}/art/${id}.png`,
};
