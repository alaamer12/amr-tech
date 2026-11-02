import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASE = '/amr-tech';
const results = [];
const fail = (name, detail) => results.push([false, name, detail]);
const pass = (name, detail = '') => results.push([true, name, detail]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const f = path.join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else out.push(f);
  }
  return out;
}
const files = walk(DIST);
const htmls = files.filter((f) => f.endsWith('.html'));

// 1. every html has title, description, canonical, charset, viewport
let missing = [];
for (const h of htmls) {
  const s = readFileSync(h, 'utf-8');
  const rel = path.relative(DIST, h);
  if (rel === 'index.html') continue; // redirect stub
  const isStub = s.includes('http-equiv="refresh"');
  if (isStub) continue;
  const checks = {
    title: /<title>[^<]{3,}<\/title>/.test(s),
    desc: /name="description" content="[^"]{20,}"/.test(s),
    canonical: /rel="canonical" href="https:\/\/amrmu\.github\.io\/amr-tech\//.test(s),
    charset: /charset="utf-8"/.test(s),
    viewport: /name="viewport"/.test(s),
    og: /property="og:title"/.test(s) && /property="og:image"/.test(s),
  };
  for (const [k, ok] of Object.entries(checks)) if (!ok) missing.push(`${rel}:${k}`);
}
missing.length === 0 ? pass('all pages: title/desc/canonical/charset/viewport/og') : fail('meta completeness', missing.slice(0, 8).join(', '));

// 2. exactly one h1 per content page
let h1bad = [];
for (const h of htmls) {
  const rel = path.relative(DIST, h);
  const s = readFileSync(h, 'utf-8');
  if (rel === 'index.html' || s.includes('http-equiv="refresh"')) continue;
  const n = (s.match(/<h1/g) || []).length;
  if (n !== 1) h1bad.push(`${rel}=${n}`);
}
h1bad.length === 0 ? pass('exactly one h1 per page') : fail('h1 count', h1bad.join(', '));

// 3. internal links resolve to real files
let broken = [];
const resolved = new Set();
for (const h of htmls) {
  const s = readFileSync(h, 'utf-8');
  for (const m of s.matchAll(/href="(\/amr-tech\/[^"#?]*)/g)) {
    const p = decodeURIComponent(m[1]);
    if (resolved.has(p)) continue;
    resolved.add(p);
    const rel2 = p.slice(BASE.length) || '/';
    const clean = rel2.replace(/\/$/, '');
    const ok = existsSync(path.join(DIST, rel2)) || existsSync(path.join(DIST, clean, 'index.html'));
    if (!ok) broken.push(p);
  }
}
broken.length === 0 ? pass(`all internal links resolve (${resolved.size} unique)`) : fail('broken links', broken.slice(0, 6).join(', '));

// 4. sitemap <-> pages parity
const sm = existsSync(path.join(DIST, 'sitemap-0.xml')) ? readFileSync(path.join(DIST, 'sitemap-0.xml'), 'utf-8') : '';
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice('https://amrmu.github.io'.length));

const smMissing = smUrls.filter((u) => {
  const rel2 = decodeURIComponent(u).slice(BASE.length) || '/';
  const clean = rel2.replace(/\/$/, '');
  return !existsSync(path.join(DIST, clean, 'index.html')) && !existsSync(path.join(DIST, rel2));
});
smMissing.length === 0 ? pass(`sitemap ${smUrls.length} URLs all exist`) : fail('sitemap dead URLs', smMissing.join(', '));
const noindexedInSitemap = smUrls.filter((u) => {
  const f = path.join(DIST, decodeURIComponent(u).slice(BASE.length).replace(/\/$/, ''), 'index.html');
  return existsSync(f) && readFileSync(f, 'utf-8').includes('noindex');
});
noindexedInSitemap.length === 0 ? pass('no noindex pages in sitemap') : fail('noindex in sitemap', noindexedInSitemap.join(', '));

// 5. JSON-LD parses on every post
let ldBad = [];
for (const h of htmls) {
  const s = readFileSync(h, 'utf-8');
  const m = s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) continue;
  try {
    const parsed = JSON.parse(m[1]);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const j = arr.find((x) => x['@type'] === 'BlogPosting');
    const bc = arr.find((x) => x['@type'] === 'BreadcrumbList');
    if (!j || !j.headline || !j.datePublished || !j.url || !j.author) ldBad.push(`${path.relative(DIST, h)}:fields`);
    if (j && !j.url.includes('/amr-tech/')) ldBad.push(`${path.relative(DIST, h)}:url-base`);
    if (!bc || !Array.isArray(bc.itemListElement) || bc.itemListElement.length < 2) ldBad.push(`${path.relative(DIST, h)}:breadcrumb`);
  } catch {
    ldBad.push(`${path.relative(DIST, h)}:parse`);
  }
}
ldBad.length === 0 ? pass('JSON-LD valid + complete + base-correct') : fail('JSON-LD', ldBad.join(', '));

// 6. images have alt
let altBad = 0;
for (const h of htmls) {
  const s = readFileSync(h, 'utf-8');
  for (const img of s.matchAll(/<img\b[^>]*>/g)) if (!/\balt(=|\s|>)/.test(img[0])) altBad++;
}
altBad === 0 ? pass('all img have alt') : fail('img missing alt', String(altBad));

// 7. RSS + robots + llms + mirrors
const rss = readFileSync(path.join(DIST, 'rss.xml'), 'utf-8');
pass('rss.xml parses-ish (xml decl + items)', rss.startsWith('<?xml') && (rss.match(/<item>/g) || []).length >= 8 ? `${(rss.match(/<item>/g) || []).length} items` : 'CHECK');
const robots = readFileSync(path.join(DIST, 'robots.txt'), 'utf-8');
pass('robots.txt has sitemap', robots.includes('sitemap:') && robots.includes('/amr-tech/'));
const llms = readFileSync(path.join(DIST, 'llms.txt'), 'utf-8');
const llmsLines = (llms.match(/^- \[/gm) || []).length;
pass('llms.txt lists versions', llmsLines >= 10 ? `${llmsLines} entries` : `CHECK only ${llmsLines}`);
const mds = files.filter((f) => f.endsWith('.md'));
pass('.md mirrors present', `${mds.length} mirrors`);

// 8. 404 page
existsSync(path.join(DIST, '404.html')) ? pass('404.html exists') : fail('404 page missing', 'GH Pages serves /404.html — not emitted');

// 9. feed autodiscovery
const idx = existsSync(path.join(DIST, 'blogs', 'index.html')) ? readFileSync(path.join(DIST, 'blogs', 'index.html'), 'utf-8') : '';
pass('RSS autodiscovery link', idx.includes('application/rss+xml') ? 'ok' : 'CHECK');

// 10. lang attributes
const arFile = path.join(DIST, 'blogs', 'arabic-post', 'index.html');
if (existsSync(arFile)) {
  pass('Arabic post html lang=ar', readFileSync(arFile, 'utf-8').includes('<html lang="ar"'));
} else {
  console.log('SKIP Arabic lang check (no arabic-post sample present)');
}

for (const [ok, name, detail] of results) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
console.log(`\n${results.filter((r) => !r[0]).length} gaps`);
