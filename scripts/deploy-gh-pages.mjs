// Publish dist/ to the gh-pages branch (Pages source: branch gh-pages / root).
// Run after `bun run build`: bun run deploy:gh-pages
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, mkdtempSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
const tmp = mkdtempSync(path.join(process.env.TEMP || '/tmp', 'gh-pages-'));

try {
  cpSync(path.join(cwd, 'dist'), tmp, { recursive: true });
  const run = (...args) => execFileSync('git', args, { cwd: tmp, stdio: 'inherit' });
  run('init', '-q');
  run('remote', 'add', 'origin', remote);
  run('add', '-A');
  run('commit', '-q', '-m', `site build ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  run('branch', '-M', 'gh-pages');
  run('push', '-f', 'origin', 'gh-pages');
  console.log('deployed dist/ -> gh-pages branch');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
