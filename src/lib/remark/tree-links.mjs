import { defineMdastPlugin } from 'satteri';
import fs from 'node:fs';
import path from 'node:path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');

let index = null;
function scan() {
  if (index) return index;
  const ids = new Set();
  const treeSlugs = new Set();
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(abs, r);
      else if (e.name.endsWith('.md')) {
        const id = r.replace(/\.md$/, '');
        ids.add(id);
        // a folder index one level below the blogs root marks a tree post
        if (/^(index|readme)$/i.test(e.name) && r.split('/').length === 2) treeSlugs.add(id.split('/')[0]);
      }
    }
  };
  if (fs.existsSync(BLOGS_DIR)) walk(BLOGS_DIR, '');
  index = { ids, treeSlugs };
  return index;
}

// id -> public route path segment (no base, no leading/trailing slash here)
function routeFor(id, { ids, treeSlugs }) {
  const stripped = id.replace(/\.md$/, '');
  const slash = stripped.indexOf('/');
  const top = slash === -1 ? stripped : stripped.slice(0, slash);
  if (slash !== -1 && treeSlugs.has(top)) {
    if (/\/(index|readme)$/i.test(stripped)) {
      const dir = stripped.replace(/\/(index|readme)$/i, '');
      return dir === top ? `${top}/` : `${dir}/`;
    }
    return `${stripped}/`;
  }
  if (/(^|\/)(index|readme)$/i.test(stripped)) {
    const dir = stripped.replace(/\/?(index|readme)$/i, '');
    return dir ? `${dir}/` : null;
  }
  return ids.has(stripped) ? `${stripped}/` : null;
}

export function createTreeLinksPlugin(base) {
  return (fctx) => {
    const raw = fctx?.fileURL;
    let hrefStr = '';
    if (typeof raw === 'string') hrefStr = raw.startsWith('file:') ? raw : new URL('file:///' + raw.replace(/\\/g, '/').replace(/^([A-Za-z]:)/, '$1')).href;
    else if (raw?.href) hrefStr = raw.href;
    const blogsUrl = (new URL('file:///' + BLOGS_DIR.replace(/\\/g, '/')).href).replace(/\/$/, '') + '/';
    const sameCase = process.platform !== 'win32';
    const cmp = sameCase ? hrefStr : hrefStr.toLowerCase();
    const cmpBase = sameCase ? blogsUrl : blogsUrl.toLowerCase();
    if (!cmp.startsWith(cmpBase)) return null;
    const rel = decodeURIComponent(hrefStr.slice(blogsUrl.length)).replace(/\\/g, '/');
    if (!rel.endsWith('.md') || rel.includes('..')) return null;
    const ownId = rel.replace(/\.md$/, '');

    return defineMdastPlugin({
      name: 'amr-tree-links',
      link(node, ctx) {
        const href = node.url ?? '';
        if (!/^\.{1,2}\//.test(href) || href.startsWith('http')) return;
        const [filePart, fragment] = href.split('#');
        const isDir = filePart === '' || filePart.endsWith('/');
        const ownDir = path.posix.dirname(ownId);
        let target = path.posix.normalize(path.posix.join(ownDir, isDir ? filePart || '.' : filePart));
        while (target.startsWith('../')) target = target.slice(3);
        if (!target || target === '.' || target.startsWith('..')) return;
        const { ids, treeSlugs } = scan();
        let route = null;
        if (isDir) {
          if (treeSlugs.has(target) || [...ids].some((i) => i.startsWith(`${target}/`))) {
            const idx = ids.has(`${target}/index`) ? `${target}/index` : ids.has(`${target}/README`) || ids.has(`${target}/readme`) ? `${target}/README` : null;
            if (idx || treeSlugs.has(target)) route = `${target}/`;
          }
        } else {
          let bare = target.replace(/\.md$/, '');
          if (!ids.has(bare) && /\/(index|readme)$/i.test(bare)) {
            const dir = bare.replace(/\/(index|readme)$/i, '');
            bare = ids.has(`${dir}/index`) ? `${dir}/index` : ids.has(`${dir}/README`) ? `${dir}/README` : bare;
          }
          const cand = ids.has(bare) ? bare : null;
          if (!cand) return;
          route = routeFor(cand, { ids, treeSlugs });
        }
        if (!route) return;
        ctx.setProperty(node, 'url', `${base}blogs/${route}${fragment ? `#${fragment}` : ''}`);
      },
    });
  };
}
