---
title: "Blockiya Across Frameworks: The Same Pattern in Vue and .NET MAUI"
description: "The identical UserProfileBlock scenario built layer-for-layer in React/TypeScript, Vue 3 composables, and MAUI C# MVVM—proving the Blockiya Pattern lives in the roles and rules, not in any framework's syntax."
date: 2026-11-24
category: "Software Architecture"
tags: ["vue", "maui", "csharp", "typescript", "frontend", "architecture", "mvvm"]
thumbnail: tree
order: 5
lang: en
---

> **Key Takeaways**
> - **Same Scenario, Three Stacks:** The `UserProfileBlock` from [the examples chapter](./examples.md) is rebuilt file-for-file in Vue and MAUI—fetch-through-data-layer, derived view types, intent lifecycle ownership, compound encapsulation, fire-and-stop page wiring all preserved.
> - **Roles Port, Syntax Varies:** Hooks become composables, callback props become emits, context providers become `provide/inject`, components become ViewModels with events—and nothing in the contract changes.
> - **The Invariants Checklist:** Eight framework-independent assertions that decide whether a port is still Blockiya—or has quietly become something else.

---

## 1. Why This Chapter Exists

The Blockiya Pattern was inspired, tested, and produced in React project experiments, which is why the reference implementation of [the series](./index.md) is React/TypeScript. But the rules concern **ownership** (who holds state), **direction** (derived props down, intents up), and **isolation** (adapters absorb third-party complexity). None of those mention a framework.

MVVM proved the same kind of portability decades ago—XAML, WinUI, Avalonia, Android, and web frameworks all run "the same idea with different code." Blockiya behaves the same way. The mapping:

| Blockiya role | React (canonical) | Vue | Svelte | Solid | MAUI / Blazor C# |
|---|---|---|---|---|---|
| Blockiya (orchestrator) | Component + hooks | Container + composables | Component `<script>` / runes | Component + signals | ViewModel (+ orchestrating view) |
| Presentational child | Stateless component | Component reading props | Snippet / component | Presentational component | `DataTemplate` / dumb view |
| Derived props | `useDerive` + module-scope deriver | `computed()` | derived rune | derived signal | converter / property mapping |
| Editable draft | `useDerivedState` | `ref` + `watch` | writable derived rune | signal + effect | field re-seeded on source change |
| Intent lifecycle | `useIntent` | composable with `busy`/`error` refs | store / rune group | signal set | command with `IsRunning` |
| Structural rendering | `<If>`, `<For>`, `<Maybe>` | `v-if` / `v-for` | `{#if}` / `{#each}` | `<Show>` / `<For>` | `IsVisible` bindings / triggers |
| Page (post-intent UX) | Route component | router view | route component | route component | page code-behind / shell |

Below, two full ports. Each shows primitives → behavioral primitive → adapter → dumb views → Blockiya → page, exactly like the React original.

---

## 2. Vue 3 — Composables

Vue is the closest natural fit, and not by coincidence: Vue's culture already encourages modular files—one concern per file, composables for stateful logic. That *is* the Blockiya folder shape. The pattern adds rules, not structure.

### Primitives and the data layer

Styles live **inside** primitives (scoped styles there are legitimate—it's the Blockiya that stays clean):

```vue
<!-- shared/ui/Flex.vue -->
<script setup lang="ts">
const props = defineProps<{ gap?: "xs" | "sm" | "md" | "lg"; dir?: "row" | "col" }>()
</script>
<template>
  <div class="flex" :data-gap="props.gap" :data-dir="props.dir"><slot /></div>
</template>
<style scoped>
.flex { display: flex; }
.flex[data-gap="md"] { gap: var(--space-md); }   /* token scale, enforced here */
</style>
```

```ts
// features/users/composables/useUser.ts — the queries/ equivalent
export function useUser(id: Ref<number>) {
  const data = ref<User | null>(null)
  const isPending = ref(true), isError = ref(false)
  watch(id, async (uid) => {
    isPending.value = true
    try { data.value = await api.get<User>(`/users/${uid}`) }
    finally { isPending.value = false; isError.value = data.value === null }
  }, { immediate: true })
  return { data, isPending, isError }
}
```

Strict utilities re-expressed as composables—same contracts, native mechanism:

```ts
// shared/blockiya-core/intents/useIntent.ts — same contract as the React hook
export function useIntent<A extends unknown[]>(handler: (...args: A) => Promise<void>) {
  const isLoading = ref(false), error = ref<Error | null>(null)
  async function fire(...args: A) {
    isLoading.value = true; error.value = null
    try { await handler(...args) }
    catch (e) { error.value = e instanceof Error ? e : new Error(String(e)) }
    finally { isLoading.value = false }
  }
  return { fire, isLoading, error, reset: () => { isLoading.value = false; error.value = null } }
}

// shared/blockiya-core/derivation/useDerivedState.ts — the auto-reset is a watch, not a cache
export function useDerivedState<S, T>(source: Ref<S>, transform: (s: S) => T) {
  const state = ref(transform(source.value)) as Ref<T>
  watch(source, (s) => { state.value = transform(s) })
  return [state, (v: T) => (state.value = v)] as const
}
```

> [!NOTE]
> Where React needed `useDerivedState` to hand-roll ref-comparison effect logic, Vue's `watch` gives the same guarantee for free. The *contract*—"an editable draft that reseeds when the server source changes"—is identical; the mechanism is native. That is what a port means.

### Behavioral primitive — `isOpen` stays invisible

The compound rule holds: a hook-shaped dropdown would leak `isOpen` into the consumer; the compound one makes leakage structurally impossible.

```vue
<!-- shared/ui/behavioral/Dropdown.vue (root excerpt) -->
<script setup lang="ts">
import { provide, ref } from "vue"
import { DROPDOWN_KEY } from "./dropdownKeys"
const isOpen = ref(false)                      // ← never leaves this component
provide(DROPDOWN_KEY, { isOpen, close: () => (isOpen.value = false) })
</script>
<template>
  <div v-click-outside="() => (isOpen.value = false)">
    <slot name="trigger" />
    <slot v-if="isOpen" />
  </div>
</template>
```

### Dumb views — emits are the intents

```vue
<!-- children/ProfileDisplayView.vue -->
<script setup lang="ts">
const emit = defineEmits<{ editIntent: []; deleteIntent: [] }>()
defineProps<{ user: DisplayUser }>()           // derived type — raw User unknown here
</script>
<template>
  <Flex dir="col" gap="md">
    <Text as="h2">{{ user.fullName }}</Text>
    <Text tone="muted">{{ user.email }}</Text>
    <Text>{{ user.roleBadge }}</Text>
    <Dropdown>
      <template #trigger><Button>Actions</Button></template>
      <DropdownItem :onSelect="() => emit('editIntent')">Edit profile</DropdownItem>
      <DropdownItem :onSelect="() => emit('deleteIntent')">Delete account</DropdownItem>
    </Dropdown>
  </Flex>
</template>
```

### The Blockiya

```vue
<!-- features/users/blockiyas/UserProfileBlock/index.vue -->
<script setup lang="ts">
import { useUser } from "../../composables/useUser"
import { useIntent, useDerivedState } from "@/shared/blockiya-core"
import { deriveDisplayUser } from "../../entities/user"

const props = defineProps<{ userId: number }>()
const emit = defineEmits<{ saveIntent: [user: User]; deleteIntent: [id: number] }>()

const { data: user, isPending, isError } = useUser(toRef(props, "userId"))
const [draft, setDraft] = useDerivedState(user, (u) => (u ? { ...u } : null))
const isEditing = computed(() => draft.value !== null)

const saveIntent = useIntent(async () => {
  if (!draft.value) return
  const saved = await api.put<User>(`/users/${draft.value.id}`, draft.value)
  setDraft(null)                       // exits edit mode; source change reseeds display
  emit("saveIntent", saved)            // fire upward — and stop
})

const onDraftChange = (field: keyof User, value: string) =>
  setDraft(draft.value && { ...draft.value, [field]: value })
</script>

<template>
  <Text v-if="isPending" tone="muted">Loading…</Text>
  <Text v-else-if="isError" tone="danger">Could not load user.</Text>
  <ProfileEditForm v-else-if="isEditing && draft" :contract="{ draft, onDraftChange,
    isSaving: saveIntent.isLoading, onSaveIntent: saveIntent.fire,
    onCancelIntent: () => setDraft(null) }" />
  <ProfileDisplayView v-else-if="user" :user="deriveDisplayUser(user)"
    @edit-intent="setDraft({ ...user })" @delete-intent="emit('deleteIntent', props.userId)" />
</template>
```

`v-if`/`v-else` in the template satisfy the structural-rendering rule outright—the requirement is a visible rendering shape, and Vue templates already have one. Inside a render function or JSX you'd reach for the `<If>` equivalents.

### The page

```vue
<!-- routes/user.page.vue — post-intent decisions belong here -->
<script setup lang="ts">
const pendingDelete = ref<number | null>(null)
const confirmDelete = async () => {
  await api.deleteUser(pendingDelete.value); pendingDelete.value = null
  router.push("/users")                       // navigation: the page's call, never the block's
}
</script>
<template>
  <UserProfileBlock :user-id="Number(route.params.id)"
    @save-intent="toast.push('Profile saved')"
    @delete-intent="pendingDelete = $event" />
  <ConfirmDialog :open="pendingDelete !== null" @confirm="confirmDelete"
    @cancel="pendingDelete = null" />
</template>
```

---

## 3. .NET MAUI — MVVM, the Pattern's Natural Habitat

This port is the strongest argument that Blockiya is not a web-framework fad. MAUI **practically implements the pattern by construction**: a ViewModel cannot contain CSS (zero styling, structurally), `ICommand` and events already look like intents, and the page already owns navigation. What Blockiya adds on top is the discipline MVVM alone never demanded: derive records before binding them, keep interaction state inside behavioral controls, isolate plugins behind adapters, and watch the 3–7 ceiling on public surfaces.

### Tokens, primitives, data contracts

```xml
<!-- Resources/tokens.xaml -->
<ResourceDictionary>
    <x:Double x:Key="SpaceMd">16</x:Double>
    <Style x:Key="LabelMuted" TargetType="Label">
        <Setter Property="TextColor" Value="{StaticResource TextMuted}" />
    </Style>
</ResourceDictionary>
```

```csharp
// Entities/User.cs — the derived-record contract: views bind DisplayUser, never User
public sealed record User(int Id, string Name, string Email, UserRole Role);
public enum UserRole { Admin, Editor, Viewer }
public sealed record DisplayUser(string FullName, string Email, string RoleBadge);

// Features/Users/Blockiyas/UserProfileBlock/UserProfileDeriver.cs — module-scope, stable
public static class UserProfileDeriver
{
    private static readonly Dictionary<UserRole, string> Badges = new()
    {
        [UserRole.Admin] = "Admin", [UserRole.Editor] = "Editor",
        [UserRole.Viewer] = "Viewer (read only)"
    };
    public static DisplayUser Derive(User u) => new(u.Name, u.Email, Badges[u.Role]);
}

// The queries layer: an injected service — no HTTP inside the ViewModel
public interface IUserRepository { Task<User> GetAsync(int id, CancellationToken ct); Task<User> SaveAsync(User u, CancellationToken ct); }
```

### Intent lifecycle — the ecosystem already ships `useIntent`

CommunityToolkit.Mvvm's `AsyncRelayCommand` gives the intent contract for free: `IsRunning` is `isLoading`, `CanExecute` gating is the disabled button. Where a named lifecycle owner is needed beyond commands, a small runner mirrors the canonical utility one-for-one:

```csharp
// Shared/BlockiyaCore/IntentRunner.cs — one owner for async lifecycle state
public sealed class IntentRunner : ObservableObject
{
    [ObservableProperty] private bool _isRunning;
    [ObservableProperty] private string? _lastError;

    public async Task Run(Func<CancellationToken, Task> handler, CancellationToken ct = default)
    {
        IsRunning = true; LastError = null;
        try { await handler(ct); }
        catch (Exception ex) { LastError = ex.Message; }
        finally { IsRunning = false; }
    }
}
```

### The Blockiya — `UserProfileViewModel`

```csharp
// Features/Users/Blockiyas/UserProfileBlock/UserProfileViewModel.cs
public partial class UserProfileViewModel : ObservableObject
{
    private readonly IUserRepository _repo;
    private User? _source;                       // server truth

    [ObservableProperty] private bool _isBusy = true;
    [ObservableProperty] private string? _loadError;
    [ObservableProperty] private User? _draft;   // editable, re-seeded on source change

    public IntentRunner SaveRunner { get; } = new();
    public bool IsEditing => Draft is not null;

    // Derive before you bind — the XAML view cannot see UserRole exists
    public DisplayUser? Display => _source is null ? null : UserProfileDeriver.Derive(_source);

    // Intents out: C# events. The ViewModel's job ends at raising them.
    public event Action<User>? SaveIntent;
    public event Action<int>? DeleteIntent;

    public UserProfileViewModel(IUserRepository repo) => _repo = repo;

    public async Task LoadAsync(int id, CancellationToken ct)
    {
        IsBusy = true; LoadError = null;
        try
        {
            _source = await _repo.GetAsync(id, ct);
            Draft = null;                                  // discard any stale edit draft
            OnPropertyChanged(nameof(Display));            // reseed downstream
        }
        catch (Exception ex) { LoadError = ex.Message; }
        finally { IsBusy = false; }
    }

    public void StartEdit() { Draft = _source with { }; }
    public void CancelEdit() { Draft = null; }

    [RelayCommand]
    private Task SaveAsync(CancellationToken ct) => SaveRunner.Run(async ct =>
    {
        if (Draft is null) return;
        var saved = await _repo.SaveAsync(Draft, ct);
        _source = saved; Draft = null;
        OnPropertyChanged(nameof(Display));
        SaveIntent?.Invoke(saved);               // fire upward — and stop
    }, ct);

    [RelayCommand]
    private void RequestDelete()
    {
        if (_source is not null) DeleteIntent?.Invoke(_source.Id);  // no confirm here — ever
    }
}
```

### The view and the page

The composing view references **token resources and styles only**—no literal colors or margins—and its code-behind stays empty, which is the tell that the split is honest:

```xml
<!-- Features/Users/Blockiyas/UserProfileBlock/UserProfileView.xaml (excerpt) -->
<VerticalStackLayout Spacing="{StaticResource SpaceMd}">
    <Label Text="Loading…" Style="{StaticResource LabelMuted}" IsVisible="{Binding IsBusy}" />
    <Label Text="{Binding LoadError}" Style="{StaticResource LabelDanger}"
           IsVisible="{Binding LoadError, Converter={StaticResource IsNotNull}}" />

    <VerticalStackLayout IsVisible="{Binding IsEditing, Converter={StaticResource Invert}}">
        <TextBlock Text="{Binding Display.FullName}" Tone="Heading" />
        <TextBlock Text="{Binding Display.RoleBadge}" Tone="Label" />
        <Button Text="Actions" Command="{Binding OpenActionsCommand}" />
    </VerticalStackLayout>

    <VerticalStackLayout IsVisible="{Binding IsEditing}">
        <!-- controlled inputs: TwoWay bindings to the draft, never to server truth -->
        <Entry Text="{Binding Draft.Name}" />
        <Entry Text="{Binding Draft.Email}" />
        <Button Text="Save" Command="{Binding SaveCommand}"
                IsRunning="{Binding SaveRunner.IsRunning}" />
        <Button Text="Cancel" Command="{Binding CancelEditCommand}" />
    </VerticalStackLayout>
</VerticalStackLayout>
```

```csharp
// Features/Users/UserPage.xaml.cs — the <<Page>>: post-intent UX lives here
public partial class UserPage : ContentPage
{
    private readonly UserProfileViewModel _vm;
    public UserPage(UserProfileViewModel vm)
    {
        _vm = vm; BindingContext = vm;
        _vm.SaveIntent += async _ => await this.ToastAsync("Profile saved");   // toast: page's call
        _vm.DeleteIntent += async id =>                                        // confirm: page's call
        {
            if (await DisplayAlert("Delete", "Delete this account?", "Yes", "No"))
            {
                await Repo.DeleteAsync(id);
                await Shell.Current.GoToAsync("..");                           // navigation: page's call
            }
        };
    }
}
```

> [!TIP]
> The MVVM analogy cuts both ways: MAUI gives Blockiya a native habitat, and Blockiya gives MVVM teams the rules MVVM never spelled out—derived records over raw-entity binding, intent events over repository calls inside ViewModels, and the adapter boundary between XAML and any NuGet widget.

---

## 4. The Cross-Framework Invariants Checklist

Whatever stack you port to, verify the same eight assertions hold. If a port breaks one, the port changed the pattern—fix the code, not the checklist:

1. The Blockiya talks to data **only** through its data layer (hook / composable / injected service)—never inline HTTP.
2. Children bind **derived** view types (`DisplayUser`), never the raw model.
3. Async lifecycle state (`busy` / `error`) has **one named owner** per intent—never hand-rolled per handler.
4. Dropdown/modal interaction state is **invisible** outside the behavioral primitive.
5. The Blockiya body **cannot name** any third-party library—only the adapter knows.
6. After save/delete the Blockiya **stops**; the page owns confirmations, toasts, navigation.
7. **3–7 props in, 3–7 intents out**—breaching the ceiling is a split signal.
8. No raw styling values in the Blockiya—visual output flows through primitives and token resources only.

---

## 5. Where This Leaves the Pattern

React remains the canonical reference because that is where the pattern was proven—but a pattern that only survives in the stack that produced it was never a pattern. The roles port. The rules port. The syntax is a detail, and details are the part you're allowed to change.
