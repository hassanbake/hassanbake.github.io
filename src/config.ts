import type { Locale } from "./i18n";

export const SITE = {
  // Always lowercase and Latin, also on the Persian site.
  name: "hassanbake",
  defaultImage: "/og-default.png",
  // Default byline. A note can override it with `author:` in its front matter.
  author: {
    en: "Roozbeh Maheronnaghsh",
    fa: "روزبه ماهرالنقش",
  } satisfies Record<Locale, string>,
  // Contact chips in the "Say hello" band. Leave a value empty to hide it.
  contact: {
    email: "roozbeh@hassanbake.com",
    github: "https://github.com/hassanbake",
    linkedin: "",
  },
  // Scrolling strip under the hero.
  topics: {
    en: ["Software architecture", "AI-assisted code", "System design", "Machine learning", "Blockchain", "Mental models"],
    fa: ["معماری نرم‌افزار", "کدنویسی با هوش مصنوعی", "طراحی سیستم", "یادگیری ماشین", "بلاک‌چین", "مدل‌های ذهنی"],
  } satisfies Record<Locale, string[]>,
};
