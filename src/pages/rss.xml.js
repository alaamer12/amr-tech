import rss from '@astrojs/rss';
import { getPosts } from '../lib/posts.mjs';
import { SITE } from '../lib/site.mjs';

export async function GET(context) {
  const posts = await getPosts();
  const base = import.meta.env.BASE_URL;
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: new URL(base, context.site).href,
    trailingSlash: true,
    items: posts.map((p) => ({
      title: p.latest.title,
      description: p.data.description ?? p.latest.excerpt,
      pubDate: p.latest.date,
      link: `blogs/${p.slug}/`,
    })),
  });
}
