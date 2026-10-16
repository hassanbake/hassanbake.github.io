import type { Locale } from "./i18n";

export const SITE = {
  // Always lowercase and Latin, also on the Persian site.
  name: "hassanbake",
  // Slug of the default author page: /authors/<slug>/ and /fa/authors/<slug>/.
  authorSlug: "roozbeh-maheronnaghsh",
  // Default byline. A note can override it with `author:` in its front matter.
  author: {
    en: "Roozbeh Maheronnaghsh",
    fa: "روزبه ماهرالنقش",
  } satisfies Record<Locale, string>,
  // Contact links in the footer and on the author page. Leave a value empty to hide it.
  contact: {
    email: "roozbeh@hassanbake.com",
    github: "https://github.com/hassanbake",
    linkedin: "https://www.linkedin.com/in/hassanbake",
  },
};
