---
title: Probability and Certainty in Software Engineering
description: A software-engineering framework for examining behavior through dual dimensions—distinguishing what is deterministic and specified from what is inferred, estimated, or probabilistic.
date: 2026-11-12
category: Software Architecture
tags: [software-design, architecture, domain-modeling, function-design]
thumbnail: ./cover.jpg
lang: en
---

# Probability and Certainty in Software Engineering

## 1. Core Idea

A software feature or behavior can be examined through two dimensions:

- **Probability:** The possibility of multiple interpretations, outcomes, or values. It includes uncertainty, inference, prediction, and estimation.
- **Certainty:** A defined behavior, known value, or explicitly determined outcome according to the system's rules and specifications.

These dimensions are not necessarily mutually exclusive. A feature can contain both probabilistic and certain aspects, or primarily exhibit one of them.

The purpose of this idea is to understand software behavior and use that understanding to guide function design, naming, implementation, and documentation.

---

## 2. The Probability Dimension

The probability dimension concerns situations where the system must deal with possibilities rather than simply use an explicitly determined answer.

Examples include:

- **Input interpretation:** Determining whether a search input represents an ID, an exact name, or a fuzzy query.
- **Fuzzy search:** Finding results that are similar to a query rather than requiring an exact match.
- **Estimation:** Predicting a future value based on available data and assumptions.
- **Prediction:** Inferring a likely outcome from historical data or a model.
- **Classification:** Assigning an input to a category when its intended meaning is not explicitly specified.

Estimation is a branch of this dimension. For example, a cloud service may report actual costs accumulated so far and estimate the total cost at the end of the month. The actual cost is based on recorded usage, while the estimated cost depends on assumptions about future usage and pricing.

Possible function names include:

```javascript
isLikelyFuzzyText(input);
predictSearchType(input);
estimateMonthlyCost(usage);
```

Names such as `Likely`, `Predict`, and `Estimate` communicate that the result is inferred or estimated rather than guaranteed to represent the actual state of the world.

---

## 3. The Certainty Dimension

The certainty dimension concerns behavior or information explicitly determined by the system's rules, specifications, or available data.

Examples include:

- **Explicit search:** Searching by a specified ID.
- **Defined interaction:** Clicking a button opens a particular modal.
- **Command execution:** Invoking an operation with a clearly defined purpose.
- **Recorded measurements:** Reading usage or costs already recorded by the system.
- **Rule-based processing:** Applying a specified rule to a known input.

Possible function names include:

```javascript
searchById(id);
openCreateUserModal();
createUser(userData);
getActualUsage();
```

These names describe defined operations or access to recorded information rather than predictions about what might be true.

Certainty here refers to the intended behavior or the status of the information, not an unconditional guarantee that every operation succeeds.

---

## 4. Example: A Search Input

Suppose a search field accepts three input types:

1. `Fixed ID`
2. `Fixed Name`
3. `Fuzzy Search`

The user enters a value without explicitly selecting a search type. The system must determine which interpretation to use.

This introduces a probabilistic or inferential aspect because the input may admit multiple interpretations.

For example:

```javascript
function predictSearchType(input) {
  // Infer the most likely search strategy.
}

function searchById(id) {
  // Execute the explicitly selected ID search.
}

function searchByName(name) {
  // Execute the explicitly selected name search.
}

function fuzzySearch(query) {
  // Search for approximate matches.
}
```

The first function handles inference. The remaining functions execute defined search strategies.

The distinction is important: a search operation can have a deterministic implementation even when the choice of search strategy is uncertain.

---

## 5. Example: Creating a User

Consider a button labeled **Create New User**.

When clicked, the interface opens a specific modal. This is a defined behavior: the button has a predetermined purpose, and opening a different page or tab is not an alternative interpretation of its intended action.

The workflow can contain both dimensions:

- **Certainty:** Clicking the button opens the designated modal.
- **Probability:** A later operation might estimate how likely the user is to complete registration, or predict which information the user will enter.

The same feature can therefore contain both dimensions at different stages.

---

## 6. Example: Actual Values and Estimates

Consider a cloud service that reports monthly costs.

- **Actual cost:** A value calculated from recorded usage and applicable pricing rules.
- **Estimated cost:** A prediction of the final monthly cost based on current usage and assumptions about future usage.

The actual cost is grounded in recorded data. The estimate belongs to the probability dimension because the future usage is not yet known.

An implementation might use:

```javascript
function getActualCost(usageRecords) {
  // Calculate cost from recorded usage.
}

function estimateMonthlyCost(currentUsage, assumptions) {
  // Estimate the final monthly cost.
}
```

The distinction is not simply between two numerical values. It is between a value derived from known records and a value that depends on uncertain future conditions.

---

## 7. Implications for Function Design

This principle can help guide software design in several ways.

### Function naming

Names should communicate whether the function performs a defined operation or infers, predicts, or estimates something.

### Function contracts

The contract should distinguish between:

- Explicit inputs and inferred interpretations.
- Recorded facts and estimated values.
- Defined operations and predictions.
- Guaranteed properties and results that are merely likely.

### Implementation

Probabilistic behavior may require scoring, heuristics, statistical models, or other inference methods. Certain behavior may instead rely on explicit rules, direct lookups, or defined control flow.

The implementation should follow the actual requirements rather than assuming that every function belongs exclusively to one category.

### Documentation

Documentation should explain which parts of the system are determined by explicit rules and which depend on inference, estimation, or uncertainty.

This makes it easier to understand the limits of a result and to choose appropriate tests.

---

## 8. Scope and Limitations

Probability and certainty are useful conceptual dimensions, but they are not strict opposites in formal mathematics.

Probability is a mathematical measure of uncertainty about events or outcomes. Certainty commonly refers to an outcome or proposition being known or having probability one within a specified model.

Likewise, deterministic behavior does not necessarily imply certainty about the result: a deterministic function can produce an unknown result when its inputs are unknown.

Therefore, the principle should be understood as a software-engineering lens for examining behavior, knowledge, and uncertainty, rather than as a claim that every software operation can be classified perfectly into two exclusive categories.

---

## 9. Summary

The central idea is that software features can be analyzed through two dimensions:

- **Probability:** What must be inferred, predicted, estimated, or selected among possibilities?
- **Certainty:** What is explicitly defined, determined by rules, or grounded in recorded information?

A feature may involve either dimension or both. Recognizing the distinction can help developers design clearer functions, write better contracts, choose appropriate implementations, and document what the system knows versus what it estimates.
