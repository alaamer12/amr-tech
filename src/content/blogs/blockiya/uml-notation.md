---
title: "The Blockiya UML Notation System: Visual Architecture for React"
description: "A formal architectural notation standard for frontend systems, built on UML class diagrams with stereotypes, contextual visibility, and explicit flow directions."
date: 2026-11-24
category: "Software Architecture"
tags: ["uml", "frontend", "react", "architecture", "diagrams"]
thumbnail: tree
order: 2
lang: en
---

> **Key Takeaways**
> - **Visual Uniformity:** Provides a standardized, tool-agnostic visual language for frontend engineering teams—applicable in Mermaid, PlantUML, or whiteboards.
> - **Directional Rigor:** Distinguishes inputs from outputs using explicit directional indicators: props flowing downward (`▼`), internal hidden state (`◆`), and event intents rising upward (`▲`).
> - **Zero Ambiguity:** Eliminates the classic confusion between props, state, and event emissions in complex UI component trees.

---

## 1. Notation System Overview

As frontend systems grow, informal component boxes with vague arrows fail to communicate data flow and ownership. The **Blockiya UML Notation** adapts formal UML class diagram semantics specifically for component architectures.

![Blockiya UML Taxonomy](./_assets/blockiya-uml-taxonomy.jpg)

### Core Principles

1. **Minimal Syntax:** Only essential markers that convey architecture are permitted.
2. **Directional Clarity:** Explicit flow markers show whether a property enters a block or an event exits it.
3. **Contextual Visibility:** Scope indicates export level relative to the parent feature.
4. **Standard Base:** Built on familiar UML class constructs.
5. **Tool Agnostic:** Native support in Mermaid, PlantUML, and pencil-and-paper diagrams.

---

## 2. Notation Reference Matrix

| Category | Purpose | Notation Symbols | Meaning |
|---|---|---|---|
| **Stereotypes** | Classify component architectural roles | `<<Page>>`, `<<Compound>>`, `<<Atomic>>`, `<<Primitive>>`, `<<Behavioral>>`, `<<Adapter>>`, `<<Utility>>` | Architectural classification |
| **Visibility** | Export and consumption scope | `●` Public<br />`○` Private<br />`◆` Internal | `●` Exported from feature<br />`○` Internal to feature<br />`◆` Hidden implementation |
| **Flow Direction** | Data and event trajectories | `▼` Inflow<br />`▲` Outflow | `▼` Props entering block<br />`▲` Events/Intents exiting block |
| **Relationships** | Component composition & dependencies | `*--` Strong Composition<br />`..>` Dependency<br />`⊙--` Provides Context<br />`··>` Consumes Context | Structural linkages |

---

## 3. Block Structure Specification

Every Blockiya is diagrammed with four defined compartments:

| Section | Role | Contents |
|---|---|---|
| **Header** | Identity & Classification | Stereotype (`<<Compound>>`), Visibility marker (`●`), and Block Name |
| **Props (▼ Inflow)** | Inputs | All props passed down by the caller, including callbacks received |
| **Internal (◆ Hidden)** | Local State & Queries | Local state (`useState`), queries (`useQuery`), derivers (`useDerive`) |
| **Events (▲ Outflow)** | Outputs & Intents | Intents emitted upward (`onSaveIntent`) and callbacks invoked |

### Example Blockiya Definition

```mermaid
classDiagram
    class BillingOverviewBlock {
        <<Compound>> ●
        ▼ subscription: Subscription
        ▼ onUpgradeIntent: Function
        ▼ onViewInvoicesIntent: Function
        ◆ usage: UsageData
        ◆ useBillingUsage() query
        ▲ onUpgradeIntent()
        ▲ onViewInvoicesIntent()
    }
```

---

## 4. End-to-End Feature Diagram

Here is a full feature architecture expressed in Mermaid using the Blockiya UML specification:

```mermaid
classDiagram
    %% Page Level
    class BillingOverviewPage {
        <<Page>>
        ▼ routeParams
        ◆ subscription: Subscription
        ◆ navigate: NavigateFn
        ▲ renders()
    }

    %% Feature Compound Block
    class BillingOverviewBlock {
        <<Compound>> ●
        ▼ subscription: Subscription
        ▼ onUpgradeIntent: Function
        ▼ onViewInvoicesIntent: Function
        ◆ usage: UsageData
        ◆ useBillingUsage() query
        ▲ onUpgradeIntent()
        ▲ onViewInvoicesIntent()
    }

    %% Private Atomic Children
    class UsageChartsBlock {
        <<Atomic>> ○
        ▼ data: UsageData
        ◆ chartConfig: Config
        ▲ rendersCharts
    }

    class InvoiceHistoryBlock {
        <<Atomic>> ○
        ▼ onViewAll: Function
        ◆ recentInvoices: Invoice[]
        ◆ useRecentInvoices() query
        ▲ onViewAll()
    }

    class PlanSummaryBlock {
        <<Atomic>> ○
        ▼ subscription: Subscription
        ▼ onChangePlan: Function
        ◆ planDetails: PlanInfo
        ▲ onChangePlan()
    }

    %% Design System Primitives
    class Card {
        <<Primitive>>
        ▼ variant?: string
        ▼ children: ReactNode
    }

    class VStack {
        <<Primitive>>
        ▼ gap: SpacingToken
        ▼ children: ReactNode
    }

    class Button {
        <<Primitive>>
        ▼ variant: ButtonVariant
        ▼ onClick: Function
        ▼ children: ReactNode
    }

    %% Behavioral Primitives
    class Dropdown {
        <<Behavioral>>
        ▼ onSelect: Function
        ◆ isOpen: boolean
        ◆ managesFocus: boolean
    }

    %% Adapters
    class UsageChartAdapter {
        <<Adapter>>
        ▼ data: UsageData
        ▼ height: SpacingToken
        ◆ translatesTokens()
        ◆ managesLifecycle()
    }

    %% Queries
    class useBillingUsage {
        <<Hook/Query>>
        + fetchUsageData()
        + returns UsageData
    }

    %% Relationships
    BillingOverviewPage ..> BillingOverviewBlock : props ▼ / events ▲
    BillingOverviewBlock *-- UsageChartsBlock : owns
    BillingOverviewBlock *-- InvoiceHistoryBlock : owns
    BillingOverviewBlock *-- PlanSummaryBlock : owns

    UsageChartsBlock ..> UsageChartAdapter : uses
    PlanSummaryBlock ..> Dropdown : uses
    BillingOverviewBlock ..> Card : uses
    BillingOverviewBlock ..> VStack : uses
    PlanSummaryBlock ..> Button : uses
    BillingOverviewBlock ..> useBillingUsage : internal query
```

---

## 5. Summary Cheat Sheet

| Symbol | Meaning | Example Context |
|---|---|---|
| `<<Page>>` | Route orchestrator | Top of the screen tree |
| `<<Compound>>` | Multi-block coordinator | Container holding 2–5 atomic blocks |
| `<<Atomic>>` | Leaf-level domain block | Self-contained single-concern block |
| `<<Primitive>>` | Non-behavioral visual element | `Box`, `Flex`, `Text`, `Button` |
| `<<Behavioral>>` | Interactive compound component | `Dropdown`, `Modal`, `Accordion` |
| `<<Adapter>>` | Boundary adapter | Wraps chart, editor, or canvas libraries |
| `<<Utility>>` | Structural logic helper | `If`, `For`, `useIntent`, `useDerive` |
| `*--` | Strong composition (owns) | Parent Blockiya instantiates child block |
| `..>` | Dependency usage | Component imports or consumes primitive/adapter |
| `⊙--` | Provides Context | Blockiya provides a scoped Context Object |
| `··>` | Consumes Context | Child component reads scoped Context Object |

