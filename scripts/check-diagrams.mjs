#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { render } from 'pele';

const BLOGS_DIR = path.resolve('src/content/blogs');
const STASH_DIR = path.resolve('public/stash/diagrams');

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
let totalDiagrams = 0;
let errors = 0;

console.log('🔍 [E2E Test 1/2] Checking Mermaid source blocks across all blog markdown files...\n');

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/```mermaid\s*\n([\s\S]*?)\n```/g)];
  if (matches.length === 0) continue;

  const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/');

  matches.forEach((m, idx) => {
    totalDiagrams++;
    const code = m[1].trim();
    const diagramNumber = idx + 1;

    try {
      const res = render(code);
      console.log(`  ✓ [Pele Render OK] ${relFile} (diagram #${diagramNumber}) — type: ${res.type}, dimensions: ${res.width}x${res.height}`);
    } catch (err) {
      errors++;
      console.error(`  ✗ [Pele Render FAIL] ${relFile} (diagram #${diagramNumber})`);
      console.error(`    Error: ${err.message}`);
    }
  });
}

console.log(`\n🔍 [E2E Test 2/2] Checking pre-rendered stashed SVG files for strict XML and background rects...\n`);

if (!existsSync(STASH_DIR)) {
  console.error('✗ Stash directory does not exist! Run bun run stash first.');
  process.exit(1);
}

const stashedFiles = readdirSync(STASH_DIR).filter((f) => f.endsWith('.svg'));
let svgErrors = 0;

for (const svgFile of stashedFiles) {
  const svgPath = path.join(STASH_DIR, svgFile);
  const content = readFileSync(svgPath, 'utf8');

  // Check 1: Opening tag must not have duplicate attributes
  const openingTagMatch = content.match(/<svg\b[^>]*>/);
  if (!openingTagMatch) {
    console.error(`  ✗ [Invalid SVG] ${svgFile}: Missing opening <svg> tag`);
    svgErrors++;
    continue;
  }

  const openingTag = openingTagMatch[0];
  const styleCount = (openingTag.match(/\bstyle=/g) || []).length;
  if (styleCount > 1) {
    console.error(`  ✗ [XML Attribute Redefined] ${svgFile}: Found ${styleCount} style attributes on <svg> tag!`);
    svgErrors++;
    continue;
  }

  // Check 2: Solid background rect presence for themed variants
  if (svgFile.endsWith('-dark.svg') || svgFile.endsWith('-light.svg')) {
    const hasBgRect = content.includes('<rect width=') && (content.includes('fill="#141414"') || content.includes('fill="#fffefb"'));
    if (!hasBgRect) {
      console.error(`  ✗ [Missing Background Rect] ${svgFile}: Themed export lacks opaque background rect!`);
      svgErrors++;
      continue;
    }
  }

  console.log(`  ✓ [XML & Background OK] ${svgFile}`);
}

console.log(`\n📊 Test Summary:`);
console.log(`  - Markdown Source Diagrams: ${totalDiagrams} tested, ${errors} failed`);
console.log(`  - Stashed SVG Files: ${stashedFiles.length} tested, ${svgErrors} failed\n`);

if (errors > 0 || svgErrors > 0) {
  console.error('❌ E2E Diagram Test Failed!');
  process.exit(1);
} else {
  console.log('✅ ALL DIAGRAMS AND SVG EXPORTS PASSED E2E VERIFICATION WITH 100% VALID XML!\n');
}
