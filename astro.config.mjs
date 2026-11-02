import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { transformerMetaHighlight, transformerMetaWordHighlight } from '@shikijs/transformers';
import { transformerMetaTitle, transformerMetaDiff } from './src/lib/shiki-meta.mjs';
import { amrDerivedTitle } from './src/lib/remark/derived-title.mjs';
import { arabicBlockDirection } from './src/lib/remark/arabic-direction.mjs';
import { createMediaBasePlugin, taskListLabels } from './src/lib/hast/media-base.mjs';
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

export const SITE_BASE = '/amr-tech';

// Redirect stubs (noindex) must not appear in the sitemap: root + latest-version aliases.
function noindexStubs() {
  const dir = './src/content/blogs';
  const stubs = ['/'];
  if (existsSync(dir)) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const vs = readdirSync(path.join(dir, e.name))
        .filter((f) => /^v\d+\.md$/i.test(f))
        .map((f) => Number(f.slice(1).match(/^\d+/)[0]));
      if (vs.length > 1) stubs.push(`/blogs/${e.name}/v${Math.max(...vs)}/`);
    }
  }
  return stubs;
}
const STUBS = noindexStubs();

export default defineConfig({
  site: 'https://alaamer12.github.io',
  base: SITE_BASE,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => {
        if (page.endsWith('.md')) return false;
        const rel = page.slice('https://alaamer12.github.io'.length + SITE_BASE.length) || '/';
        return !STUBS.includes(rel.endsWith('/') ? rel : `${rel}/`);
      },
    }),
  ],
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      transformers: [
        transformerMetaHighlight(),
        transformerMetaWordHighlight(),
        transformerMetaTitle(),
        transformerMetaDiff(),
      ],
    },
    processor: satteri({
      mdastPlugins: [amrDerivedTitle, arabicBlockDirection],
      hastPlugins: [createMediaBasePlugin(SITE_BASE), taskListLabels],
    }),
  },
});
