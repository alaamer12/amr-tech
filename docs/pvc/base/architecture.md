# A Role-Based UI Construction Architecture for Web Applications

> The foundational document of this doc set. Defines the four architectural roles — Page, View, Component, Decoration/Aligner, UI Element — as concepts distinct from implementation. Nothing here changes as the system evolves; everything in `../extensions/` is built on top of it. Read this before `project-structure.md` and before anything in `../extensions/`.

## 1. Overview

Modern web applications are commonly organized around a simple hierarchy such as:

```
Page
└── Components
```

As applications become larger, this is often extended into a feature-oriented structure:

```
Pages
Features
Components
UI
```

This works well, but it can still leave an important question unanswered:

> **How is an individual page actually constructed?**
> 

A page is rarely just a collection of unrelated components. It is usually composed of meaningful sections, each with a primary purpose, supporting information, supporting actions, and primitive interface elements.

This document proposes a **role-based UI construction model** in which a web page is constructed from **Views**, and each View is constructed from a primary **Component**, its **Decorations/Aligners**, and lower-level **UI Elements**.

The proposed hierarchy is:

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
         ├── View
         │    └── ...
         │
         └── View
              └── ...
```

The central principle is:

> **Pages compose Views. Views compose purposeful UI. UI Elements provide the primitive construction blocks.**
> 

---

# 2. The Problem With a Generic Component Model

In React and other component-based frameworks, almost anything can technically be called a component.

For example:

```
Button
SearchInput
SearchSection
Modal
Dashboard
Page
```

All of them can be implemented as React components.

However, treating all of them as the same architectural concept loses useful information.

Consider:

```jsx
<Dashboard>
    <Welcome />
    <Statistics />
    <RecentActivity />
    <Goals />
</Dashboard>
```

The term `component` does not tell us what role each item plays.

Are they:

- primitive controls?
- functional units?
- complete sections?
- supporting elements?
- entire compositions?

The proposed model addresses this by separating **implementation technology** from **architectural role**.

A React component is an implementation mechanism.

A `View`, `Component`, `Decoration`, or `UI Element` is an **architectural role**.

---

# 3. The Core Hierarchy

The proposed model uses four primary concepts:

```
Page
  ↓
View
  ↓
Component
  ↓
UI Element
```

with Decorations/Aligners supporting the View and its primary Component:

```
Page
└── View
    ├── Decorations / Aligners
    ├── Component
    └── UI Elements
```

These concepts are not necessarily a strict tree where every object must belong to exactly one category.

They describe **what something is doing within a particular composition**.

---

# 4. Page

A **Page** represents an application-level screen or route.

Its primary responsibility is composition.

A Page should generally answer:

> **What major Views make up this screen?**
> 

For example:

```jsx
<DashboardPage>
    <WelcomeView />
    <StatisticsView />
    <RecentActivityView />
    <GoalsView />
    <RecommendationsView />
</DashboardPage>
```

The Page should not need to know every primitive detail inside those Views.

Conceptually:

```
Page = Composition of Views
```

A Page is therefore primarily a **container and composition boundary**.

---

# 5. View

A **View** is a meaningful, self-contained portion of a Page.

It represents a focused piece of UI rather than an entire route.

This is an intentional distinction from traditional architectural terminology such as MVC/MVVM, where “View” can refer to the entire user interface layer or screen.

In this model:

> **A View is a meaningful section of a Page with its own visual and functional purpose.**
> 

For example:

```
SearchPage
└── SearchView
```

or:

```
DashboardPage
├── WelcomeView
├── StatisticsView
├── ActivityView
└── GoalsView
```

A View may contain:

- a primary Component
- supporting Decorations
- Aligners
- UI Elements
- other Views

The last point is important.

## Views are composable

A View can contain another View.

For example:

```
DashboardView
└── DeleteAccountView
    └── ConfirmationModalView
```

This is completely valid.

There is no rule that says:

```
Page
└── View
```

must be the maximum depth.

Instead:

```
View
└── View
    └── View
```

is allowed whenever the UI naturally forms meaningful nested compositions.

Therefore:

> **A View is defined by its purpose and composition, not by its depth in the hierarchy.**
> 

---

# 6. Component

A **Component** is the primary purposeful or functional unit within a View.

The key characteristic is not simply that it is reusable or implemented as a React component.

Its important characteristic is:

> **It performs a meaningful action, interaction, or functional responsibility for the user.**
> 

For example, in a Search View:

```
SearchView
└── SearchInput
```

`SearchInput` is the primary Component because it is what the user actually uses to perform the search.

Similarly:

```
LoginView
└── LoginForm
```

```
CheckoutView
└── PaymentForm
```

```
ProfileView
└── ProfileEditor
```

The Component is therefore the **functional focus** of the View.

---

# 7. Decorations

**Decorations** are supporting elements that provide context, explanation, emphasis, or additional information around the primary functional content.

Examples include:

```
Title
Description
Caption
Hint
Badge
Section Label
Illustration
Supporting Text
Divider
Status Indicator
```

For example:

```
SearchView
├── Title
├── Description
├── SearchInput
└── CommonKeywords
```

The title and description are not the primary interaction.

They explain and contextualize the interaction.

Therefore:

```
Title        → Decoration
Description  → Decoration
SearchInput  → Component
```

---

# 8. Aligners

**Aligners are a specialized form of Decoration.**

The term “aligner” describes their typical relationship to the primary Component.

They commonly appear:

```
Leading
Trailing
Top
Bottom
```

or otherwise support and visually align with the main Component.

For example:

```
SearchInput
├── SearchIcon      → Leading Aligner
└── ClearButton     → Trailing Aligner
```

Another example:

```
[ Icon ] [ Input field ] [ Clear ]
   ↑          ↑             ↑
leading    component     trailing
aligner                   aligner
```

The important distinction is:

> **Decoration describes the general supporting role; Aligner describes a decoration’s positional/supporting relationship to the primary Component.**
> 

Therefore:

```
Decoration
└── Aligner
```

rather than:

```
Decoration ≠ Aligner
```

An Aligner is a Decoration with a particularly meaningful positional role.

---

# 9. UI Elements

**UI Elements are the primitive construction tools of the interface.**

They are the lowest-level reusable pieces from which purposeful Components and Decorations can be constructed.

Examples:

```
Button
Input
Text
Icon
Chip
Checkbox
Radio
Avatar
Select
Image
Link
```

However, an important distinction exists between the **primitive** and the **purposeful unit built from it**.

For example:

```
UI Elements
├── Input
├── Icon
└── Button
       ↓
SearchInput Component
```

The raw `Input` is merely a primitive interface element.

`SearchInput` gives those primitives a meaningful user-facing purpose.

Therefore:

```
Input       → UI Element
SearchInput → Component
```

Likewise:

```
Button → UI Element
ConfirmAccountDeletion → Component
```

The classification depends on the role and abstraction level.

> **Note — placement refinement:** this section defines UI Element as one *role*. A later document in this set, [`../extensions/specialised-component.md`](../extensions/specialised-component.md) (Acknowledgment section), refines *where* a UI Element is placed — splitting it into two tiers, `ui/base/` (the raw framework primitive, re-exported under this system's own name) and `ui/adaptive/` (that same primitive plus the design system's styling, variants, and states). Both tiers remain UI Element as defined here — the role does not change, only the placement granularity within it. See that document for the full reasoning and folder layout.

---

# 10. Example: Search View

Consider a search interface:

```
Search
Search for users, posts, or topics...

[ 🔍 Search..................... ]

Common searches:
[React] [Python] [JavaScript]
```

The architectural structure could be:

```
SearchView
│
├── Title
│     └── Decoration
│
├── Description
│     └── Decoration
│
├── SearchInput
│     └── Component
│          ├── SearchIcon
│          │     └── UI Element / Leading Aligner
│          │
│          ├── Input
│          │     └── UI Element
│          │
│          └── ClearButton
│                └── UI Element / Trailing Aligner
│
└── CommonKeywords
      └── Decoration
           └── Chip
                └── UI Element
```

The entire structure is one **View**.

The SearchInput is its primary **Component**.

The surrounding information is **Decoration**.

The leading/trailing supporting pieces can be classified as **Aligners**.

The primitive controls are **UI Elements**.

---

# 11. Example: Modal View

This model becomes particularly useful with things that are traditionally called “components”, such as Modals.

A Modal is commonly treated as a reusable Component:

```
Modal
```

However, in this architecture, a Modal can instead be understood as a **View** when it represents a complete focused interaction.

For example:

```
ConfirmationModalView
│
├── ImportantConfirmationText
│     └── Decoration / Aligner
│
└── Actions
      ├── Confirm
      │     └── Component
      │
      └── Cancel
            └── Component
```

The entire Modal is a View because it is a meaningful composition containing:

- context
- a decision
- one or more purposeful actions

The buttons are Components because they have meaningful user-facing purposes.

Their underlying primitive button implementation may itself be a UI Element.

Therefore:

```
ConfirmationModalView
│
├── ConfirmationText
│   └── Decoration
│
├── ConfirmAction
│   └── Component
│
└── CancelAction
    └── Component
```

This does **not** mean a Modal cannot technically be implemented as a React component.

It simply means:

> **“React component” and “architectural Component” are not synonymous.**
> 

---

# 12. Contextual Classification

One of the most important principles of this architecture is that classification is **contextual**.

An object does not necessarily have one permanent architectural classification everywhere.

Instead, ask:

> **What role does this object play in this composition?**
> 

For example, a Button can be a primitive:

```
Button
└── UI Element
```

But a purposeful action constructed around that primitive can be:

```
ConfirmDeletion
└── Component
    └── Button
        └── UI Element
```

Similarly, a Modal can be implemented using React components while architecturally being:

```
Modal
└── View
```

This produces a crucial separation:

```
Implementation identity
        ≠
Architectural role
```

A React component is simply a technical implementation unit.

The architecture classifies **what that unit represents in the UI composition**.

---

# 13. Role Over Implementation

The architecture therefore avoids a common mistake:

> Assuming that every React component should be called a Component architecturally.
> 

For example:

```jsx
function SearchView() {}
function ConfirmationModal() {}
function SearchInput() {}
function Button() {}
function Text() {}
```

All five may be React components.

Architecturally, however:

```
SearchView
    → View

ConfirmationModal
    → View

SearchInput
    → Component

Button
    → UI Element

Text
    → UI Element / Decoration depending on its role
```

This allows the architecture to describe the UI more accurately.

---

# 14. Recursive Composition

The model is intentionally recursive.

A View can contain another View:

```
Page
└── View
    ├── View
    │   ├── Component
    │   └── Decorations
    │
    └── Component
```

A Component can contain UI Elements:

```
Component
├── Input
├── Button
└── Icon
```

A View can contain multiple Components:

```
View
├── Component
├── Component
└── Component
```

A View can also contain another View alongside Components:

```
View
├── NestedView
├── Component
└── Decoration
```

There is no requirement for every View to have exactly one Component.

The concept of a “primary Component” describes the common case where the View has a central functional focus.

---

# 15. Page Construction

With this model, Page construction becomes highly readable.

For example:

```
ProfilePage
│
├── ProfileHeaderView
├── ProfileInformationView
├── StatisticsView
├── PostsView
└── AccountActionsView
```

The page communicates the **major visual and functional sections**.

Each View then communicates its internal construction:

```
ProfileInformationView
│
├── Title
├── Description
├── ProfileEditor
└── SaveChangesAction
```

And the lower level:

```
ProfileEditor
├── Input
├── Select
├── Avatar
└── Button
```

This creates multiple useful levels of abstraction:

```
Page
    ↓
Major UI section
    ↓
Purposeful interaction
    ↓
Primitive interface
```

---

# 16. Separation of Concerns

The model creates a natural separation of responsibilities.

| Concept | Primary responsibility |
| --- | --- |
| **Page** | Compose the major sections of a route/screen |
| **View** | Represent a meaningful section of UI |
| **Component** | Provide a purposeful functional/interactive unit |
| **Decoration** | Provide supporting context, information, or presentation |
| **Aligner** | Provide supporting positional/structural decoration |
| **UI Element** | Provide primitive interface construction blocks |

This gives each level a clear question.

### Page

> What sections make up this screen?
> 

### View

> What is this section about?
> 

### Component

> What is the meaningful functionality here?
> 

### Decoration

> What supports or explains that functionality?
> 

### Aligner

> What supports or aligns with the primary functionality?
> 

### UI Element

> What primitive interface pieces are used to construct it?
> 

---

# 17. Folder Organization

This model does not require one specific folder structure.

It is primarily a **construction and architectural model**, not a mandatory filesystem convention.

For example, a feature-oriented implementation could still be used:

```
features/
└── search/
    ├── views/
    │   └── SearchView/
    ├── components/
    │   └── SearchInput/
    ├── decorations/
    └── ui/
```

Alternatively, a View can keep its implementation close together:

```
search/
└── SearchView/
    ├── SearchView.tsx
    ├── SearchInput.tsx
    ├── CommonKeywords.tsx
    └── ...
```

The important thing is not the exact folders.

The important thing is that developers understand the **architectural role** of each piece.

---

# 18. Relationship With Feature-Based Architecture

This model does not replace Feature-Based Architecture.

They operate at different dimensions.

Feature architecture answers:

> **What domain or capability does this code belong to?**
> 

The proposed UI construction architecture answers:

> **What role does this UI piece play in constructing its View?**
> 

They can therefore work together:

```
Feature
└── Search
    │
    ├── Pages
    │   └── SearchPage
    │
    ├── Views
    │   └── SearchView
    │
    ├── Components
    │   └── SearchInput
    │
    └── UI
        ├── Input
        ├── Button
        └── Chip
```

Feature organization provides **ownership and domain boundaries**.

View-based construction provides **UI composition semantics**.

---

# 19. The Main Architectural Principle

The architecture can be summarized as:

```
PAGE
  │
  │ composed of
  ↓
VIEWS
  │
  │ composed of
  ├───────────────┐
  ↓               ↓
COMPONENTS    DECORATIONS
  │               │
  │               └── ALIGNERS
  │
  └───────────────┐
                  ↓
             UI ELEMENTS
```

Or in words:

> **A Page is a composition of Views. A View is a meaningful UI composition centered around purposeful functionality and supported by Decorations and Aligners. Components provide meaningful functional behavior, while UI Elements provide the primitive building blocks from which these structures are constructed.**
> 

---

# 20. Design Principles

The architecture follows several principles.

## 20.1 Role over implementation

Do not classify something merely by how it is implemented.

```
React Component
        ≠
Architectural Component
```

---

## 20.2 Purpose over size

A Component is not a Component because it is large.

A UI Element is not a UI Element because it is small.

Classification comes from **purpose and abstraction**.

---

## 20.3 Composition over rigid hierarchy

Views may contain Views.

Components may contain other Components where appropriate.

The architecture should follow the natural structure of the interface rather than enforcing artificial depth restrictions.

---

## 20.4 Context matters

The same technical implementation can have different architectural roles in different contexts.

Always ask:

> **What role does this thing play here?**
> 

---

## 20.5 Pages should remain compositional

A Page should primarily communicate:

```
"What makes up this screen?"
```

rather than:

```
"How does every small piece of this screen work?"
```

---

## 20.6 Views should have a clear purpose

A View should represent something users can conceptually recognize as a section, interaction, state, or focused piece of the interface.

Avoid creating Views merely because a group of elements happens to occupy a rectangle.

---

# 21. Benefits

This architecture provides several practical benefits.

### Better readability

A developer can understand a page at a glance:

```
DashboardPage
├── WelcomeView
├── StatisticsView
├── ActivityView
└── GoalsView
```

### Better semantic meaning

Instead of calling everything a component, the architecture communicates why something exists.

### Better separation

Primitive UI controls do not become mixed with complete functional interactions.

### Better composition

Views become reusable composition units rather than only routes/pages.

### Better scalability

Large pages can be decomposed without turning the entire application into an enormous collection of generic components.

### Better communication

Developers can say:

> “This is a View with a primary Component and two supporting Aligners.”
> 

instead of:

> “This is a component containing some components.”
> 

The former communicates substantially more information.

---

# 22. A Compact Mental Model

The entire architecture can be remembered through five questions:

```
PAGE
"What screen are we constructing?"

VIEW
"What meaningful section are we constructing?"

COMPONENT
"What purposeful functionality is the user interacting with?"

DECORATION / ALIGNER
"What supports, explains, or surrounds that functionality?"

UI ELEMENT
"What primitive interface pieces construct it?"
```

This results in a UI construction philosophy based not on the question:

> **“Is this a React component?”**
> 

but on:

> **“What role does this piece play in constructing the interface?”**
> 

That distinction is the foundation of the model.

---

# 23. Final Model

The proposed architecture can ultimately be represented as:

```
                         PAGE
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
            VIEW         VIEW         VIEW
              │            │            │
        ┌─────┼─────┐      │      ┌─────┼─────┐
        ↓     ↓     ↓      ↓      ↓     ↓     ↓
   COMPONENT DECOR. ALIGNER COMPONENT DECOR. ALIGNER
        │      │      │      │      │      │
        └──────┴──────┴──────┴──────┴──────┘
                           │
                           ↓
                     UI ELEMENTS
```

The architecture is therefore not simply:

```
Pages → Components
```

nor simply:

```
Pages → Features → Components
```

It introduces a **semantic construction layer**:

```
Pages
  ↓
Views
  ↓
Purpose + Support + Primitives
```

The central idea is:

> **A web interface should be constructed according to the roles that its pieces play, rather than treating every rendered unit as the same kind of “component.”**
> 

This makes the Page the composition boundary, the View the meaningful UI boundary, the Component the purposeful functional boundary, Decorations/Aligners the supporting boundary, and UI Elements the primitive construction boundary.

Project Structure and Code Organization