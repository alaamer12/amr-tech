import { getCollection } from 'astro:content';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { assertNoDuplicates } from './dedup.mjs';

// Eager metadata map for repo images the resolver may have rewritten into src/assets.
const assetImages = import.meta.glob('../assets/blogs/**/*.{png,jpg,jpeg,gif,webp,avif,svg}', { eager: true });

const VERSION_RE = /^(.+)\/v(\d+)$/i;
const FOLDER_INDEX_RE = /^(?:.*\/)?(index|readme)$/i;

// "Package resolver" convention: a folder containing index.md (or README.md)
// at the top level of a post folder makes the whole thing a tree post —
// every other .md under that folder becomes a page of the same post.
export function treeSlugOf(id) {
  const m = id.match(/^([^/]+)\//);
  return m ? m[1] : null;
}

export function isFolderIndex(id) {
  return FOLDER_INDEX_RE.test(id);
}

export function pageUrlPath(id) {
  const stripped = id.replace(/\.(md)$/, '');
  const [top, ...rest] = stripped.split('/');
  if (rest.length === 0) return null; // top-level single post, not a tree page
  if (isFolderIndex(stripped)) return rest.slice(0, -1).join('/'); // '' for the tree root
  return rest.join('/');
}

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

  // Detect tree posts: a top-level folder holding index.md / README.md.
  const treeRoots = new Map(); // slug -> entry id of the folder index
  for (const entry of entries) {
    const m = entry.id.match(/^([^/]+)\/(index|readme)$/i);
    if (m) {
      const slug = m[1];
      const existing = treeRoots.get(slug);
      if (existing) {
        throw new Error(
          `DUPLICATED FOLDER INDEX — "${slug}/" has both "${existing}" and "${entry.id}". Keep one.`,
        );
      }
      treeRoots.set(slug, entry.id);
    }
  }

  const metaOf = (entry, version) => {
    const words = stripFrontmatter(entry.body ?? '').split(/\s+/).filter(Boolean).length;
    const img = firstImageOf(entry);
    return {
      entry,
      id: entry.id,
      version,
      title: resolveTitle(entry),
      date: resolveDate(entry, buildDate),
      excerpt: excerptOf(entry),
      readingMinutes: Math.max(1, Math.round(words / 230)),
      thumbnailMeta: img.meta ?? null,
      thumbnailUrl: img.url ?? null,
    };
  };

  const bySlug = new Map();
  const trees = new Map(); // slug -> page metas (incl. root)

  for (const entry of entries) {
    const tSlug = treeSlugOf(entry.id);
    if (tSlug && treeRoots.has(tSlug)) {
      if (!trees.has(tSlug)) trees.set(tSlug, []);
      const urlPath = pageUrlPath(entry.id) ?? '';
      const meta = metaOf(entry, 1);
      meta.urlPath = urlPath;
      meta.depth = urlPath === '' ? 0 : urlPath.split('/').length;
      trees.get(tSlug).push(meta);
      continue;
    }
    const { slug, version } = parseId(entry.id);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(metaOf(entry, version));
  }

  const posts = [];
  for (const [slug, pages] of trees) {
    const seen = new Map();
    for (const p of pages) {
      if (seen.has(p.urlPath)) {
        throw new Error(
          `DUPLICATED ROUTE — "${p.urlPath}" claimed by both "${seen.get(p.urlPath)}" and "${p.id}".`,
        );
      }
      seen.set(p.urlPath, p.id);
    }
    const root = pages.find((p) => p.urlPath === '');
    const children = pages
      .filter((p) => p.urlPath !== '')
      .sort((a, b) => {
        const oa = a.entry.data.order ?? 9999;
        const ob = b.entry.data.order ?? 9999;
        return oa - ob || a.urlPath.localeCompare(b.urlPath);
      });
    const tree = [root, ...children];
    const total = tree.reduce((sum, p) => sum + p.readingMinutes, 0);
    root.readingMinutes = total;
    for (const p of children) {
      p.crumbs = [];
      const parts = p.urlPath.split('/');
      for (let i = 1; i < parts.length; i++) {
        const ancestor = tree.find((t) => t.urlPath === parts.slice(0, i).join('/'));
        if (ancestor) p.crumbs.push({ title: ancestor.title, urlPath: ancestor.urlPath });
      }
    }
    posts.push({ slug, versions: [root], latest: root, tree, isTree: true, data: root.entry.data, entry: root.entry });
  }

  for (const [slug, versions] of bySlug) {
    versions.sort((a, b) => a.version - b.version);
    const latest = versions[versions.length - 1];
    posts.push({ slug, versions, latest, isTree: false, data: latest.entry.data, entry: latest.entry });
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
