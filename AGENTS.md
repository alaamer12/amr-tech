# AGENTS.md

## Project Directives & Conventions

Standing instructions for AI agents working in `amr-tech`.

---

### Image Generation & Visual Assets

Whenever generating or creating images, diagrams, cover art, or editorial illustrations for this project:

- **Match the Project Color Palette & Brand Design**:
  - **Core Accent Identity**: Warm terracotta / copper accent (`#d97757` in dark mode, `#b5502f` in light mode).
  - **Dark Family (Resend-inspired near-black)**: Obsidian / charcoal backgrounds (`#0a0a0a`, `#141414`, `#1c1c1c`) with crisp white-grey text (`#ededed`, muted `#a1a1a1`) and hairline borders (`rgba(255, 255, 255, 0.09)`).
  - **Light Family (Claude cream)**: Warm parchment / linen surfaces (`#faf9f5`, `#fffefb`, `#f0ece3`) with dark ink text (`#1f1e1d`, `#5e5d59`).
  - **Diagram Series / Complementary Accents**: Earthy sage green (`#2f6f4f` / `#6fae8f`), slate blue (`#3b6ea5` / `#7aa7d9`), amber (`#b45309` / `#e0a458`), and muted purple (`#7e57c2` / `#a78bda`).
- **Aesthetic**:
  - Clean, modern, editorial developer aesthetic with subtle geometric grids and hairline borders.
  - Avoid loud, random generic neon/cyberpunk tones unless explicitly requested. Anchor visuals to the site's signature terracotta accent and muted monochrome canvas.

---

### Technical & Tooling Conventions

- **Package Manager**: Use `bun` and `bunx` exclusively.
- **Content & Post Rules**:
  - Follow [`HOW-TO-ADD-A-POST.md`](./HOW-TO-ADD-A-POST.md) for post shapes (single file, versioned folder, or tree post).
  - Versioned folders use `v1.md`, `v2.md`, etc. (highest number wins for the latest route).
  - Tree posts use top-level `index.md`.
  - Maintain build guards: no duplicate bodies, no unhandled missing media references.
  - **Tables & Data Presentation**:
    - **Never write ASCII or pseudo-text box tables** (e.g. `┌───┐`, `+---+`, box-drawing characters inside code fences). They look sloppy, fail responsiveness, and break screen readers.
    - Always format data and comparisons using **standard, professional GFM Markdown tables** (`| Col 1 | Col 2 |`) so the site's typography engine renders clean, bordered, accessible, and theme-adaptive HTML tables.
