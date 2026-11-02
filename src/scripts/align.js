function bind() {
  const buttons = [...document.querySelectorAll('[data-align]')];
  function setActive(align) {
    document.documentElement.dataset.align = align;
    for (const b of buttons) {
      b.classList.toggle('align-toggle__btn--active', b.dataset.align === align);
      b.setAttribute('aria-pressed', String(b.dataset.align === align));
    }
    try {
      localStorage.setItem('align', align);
    } catch {}
  }
  for (const b of buttons) {
    b.addEventListener('click', () => setActive(b.dataset.align ?? 'left'));
    b.classList.toggle('align-toggle__btn--active', b.dataset.align === document.documentElement.dataset.align);
  }
}
document.addEventListener('astro:page-load', bind);
