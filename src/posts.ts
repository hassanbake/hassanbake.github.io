import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "./i18n";

export type Post = CollectionEntry<"posts"> & { slug: string; locale: Locale };

function withMeta(entry: CollectionEntry<"posts">): Post {
  const [slug, locale] = entry.id.split("/") as [string, Locale];
  return Object.assign(entry, { slug, locale });
}

/** Published posts (drafts show up only in `npm run dev`), newest first. */
export async function getPosts(locale?: Locale): Promise<Post[]> {
  const entries = await getCollection(
    "posts",
    (entry) => import.meta.env.DEV || !entry.data.draft,
  );
  return entries
    .map(withMeta)
    .filter((post) => !locale || post.locale === locale)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
