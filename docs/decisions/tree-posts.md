# Tree-file posts (folder-shaped document sets)

Date: 2026-11-03 · Commit: (this feature's commit) · Version: post-v1 site

## Context

The first real blog content is the PVC documentation set: 12 interlinked markdown files in a folder tree (`README.md`, `base/`, `extensions/`). The user asked for the full folder — not a rewrite — to *be* the blog, with URLs like `/blogs/pvc/state-vs-condition/`, and approved "fully introducing" a tree-posts feature, explicitly requesting package-resolver semantics (`<dir>/index.md` ≡ `<dir>/`).

## Decision

A post folder containing `index.md` (or `README.md`) at its top level is a **tree post**:

- every `.md` file below it becomes a page of the same post at `/blogs/<slug>/<tree-path>/`;
- `<dir>/index.md` and `<dir>/README.md` resolve to `<dir>/` (package style); the literal `/index/` URL stays valid as a noindex meta-refresh redirect to the folder URL (so it never enters the sitemap);
- relative links between files (`./x.md`, `../base/y.md`, `../README.md`, `](../dir/)`) are rewritten to routes at build time by a Sätteri mdast plugin (`src/lib/remark/tree-links.mjs`) — content is published byte-faithful except frontmatter;
- each page's first H1 is lifted as its title (layout renders exactly one h1); reading order via optional `order:` frontmatter, fallback alphabetical;
- the listing shows one card (root metadata, summed reading time); TreeNav page map, ToC rail, breadcrumbs, JSON-LD, canonical, sitemap, RSS, llms.txt, `.md` mirrors, and Pagefind all treat pages as first-class indexable URLs;
- two files resolving to the same URL fail the build (same philosophy as the duplicate-content guard);
- trees and `vN.md` versioning don't mix (index.md presence wins).

## Alternatives rejected

- **One merged mega-page** (built and tested first): works, but destroys the user's file boundaries, produces a 4,600-line page, and breaks per-section URLs. Rejected by user direction.
- **Independent nested posts** (`pvc/base/architecture` as its own post): no shared card, no tree nav, listing pollution.

## Follow-up decision: docs/pvc removed

`docs/pvc/` (the pasted source, committed earlier as a stopgap) is deleted: `src/content/blogs/pvc/` is now the single source of truth. Keeping two 4,600-line copies invites silent divergence; the migration edits (frontmatter titles/order, folder-index renames) live in the content copy, which is exactly what authors should edit going forward.
