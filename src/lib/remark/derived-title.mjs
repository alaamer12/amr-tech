import { defineMdastPlugin } from 'satteri';

const derivedTitle = defineMdastPlugin({
  name: 'amr-derived-title',
  heading(node, ctx) {
    const fm = ctx.data?.astro?.frontmatter;
    if (!fm || fm.title !== undefined || node.depth !== 1) return;
    if (fm.derivedTitle !== undefined) return;
    fm.derivedTitle = ctx.textContent(node).trim();
    ctx.removeNode(node);
  },
});

// Versioned files (vN.md inside a post directory) take their title from the
// directory name, so their first H1 must stay in the body.
export const amrDerivedTitle = (ctx) => {
  const path = ctx?.fileURL?.pathname ?? '';
  return /\/v\d+\.md$/i.test(path) ? null : derivedTitle;
};
