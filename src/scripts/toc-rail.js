function bindTocRail() {
  // Claude-style ToC rail: persistent edge tab, slide open/close, scroll-spy.
  const rail = document.querySelector('.toc-rail');
  if (rail) {
    const toggle = rail.querySelector('[data-toc-toggle]');
    const links = [...rail.querySelectorAll('.toc__link')];
  
    toggle?.addEventListener('click', () => {
      const open = rail.toggleAttribute('data-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  
    // Scroll-spy: active section = last heading whose top passed the reading line.
    const targets = links
      .map((a) => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))))
      .filter(Boolean);
  
    if (targets.length > 0) {
      let ticking = false;
      const spy = () => {
        ticking = false;
        const line = window.innerHeight * 0.35;
        let current = null;
        for (const t of targets) {
          if (t.getBoundingClientRect().top <= line) current = t;
          else break;
        }
        for (const a of links) {
          a.classList.toggle('is-active', !!current && a.getAttribute('href') === `#${current.id}`);
        }
      };
      addEventListener('scroll', () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(spy);
        }
      }, { passive: true });
      spy();
    }
  
    // Close on Escape for keyboard users.
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && rail.hasAttribute('data-open')) {
        rail.removeAttribute('data-open');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.focus();
      }
    });
  }
}
if (!window.__bindTocRail_bound) {
  window.__bindTocRail_bound = true;
  document.addEventListener('astro:page-load', bindTocRail);
}
