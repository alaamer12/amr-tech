function bindIndexFilter() {
  // Combined index filtering: category chips + Pagefind search both narrow the
  // visible cards in place. No dropdown, no navigation.
  const cards = [...document.querySelectorAll('.card[data-category]')];
  const input = document.querySelector('[data-search-input]');
  const clearBtn = document.querySelector('[data-search-clear]');
  const chips = [...document.querySelectorAll('[data-chip]')];
  const base = document.documentElement.dataset.base ?? '/';
  
  let category = '';
  let matchingUrls = null;
  let pagefind = null;
  
  function apply() {
    const norm = (u) => {
      if (!u) return u;
      try {
        let p = new URL(u, location.origin).pathname;
        if (p.startsWith(base)) p = p.slice(base.length - 1);
        return p.replace(/^(\/blogs\/.+?)\/v\d+\/$/, '$1/');
      } catch {
        return u;
      }
    };
    let visibleCount = 0;
    for (const card of cards) {
      const catOk = !category || card.dataset.category === category;
      const href = card.querySelector('.card__title')?.getAttribute('href');
      const queryOk = !matchingUrls || (href && matchingUrls.has(norm(href)));
      card.style.display = catOk && queryOk ? '' : 'none';
      if (catOk && queryOk) visibleCount++;
    }
    if (status) {
      status.textContent = matchingUrls
        ? `${visibleCount} post${visibleCount === 1 ? '' : 's'} match`
        : '';
    }
  }
  
  const status = document.querySelector('[data-filter-status]');
  
  async function loadIndex() {
    if (pagefind) return pagefind;
    pagefind = await import(`${base}pagefind/pagefind.js`);
    await pagefind.options({
      baseUrl: base,
      excerptLength: 10,
      ranking: { pageLength: 0.6, termFrequency: 0.9 },
    });
    return pagefind;
  }
  
  let debounceId;
  async function runSearch(term) {
    if (!term.trim()) {
      matchingUrls = null;
      apply();
      return;
    }
    const pf = await loadIndex();
    let search;
    try {
      search = await pf.search(term);
    } catch (err) {
      console.warn('pagefind search failed:', err);
      return;
    }
    const results = search ? search.results.slice(0, 100) : [];
    const datas = await Promise.all(results.map((r) => r.data()));
    const norm = (u) => {
      try {
        let p = new URL(u, location.origin).pathname;
        if (p.startsWith(base)) p = p.slice(base.length - 1);
        return p.replace(/^(\/blogs\/.+?)\/v\d+\/$/, '$1/');
      } catch {
        return u;
      }
    };
    matchingUrls = new Set(datas.map((d) => norm(d.url)));
    apply();
  }
  
  function syncClearButton() {
    if (clearBtn) clearBtn.hidden = !input.value;
  }
  
  input?.addEventListener('input', () => {
    syncClearButton();
    clearTimeout(debounceId);
    const term = input.value;
    debounceId = setTimeout(() => runSearch(term), 150);
  });
  
  clearBtn?.addEventListener('click', () => {
    input.value = '';
    syncClearButton();
    runSearch('');
    input.focus();
  });
  
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      syncClearButton();
      runSearch('');
      input.blur();
    }
  });
  
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      for (const c of chips) {
        c.classList.remove('chip--active');
        c.removeAttribute('aria-current');
      }
      chip.classList.add('chip--active');
      chip.setAttribute('aria-current', 'true');
      category = chip.dataset.chip ?? '';
      apply();
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input?.focus();
      input?.select();
    }
  });
}
if (!window.__bindIndexFilter_bound) {
  window.__bindIndexFilter_bound = true;
  document.addEventListener('astro:page-load', bindIndexFilter);
}
