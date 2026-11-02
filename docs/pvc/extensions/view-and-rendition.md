# View & Rendition

*Companion document: [State vs Condition](./state-vs-condition.md) — defines the two kinds of facts this document's View consults. Read that document first. This document defines who is allowed to look at those facts and render something, and what that rendered something is allowed to be.*

*Assumes the roles defined in [`../base/architecture.md`](../base/architecture.md) (View, Component, Decoration/Aligner, UI Element) and [`../base/project-structure.md`](../base/project-structure.md) (their folder placement) — this document sharpens the base architecture's View and adds Rendition alongside it, without redefining anything else.*

---

## 1. The Problem This Solves

Once State and Condition were correctly restricted to fact-only hooks that never render (see the companion doc, §0), a gap remained: something still has to *consult* those facts and decide what appears on screen. Early drafts of this architecture let that "something" borrow the `State`/`Condition` suffix directly — `MaintenanceCondition`, `SearchState` — which quietly smuggled rendering responsibility back into a name reserved for a fact. This document names the two roles that were missing:

```
View        → the function that consults facts and selects what to render
Rendition   → what gets rendered — one of several possible outcomes of a View
```

---

## 2. Definitions

### View

> **A View consults State and/or Condition facts, and selects exactly one Rendition to return.**

A View is the only kind of function in this architecture permitted to call `useXxxState()` / `useXxxCondition()` hooks *and* return JSX in the same function body. This is deliberate — it is the single seam where "fact" and "render" are allowed to meet. Every other function in the system is one or the other, never both.

A View is still a View in every sense already established in the base architecture (Page → View → Component → Decoration/Aligner → UI Element): it composes Component and Decoration, never adaptive/base directly, and it may be nested inside another View.

> **A View is always a parent/grouper of Renditions — the different cases it can present.**

This holds even when a View currently has only one visible case. A `SearchView` that has no loading/error/offline handling yet and simply returns `<ResultsList results={results} />` is not "a View without Renditions" — it is a View with exactly one Rendition, the default/success case, which happens not to need its own name or file because there's nothing to disambiguate it from. The moment a second case is added (loading, error, empty, offline), nothing about the View's role changes — it was already structurally the parent of "whatever this View can show," the count of cases just grew from one to several. A function that can only ever produce one fixed output, with no facts to consult and no cases to choose between, was never a View in the first place — it's a Component or Decoration wearing the wrong name (see the base architecture's own Law: role over implementation).

This is also why a View can never be replaced by a Rendition and vice versa: a Rendition is one case; a View is the thing that owns the set of cases and picks among them. Even a "simple" View is a grouper of one.

### Rendition

> **A Rendition is one specific, complete render that a View can produce. It receives only props. It calls no `useXxxState()` or `useXxxCondition()` hook. It is not independently addressable — it has no purpose outside the View that selects it.**

The performance metaphor: the View is the piece being performed; each Rendition is a particular performance of it, given the conditions in the room right now. "The disabled Rendition of the search," "the loading Rendition," "the maintenance Rendition."

A Rendition is built the same way any View content is built — from Component and Decoration — it just cannot itself branch on a fact. If it needs to branch, that branching belongs one level up, in the View.

**A Component, in turn, may be built from — or shared across — more than one Rendition.** Early drafts of this document only described the direction "Rendition is built from Component," in the generic, unremarkable sense every View's content is built from Component. What wasn't yet described: two sibling Renditions belonging to the *same* View's branch set can converge on and share one Component underneath them, for any reason — shared layout, shared logic, shared data-shaping, shared sub-markup. That shared Component is real, has its own placement question, and is addressed directly in §7.1 and in [The Poles](./the-poles.md).

---

## 3. The Rule

```
useXxxCondition()   → hook, fact only, never renders           [defined in companion doc]
useXxxState()       → hook, fact only, never renders           [defined in companion doc]
XxxView              → the ONLY function that both consults facts and selects a Rendition
XxxRendition         → JSX only, no hooks, no facts — pure props → markup
```

A quick self-check for any function in the codebase:

| Does it call `useXxxState`/`useXxxCondition`? | Does it return JSX? | What it must be named |
| --- | --- | --- |
| Yes | Yes | `XxxView` |
| Yes | No | `useXxxState` / `useXxxCondition` (a hook) |
| No | Yes | `XxxRendition` (or plain `Component`/`Decoration`, if it carries no fact-driven branching at all) |
| No | No | Not part of this system — a plain utility function |

There is no valid cell for "returns JSX, named with the `State` or `Condition` suffix." That combination is always a defect, regardless of which fact triggered it.

### Terminology note: "branch" / "case," never "state," when talking about a View's outcomes

When describing what a View can show, use **branch** or **case** — the two are interchangeable — never "state." This isn't pedantry: "this View has three states" is genuinely ambiguous in this system, because it could mean either "three `useXxxState()` values" (a fact, defined in the companion doc) or "three Renditions" (an outcome, defined here), and those are two different things that can even vary independently — a single State value can map to multiple cases, and a case can be reached by either a State or a Condition (§5).

```
"State"          → reserved exclusively for the fact returned by useXxxState()
"Condition"      → reserved exclusively for the fact returned by useXxxCondition()
"branch" / "case" → the neutral word for one of a View's possible outcomes (i.e. one Rendition),
                     regardless of whether a State or a Condition (or both) led to it being chosen
```

So: "SearchView has four branches" (loading, error, offline, success) is correct and unambiguous. "SearchView has four states" is not — say "branch" or "case" instead, every time, in writing and in code review, so the reader never has to guess which of the two concepts is meant.

---

## 4. Worked Example — the Corrected `SearchView`

```tsx
// hooks/useNetworkCondition.ts — fact only, never renders (see companion doc §5)
function useNetworkCondition() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const on = () => setIsOnline(true), off = () => setIsOnline(false);
        window.addEventListener("online", on);
        window.addEventListener("offline", off);
        return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
    }, []);
    return { isOnline };
}

// hooks/useSearchState.ts — fact only, never renders (see companion doc §5)
function useSearchState() {
    const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [results, setResults] = useState<Result[]>([]);
    const [error, setError] = useState<string | null>(null);
    // ...fetch effect, OWNED by this hook's caller
    return { state, results, error, retry: () => {/*...*/} };
}

// renditions — JSX only, no hooks, no facts
function SearchDisabledRendition() {
    return <SearchDisabledMessage />;              // built from Decoration
}
function SearchLoadingRendition() {
    return <Spinner />;                              // built from UI Element
}
function SearchErrorRendition({ message, onRetry }: { message: string; onRetry: () => void }) {
    return <SearchErrorMessage message={message} onRetry={onRetry} />;   // Decoration + Component
}

// the View — the ONLY function consulting facts AND selecting a Rendition
export function SearchView() {
    const { isOnline } = useNetworkCondition();                // Condition fact — read only
    const { state, results, error, retry } = useSearchState();  // State fact — owned

    if (!isOnline)            return <SearchDisabledRendition />;
    if (state === "loading")  return <SearchLoadingRendition />;
    if (state === "error")    return <SearchErrorRendition message={error} onRetry={retry} />;

    return <ResultsList results={results} />;   // the default Rendition — success needs no special name
}
```

Every function here fits exactly one row of the table in §3. Nothing is both a fact-source and a fact-consumer at once except `SearchView` itself.

---

## 5. Ownership in Practice — the Nested Case

The companion document (§5, "Nesting, and the Asymmetry in Ownership") defines the rule at the level of hooks. Here is how that rule plays out once a real View selects Renditions from it.

```tsx
// hooks/useMaintenanceCondition.ts — fact only, PRE-EXISTS independently (companion doc §5)
function useMaintenanceCondition() {
    const [isMaintenance, setIsMaintenance] = useState(false);
    useEffect(() => {
        const unsubscribe = subscribeToOpsChannel(setIsMaintenance);
        return unsubscribe;
    }, []);
    return { isMaintenance };
}

// hooks/useMaintenanceEtaState.ts — fact only, OWNED by whoever calls it (companion doc §5)
function useMaintenanceEtaState() {
    const [state, setState] = useState<"loading" | "success" | "error">("loading");
    const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/maintenance/eta", { signal: controller.signal })
            .then(r => r.json())
            .then(d => { setEtaMinutes(d.eta); setState("success"); })
            .catch(() => setState("error"));
        return () => controller.abort();
    }, []);
    return { state, etaMinutes, retry: () => setState("loading") };
}

// renditions
function MaintenanceLoadingRendition() { return <Spinner />; }
function MaintenanceErrorRendition({ onRetry }: { onRetry: () => void }) {
    return <RetryAction onRetry={onRetry} />;
}
function MaintenanceRendition({ etaMinutes }: { etaMinutes: number }) {
    return <MaintenanceMessage etaMinutes={etaMinutes} />;
}

// the View — named for what it displays, not for which fact it checks first
export function MaintenanceView({ children }: { children: ReactNode }) {
    const { isMaintenance } = useMaintenanceCondition();           // Condition fact
    const { state, etaMinutes, retry } = useMaintenanceEtaState();  // State fact — OWNED by this View

    if (!isMaintenance) return <>{children}</>;

    if (state === "loading") return <MaintenanceLoadingRendition />;
    if (state === "error")   return <MaintenanceErrorRendition onRetry={retry} />;
    return <MaintenanceRendition etaMinutes={etaMinutes} />;
}
```

`MaintenanceView` owns `useMaintenanceEtaState` (it created the fetch, it will destroy it) and merely reads `useMaintenanceCondition` (it did not create maintenance mode, cannot end it). Same asymmetry, same test, now shown with the View correctly named.

---

## 6. Confirming the Asymmetry Is Naming-Independent

This is worth stating explicitly, because it was tested directly: renaming the selector from `MaintenanceCondition` to `MaintenanceView` changes nothing about which hook owns what. The asymmetry test —

> does the hook's `useEffect` **create** the thing, or does it merely **listen** to a thing that already exists?

— is evaluated entirely inside `useMaintenanceEtaState` and `useMaintenanceCondition`, neither of which changed. The View's name is not an input to that test. This confirms ownership is a property of the *hook*, never of the *View's label* — if renaming the View had changed the answer, that would have meant naming and ownership were secretly coupled, which would have been a flaw. They aren't.

```
useMaintenanceEtaState()  → creates its own fetch  → owned by whoever calls it     → State
useMaintenanceCondition() → merely subscribes       → exists independent of caller  → Condition

View owns  → State      (legitimate composition — the View's own resolution required the fetch)
View reads → Condition   (a dependency — the View did not cause the fact and cannot end it)
```

---

## 7. Nesting: Why View-in-View Holds but Rendition-in-Rendition Cannot

The base architecture already established that a View can contain another View (`DashboardView → DeleteAccountView → ConfirmationModalView`). That remains true, unchanged, and is now understood more precisely: a View's selected Rendition is free to host a *child View*, which consults its own facts and selects its own Renditions, completely independently of its parent. This is ordinary composition — two separate groupers, one nested inside the other's chosen case.

```tsx
// SearchView's success Rendition hosts a fully independent child View
function SearchSuccessRendition({ results }: { results: Result[] }) {
    return (
        <>
            <ResultsList results={results} />
            <CameraView />   {/* ← a nested View — consults its own facts, selects its own Renditions */}
        </>
    );
}
```

A **Rendition**, however, cannot contain another Rendition as a sibling it chooses between — and the reason is conceptual, not just mechanical. Renditions are the *different cases* of a single View's question ("what does this View look like right now?"). A case cannot logically contain another case from the same set it belongs to: "loading" and "error" are both possible answers to the same question, and neither answer can *contain the other answer as an alternative to itself* without collapsing the distinction between being a member of the set and being the thing that enumerates the set. That incoherence exists before any code is written — it isn't fixed by finding some clever way to pass the choice in as a prop instead of a hook, because the problem was never *how* the choice gets made, only that a case is being asked to also act as the chooser.

The mechanical symptom follows from this: by definition (§2), a Rendition takes only props and performs no fact-consulting — it cannot decide "show RenditionA or RenditionB." The instant a function needs to make that choice, it is consulting something to decide with, which means it has a hook, which means — by the table in §3 — it is no longer a Rendition. It has become a View. So "nested Renditions" was never a forbidden pattern to police; it's a contradiction in terms twice over — once conceptually (a case containing its own case-set), and once mechanically (a Rendition that would need a hook to do it). Anything that looks like a Rendition selecting between Renditions was actually always a View that hadn't been renamed yet.

```tsx
// ✘ This LOOKS like a Rendition nesting Renditions — but it secretly consults a fact (isPremium),
//   so despite the name, it was never a Rendition. It must be renamed and reclassified.
function SearchResultRendition({ result, isPremium }: { result: Result; isPremium: boolean }) {
    if (isPremium) return <PremiumResultRendition result={result} />;
    return <StandardResultRendition result={result} />;
}
```

```tsx
// ✔ Correct: the branching function is a View — it consults the fact and IS the selector.
//   The two outcomes remain honest, non-branching Renditions.
function SearchResultView({ result }: { result: Result }) {
    const { isPremium } = usePremiumCondition();
    if (isPremium) return <PremiumResultRendition result={result} />;
    return <StandardResultRendition result={result} />;
}
```

So the rule in full: **Views nest freely inside Views (including inside another View's Rendition). Renditions can host a nested View. Renditions cannot host a nested Rendition-that-selects — any function attempting that has already become a View and should be named and treated as one.**

### 7.1 Reuse via wrapping is not nesting, and Renditions can be global or local

> **Forwarding is not nesting.** A Rendition calling another Rendition and passing it props — *forwarding* — does not violate the §7 rule, because §7 only forbids a Rendition *selecting between* sibling Renditions. Forwarding makes no choice and consults no fact; it simply hands fixed, known props to a shared implementation. Nesting-as-selection requires a decision (which, by §3, requires a hook, which promotes the decider to a View). Forwarding requires nothing but a function call. They are not the same relationship, and only the second one is the one §7 rules out.

§7 forbids one specific thing: a Rendition *choosing* between sibling Renditions. It does not forbid a Rendition being built by *calling* another Rendition — that's plain composition, the same relationship any Component or Decoration already has with a Pattern (see the base architecture's discussion of generic, fact-free composites). A global, parameterized Rendition is really just a Pattern that happens to also satisfy Rendition's own definition (pure props → markup, no hooks) — so nothing prevents a feature-local Rendition from being a thin wrapper around it:

```tsx
// ui/renditions/LoadingRendition.tsx — global, reusable, still a valid Rendition
// (props only, no hooks, no branching — nothing about being shared changes its definition)
export function LoadingRendition({ text }: { text: string }) {
    return <Spinner label={text} />;
}

// features/search/views/SearchView/SearchLoadingRendition.tsx — local wrapper, fixed props
import { LoadingRendition } from "@/ui/renditions/LoadingRendition";

function SearchLoadingRendition() {
    return <LoadingRendition text="Loading" />;   // delegation, not selection — no fact consulted here
}
```

This is legal precisely because no branch is happening — `SearchLoadingRendition` isn't choosing `LoadingRendition` over some alternative; it's just supplying fixed props to a shared implementation. There is nothing to decide, so there is no case-containing-a-case-set problem from §7. A View that wants the generic version directly may also just call `<LoadingRendition text="..." />` inline — the local wrapper exists purely for organization (a stable, named, colocated call site), not because the rule requires one.

The same reasoning extends unchanged to State and Condition hooks (companion doc, §5–6): a local hook can be a thin wrapper around a generic, shared one, and the ownership test still passes through correctly, because ownership is decided by *which layer actually calls `fetch` or `addEventListener`* — that answer is unaffected by how many wrapper layers sit above it.

> **Forwarding, as a principle, applies identically to Renditions, State hooks, and Condition hooks — it is the same relationship each time, not three separate rules.** A wrapper adds no fact-consulting and no selection; it only supplies known arguments to a shared implementation, so it can never violate §5's ownership asymmetry or §7's no-selection rule, regardless of which of the three it wraps.

```tsx
// hooks/useAsyncState.ts — global, generic, OWNS whatever fetch it's given
function useAsyncState<T>(fetcher: () => Promise<T>) {
    const [state, setState] = useState<"loading" | "success" | "error">("loading");
    const [data, setData] = useState<T | null>(null);
    useEffect(() => {
        const controller = new AbortController();
        fetcher().then(d => { setData(d); setState("success"); }).catch(() => setState("error"));
        return () => controller.abort();   // still created and destroyed here — ownership unchanged
    }, []);
    return { state, data };
}

// features/search/hooks/useSearchState.ts — local wrapper, still owned (inherited through the wrapper)
function useSearchState() {
    return useAsyncState(() => fetchSearchResults(query));
}
```

```tsx
// hooks/useBrowserEventCondition.ts — global, generic, LISTENS only, owns nothing
function useBrowserEventCondition(onEvent: string, offEvent: string) {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const on = () => setActive(true), off = () => setActive(false);
        window.addEventListener(onEvent, on);
        window.addEventListener(offEvent, off);
        return () => { window.removeEventListener(onEvent, on); window.removeEventListener(offEvent, off); };
    }, []);
    return active;
}

// shared/conditions/useNetworkCondition.ts — local wrapper, still read-only (inherited through the wrapper)
function useNetworkCondition() {
    const isOnline = useBrowserEventCondition("online", "offline");
    return { isOnline };
}
```

Placement follows the same reusable-vs-non-reusable split already established (companion doc §6): the global version lives in a shared location (`ui/renditions/`, `shared/hooks/`), the local wrapper — if one exists at all — is colocated with the View that uses it.

**Forwarding is optional, not mandatory.** Nothing in this architecture requires a local wrapper to exist — a View is always free to call the global `LoadingRendition`, `useAsyncState`, or `useBrowserEventCondition` directly, inline, with no wrapper at all. A thin wrapper is created only when a developer judges it worthwhile: a stable, named, colocated call site; a place to pin fixed props once instead of repeating them at every call site; or simply a name that reads better in that feature's context. Whether to forward is a readability/organization decision made per case, not a rule this architecture enforces — the only rule is that *if* a wrapper exists, it must be pure forwarding (no fact-consulting, no selection added on top), which is what keeps it from ever becoming a violation of §5 or §7.

### 7.1.1 "Who Uses Who" Is Not a Dual-Direction Choice — It Was a Missing Step

Before §7.2's shape was reached, it looked like a fork between two competing directions:

> **Direction A:** the two outer pieces each use the shared piece directly — `FundCardListRendition` and `FundCardGridRendition` each call `_FundCard`.
> **Direction B:** the shared piece consults a fact and redirects — a single `FundCard` checks the toggle and picks which of the two outer pieces to render.

These look like two answers to the same question, but they aren't — they're answers to two **different** questions, and treating them as mutually exclusive alternatives was the mistake. Direction B is not a variant of sharing at all: the moment something consults a fact and selects one of several outcomes, it is a View, full stop (§2–§3) — `_FundCard`-as-redirector was never a placement question, it was already-solved View/Rendition selection wearing an unfamiliar name.

Direction A is the real placement question, and it turned out not to compete with Direction B — it sits **underneath** it. There is no dual-direction choice to make, because both directions are simultaneously true at two different layers of the same tree:

```
FundCardView                    ← Direction B's question, answered: this IS the View,
│                                  consulting the toggle fact and selecting a Rendition
├── FundCardListRendition
│     └── uses _FundCard        ← Direction A's question, answered independently,
│                                  one layer below — a Rendition consuming a shared Component
└── FundCardGridRendition
      └── uses _FundCard        ← the same shared Component, consumed a second time
```

Once the fork was dissolved this way, a further fact fell out of it that neither direction alone would have surfaced: because `_FundCard` is consumed by *two* Renditions rather than one, a Rendition can be built from a Component (already known, §2) **and** a Component can be shared across sibling Renditions (not previously described). Noticing that a relationship holds in both directions at once — with neither direction blocking or requiring the other — is exactly what raised the question §7.3 answers: is this pair asymmetric, like State/Condition, or symmetric? §7.2 and §7.3 below are the direct continuation of that finding.

### 7.2 When a Component Is Shared by Sibling Renditions of the Same View

§7.1 covers a Rendition forwarding to a *generic, purpose-agnostic* global implementation (`LoadingRendition`, `useAsyncState`) — something any feature in the app could reasonably use. A different case surfaces once real features are built: two sibling Renditions belonging to the *same* View's branch set turn out to share a Component that is **not** purpose-agnostic — it has no meaning or use outside that one View's set of Renditions, and never will, but it is genuinely used by more than one of them.

```tsx
// features/funds/views/FundCardView/_FundCard.tsx
// — shared by this View's Renditions only. Not global (meaningless outside this View's
//   branch set), not local to one Rendition (both consume it), not a Pattern (it carries
//   fund-specific responsibility, not generic markup).
function _FundCard({ fund }: { fund: Fund }) {
    return (
        <>
            <FundName name={fund.name} />
            <FundMetrics metrics={fund.metrics} />
        </>
    );
}

// features/funds/views/FundCardView/FundCardListRendition.tsx
function FundCardListRendition({ fund }: { fund: Fund }) {
    return (
        <ListLayout>
            <_FundCard fund={fund} />
        </ListLayout>
    );
}

// features/funds/views/FundCardView/FundCardGridRendition.tsx
function FundCardGridRendition({ fund }: { fund: Fund }) {
    return (
        <GridLayout>
            <_FundCard fund={fund} />
        </GridLayout>
    );
}

// features/funds/views/FundCardView/FundCardView.tsx
export function FundCardView({ fund }: { fund: Fund }) {
    const { layout } = useLayoutToggleCondition();   // a fact — this View consults it, so it IS the View
    if (layout === "grid") return <FundCardGridRendition fund={fund} />;
    return <FundCardListRendition fund={fund} />;
}
```

This is the same relationship as §7.1's forwarding (`_FundCard` makes no choice, consults no fact, is pure props → markup) — but it is not global, and it would be wrong to colocate it inside either Rendition file, because both Renditions genuinely depend on it. This is a third placement outcome the architecture had not yet named. It is defined fully, with its own test, in **[The Poles](./the-poles.md)** — in that document's terms, `_FundCard` is **Global-Local**: shared, but scoped exclusively to `FundCardView`'s closed set of Renditions, never promoted to the app-wide `ui/` layer.

### 7.3 Component and Rendition Are Symmetric — Neither Is a Fact-Producer

The companion document establishes an *asymmetry* between State and Condition (§5–6 there): a View may own a State it caused, but may only read a Condition it did not cause. It is tempting to look for a similar asymmetry between Component and Rendition — but there isn't one, and the reason is precise, not incidental.

The State/Condition asymmetry exists because the test applied to that pair — *who caused the underlying side effect* — has a structurally unequal answer: Condition, by definition, precludes local causation (companion doc §1), so nothing can ever "own" one. Component and Rendition are not fact-producers at all. Neither owns an effect; neither calls `fetch` or subscribes to anything. A Rendition is pure props → markup by definition (§2). A Component, in the base architecture, is the purposeful functional unit a View composes — it does not itself hold `useXxxState`/`useXxxCondition` calls (only a View does, §3). With no side effect on either side, there is nothing for a causation test to be unequal about.

That is why the relationship discovered in §7.2 runs in whichever direction the code actually needs it to: a Rendition can be built from a Component (the ordinary case, §2), and — just as validly — a Component can be shared across sibling Renditions (§7.2's `_FundCard`). Neither direction is privileged over the other, because privilege in this architecture is only ever created by causal ownership of a fact, and neither Component nor Rendition produces one.

```
ASYMMETRIC  → State / Condition       (one side may causally own an effect, the other may only read)
SYMMETRIC   → Component / Rendition   (neither side produces a fact; composition has no forced direction)
```

This distinction — and what it implies for where shared, non-global implementation is allowed to live — is developed fully in **[The Poles](./the-poles.md)**.

---

**Three further compositions build on everything above, each in its own document:** **[Wrapper Component](./wrapper-component.md)** (a fifth shape: a Component-named grouping with no coordination among its children, resolving to forwarding fanned out); **[The Settled-Behavior Axiom](./settled-behavior-axiom.md)** (a general principle — a feature's Components reflect one decided behavior, not a hedge across several); and **[Specialised Component](./specialised-component.md)** (a Component composed with exactly one added capability, adopted from the Four-Tier UI Chain doctrine). None of the three is required to understand the rest of this document; all three assume it.

---

## 8. Naming Checklist for Renditions

Renditions are named for **what they display**, never for the fact that triggered them:

```
✔  SearchDisabledRendition     (describes the content shown)
✔  MaintenanceRendition        (describes the content shown)
✔  SearchLoadingRendition      (describes the content shown)

✘  SearchDisabledCondition     (a Rendition wearing a fact-suffix — always wrong)
✘  EtaLoadingState             (same error — a fact-suffix on something that renders)
```

If a Rendition needs its own internal fact-branching (rare — usually a sign it should be split into a nested View instead), that is the point at which it stops being a Rendition and becomes a View in its own right. A Rendition that calls a hook has silently promoted itself; rename it.

---

## 9. Folder Placement

```
features/search/
├── hooks/
│   └── useSearchState.ts            ← fact only
├── views/
│   └── SearchView/
│       ├── SearchView.tsx            ← consults facts, selects a Rendition
│       ├── SearchDisabledRendition.tsx
│       ├── SearchLoadingRendition.tsx
│       └── SearchErrorRendition.tsx
├── components/
│   └── ResultsList/
└── decorations/
    └── SearchDisabledMessage/

shared/
├── conditions/
│   ├── useNetworkCondition.ts
│   └── useMaintenanceCondition.ts
└── views/
    └── MaintenanceView/
        ├── MaintenanceView.tsx
        ├── hooks/
        │   └── useMaintenanceEtaState.ts   ← owned, colocated with the View that owns it
        ├── MaintenanceLoadingRendition.tsx
        ├── MaintenanceErrorRendition.tsx
        └── MaintenanceRendition.tsx
```

Renditions are colocated with their View, not extracted to a shared folder — they are not independently addressable (§2), so there is nothing to share. If a Rendition's *content* genuinely repeats across features with different text (see the companion doc's discussion of reusable Conditions), the reusable part is a Decoration or Component consumed by several Renditions — the Renditions themselves still stay local to their View.

### 9.1 Flat Files vs. Nested Subfolders — a Choice, Not a Rule

Every file shown in this document's folder trees is drawn flat — `FundCardView.tsx`, `FundCardListRendition.tsx`, `_FundCard.tsx` as sibling files directly inside `FundCardView/`. That flatness is only how the examples happen to be drawn; it is not part of what any of these terms *mean*. This was already established for the base architecture ([`../base/project-structure.md`](../base/project-structure.md) §17: "this model does not require one specific folder structure... it is primarily a construction and architectural model, not a mandatory filesystem convention") and it holds identically for every concept introduced since — Rendition, Global-Local Component, and Wrapper Component included. **Being a Rendition, a Global-Local Component, or a Wrapper Component is a statement about role and placement pole, never a statement about how many folder levels sit between a file and its siblings.**

Concretely, both of these are the same architecture, just drawn at different granularity:

```
FLAT (files are direct siblings)              NESTED (each gets its own subfolder)

FundCardView/                                 FundCardView/
├── FundCardView.tsx                          ├── FundCardView/
├── FundCardListRendition.tsx                 │     ├── FundCardView.tsx
├── FundCardGridRendition.tsx                 │     └── index.ts
├── _FundCard.tsx                             ├── FundCardListRendition/
└── _FundCardActions.tsx                      │     ├── FundCardListRendition.tsx
                                               │     └── index.ts
                                               ├── FundCardGridRendition/
                                               │     ├── FundCardGridRendition.tsx
                                               │     └── index.ts
                                               ├── _FundCard/
                                               │     ├── _FundCard.tsx
                                               │     ├── _FundCard.types.ts
                                               │     └── index.ts
                                               └── _FundCardActions/
                                                     ├── _FundCardActions.tsx
                                                     └── index.ts
```

Nothing about the left tree makes `_FundCard` any less Global-Local than the right tree does, and nothing about the right tree's extra subfolder promotes it toward Global — the placement pole is decided entirely by §3's test in [The Poles](./the-poles.md) (would it survive deleting its sibling family?), which has no folder-depth term in it at all. The same is true for Rendition (§2's definition — pure props, not independently addressable — never mentions folder depth) and Wrapper Component (§7.4's coordination test never mentions it either).

**When to prefer which is an ordinary engineering judgment, not an architectural one** — exactly the guidance [`../base/project-structure.md`](../base/project-structure.md) §17 already gives for Components and Views generally:
- **Flat** reads better when a View's Renditions and its Global-Local/Wrapper pieces are individually small (a few lines each) and the whole set is easy to scan as one folder listing.
- **Nested** earns its keep once an individual file grows its own supporting files — types, tests, sub-styles (`_FundCard.types.ts`, `_FundCard.test.tsx`) — the same trigger [`../base/project-structure.md`](../base/project-structure.md) already uses for ordinary Components (§6, `SearchInput/SearchInput.types.ts`).

Either way, the underscore convention on Global-Local and Wrapper files (§7.2, §7.4) is unaffected — it prefixes the *name*, not the *path*, so `_FundCard/_FundCard.tsx` still signals "shared-but-scoped, not an independent export" exactly as `_FundCard.tsx` does on its own.

**When that shared Component is scoped only to one View's Renditions (§7.2), it is Global-Local and is colocated inside that View's own folder, not promoted to `components/` or `ui/`:**

```
features/funds/
└── views/
    └── FundCardView/
        ├── FundCardView.tsx            ← consults the toggle fact, selects a Rendition
        ├── FundCardListRendition.tsx
        ├── FundCardGridRendition.tsx
        └── _FundCard.tsx                ← Global-Local: shared by both Renditions above,
                                             meaningless to anything outside this folder,
                                             underscore signals "not an independent export"
```

See **[The Poles](./the-poles.md)** for the full placement model this folder shape is derived from.

---

**Previous: [State vs Condition](./state-vs-condition.md)** — the two kinds of facts a View is allowed to consult.
**Next: [The Poles](./the-poles.md)** — Global, Local, and Global-Local: the complete placement model for anything on the symmetric (Component/Rendition) side of this architecture.
**Branches from here: [Wrapper Component](./wrapper-component.md), [The Settled-Behavior Axiom](./settled-behavior-axiom.md), [Specialised Component](./specialised-component.md)** — three further compositions building on this document, none required to read The Poles.
