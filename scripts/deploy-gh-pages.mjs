// Publish dist/ to the gh-pages branch (Pages source: branch gh-pages / root).
// Run after `bun run build`: bun run deploy:gh-pages
// Commits on top of origin/gh-pages and pushes fast-forward only (no force push),
// so the gh-pages history is never rewritten or split from main's tooling history.
import { execFileSync } from 'node:child_process';
import { cpSync, readdirSync, rmSync, mkdtempSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
const tmp = mkdtempSync(path.join(process.env.TEMP || '/tmp', 'gh-pages-'));

try {
  const run = (...args) => execFileSync('git', args, { cwd: tmp, stdio: 'inherit' });
  const runQuiet = (...args) => execFileSync('git', args, { cwd: tmp, encoding: 'utf8' }).trim();

  run('init', '-q');
  run('remote', 'add', 'origin', remote);
  run('fetch', '-q', '--depth=1', 'origin', 'gh-pages');
  run('checkout', '-q', '-B', 'gh-pages', 'FETCH_HEAD');

  for (const entry of readdirSync(tmp)) {
    if (entry !== '.git') rmSync(path.join(tmp, entry), { recursive: true, force: true });
  }
  cpSync(path.join(cwd, 'dist'), tmp, { recursive: true });

  run('add', '-A');
  if (runQuiet('status', '--porcelain') === '') {
    console.log('gh-pages already up to date with dist/');
  } else {
    run('commit', '-q', '-m', `site build ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
    run('push', 'origin', 'gh-pages');
    console.log('deployed dist/ -> gh-pages branch');
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
