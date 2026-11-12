---
title: Responsibility Ownership in Software Architecture
description: A practical framework for defining whether a system responsibility is owned by a single component (OOUs) or shared across multiple tiers (OU), preventing duplicated logic and runaway retries.
date: 2026-11-12
category: Software Architecture
tags: [software-architecture, system-design, micro-decisions, architecture-records]
thumbnail: ./cover.jpg
lang: en
---

# Responsibility Ownership in Software Architecture

## 1. Core Idea

In a software application, a responsibility may be handled by one layer or shared across multiple layers.

This document defines two ownership categories for software responsibilities:

- **OOUs — One Of Us:** Only one designated layer or component is responsible for handling the responsibility.
- **OU — All Of Us:** Multiple designated layers or components are responsible for handling the responsibility.

The purpose is to document small architectural decisions so that future developers can understand where a responsibility belongs and why.

---

## 2. Example: Retry Responsibility

Consider a system where both the frontend and backend can retry failed operations.

- The backend can retry a specific operation or step, with detailed knowledge of what failed.
- The frontend can retry a request while controlling the user experience, such as displaying retry progress or offering a retry button.

If both layers independently perform three retries, the total number of attempts can multiply. For example, three frontend attempts, each triggering up to three backend attempts, can produce up to nine backend attempts.

This can increase system load, duplicate work, and create a poor user experience.

The solution is to assign retry ownership deliberately. For example, the backend may own automatic retries for transient failures, while the frontend may offer a manual retry action after the backend's retry policy is exhausted.

Whether retries belong to one layer or multiple layers depends on the operation, system requirements, and failure-handling strategy.

---

## 3. Decision Record Format

Each responsibility should have a small Markdown file named after the responsibility, such as `retry.md`.

The file contains:

1. **Title:** The responsibility's name.
2. **Description:** What the responsibility means and where it applies.
3. **Ownership:** `OOUs` or `OU`.
4. **Reason:** Why this ownership decision was selected and why the alternative was rejected.

---

## 4. Example: `retry.md`

```markdown
# Retry

## Description
Defines how failed operations are retried across the application.

## Ownership
OOUs — One Of Us

## Reason
The backend owns automatic retries for transient failures because it
knows which operation failed and can apply a bounded retry policy.

The frontend must not independently retry every failed request
automatically, as this could multiply backend attempts and increase
system load.

The frontend may still provide a manual retry action after the
backend's retry policy is exhausted.
```

---

## 5. Purpose

These records capture micro-decisions: small but important architectural choices that might otherwise remain undocumented.

They help developers:

- Avoid implementing the same responsibility independently in multiple layers.
- Prevent conflicting behavior and duplicated work.
- Understand why a responsibility belongs to a particular layer.
- Make future changes without accidentally violating existing architectural decisions.

The goal is not to create lengthy architectural documentation. Each record should remain short, practical, and focused on one responsibility and its ownership decision.

