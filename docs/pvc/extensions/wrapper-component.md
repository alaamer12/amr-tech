# Wrapper Component

> Depends on: [`../base/architecture.md`](../base/architecture.md) (Component, §6, §14) and [`view-and-rendition.md`](./view-and-rendition.md) §7.1 (forwarding). Read both first — this document assumes their definitions and adds one more shape: a wrapper that forwards to *several* siblings at once instead of one.

---

## Wrapper Components — Grouping Is Not a New Concept, It's Forwarding Applied to Several Siblings at Once

A trap surfaces once real features are built: a set of genuinely independent Components sit adjacent to each other in the markup — say, three unrelated action buttons — and get bundled under one plural, purposeful-sounding name (`FundInlineActions`, `SearchControls`, `ProfileButtons`). That name implies a single functional responsibility, which by the base architecture's own test ([`../base/architecture.md`](../base/architecture.md) §6: "it performs a meaningful action... for the user") would make it a Component. But nothing about grouping unrelated siblings together *is* a meaningful action — the buttons underneath are each independently purposeful; the thing holding them together does nothing on its own.

**The test that resolves this: do the siblings coordinate, or are they only adjacent?**

- **No coordination — the siblings are truly independent** (no shared state, no exclusivity, no ordering dependency): the grouping carries **no architectural role of its own**. It is not a Component, not a Decoration, not a new primitive requiring a name — it is a **Wrapper Component**: bare structural JSX (a `<div>`, a layout container) whose only job is holding independently-purposeful Components next to each other. `project-structure.md` §18 already warns against manufacturing named abstractions for this exact shape ("there is no need to turn everything into `SearchTitle`, `SearchSectionContainer`, `Wrapper`... unless those abstractions have a real reason to exist") — a Wrapper Component is that same warning, now given its own name so it can be pointed at directly instead of only avoided by instinct.
- **Real coordination exists** (shared state, exclusivity, a fixed order that matters, one member disabling another): the grouping now has a genuine responsibility, and by the Component test it **is** a Component in its own right — this is simply the already-stated but never-worked-example rule that "a Component can contain other Components where appropriate" ([`../base/architecture.md`](../base/architecture.md) §14), finally shown with a real case.

**Wrapper Component introduces no new concept — it is forwarding, applied to several siblings instead of one.** `view-and-rendition.md` §7.1 already established that a single piece of code calling through to one other implementation with fixed, known props — making no choice, consulting no fact — is forwarding, not a new relationship (`SearchLoadingRendition` calling `LoadingRendition`; a local hook calling a generic global one). A Wrapper Component does exactly the same thing, just fanned out to more than one target at once:

```tsx
// features/funds/views/FundCardView/FundCardListRendition.tsx
// _actions is a Wrapper Component: no coordination between its children,
// no fact consulted, no choice made — pure structural grouping.
function _FundCardActions({ fund }: { fund: Fund }) {
    return (
        <div className="actions-row">
            <AddToWatchlist fund={fund} />   {/* independent Component */}
            <CompareFund fund={fund} />      {/* independent Component */}
            <RemoveFund fund={fund} />       {/* independent Component */}
        </div>
    );
}
```

Nothing here branches, nothing here consults a `useXxxState`/`useXxxCondition` hook, and nothing here is a case the way a Rendition's branches are cases (`view-and-rendition.md` §7) — there is exactly one output, always, for any given props, same as any ordinary forwarding wrapper. The only difference from `view-and-rendition.md` §7.1's forwarding examples is arity: one wrapper handing fixed props to one implementation (§7.1) versus one wrapper holding several independent implementations side by side (here). Both are the same relationship — supplying known arguments to existing implementations, with no decision made — and §7.1's own rule already covers it: *"the only rule is that if a wrapper exists, it must be pure forwarding (no fact-consulting, no selection added on top)."* That rule was never written to apply to exactly one target; it applies to however many targets a wrapper hands props to, as long as none of them are chosen between.

```
FORWARDING                 → one wrapper, one target, fixed props, no choice.
                              (view-and-rendition.md §7.1)
WRAPPER COMPONENT          → one wrapper, several independent targets, fixed props, no choice.
                              same relationship, same rule, different arity — not a new concept.

If the targets start coordinating (shared state, exclusivity, order) →
    the wrapper has gained a real responsibility and has become an ordinary
    Component in its own right (architecture.md §14) — it is no longer
    a Wrapper Component, because it is no longer *just* forwarding.
```

A Wrapper Component's placement follows whichever pole its contents and context actually earn (Global, Local, or Global-Local per [The Poles](./the-poles.md)) — being a Wrapper Component is a statement about *role* (it has none, beyond holding things together), not a statement about *where it lives*.

---

**See also: [The Poles](./the-poles.md)** — decides where a Wrapper Component's own file is placed once its role (or lack of one) is established here.
**See also: [Specialised Component](./specialised-component.md)** — a different fourth shape, for when a wrapper *does* add exactly one real capability rather than zero.
