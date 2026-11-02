import { getPosts } from '../lib/posts.mjs';
import { SITE } from '../lib/site.mjs';

export async function GET(context) {
  const posts = await getPosts();
  const base = import.meta.env.BASE_URL;
  const abs = (p) => new URL(p, context.site).href;
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    'Each post lists all published versions. Append `.md` to any version URL for the raw markdown.',
    '',
    '## Posts',
    '',
  ];
  for (const p of posts) {
    for (const v of [...p.versions].reverse()) {
      const path = v.version === p.latest.version
        ? `${base}blogs/${p.slug}/`
        : `${base}blogs/${p.slug}/v${v.version}/`;
      lines.push(`- [${v.title}](${abs(path)}): v${v.version}, ${v.date.toISOString().slice(0, 10)}${p.data.category ? `, ${p.data.category}` : ''}`);
    }
  }
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
