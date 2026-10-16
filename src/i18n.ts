export const LOCALES = ["en", "fa"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<
  Locale,
  { dir: "ltr" | "rtl"; ogLocale: string; dateLocale: string; label: string }
> = {
  en: { dir: "ltr", ogLocale: "en_US", dateLocale: "en-US", label: "English" },
  fa: {
    dir: "rtl",
    ogLocale: "fa_IR",
    dateLocale: "fa-IR-u-ca-persian",
    label: "فارسی",
  },
};

export const STRINGS = {
  en: {
    tagline: "from raw ideas to baked understanding",
    description:
      "Technical essays and learning notes on Software Architecture, Machine Learning, Blockchain and building clear mental models.",
    posts: "Posts",
    noPosts: "No posts yet. The first one is in the oven.",
    rights: "All rights reserved.",
    rss: "RSS",
    notFound: "Page not found",
    backHome: "Back to home",
  },
  fa: {
    tagline: "از ایده‌های خام تا فهم پخته",
    description:
      "جستارهای فنی و یادداشت‌های یادگیری درباره معماری نرم‌افزار، یادگیری ماشین، بلاک‌چین و ساختن مدل‌های ذهنی روشن.",
    posts: "نوشته‌ها",
    noPosts: "هنوز نوشته‌ای منتشر نشده. اولی در فر است.",
    rights: "همه حقوق محفوظ است.",
    rss: "RSS",
    notFound: "صفحه پیدا نشد",
    backHome: "بازگشت به خانه",
  },
} satisfies Record<Locale, Record<string, string>>;

/** Prefix a path with the locale segment; English lives at the root. */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

export function postPath(locale: Locale, slug: string): string {
  return localePath(locale, `/posts/${slug}/`);
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_META[locale].dateLocale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}
