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
    // Gregorian calendar with Persian digits and month names. The calendar
    // (Jalali vs Gregorian) is still undecided; this is the placeholder.
    dateLocale: "fa-IR-u-ca-gregory",
    label: "فارسی",
  },
};

export const STRINGS = {
  en: {
    tagline: "Notes on architecture and AI-assisted code.",
    kicker: "Architecture · AI-assisted code",
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
  },
  fa: {
    tagline: "یادداشت‌هایی درباره‌ی معماری نرم‌افزار و کدنویسی با هوش مصنوعی.",
    kicker: "معماری · کدنویسی با هوش مصنوعی",
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
  },
} satisfies Record<Locale, Record<string, string>>;

/** Prefix a path with the locale segment; English lives at the root. */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
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

/** Numbers in the right digits for the locale (Persian digits on /fa/). */
export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
}
