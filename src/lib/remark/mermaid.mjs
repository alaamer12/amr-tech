import { defineMdastPlugin } from 'satteri';
import { render } from 'pele';
import { createHash } from 'node:crypto';

let counter = 0;

export const amrMermaid = defineMdastPlugin({
  name: 'amr-mermaid',
  code(node, ctx) {
    if (node.lang !== 'mermaid') return;
    const source = (node.value ?? '').trim();
    const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
    const diagramId = `diagram-${hash}`;
    const file = ctx.fileURL ? decodeURIComponent(ctx.fileURL.pathname).replace(/^\/[A-Za-z]:/, '') : 'unknown file';
    let result;
    try {
      result = render(source, { idPrefix: `pele-${++counter}-` });
    } catch (e) {
      const where = e.line ? ` (line ${e.line}, column ${e.column})` : '';
      throw new Error(
        `MERMAID RENDER FAILED — ${file}${where}\n${e.snippet ? e.snippet + '\n' : ''}${e.message}`,
      );
    }
    ctx.replaceNode(node, {
      raw: `<div class="pele" role="img" aria-label="Mermaid diagram" data-diagram-id="${diagramId}" data-diagram-hash="${hash}">${result.svg}</div>`,
      mdxExpressions: false,
    });
  },
});
