import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogs = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_assets/**'],
    base: './src/content/blogs',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.coerce.date().optional(),
        category: z.string().nullable().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
        order: z.number().optional(),
        thumbnail: z.union([image(), z.literal('tree')]).optional(),
        background: z.union([image(), z.literal('tree')]).optional(),
        bg_mode: z.enum(['top', 'repeat', 'stretch']).default('top'),
        lang: z.string().default('en'),
      })
      .strict(),
});

export const collections = { blogs };
