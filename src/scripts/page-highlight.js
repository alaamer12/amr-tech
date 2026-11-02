function tryHighlight() {
  if (!new URLSearchParams(location.search).get('highlight')) return;
  const base = document.documentElement.dataset.base ?? '/';
  import(`${base}pagefind/pagefind-highlight.js`).then(({ PagefindHighlight }) => {
    new PagefindHighlight({ highlightParam: 'highlight' });
  });
}
document.addEventListener('astro:page-load', tryHighlight);
