function parseRanges(spec) {
  const nums = new Set();
  if (!spec) return nums;
  for (const part of spec.split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    for (let i = from; i <= to; i++) nums.add(i);
  }
  return nums;
}

function metaValue(raw, key) {
  const m = raw?.match(new RegExp(`${key}="([^"]*)"`)) ?? raw?.match(new RegExp(`${key}=([\\d,\\-]+)`));
  return m ? m[1] : null;
}

export function transformerMetaTitle() {
  return {
    name: 'amr-meta-title',
    pre(pre) {
      const raw = this.options?.meta?.__raw ?? '';
      const title = metaValue(raw, 'title');
      if (!title) return;
      pre.properties ??= {};
      pre.properties['data-title'] = title;
      const classes = pre.properties.class ?? [];
      pre.properties.class = Array.isArray(classes) ? [...classes, 'has-title'] : [classes, 'has-title'];
    },
  };
}

export function transformerMetaDiff() {
  const symbol = Symbol('amr-diff-ranges');
  return {
    name: 'amr-meta-diff',
    line(node, lineNumber) {
      const raw = this.options?.meta?.__raw;
      if (!raw) return;
      this.meta[symbol] ??= {
        ins: parseRanges(metaValue(raw, 'ins')),
        del: parseRanges(metaValue(raw, 'del')),
      };
      const { ins, del } = this.meta[symbol];
      if (ins.size === 0 && del.size === 0) return;
      if (ins.has(lineNumber)) this.addClassToHast(node, 'diff-add');
      else if (del.has(lineNumber)) this.addClassToHast(node, 'diff-remove');
      return node;
    },
  };
}
