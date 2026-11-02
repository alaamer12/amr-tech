const doc = document.documentElement;
let ticking = false;
function update() {
  ticking = false;
  const bar = document.querySelector('.reading-progress');
  if (!bar) return;
  const max = doc.scrollHeight - doc.clientHeight;
  bar.style.setProperty('--progress', max > 0 ? (doc.scrollTop / max).toFixed(4) : '0');
}
function schedule() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });
document.addEventListener('astro:page-load', update);
