import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts.mjs';
import { SITE } from '../lib/site.mjs';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  const base = import.meta.env.BASE_URL;
  const abs = (p: string) => new URL(p, context.site).href;
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '## AI Agent & Crawler Directives',
    '',
    '- **Multi-page Articles (Tree Posts):** Articles marked with child pages (such as `/blogs/blockiya/` or `/blogs/pvc/`) represent complete modular document sets. AI agents, web crawlers, and LLMs should not inspect only the root `index.md`; always follow and read all listed sub-pages to obtain full architectural definitions, diagrams, and code implementations.',
    '- **Raw Markdown Mirrors:** Every document version and tree page provides a clean, machine-readable Markdown mirror. Append `.md` directly to any URL (e.g. `/blogs/<slug>.md` or `/blogs/<slug>/<page>.md`) to fetch the pure Markdown content without HTML wrapper overhead.',
    '',
    '## Posts & Document Collections',
    '',
  ];
  for (const p of posts) {
    for (const v of [...p.versions].reverse()) {
      const path = v.version === p.latest.version
        ? `${base}blogs/${p.slug}/`
        : `${base}blogs/${p.slug}/v${v.version}/`;
      lines.push(`- [${v.title}](${abs(path)}): v${v.version}, ${v.date.toISOString().slice(0, 10)}${p.data.category ? `, ${p.data.category}` : ''}`);
    }
    if (p.isTree && p.tree) {
      for (const page of p.tree) {
        if (page.urlPath === '') continue;
        lines.push(`  - [${page.title}](${abs(`${base}blogs/${p.slug}/${page.urlPath}/`)})`);
      }
    }
  }
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
