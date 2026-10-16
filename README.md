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

## Writing a note

Each note is a folder with one file per language:

```
src/content/posts/<slug>/en.md
src/content/posts/<slug>/fa.md   # optional
```

Front matter:

```yaml
---
title: Gradient Descent Basics
description: One or two sentences, used as standfirst, SEO description and card summary.
date: 2026-10-16
category: Machine learning     # chip + home filter; defaults to "Notes" / «یادداشت»
author: Name Surname           # optional byline, defaults to the site author in src/config.ts
tags: [optimization]
image: /my-cover.png           # optional link preview, under public/; defaults to /og-default.png
draft: false                   # drafts show only in `npm run dev`
---
```

Do not repeat the title as `# H1` in the body, the layout renders it. Use `##`
headings: they are numbered and feed the table of contents. Supported blocks:
lead paragraph (the first one), pull quote (`>`), numbered cards (ordered
list), code with a file-name bar (` ```ts title="file.ts" `) and a callout
(`<div class="callout">` with blank lines around the Markdown inside).
`src/content/posts/hello-world` is a draft showing all of them.

A note with only one language still works; the language switch appears only
when a translation exists. The newest note is featured on the home page.

URLs: `/notes/<slug>/`, `/fa/notes/<slug>/`. Feeds: `/rss.xml`, `/fa/rss.xml`.
Sitemap: `/sitemap-index.xml`. Old `article.html?slug=...&lang=...` links
redirect to the new URLs.

## Design

"Blend Navy": navy frame, ivory reading surface. Tokens and motion live in
`src/styles/global.css`; all motion is CSS and respects `prefers-reduced-motion`.
Brand rules: the name is always lowercase `hassanbake`, and the site shows no
bio, job title or company, only an author name.

Fonts are installed from npm (`@fontsource*`) and bundled at build time.
Persian uses IRANYekan when licensed web files are provided, otherwise
Vazirmatn (OFL). To add IRANYekan, put the licensed `.woff2` files in
`public/fonts/` and add `@font-face` rules for the family `IRANYekan` in
`global.css`; the font stack already prefers it. Do not commit font files
whose license has not been confirmed.

Contact chips in the "Say hello" band come from `SITE.contact` in `src/config.ts`;
empty values are hidden (the email is not set yet).

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
