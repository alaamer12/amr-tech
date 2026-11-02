---
title: "PVC — A Role-Based UI Construction Architecture"
description: "Most codebases call everything a component and lose the information of what each piece actually does. PVC separates implementation from architectural role: Pages compose Views, Views compose purposeful Components supported by Decorations and Aligners, and UI Elements are the primitive blocks underneath."
date: 2026-11-03
category: "Architecture"
tags: ["architecture", "frontend", "react", "component-design", "project-structure"]
---

Modern web applications are usually organized around one simple hierarchy:

```
Page
└── Components
```

As the app grows, this becomes a feature-oriented structure — `pages/`, `features/`, `components/`, `ui/`. That works, but it leaves one question unanswered:

> **How is an individual page actually constructed?**

A page is rarely a bag of unrelated components. It is composed of meaningful sections, each with a primary purpose, supporting information, supporting actions, and primitive interface elements. **PVC** (Page → View → Component) is a role-based model for building UI that answers this question. Its central law is one sentence:

> **A React component is not automatically an architectural Component.**

"React component" is an implementation mechanism. `View`, `Component`, `Decoration`, `Aligner`, `UI Element` are **architectural roles** — what a unit represents in the composition of the interface. Everything below follows from keeping those two ideas apart.

## The five roles

The hierarchy is:

```
Application
    │
    └── Page
         │
         ├── View
         │    ├── Component
         │    ├── Decoration / Aligner
         │    └── UI Elements
         │
         └── View
              └── ...
```

| Concept | Primary responsibility |
| --- | --- |
| **Page** | Compose the major sections of a route/screen |
| **View** | Represent a meaningful section of UI |
| **Component** | Provide a purposeful functional/interactive unit |
| **Decoration** | Provide supporting context, information, or presentation |
| **Aligner** | Provide supporting positional/structural decoration |
| **UI Element** | Provide primitive interface construction blocks |

The whole model can be remembered through five questions:

```
PAGE           "What screen are we constructing?"
VIEW           "What meaningful section are we constructing?"
COMPONENT      "What purposeful functionality is the user interacting with?"
DECORATION /
ALIGNER        "What supports, explains, or surrounds that functionality?"
UI ELEMENT     "What primitive interface pieces construct it?"
```

### Page

A Page is an application-level screen or route whose only job is composition. It answers *what major Views make up this screen* — and nothing more:

```jsx
<DashboardPage>
    <WelcomeView />
    <StatisticsView />
    <RecentActivityView />
    <GoalsView />
</DashboardPage>
```

A Page should never directly construct `<Input />` or `<Button />`. If it does, the composition boundary has leaked.

### View

A View is a meaningful, self-contained portion of a Page — a focused section with its own visual and functional purpose, not an entire route. (This is deliberately different from MVC, where "View" can mean the whole UI layer.)

Views are composable. A View can contain another View:

```
DashboardView
└── DeleteAccountView
    └── ConfirmationModalView
```

There is no maximum depth. A View is defined by its purpose and composition, not by its position in the hierarchy. What makes a View a View is that a user could conceptually recognize it as a section, interaction, or state — not merely a rectangle of elements that happens to sit together.

### Component

A Component is the primary purposeful unit inside a View. Its defining characteristic is not reusability and not being a React component — it is that **it performs a meaningful action or interaction for the user**:

```
SearchView
└── SearchInput      ← the thing the user actually searches with

LoginView
└── LoginForm

ProfileView
└── ProfileEditor
```

### Decoration and Aligner

Decorations are the supporting elements around the primary functionality — titles, descriptions, hints, badges, dividers, illustrations, status indicators. They explain and contextualize; they are not the interaction itself.

An **Aligner is a specialized Decoration** — one with a positional relationship to the primary Component:

```
[ Icon ] [ Input field ] [ Clear ]
   ↑          ↑             ↑
leading    component     trailing
aligner                   aligner
```

So the relationship is `Decoration ⊃ Aligner`, not two sibling categories. "Decoration" describes the general supporting role; "Aligner" names a decoration's positional role relative to the Component it supports.

### UI Element

UI Elements are the primitive construction blocks: `Button`, `Input`, `Text`, `Icon`, `Chip`, `Checkbox`, `Avatar`, `Select`. The crucial distinction is between the primitive and the purposeful unit built from it:

```
Input        → UI Element
SearchInput  → Component

Button             → UI Element
ConfirmDeletion    → Component built around it
```

Classification depends on role and abstraction level, never on size. A Component is not a Component because it is large; a UI Element is not a UI Element because it is small.

## Contextual classification

The same technical implementation can hold different architectural roles in different contexts. The question is always:

> **What role does this object play in this composition?**

Consider a search interface:

```
Search
Search for users, posts, or topics...

[ 🔍 Search..................... ]

Common searches:
[React] [Python] [JavaScript]
```

Architecturally:

```
SearchView
│
├── Title              → Decoration
├── Description        → Decoration
│
├── SearchInput        → Component
│    ├── SearchIcon    → UI Element / Leading Aligner
│    ├── Input         → UI Element
│    └── ClearButton   → UI Element / Trailing Aligner
│
└── CommonKeywords     → Decoration
     └── Chip[]        → UI Element
```

The model pays off most with things conventionally called "components", like modals. A Modal that presents context, a decision, and one or more purposeful actions is architecturally a **View**:

```
ConfirmationModalView
│
├── ConfirmationText   → Decoration
├── ConfirmAction      → Component
└── CancelAction       → Component
```

This doesn't stop it from being implemented as a React component. It means implementation identity and architectural role are two different questions, and only the second one tells you anything about your UI.

## Two axes of project structure

PVC does not replace feature-based architecture — they answer different questions and are orthogonal:

- **Feature architecture** asks: *what domain does this code belong to?*
- **PVC** asks: *what role does this UI piece play in constructing its View?*

Together they produce a structure where the filesystem itself communicates architectural intent:

```
features/
└── search/
    ├── views/
    │   └── SearchView/
    ├── components/
    │   └── SearchInput/
    ├── decorations/
    │   ├── SearchDescription/
    │   └── CommonKeywords/
    ├── hooks/
    │   └── useSearchState.ts
    └── ...

ui/
└── elements/
    ├── Button/
    ├── Input/
    ├── Text/
    └── Chip/
```

A few rules ride on top of this:

- **Downward-only imports.** `Page → View → Component → UI Element`. A primitive `Button` must never import a feature View; that reverses the abstraction.
- **UI Elements stay generic.** A primitive knows `disabled`, `size`, `variant` — never `DeleteAccount` or `Checkout`. Feature-specific things belong to the feature.
- **Don't extract for extraction's sake.** `<h1>Search</h1>` inside a View doesn't need to become `SearchTitleComponent`. The architecture exists to make structure clearer, not to inflate file counts.
- **Co-locate small pieces.** A tiny supporting Decoration can live as a sibling file inside its View's folder; reusable purposeful Components get their own folder. Flat files vs nested subfolders is ordinary engineering judgment, never an architectural statement.
- **Name by role and purpose.** `SearchView`, `SearchInput`, `ProfileEditor`, `CommonKeywords` — never `Container1`, `Wrapper`, `Box`, `Thing`.

State and business logic are not forced into the UI hierarchy either: a Component consumes a hook, a hook talks to a service. PVC defines the UI composition layer, not the whole application architecture.

## State vs Condition: two kinds of facts

Once you build real features, a gap appears. A View has to react to things — and those things were all being called "state". They differ on every axis that matters:

| | **State** | **Condition** |
| --- | --- | --- |
| Caused by | This View's own request/action | Something external (network, server, ops, permissions) |
| Lifespan | Finite, resolves on its own | Indefinite, resolves when the world changes |
| Who resolves it | The View itself | An external event (reconnect, deploy ends, role granted) |
| Typical values | idle, loading, success, error, empty | offline, maintenance, unauthorized, kill-switched |

One question separates them:

> **"If I fixed this by waiting, would it resolve on its own — or does something outside this View have to change first?"**

Search results loading is State — this View's own fetch, finishing. Device offline is a Condition — it existed before this View and will exist after it. Cause decides which; **scope is a separate axis** (a camera-permission denial is a *local* Condition; a feature flag is an external cause that may affect one widget or everything).

And the naming rule that makes all of this checkable:

> **`useXxxState()` and `useXxxCondition()` are hooks. They return a fact. They never return JSX.**

This produces the system's one asymmetric ownership relationship:

```
Condition → may own        → State       (resolving it required a fetch this View caused)
State     → may only read  → Condition   (a dependency, not composition — the View didn't cause it)
```

A View reacting to a Condition may create a nested State — a maintenance banner that fetches its own ETA. A View reacting to a State can never *own* a Condition, because ownership requires having caused the effect, and by definition nothing local causes a Condition. The test lives entirely inside the hook: **does its effect create the thing, or merely listen to a thing that already exists?**

## View & Rendition: who consults facts, what gets shown

If hooks return facts and never render, something must still *consult* facts and decide what appears. Two roles fill that seam:

> **View** — the only function permitted to both consult `useXxxState`/`useXxxCondition` hooks and return JSX. It selects exactly one Rendition.
> **Rendition** — one specific, complete render a View can produce. Props in, markup out. No hooks, no facts, no branching.

The self-check is a four-row table:

| Calls a fact hook? | Returns JSX? | What it must be named |
| --- | --- | --- |
| Yes | Yes | `XxxView` |
| Yes | No | `useXxxState` / `useXxxCondition` |
| No | Yes | `XxxRendition` (or a plain Component/Decoration) |
| No | No | A utility — outside this system |

There is no valid cell for "renders JSX, named with the State/Condition suffix". That combination is always a defect.

```tsx
export function SearchView() {
    const { isOnline } = useNetworkCondition();     // read — did not cause it
    const { state, results, error, retry } = useSearchState();  // owned — caused it

    if (!isOnline)           return <SearchDisabledRendition />;
    if (state === "loading") return <SearchLoadingRendition />;
    if (state === "error")   return <SearchErrorRendition message={error} onRetry={retry} />;

    return <ResultsList results={results} />;       // the default case
}
```

Three consequences worth internalizing:

**A View is always the parent of its cases** — even with one. A "simple" View that just returns results is a grouper of one Rendition; adding loading/error later changes nothing about its role. A function that can only ever produce one fixed output, with no facts to consult, was never a View — it's a Component wearing the wrong name.

**Renditions nest as Views, never as choices.** A View freely contains another View (a Rendition can host a child View with its own facts and cases). But a Rendition cannot *select between* sibling Renditions — a case that enumerates its own case-set is a contradiction, and mechanically the choice would require a hook, which by the table makes the chooser a View. What *is* legal is **forwarding**: a Rendition calling a shared Rendition with fixed props and no choice ("`SearchLoadingRendition` renders the global `LoadingRendition`") is plain composition, not selection. Forwarding is optional, never mandatory — the only rule is that a wrapper must be *pure* forwarding, no fact-consulting added on top.

**Terminology is load-bearing.** Say "branch" or "case" for a View's outcomes — never "state", which is reserved for the fact a hook returns. "SearchView has four branches" is precise; "four states" is ambiguous between two genuinely different things.

## The Poles: where shared things live

The base model had two placement poles — Global (`ui/`, shared, purpose-agnostic) and Local (one owner, one call site). Real code broke the binary: a Component consumed by *two* sibling Renditions of one View isn't Local (two consumers) and isn't Global (meaningless outside that closed family). Filing it either way was wrong both times. The missing pole is **Global-Local**: shared, but only within one closed, enumerable family.

The test:

> **If every current sibling consumer were deleted, would this piece have any remaining consumer, or any reason to exist?**

- Yes, anything could use it → **Global**
- No reason outside this family, but more than one sibling uses it → **Global-Local** (e.g. `_FundCard`, shared by `FundCardListRendition` and `FundCardGridRendition` and nothing else)
- Exactly one consumer, by design → **Local**

Consumer *count* never decides anything by itself — the reason-to-exist question does. Global-Local is a permanent judgment ("this exists solely for this family"), not a "Global with two users so far".

A second, independent test governs whole **tier folders**. `funds/components/`, `funds/decorations/`, `funds/hooks/` are pools deliberately built to serve one feature's Views — anything placed there is Global-Local, locked to that feature, *from the first file*, regardless of how many consumers it currently has. Counting consumers at a tier gives an unstable answer; the tier's membership was decided by design intent. And one feature's tier is never a sibling feature's tier: `funds/components/` and `checkout/components/` share a name, not a family.

The interesting part is *why* Global-Local exists only on one side of the architecture. State and Condition are **fact-producers** — each backed by a side effect somebody caused — so their ownership is pre-decided by causation before any placement question is even asked. Component and Rendition produce no facts and own no effects, so they are **symmetric**: a Rendition can be built from a Component, and a Component can be shared across sibling Renditions, with neither direction privileged. Global-Local is what that symmetry makes possible.

## Wrapper Component: grouping is not a role

Three unrelated action buttons bundled under one plural, purposeful-sounding name (`FundInlineActions`) look like a Component. The test: **do the children coordinate, or are they merely adjacent?**

- No shared state, no exclusivity, no ordering dependency → the grouping carries **no architectural role at all**. It's a **Wrapper Component**: bare structural JSX whose only job is holding independently-purposeful Components side by side. It's forwarding, fanned out to several targets instead of one — same relationship, different arity, not a new concept.
- Real coordination (one member disables another, shared state, meaningful fixed order) → it has gained a genuine responsibility and is simply an ordinary Component containing other Components.

Its placement follows whichever pole its contents earn — being a Wrapper is a statement about role (it has none), not about location.

## The Settled-Behavior Axiom

Before any of the classification above can be trusted, one upstream question must be answered honestly: **is the behavior this Component embodies actually settled, or is it being hedged?**

> A feature's Components reflect one decided product behavior, never a menu of behaviors.

The failure mode is concrete: keeping both a plain and a debounced search input alive "in case some View wants the other one", inventing a hypothetical caller with the same standing as a real requirement. If a feature's search is decided as keystroke-firing, "what if we fire on a Go button instead?" is a different, not-yet-real feature. Building for it now builds for a feature that does not exist.

This is the same instinct as the Poles' closed-family requirement (no speculative future consumer justifies a placement today) and View & Rendition's "branch, never state" discipline (a View's Renditions are the actual, decided, exhaustive set of outcomes) — applied one layer earlier, to behavior. And when a Component simply *can't* be classified — unclear whether it stands alone, gets underscored, or gets replaced — the correct diagnosis is almost never "the architecture lacks a rule". It is "the product decision hasn't been made yet". No folder structure fixes that; going and making the decision does.

## Specialised Component

One genuine gap remained: a Component that already does its job correctly, refined by **exactly one additional, reusable, purpose-agnostic capability** — debouncing a search input, infinite-scrolling a list, optimistic-updating a submit. This concept is adopted, with its name, from an independently developed doctrine, *The Four-Tier UI Chain* (`base → adaptive → component → specialised`).

> A **Specialised Component** is an existing Component, **composed with** — never copied — exactly one added capability, where the capability itself is generic and reusable by anything.

```tsx
// useDebounce — GLOBAL. A mechanism, not a fact:
// it owns a timer, but no View consults it to pick a Rendition.

// _SearchInput — the base Component, underscored because this
// feature's behavior is SETTLED as keystroke-firing, and firing
// undebounced is not a usable standalone behavior. No real,
// current consumer wants it plain. (Settled-Behavior Axiom gates
// the underscore — if a plain version were genuinely wanted,
// it keeps its name and stays importable.)

// DebouncedSearchInput — the SPECIALISED Component: one-off
// fusion of one base Component with one global capability.
// LOCAL: it means "this feature's search input, debounced" and
// nothing else.
```

Note the reuse asymmetry: the capability is Global, the fused result is Local — and that is *not* Global-Local, because there is no family sharing one implementation; there is one Component, one capability, one fusion.

The recognition test from the source doctrine: the name should read as *"a specific Component that also ___"*. *"A generic thing that ___"* is the capability mechanism (Global, `shared/hooks/`). *"The thing this feature's search does"* with nothing added is an ordinary Component.

The adoption also refined the primitive layer. `ui/` is now two placement **tiers** within one architectural role:

```
ui/
├── base/         ← the framework primitive, re-declared under this system's
│                     own name, the framework named exactly once, one line
└── adaptive/     ← base + the design system's skin: variants, tokens, states.
                     Still purpose-agnostic, still blind to any feature.
```

Both remain **UI Element** — styling richness doesn't change a thing's job in constructing a View. What changed is placement granularity: a Component may import from `adaptive/` only, never from `base/` or the framework directly.

## What it buys you

The point of all these rules is that the code itself becomes a diagram of the architecture:

```tsx
export function SearchView() {
    return (
        <section>
            <SearchDescription />   {/* supporting information */}
            <SearchInput />         {/* primary functionality */}
            <CommonKeywords />      {/* supporting options   */}
        </section>
    );
}
```

Reading one file tells you the composition. And when two developers discuss a design, the vocabulary carries information a generic one cannot:

> "This is a View with a primary Component and two supporting Aligners."

versus:

> "This is a component containing some components."

The former is a specification. The latter is a shrug.

The architecture boils down to composition, in words:

> **A Page is a composition of Views. A View is a meaningful UI composition centered around purposeful functionality and supported by Decorations and Aligners. Components provide meaningful functional behavior; UI Elements provide the primitive building blocks. And a React component is only ever an implementation of whichever role the composition asks for.**
