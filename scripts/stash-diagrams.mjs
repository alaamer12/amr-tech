import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { render } from 'pele';

const BLOGS_DIR = path.resolve('src/content/blogs');
const STASH_DIR = path.resolve('public/stash/diagrams');

if (!existsSync(STASH_DIR)) {
  mkdirSync(STASH_DIR, { recursive: true });
}

// Concrete hex palette values matching site's dark and light designs
const THEMES = {
  light: {
    bg: '#fffefb',
    border: '#e4dfd5',
    '--pele-bg': '#fffefb',
    '--pele-fg': '#1f1e1d',
    '--pele-muted': '#5e5d59',
    '--pele-line': '#5e5d59',
    '--pele-surface': '#f0ece3',
    '--pele-surface-alt': '#f0ece3',
    '--pele-border': '#e4dfd5',
    '--pele-accent': '#b5502f',
    '--pele-font': "'Space Grotesk Variable', -apple-system, sans-serif",
    '--pele-series-1': '#2f6f4f',
    '--pele-series-2': '#3b6ea5',
    '--pele-series-3': '#b45309',
    '--pele-series-4': '#7e57c2',
  },
  dark: {
    bg: '#141414',
    border: '#2a2a2a',
    '--pele-bg': '#141414',
    '--pele-fg': '#ededed',
    '--pele-muted': '#a1a1a1',
    '--pele-line': '#a1a1a1',
    '--pele-surface': '#1c1c1c',
    '--pele-surface-alt': '#1c1c1c',
    '--pele-border': '#2a2a2a',
    '--pele-accent': '#d97757',
    '--pele-font': "'Space Grotesk Variable', -apple-system, sans-serif",
    '--pele-series-1': '#6fae8f',
    '--pele-series-2': '#7aa7d9',
    '--pele-series-3': '#e0a458',
    '--pele-series-4': '#a78bda',
  },
};

/**
 * Parses the root <svg> tag attributes cleanly, merges styles into a single style attribute,
 * and inserts a solid background rect behind all diagram elements.
 */
function embedSolidBackground(svg, themeKey) {
  const theme = THEMES[themeKey];
  const newStyleProps = Object.entries(theme)
    .filter(([k]) => k.startsWith('--'))
    .map(([k, v]) => `${k}:${v}`)
    .concat([`background-color:${theme.bg}`, `font-family:${theme['--pele-font']}`])
    .join(';');

  // Isolate the opening <svg ...> tag
  const endOfOpeningTag = svg.indexOf('>');
  if (endOfOpeningTag === -1) return svg;

  const rawOpeningTag = svg.slice(0, endOfOpeningTag + 1);
  const restOfSvg = svg.slice(endOfOpeningTag + 1);

  // Extract style value if present
  let existingStyle = '';
  const styleMatch = rawOpeningTag.match(/\sstyle="([^"]*)"/);
  if (styleMatch) {
    existingStyle = styleMatch[1].replace(/;?$/, ';');
  }

  const mergedStyle = `${existingStyle}${newStyleProps}`;

  // Strip all style attributes from the opening tag only
  const cleanedOpeningTag = rawOpeningTag.replace(/\sstyle="[^"]*"/g, '');

  // Add back the single merged style attribute
  const newOpeningTag = cleanedOpeningTag.replace(/<svg\b/, `<svg style="${mergedStyle}"`);

  // Extract dimensions or viewBox to size the background rect accurately
  const widthMatch = newOpeningTag.match(/\bwidth="([\d.]+)"/);
  const heightMatch = newOpeningTag.match(/\bheight="([\d.]+)"/);
  const viewBoxMatch = newOpeningTag.match(/\bviewBox="[^"]*?\s+[^"]*?\s+([\d.]+)\s+([\d.]+)"/);

  const w = widthMatch ? widthMatch[1] : (viewBoxMatch ? viewBoxMatch[1] : '100%');
  const h = heightMatch ? heightMatch[1] : (viewBoxMatch ? viewBoxMatch[2] : '100%');

  // Background rect at the very top of SVG body (behind all diagram nodes)
  const bgRect = `  <rect width="${w}" height="${h}" fill="${theme.bg}" rx="8" />`;

  return `${newOpeningTag}\n${bgRect}${restOfSvg}`;
}

function walk(dir) {
  const files = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) files.push(...walk(full));
    else if (f.name.endsWith('.md')) files.push(full);
  }
  return files;
}

const mdFiles = walk(BLOGS_DIR);
let count = 0;
const manifest = {};

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/```mermaid\s*\n([\s\S]*?)\n```/g)];
  if (matches.length === 0) continue;

  matches.forEach((m, idx) => {
    const code = m[1].trim();
    const hash = createHash('sha256').update(code).digest('hex').slice(0, 16);
    const id = `diagram-${hash}`;

    try {
      const rendered = render(code, { idPrefix: `pele-stash-${hash}-` });

      // 1. Raw stashed SVG (theme-adaptive)
      const rawPath = path.join(STASH_DIR, `${id}.svg`);
      writeFileSync(rawPath, rendered.svg, 'utf8');

      // 2. Standalone Dark SVG with solid background
      const darkPath = path.join(STASH_DIR, `${id}-dark.svg`);
      writeFileSync(darkPath, embedSolidBackground(rendered.svg, 'dark'), 'utf8');

      // 3. Standalone Light SVG with solid background
      const lightPath = path.join(STASH_DIR, `${id}-light.svg`);
      writeFileSync(lightPath, embedSolidBackground(rendered.svg, 'light'), 'utf8');

      manifest[id] = {
        hash,
        type: rendered.type,
        width: rendered.width,
        height: rendered.height,
        srcFile: path.relative(process.cwd(), file).replace(/\\/g, '/'),
        diagramIndex: idx + 1,
      };

      count++;
    } catch (err) {
      console.error(`Failed to pre-render diagram in ${file}:`, err.message);
    }
  });
}

writeFileSync(path.join(STASH_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`[stash-diagrams] Stashed ${count} diagrams with valid XML solid backgrounds in ${path.relative(process.cwd(), STASH_DIR)}`);
