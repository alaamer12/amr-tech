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

async function walkMd(dir, rel) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walkMd(abs, r)));
    else if (e.name.endsWith('.md')) out.push({ file: abs, rel: r });
  }
  return out;
}

async function collect() {
  const mirrors = []; // [{ file, targets: [relPathUnderDistBlogs] }]
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.md')) {
      mirrors.push({ file: path.join(CONTENT_DIR, e.name), targets: [e.name] });
    } else if (e.isDirectory()) {
      const files = await readdir(path.join(CONTENT_DIR, e.name));
      const rootIdx = files.find((f) => /^(index|readme)\.md$/i.test(f));
      if (rootIdx) {
        // tree post: mirror every page by its tree path, root also as <slug>.md
        const all = await walkMd(path.join(CONTENT_DIR, e.name), '');
        for (const { file, rel } of all) {
          const targets = [path.posix.join(e.name, rel)];
          if (rel === rootIdx) targets.push(`${e.name}.md`);
          mirrors.push({ file, targets });
        }
        continue;
      }
      const versions = [];
      for (const f of files) {
        const m = f.match(/^v(\d+)\.md$/i);
        if (m) versions.push({ file: path.join(CONTENT_DIR, e.name, f), version: Number(m[1]) });
      }
      if (versions.length > 0) {
        versions.sort((a, b) => a.version - b.version);
        const latest = versions[versions.length - 1];
        for (const { file, version } of versions) {
          const targets =
            version === latest.version
              ? [`${e.name}.md`]
              : [path.posix.join(e.name, `v${version}.md`)];
          mirrors.push({ file, targets });
        }
      }
    }
  }
  return mirrors;
}

const mirrors = await collect();
await mkdir(DIST_BLOGS, { recursive: true });

for (const { file, targets } of mirrors) {
  const text = await readFile(file, 'utf-8');
  if (isDraft(text)) continue;
  for (const t of targets) {
    const dest = path.join(DIST_BLOGS, t);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(file, dest);
  }
}

console.log(`emit-mirrors: wrote ${mirrors.reduce((n, m) => n + m.targets.length, 0)} raw .md mirror(s)`);
