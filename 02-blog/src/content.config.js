import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { file, glob } from "astro/loaders";

const recentPosts = defineCollection({
  loader: file("src/content/recent-posts.json"),
  schema: z.object({
    image: z.string(),
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    categories: z.string().array(),
  }),
});

const posts = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "src/content/posts",
  }),
  schema: z.object({
    image: z.string(),
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    categories: z.string().array(),
  }),
});

export const collections = {
  recentPosts,
  posts,
};
