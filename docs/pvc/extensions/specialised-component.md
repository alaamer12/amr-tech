# Specialised Component

> Depends on: [`../base/architecture.md`](../base/architecture.md) (Component), [`view-and-rendition.md`](./view-and-rendition.md) §7.1 (forwarding) and §7.3 (Component/Rendition symmetry), [`the-poles.md`](./the-poles.md) (Global vs. Local vs. Global-Local), and [The Settled-Behavior Axiom](./settled-behavior-axiom.md) (gates the underscore decision below). Read all four first.

---

## A Fourth Kind of Composition, Adopted From the Four-Tier UI Chain

The base architecture, as extended so far, has three things a View's content is built from — Component, Decoration/Aligner, UI Element — plus the placement poles that decide where each lives (Global, Local, Global-Local). None of the three describes a situation that surfaces reliably once a codebase matures: a Component that already does its one job correctly, and that same behavior, refined by exactly one additional capability — debouncing a search-as-you-type input, adding infinite-scroll to a list, adding optimistic-update to a submit action. This concept is adopted directly from an existing, independently-developed doctrine, *The Four-Tier UI Chain* (`<base> → <adaptive> → <component> → <specialised>`; see the acknowledgment at the end of this document), which names it **"specialised."** PVC adopts the concept and its governing tests wholesale, keeping the same name so the provenance stays traceable, rather than inventing a parallel term for an already-solved problem.

**Definition.** A **Specialised Component** is an existing Component, composed — never copied — with exactly one additional capability, where the capability itself is a generic, purpose-agnostic mechanism reusable by any Component that wants it.

```tsx
// shared/hooks/useDebounce.ts
// GLOBAL (The Poles' own test, §3: would survive deleting every current consumer —
// any Component in the app might want delayed-value behavior; not tied to search
// specifically). Owns a timer effect internally, but that effect is NEITHER a
// State NOR a Condition — it isn't consulted by a View to select a Rendition,
// it's a mechanism a Component consumes directly to reshape when it acts.
function useDebounce<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}

// features/search/components/SearchInput/_SearchInput.tsx
// Component (architecture.md §6) — purposeful, "searching." Built from
// adaptive UI Elements only. Underscored because THIS feature's search is
// SETTLED (see settled-behavior-axiom.md) as keystroke-firing, and firing
// on every keystroke without debounce is not a usable product behavior
// here — there is no standalone caller who wants this version undecorated.
// That absence of any standalone caller is what earns the underscore,
// exactly as it does for Global-Local (the-poles.md §3) — not a rule
// applied by default to every Component that happens to have a
// Specialised sibling.
function _SearchInput({ value, onChange }: SearchInputProps) {
    return (
        <div className="search-input">
            <Icon name="search" />
            <Input value={value} onChange={onChange} />
        </div>
    );
}

// features/search/components/SearchInput/DebouncedSearchInput.tsx
// SPECIALISED COMPONENT (tier 4): composes _SearchInput + useDebounce.
// Adds exactly one capability. Never copies _SearchInput's internals.
// This is the ONLY way this feature's search input is ever consumed —
// per the settled-behavior axiom, that is a settled fact about this
// feature, not an assumption.
function DebouncedSearchInput({ onSearch }: { onSearch: (q: string) => void }) {
    const [raw, setRaw] = useState("");
    const debounced = useDebounce(raw, 300);
    useEffect(() => { onSearch(debounced); }, [debounced]);
    return <_SearchInput value={raw} onChange={setRaw} />;
}
```

**Composition, not a new mechanism — the same symmetric rule as Component/Rendition.** A Specialised Component composing its base Component is governed by exactly the relationship already established between Component and Rendition ([`view-and-rendition.md`](./view-and-rendition.md) §7.3): neither side is a fact-producer *at this layer* (the capability's own internal timer is not a State/Condition, per above), so composition here has no forced direction either — this is not a new kind of relationship requiring new rules, it is the same symmetric-composition finding applied to a fourth situation.

**The underscore test for the base Component, stated precisely.** Whether `_SearchInput` (the base, tier-3 Component) is underscored is decided by one question, gated by [The Settled-Behavior Axiom](./settled-behavior-axiom.md): **does any real, current, settled consumer in this feature want the undecorated Component standalone?** If yes — some View in this same feature legitimately wants plain, non-debounced search as one of its *actual* settled behaviors, not a hypothetical one — the base Component keeps its plain name and stays independently importable, exactly like an ordinary Component. If no — as in the worked example above, where this feature's search is settled as keystroke-firing and undebounced keystroke-firing isn't a usable behavior on its own — the base Component is underscored, for the same reason `_FundCard` is underscored ([`the-poles.md`](./the-poles.md) §3): nothing outside its one composer has any reason to import it alone.

**Reuse asymmetry, and why it doesn't contradict Global-Local.** The capability mechanism (`useDebounce`) is Global — written once, reused by any Component that wants it, exactly like `useAsyncState` (`view-and-rendition.md` §7.1). The *fused result* (`DebouncedSearchInput`) is Local — it means one specific thing, "this feature's search input, debounced," and has no meaning or reuse anywhere else. This is not Global-Local: Global-Local ([`the-poles.md`](./the-poles.md)) describes one implementation shared by a *closed family of several siblings*; a Specialised Component is a *single, one-off fusion* of one Component with one Global mechanism, which happens exactly once per pairing. There is no family here to be closed or open — there is one Component, one capability, one result.

```
CAPABILITY MECHANISM (useDebounce)     → GLOBAL. Purpose-agnostic. Reused by any
                                           Component. Owns an effect, but produces
                                           no State/Condition (see worked example above).

BASE COMPONENT (_SearchInput)          → underscored iff no standalone consumer
                                           exists for THIS feature's settled behavior
                                           (settled-behavior-axiom.md's gate) —
                                           otherwise stays plain and independently
                                           importable.

SPECIALISED COMPONENT (DebouncedSearchInput)
                                        → LOCAL. One-off fusion of exactly one base
                                           Component with one capability. Composed,
                                           never copied (same rule as
                                           view-and-rendition.md §7.3).
```

**Recognition test, carried over unchanged from the source doctrine:** the name should read as *"a specific Component that also ___."* If it instead reads as *"a generic thing that ___"* with no tie to one purpose, that's the capability mechanism itself (Global, lives in `shared/hooks/`) — not a Specialised Component. If it reads as *"the thing this feature's search does"* with no added capability beyond the Component's own settled purpose, it's just an ordinary Component ([`../base/architecture.md`](../base/architecture.md) §6) — nothing to specialise.

## Acknowledgment

The Specialised Component concept, its "composed, never copied" rule, and its recognition test are adopted from an external document, *The Four-Tier UI Chain* (`<base> → <adaptive> → <component> → <specialised>`), which independently arrived at a four-tier model for UI composition organized around *what each layer is allowed to know*. Its `<component>` tier corresponds directly to PVC's own **Component**. Its `<base>` and `<adaptive>` tiers, by contrast, are **kept as two distinct placement tiers within PVC's UI Element role**, not merged into one — `ui/base/` holds the raw framework re-export (one line, the framework named exactly once, per the source doctrine's Law 1), and `ui/adaptive/` holds that same primitive with the system's own styling, variants, and states layered on, still purpose-agnostic and still zero feature knowledge. Both remain the same *architectural role* (UI Element — "what primitive interface pieces are used to construct it?"), because styling richness doesn't change a thing's job in constructing a View's purpose; what changes is that PVC now recognizes `base` and `adaptive` as two separate placement tiers *within* that one role, mirroring the source doctrine's own directory split rather than collapsing it. Its fourth tier, `<specialised>`, was the one genuine gap in PVC's *role* vocabulary (not just placement): PVC had no existing concept for "a purposeful Component, refined by exactly one additional, reusable, purpose-agnostic capability, composed rather than copied." That gap is what this document closes, under the adopted name.

```
ui/
├── base/            ← <base>: the ONLY place the framework/platform primitive
│   └── Button.tsx      is allowed to exist, re-declared under PVC's own name.
│                        A complete, correct file even at one line (source
│                        doctrine's Law 1 — do not add props/logic to justify it).
│
└── adaptive/         ← <adaptive>: base + the system's own skin — variants,
    └── Button.tsx        tokens, states, generic decorators. Still purpose-
                           agnostic, still blind to any feature. Built ONLY
                           from base (source doctrine's Law 2 — imports point
                           downward, never skip: a Component may import
                           adaptive, never base or the framework directly).
```

Both `ui/base/` and `ui/adaptive/` remain UI Element as a *role* in PVC's Page → View → Component → Decoration/Aligner → UI Element hierarchy — a Component built from `ui/adaptive/Button` is doing exactly what [`../base/architecture.md`](../base/architecture.md) §16's UI Element question already asks ("what primitive interface pieces are used to construct it?"). What's new is only that PVC's placement layer now distinguishes *which* UI Element tier a given primitive sits in, the same way The Poles distinguishes Global-Local's two configurations (§3 vs §3.1) without changing what Global-Local *means*.

---

**See also: [Wrapper Component](./wrapper-component.md)** — the zero-capability sibling of this concept; a Wrapper Component groups without adding anything, a Specialised Component composes with exactly one addition.
**See also: [Worked Examples](./worked-examples.md)** — `_SearchInput`/`DebouncedSearchInput` shown in the full composite project tree, alongside every other concept in this set.
