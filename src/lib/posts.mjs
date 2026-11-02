import { getCollection } from 'astro:content';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { assertNoDuplicates } from './dedup.mjs';

// Eager metadata map for repo images the resolver may have rewritten into src/assets.
const assetImages = import.meta.glob('../assets/blogs/**/*.{png,jpg,jpeg,gif,webp,avif,svg}', { eager: true });

const VERSION_RE = /^(.+)\/v(\d+)$/i;

export function parseId(id) {
  const m = id.match(VERSION_RE);
  return m ? { slug: m[1], version: Number(m[2]) } : { slug: id, version: 1 };
}

export function isDirectoryPost(id) {
  return VERSION_RE.test(id);
}

export function cleanName(raw) {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    /* keep raw if not percent-encoded */
  }
  s = s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^[\x20-\x7E]*$/.test(s)) {
    s = s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
  }
  return s;
}

function stripFrontmatter(body) {
  return body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

export function firstH1(body) {
  const m = stripFrontmatter(body).match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

export function resolveTitle(entry) {
  if (entry.data.title !== undefined && entry.data.title !== null) return entry.data.title;
  const { slug } = parseId(entry.id);
  if (!isDirectoryPost(entry.id)) {
    const h1 = firstH1(entry.body ?? '');
    if (h1) return h1;
  }
  const segment = slug.split('/').pop();
  return cleanName(segment);
}

function gitCreatedDate(filePath) {
  try {
    const out = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--format=%ad', '--date=iso', '--', filePath],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const lines = out.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return null;
    const d = new Date(lines[lines.length - 1]);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function resolveDate(entry, buildDate) {
  if (entry.data.date) return entry.data.date;
  return gitCreatedDate(entry.filePath) ?? buildDate;
}

export function excerptOf(entry) {  if (entry.data.description) return entry.data.description;
  const body = stripFrontmatter(entry.body ?? '')
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\[?\^?\d*\]?\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[<\[].*$/gm, '')
    .replace(/[*_`>~=|-]+/g, ' ');
  const para = body.split(/\r?\n\s*\r?\n/).map((p) => p.replace(/\s+/g, ' ').trim()).find((p) => p.length > 0);
  if (!para) return '';
  return para.length > 160 ? `${para.slice(0, 157).trimEnd()}…` : para;
}

// First image in the body becomes the thumbnail/OG when frontmatter omits one.
export function firstImageOf(entry) {
  const body = stripFrontmatter(entry.body ?? '');
  const m =
    body.match(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?/) ||
    body.match(/<img[^>]+src="([^"]+)"/);
  if (!m) return {};
  const ref = m[1];
  if (ref.startsWith('http')) return {};
  if (ref.startsWith('/media/') || ref.startsWith('/amr-tech/media/')) {
    return { url: ref.startsWith('/amr-tech') ? ref : `/amr-tech${ref}` };
  }
  const relDir = path.posix.dirname(path.posix.join('src/content/blogs', entry.id + '.md'));
  const norm = path.posix.normalize(path.posix.join(relDir, ref));
  const globKey = '../' + norm.slice('src/'.length);
  const mod = assetImages[globKey];
  if (mod?.default) return { meta: mod.default };
  return {};
}

export async function getPosts() {
  const entries = await getCollection('blogs', ({ data }) => !(import.meta.env.PROD && data.draft));
  assertNoDuplicates(entries);

  const buildDate = new Date();
  const bySlug = new Map();
  for (const entry of entries) {
    const { slug, version } = parseId(entry.id);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    const words = stripFrontmatter(entry.body ?? '').split(/\s+/).filter(Boolean).length;
    const img = firstImageOf(entry);
    bySlug.get(slug).push({
      entry,
      id: entry.id,
      version,
      title: resolveTitle(entry),
      date: resolveDate(entry, buildDate),
      excerpt: excerptOf(entry),
      readingMinutes: Math.max(1, Math.round(words / 230)),
      thumbnailMeta: img.meta ?? null,
      thumbnailUrl: img.url ?? null,
    });
  }

  const posts = [];
  for (const [slug, versions] of bySlug) {
    versions.sort((a, b) => a.version - b.version);
    const latest = versions[versions.length - 1];
    posts.push({ slug, versions, latest, data: latest.entry.data, entry: latest.entry });
  }

  posts.sort((a, b) => b.latest.date - a.latest.date);
  return posts;
}

export function postUrl(slug, version, latestVersion) {
  const base = `/blogs/${slug}/`;
  return version === latestVersion ? base : `${base}v${version}/`;
}

export function categoriesOf(posts) {
  const set = new Set();
  for (const p of posts) {
    const c = p.data.category;
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function relatedOf(post, allPosts, limit = 10) {
  const scored = [];
  for (const other of allPosts) {
    if (other.slug === post.slug) continue;
    let score = 0;
    if (post.data.category && other.data.category === post.data.category) score += 2;
    const shared = (other.data.tags ?? []).filter((t) => (post.data.tags ?? []).includes(t));
    score += shared.length;
    if (score === 0) score = 0.5;
    scored.push({ other, score });
  }
  scored.sort((a, b) => b.score - a.score || b.other.latest.date - a.other.latest.date);
  return scored.slice(0, limit).map((s) => ({
    slug: s.other.slug,
    title: s.other.latest.title,
    date: s.other.latest.date,
    category: s.other.data.category ?? '',
    readingMinutes: s.other.latest.readingMinutes,
    lang: s.other.data.lang,
  }));
}
