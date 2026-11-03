# Mermaid rendering via Pele (build-time SVG)

Date: 2026-11-03 · Commit: 335308f · Version: post-tree-posts site

## Context

The user asked for Mermaid diagram support and pointed at `obsidianmd/pele`, noting the pipeline must *detect ```` ```mermaid ````-annotated code blocks in markdown and render them*.

## Decision

Render at **build time** with Pele's synchronous `render()` inside a Sätteri mdast plugin (`src/lib/remark/mermaid.mjs`):

- the plugin's `code` visitor matches `lang === 'mermaid'` and replaces the node with raw inline SVG wrapped in `div.pele[role=img]` — Shiki never sees the fence, so mermaid blocks don't get syntax-highlighted as text;
- Pele's output reads only CSS variables (`--pele-*`), which `components/_mermaid.scss` maps onto the site's existing role tokens; eight `--series-1..8` chart tokens were added to `themes/_light.scss` / `_dark.scss` (raw hexes live only in `abstracts/_variables.scss`). The dark/light morph restyles diagrams with no re-render and no JS;
- a PeleError (syntax/semantic/limit) **fails the build** naming file, line, column and snippet — same guard philosophy as duplicated content and unresolved media;
- `.md` mirrors keep the original mermaid source, so agents still read the code; readers get SVG.

## Alternatives rejected

- **Client-side mermaid.js** (~2.5MB, layout shift, JS required): violates the no-JS/agent-readable/perf pillars.
- **Pele `mount()` in the browser**: works, but ships JS for content that can be static; build-time render is strictly better here.
- **hast-phase replacement**: possible, but the mdast phase intercepts before Shiki transforms the fence, avoiding dead highlighter work and title/diff transformer noise.

## Verified

Test post with flowchart/sequence/state/pie: 4 inline SVGs, both-theme screenshots taken, broken-fence build failure confirmed, SEO audit 0 gaps, test post removed before commit.
