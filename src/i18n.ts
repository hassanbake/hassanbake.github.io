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
    // Persian site: Jalali (Shamsi) calendar with Persian digits and month
    // names. The English site stays Gregorian.
    dateLocale: "fa-IR-u-ca-persian",
    label: "فارسی",
  },
};

export const STRINGS = {
  en: {
    tagline: "Notes and knots.",
    descriptor: "Software architecture, AI-assisted code, and geometry made with code.",
    kicker: "Architecture · AI-assisted code · Geometric art",
    navNotes: "Notes",
    navHello: "Hello",
    latestNotes: "Latest notes",
    filterAll: "All",
    allNotes: "All notes",
    newBadge: "New",
    noNotes: "No notes yet. The first one is in the oven.",
    minRead: "min read",
    sayHello: "Say hello",
    backToNotes: "All notes",
    backToTop: "Back to all notes",
    onThisPage: "On this page",
    keepReading: "Keep reading",
    defaultCategory: "Notes",
    rights: "All rights reserved.",
    notFound: "Page not found",
    backHome: "Back to home",
    homeLabel: "Home",
    primaryNav: "Main",
    topics: "Topics",
    notesBy: "Notes by",
    readInOther: "Read this note in Persian",
    otherLanguage: "Language",
  },
  fa: {
    tagline: "یادداشت‌ها و گره‌ها.",
    descriptor: "معماری نرم‌افزار، کدنویسی با هوش مصنوعی، و هندسه‌ای که با کد ساخته می‌شود.",
    kicker: "معماری · کدنویسی با هوش مصنوعی · گره‌کشی",
    navNotes: "یادداشت‌ها",
    navHello: "سلام",
    latestNotes: "تازه‌ترین یادداشت‌ها",
    filterAll: "همه",
    allNotes: "همه یادداشت‌ها",
    newBadge: "تازه",
    noNotes: "هنوز یادداشتی منتشر نشده. اولی در فر است.",
    minRead: "دقیقه مطالعه",
    sayHello: "سلام بگویید",
    backToNotes: "همه یادداشت‌ها",
    backToTop: "بازگشت به همه یادداشت‌ها",
    onThisPage: "در این صفحه",
    keepReading: "ادامه مطالعه",
    defaultCategory: "یادداشت",
    rights: "همه حقوق محفوظ است.",
    notFound: "صفحه پیدا نشد",
    backHome: "بازگشت به خانه",
    homeLabel: "خانه",
    primaryNav: "اصلی",
    topics: "موضوع‌ها",
    notesBy: "یادداشت‌های",
    readInOther: "این یادداشت را به انگلیسی بخوانید",
    otherLanguage: "زبان",
  },
} satisfies Record<Locale, Record<string, string>>;

/** Prefix a path with the locale segment; English lives at the root. */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

/** Tagline plus descriptor: the meta description of the home page and feeds. */
export function siteDescription(locale: Locale): string {
  return `${STRINGS[locale].tagline} ${STRINGS[locale].descriptor}`;
}

export function authorPath(locale: Locale, slug: string): string {
  return localePath(locale, `/authors/${slug}/`);
}

export function notePath(locale: Locale, slug: string): string {
  return localePath(locale, `/notes/${slug}/`);
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_META[locale].dateLocale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

/** Year for the footer: Jalali on the Persian site, Gregorian on the English one. */
export function formatYear(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_META[locale].dateLocale, {
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(/[,٬]/g, "");
}

/** Numbers in the right digits for the locale (Persian digits on /fa/). */
export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
}
