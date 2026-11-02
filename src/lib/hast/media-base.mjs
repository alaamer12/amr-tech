import { defineHastPlugin } from 'satteri';

// Rewrites /media/... references in markdown-parsed elements to carry the
// site base. Raw HTML in markdown bypasses hast parsing — the resolver and
// HOW-TO convention write base-prefixed paths directly for those.
export const createMediaBasePlugin = (base) =>
  defineHastPlugin({
    name: 'amr-media-base',
    element: {
      filter: ['img', 'video', 'audio', 'source', 'a'],
      visit(node, ctx) {
        for (const key of ['src', 'href', 'poster']) {
          const value = node.properties?.[key];
          if (typeof value === 'string' && value.startsWith('/media/')) {
            ctx.setProperty(node, key, base + value.slice(1));
          }
        }
      },
    },
  });

// GFM task list items render a bare disabled <input type=checkbox>; wrap the
// li content in a <label> so the checkbox gets an accessible name.
export const taskListLabels = defineHastPlugin({
  name: 'amr-tasklist-labels',
  element: {
    filter: ['li'],
    visit(node, ctx) {
      const first = node.children?.[0];
      if (
        !first ||
        first.tagName !== 'input' ||
        first.properties?.type !== 'checkbox' ||
        !first.properties?.disabled
      ) {
        return;
      }
      const label = {
        type: 'element',
        tagName: 'label',
        properties: { style: 'display: contents;' },
        children: [...node.children],
      };
      ctx.setProperty(node, 'children', [label]);
    },
  },
});
