import rss from "@astrojs/rss";
import { SITE } from "./config";
import { STRINGS, localePath, notePath, type Locale } from "./i18n";
import { getNotes } from "./posts";

export async function feed(locale: Locale, site: URL) {
  const notes = await getNotes(locale);
  return rss({
    title: SITE.name,
    description: STRINGS[locale].tagline,
    site: new URL(localePath(locale), site),
    trailingSlash: true,
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.date,
      link: notePath(locale, note.slug),
      categories: [note.category, ...note.data.tags],
      author: note.author,
    })),
    customData: `<language>${locale}</language>`,
  });
}
