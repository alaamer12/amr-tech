# Version-scoped tree posts

Date: 2026-11-12 · Extends: [tree-posts.md](./tree-posts.md)

## Context

A blog can hold several versions (`v1.md`, `v2.md`) with the highest number as the latest. A tree post (`index.md` at the top of a folder) must not contain `vN.md` files. The user needs a document set to live under one version, for example "Five Strategies" as a child of `Result Output Strategies` v2, while v1 stays a plain page. Each version must be able to hold its own independent tree.

## Decision

A folder `<slug>/vN/` that contains its own `index.md` (or `README.md`) is a **version tree**. It is a tree for that version only:

- Every `.md` file below `<slug>/vN/` becomes a page of that version. Paths are relative to the version folder.
- `<slug>/vN/index.md` is the root of that version's tree. It replaces the plain `vN.md` for that version, so a version is either a plain `vN.md` or a `vN/` tree, never both.
- The top-level tree rule (`<slug>/index.md`) still applies unchanged. A folder with a top-level `index.md` is a whole-post tree, and version folders inside it are treated as pages.
- Routing: the latest version uses the bare slug (`/blogs/<slug>/<rel>/`). Older versions use `/blogs/<slug>/vN/<rel>/`. A tree child that is not the latest uses the `vN` prefix.
- Duplicate version roots (for example `vN/index.md` plus `vN/README.md`) and two entries with the same version number fail the build.
- Relative links between pages in the same version tree are rewritten by the remark plugin (`src/lib/remark/tree-links.mjs`) to the correct `vN` route.

## Known limitations

- The TreeNav page map, breadcrumbs, and ToC rail are not yet rendered for version-tree pages. `BlogPost.astro` only shows TreeNav when `isTree` is true, and version-tree roots are not flagged that way.
- The `index` → folder redirect routes and `?version=` aliases are not emitted for version-tree pages.
- Both gaps are follow-ups. The routes and content build correctly.

## Alternatives rejected

- **Convert the whole blog folder to a tree**: this would destroy the v1/v2 history. The user wanted each version to keep its own pages.
- **Put the child in a new blog folder**: this loses the link to the parent post and the version context.
