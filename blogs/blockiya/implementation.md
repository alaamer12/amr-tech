---
title: "Strict Blockiya & blockiya-core: The Mechanics of Frontend Discipline"
description: "Explore the reference implementation of blockiya-core—a zero-dependency structural utility package that automates async intent lifecycles, memoized derivations, and declarative JSX flow."
date: 2026-11-24
category: "Software Architecture"
tags: ["react", "frontend", "typescript", "architecture", "hooks"]
thumbnail: tree
order: 3
lang: en
---

> **Key Takeaways**
> - **Eliminate Ad-Hoc State:** `useIntent` replaces manually created `isLoading` and `error` state pairs with a standardized, type-safe async lifecycle.
> - **Mechanical Derivation:** `useDerive` guarantees that raw domain payloads are transformed into presentation-ready structures before being passed downward.
> - **Declarative Structural Flow:** Structural components (`<If>`, `<Maybe>`, `<For>`, `<Repeat>`, `<Compose>`) replace fragmented JavaScript ternaries with clean, readable JSX pipelines.

---

## 1. Introducing `blockiya-core`

Introduced in **v2.1 (Strict Blockiya)**, `blockiya-core` belongs to the `<<Utility>>` stereotype. It fills a crucial void in modern frontend codebases: **pattern-native structural helpers** that belong neither to domain business logic nor to visual design systems.

The test for utility membership is **removal**:
> *If you stripped away every single domain word and business concept from your codebase, would this helper still make complete sense?*

If yes, it belongs in `blockiya-core`.

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

All consumer files must import strictly from the package root:

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
  keyBy={(inv) => inv.id}
  empty={<Text variant="muted">No recent invoices.</Text>}
>
  {(invoice) => <InvoiceRow item={invoice} />}
</For>
```

### `<Compose />` — Flattening Provider Pyramids

Combines multiple React context providers into a single linear declaration:

```tsx
// Instead of 5 nested Provider tags:
<Compose
  providers={[
    [ThemeProvider, { theme }],
    [ProjectContext.Provider, { value: projectState }],
    [ToastProvider, {}],
  ]}
>
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

`useIntent` encapsulates this entire lifecycle into a unified, type-safe hook:

```tsx
// ✅ Strict Blockiya: Managed via useIntent
const {
  execute: handleSave,
  isLoading: isSaving,
  error: saveError,
} = useIntent(async () => {
  const saved = await saveUser(draft);
  onSaveIntent(saved); // Fires upward to caller
});
```

---

## 5. Pure Derivations: `useDerive`

The Blockiya pattern mandates: **derive before you pass**. Raw database or API structures should never penetrate presentational layers.

```tsx
// Standalone pure selector function
function selectDisplayUser(user: User): DisplayUser {
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    roleBadge: user.role === "admin" ? "Administrator" : "Member",
    isDeactivated: user.status === "inactive",
  };
}

// Inside the Blockiya:
const displayUser = useDerive(user, selectDisplayUser);
```

By decoupling derivation from the component body, `selectDisplayUser` can be unit-tested as a pure function with zero mocks.

