---
title: "The Blockiya Pattern: Strict Component Architecture for Frontend Orchestration"
description: "A comprehensive guide to the Blockiya Pattern—an architectural standard that treats React components as disciplined building blocks with zero styling, derived props, and upward-firing intents."
date: 2026-11-24
category: "Software Architecture"
tags: ["react", "frontend", "software-architecture", "clean-code", "design-systems", "typescript"]
thumbnail: ./_assets/cover.jpg
order: 1
lang: en
---

> **Key Takeaways**
> - **The Architect Mental Model:** A Blockiya is an orchestrator. It owns domain state, coordinates data queries, derives props before passing them down, and translates user actions into intents fired upward. It never writes CSS or reaches into third-party library internals.
> - **Zero Styling Rule:** Blockiyas write zero CSS—no `className`, no `style` attributes, no utility strings. All visual presentation is delegated strictly to design system primitives.
> - **Unidirectional Strict Contract:** Every tier in the stack only communicates with the layer immediately beneath it, while events and intentions flow strictly upward to the caller.
> - **Strict Blockiya (v2.1):** Enforces mechanical consistency with `blockiya-core` utilities—replacing fragile inline `isLoading`/`error` flags with `useIntent`, inline selectors with `useDerive`, and messy ternaries with `<If>`, `<Maybe>`, and `<For>`.

---

## 1. What is Blockiya?

A **Blockiya** is an orchestrator. It owns domain state, talks to data sources through hooks, derives props before passing them down, and translates user interactions into clean intents that fire upward. 

It never writes CSS. It never touches inline styles. It never reaches into a third-party library's internals. And it never decides what happens after an intent is fired—what happens next is always the caller's concern.

The name originates from the Arabic word for "block" (**بلوكية**) — a deliberate structural building unit characterized by an immutable shape, clear boundaries, and a known interface. Much like a stone block in classic architecture, it can be picked up, relocated, and set into a completely different context without altering its internal logic.

The mental model is that of an **architect, not a craftsman**. An architect does not mold bricks, nor do they lay mortar. An architect determines what the building requires and assembles the right materials in the right positions. Everything else is delegated.

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
| **Utilities (`blockiya-core`)** | Pattern-native structural helpers | Provide structural rendering (`If`, `For`) and intent handling (`useIntent`) |

---

## 4. Stereotypes: The Shared Vocabulary

Stereotypes classify components by architectural role. They appear in technical design documents, architectural diagrams, and code comments as `<<Stereotype>>`. While not compiler-enforced, they make architectural intent visible at a glance.

| Stereotype | Meaning | When to Use | Example |
|---|---|---|---|
| `<<Page>>` | Top-level route component | Next.js / Astro / React Router pages | `BillingOverviewPage` |
| `<<Feature>>` | Large workflow orchestrator | Multi-step wizards, complex flows | `CheckoutWizardBlock` |
| `<<Compound>>` | Multi-component Blockiya | Combines 2 to 5 child blocks | `BillingOverviewBlock` |
| `<<Atomic>>` | Single-purpose Blockiya | Focused, leaf-level orchestrator | `UsageChartsBlock` |
| `<<Primitive>>` | Non-behavioral design component | Visual design tokens, zero interaction logic | `Button`, `VStack`, `Text`, `Box` |
| `<<Behavioral>>` | Behavioral design component | Owns internal interaction state (`isOpen`, focus) | `Dropdown`, `Modal`, `Tooltip` |
| `<<Context>>` | Context provider | Deep prop sharing across descendants | `ProjectContext` |
| `<<Hook/Query>>` | Data fetching hook | External server state access | `useBillingUsage`, `useProjects` |
| `<<Adapter>>` | Third-party library wrapper | Isolates external tools, maps tokens/events | `CodeEditorAdapter`, `TerminalAdapter` |
| `<<Utility>>` | Pattern-native structural helper | Structural mechanics (`useIntent`, `If`, `useDerive`) | `If`, `For`, `useIntent` |

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

## 6. Strict Blockiya — v2.1

Strict Blockiya is the disciplined, opinionated variant of the pattern. Much like how the Repository Pattern provides strict vs. loose implementations, Strict Blockiya introduces mechanical constraints that eliminate developer discretion:

1. **`blockiya-core` utilities are required:** Every async operation runs through `useIntent`. Every derivation runs through `useDerive`. Conditional and list rendering uses `<If>`, `<Maybe>`, and `<For>`.
2. **No `useState` for async lifecycle:** Never manually track `[isLoading, setIsLoading]` and `[error, setError]` pairs. `useIntent` manages this lifecycle automatically.
3. **No inline derivations:** Avoid computing `{ fullName: `${user.first} ${user.last}` }` directly inside JSX. Derivations must live in named functions executed via `useDerive`.
4. **Declarative structural rendering:** Discard brittle `{condition && <Component />}` patterns in favor of explicit structural components.

---

## 7. State Complexity Decision Matrix

Where should state live? Follow this definitive decision hierarchy:

| State Type | Characteristics | Where It Lives | Recommended Mechanism |
|---|---|---|---|
| **Local UI State** | Transient, single-component (input focus, hover) | Leaf component | `useState` inside the component |
| **Form Draft State** | Editable copy of domain data during session | Blockiya | `useState` in Blockiya, passed via controlled props |
| **Server State** | Remote data, requires caching and invalidation | Query layer | TanStack Query / SWR hook in `queries/` |
| **Shared Feature State**| Required by multiple blocks in one feature | Feature Root | `Context Object` provided by feature Blockiya |
| **Global App State** | Cross-cutting, persists across route changes | Global Store | Zustand / Pinia outside `features/` |
| **URL State** | Filters, active tabs, search pagination | Router | URL search parameters (`useSearchParams`) |

### The Three Questions

When deciding where a new piece of state belongs, ask these questions in exact order:
1. *Does any other component need to know about this?* If **No** → keep it in local `useState`.
2. *Does this state originate from or synchronize with a backend?* If **Yes** → place it in a query hook inside `queries/`.
3. *Do multiple independent features across the application require this?* If **Yes** → place it in a global store.

If none of the above apply, scope it to a **Feature Context** provided by the nearest parent Blockiya.

---

## 8. Deep-Dive Topics in This Series

Explore the full specification across the companion chapters of this guide:

- [**UML Notation System**](./uml-notation.md) — The formal visual vocabulary, symbols, visibility markers, and Mermaid class diagram conventions.
- [**Core Implementation & Utilities**](./implementation.md) — The complete `blockiya-core` package, featuring `useIntent`, `useDerive`, `<If>`, `<Maybe>`, `<For>`, and `<Compose>`.
- [**Code Examples & Case Studies**](./examples.md) — Comprehensive real-world implementations including User Profile blocks, Adapters, and Compound Components.

