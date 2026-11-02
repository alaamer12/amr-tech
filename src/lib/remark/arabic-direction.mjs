import { defineMdastPlugin } from 'satteri';

const ARABIC = /[\u0600-\u06FF]/;

const startsArabic = (text) => {
  const t = (text ?? '').replace(/^\s+/, '');
  return ARABIC.test(t.charAt(0));
};

// Marks block nodes whose content starts with Arabic as dir="rtl" so
// alignment, punctuation placement, and list markers follow the script —
// including Arabic blocks inside otherwise-English posts. No classes needed
// in the author's markdown.
export const arabicBlockDirection = defineMdastPlugin({
  name: 'amr-arabic-direction',
  paragraph(node, ctx) {
    mark(node, ctx);
  },
  blockquote(node, ctx) {
    mark(node, ctx);
  },
  heading(node, ctx) {
    mark(node, ctx);
  },
  list(node, ctx) {
    mark(node, ctx);
  },
  table(node, ctx) {
    mark(node, ctx);
  },
});

function mark(node, ctx) {
  if (!startsArabic(ctx.textContent(node))) return;
  const data = node.data ?? {};
  const props = data.hProperties ?? {};
  ctx.setProperty(node, 'data', { ...data, hProperties: { ...props, dir: 'rtl' } });
}
