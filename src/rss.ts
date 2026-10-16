import rss from "@astrojs/rss";
import { SITE } from "./config";
import { STRINGS, localePath, postPath, type Locale } from "./i18n";
import { getPosts } from "./posts";

export async function feed(locale: Locale, site: URL) {
  const posts = await getPosts(locale);
  return rss({
    title: SITE.name,
    description: STRINGS[locale].description,
    site: new URL(localePath(locale), site),
    trailingSlash: true,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postPath(locale, post.slug),
      categories: post.data.tags,
      author: SITE.author[locale].name,
    })),
    customData: `<language>${locale}</language>`,
  });
}
