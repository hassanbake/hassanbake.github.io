import type { Locale } from "./i18n";
import { getPosts } from "./posts";

/** getStaticPaths for /posts/<slug>/ and /fa/posts/<slug>/. */
export async function postStaticPaths(locale: Locale) {
  const all = await getPosts();
  return all
    .filter((post) => post.locale === locale)
    .map((post) => ({
      params: { slug: post.slug },
      props: {
        post,
        translation: all.find((p) => p.slug === post.slug && p.locale !== locale),
      },
    }));
}
