---
title: "The Extensions Layer"
order: 4
---


Seven documents, each closing a specific gap found in `../base/` once real, non-trivial features were built against it. These build on each other more than they stand alone — read in this order:

1. **[`state-vs-condition.md`](./state-vs-condition.md)** — State vs. Condition, the two kinds of facts a View may consult.
2. **[`view-and-rendition.md`](./view-and-rendition.md)** — View and Rendition, who consults facts and what gets rendered.
3. **[`the-poles.md`](./the-poles.md)** — Global, Local, and Global-Local: the placement model.
4. **[`worked-examples.md`](./worked-examples.md)** — every worked tree referenced by the three documents above, consolidated in one canonical place.
5. **[`wrapper-component.md`](./wrapper-component.md)** — grouping without coordination is forwarding, fanned out.
6. **[`settled-behavior-axiom.md`](./settled-behavior-axiom.md)** — a feature's Components reflect one decided behavior, not a menu of behaviors.
7. **[`specialised-component.md`](./specialised-component.md)** — a Component plus exactly one added, reusable capability.

**If you're adding a new document here:** does it need its own file, or does it belong as a cross-reference inside an existing one? A new document is warranted when the concept can stand on its own without requiring a reader to already be inside an unrelated document's context (the same test that split the old `view-and-rendition.md` into four files). If it's a worked example, it goes in `worked-examples.md`, not into the document that states the rule.

See [`../README.md`](../README.md) for the full documentation index, and [`../base/`](../base/) for the foundational layer every one of these assumes.
