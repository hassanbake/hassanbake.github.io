import { SITE } from "./config";
import type { Locale } from "./i18n";
import { getNotes } from "./posts";

/** getStaticPaths for /notes/<slug>/ and /fa/notes/<slug>/. */
export async function noteStaticPaths(locale: Locale) {
  const all = await getNotes();
  const inLocale = all.filter((note) => note.locale === locale);
  return inLocale.map((note) => ({
    params: { slug: note.slug },
    props: {
      note,
      translation: all.find((n) => n.slug === note.slug && n.locale !== locale),
      more: inLocale.filter((n) => n.slug !== note.slug).slice(0, 3),
    },
  }));
}

/** getStaticPaths for /authors/<slug>/ and /fa/authors/<slug>/. */
export async function authorStaticPaths(locale: Locale) {
  const notes = await getNotes(locale);
  return [
    {
      params: { slug: SITE.authorSlug },
      props: {
        locale,
        slug: SITE.authorSlug,
        notes: notes.filter((note) => note.authorSlug === SITE.authorSlug),
      },
    },
  ];
}
