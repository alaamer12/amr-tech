---
title: "Project Structure and Code Organization"
order: 3
---


> Translates `architecture.md`'s roles into an actual folder/file layout. Read `architecture.md` first — this document assumes its definitions and only adds placement conventions on top.

### 1. Purpose

The previous architecture defines a web interface as:

```
Page
└── View
    ├── Component
    ├── Decoration / Aligner
    └── UI Elements
```

This document translates that conceptual model into an actual software project structure.

The goal is not to create folders merely because the architecture contains certain terms.

The goal is to make the project structure reflect the way the UI is actually constructed.

The resulting project should make it easy to answer:

- Where does this Page live?
- What Views construct this Page?
- What Component provides the main functionality of this View?
- What Decorations support it?
- Which pieces are Aligners?
- Which pieces are primitive UI Elements?
- Where does the behavior/state belong?
- Which code is specific to a feature and which code is globally reusable?

---

## 2. The Main Project Model

A project can be organized around the following high-level structure:

```
src/
├── app/
│   ├── pages/
│   └── routes/
│
├── features/
│   ├── search/
│   ├── authentication/
│   ├── profile/
│   └── ...
│
├── ui/
│   ├── elements/
│   ├── decorations/
│   └── ...
│
├── shared/
│   ├── hooks/
│   ├── utils/
│   ├── services/
│   ├── types/
│   └── ...
│
└── ...
```

However, the important part is that **feature ownership and UI construction roles are separate concepts**.

For example:

```
features/
└── search/
    ├── pages/
    ├── views/
    ├── components/
    └── ...
```

A feature owns its domain-specific UI.

Global primitives can remain in:

```
ui/
├── elements/
├── decorations/
└── ...
```

This creates two dimensions:

```
                 PROJECT ORGANIZATION
                         │
          ┌──────────────┴──────────────┐
          ↓                             ↓
   DOMAIN OWNERSHIP              UI CONSTRUCTION ROLE
          │                             │
      Search                         View
      Profile                     Component
      Checkout                    Decoration
      Authentication              UI Element
```

---

## 3. Recommended Complete Structure

A larger application could look like this:

```
src/
│
├── app/
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── search.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   │
│   └── pages/
│       ├── HomePage/
│       ├── SearchPage/
│       ├── ProfilePage/
│       └── SettingsPage/
│
├── features/
│   │
│   ├── search/
│   │   ├── views/
│   │   │   ├── SearchView/
│   │   │   └── SearchResultsView/
│   │   │
│   │   ├── components/
│   │   │   ├── SearchInput/
│   │   │   └── SearchResult/
│   │   │
│   │   ├── decorations/
│   │   │   ├── SearchDescription/
│   │   │   └── CommonKeywords/
│   │   │
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── authentication/
│   │   ├── views/
│   │   ├── components/
│   │   ├── decorations/
│   │   ├── hooks/
│   │   └── services/
│   │
│   └── profile/
│       ├── views/
│       ├── components/
│       ├── decorations/
│       ├── hooks/
│       └── services/
│
├── ui/
│   │
│   ├── elements/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Text/
│   │   ├── Icon/
│   │   ├── Chip/
│   │   ├── Avatar/
│   │   └── ...
│   │
│   ├── decorations/
│   │   ├── Divider/
│   │   ├── Label/
│   │   ├── Hint/
│   │   └── ...
│   │
│   └── layout/
│       ├── Stack/
│       ├── Row/
│       ├── Column/
│       └── ...
│
├── shared/
│   ├── hooks/
│   ├── utils/
│   ├── services/
│   ├── types/
│   ├── constants/
│   └── config/
│
└── ...
```

This is a **scalable structure**, not a requirement that every project must have every folder.

A small project can use a much smaller version.

---

## 4. Page Structure

A Page should primarily compose Views.

For example:

```
SearchPage/
├── SearchPage.tsx
└── index.ts
```

The implementation should remain simple:

```tsx
import { SearchView } from "@/features/search/views/SearchView";
import { SearchResultsView } from "@/features/search/views/SearchResultsView";

export function SearchPage() {
    return (
        <>
            <SearchView />
            <SearchResultsView />
        </>
    );
}
```

Notice what the Page does **not** contain.

It does not directly construct:

```tsx
<Input />
<Button />
<Icon />
<Text />
<Chip />
```

Instead, it composes meaningful Views.

Conceptually:

```
SearchPage
├── SearchView
└── SearchResultsView
```

The Page therefore remains easy to understand.

---

## 5. View Structure

A View represents a meaningful section.

For example:

```
SearchView/
├── SearchView.tsx
└── index.ts
```

The implementation could be:

```tsx
import { SearchInput } from "../../components/SearchInput";
import { SearchDescription } from "../../decorations/SearchDescription";
import { CommonKeywords } from "../../decorations/CommonKeywords";

export function SearchView() {
    return (
        <section>
            <SearchDescription />

            <SearchInput />

            <CommonKeywords />
        </section>
    );
}
```

This is the important distinction:

```
SearchView
│
├── SearchDescription
│      └── Decoration
│
├── SearchInput
│      └── Component
│
└── CommonKeywords
       └── Decoration
```

The code communicates the architectural structure directly.

---

## 6. Component Structure

A Component contains meaningful functionality.

For example:

```
SearchInput/
├── SearchInput.tsx
├── SearchInput.types.ts
├── SearchInput.test.tsx
└── index.ts
```

Its implementation could be:

```tsx
import { Input } from "@/ui/elements/Input";
import { Icon } from "@/ui/elements/Icon";
import { Button } from "@/ui/elements/Button";

export function SearchInput() {
    return (
        <div className="search-input">
            <Icon name="search" />

            <Input
                placeholder="Search..."
            />

            <Button
                aria-label="Clear search"
            >
                <Icon name="close" />
            </Button>
        </div>
    );
}
```

Architecturally:

```
SearchInput
└── Component
    │
    ├── Icon
    │   └── UI Element / Leading Aligner
    │
    ├── Input
    │   └── UI Element
    │
    └── Button
        └── UI Element / Trailing Aligner
```

The important point is that the `SearchInput` is not merely another generic component.

It represents the meaningful functionality:

> **Searching.**
> 

---

## 7. Decorations

A Decoration can have its own implementation.

For example:

```
SearchDescription/
├── SearchDescription.tsx
└── index.ts
```

```tsx
import { Text } from "@/ui/elements/Text";

export function SearchDescription() {
    return (
        <Text>
            Search for users, posts, or topics.
        </Text>
    );
}
```

Its architectural role is:

```
SearchDescription
└── Decoration
    └── Text
        └── UI Element
```

The fact that `SearchDescription` is implemented as a React component does not turn it into an architectural Component.

It remains a Decoration because that is its role.

---

## 8. Aligners in Code

Aligners do not necessarily need a dedicated folder.

Because:

```
Aligner ⊂ Decoration
```

an Aligner can simply live wherever the surrounding Decoration belongs.

For example:

```
SearchInput/
├── SearchInput.tsx
├── SearchIcon.tsx
└── ClearButton.tsx
```

Conceptually:

```
SearchInput
├── SearchIcon
│   └── Leading Aligner
│
├── Input
│   └── Main UI Element
│
└── ClearButton
    └── Trailing Aligner
```

The implementation might be:

```tsx
export function SearchInput() {
    return (
        <div className="relative">
            <SearchIcon />

            <Input />

            <ClearButton />
        </div>
    );
}
```

The positioning is an implementation detail.

The architectural meaning is:

```
SearchIcon  → supporting Decoration
             → specifically a Leading Aligner

ClearButton → supporting functional Decoration/element
             → specifically a Trailing Aligner
```

An Aligner does not need to be a special React abstraction.

It is a **role**.

---

## 9. UI Element Structure

UI Elements are the primitive building blocks.

For example:

```
ui/
└── elements/
    ├── Button/
    │   ├── Button.tsx
    │   ├── Button.types.ts
    │   └── index.ts
    │
    ├── Input/
    │   ├── Input.tsx
    │   ├── Input.types.ts
    │   └── index.ts
    │
    ├── Text/
    │   ├── Text.tsx
    │   └── index.ts
    │
    └── Icon/
        ├── Icon.tsx
        └── index.ts
```

For example:

```tsx
export interface InputProps {
    value?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
}

export function Input({
    value,
    placeholder,
    onChange,
}: InputProps) {
    return (
        <input
            value={value}
            placeholder={placeholder}
            onChange={(event) => {
                onChange?.(event.target.value);
            }}
        />
    );
}
```

This is a primitive.

It does not know that it is being used for:

```
Search
Login
Registration
Profile editing
Checkout
```

That responsibility belongs to higher-level Components.

> **Note — placement refinement:** the `ui/elements/` layout shown above is refined by a later document in this set, [`../extensions/specialised-component.md`](../extensions/specialised-component.md) (Acknowledgment section), which splits this one folder into two tiers — `ui/base/` (the raw framework primitive, re-exported under this system's own name, kept to one line) and `ui/adaptive/` (that same primitive plus the design system's styling, variants, and states). A Component still imports from the adaptive tier only, never from base or the framework directly. See that document for the full folder layout and import-direction rule.

---

## 10. Primitive Versus Purposeful Component

This distinction is fundamental.

Consider:

```tsx
<Input />
```

It is generic.

Therefore:

```
Input
→ UI Element
```

Now consider:

```tsx
<SearchInput />
```

It represents a specific user purpose.

Therefore:

```
SearchInput
→ Component
```

And internally:

```tsx
<SearchInput>
    <Input />
</SearchInput>
```

So:

```
Component
└── UI Element
```

This creates a clean abstraction boundary.

---

## 11. A More Realistic Search Feature

The complete feature could therefore look like:

```
features/
└── search/
    │
    ├── views/
    │   ├── SearchView/
    │   │   ├── SearchView.tsx
    │   │   └── index.ts
    │   │
    │   └── SearchResultsView/
    │       ├── SearchResultsView.tsx
    │       └── index.ts
    │
    ├── components/
    │   ├── SearchInput/
    │   │   ├── SearchInput.tsx
    │   │   ├── SearchInput.types.ts
    │   │   └── index.ts
    │   │
    │   └── SearchResult/
    │       ├── SearchResult.tsx
    │       └── index.ts
    │
    ├── decorations/
    │   ├── SearchDescription/
    │   │   ├── SearchDescription.tsx
    │   │   └── index.ts
    │   │
    │   └── CommonKeywords/
    │       ├── CommonKeywords.tsx
    │       └── index.ts
    │
    ├── hooks/
    │   └── useSearch.ts
    │
    ├── services/
    │   └── search.service.ts
    │
    └── types/
        └── search.types.ts
```

This gives the feature a clear internal architecture.

---

## 12. Complete Search Composition

The resulting composition becomes:

```
SearchPage
│
├── SearchView
│   │
│   ├── SearchDescription
│   │   └── Decoration
│   │
│   ├── SearchInput
│   │   └── Component
│   │       ├── SearchIcon
│   │       ├── Input
│   │       └── ClearButton
│   │
│   └── CommonKeywords
│       └── Decoration
│           └── Chip[]
│
└── SearchResultsView
    │
    └── SearchResult[]
        └── Component
```

The Page, Views, Components, Decorations, and UI Elements all have different responsibilities.

---

## 13. State and Business Logic

The architecture should not force state and business logic into the UI hierarchy.

For example:

```
SearchInput
```

should primarily represent the search interaction.

The search logic can live in a hook:

```
features/search/
└── hooks/
    └── useSearch.ts
```

```tsx
export function useSearch() {
    const [query, setQuery] = useState("");

    function search() {
        // Search logic
    }

    function clear() {
        setQuery("");
    }

    return {
        query,
        setQuery,
        search,
        clear,
    };
}
```

The Component can then consume it:

```tsx
export function SearchInput() {
    const {
        query,
        setQuery,
        search,
        clear,
    } = useSearch();

    return (
        <div>
            <Input
                value={query}
                onChange={setQuery}
            />

            <Button onClick={search}>
                Search
            </Button>

            <Button onClick={clear}>
                Clear
            </Button>
        </div>
    );
}
```

Therefore:

```
Component
    ↓
Hook
    ↓
Service / State / Data
```

The role-based UI architecture does not replace normal software architecture.

It defines the **UI composition layer**.

---

## 14. Modal Project Structure

The same approach applies to a Modal.

Suppose we have:

```
ConfirmationModalView
```

A feature could contain:

```
features/
└── account/
    │
    ├── views/
    │   └── ConfirmationModalView/
    │       ├── ConfirmationModalView.tsx
    │       └── index.ts
    │
    ├── components/
    │   ├── ConfirmDeletion/
    │   │   ├── ConfirmDeletion.tsx
    │   │   └── index.ts
    │   │
    │   └── CancelDeletion/
    │       ├── CancelDeletion.tsx
    │       └── index.ts
    │
    └── ...
```

The View:

```tsx
export function ConfirmationModalView() {
    return (
        <Modal>
            <ConfirmationMessage />

            <ConfirmDeletion />

            <CancelDeletion />
        </Modal>
    );
}
```

Architecturally:

```
ConfirmationModalView
│
├── ConfirmationMessage
│   └── Decoration
│
├── ConfirmDeletion
│   └── Component
│
└── CancelDeletion
    └── Component
```

The outer `Modal` implementation may itself be a primitive UI/layout mechanism.

The architectural object being presented to the user is still:

```
ConfirmationModalView
```

---

## 15. Nested Views in Code

Because Views can contain Views, the code can naturally become:

```tsx
export function AccountSettingsView() {
    return (
        <section>
            <AccountInformationView />

            <SecurityView />

            <DangerZoneView />
        </section>
    );
}
```

Then:

```tsx
export function DangerZoneView() {
    return (
        <section>
            <DangerZoneDescription />

            <DeleteAccountView />
        </section>
    );
}
```

And:

```tsx
export function DeleteAccountView() {
    return (
        <>
            <DeleteAccountComponent />

            <ConfirmationModalView />
        </>
    );
}
```

The resulting structure is:

```
AccountSettingsView
│
├── AccountInformationView
│
├── SecurityView
│
└── DangerZoneView
    │
    └── DeleteAccountView
        │
        ├── DeleteAccountComponent
        │
        └── ConfirmationModalView
            │
            ├── Decoration
            ├── Confirm Component
            └── Cancel Component
```

This is valid because the hierarchy follows the actual composition of the interface.

---

## 16. When Should a Folder Be Created?

Not every architectural role needs its own folder.

For example, this may be excessive:

```
SearchView/
├── SearchView.tsx
├── decorations/
│   ├── SearchDescription/
│   └── CommonKeywords/
├── aligners/
├── components/
├── elements/
└── ...
```

Instead, use the project-level structure:

```
search/
├── views/
├── components/
├── decorations/
└── ...
```

The architecture describes **roles**.

The filesystem should optimize for:

- discoverability
- ownership
- locality
- maintainability
- project size

The folder structure should not become a bureaucratic copy of the conceptual diagram.

---

## 17. Co-Location for Small Compositions

For a small View, co-location can be better.

For example:

```
SearchView/
├── SearchView.tsx
├── SearchDescription.tsx
├── CommonKeywords.tsx
└── index.ts
```

while larger reusable Components remain separately organized:

```
components/
└── SearchInput/
    ├── SearchInput.tsx
    ├── SearchInput.types.ts
    └── ...
```

This produces:

```
Small supporting pieces
→ stay close to their View

Large/purposeful reusable pieces
→ become explicit Components
```

This prevents excessive folder fragmentation.

---

## 18. Component Extraction

A View should not automatically extract every element into a Component.

For example:

```tsx
export function SearchView() {
    return (
        <section>
            <h1>Search</h1>

            <p>
                Search for users, posts, or topics.
            </p>

            <SearchInput />

            <CommonKeywords />
        </section>
    );
}
```

There is no need to turn everything into:

```
SearchTitle
SearchDescription
SearchSectionContainer
SearchWrapper
SearchContent
SearchLayout
...
```

unless those abstractions have a real reason to exist.

The architecture is intended to make the structure clearer, not to increase the number of files.

---

## 19. Avoiding the “Everything Is a Component” Problem

A project using this architecture should avoid this:

```
components/
├── SearchPageComponent
├── SearchViewComponent
├── SearchInputComponent
├── SearchTitleComponent
├── SearchDescriptionComponent
├── SearchKeywordsComponent
├── SearchChipComponent
└── ...
```

This structure hides the actual semantics.

Instead:

```
search/
├── views/
│   └── SearchView/
│
├── components/
│   └── SearchInput/
│
└── decorations/
    ├── SearchDescription/
    └── CommonKeywords/
```

Now the filesystem itself communicates architectural intent.

---

## 20. The `ui/elements` Layer

Global primitive elements should remain independent of business features.

> **Note — placement refinement:** this section's `ui/elements/` layout is refined by [`../extensions/specialised-component.md`](../extensions/specialised-component.md) (Acknowledgment section), which splits it into `ui/base/` (the raw framework primitive, one line, framework named exactly once) and `ui/adaptive/` (base + the design system's styling, variants, and states — still purpose-agnostic). Everything this section and the next say about primitives staying feature-agnostic applies to both tiers; what changes is only that Components import from `ui/adaptive/`, never from `ui/base/` or the framework directly.

For example:

```
ui/
└── elements/
    ├── Button/
    ├── Input/
    ├── Text/
    ├── Icon/
    ├── Chip/
    ├── Checkbox/
    ├── Select/
    └── Avatar/
```

These elements should generally avoid knowing about application-specific concepts.

For example, this is a good primitive:

```tsx
<Button disabled={disabled}>
    {children}
</Button>
```

while this is feature-specific:

```tsx
<DeleteAccountButton />
```

The latter belongs to the relevant feature.

---

## 21. UI Elements Should Stay Generic

A primitive `Button` should not know about:

```
Delete Account
Create Post
Search
Checkout
Follow User
Confirm Registration
```

It should know about general button behavior:

```
disabled
loading
size
variant
type
onClick
children
```

Then purposeful Components compose it:

```
DeleteAccount
    ↓
Button

SearchAction
    ↓
Button

ConfirmRegistration
    ↓
Button
```

This keeps the primitive layer stable while the application grows.

---

## 22. Component API Design

A purposeful Component should expose a meaningful API.

For example:

```tsx
<SearchInput
    value={query}
    onChange={setQuery}
    onSearch={handleSearch}
/>
```

rather than exposing every primitive implementation detail:

```tsx
<SearchInput
    inputClassName="..."
    iconPosition="..."
    buttonPadding="..."
    ...
/>
```

The Component should provide an API based on its purpose.

Therefore:

```
Component API
    ↓
User purpose
```

rather than:

```
Component API
    ↓
Internal DOM/UI structure
```

---

## 23. View API Design

A View should also expose a meaningful API.

For example:

```tsx
<SearchView
    initialQuery="React"
    onSearch={handleSearch}
/>
```

The View can internally coordinate:

```
SearchDescription
SearchInput
CommonKeywords
```

The parent Page does not need to know how those pieces are arranged.

This creates an abstraction boundary:

```
Page
   ↓
SearchView API
   ↓
Internal View composition
```

---

## 24. Import Direction

The project should generally maintain a downward dependency direction.

A useful conceptual direction is:

```
Page
 ↓
View
 ↓
Component
 ↓
UI Element
```

Supporting layers can be consumed from the appropriate level:

```
View
 ├── Component
 ├── Decoration
 └── UI Element
```

A UI Element should not import a feature-specific View.

For example:

```
ui/elements/Button
```

should not depend on:

```
features/account/views/DeleteAccountView
```

This would reverse the abstraction direction.

---

## 25. Dependency Example

Good:

```
SearchPage
    ↓
SearchView
    ↓
SearchInput
    ↓
Input
```

Bad:

```
Input
    ↓
SearchInput
    ↓
SearchView
```

The primitive layer should remain below the application-specific layer.

Conceptually:

```
Application-specific
        ↓
Purpose-specific
        ↓
Primitive
```

---

## 26. A Complete Small Application

A small application using the architecture could begin with:

```
src/
│
├── app/
│   ├── routes/
│   │   ├── index.tsx
│   │   └── search.tsx
│   │
│   └── pages/
│       ├── HomePage/
│       │   └── HomePage.tsx
│       │
│       └── SearchPage/
│           └── SearchPage.tsx
│
├── features/
│   └── search/
│       ├── views/
│       │   └── SearchView/
│       │       └── SearchView.tsx
│       │
│       ├── components/
│       │   └── SearchInput/
│       │       └── SearchInput.tsx
│       │
│       └── decorations/
│           ├── SearchDescription/
│           │   └── SearchDescription.tsx
│           │
│           └── CommonKeywords/
│               └── CommonKeywords.tsx
│
├── ui/
│   └── elements/
│       ├── Button/
│       │   └── Button.tsx
│       ├── Input/
│       │   └── Input.tsx
│       ├── Text/
│       │   └── Text.tsx
│       ├── Icon/
│       │   └── Icon.tsx
│       └── Chip/
│           └── Chip.tsx
│
└── shared/
    └── ...
```

This is already enough to apply the architecture.

There is no need to start with an enormous enterprise structure.

---

## 27. A Larger Application

As the application grows:

```
src/
│
├── app/
│   ├── routes/
│   ├── layouts/
│   └── pages/
│
├── features/
│   ├── authentication/
│   ├── search/
│   ├── profile/
│   ├── posts/
│   ├── comments/
│   ├── notifications/
│   ├── messaging/
│   └── settings/
│
├── ui/
│   ├── elements/
│   ├── decorations/
│   ├── layout/
│   └── feedback/
│
├── shared/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── constants/
│
└── infrastructure/
    ├── api/
    ├── database/
    ├── authentication/
    └── storage/
```

The UI architecture remains the same:

```
Page
 ↓
View
 ↓
Component
 ↓
UI Element
```

while the rest of the application architecture can evolve independently.

---

## 28. Recommended Naming

Names should communicate the architectural role when useful.

Examples:

```
SearchPage
SearchView
SearchInput
SearchDescription
CommonKeywords
Button
Input
Text
```

Avoid meaningless names such as:

```
Container1
Section2
ComponentA
Wrapper
Box
Thing
```

A name should ideally communicate either:

- what the object represents, or
- what purpose it serves.

---

## 29. Naming Views

Views should generally describe the meaningful section they represent.

Good:

```
ProfileHeaderView
SearchView
StatisticsView
CommentsView
CheckoutView
ConfirmationModalView
```

Less useful:

```
MainView
SectionView
ContentView
ContainerView
```

unless those names genuinely describe the purpose.

---

## 30. Naming Components

Components should describe their purpose.

Good:

```
SearchInput
PostComposer
ProfileEditor
PaymentForm
CommentComposer
ConfirmDeletion
```

The name should ideally answer:

> **What meaningful functionality does this provide?**
> 

---

## 31. Naming Decorations

Decorations should describe what they provide around the functionality.

Good:

```
SearchDescription
CommonKeywords
ProfileStatus
SectionTitle
PasswordHint
EmptyStateMessage
```

They should not be named `Component1` simply because they happen to be implemented as React components.

---

## 32. Naming Aligners

Because Aligners are Decorations, their names do not necessarily need the word `Aligner`.

For example:

```
SearchIcon
ClearButton
PasswordVisibilityButton
StatusBadge
```

Their role can be understood from their relationship:

```
SearchInput
├── SearchIcon
│   └── Leading Aligner
│
└── ClearButton
    └── Trailing Aligner
```

The term **Aligner** is therefore primarily an architectural classification, not necessarily a naming convention.

---

## 33. The Code Should Reflect the Architecture

The final goal is that reading the code should reveal the composition.

For example:

```tsx
export function SearchView() {
    return (
        <section>
            <SearchDescription />

            <SearchInput />

            <CommonKeywords />
        </section>
    );
}
```

This immediately communicates:

```
SearchView
├── supporting information
├── primary functionality
└── supporting options
```

And then:

```tsx
export function SearchInput() {
    return (
        <div>
            <SearchIcon />

            <Input />

            <ClearButton />
        </div>
    );
}
```

communicates:

```
SearchInput
├── leading support
├── primitive input
└── trailing action
```

The code itself therefore becomes a representation of the architectural model.

---

## 34. Final Project Model

The complete project can be understood through three layers.

### Layer 1 — Application Composition

```
Routes
   ↓
Pages
```

### Layer 2 — UI Composition

```
Pages
   ↓
Views
   ↓
Components
Decorations / Aligners
```

### Layer 3 — Primitive Construction

```
Components / Decorations
   ↓
UI Elements
```

Together:

```
Application
│
├── Routes
│
└── Pages
     │
     └── Views
          │
          ├── Views
          │
          ├── Components
          │    └── UI Elements
          │
          ├── Decorations
          │    └── UI Elements
          │
          └── Aligners
               └── UI Elements
```

---

## 35. Final Example

A complete page might therefore look like:

```
ProfilePage
│
├── ProfileHeaderView
│   │
│   ├── ProfileAvatar
│   │   └── Component
│   │
│   ├── ProfileName
│   │   └── Decoration
│   │
│   └── EditProfile
│       └── Component
│
├── ProfileStatisticsView
│   │
│   ├── StatisticsTitle
│   │   └── Decoration
│   │
│   └── Statistics
│       └── Component
│
└── ProfileActionsView
    │
    ├── FollowUser
    │   └── Component
    │
    └── MoreActions
        └── Component
```

The corresponding project might be:

```
features/
└── profile/
    │
    ├── views/
    │   ├── ProfileHeaderView/
    │   ├── ProfileStatisticsView/
    │   └── ProfileActionsView/
    │
    ├── components/
    │   ├── ProfileAvatar/
    │   ├── EditProfile/
    │   ├── Statistics/
    │   ├── FollowUser/
    │   └── MoreActions/
    │
    ├── decorations/
    │   ├── ProfileName/
    │   └── StatisticsTitle/
    │
    ├── hooks/
    ├── services/
    └── types/
```

while the global primitive layer remains:

```
ui/
└── elements/
    ├── Button/
    ├── Input/
    ├── Text/
    ├── Icon/
    ├── Avatar/
    ├── Chip/
    └── ...
```

The architecture therefore produces a project in which the **filesystem, component tree, and conceptual UI structure can all tell the same story**.

---

## 36. Final Principle

The project structure should not be:

```
Everything
└── components
```

Instead, it should distinguish:

```
Where the thing belongs
        +
What role the thing plays
```

A useful final mental model is:

```
                 FEATURE / DOMAIN
                       │
              ┌────────┴────────┐
              ↓                 ↓
            PAGE              DATA
              │
              ↓
            VIEW
              │
       ┌──────┼───────┐
       ↓      ↓       ↓
 COMPONENT  DECOR.  VIEW
    │          │
    ↓          ↓
 UI ELEMENTS  UI ELEMENTS
```

The architecture therefore introduces a **semantic UI construction layer** without forcing the rest of the application to follow an artificial structure.

The core rule remains:

> **Organize code according to both ownership and role: features determine where UI belongs, while Page → View → Component → UI Element describes how that UI is constructed.**
> 

And most importantly:

> **A React component is not automatically an architectural Component. The architectural role is determined by what the code represents and what responsibility it has within the UI composition.**
>