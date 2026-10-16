import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Each note is a folder with one file per language:
//   src/content/posts/<slug>/en.md
//   src/content/posts/<slug>/fa.md
const posts = defineCollection({
  loader: glob({ pattern: "**/{en,fa}.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    // One or two sentences: standfirst, meta description and card summary.
    description: z.string(),
    // One short line for the rows on the home and author pages. Falls back to
    // `description`.
    teaser: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // Shown as a chip and used by the filter on the home page.
    category: z.string().optional(),
    // Byline name. Defaults to the site author.
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // Optional link-preview image: a path under public/ or a full URL.
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
