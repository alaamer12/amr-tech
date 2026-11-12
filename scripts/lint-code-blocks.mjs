import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'blogs');
const FENCE = /^(\s{0,3})(`{3,}|~{3,})(.*)$/;
const CODE_START = /^\s*(function|async function|const|let|var|class|import|export|interface|type|return|if|else|for|while|switch|try|catch|throw|await|def|public|private|enum)\b/;
const CODE_END = /[{};]\s*$|\)\s*$|=>|=\s*\S/;
const CLOSER = /^\s*[}\])];?\s*$/;

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const dirArg = argv.find((a) => !a.startsWith('--'));
const target = dirArg ? path.resolve(dirArg) : ROOT;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const f = path.join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (f.endsWith('.md')) out.push(f);
  }
  return out;
}

function lintFile(file) {
  const errors = [];
  const warnings = [];
  const lines = readFileSync(file, 'utf-8').split(/\r?\n/);
  const rel = path.relative(process.cwd(), file);
  let open = null; // { char, len, line, lang }
  let codeRun = 0;
  let codeRunStart = 0;

  const flushRun = () => {
    if (codeRun >= 2) {
      errors.push(`${rel}:${codeRunStart}: ${codeRun} code-looking lines outside a fenced block (missing \`\`\` fence?)`);
    }
    codeRun = 0;
  };

  lines.forEach((text, i) => {
    const n = i + 1;
    const m = text.match(FENCE);
    if (open) {
      if (m && m[2][0] === open.char && m[2].length >= open.len && m[3].trim() === '') {
        open = null;
      }
      return;
    }
    if (m) {
      flushRun();
      const lang = m[3].trim();
      if (m[2][0] === '`' && lang.includes('`')) {
        errors.push(`${rel}:${n}: invalid fence info string "${lang}"`);
      }
      if (!lang) warnings.push(`${rel}:${n}: fenced block has no language, so it will not be syntax-colored`);
      open = { char: m[2][0], len: m[2].length, line: n, lang };
      return;
    }
    const isBlank = text.trim() === '';
    const looksCode = !isBlank && ((CODE_START.test(text) && CODE_END.test(text)) || (codeRun > 0 && CLOSER.test(text)));
    if (looksCode && !/^\s{4,}/.test(text)) {
      if (codeRun === 0) codeRunStart = n;
      codeRun++;
    } else if (isBlank && codeRun > 0) {
      // blank lines inside a code-looking run do not end it
    } else {
      flushRun();
    }
  });
  flushRun();

  if (open) errors.push(`${rel}:${open.line}: fenced block is never closed`);
  return { errors, warnings };
}

const files = statSync(target).isDirectory() ? walk(target) : [target];
let errorCount = 0;
let warningCount = 0;
for (const file of files) {
  const { errors, warnings } = lintFile(file);
  for (const e of errors) console.log(`ERROR ${e}`);
  for (const w of warnings) console.log(`WARN  ${w}`);
  errorCount += errors.length;
  warningCount += warnings.length;
}

console.log(`\nChecked ${files.length} files: ${errorCount} error(s), ${warningCount} warning(s)`);
if (errorCount > 0 || (strict && warningCount > 0)) process.exit(1);
