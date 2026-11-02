function bindRelated() {
  const root = document.querySelector('[data-related]');
  if (root) {
    const tabs = [...root.querySelectorAll('[data-rel-tab]')];
    const rows = [...root.querySelectorAll('.related__row')];
    const more = root.querySelector('[data-rel-more]');
    const VISIBLE = 5;
  
    function apply() {
      const active = tabs.find((t) => t.classList.contains('related__tab--active'));
      const cat = active?.dataset.relTab ?? '';
      const expanded = root.hasAttribute('data-expanded');
      let matched = 0;
      for (const row of rows) {
        const match = !cat || row.dataset.relCat === cat;
        if (!match) {
          row.style.display = 'none';
          continue;
        }
        matched++;
        row.style.display = !expanded && matched > VISIBLE ? 'none' : '';
      }
      if (more) more.style.display = !expanded && matched > VISIBLE ? '' : 'none';
    }
  
    for (const tab of tabs) {
      tab.addEventListener('click', () => {
        for (const t of tabs) {
          t.classList.remove('related__tab--active');
          t.setAttribute('aria-selected', 'false');
        }
        tab.classList.add('related__tab--active');
        tab.setAttribute('aria-selected', 'true');
        root.removeAttribute('data-expanded');
        apply();
      });
    }
  
    more?.addEventListener('click', () => {
      root.setAttribute('data-expanded', '');
      apply();
    });
  
    apply();
  }
}
if (!window.__bindRelated_bound) {
  window.__bindRelated_bound = true;
  document.addEventListener('astro:page-load', bindRelated);
}
