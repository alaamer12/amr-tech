---
title: "The Three Project States: Draft, In-Progress, and Post-Production"
description: A principled framework for software engineering lifecycles defining the three core project states—Draft [DR], In-Progress [IP], and Post-Production [PP]—and how they govern execution, release gates, and iteration boundaries.
date: 2026-11-15
category: Software Architecture
tags: [project-lifecycle, engineering-process, software-development, release-management]
thumbnail: ./_assets/cover.jpg
lang: en
---

# The Three Project States: Draft, In-Progress, and Post-Production

## 1. Core Idea

Every software project moves through different states of maturity, certainty, and exposure. While traditional methodologies often blur the lines between planning, coding, and deploying, structuring work around three explicit macro states brings clarity to development boundaries:

- **Draft [DR]:** Exploring, deciding, shaping requirements, and refining architecture before writing production code.
- **In-Progress [IP]:** Active implementation, automated testing, quality gates, and the initial launch path.
- **Post-Production [PP]:** The period following the first real production release, where the initial milestone is live and subsequent cycles must account for runtime stability and operational reality.

Understanding these three states prevents premature implementation during drafting, keeps active construction focused on delivery, and ensures that a project is not prematurely treated as "finished" before its first true production release has landed.

---

## 2. The Three Project States

```text
┌─────────────────┐       ┌─────────────────────┐       ┌────────────────────────┐
│   Draft [DR]    │  ───> │  In-Progress [IP]   │  ───> │ Post-Production [PP]  │
│ Decide & Refine │       │ Implement & Launch  │       │ Live Release & Evolve  │
└─────────────────┘       └─────────────────────┘       └────────────────────────┘
```

### 2.1. Draft [DR]

The **Draft** state is the phase of deliberate refinement and decision-making prior to implementation.

In this state:
- The system's purpose, core domain models, and UX requirements are examined and debated.
- Technical trade-offs, architecture patterns, and component boundaries are established.
- Unknowns, ambiguous edge cases, and competing solutions are resolved on paper or via lightweight exploratory experiments.
- Code written in this state (if any) consists strictly of non-production spikes, interface sketches, or throwaway prototypes designed to answer specific questions.

The goal of Draft is **decision clarity**. Committing to implementation before a proposal is out of Draft creates rework, architectural churn, and unnecessary refactoring.

### 2.2. In-Progress [IP]

The **In-Progress** state begins once requirements and technical foundations have stabilized. It encompasses the entire delivery pathway up to the initial real release.

In this state:
- Production code is authored against defined contracts and engineering standards.
- Unit, integration, and end-to-end test suites are constructed.
- Build pipelines, linters, type checks, and continuous integration validations are enforced.
- The delivery mechanisms (staging deployments, pre-flight verification, deployment automation) are brought online.
- The state extends through the initial launch.

Crucially, **In-Progress does not conclude when a feature is code-complete on a local branch.** It continues until the system or feature is successfully deployed and verified in its target production environment.

### 2.3. Post-Production [PP]

The **Post-Production** state begins once the first real release has reached production and live users.

A common pitfall in software engineering is treating release as an instantaneous endpoint. In reality, the arrival of a first release marks the beginning of an entirely different operational phase:
- The system is now subject to real traffic, real operational constraints, and emergent edge cases.
- Further iterations are no longer operating on a blank slate; they must preserve backward compatibility, migration integrity, and system uptime.
- Subsequent phases and version iterations are evaluated against live telemetry, real-world user feedback, and runtime performance.

A project phase is not truly finished until its first real release has survived exposure to production and settled into an operational steady state.

---

## 3. Comparison of Lifecycle States

| Dimension | Draft [DR] | In-Progress [IP] | Post-Production [PP] |
|---|---|---|---|
| **Primary Focus** | Defining WHAT & HOW | Building, testing, delivering | Operating, stabilizing, iterating |
| **Tolerance for Ambiguity** | High (actively exploring) | Low (bounded by specs) | Minimal (bound to live contracts) |
| **Deliverable** | Specifications, contracts, plans | Working software, test suites, deployment | Production telemetry, patches, updates |
| **Exit Condition** | Settled architecture & requirements | Successful first real release | Transition to maintenance or next cycle |
| **Blast Radius** | Zero (specifications only) | Internal/Staging environments | Live production users and infrastructure |

---

## 4. Key Rules for State Transitions

To maintain discipline and avoid process leakage across states, three transition rules should be observed:

### 1. No premature promotion from Draft
Never begin production implementation while core architectural questions remain unanswered. Unsettled technical decisions manifest as brittle code, cyclic dependencies, and frequent rewrites during the In-Progress state.

### 2. Delivery is the gate of In-Progress
Do not mark an In-Progress cycle as finished merely because tests pass on a developer machine. An iteration is complete only when the deployed artifact is operational in production.

### 3. Production feedback anchors subsequent Drafts
Post-Production is not a passive resting state. The insights gained from running in production—actual usage patterns, error rates, latency bottlenecks—form the primary inputs for drafting the next set of architectural decisions.

---

## 5. Summary

Structuring engineering lifecycles around **Draft [DR]**, **In-Progress [IP]**, and **Post-Production [PP]** establishes clear expectations for developers, teams, and autonomous workflows:

- **Draft:** Settle the requirements and architecture before writing code.
- **In-Progress:** Build, test, and drive all the way through the first real release.
- **Post-Production:** Guard runtime stability and ground future development in operational reality.

