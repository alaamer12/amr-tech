---
title: "Strict Blockiya & the Utilities Package: The Mechanics of Frontend Discipline"
description: "Explore the reference implementation of the blockiya-core utilities package—the canonical occupant of the <<Utility>> interoperability slot—and how it automates async intent lifecycles, memoized derivations, and declarative rendering flow."
date: 2026-11-24
category: "Software Architecture"
tags: ["react", "frontend", "typescript", "architecture", "hooks"]
thumbnail: tree
order: 3
lang: en
---

> **Key Takeaways**
> - **The Slot, Not the Label:** The `<<Utility>>` stereotype is a compatibility standard—helpers that work alongside Blockiya machinery without contradiction or taking over control. `blockiya-core` is the recommended name for the package, not a requirement.
> - **Eliminate Ad-Hoc State:** `useIntent` replaces manually created `isLoading` and `error` state pairs with a standardized, type-safe async lifecycle.
> - **Mechanical Derivation:** `useDerive` guarantees that raw domain payloads are transformed into presentation-ready structures before being passed downward.
> - **Declarative Structural Flow:** Structural components (`<If>`, `<Maybe>`, `<For>`, `<Repeat>`, `<Compose>`) replace fragmented JavaScript ternaries with clean, readable JSX pipelines.

---

## 1. Introducing the Utilities Package

Introduced with **Strict Blockiya**, the utilities package is the `<<Utility>>` stereotype in practice: the canonical **compatibility standard** for helpers that work alongside Blockiya machinery. Its author's recommended name is `blockiya-core`—use it or pick your own; what the pattern binds is the single public barrel and the engagement contract:

> A helper qualifies as a `<<Utility>>` when it keeps working alongside Blockiya **without contradiction and without taking over control**: no domain knowledge, no visual output, and never steering state placement or intent flow. It contributes; it never orchestrates.

That is a Lego-brick test, not a category of code: anything that snaps in without changing how the machine runs belongs in the slot—and any package can occupy it. `blockiya-core` occupies it first, with the helpers every Blockiya reaches for.

Two families live inside under different rights. The intent utilities, derivation hooks, and structural renderers exist **because the pattern demands them** ("derive before you pass" → `useDerive`; "fire intents and stop" → `useIntent`). The interaction hooks (`useToggle`, `useDebounce`, `usePrevious`, `useStableCallback`) are generic mechanics **admitted by contract**—they qualify because they satisfy the interoperability clauses, which is exactly the opening that lets other compatible packages hold the same slot.

---

## 2. Directory Architecture

```
shared/
  blockiya-core/
    structural/
      If.tsx               # Truthy condition gate with fallback
      Maybe.tsx            # Non-null/undefined gate passing typed value down
      For.tsx              # Type-safe list rendering with required key
      Repeat.tsx           # Renders children N times (ideal for skeletons)
      Compose.tsx          # Provider composition without nesting pyramids
    intents/
      useIntent.ts         # Async lifecycle management hook
      createIntent.ts      # Typed intent definition factory
      composeIntents.ts    # Multi-handler fanout utility
    derivation/
      useDerive.ts         # Memoized derivation hook
      useDerivedState.ts   # Editable derived state hook
    hooks/
      useToggle.ts         # Boolean toggle mechanic
      useDebounce.ts       # Debounced value utility
      usePrevious.ts       # Previous render cache
      useStableCallback.ts # Stable callback reference
    index.ts               # Single public export surface
```

All consumer files must import strictly from the package root—never from internal subpaths (the barrel is what lets the internals move freely):

```tsx
import { If, For, useIntent, useDerive } from "@/shared/blockiya-core";
```

---

## 3. Structural Components

### `<If />` — Declarative Conditionals

Replaces brittle `{condition && <Element />}` expressions that risk rendering unintended `0` or `NaN` values:

```tsx
<If condition={isEditing} fallback={<ProfileView user={displayUser} />}>
  <ProfileEditForm draft={draft} />
</If>
```

### `<Maybe />` — Type-Safe Value Unwrapping

Renders child content only when the provided value is non-null and non-undefined, narrowing the type within the render prop:

```tsx
<Maybe value={user.avatarUrl} fallback={<AvatarPlaceholder />}>
  {(url) => <Avatar src={url} alt={user.fullName} />}
</Maybe>
```

### `<For />` — Key-Enforced Iteration

Enforces unique key resolution and built-in empty-state handling:

```tsx
<For
  each={invoices}
  keyExtractor={(inv) => inv.id}
  fallback={<Text variant="muted">No recent invoices.</Text>}
>
  {(invoice) => <InvoiceRow item={invoice} />}
</For>
```

### `<Compose />` — Flattening Provider Pyramids

Combines multiple React context providers into a single linear declaration:

```tsx
// Instead of 5 nested Provider tags:
<Compose pipes={[ThemeProvider, QueryProvider, AuthProvider]}>
  <DashboardFeature />
</Compose>
```

---

## 4. Intent Management: `useIntent`

In standard React codebases, every asynchronous action results in repetitive boilerplate:

```tsx
// ❌ Traditional Boilerplate: Repeated in every component
const [isSaving, setIsSaving] = useState(false);
const [error, setError] = useState<Error | null>(null);

const handleSave = async () => {
  setIsSaving(true);
  setError(null);
  try {
    await saveUser(draft);
  } catch (err) {
    setError(err as Error);
  } finally {
    setIsSaving(false);
  }
};
```

`useIntent` encapsulates this entire lifecycle into a unified, type-safe hook. Its result object owns the lifecycle: `fire` (stable identity, no `useCallback` needed by the caller), `isLoading`, `error`, and `reset`:

```tsx
// ✅ Strict Blockiya: Managed via useIntent
const save = useIntent(async () => {
  const saved = await saveUser(draft);
  onSaveIntent(saved); // Fires upward to caller
});

// In JSX:
<Button onClick={() => save.fire()} disabled={save.isLoading}>
  {save.isLoading ? "Saving…" : "Save"}
</Button>
<If condition={save.error}>
  {(err) => <Text variant="danger">{err.message}</Text>}
</If>
```

---

## 5. Pure Derivations: `useDerive`

The Blockiya pattern mandates: **derive before you pass**. Raw database or API structures should never penetrate presentational layers.

```tsx
// Standalone pure selector function — named derive*, defined at module scope
function deriveDisplayUser(user: User): DisplayUser {
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    roleBadge: user.role === "admin" ? "Administrator" : "Member",
    isDeactivated: user.status === "inactive",
  };
}

// Inside the Blockiya:
const displayUser = useDerive(user, deriveDisplayUser);
```

By decoupling derivation from the component body, `deriveDisplayUser` can be unit-tested as a pure function with zero mocks. The `useDerive` hook keeps the deriver out of the dependency business by contract: it must be a stable, module-scope function—never inline.

---

## 6. Not Just React

Everything here is the React/TypeScript expression of the pattern. Vue ports `useIntent`/`useDerivedState` to plain composables with `ref`/`watch`, Svelte to runes or stores, and MAUI/Blazor C# maps the same lifecycle onto commands with `IsRunning`—the contracts survive, the syntax changes. See the [cross-framework chapter](./cross-framework.md) for complete working ports.

