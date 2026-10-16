import { ART_PIECES, ART_SERIES } from "./art";
import { SITE } from "./config";
import { STRINGS, formatDate, type Locale } from "./i18n";
import { getNotes } from "./posts";
import type { CardInput } from "./og/card";


/** Every share image on the site, keyed by the path under /og/ (no extension). */
export async function ogCards(): Promise<Record<string, CardInput>> {
  const cards: Record<string, CardInput> = {};
  for (const locale of ["en", "fa"] as const) {
    const t = STRINGS[locale];
    const key = (rest: string) => `${locale === "en" ? "" : "fa/"}${rest}`;
    cards[key("site")] = { locale, title: t.tagline, eyebrow: t.kicker };
    for (const note of await getNotes(locale)) {
      cards[key(`notes/${note.slug}`)] = {
        locale,
        title: note.data.title,
        eyebrow: note.category,
        byline: note.author,
        detail: formatDate(note.data.date, locale),
      };
    }
    for (const piece of ART_PIECES) {
      const series = ART_SERIES.find((s) => s.id === piece.series);
      cards[key(`art/${piece.id}`)] = {
        locale,
        title: piece.title[locale],
        eyebrow: series?.title[locale] ?? t.artTitle,
        byline: SITE.author[locale],
        artwork: piece.image.small.file,
      };
    }
  }
  return cards;
}
