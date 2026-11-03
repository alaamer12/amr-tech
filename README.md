# Amr — personal blog

A fully static, SEO-first personal blog built on [Astro 7](https://astro.build) + Content Collections, deployed to GitHub Pages. No backend, no analytics, no third-party scripts — just markdown in, fast site out.

**Live:** https://alaamer12.github.io/amr-tech/

## Add a post

Drop a markdown file into `src/content/blogs/` and push. That's the whole workflow — routing, search index, sitemap, RSS, `llms.txt`, raw `.md` mirrors, OG tags, ToC, syntax highlighting, related posts and deployment are automatic.

Full authoring contract: **[HOW-TO-ADD-A-POST.md](HOW-TO-ADD-A-POST.md)** · Decisions & trade-offs: [REQUIREMENTS.md](REQUIREMENTS.md)

```
src/content/blogs/my-post.md            →  /blogs/my-post/
src/content/blogs/pvc/v1.md, v2.md ...  →  /blogs/pvc/ (highest vN = latest)
src/content/blogs/pvc/index.md + tree   →  /blogs/pvc/ + /blogs/pvc/<path>/ per file
```

## Development

```bash
bun install
bun run dev            # http://localhost:4321/amr-tech/
bun run build          # resolver → build → .md mirrors → pagefind index
bun scripts/serve-gh.mjs   # GitHub Pages-faithful preview at :4444/amr-tech/
node scripts/seo-audit.mjs # pass/gap audit against dist/
```

`build:ci` (what Actions runs) skips the asset resolver by design — disk-absolute media references are resolved locally and committed.

## What's inside

- **Versioned posts** — every post is `vN`; real prerendered URLs, `?version=` alias redirect, floating version switcher, clickable version pills on cards
- **Tree-file posts** — a folder with `index.md` publishes as one multi-page post (`/blogs/pvc/base/architecture/` and friends): package-style directory resolution, automatic rewriting of relative `.md` links, per-page ToC/TreeNav/breadcrumbs, one card in the listing
- **Mermaid diagrams** — ```` ```mermaid ```` fences render to inline SVG at build time via Pele; zero client JS, theme-adaptive through CSS variables, broken syntax fails the build
- **Search** — Pagefind (typo-tolerant, stemming, Arabic-aware) filtering the card grid in place, Ctrl+K
- **SEO** — canonicals, BlogPosting + BreadcrumbList JSON-LD, sitemap, RSS, robots; Lighthouse 100/100/100/100 on index and post pages
- **Agent-readable** — every page works without JS; `.md` mirrors and `llms.txt` for scrapers
- **Design system** — SCSS 7-1 with role tokens, dark/light animated morph toggle, three-point content justification, slide-out ToC rail with scroll-spy, reading progress, brand scrollbars
- **Typography** — Space Grotesk / Instrument Serif / Literata / JetBrains Mono + Cairo / Reem Kufi / Noto Naskh Arabic, all self-hosted with `unicode-range` splitting
- **Guards** — duplicated post content fails the build; unknown frontmatter keys fail the build; missing disk media fails the build

## Deploy

GitHub Pages serves the `gh-pages` branch (plain static output, `.nojekyll`). Publish with `bun run deploy:gh-pages` after a build — no Actions workflow by design. Source of truth for site config: `astro.config.mjs` (`site: https://alaamer12.github.io`, `base: /amr-tech`).
