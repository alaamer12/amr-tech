# Worked Examples

> The single canonical home for every worked tree in this documentation set. [The Poles](./the-poles.md) states the tests and rules; this document shows them applied, in full, so no other document needs to redraw these trees. If you find the same `funds/`/`checkout/`/`search/` example elsewhere, that copy is stale — this file is the source of truth.

*Assumes the roles defined in [`../base/architecture.md`](../base/architecture.md) and [`../base/project-structure.md`](../base/project-structure.md), and every concept from [State vs Condition](./state-vs-condition.md), [View & Rendition](./view-and-rendition.md), [The Poles](./the-poles.md), [Wrapper Component](./wrapper-component.md), [The Settled-Behavior Axiom](./settled-behavior-axiom.md), and [Specialised Component](./specialised-component.md) — every one of those concepts appears in the tree below.*

**No folder name below is fixed vocabulary — including `features/` itself.** Every test in this system (§1's `§3`/`§3.1` of [The Poles](./the-poles.md), and the asymmetric State/Condition rule of [State vs Condition](./state-vs-condition.md)) checks *role* — is this a feature's own tier, is this an app-wide layer, is this the current owner of an effect — never spelling. `features/` could just as validly be `capabilities/`, `modules/`, or `domains/`; `shared/` could be `common/` or `app-wide/`; `funds/` and `checkout/` are just two example feature names. The tree below uses one consistent set of names purely so the same worked examples stay recognizable across documents — swap any of them and nothing about the classification changes.

---

## 1. Worked Example 1 — Global-Local via Component/Rendition Symmetry

```
features/funds/
└── views/
    └── FundCardView/
        ├── FundCardView.tsx             ← View: consults the layout toggle fact, selects one Rendition
        ├── FundCardListRendition.tsx    ← Rendition: renders _FundCard PLUS its own unique
        │                                    List-only sub-pieces (e.g. an inline action row)
        ├── FundCardGridRendition.tsx    ← Rendition: renders _FundCard PLUS its own unique
        │                                    Grid-only sub-pieces (e.g. a compact badge overlay)
        └── _FundCard.tsx                ← GLOBAL-LOCAL Component:
                                              - the PARTIAL shared piece both Renditions build on —
                                                not their entire body, just what genuinely overlaps
                                              - consumed by both Renditions above
                                              - has no meaning or use outside this View's
                                                Rendition set — deleting either Rendition
                                                leaves it with no reason to exist
                                              - therefore neither Local (more than one
                                                consumer) nor Global (no purpose outside
                                                this closed family)
```

`_FundCard` is deliberately **partial**, not the full rendered body of either Rendition. Each Rendition still owns and renders its own additional, unique sub-pieces alongside it:

```tsx
// features/funds/views/FundCardView/_FundCard.tsx
// — the genuinely shared part only: what List and Grid agree on, nothing more.
function _FundCard({ fund }: { fund: Fund }) {
    return (
        <>
            <FundName name={fund.name} />
            <FundMetrics metrics={fund.metrics} />
        </>
    );
}

// features/funds/views/FundCardView/_FundCardActions.tsx
// — a Wrapper Component (see wrapper-component.md): AddToWatchlist, CompareFund, and
// RemoveFund are independent, uncoordinated Components. This wrapper has no
// responsibility of its own — it is pure structural grouping, not a Component.
function _FundCardActions({ fund }: { fund: Fund }) {
    return (
        <div className="actions-row">
            <AddToWatchlist fund={fund} />
            <CompareFund fund={fund} />
            <RemoveFund fund={fund} />
        </div>
    );
}

// features/funds/views/FundCardView/FundCardListRendition.tsx
function FundCardListRendition({ fund }: { fund: Fund }) {
    return (
        <ListLayout>
            <_FundCard fund={fund} />
            <_FundCardActions fund={fund} />   {/* Wrapper Component, Local — no role of its own */}
        </ListLayout>
    );
}

// features/funds/views/FundCardView/FundCardGridRendition.tsx
function FundCardGridRendition({ fund }: { fund: Fund }) {
    return (
        <GridLayout>
            <_FundCard fund={fund} />
            <FundCompactBadge fund={fund} />   {/* Decoration/Aligner, Local — glanceable, one consumer */}
        </GridLayout>
    );
}
```

This matters for the placement test in [The Poles](./the-poles.md) §3: `_FundCard` is Global-Local specifically because *only the overlapping part* was extracted. `_FundCardActions` and `FundCompactBadge` are not candidates for Global-Local at all — each has exactly one consumer, so each is ordinary **Local**, colocated with the Rendition that uses it. But "Local" is a placement pole, not a role — each still needs its own role classification, and this is where an early draft of this example went wrong: it named the actions grouping `FundInlineActions` and called the whole thing a Component. That was the exact trap [Wrapper Component](./wrapper-component.md) identifies — a plural, purposeful-sounding name smuggling in a single responsibility that the grouping doesn't actually have. `AddToWatchlist`, `CompareFund`, and `RemoveFund` are each independently purposeful (real Components, by [`../base/architecture.md`](../base/architecture.md) §7); the thing holding them together is not a fourth Component, it's a **Wrapper Component** — structural grouping with no responsibility of its own, exactly because these three don't coordinate.

**A note on why these stay Local here, and where that changes.** `AddToWatchlist`, `CompareFund`, `RemoveFund`, and `FundCompactBadge` are drawn in this example as files living *inside* `FundCardView/` — that placement puts them squarely under The Poles §3's ordinary consumer test, and each has exactly one real consumer here. This is a different configuration from §3.1's tier test, not a contradiction of it: if these same Components were instead placed one level up, at `features/funds/components/` and `features/funds/decorations/` — the feature-wide tiers — they would become **Global-Local, locked to `funds/`**, by §3.1's rule, regardless of how many Views currently consume them. Both configurations are valid; which one applies depends entirely on where the files are actually placed. **§3 below** (Worked Example 3) shows the tier-locked version side by side with this View-local version so the difference in placement, and only placement, is visible.

```
_FundCard             → Global-Local Component (shared, partial — The Poles §3's test)
_FundCardActions      → Wrapper Component (Local — no role of its own; groups
                         three independent Components, wrapper-component.md)
├── AddToWatchlist    → Component (Local HERE — inside FundCardView/;
                         would be Global-Local to funds/ if placed in
                         funds/components/ instead, per The Poles §3.1)
├── CompareFund       → Component (Local HERE — same caveat)
└── RemoveFund        → Component (Local HERE — same caveat)
FundCompactBadge      → Decoration / Aligner (Local HERE — same caveat,
                         would be Global-Local to funds/ if placed in
                         funds/decorations/ instead)
```

Global-Local applies only to the piece that genuinely has more than one consumer; over-extracting the whole Rendition body into the shared file would misrepresent parts that were never actually shared, and mislabeling a Local piece's role would just as easily hide whether that piece needed its own placement question asked of it later, if a third Rendition ever appeared and needed the same button or badge.

The underscore prefix on `_FundCard` is a naming convention, not a mechanical requirement — it signals to any reader browsing the folder that this is not an independently addressable export the way a promoted `ui/` primitive would be, the same way a Rendition is described as "not independently addressable" in [`view-and-rendition.md`](./view-and-rendition.md) §2. Nothing enforces the underscore; it exists purely so that a reader scanning `FundCardView/` can tell, at a glance and without opening the file, which of the four files is the View, which two are its Renditions, and which one is scoped, shared internal implementation.

---

## 2. Worked Example 2 — Global-Local With No View, No Rendition, No Fact

[The Poles](./the-poles.md) §4 draws a distinction worth proving rather than asserting: Global-Local is not a special consequence of Component/Rendition symmetry, it is a general placement test (§3) that happens to have been *discovered* through that symmetry. To prove that, here is a case where the test applies cleanly with neither a View, a Rendition, nor any fact-consulting hook anywhere in sight — just two ordinary sibling Components that happen to share a sub-piece.

Suppose a checkout feature has two independent, unrelated Components — neither is a Rendition of the other, neither is selected by any View's branch, they are simply two different purposeful units that both happen to need the same receipt-line formatting:

```
features/checkout/
├── components/
│   ├── OrderSummary/
│   │   └── OrderSummary.tsx         ← Component: shows the cart before payment
│   ├── PaymentConfirmation/
│   │   └── PaymentConfirmation.tsx  ← Component: shows the result after payment
│   └── _ReceiptLine/
│       └── _ReceiptLine.tsx         ← GLOBAL-LOCAL Component:
│                                        - consumed by both OrderSummary and
│                                          PaymentConfirmation above
│                                        - has no reason to exist outside this
│                                          closed pair — no other feature in the
│                                          app has a use for "a checkout receipt line"
│                                        - neither Local (two consumers) nor Global
│                                          (meaningless outside this specific pair)
```

```tsx
// features/checkout/components/_ReceiptLine/_ReceiptLine.tsx
function _ReceiptLine({ label, amount }: { label: string; amount: number }) {
    return (
        <div className="receipt-line">
            <Text>{label}</Text>
            <Text>{formatCurrency(amount)}</Text>
        </div>
    );
}

// features/checkout/components/OrderSummary/OrderSummary.tsx
function OrderSummary({ items }: { items: CartItem[] }) {
    return (
        <section>
            {items.map(item => (
                <_ReceiptLine key={item.id} label={item.name} amount={item.price} />
            ))}
        </section>
    );
}

// features/checkout/components/PaymentConfirmation/PaymentConfirmation.tsx
function PaymentConfirmation({ charge }: { charge: Charge }) {
    return (
        <section>
            <_ReceiptLine label="Total charged" amount={charge.amount} />
            <ConfirmationBadge status={charge.status} />
        </section>
    );
}
```

Nothing here consults a fact. Nothing selects between sibling outcomes. `OrderSummary` and `PaymentConfirmation` are two ordinary, independently-existing Components — there is no View above them making a choice, and no Rendition anywhere in this example. The Poles §3 test still applies exactly as written: delete both `OrderSummary` and `PaymentConfirmation`, and `_ReceiptLine` has no remaining consumer and no reason to exist — so it is Global-Local, placed at the nearest common ancestor of its two consumers (`checkout/components/`), exactly as The Poles §5's folder rule prescribes, independent of any View/Rendition machinery.

This confirms The Poles §4's claim: Component/Rendition symmetry made the *first* Global-Local case easy to spot, but the pole itself is answerable by §3's test alone, wherever two siblings share implementation with no purpose beyond each other.

---

## 3. Worked Example 3 — The Two Global-Local Configurations, Side by Side

This is the same `funds/` feature as Worked Example 1 (§1 above), redrawn to show both Global-Local configurations at once — (a) inside one View's own folder, governed by The Poles §3, and (b) at the feature's own tier, governed by §3.1 — so the difference is visible in one tree rather than described only in prose.

```
features/funds/
│
├── views/
│   └── FundCardView/
│       ├── FundCardView.tsx              ← LOCAL to FundCardView/ (its one View)
│       ├── FundCardListRendition.tsx     ← LOCAL to FundCardView/
│       ├── FundCardGridRendition.tsx     ← LOCAL to FundCardView/
│       ├── _FundCard.tsx                 ← (a) GLOBAL-LOCAL, §3's test: actually
│       │                                     consumed by both Renditions in this
│       │                                     exact folder — a real, countable family
│       └── _FundCardActions.tsx          ← LOCAL to FundCardView/ (Wrapper Component,
│                                              no role of its own — see wrapper-component.md)
│
├── components/                            ← (b) THIS TIER ITSELF is GLOBAL-LOCAL,
│   ├── AddToWatchlist/                        locked to funds/, by §3.1 — every file
│   ├── CompareFund/                           placed here is available to any current
│   └── RemoveFund/                            or future View that funds/ ever has,
│                                                regardless of how many use it today
│
├── decorations/                            ← (b) same tier-lock, locked to funds/
│   └── FundCompactBadge/
│
└── hooks/                                  ← (b) same tier-lock, locked to funds/
    └── useLayoutToggleCondition.ts
```

**Both configurations can legitimately coexist in the same feature, as shown here.** `_FundCard` stays inside `FundCardView/` because it is genuinely scoped to that one View's two Renditions and nothing else — promoting it to `funds/components/` would be wrong, since no other View in `funds/` has any use for it (it's the partial shared body of one specific card, per §1 above). `AddToWatchlist`, `CompareFund`, `RemoveFund`, and `FundCompactBadge`, by contrast, are ordinary Components/Decorations with no inherent tie to `FundCardView` specifically — placing them at the `funds/` tier says "any View this feature ever grows may use these," which is a design decision, not a consumer count.

---

## 4. The Full Composite Tree

The three examples above isolate one idea each. This section places all of them — plus `search/`'s ordinary State/Condition/View/Rendition usage, `search/`'s Specialised Component pairing, and the true Global layer (`ui/base/`, `ui/adaptive/`, `shared/`) — into one complete project tree, so every concept in this documentation set is visible in a single, consistent structure.

```
src/
│
├── app/
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── funds.tsx
│   │   └── checkout.tsx
│   │
│   └── pages/
│       ├── FundsPage/
│       │   └── FundsPage.tsx                    ← PAGE: composes Views only, no primitive detail
│       └── CheckoutPage/
│           └── CheckoutPage.tsx                  ← PAGE
│
├── features/
│   │
│   ├── funds/                                                    ══════ WORKED EXAMPLE 1 & 3 ══════
│   │   │
│   │   ├── views/
│   │   │   └── FundCardView/
│   │   │       ├── FundCardView.tsx              ← LOCAL to FundCardView/: consults
│   │   │       │                                    useLayoutToggleCondition (read from the
│   │   │       │                                    funds/ tier below), selects one Rendition
│   │   │       │
│   │   │       ├── FundCardListRendition.tsx     ← LOCAL to FundCardView/: pure props → markup
│   │   │       ├── FundCardGridRendition.tsx      ← LOCAL to FundCardView/: pure props → markup
│   │   │       │
│   │   │       ├── _FundCard.tsx                 ← GLOBAL-LOCAL (a) — The Poles §3's test:
│   │   │       │                                    actually consumed by BOTH Renditions in
│   │   │       │                                    THIS SAME FOLDER; a real, countable family.
│   │   │       │                                    Would have no reason to exist if either
│   │   │       │                                    sibling were deleted. Underscore-prefixed
│   │   │       │                                    because it sits directly beside the two
│   │   │       │                                    files it's scoped to.
│   │   │       │
│   │   │       └── _FundCardActions.tsx          ← LOCAL to FundCardView/: WRAPPER COMPONENT,
│   │   │                                            no responsibility of its own — groups 3
│   │   │                                            independent Components below via pure
│   │   │                                            structural forwarding, fanned out
│   │   │                                            (wrapper-component.md)
│   │   │
│   │   ├── components/                           ← GLOBAL-LOCAL (b), LOCKED TO funds/ —
│   │   │   │                                        The Poles §3.1's test: this tier was
│   │   │   │                                        deliberately built as the shared Component
│   │   │   │                                        pool for funds/. Everything here is
│   │   │   │                                        available to any View funds/ has now or
│   │   │   │                                        ever will have — the lock is a property of
│   │   │   │                                        the TIER, not a tally of current importers.
│   │   │   ├── AddToWatchlist/
│   │   │   │     └── AddToWatchlist.tsx          ← consumed today by _FundCardActions;
│   │   │   │                                        tier-locked to funds/ regardless
│   │   │   ├── CompareFund/
│   │   │   │     └── CompareFund.tsx
│   │   │   └── RemoveFund/
│   │   │         └── RemoveFund.tsx
│   │   │
│   │   ├── decorations/                          ← GLOBAL-LOCAL (b), LOCKED TO funds/
│   │   │   └── FundCompactBadge/
│   │   │         └── FundCompactBadge.tsx        ← glanceable, non-interactive, an Aligner
│   │   │                                            relative to _FundCard; tier-locked to
│   │   │                                            funds/, not just to GridRendition
│   │   │
│   │   └── hooks/                                ← GLOBAL-LOCAL (b), LOCKED TO funds/
│   │       └── useLayoutToggleCondition.ts       ← CONDITION (fact only, never renders):
│   │                                                 externally-driven toggle; read-only to
│   │                                                 every consumer (state-vs-condition.md §5);
│   │                                                 tier-locked to funds/, available to any
│   │                                                 View this feature grows, not owned by
│   │                                                 FundCardView specifically
│   │
│   ├── checkout/                                                 ══════ WORKED EXAMPLE 2 ══════
│   │   └── components/                           ← GLOBAL-LOCAL (b), LOCKED TO checkout/ —
│   │       │                                        a SEPARATE tier from funds/components/.
│   │       │                                        Sharing the folder NAME "components/" is
│   │       │                                        not sharing a family — nothing in funds/
│   │       │                                        may import from here, and nothing here
│   │       │                                        may import from funds/.
│   │       │
│   │       ├── OrderSummary/
│   │       │     └── OrderSummary.tsx            ← consumes _ReceiptLine below
│   │       ├── PaymentConfirmation/
│   │       │     └── PaymentConfirmation.tsx     ← consumes _ReceiptLine below
│   │       └── _ReceiptLine/
│   │             └── _ReceiptLine.tsx            ← within this tier, ALSO independently
│   │                                                 satisfies The Poles §3's narrower test
│   │                                                 (actual consumers: OrderSummary +
│   │                                                 PaymentConfirmation, both real, both
│   │                                                 countable) — no View, no Rendition, no
│   │                                                 fact anywhere in this example; proves
│   │                                                 Global-Local's §3 test is general,
│   │                                                 not dependent on Component/Rendition
│   │                                                 symmetry (The Poles §4, and §2 above)
│   │
│   └── search/                                                    ══════ ORDINARY FEATURE ══════
│       ├── views/
│       │   └── SearchView/
│       │       ├── SearchView.tsx                ← LOCAL to SearchView/: consults
│       │       │                                    useNetworkCondition (READ, from shared/)
│       │       │                                    + useSearchState (OWNED, from search/'s
│       │       │                                    own tier below), selects a Rendition
│       │       ├── SearchDisabledRendition.tsx    ← LOCAL to SearchView/ (offline branch)
│       │       ├── SearchLoadingRendition.tsx     ← LOCAL to SearchView/ (loading branch;
│       │       │                                    forwards to global ui/renditions/
│       │       │                                    LoadingRendition — forwarding,
│       │       │                                    not tier-locking; view-and-rendition.md §7.1)
│       │       └── SearchErrorRendition.tsx       ← LOCAL to SearchView/ (error branch)
│       │
│       ├── components/                            ← GLOBAL-LOCAL (b), LOCKED TO search/
│       │   └── SearchInput/
│       │         ├── _SearchInput.tsx            ← Component, underscored: this
│       │         │      ├── uses ui/adaptive: Icon   feature's search is SETTLED
│       │         │      ├── uses ui/adaptive: Input   (settled-behavior-axiom.md) as
│       │         │      └── uses ui/adaptive: Button  keystroke-firing; no standalone
│       │         │                                    caller wants it undebounced, so it
│       │         │                                    earns the underscore (same test as
│       │         │                                    The Poles §3 — no consumer, no
│       │         │                                    reason to import it alone)
│       │         │
│       │         └── DebouncedSearchInput.tsx    ← SPECIALISED COMPONENT
│       │                                            (specialised-component.md): composes
│       │                                            _SearchInput + shared/hooks/useDebounce.
│       │                                            The ONLY way this feature's search
│       │                                            input is ever consumed. Local — a
│       │                                            one-off fusion, not Global-Local
│       │                                            (no closed family, just one pairing).
│       │
│       ├── decorations/                           ← GLOBAL-LOCAL (b), LOCKED TO search/
│       │   └── SearchDescription/
│       │         └── SearchDescription.tsx
│       │
│       └── hooks/                                 ← GLOBAL-LOCAL (b), LOCKED TO search/
│           └── useSearchState.ts                  ← STATE (fact only): caused + OWNED by
│                                                      whichever View in search/ calls it;
│                                                      tier-locked to search/, not buried
│                                                      inside SearchView/ specifically
│                                                      (state-vs-condition.md §5)
│
├── ui/                                                            ══════ TRUE GLOBAL LAYER ══════
│   ├── base/                                       ← GLOBAL, no lock. The ONLY place the
│   │   ├── Button.tsx                                 framework/platform primitive is allowed
│   │   ├── Input.tsx                                  to exist, re-declared under PVC's own
│   │   ├── Icon.tsx                                   name (specialised-component.md's
│   │   ├── Text.tsx                                   acknowledgment). A one-line re-export
│   │   └── Spinner.tsx                                is a complete, correct file here — do
│   │                                                   not add props/logic to justify it.
│   │
│   ├── adaptive/                                    ← GLOBAL, no lock. base + the system's own
│   │   ├── Button.tsx                                  skin: variants, tokens, states, generic
│   │   ├── Input.tsx                                   decorators. Still purpose-agnostic, still
│   │   ├── Icon.tsx                                    zero feature knowledge. Built ONLY from
│   │   ├── Text.tsx                                    ui/base/ — never from the framework
│   │   └── Spinner.tsx                                 directly (imports point downward, never
│   │                                                   skip). Components (tier 3) are built
│   │                                                   from THIS tier, not from ui/base/ directly.
│   │
│   └── renditions/
│       └── LoadingRendition.tsx                  ← GLOBAL Rendition: reusable, purpose-agnostic,
│                                                     pure props → markup (view-and-rendition.md §7.1)
│
└── shared/                                                        ══════ TRUE GLOBAL LAYER ══════
    ├── conditions/                                ← GLOBAL, no lock. Note: "shared/" here is
    │   ├── useNetworkCondition.ts                    just a folder NAME, not required vocabulary —
    │   └── useMaintenanceCondition.ts                what makes these Global is that ANY feature
    │                                                  may import them, not that they sit in a
    │                                                  folder literally called "shared". A project
    │                                                  could rename this folder `app-wide/` or
    │                                                  `common/` with no change in meaning.
    │
    ├── views/
    │   └── MaintenanceView/
    │       ├── MaintenanceView.tsx                ← GLOBAL View: reads useMaintenanceCondition,
    │       │                                         OWNS useMaintenanceEtaState (nested —
    │       │                                         legitimate composition, state-vs-condition.md §5)
    │       ├── hooks/
    │       │     └── useMaintenanceEtaState.ts    ← STATE: owned by THIS View specifically —
    │       │                                         LOCAL to MaintenanceView/, not tier-locked,
    │       │                                         despite physically living under shared/.
    │       │                                         (Ownership is decided by causation, not by
    │       │                                         which ancestor folder a file sits under —
    │       │                                         see state-vs-condition.md §5 and The Poles §4.)
    │       ├── MaintenanceLoadingRendition.tsx    ← LOCAL to MaintenanceView/
    │       ├── MaintenanceErrorRendition.tsx      ← LOCAL to MaintenanceView/
    │       └── MaintenanceRendition.tsx           ← LOCAL to MaintenanceView/ (default/success case)
    │
    └── hooks/
        ├── useAsyncState.ts                      ← GLOBAL, generic State — owns whatever
        │                                              fetch it's given; local State hooks
        │                                              (useSearchState) may thinly wrap it
        │                                              (view-and-rendition.md §7.1 — forwarding)
        └── useDebounce.ts                        ← GLOBAL, generic capability mechanism —
                                                       owns a timer effect, but produces
                                                       NEITHER State nor Condition (not a
                                                       fact consulted by a View, just a
                                                       mechanism a Component consumes to
                                                       reshape timing). Reused by any
                                                       Component that wants delayed-value
                                                       behavior — e.g. DebouncedSearchInput
                                                       above (specialised-component.md)
```

### The Rule This Tree Demonstrates

Two different, non-competing tests decide Global-Local, and this tree is built specifically so both are visible at once, in the same feature, without contradiction:

```
The Poles §3  — INSIDE one View's own folder
    → count actual, current, real consumers of this one specific file.
    → Example: _FundCard.tsx, consumed by exactly the two Renditions
      sitting in the same FundCardView/ folder. Countable. Real.

The Poles §3.1 — AT a feature's own components/decorations/hooks tier
    → ask: was this folder deliberately built as the feature-wide pool?
    → Example: funds/components/, funds/decorations/, funds/hooks/ —
      locked to funds/ the moment something is placed there, regardless
      of whether one View or ten Views currently import from it.
```

**What does NOT make something Global-Local:**
- Sitting at the same visual depth as a sibling feature (`funds/` and `checkout/` are siblings under `features/`, but nothing crosses between them — no lock exists between sibling features).
- Sharing a folder *name* with another feature's tier (`funds/components/` and `checkout/components/` are two separate locks, not one shared pool).
- Having only one consumer *today* if placed in a feature's own tier (§3.1 overrides consumer-counting at that specific level — the tier's design intent decides, not a running tally).
- Being physically nested under a folder named `shared/` (only actual importability by any feature makes something Global — `shared/` is a naming convention here, not a mechanism; see the note beside `shared/conditions/` above).

---

**Previous: [The Poles](./the-poles.md)** — the tests and rules every tree above is applying.
**See also: [wrapper-component.md](./wrapper-component.md), [settled-behavior-axiom.md](./settled-behavior-axiom.md), [specialised-component.md](./specialised-component.md)** — the concepts behind `_FundCardActions` and `DebouncedSearchInput` above.
