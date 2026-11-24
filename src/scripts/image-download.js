// Client-side script to attach a top-right download button to all blog images and diagrams.
// Pre-rendered diagram assets are fetched from /stash/diagrams/ (or dynamic SVG/canvas fallback).

function createDownloadButton(onDownload, title = 'Download image') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'img-download-btn';
  btn.setAttribute('aria-label', title);
  btn.title = title;
  btn.innerHTML = `
    <svg class="img-download-btn__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span class="img-download-btn__label">Download</span>
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const label = btn.querySelector('.img-download-btn__label');
    const origText = label ? label.textContent : '';
    if (label) label.textContent = 'Saving…';
    btn.classList.add('img-download-btn--active');

    try {
      await onDownload();
      if (label) label.textContent = 'Saved ✓';
    } catch (err) {
      console.error('Download failed:', err);
      if (label) label.textContent = 'Failed';
    } finally {
      setTimeout(() => {
        if (label) label.textContent = origText;
        btn.classList.remove('img-download-btn--active');
      }, 2000);
    }
  });

  return btn;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadFileFromUrl(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  triggerBlobDownload(blob, filename);
}

function setupImageDownload(img) {
  if (img.closest('.img-download-wrapper') || img.dataset.hasDownloadBtn) return;
  img.dataset.hasDownloadBtn = 'true';

  const wrapper = document.createElement('div');
  wrapper.className = 'img-download-wrapper';

  const parent = img.parentNode;
  parent.insertBefore(wrapper, img);
  wrapper.appendChild(img);

  const getFilename = () => {
    const src = img.currentSrc || img.src || 'image.png';
    const cleanSrc = src.split('?')[0].split('#')[0];
    const name = cleanSrc.substring(cleanSrc.lastIndexOf('/') + 1) || 'image.png';
    return name.includes('.') ? name : `${name}.png`;
  };

  const btn = createDownloadButton(async () => {
    const src = img.currentSrc || img.src;
    const filename = getFilename();
    await downloadFileFromUrl(src, filename);
  }, 'Download image');

  wrapper.appendChild(btn);
}

function setupDiagramDownload(diagramContainer) {
  if (diagramContainer.querySelector('.img-download-btn') || diagramContainer.dataset.hasDownloadBtn) return;
  diagramContainer.dataset.hasDownloadBtn = 'true';
  diagramContainer.classList.add('img-download-wrapper');

  const diagramId = diagramContainer.getAttribute('data-diagram-id');
  const base = document.documentElement.getAttribute('data-site-base') || '/amr-tech/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  const btn = createDownloadButton(async () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const themeSuffix = isDark ? '-dark' : '-light';

    if (diagramId) {
      // 1. Try to download pre-rendered themed SVG from stash
      const stashedThemeUrl = `${cleanBase}stash/diagrams/${diagramId}${themeSuffix}.svg`;
      try {
        const res = await fetch(stashedThemeUrl);
        if (res.ok) {
          const blob = await res.blob();
          triggerBlobDownload(blob, `${diagramId}${themeSuffix}.svg`);
          return;
        }
      } catch (e) {
        // Fallback to inline SVG serialization
      }

      // Try raw stashed SVG
      const stashedRawUrl = `${cleanBase}stash/diagrams/${diagramId}.svg`;
      try {
        const res = await fetch(stashedRawUrl);
        if (res.ok) {
          const blob = await res.blob();
          triggerBlobDownload(blob, `${diagramId}.svg`);
          return;
        }
      } catch (e) {
        // Fallback
      }
    }

    // 2. Direct client-side serialization fallback (with explicit solid background rect)
    const svgEl = diagramContainer.querySelector('svg');
    if (!svgEl) throw new Error('No SVG element found in diagram');

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgEl);

    if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Ensure exported SVG has a solid background and exactly one merged style attribute
    const bgColor = isDark ? '#141414' : '#fffefb';
    const viewBox = svgEl.getAttribute('viewBox') || '0 0 1000 800';
    const [, , vbW, vbH] = viewBox.split(/\s+/).map(Number);
    const bgRect = `<rect width="${vbW || '100%'}" height="${vbH || '100%'}" fill="${bgColor}" rx="8" />`;

    // Safely update or add the style attribute without duplicating it
    let existingStyle = '';
    const styleMatch = svgString.match(/<svg\b[^>]*?\sstyle="([^"]*)"/);
    if (styleMatch) {
      existingStyle = styleMatch[1].replace(/;?$/, ';');
    }
    const mergedStyle = `${existingStyle}background-color:${bgColor};`;

    svgString = svgString.replace(/(<svg\b[^>]*?)\sstyle="[^"]*"/g, '$1');
    svgString = svgString.replace(/(<svg\b)/, `$1 style="${mergedStyle}"`);
    svgString = svgString.replace(/(<svg\b[^>]*>)/, `$1\n  ${bgRect}`);

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    triggerBlobDownload(blob, `${diagramId || 'diagram'}${themeSuffix}.svg`);
  }, 'Download diagram (SVG)');

  diagramContainer.appendChild(btn);
}

function init() {
  const postBody = document.querySelector('.post-body');
  if (!postBody) return;

  // 1. All images in blog post body (and cover image if present)
  const images = postBody.querySelectorAll('img');
  images.forEach(setupImageDownload);

  const coverImg = document.querySelector('.post-cover__image');
  if (coverImg) setupImageDownload(coverImg);

  // 2. All Pele / Mermaid diagrams in blog post body
  const diagrams = postBody.querySelectorAll('.pele');
  diagrams.forEach(setupDiagramDownload);
}

// Bind to both initial DOM load and Astro client-side page navigation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
document.addEventListener('astro:page-load', init);

