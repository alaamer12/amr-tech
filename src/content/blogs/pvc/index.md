---
title: "PVC — A Role-Based UI Construction Architecture"
description: "The complete PVC documentation set: five architectural roles (Page, View, Component, Decoration/Aligner, UI Element) distinct from any framework, project structure, State vs Condition, View & Rendition, the three placement poles, Wrapper Components, the Settled-Behavior Axiom, and Specialised Components."
date: 2026-11-03
category: "Architecture"
tags: ["architecture", "frontend", "react", "component-design", "project-structure"]
order: 0
---

PVC (Page → View → Component) is a role-based UI construction architecture: what matters is the *architectural role* a piece of code plays, never the framework or implementation it happens to be built with. This index links every document in the set, in the order a new reader should approach them.

## Base — read first, never changes

The permanent, foundational layer. Everything in `extensions/` builds on top of these two documents without ever contradicting them.

- **[`base/architecture.md`](./base/architecture.md)** — defines the five architectural roles (Page, View, Component, Decoration, Aligner, UI Element) as concepts distinct from implementation. The central law: a React component is not automatically an architectural Component.
- **[`base/project-structure.md`](./base/project-structure.md)** — translates those roles into an actual folder/file layout: feature ownership vs. architectural role as two independent axes, naming conventions, import direction.

## Extensions — built on top of the base layer

Each of these closes a specific gap found in the base layer once real, non-trivial features were built against it. Read in this order — later documents assume earlier ones.

1. **[`extensions/state-vs-condition.md`](./extensions/state-vs-condition.md)** — the two kinds of facts a View may consult: **State** (this View's own request/action, owned) and **Condition** (something external, read-only). Establishes the one asymmetric ownership relationship in this entire system.
2. **[`extensions/view-and-rendition.md`](./extensions/view-and-rendition.md)** — who is allowed to consult those facts (**View**) and what gets rendered as a result (**Rendition**). Establishes the naming rule, nesting rules, forwarding, and the symmetric Component/Rendition relationship.
3. **[`extensions/the-poles.md`](./extensions/the-poles.md)** — the placement model: **Global**, **Local**, and **Global-Local** (shared, but only within one closed family). Two distinct tests: consumer-count (inside a View's own folder) and tier-lock (at a feature's own `components/`/`decorations/`/`hooks/` folder).
4. **[`extensions/worked-examples.md`](./extensions/worked-examples.md)** — the single canonical home for every worked tree referenced by the documents above. If a tree appears elsewhere, that copy is stale; this file is the source of truth.
5. **[`extensions/wrapper-component.md`](./extensions/wrapper-component.md)** — a Component-named grouping with no coordination among its children resolves to forwarding, fanned out to several targets — not a new architectural role.
6. **[`extensions/settled-behavior-axiom.md`](./extensions/settled-behavior-axiom.md)** — a general governing principle: a feature's Components reflect one decided product behavior, never a hedge across several. An unclassifiable Component is usually a sign of a missing product decision, not a missing architecture rule.
7. **[`extensions/specialised-component.md`](./extensions/specialised-component.md)** — a Component composed with exactly one additional, reusable, purpose-agnostic capability (e.g. debounce). Adopted from an external doctrine, *The Four-Tier UI Chain*; also introduces the `ui/base/` vs `ui/adaptive/` placement split.

## How these relate, in one picture

```
base/architecture.md  ──┐
                         ├──► every extension assumes both
base/project-structure.md ──┘

state-vs-condition.md ──► view-and-rendition.md ──► the-poles.md ──► worked-examples.md
                                    │                                        ▲
                                    ├──► wrapper-component.md ───────────────┤
                                    ├──► settled-behavior-axiom.md ─────────►│
                                    └──► specialised-component.md ───────────┘
                                              (cites settled-behavior-axiom.md)
```

## Updating this documentation set

When a new gap is found and closed:
1. Identify which existing document the gap belongs to, or whether it's a genuinely new, independently-standing concern (in which case it gets its own file in `extensions/`, not a subsection bolted onto an unrelated document).
2. If the fix touches a worked example, update it **only** in `extensions/worked-examples.md` — no other document should carry its own copy of a tree.
3. Update this README's ordering/table if a new document is added.
