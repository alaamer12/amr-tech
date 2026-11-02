import { createHash } from 'node:crypto';

function normalizeBody(body) {
  return (body ?? '')
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function assertNoDuplicates(entries) {
  const byHash = new Map();
  for (const entry of entries) {
    const hash = createHash('sha256').update(normalizeBody(entry.body)).digest('hex');
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(entry.filePath ?? entry.id);
  }
  const dupes = [...byHash.values()].filter((files) => files.length > 1);
  if (dupes.length > 0) {
    const report = dupes.map((files) => `  - ${files.join('  ==  ')}`).join('\n');
    throw new Error(
      `\nDUPLICATED CONTENT — delete or differentiate these files:\n${report}\n`,
    );
  }
}
