---
title: "The Blockiya Pattern: A Framework-Agnostic Architecture for UI Orchestration"
description: "A comprehensive guide to the Blockiya Pattern (v2.2.0)—an architectural standard that treats UI as disciplined building blocks with zero styling, derived props, and upward-firing intents. Incubated in React/TypeScript, portable to Vue, Svelte, Solid, and MAUI/Blazor."
date: 2026-11-24
category: "Software Architecture"
tags: ["react", "vue", "maui", "frontend", "software-architecture", "clean-code", "design-systems", "typescript", "csharp"]
thumbnail: ./_assets/cover.jpg
order: 1
lang: en
---

> **Key Takeaways**
> - **The Two Moves:** Blockiya is about exactly two things—separate the system into building blocks where each layer knows only the layer directly below it, and make those blocks define intents that fire upward. Everything else exists to keep those two moves honest.
> - **Framework-Agnostic by Design:** The pattern was inspired, tested, and produced in React project experiments, and its canonical reference code is React/TypeScript—but the roles and rules port cleanly to Vue composables, Svelte, Solid, and MAUI/Blazor C#, like MVVM before it. Only the way you write the code changes.
> - **Zero Styling Rule:** Blockiyas write zero CSS—no `className`, no `style` attributes, no utility strings. All visual presentation is delegated strictly to design system primitives.
> - **Strict Blockiya:** Enforces mechanical consistency with a utilities package—replacing fragile inline `isLoading`/`error` flags with `useIntent`, inline selectors with `useDerive`, and messy ternaries with `<If>`, `<Maybe>`, and `<For>`. `blockiya-core` is the recommended package name; the rule binds the contract, not the label.

---

## 1. What is Blockiya?

A **Blockiya** is an orchestrator. It owns domain state, talks to data sources through the data layer, derives props before passing them down, and translates user interactions into clean intents that fire upward. 

It never writes CSS. It never touches inline styles. It never reaches into a third-party library's internals. And it never decides what happens after an intent is fired—what happens next is always the caller's concern.

The pattern is about **exactly two moves**: separate the system into building blocks with strict knowledge boundaries, and make those blocks define intents upward. The name originates from the Arabic word for "block" (**بلوكية**) — a deliberate structural building unit characterized by an immutable shape, clear boundaries, and a known interface. Much like a stone block in classic architecture, it can be picked up, relocated, and set into a completely different context without altering its internal logic.

The mental model is that of an **architect, not a craftsman**. An architect does not mold bricks, nor do they lay mortar. An architect determines what the building requires and assembles the right materials in the right positions. Everything else is delegated.

One clarification the pattern deserves: **Blockiya is not a React pattern.** It was inspired, tested, and produced in React project experiments, which is why the reference code in this series is React/TypeScript—but the rules concern ownership, direction, and isolation, none of which mention a framework. Like MVVM before it, the idea applies broadly; only the syntax changes. Section 8 maps every role onto Vue, Svelte, Solid, and MAUI/Blazor.

![The Blockiya Architectural Stack](./_assets/blockiya-architecture.jpg)

---

## 2. Why Blockiya Exists

Before establishing this pattern, components inevitably degraded into catch-alls. A single 800-line React file would:
1. Fetch data directly via raw API promises or ad-hoc `fetch()` calls.
2. Juggle three or four tangled pieces of local state.
3. Write sprawling inline CSS or arbitrary utility classes.
4. Directly instantiate complex external libraries (like `xterm.js` or `CodeMirror`).
5. Fire arbitrary router navigation calls and pop confirmation modals on button clicks.

Changing one property broke unrelated features. Writing reliable unit tests was impossible without mocking the entire runtime world.

Blockiya solves this by enforcing a single, non-negotiable architectural rule:

> **Every piece of the system knows only about the layer directly below it, and fires intentions only upward.**

---

## 3. The Layer Stack

In the Blockiya architecture, responsibilities are stratified into strict hierarchical tiers:

| Layer | Responsibility | Key Characteristics |
|---|---|---|
| **Page** | Route & layout orchestration | Handles URL routing, layout grid, and passes route context downward |
| **Blockiya** | Domain orchestration & state | Owns domain state, queries data, derives props, fires intents upward |
| **Child Components** | Presentational rendering | Receive strictly derived props, own no domain state, emit callbacks |
| **Behavioral Primitives** | Interactive UI primitives | Manage keyboard navigation, focus, and ARIA internally (Dropdown, Modal) |
| **Non-Behavioral Primitives** | Visual design system tokens | Pure layout and typography tokens (Box, Flex, Text, Button) |
| **Adapters** | Third-party library boundaries | Wrap external tools, translate design tokens and events, manage lifecycle |
| **Utilities** | Compatibility slot for helpers | Any package whose helpers snap in without contradiction or taking over control. Recommended name: `blockiya-core` (`If`, `useIntent`, `useDerive`) |

---

## 4. Stereotypes: The Shared Vocabulary

Stereotypes classify components by architectural role. They appear in technical design documents, architectural diagrams, and code comments as `<<Stereotype>>`. While not compiler-enforced, they make architectural intent visible at a glance.

| Stereotype | Meaning | When to Use | Example |
|---|---|---|---|
| `<<Page>>` | Top-level route component | Framework route pages (e.g., Next.js, Astro, React Router, Nuxt) | `BillingOverviewPage` |
| `<<Feature>>` | Large workflow orchestrator | Multi-step wizards, complex flows | `CheckoutWizardBlock` |
| `<<Compound>>` | Multi-component Blockiya | Combines 2 to 5 child blocks | `BillingOverviewBlock` |
| `<<Atomic>>` | Single-purpose Blockiya | Focused, leaf-level orchestrator | `UsageChartsBlock` |
| `<<Primitive>>` | Non-behavioral design component | Visual design tokens, zero interaction logic | `Button`, `VStack`, `Text`, `Box` |
| `<<Behavioral>>` | Behavioral design component | Owns internal interaction state (`isOpen`, focus) | `Dropdown`, `Modal`, `Tooltip` |
| `<<Context>>` | Context provider | Deep prop sharing across descendants | `ProjectContext` |
| `<<Hook/Query>>` | Data fetching hook | External server state access | `useBillingUsage`, `useProjects` |
| `<<Adapter>>` | Third-party library wrapper | Isolates external tools, maps tokens/events | `CodeEditorAdapter`, `TerminalAdapter` |
| `<<Utility>>` | Compatible helper—an interoperability slot | Works alongside a Blockiya without contradiction or taking over control | `If`, `For`, `useIntent`, `useDerive` |

> [!TIP]
> **Stereotypes are growth signals.** When an `<<Atomic>>` block starts accumulating multiple children and expanding beyond its single concern, it is signaling that it needs to be promoted to a `<<Compound>>` block, or split into focused peers.

---

## 5. The Blockiya Contract

A Blockiya is the **only** piece in the stack permitted to:
- Fetch or mutate data (via hooks from `queries/`, never raw `fetch()`).
- Own domain state (`isEditing`, `draft`, `isLoading`, `isSaving`).
- Derive props before passing them down.
- Decide which children to render and when.
- Fire intents upward to its caller.

### Strict Non-Negotiable Rules

1. **Zero Styling:** No `className`, no `style` attributes, no inline CSS, no utility classes. All visual output must pass through design system primitives.
2. **Never Call APIs Directly:** All data fetching and mutations must go through dedicated hooks from the `queries/` layer.
3. **The 3–7 Props Ceiling:** A Blockiya should receive 3–7 props and emit 3–7 intents. Exceeding this range indicates that the component has taken on multiple domains and must be split.
4. **Derive Before You Pass:** Raw API payloads never touch child components. Always transform raw models into view-specific shapes.
5. **Fire Intents and Stop:** The Blockiya does not care what happens next. It announces what happened (`onSaveIntent`) and stops.

```tsx
// ✅ Correct: Fires intent, completes its responsibility
const handleDelete = () => {
  onDeleteIntent(userId);
};

// ❌ Incorrect: Blockiya makes a UX decision that belongs to the parent/caller
const handleDelete = () => {
  if (window.confirm("Are you sure?")) {
    onDeleteIntent(userId);
    navigate("/users"); // Leaking navigation and UX flow into the block
  }
};
```

---

## 6. Strict Blockiya

Strict Blockiya is the disciplined, opinionated variant of the pattern. Much like how the Repository Pattern provides strict vs. loose implementations, Strict Blockiya introduces mechanical constraints that eliminate developer discretion:

1. **Utilities-package helpers are required:** Every async operation runs through `useIntent`. Every derivation runs through `useDerive`. Conditional and list rendering uses `<If>`, `<Maybe>`, and `<For>`. The package name is yours—**`blockiya-core` is the recommended name**—what binds is the single public barrel and the utilities themselves.
2. **No `useState` for async lifecycle:** Never manually track `[isLoading, setIsLoading]` and `[error, setError]` pairs. `useIntent` manages this lifecycle automatically.
3. **No inline derivations:** Avoid computing `{ fullName: `${user.first} ${user.last}` }` directly inside JSX. Derivations must live in named functions executed via `useDerive`.
4. **Declarative structural rendering:** Discard brittle `{condition && <Component />}` patterns in favor of explicit structural components (in template-driven stacks like Vue or Svelte, the template's own `v-if`/`{#if}` satisfies this rule—the requirement is visible rendering shape, not JSX ceremony).

---

## 7. State Complexity Decision Matrix

Where should state live? Follow this definitive decision hierarchy:

| State Type | Characteristics | Where It Lives | Recommended Mechanism |
|---|---|---|---|
| **Local UI State** | Transient, single-component (input focus, hover) | Leaf component | `useState` inside the component |
| **Form Draft State** | Editable copy of domain data during session | Blockiya | `useState` in Blockiya, passed via controlled props |
| **Server State** | Remote data, requires caching and invalidation | Query layer | Server-state hook (e.g., TanStack Query, SWR, or a hand-rolled composable) in `queries/` |
| **Shared Feature State**| Required by multiple blocks in one feature | Feature Root | `Context Object` provided by feature Blockiya |
| **Global App State** | Cross-cutting, persists across route changes | Global Store | Global store (e.g., Zustand, Pinia, NgRx) outside `features/` |
| **URL State** | Filters, active tabs, search pagination | Router | URL search parameters (`useSearchParams`) |

### The Three Questions

When deciding where a new piece of state belongs, ask these questions in exact order:
1. *Does any other component need to know about this?* If **No** → keep it in local `useState`.
2. *Does this state originate from or synchronize with a backend?* If **Yes** → place it in a query hook inside `queries/`.
3. *Do multiple independent features across the application require this?* If **Yes** → place it in a global store.

If none of the above apply, scope it to a **Feature Context** provided by the nearest parent Blockiya.

---

## 8. Blockiya Beyond React

Because the rules concern **ownership** (who holds state), **direction** (derived props down, intents up), and **isolation** (adapters absorb third-party complexity), they survive every translation. The table below maps each role onto common stacks—the "e.g." column choices are illustrative, not mandated:

| Blockiya role | React (canonical) | Vue (e.g.) | Svelte (e.g.) | Solid (e.g.) | MAUI / Blazor C# (e.g.) |
|---|---|---|---|---|---|
| Blockiya (orchestrator) | Component + hooks | Container + composables | Component `<script>` / runes | Component + signals | ViewModel or orchestrating control |
| Presentational child | Stateless component | Presentational component | Snippet / component | Presentational component | `DataTemplate` / dumb view |
| Primitives (tokens only) | Emotion + styled-system | Token-prop components | Classless components | Styled props | XAML implicit styles + token resources |
| Derived props (`useDerive`) | Hook + module-scope deriver | `computed()` | derived rune | derived signal | `IValueConverter` / property mapping |
| Editable draft (`useDerivedState`) | Hook | `ref` watching source | writable derived rune | signal + effect | ViewModel field re-seeded on source change |
| Intent lifecycle (`useIntent`) | Hook | Composable with `busy`/`error` refs | Store or rune group | Signal set | Command with `IsRunning` / async state |
| Structural `If`/`For`/`Maybe` | Utility components | `v-if` / `v-for` | `{#if}` / `{#each}` | `<Show>` / `<For>` | `DataTrigger` / collection binding |
| Page (post-intent decisions) | Route component | Router view | Route component | Route component | Shell / page code-behind handling events |

The intent contract survives every row of that table: in MAUI, the ViewModel raises its `SaveIntent` event and **stops**—navigation, confirmation dialogs, and toasts belong to the page, exactly as in React.

> [!TIP]
> **Vue is the closest natural fit.** Vue already encourages modular files—one concern per file, composables for stateful logic—which maps one-to-one onto the Blockiya folder shape (`index` orchestrator, `queries`-style composables, `children` views). The pattern adds rules to Vue's own preferences, not structure.

**What does not port automatically:** concrete utility packages (like the canonical `blockiya-core` code) and static-analysis tooling are stack-specific. In another framework, re-express the concepts natively—the contract is the pattern, the code is its expression. The [cross-framework chapter](./cross-framework.md) implements the same `UserProfileBlock` end-to-end in Vue and .NET MAUI to prove it.

---

## 9. Deep-Dive Topics in This Series

Explore the full specification across the companion chapters of this guide:

- [**UML Notation System**](./uml-notation.md) — The formal visual vocabulary, symbols, visibility markers, and Mermaid class diagram conventions.
- [**Strict Blockiya & the Utilities Package**](./implementation.md) — The reference implementation of the `<<Utility>>` slot: `useIntent`, `useDerive`, `<If>`, `<Maybe>`, `<For>`, and `<Compose>`, plus why the package name is a recommendation.
- [**Code Examples & Case Studies**](./examples.md) — A fully compliant React `UserProfileBlock`: queries layer, controlled children, Adapter wrappers, intent lifecycle sequence.
- [**Blockiya Across Frameworks**](./cross-framework.md) — The same `UserProfileBlock` built end-to-end in Vue 3 composables and .NET MAUI C#, with a cross-framework invariants checklist.

