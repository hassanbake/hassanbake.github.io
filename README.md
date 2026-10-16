# hassanBake

Personal technical blog, built with [Astro](https://astro.build) as a fully static site.
English is the primary language (`/`), Persian is secondary (`/fa/`).

## Develop

```sh
npm install
npm run dev      # http://localhost:4321, drafts are visible
npm run build    # static output in dist/
```

Requires Node 22.22 or newer.

## Writing a post

Each post is a folder with one file per language:

```
src/content/posts/<slug>/en.md
src/content/posts/<slug>/fa.md   # optional
```

Front matter:

```yaml
---
title: Gradient Descent Basics
description: One or two sentences, used for SEO and link previews.
date: 2026-10-16
tags: [machine-learning]
image: /images/my-cover.png   # optional, under public/; defaults to /og-default.png
draft: false                  # drafts show only in `npm run dev`
---
```

Do not repeat the title as `# H1` in the body, the layout renders it. A post
with only one language still works; the language switch appears only when a
translation exists. `src/content/posts/hello-world` is a draft template.

URLs: `/posts/<slug>/`, `/fa/posts/<slug>/`. Feeds: `/rss.xml`, `/fa/rss.xml`.
Sitemap: `/sitemap-index.xml`. Old `article.html?slug=...&lang=...` links
redirect to the new URLs.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml` and publishes to GitHub Pages.
One-time setup: repository **Settings > Pages > Source: GitHub Actions**.

## Moving to hassanbake.com

1. Change `SITE_URL` in `astro.config.mjs` to `https://hassanbake.com`.
2. Create `public/CNAME` containing `hassanbake.com`.
3. Add the DNS records GitHub documents for Pages, then set the custom domain
   in Settings > Pages and enable HTTPS.

Every canonical URL, sitemap, RSS and link-preview URL derives from `SITE_URL`,
and all internal links are relative, so nothing else changes.
