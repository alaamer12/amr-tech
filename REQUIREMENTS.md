# amr-tech Blog — Requirements Specification

> Status: FINAL — every decision below was explicitly settled in the grilling session (2026-11-02).
> This document is the contract for the implementation step. Do not silently deviate; deviations require updating this file first.

---

## 1. Overview

A personal, single-author technical blog. The author (and AI agents acting for the author) only ever **insert content**; the system builds, styles, indexes, optimizes, and deploys everything automatically.

**Design references** (in repo root):
- `reference1.PNG` — Claude-style article page: dark, serif title, blockquote lede, numbered Table of Contents.
- `reference2.PNG` — Linear "Now": big page title, category filter chips, search box, RSS icon, 3-column card grid (image, title, excerpt, author·date).
- `reference3.PNG` — Vercel "Blog": same pattern, card-forward.

**Hard requirements**
1. 100% technical SEO (static prerendered HTML; everything works without JS).
2. High performance (no render-blocking third parties, optimized assets, no client search server).
3. OCP workflow: adding a post = inserting a markdown file (or folder) — no tooling, no scaffold scripts.
4. Theme support (dark + light, token-based).
5. `/blogs/` index with search + category chips.
6. Slug-based URLs, professional SEO page structure.
7. All content scrapeable by agents (semantic HTML, RSS, JSON-LD, `llms.txt`, raw `.md` mirrors).
8. Per-post Table of Contents.
9. Posts may contain references, images, videos, code.
10. Static output → GitHub Pages only. No backend. No sensitive data. No analytics.

---

## 2. Technology decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | **Plain Astro (latest) + Content Collections** | Starlight was evaluated and **rejected**: it is a docs-theme integration whose page shell (PageFrame/Sidebar/TwoColumnContent) mismatches the references; matching them would mean overriding most of its internals. ToC, search, sitemap, RSS are all trivial in plain Astro. |
| Content format | **Plain Markdown (`.md`)** — no MDX | Keeps `.md` mirrors byte-identical for agents; any editor/agent can write posts with zero framework knowledge. Media uses native HTML tags inside markdown. |
| Search | **Pagefind** (build-time index, client-side) | Fully static, no server, typo tolerance + stemming + tuned ranking. |
| Syntax highlighting | **Shiki** (built into Astro) | Build-time, zero client JS, works with dark/light via CSS-variable dual themes. |
| Hosting | GitHub Pages, project site `https://<user>.github.io/amr-tech/` | Base path `/amr-tech/` baked into Astro `site`/`base`, sitemap, canonicals, OG URLs, Pagefind `baseUrl`. |
| Deploy | GitHub Actions `deploy-pages` on push to `main` | Standard path, ~1–2 min, PR preview deploys. |
| Analytics | **None** | Performance + privacy + no-backend rules. GitHub Insights is sufficient. |

---

## 3. Repository & content structure

```
amr-tech/
├── src/
│   ├── content/
│   │   └── blogs/                    # ALL posts live here (the OCP surface)
│   │       ├── my-single-post.md     # unversioned post (implicitly v1)
│   │       └── pvc/                  # versioned post
│   │           ├── v1.md
│   │           ├── v2.md
│   │           └── v3.md
│   ├── assets/                       # resolver-copied + optimized media
│   ├── components/                   # Layout, Card, ChipBar, SearchBox, ToC, VersionBox, ...
│   ├── layouts/                      # BlogIndex.astro, BlogPost.astro
│   ├── pages/
│   │   ├── index.astro               # redirect → /blogs/
│   │   ├── blogs/
│   │   │   ├── index.astro           # /blogs/
│   │   │   └── [...slug].astro       # /blogs/<slug>/ and /blogs/<slug>/vN/
│   │   ├── rss.xml.js                # RSS/Atom feed
│   │   ├── llms.txt                 # agent index
│   │   ├── sitemap-index.xml         # via @astrojs/sitemap
│   │   └── robots.txt
│   └── styles/                       # tokens.css, global.css, type.css
├── public/
├── scripts/
│   └── resolve-assets.mjs            # local pre-build resolver (§7)
├── HOW-TO-ADD-A-POST.md              # authoring guide for humans + agents
├── astro.config.mjs
├── package.json
└── .github/workflows/deploy.yml
```

### 3.1 Post shapes (always versioned in logic)

- **Single file**: `blogs/<slug>.md` → treated as `<slug>` **v1**, the only version.
- **Directory**: `blogs/<slug>/v1.md, v2.md, ...` → versions are **internally separate blog documents, related to each other** by shared directory/slug.
- Version key: filename `vN` (case-insensitive `v` + positive integer). Non-`vN` filenames inside a post directory are ignored by the collection (reserved for future assets sidecars).
- **"Latest" = highest `vN`.** Zero configuration; there is no `latest: true` flag. Dropping `v4.md` makes it latest automatically.

---

## 4. Frontmatter schema (per version file)

```yaml
---
title:        # optional — see resolution rules §4.1
description:  # optional — used for meta description, card excerpt fallback, OG desc
date:         # optional — publish date; fallback: git created date, then build date (deterministic per checkout)
category:     # optional — free-form single string; null = no chip (see §6.2)
tags: []      # optional — 0..n free-form strings, searchable metadata, not shown as chips
draft: false  # optional — true = built only in dev, excluded from prod build, index, sitemap, RSS, llms.txt
thumbnail:    # optional — image path/repo ref; OG image logic §8.3
lang: en      # optional — per-post language tag for the HTML lang attribute + font stack hint
---
```

Unknown keys → build warning (schema is strict-typed via Content Collections).

### 4.1 Title resolution (deterministic, same input ⇒ same title every build)

1. **Frontmatter `title` wins** whenever present.
2. Else, **single-file post**: the **first `# H1`** in the markdown body becomes the title. The H1 is **consumed** — it is rendered once as the page title, not duplicated in the body (one `<h1>` per page).
3. Else, **directory post**: the **directory name**, cleaned:
   - percent-encoded UTF-8 decoded (`%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%D8%B9` → `مشاريع`),
   - dashes/underscores → spaces,
   - **no forced English Title-Case mangling on Arabic or other non-Latin text** (Latin may be Title-Cased).

### 4.2 Category rules

- Free-form: any string the author types. The chip bar on `/blogs/` is **auto-built from categories that exist on published posts** — no config file to edit.
- Omitted/`null` → post renders **no category chip** on its card and page; the filter bar is unaffected; Pagefind's category filter simply never includes it.

---

## 5. Routes & URLs

| URL | Serves | Notes |
|---|---|---|
| `/` | redirect → `/blogs/` | static redirect |
| `/blogs/` | index, **latest version of every post**, newest-first | single page, no pagination (revisit at ~40+ posts) |
| `/blogs/<slug>/` | **latest version** of the post | canonical URL of the post |
| `/blogs/<slug>/v2/` | real prerendered page for v2 (and every vN) | full page, full SEO surface |
| `/blogs/<slug>/v2.md` | **raw markdown mirror** of that version | byte-identical file content, for agents |
| `/blogs/<slug>.md` | raw mirror of latest | convenience alias for agents |
| `/rss/` | RSS/Atom feed | latest versions only |
| `/llms.txt` | agent-facing site index | all posts + versions listed with URLs |

### 5.1 `?version=` alias (settled compromise)

Static hosting prerenders per **path**, not per query. Therefore:
- Version pages are **real paths** (above).
- A ~10-line inline script on post pages reads `?version=`:
  - absent / `latest` / value equal to the current highest `vN` → stay on `/blogs/<slug>/`;
  - `?version=N` → `location.replace()` to `/blogs/<slug>/vN/` (404-safe: unknown N → latest).
- Crawlers never see query strings in sitemaps; humans/agents get the requested `?version=` semantics.

### 5.2 Canonical policy (explicit author choice — recorded)

**Every version is self-canonical and fully indexable**, all versions appear in `sitemap.xml`. The author accepted the near-duplicate-content trade-off against "100% SEO". Cheap future reversal: a single frontmatter/config switch to point old versions' canonical at latest.

---

## 6. Index page (`/blogs/`) — per references

- Large display page title "Blog" (chrome font).
- **Category chip bar**: `All` + auto-built categories; client-side filtering of cards (no reload).
- **Search box** (§6.3) and **RSS icon** in the header area, like references 2–3.
- **Card grid** (responsive 1/2/3 columns): optional thumbnail image, date + category label, title, description/excerpt. Newest-first.
- Versioned posts appear **once** (as their latest); the version box on the post page exposes history.

## 6.1 Post page — per reference 1

- Serif display title (post-title font), optional lede blockquote.
- **Table of Contents**: numbered, generated from `h2/h3` headings, rendered as an inline block near the top (reference 1 style) and sticky on wide viewports. Anchor links; works without JS.
- Body in reading measure (~65–75ch), generous leading.
- **Version box**: floating bottom-right; menu opens **upward**; lists all versions of this post (git-tree-style selection, like docs version pickers); current version marked; links are real paths (§5).
- Footer: previous/next navigation, edit-free (personal site).

### 6.2 Search (Pagefind)

- **Engine**: Pagefind built-ins only — no second engine. Covers: title (default 5× weight), body content, `description`/`tags` as searchable metadata, `category` as a filterable facet. Typo tolerance + stemming are native ("part of the word" = stem matching; true mid-word substrings explicitly out of scope — author chose no overlay engine).
- **Tuning**: ranking params (`pageLength`, `termFrequency`, `metaWeights`, `excerptLength`) tuned in the Pagefind playground against real posts during implementation.
- **UI**: custom inline search box in the index header + dropdown results panel (excerpts, category metadata, keyboard nav, `Ctrl+K` opens from anywhere). Built on Pagefind's JS API with our CSS tokens — **not** the stock modal UI.
- **Matched-word highlighting**: enabled via `highlightParam` + Pagefind's highlight script — terms highlighted in result excerpts **and** on the destination page after navigation.
- Index runs after `astro build` (CI and local); `baseUrl` set for the `/amr-tech/` subpath.
- Arabic: Pagefind default diacritics normalization covers harakat matching; language declared via HTML `lang` for proper tokenization.

---

## 7. Media pipeline

### 7.1 Asset resolver (pre-build, local-only)

Author media may live **outside the repo** and be referenced by **true disk-absolute paths** (e.g. `F:\Media\clip.mp4`) inside markdown. GitHub Actions can never read those, so:

- `scripts/resolve-assets.mjs` runs as the **local `prebuild`** step of `npm run build`:
  1. scans all post `.md` files for disk-absolute path references (images, video, audio, documents),
  2. **copies** each referenced file into the repo (`src/assets/blogs/<slug>/…`, deduplicated by content hash),
  3. **rewrites the markdown reference** to the repo-relative path,
  4. **fails loudly** (non-zero exit, clear message) on missing/unreadable files.
- The resolved result is **committed**; CI runs `astro build` **directly** (never `npm run build`), so the resolver never executes on the runner. Committed markdown contains no disk paths.
- Repo-root-absolute references (`/src/assets/...`) skip the resolver and go straight through Astro's asset pipeline.

### 7.2 Images

- Local files through Astro's `astro:assets`: build-time **AVIF/WebP** + fallback, intrinsic dimensions (no CLS), `loading="lazy"` below the fold, hero image eager.

### 7.3 Video (author choice — recorded)

- **Self-hosted in the repo, no enforced size limits.** Author manages the GitHub Pages 1 GB soft site / 100 MB hard per-file limits personally.
- Rendering defaults (free, not guardrails the author rejected): `<video controls>` + optional `poster` from frontmatter/inline attrs. No embed frameworks, no third-party players.

### 7.4 OG / thumbnail

- `thumbnail` frontmatter wins; else the **first image in the post** is used as the OG/share image; else a site-level default. No generated OG cards.

---

## 8. Design system

### 8.1 Themes

- **Dark + light with a header toggle**; default = system preference (`prefers-color-scheme`), persisted in `localStorage`, no flash (inline head script).
- Every color is a **CSS custom property token** (`--bg`, `--surface`, `--text`, `--muted`, `--accent`, …) — adding a new theme later is a one-file edit.

### 8.2 Typography (author-selected)

| Role | Latin | Arabic | Notes |
|---|---|---|---|
| Site chrome / page headers | **Space Grotesk** | **Cairo** | nav, chips, search, footer, "Blog" title |
| Blog post titles | **Instrument Serif** (+ Italic) | **Reem Kufi** | ships Regular+Italic only ⇒ hierarchy via size, color token, letter-spacing |
| Blog body | **Literata** | **Noto Naskh Arabic** | long-read serif; naskh for Arabic readability |
| Code | **JetBrains Mono** | — | Shiki-highlighted blocks |

- **Self-hosted** via Fontsource — no Google Fonts CDN. Variable fonts where available; subset to `latin` + `arabic`; `unicode-range` splits so Latin pages never download Arabic files and vice versa; `font-display: swap`; preload the two above-the-fold families. Realistic budget: ~200–300 KB cached once, site-wide.
- Mixed-script paragraphs switch automatically via `font-family` lists — **no per-block classes in markdown** (keeps OCP clean).
- Arabic blocks get scoped `dir="rtl"`; leading tuned per script (Arabic looser). **No i18n routing, no translations** — a post may be written in any language; handling is styling-level only, plus the `lang` frontmatter (§4).

### 8.3 Code blocks

- Shiki (Astro built-in), **dual theme** via CSS variables — flips with the theme toggle, zero extra JS.
- Meta syntax supported: line highlighting ` ```js {2,4} `, block titles ` title="server.ts" `, diffs ` ins=/del= `.
- Bundled ~250 grammars; exotic languages added explicitly at insert time.

---

## 9. SEO & agent surface ("full bundle" — author choice)

Static, build-time, no exceptions:

1. Semantic HTML5 landmarks; one `<h1>` per page; heading order respected (ToC generated from it).
2. Per-page `<title>`, meta description, **canonical**, Open Graph + Twitter card (image per §7.4).
3. **JSON-LD** `BlogPosting` on every post page (headline, description, dates, author, image, in-language).
4. **`sitemap.xml`** — all version pages (self-canonical per §5.2), excludes drafts.
5. **`robots.txt`** pointing at the sitemap.
6. **RSS/Atom** (`/rss/`) — latest versions; RSS icon in the header (references).
7. **`llms.txt`** — agent index of posts + versions + mirror URLs.
8. **Raw `.md` mirrors** (§5 table) — byte-identical content for scraping agents.
9. All content in the **first HTML packet** (prerendered; JS is enhancement only — search and chips need JS, content never does).
10. Trailing-slash-consistent URLs (`trailingSlash: 'always'`), `site` + `base` correct for `/amr-tech/`.

**Honest caveat on record**: technical SEO is fully covered by this stack; rankings additionally depend on content age, links, and Google's judgment — no static site buys that.

---

## 10. Performance rules

- Zero third-party JS/CSS on the critical path (no CDNs; fonts self-hosted; no analytics).
- Shiki build-time highlighting; Pagefind assets lazy-loaded **only when search is first used**; index chunks are themselves statically hosted and incremental.
- Images AVIF/WebP with dimensions; video native, `controls`, no autoplay.
- Target: Lighthouse 100 across Performance/SEO/Best-Practices/Accessibility on both index and post pages.

---

## 11. Build & deploy

- Local: `npm run dev` (resolver-aware dev loop), `npm run build` = **resolver → astro build → pagefind**.
- CI (GitHub Actions, push to `main`): `astro build` **directly** (no resolver) → `pagefind` → `actions/deploy-pages`. PRs get preview deploys.
- Repo must be **public** (free Pages) — no sensitive data exists, per author.

---

## 12. Authoring workflow (OCP)

- Adding a post = **insert one `.md` file** (or a folder of `vN.md`) under `src/content/blogs/` and push. Everything else (routing, chips, search index, sitemap, RSS, mirrors, llms.txt, OG, ToC, highlighting, deploy) is automatic.
- Adding a version = drop `v<N+1>.md` in the post's folder.
- **No scaffold scripts, no CLIs.** `HOW-TO-ADD-A-POST.md` documents: the two shapes, full frontmatter schema, title/category resolution rules, media reference syntax (disk-absolute → run `npm run build` locally, commit resolved files; or place files in `src/assets/` directly), code-block meta syntax, draft workflow.
- Primary authoring agent flow: the author hands raw content to an agent; the agent follows `HOW-TO-ADD-A-POST.md` verbatim.

---

## 13. Explicitly accepted trade-offs (author decisions, not to be "fixed" silently)

| # | Decision | Risk | Author stance |
|---|---|---|---|
| 1 | All versions self-canonical & indexed | Near-duplicate content competing in Google | "accept duplicate" — chosen after the cost was stated |
| 2 | Self-hosted video, no limits | 1 GB soft / 100 MB hard Pages limits; page weight | "I'll manage sizes myself" |
| 3 | No second search engine | No mid-word substring matching | Pagefind stems + fuzzy deemed sufficient |
| 4 | `?version=` as redirect alias, not render mode | Query URL isn't itself the page | Settled compromise; real paths preserved |
| 5 | No Starlight | None material — rejected for the right reasons | Confirmed after docs evidence |

---

## 14. Out of scope (settled by "no backend / single author")

Comments · i18n routing/translations · multi-author · CMS/admin UI · newsletter · analytics · auto-generated OG cards · pagination (until ~40+ posts) · MDX components in posts · search substring overlay.

---

## 15. Acceptance checklist (definition of done)

- [ ] `npm run build` locally: resolver → build → pagefind succeeds; CI build without resolver succeeds.
- [ ] Insert `blogs/hello.md` (no frontmatter title, no category) → appears at `/blogs/hello/` with H1-derived title, no chip, in search, sitemap, RSS, llms.txt, `.md` mirror.
- [ ] Insert `blogs/pvc/v4.md` → becomes latest at `/blogs/pvc/`; `/blogs/pvc/v1/`…`v4/` all real pages; version box lists all; `?version=2` lands on `/blogs/pvc/v2/`.
- [ ] Search: title match outranks body match; typo query returns results; category filter works; matched words highlighted in results and on destination page; no JS until search opened.
- [ ] Theme toggle: dark/light, system default, no flash, code blocks flip with theme.
- [ ] Arabic post: correct font roles (Reem Kufi title, Noto Naskh body), RTL block handling, diacritic-insensitive search.
- [ ] Post with disk-absolute image + video refs: resolver copies, rewrites, commits clean; missing file fails the build with a clear error.
- [ ] Lighthouse: 100/100/100 on index and a sample post (perf/SEO/BP), A11y ≥ 95.
- [ ] View-source on any page: full content readable without JS.
- [ ] `HOW-TO-ADD-A-POST.md` lets a fresh agent insert a valid post on first try.

---

## 16. Changelog — implementation-time amendments (2026-11-02)

Settled during the build against Astro 7.4.5 / Pagefind 1.6 reality (each was a spec-vs-platform fact, not a decision change):

1. **Feed URL**: `/rss/` → `/amr-tech/rss.xml` (trailing-slash endpoints cannot serve a feed cleanly). `<link rel=alternate>` and the header RSS icon point there.
2. **Markdown images emit WebP only** (Astro's `![]()` pipeline; `<Picture>`/AVIF needs MDX, which is banned). Acceptable: WebP is universal; hero-AVIF can come later via resolver-generated markup.
3. **Code meta syntax is explicit, not automatic**: Astro 7's Sätteri pipeline passes only configured transformers; `@shikijs/transformers` + two custom transformers (`title=`, `ins=/del=`) implement §8.3 fully.
4. **Cross-language search via `--force-language en`** at index time (one index, every post searchable from the one box) instead of runtime mergeIndex — Pagefind's documented opt-out of language partitioning.
5. **Unknown frontmatter keys fail the build** (zod `.strict()`) — stronger than §4's "warning".
6. **NEW — dedup build guard** (author directive "when there is duplication, the build should fail, simply"): identical normalized bodies across post files abort the build naming the files; duplicate slugs abort. The latest-version alias path (`/blogs/<slug>/vN/` where vN is latest) renders a noindex redirect stub to `/blogs/<slug>/` so identical content never has two URLs. §5.2 (all versions self-canonical, indexable) otherwise unchanged.
7. **`.md` mirrors emitted by a post-build script** (`scripts/emit-mirrors.mjs`) — byte-identical copies into `dist/`, since `.md`-suffixed dynamic endpoints are not a documented Astro 7 route shape.
8. **Design direction amendment** (author directive): resend.com supersedes the three PNG references as the primary visual language — near-black dark theme, hairline borders, mono uppercase micro-labels, fluid display sizes, generous whitespace — while keeping the chosen type trio (Space Grotesk / Instrument Serif / Literata + Cairo / Reem Kufi / Noto Naskh Arabic) and the settled structure. Reference: `reference1-3.PNG` remain valid for layout patterns (ToC block, card grid, chips).
9. **Tooling**: bun/bunx everywhere (author directive); npm usage is out.

### Feature additions during authoring (user directives, all validated)

10. **Navbar alignment toggle**: three buttons (left/center/right) at header center set `data-align` on `<html>` (persisted); the reading column is placed accordingly.
11. **ToC as adjacent hover-rail**: on md+ viewports the ToC lives in a peek strip + panel anchored directly beside the body column (opposite the alignment edge: left→rail right, center/right→rail left), fading in on hover and staying open while hovered; inline numbered ToC remains on small screens. Panel never overlaps text.
12. **Reading progress bar**: 3px accent bar at the very top of post pages, width driven by a runtime CSS custom property (`--progress`) computed from scroll height.
13. **Card version pills**: index cards list `[v1][v2][v3]` as individually clickable pills (latest → bare URL, older → `/vN/`), stretched-link card body keeps whole-card navigation.
14. **Search filters cards in place** (supersedes the dropdown-results design): typing narrows the visible card grid via Pagefind matches (version URLs collapse to their post); chips and search combine; explicit clear button; `aria-live` result count.
15. **RTL auto-direction**: whole-post `dir="rtl"` via `lang: ar`, plus an mdast plugin marking Arabic-starting blocks `dir="rtl"` inside otherwise-LTR posts — no author markup.
16. **Accessibility pass** (`/accessible`, Lite): AA contrast tokens, skip link, reduced-motion, `aria-current`/`aria-pressed`/labels, GFM task-list checkboxes wrapped in labels. Final Lighthouse: index 100/100/100/100, post 100/100/100/100 (perf/a11y/bp/seo).
