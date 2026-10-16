import { getCollection, type CollectionEntry } from "astro:content";
import { SITE } from "./config";
import { STRINGS, type Locale } from "./i18n";

export type Note = CollectionEntry<"posts"> & {
  slug: string;
  locale: Locale;
  category: string;
  author: string;
  readingMinutes: number;
};

function withMeta(entry: CollectionEntry<"posts">): Note {
  const [slug, locale] = entry.id.split("/") as [string, Locale];
  const words = (entry.body ?? "").split(/\s+/).filter(Boolean).length;
  const wpm = locale === "fa" ? 170 : 220;
  return Object.assign(entry, {
    slug,
    locale,
    category: entry.data.category ?? STRINGS[locale].defaultCategory,
    author: entry.data.author ?? SITE.author[locale],
    readingMinutes: Math.max(1, Math.round(words / wpm)),
  });
}

/** Published notes (drafts show up only in `npm run dev`), newest first. */
export async function getNotes(locale?: Locale): Promise<Note[]> {
  const entries = await getCollection(
    "posts",
    (entry) => import.meta.env.DEV || !entry.data.draft,
  );
  return entries
    .map(withMeta)
    .filter((note) => !locale || note.locale === locale)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
