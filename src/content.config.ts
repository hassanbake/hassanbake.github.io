import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Each post is a folder with one file per language:
//   src/content/posts/<slug>/en.md
//   src/content/posts/<slug>/fa.md
const posts = defineCollection({
  loader: glob({ pattern: "**/{en,fa}.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // Optional link-preview image: a path under public/ or a full URL.
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
