// Theme toggle with magicui AnimatedThemeToggler mechanics:
// startViewTransition + percent clip-path circle expanding from the button.
// Percent coordinates (not px) because Chrome misplaces px clip-path on
// ::view-transition-new(root) at fractional display scales (Windows 150%).

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let transitioning = false;

function geometryFrom(originEl) {
  const vw = innerWidth;
  const vh = innerHeight;
  let cx = vw / 2;
  let cy = vh / 2;
  if (originEl) {
    const r = originEl.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }
  const maxRadius = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy));
  return { cx, cy, maxRadius, vw, vh };
}

function clipFrom(g) {
  const px = `${(g.cx / g.vw) * 100}%`;
  const py = `${(g.cy / g.vh) * 100}%`;
  const radiusPct = (g.maxRadius / (Math.hypot(g.vw, g.vh) / Math.SQRT2)) * 100;
  return [`circle(0% at ${px} ${py})`, `circle(${radiusPct}% at ${px} ${py})`];
}

function spawnRing(g) {
  const d = document.createElement('div');
  d.className = 'morph-ring';
  d.style.left = `${g.cx - g.maxRadius}px`;
  d.style.top = `${g.cy - g.maxRadius}px`;
  d.style.width = d.style.height = `${g.maxRadius * 2}px`;
  d.style.viewTransitionName = 'ring';
  document.body.appendChild(d);
  return d;
}

function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch {}
}

function runMorph(originEl, apply, duration) {
  if (transitioning) return;
  if (typeof document.startViewTransition !== 'function' || reduceMotion()) {
    apply();
    return;
  }
  const g = geometryFrom(originEl);
  const clip = clipFrom(g);
  const root = document.documentElement;
  let ring = null;
  transitioning = true;
  root.dataset.morphing = '';
  root.style.setProperty('--morph-dur', `${duration}ms`);
  root.style.setProperty('--morph-clip-from', clip[0]);
  const t = document.startViewTransition(() => {
    apply();
    ring = spawnRing(g);
  });
  t.finished.finally(() => {
    transitioning = false;
    ring?.remove();
    delete root.dataset.morphing;
    root.style.removeProperty('--morph-dur');
    root.style.removeProperty('--morph-clip-from');
  });
  t.ready.then(() => {
    root.animate(
      { clipPath: clip },
      { duration, easing: 'ease-in-out', fill: 'forwards', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
}

function bind() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    runMorph(btn, () => applyTheme(dark), 400);
  });
}

document.addEventListener('astro:page-load', bind);
