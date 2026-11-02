// GitHub Pages-faithful static server: serves dist/ under the /amr-tech/
// prefix exactly as GH Pages will. bun run scripts/serve-gh.mjs
import { serve } from 'bun';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const BASE = '/amr-tech';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.pf_meta': 'application/octet-stream',
};

const server = serve({
  port: 4444,
  async fetch(req) {
    let pathname = decodeURIComponent(new URL(req.url).pathname);
    if (!pathname.startsWith(BASE)) {
      if (pathname === '/') return Response.redirect(BASE + '/blogs/', 301);
      return new Response('Not found', { status: 404 });
    }
    let rel = pathname.slice(BASE.length);
    if (rel === '') rel = '/';
    let file = path.join(DIST, rel);
    if (!file.startsWith(DIST)) return new Response('Forbidden', { status: 403 });
    if (!path.extname(file)) {
      const asDir = path.join(file, 'index.html');
      if (existsSync(asDir)) file = asDir;
      else if (existsSync(file + '.html')) file = file + '.html';
      else if (existsSync(file) && rel.endsWith('/')) file = path.join(file, 'index.html');
    }
    if (!existsSync(file)) return new Response('Not found: ' + rel, { status: 404 });
    const ext = path.extname(file);
    const type = MIME[ext] ?? (ext === '.html' || file.endsWith('index.html') ? MIME['.html'] : 'application/octet-stream');
    // OG test mode: rewrite canonical host so og:image/canonical resolve on tunnels.
    const publicOrigin = process.env.PUBLIC_ORIGIN;
    if (publicOrigin && (type.startsWith('text/html') || type.startsWith('application/xml') || type === 'text/plain; charset=utf-8')) {
      let text = await Bun.file(file).text();
      text = text.replaceAll('https://alaamer12.github.io', publicOrigin.replace(/\/$/, ''));
      return new Response(text, { headers: { 'Content-Type': type } });
    }
    return new Response(Bun.file(file), { headers: { 'Content-Type': type } });
  },
});

console.log(`GH Pages simulator: http://localhost:${server.port}${BASE}/blogs/`);
