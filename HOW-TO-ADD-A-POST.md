# How to Add a Post

# How to Add a Post

Everything publishes automatically: routing, category chips, in-place card search (Pagefind: typo-tolerant + stemming), sitemap, RSS, `llms.txt`, raw `.md` mirrors, OG tags (with fallback chain), ToC (inline on mobile, slide-out rail on desktop), reading-time, related-posts, syntax highlighting, footnote rendering, RTL handling, version pills, Copy Page, theme/alignment controls, deployment. Your only job is **inserting a markdown file**.

## The three shapes

### 1. Single file (the common case)

```
src/content/blogs/my-post.md        →  /blogs/my-post/   (v1, implicitly)
```

### 2. Versioned directory

```
src/content/blogs/pvc/v1.md         →  /blogs/pvc/v1/
src/content/blogs/pvc/v2.md         →  /blogs/pvc/v2/
src/content/blogs/pvc/v3.md         →  /blogs/pvc/       ← highest vN is latest
```

To publish version 4, drop `v4.md` in the folder. **No flags, no config** — highest number wins. Don't keep non-`vN.md` files inside a versioned folder: they would be published as separate nested posts.

### 3. Tree post (a folder-shaped document set)

A folder whose top level contains `index.md` (or `README.md`) is a **tree post**: the index file is the post root (its overview page), and every `.md` file anywhere below it becomes a page of the same post — resolved like a package directory:

```
src/content/blogs/pvc/index.md               →  /blogs/pvc/
src/content/blogs/pvc/base/index.md          →  /blogs/pvc/base/
src/content/blogs/pvc/base/architecture.md   →  /blogs/pvc/base/architecture/
src/content/blogs/pvc/extensions/the-poles.md→  /blogs/pvc/extensions/the-poles/
```

Rules:

- **`<dir>/index.md` maps to `<dir>/`** (and `<dir>/README.md` works too if no index exists). The URL `/blogs/pvc/base/index/` stays valid as a redirect to `/blogs/pvc/base/`.
- **Relative links between the files just work.** `./the-poles.md`, `../base/architecture.md`, `../README.md`, even `](../base/)` are rewritten at build time to their `/blogs/pvc/...` URLs. Copy a doc set in as-is; nothing needs hand-editing.
- **Reading order** is `order: N` in each page's frontmatter (lowest first; unordered pages sort alphabetically after). The root index page always comes first.
- **Page titles** come from each file's first H1 (it is lifted out of the body and rendered as the page title), or from `title:` in frontmatter if you prefer. The root index page follows the same rule.
- Every tree page gets: the TreeNav page map, ToC rail, reading progress, copy-as-markdown, JSON-LD with full breadcrumb depth, its own canonical URL, sitemap entry, search index, and a raw `.md` mirror at its URL + `.md`.
- The listing card shows the post once, with total reading time summed across all pages.
- A tree post and `vN.md` versioning don't mix: if the folder has `index.md`, everything inside (including any `vN.md`) is treated as pages.
- Two files resolving to the same URL (e.g. `base/index.md` + `base/README.md`) **fail the build**, same as duplicated content.

## Frontmatter (all optional, unknown keys fail the build)

```yaml
---
title: string          # wins over any body H1; see fallback below
description: string    # meta description, OG text, card excerpt
date: 2026-10-20       # publish date; fallback: git created date, then build date
category: string       # free-form; omitted = no chip; chip bar auto-builds itself
tags: [a, b]           # searchable metadata, not shown as chips
draft: true            # dev-only; excluded from prod build, sitemap, RSS, llms.txt, search
thumbnail: ./media/img.png   # repo-relative image; used as OG image (see fallback)
lang: en               # per-post language tag (en/ar/any) — styling only, no i18n routing
---
```

### OG image fallback chain

1. `thumbnail` frontmatter wins.
2. Else the first `/amr-tech/media/…` image referenced in the post body.
3. Else the site default (`og-default.svg`). Note: social platforms render raster images best — set `thumbnail` when the post matters.

### Title resolution (deterministic)

1. `title` in frontmatter wins.
2. Else, for a **single file**: the first `# H1` in the body becomes the title and is consumed (never rendered twice).
3. Else, for a **directory post**: the directory name, percent-decoded, dashes/underscores → spaces, Title-Cased only when pure ASCII.

## Hard rule: no duplicated content

The build **fails** if two post files have identical normalized bodies (whitespace-collapsed, frontmatter-stripped). If you copy a post to make a new one, actually change it. The error names the files.

## Media

### Images

Place files anywhere in the repo and reference them relative to the post:

```markdown
![alt](./media/diagram.png)
```

Optimized at build (WebP, lazy, no layout shift).

### Video / audio / documents (self-hosted)

Put them in `public/media/blogs/<slug>/` and reference with the **site base prefix** (`/amr-tech/media/…`) — raw HTML in markdown bypasses build-time rewriting, so the base must be in the source:

```html
<video controls src="/amr-tech/media/blogs/my-post/clip.mp4"></video>
<audio controls src="/amr-tech/media/blogs/my-post/tone.mp3"></audio>
```

Generate media with ffmpeg when needed, e.g. `ffmpeg -f lavfi -i "sine=frequency=440:duration=3" -codec:a libmp3lame tone.mp3`.

Markdown-syntax references (`[doc](/media/blogs/my-post/file.pdf)`) are base-prefixed automatically by the build.

### Disk-absolute references (the resolver)

You (or an agent) may reference files **outside the repo** by absolute disk path:

```markdown
![clip](F:\Media\shots\take1.png)
<video controls src="F:\Media\shots\demo.mp4"></video>
```

Run `bun run build` **locally**: the resolver copies each referenced file into the repo (`src/assets/` for images, `public/media/` for the rest), rewrites the markdown, and fails loudly if a file is missing. **Commit the resolved files.** CI never runs the resolver and never sees a disk path.

## Mermaid diagrams

Any fenced code block annotated `mermaid` is rendered to inline SVG **at build time** by [Pele](https://github.com/obsidianmd/pele) (Mermaid 12.1.0 syntax, every built-in diagram type: flowchart, sequence, state, class, ER, gantt, pie, mindmap, gitGraph, …):

````markdown
```mermaid
flowchart LR
  A[push] --> B[build] --> C[SVG]
```
````

- **Zero client JS** — readers get plain SVG; the site works without JavaScript exactly as elsewhere.
- **Theme-adaptive** — the SVG reads the site's CSS variables, so the dark/light morph restyles diagrams live without re-rendering. Series colors come from the `--series-1..8` role tokens.
- **A broken diagram fails the build** with file, line and column — same guard philosophy as duplicated content and missing media. Fix the syntax, rebuild.
- The raw `.md` mirror keeps the mermaid source text (agents still see the code); the HTML page carries the rendered SVG.

## Code blocks

Shiki, build-time, dual light/dark themes. Meta syntax supported:

````markdown
```js {2,4} title="server.ts"
```ts ins=2,7 del=4
```diff
+ added
- removed
```
````

## Footnotes / references

GFM footnotes work out of the box: `claim[^1]` plus `[^1]: source note`. They render as a numbered references section with back-links.

## Tables

Plain GFM tables — any width. The build makes them scroll horizontally inside the content area; a 30-column table never widens the page. No wrapper markup needed.

## Arabic & mixed-language content

- `lang: ar` in frontmatter → whole post renders RTL with the Arabic font roles (Reem Kufi title, Noto Naskh body).
- Inside any post, a block (paragraph, heading, quote, list, table) that **starts with Arabic** is auto-marked `dir="rtl"` at build time. Write naturally — no classes, no attributes, nothing to remember.

## Related posts & reading time

Automatic — nothing to set. Related posts rank by shared `category` first, then shared `tags`, and show date, title, and reading time (~230 wpm) with category tabs and Load-more. So `category` and `tags` are worth filling in.

## ?version= alias

`/blogs/pvc/?version=2` redirects to `/blogs/pvc/v2/`; `?version=latest` (or absent) lands on `/blogs/pvc/`. Real URLs are paths — query aliases are convenience only.

## Checklist for a fresh agent

1. Write `src/content/blogs/<slug>.md` (kebab-case slug; Arabic slugs allowed).
2. Add only the frontmatter you need — unknown keys fail the build.
3. Media outside the repo: absolute path is fine, then run `bun run build` locally and commit resolver output.
4. Push to `main` — GitHub Actions builds and deploys.
5. Verify locally: `bun run build` then `bun scripts/serve-gh.mjs` → http://localhost:4444/amr-tech/blogs/ (this server mirrors GitHub Pages exactly; `astro preview` mis-serves extensionless routes).
6. Never paste duplicate content — identical post bodies fail the build by design.

## Reader-facing features you get for free

Version pills on index cards · bottom-right version switcher (versioned posts) · `?version=` alias · Copy Page (copies the exact `.md`) · search-as-you-filter with Ctrl+K · category chips · dark/light morph toggle · three-point content justification with slide-out ToC rail · reading progress bar · slim brand scrollbars · `append .md` to any post URL for the raw markdown.
