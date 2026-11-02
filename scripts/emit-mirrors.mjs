import { readFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'blogs');
const DIST = path.join(ROOT, 'dist');
const DIST_BLOGS = path.join(DIST, 'blogs');

function isDraft(text) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return fm ? /^draft:\s*true\s*$/m.test(fm[1]) : false;
}

async function collect() {
  const posts = new Map(); // slug -> [{ file, version }]
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.md')) {
      posts.set(path.basename(e.name, '.md'), [{ file: path.join(CONTENT_DIR, e.name), version: 1 }]);
    } else if (e.isDirectory()) {
      const versions = [];
      for (const f of await readdir(path.join(CONTENT_DIR, e.name))) {
        const m = f.match(/^v(\d+)\.md$/i);
        if (m) versions.push({ file: path.join(CONTENT_DIR, e.name, f), version: Number(m[1]) });
      }
      if (versions.length > 0) posts.set(e.name, versions.sort((a, b) => a.version - b.version));
    }
  }
  return posts;
}

const posts = await collect();
await mkdir(DIST_BLOGS, { recursive: true });

for (const [slug, versions] of posts) {
  const latest = versions[versions.length - 1];
  for (const { file, version } of versions) {
    const text = await readFile(file, 'utf-8');
    if (isDraft(text)) continue;
    if (version === latest.version) {
      await copyFile(file, path.join(DIST_BLOGS, `${slug}.md`));
    } else {
      const dir = path.join(DIST_BLOGS, slug);
      await mkdir(dir, { recursive: true });
      await copyFile(file, path.join(dir, `v${version}.md`));
    }
  }
}

console.log(`emit-mirrors: wrote raw .md mirrors for ${posts.size} post(s)`);
