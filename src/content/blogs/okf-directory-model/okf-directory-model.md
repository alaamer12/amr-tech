---
title: "How OKF Organizes Directories: One Concept per File, One Bundle per Folder"
description: "A practical walkthrough of how the Open Knowledge Format structures its directory model — bundles, reserved filenames, identity-by-path, and why links turn a tree into a graph."
date: 2026-11-16
category: "Engineering"
tags: ["okf", "open-knowledge-format", "ai", "knowledge-management", "markdown", "google-cloud"]
thumbnail: ./_assets/hero.jpg
---

A practical walkthrough of the Open Knowledge Format's directory model, based on the v0.2 specification.

> **Key Takeaways**
> - An **OKF bundle** is a folder tree of Markdown files — the folder is the unit you ship, review, and mount.
> - **One file = one concept.** A concept's file path inside the bundle *is* its identity.
> - Only **two filenames are reserved**: `index.md` and `log.md`. Everything else is yours to design.
> - **Links turn the tree into a graph.** Ordinary Markdown links express relationships that folders cannot.
> - The spec is intentionally lenient — unknown types, broken links, and missing indexes are all tolerated.

---

## The problem a directory has to solve

Most organizations already hold the knowledge AI agents need: what a table's columns mean, how a metric is defined, how to handle an incident, which systems join where. The trouble is that it's scattered across catalogs with their own APIs, wikis, shared drives, code comments, and the heads of a few senior engineers.

When an agent has to answer a question like *"how do we compute weekly active users?"*, it must stitch the answer together from sources that were never designed to cooperate.

Google Cloud introduced the **Open Knowledge Format (OKF)** on June 12, 2026 as a response. Its pitch is that the missing piece is a *format*, not another service. Google describes it as "format, not platform" — no required SDK, no proprietary account, nothing to install.

If knowledge is just files, then **how the files are arranged becomes the whole design**. That is what this post covers.

---

## The bundle: a folder as the unit of distribution

The spec defines a **knowledge bundle** as a self-contained, hierarchical collection of knowledge documents, and calls it the unit of distribution. In practice, it is a directory tree of Markdown files.

Because it is only a directory, a bundle can travel in whatever way a directory can:

- as a **Git repository** — which the spec recommends for history, attribution, and diffs
- as a **tarball or zip archive**
- as a **subdirectory inside a larger repository**

Google's announcement puts the same idea plainly: just Markdown, just files, and just a little YAML frontmatter. The files are readable in any editor, hostable in any Git repo, and mountable on any filesystem.

---

## One concept, one file, one identity

The central rule of the layout is that **each concept is exactly one file**. A concept is a single unit of knowledge — a tangible asset such as a table or an API, or an abstract idea such as a metric or a business process.

A concept's **Concept ID** is its file path inside the bundle, with the `.md` suffix removed. So `tables/orders.md` has the ID `tables/orders`. The path *is* the identity, and no separate registry exists.

One consequence follows from this: moving a file to a different directory changes its identity. That is a good reason to settle on a layout early.

### The folder structure is yours to design

The spec is explicit that the directory structure is independent of the domain. Producers organize concepts however makes sense for the knowledge being captured, and subdirectories exist to group concepts.

Here is an illustrative bundle for an online shop. This layout is my own example, not one taken from the spec:

```text
shop/
├── index.md
├── log.md
├── tables/
│   ├── index.md
│   ├── orders.md
│   └── customers.md
├── metrics/
│   ├── index.md
│   └── revenue.md
├── playbooks/
│   ├── index.md
│   └── payment-outage.md
└── references/
    └── finance-policy.md
```

Here the top-level folders group concepts by *kind* (tables, metrics, playbooks). Grouping by domain — such as `billing/` or `auth/` — would be equally valid. Google's own sample layout groups by kind: datasets, tables, and metrics.

---

## Two reserved filenames

Only two filenames carry special meaning, at any level of the hierarchy. They must not be used for concept documents, and every other `.md` file is treated as a concept.

| Filename | Purpose |
|---|---|
| `index.md` | A directory listing that supports progressive disclosure |
| `log.md` | A chronological history of updates to that scope |

Both are optional. A missing `index.md` is explicitly something consumers must not reject a bundle for.

One practical gotcha: a stray `README.md` is *not* reserved, so under the spec it counts as a concept and needs frontmatter.

### `index.md`: progressive disclosure

An `index.md` may appear in any directory, including the bundle root. Its job is to let a person or an agent see what is available before opening individual documents. An agent can read the root index, pick a folder, read that folder's index, and only then open the concept it needs.

Index files carry no frontmatter, with one exception: the root `index.md` may declare the spec version through an `okf_version` key. Entries should reuse the `description` from each concept's frontmatter. Producers may generate indexes automatically, and consumers may synthesize one on the fly when none exists.

A small example, in the spirit of the spec's format:

```markdown
# Tables

* [Orders](orders.md) - One row per completed customer order.
* [Customers](customers.md) - One row per registered customer.
```

### `log.md`: history of the directory

A `log.md` file records the change history of the scope it sits in. It is a flat list of date-grouped entries, newest first. The date headings must use the `YYYY-MM-DD` form, and the entries themselves are free prose.

```markdown
# Directory Update Log

## 2026-11-10
* **Update**: Revised [Revenue](/metrics/revenue.md) to exclude cancelled orders.

## 2026-11-02
* **Creation**: Added the [payment outage playbook](/playbooks/payment-outage.md).
```

The bold lead word (`Update`, `Creation`, `Deprecation`) is a convention, not a requirement.

### What about tags?

Tags are a frontmatter field, not a folder or a file. The spec deliberately defines no separate file format for grouping documents by tag. A consumer that wants a tag-browsing view can build one by scanning frontmatter. This keeps cross-cutting categories out of the directory tree, so a concept lives in one place but can still carry many tags.

---

## Links turn a tree into a graph

Folders can only express parent and child. Real knowledge is more tangled: a metric depends on a table, a playbook references a dashboard. OKF handles this with ordinary Markdown links between concepts.

The spec supports two forms:

- **Absolute (bundle-relative):** starts with `/` and is resolved from the bundle root, e.g. `/tables/customers.md`. This is the *recommended* form because it stays stable when documents move within their subdirectory.
- **Relative:** a standard relative path such as `./other.md`.

A link asserts that two concepts are related. The *kind* of relationship — joins with, depends on, references — is carried by the surrounding prose, not by the link, so consumers building a graph treat links as untyped directed edges. Consumers must also tolerate broken links, since a missing target may simply be knowledge nobody has written yet.

This is what makes visual exploration possible. Google shipped a static HTML visualizer that renders a bundle as an interactive graph in a single file, with no backend.

### The `references/` convention

The spec also names an optional `references/` subdirectory. By convention it holds external material, run instructions, or code mirrored as first-class concepts inside the bundle, so other concepts can point to them by path. The spec is clear this is a naming convention, not a requirement.

---

## What lives inside each file

Directory design only makes sense once you know what a single file holds. Each concept is a UTF-8 Markdown file with two parts: a YAML frontmatter block and a free-form body.

Only one frontmatter key is required: `type`, a short label such as `Metric` or `Playbook`. Types are not registered centrally, and consumers must handle unknown ones gracefully. The recommended keys are `title`, `description`, `resource` (a URI for the underlying asset), and `tags`.

```markdown
---
type: Metric
title: Revenue
description: Recognized revenue for a fiscal year, excluding cancelled orders.
tags: [finance]
---

# Definition

The sum of `total` over [orders](/tables/orders.md) that are paid or shipped.
```

The body has no required sections, though a few headings such as `# Schema` and `# Examples` have conventional meaning. The spec encourages structure — headings, lists, tables — over freeform prose because it helps both human readers and agent retrieval.

Note how this connects back to directories: the one-line `description` is what feeds `index.md` entries and search snippets. A well-written description is what makes the progressive-disclosure layout work.

---

## Version 0.2: organizing by trust, not only by topic

Version 0.2 adds optional frontmatter families for **provenance** (`sources`), **trust** (`generated`, `verified`), and **lifecycle** (`status`, `stale_after`), since agent-written knowledge raises questions of origin, reliability, and freshness. These all live *per concept*.

That per-file design shapes how you should divide the folder. The spec introduces an `Attested Computation` concept type and makes each one its **own file** rather than embedding several in one document. The stated reason: trust state is per computation, so revenue, profit, and margin each verify, expire, and attest independently.

The spec's income-statement example reflects this. A readable `Metric` concept narrates the figures and links to one computation file per figure, and supporting material sits under `references/`. The spec adds that co-locating related computations is a *directory choice* — for instance a `computations/` folder with its own `index.md` — and not something encoded in frontmatter.

My inference, not a rule from the spec: **split a concept into separate files when its parts would be verified, updated, or expire on different schedules.** The file boundary is where trust metadata attaches.

---

## A lenient format, on purpose

For all its structure, OKF is permissive. A bundle is conformant if every non-reserved `.md` file has parseable frontmatter, every frontmatter block has a non-empty `type`, and the reserved files follow their documented shapes when present.

Beyond that, consumers must not reject a bundle over missing optional fields, unknown types, unknown extra keys, broken links, or missing `index.md` files. This tolerance is what lets bundles written by different producers — a human, an export pipeline, an LLM — be read by different consumers without translation.

---

## Guidelines worth following

These are my own recommendations, drawn from the spec's principles and not mandated by it.

1. **One concern per file.** If two parts of a document would change or be verified separately, they belong in separate concepts.
2. **Pick one primary axis for folders and keep it.** Group by kind or by domain, not both at the same level, and use `tags` for cross-cutting themes.
3. **Write a real `description` for every concept.** It powers your indexes and previews.
4. **Prefer absolute links.** They're the spec's recommended form and survive reorganization within a subdirectory.
5. **Keep the bundle in Git.** The spec recommends it for history and diffs; use `log.md` for the human-readable story of what changed.
6. **Avoid the reserved names.** Never name a concept `index.md` or `log.md`, and remember that every other `.md` file — including a `README.md` — needs frontmatter.

---

## Limits worth knowing

**It is still early.** Google itself calls v0.1 a starting point and not a finished standard. The move to v0.2 included two breaking changes: `timestamp` was superseded by `generated.at`, and the body `# Citations` list was superseded by `sources`.

**It is a format, not a retrieval system.** Among its stated non-goals, the spec lists prescribing storage, serving, or query infrastructure. OKF packages knowledge but does not specify how an agent finds it.

**It is not an SEO tactic.** OKF was designed for internal knowledge, and Google's announcements do not tie it to search ranking.

---

## Conclusion

OKF's directory model is small enough to remember: a folder is a bundle, a file is a concept, a path is an identity, and links form the graph. Two optional files — `index.md` and `log.md` — add navigation and history, and everything else is left to you.

That minimalism is the point. By asking producers to agree on only a few structural conventions, the format makes knowledge portable across tools and teams while leaving the content model open. If you are organizing documentation for agents today, the most useful habit it teaches is to split knowledge by concern — so every file answers one question and can be loaded, linked, verified, and replaced on its own.

---

## References

*All sources accessed November 16, 2026.*

1. Google Cloud. "Open Knowledge Format (OKF), Version 0.2" (`okf/SPEC.md`). GoogleCloudPlatform/knowledge-catalog, GitHub. <https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md>

2. McVeety, Sam, and Amir Hormati. "Introducing the Open Knowledge Format." Google Cloud Blog, June 12, 2026. <https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing>

3. heise online. "Open Knowledge Format: AI Knowledge as Markdown Files." <https://www.heise.de/en/news/Open-Knowledge-Format-AI-Knowledge-as-Markdown-Files-11332310.html>

4. i-SCOOP. "Open Knowledge Format puts company knowledge in plain files, and trust in the frontmatter." <https://www.i-scoop.eu/open-knowledge-format/>

---

*Further reading: Karpathy, Andrej. "LLM Wiki" (gist), the pattern OKF formalizes. <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>*
