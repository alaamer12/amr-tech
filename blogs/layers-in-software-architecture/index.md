---
title: Layers in Software Architecture
description: A practical distinction between explicit runtime boundaries (frontend, backend, database) and implicit structural layers (primitives, components, features), plus the rules needed to enforce them.
date: 2026-11-12
category: Software Architecture
tags: [software-architecture, system-design, code-organization, dependency-rules]
thumbnail: ./cover.jpg
lang: en
---

# Layers in Software Architecture

## 1. Core Idea

Software projects contain two kinds of layers:

- **Explicit Layers:** Layers that represent distinct parts of the system's architecture, such as the frontend, backend, and database.
- **Implicit Layers:** Layers defined by code organization, dependency rules, and architectural discipline, even when they do not represent separate runtime components.

Both types of layers organize a project and define how its parts interact. However, they differ in how they are represented and enforced.

---

## 2. Explicit Layers

Explicit layers represent distinct architectural parts of an application.

For example, a typical full-stack application has three fundamental layers:

1. **Frontend:** Responsible for the user interface and user interactions.
2. **Backend:** Responsible for application logic, business rules, and communication between the frontend and data storage.
3. **Database:** Responsible for storing and retrieving persistent data.

The typical direction of a request is from the frontend to the backend and then, when necessary, to the database. The response travels back through the relevant layers.

The database is the lowest layer in this simplified architecture. Additional infrastructure, such as caching, may introduce other layers or components, depending on the system's design.

These layers are explicit because they represent identifiable architectural responsibilities and boundaries.

---

## 3. Implicit Layers

Implicit layers exist within the organization of the code itself. They define how code is structured, which modules may depend on other modules, and how responsibilities are separated.

For example, a frontend monorepo might follow this hierarchy:

```text
Primitives
    ↓
UI
    ↓
Components
    ↓
Features
    ↓
Pages
```

Each level builds on the capabilities provided by the levels below it:

- **Primitives:** Provide fundamental building blocks.
- **UI:** Combines primitives into reusable interface elements.
- **Components:** Organize UI elements into larger reusable units.
- **Features:** Implement specific application capabilities using components and related logic.
- **Pages:** Compose features into complete screens or routes.

These are implicit layers because they are established through code organization and dependency rules rather than necessarily being separate runtime services.

A page may ultimately contain the entire user interface, but it should not bypass the intended architecture by recreating primitives or implementing responsibilities that belong to lower layers.

---

## 4. Dependency Rules and Enforcement

The existence of directories alone does not create a meaningful layered architecture. The project must enforce rules governing how those layers interact.

For example:

- Primitives must not depend on UI components.
- UI components may depend on primitives.
- Components may depend on UI elements and primitives.
- Features may depend on components and lower-level layers.
- Pages may depend on features and lower-level layers.

The dependency direction should remain consistent with the intended architecture.

These rules can be enforced through package boundaries, module visibility, import restrictions, linting rules, build tools, and architectural tests.

Without enforcement, implicit layers become organizational conventions that developers can bypass. With enforcement, they become meaningful architectural boundaries.

---

## 5. Why Implicit Layers Matter

Implicit layers improve maintainability and flexibility by limiting unnecessary dependencies and separating responsibilities.

For example, if a feature needs a button, it should use the shared UI layer rather than implement a new button independently. If the shared button changes, the improvement can benefit multiple features without requiring each feature to maintain its own implementation.

Similarly, if a page needs a feature, it should compose that feature rather than duplicate its internal logic.

The goal is to reduce coupling, encourage reuse, and make changes easier to manage.

---

## 6. Relationship Between Explicit and Implicit Layers

Explicit and implicit layers can coexist in the same project.

A full-stack application may have explicit frontend, backend, and database layers. Within the frontend, it may also have implicit layers such as primitives, UI, components, features, and pages.

The explicit layers define the application's broader architectural structure, while the implicit layers define internal organization and dependency discipline.

Neither type replaces the other. Both help establish clear boundaries and prevent responsibilities from becoming mixed together.

---

## 7. Summary

Software layers can be understood through two categories:

- **Explicit Layers:** Identifiable architectural parts of a system, such as the frontend, backend, and database.
- **Implicit Layers:** Internal code structures and dependency rules, such as primitives, UI, components, features, and pages.

The central principle is that a well-structured project needs more than folders and separate components. It needs clear boundaries, defined dependency directions, and enforcement mechanisms that keep the architecture consistent as the project grows.

