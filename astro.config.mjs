// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// The public address of the site. To move to a custom domain, change this
// value and add the domain to public/CNAME (see README.md).
const SITE_URL = "https://hassanbake.github.io";

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "always",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", fa: "fa" },
      },
    }),
  ],
  markdown: {
    shikiConfig: { theme: "github-dark" },
  },
});
