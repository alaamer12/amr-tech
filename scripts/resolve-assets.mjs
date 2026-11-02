import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'blogs');
const { SITE_BASE } = await import('../astro.config.mjs');

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico']);

// Disk-absolute references: Windows drive (F:\ or F:/), UNC (\\server\), tilde (~)
const DISK_REF_RE = /(?<quote>["(])\s*(?<p>(?:[A-Za-z]:[\\/][^\s"'")]+|\\\\[^\s"'")]+|~[\\/][^\s"'")]+))/g;

function expandPath(raw) {
  if (raw.startsWith('~')) return path.join(process.env.USERPROFILE || process.env.HOME, raw.slice(1).replace(/^[\\/]/, ''));
  return raw;
}

function slugDirFor(file) {
  const rel = path.relative(CONTENT_DIR, file).replace(/\\/g, '/');
  return rel.includes('/') ? rel.split('/')[0] : path.basename(rel, '.md');
}

async function listPostFiles(dir) {
  const out = [];
  const { readdir } = await import('node:fs/promises');
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name.endsWith('.md')) out.push(full);
    }
  };
  if (existsSync(dir)) await walk(dir);
  return out;
}

const copied = new Map(); // sha256 -> dest relative path (reuse)

async function copyIntoRepo(srcAbs, kind, slugDir, name) {
  const data = await readFile(srcAbs);
  const hash = createHash('sha256').update(data).digest('hex');
  const key = `${kind}:${hash}:${name}`;
  if (copied.has(key)) return copied.get(key);

  let destRel;
  if (kind === 'image') {
    destRel = path.join('src', 'assets', 'blogs', slugDir, name);
  } else {
    destRel = path.join('public', 'media', 'blogs', slugDir, name);
  }
  const destAbs = path.join(ROOT, destRel);
  await mkdir(path.dirname(destAbs), { recursive: true });
  await copyFile(srcAbs, destAbs);
  copied.set(key, destRel);
  return destRel;
}

async function resolveFile(file) {
  const original = await readFile(file, 'utf-8');
  const slugDir = slugDirFor(file);
  const missing = [];
  let text = original;

  const refs = [...text.matchAll(DISK_REF_RE)];
  for (const match of refs) {
    const raw = match.groups.p;
    const srcAbs = expandPath(raw);
    if (!existsSync(srcAbs)) {
      missing.push(`${raw} (referenced in ${path.relative(ROOT, file)})`);
      continue;
    }
    const name = path.basename(srcAbs).replace(/[^\w.\-\u0600-\u06FF]/g, '_');
    const ext = name.split('.').pop().toLowerCase();
    const kind = IMAGE_EXT.has(ext) ? 'image' : 'media';
    const destRel = await copyIntoRepo(srcAbs, kind, slugDir, name);

    let replacement;
    if (kind === 'image') {
      replacement = './' + path
        .relative(path.dirname(file), path.join(ROOT, destRel))
        .replace(/\\/g, '/');
    } else {
      replacement = SITE_BASE + 'media/blogs/' + slugDir + '/' + name;
    }
    text = text.split(match.groups.p).join(replacement);
  }

  if (missing.length > 0) {
    console.error('\nRESOLVER: missing referenced files:');
    missing.forEach((m) => console.error('  - ' + m));
    return { changed: text !== original, text, missing };
  }
  if (text !== original) {
    await writeFile(file, text, 'utf-8');
  }
  return { changed: text !== original, text, missing };
}

const files = await listPostFiles(CONTENT_DIR);
let anyMissing = false;
for (const file of files) {
  const result = await resolveFile(file);
  if (result.missing.length > 0) anyMissing = true;
  if (result.changed && result.missing.length === 0) {
    console.log(`resolved: ${path.relative(ROOT, file)}`);
  }
}

if (anyMissing) {
  console.error('\nBUILD FAILED: absolute references point at files that do not exist on disk.');
  process.exit(1);
}
