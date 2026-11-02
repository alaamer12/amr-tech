function bind() {
  const btn = document.querySelector('[data-copy-page]');
  if (!btn) return;
  const label = btn.querySelector('[data-copy-label]');
  btn.addEventListener('click', async () => {
    const url = btn.getAttribute('data-md-url');
    label.textContent = 'Copying…';
    try {
      const md = await fetch(url).then((r) => {
        if (!r.ok) throw new Error('mirror missing');
        return r.text();
      });
      await navigator.clipboard.writeText(md);
      label.textContent = 'Copied ✓';
    } catch {
      label.textContent = 'Copy failed';
    }
    setTimeout(() => {
      label.textContent = 'Copy Page';
    }, 2000);
  });
}
document.addEventListener('astro:page-load', bind);
