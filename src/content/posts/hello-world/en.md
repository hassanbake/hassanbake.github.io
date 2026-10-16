---
title: Hello, world
description: A template note that shows every supported block. It is a draft, so it never appears on the live site.
date: 2026-10-16
category: Meta
draft: true
---

This is a **draft** that only shows up in `npm run dev`. Copy this folder to
start a new note, then set `draft: false` (or remove the line) to publish it.
The first paragraph becomes the larger lead paragraph.

## Headings are numbered

The title and standfirst come from the front matter, so start the body with
`##` headings. They feed the table of contents and get a small number above them.

> A blockquote renders as a pull quote.

## Lists, code and callouts

1. An ordered list becomes numbered cards.
2. Keep each item short.

```ts title="example.ts"
export const add = (a: number, b: number) => a + b;
```

Add a title after the language to get the file-name bar above a code block.

<div class="callout">

**What to take away.** Wrap text in `<div class="callout">` with blank lines around the Markdown inside.

</div>
