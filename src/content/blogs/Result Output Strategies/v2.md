---
thumbnail: ./v2-cover.jpg
---

# Function Outcome Strategies

## 1. Overview

Functions do not all need to handle unsuccessful operations in the same way.

Some functions attempt to produce one specific value. Others try alternative approaches, produce estimates, propagate exceptional failures, or perform optional operations without allowing failures to affect the main execution flow.

This document defines five function outcome strategies:

1. **Shot** — Attempt to produce one specific value.
2. **Ladder** — Progressively attempt alternative ways of producing a useful value.
3. **Estimation** — Produce an estimated or probabilistic value.
4. **Throw** — Propagate an exceptional failure.
5. **Neither** — Contain a failure locally without propagating it or returning it as an error.

These strategies provide a vocabulary for deciding how individual functions should behave when executing their responsibilities.

They are architectural conventions, not five universally standardized programming constructs. Their implementation depends on the programming language and application architecture.

---

## 2. Shot

### Definition

Shot describes a function that makes one attempt to produce a specific intended value.

The function has a clearly defined target outcome. It either successfully produces that value or cannot produce a useful value.

It does not attempt alternative strategies or substitute a different value when its primary attempt fails.

### Characteristics

- Has one intended output.
- Makes one logical attempt to obtain that output.
- Does not use fallback alternatives.
- Either produces the intended useful value or reports that it could not.
- Does not imply that the underlying implementation must execute only one instruction or one physical operation.

### Example

```typescript
function getUser(id: string): User | null {
  const user = database.findUser(id);

  if (!user) return null;

  return user;
}
```

The function attempts to retrieve one specific user.

If the user exists, it returns that user. Otherwise, it returns no useful value.

It does not search for another user or substitute a default user.

### Appropriate Use Cases

- Retrieving a specific database record.
- Reading a specific configuration value.
- Validating a particular input.
- Checking whether a particular resource exists.
- Performing a calculation with a clearly defined output.

---

## 3. Ladder

### Definition

Ladder describes a function that attempts to produce the best available value by following an ordered hierarchy of alternatives.

Instead of depending on one specific approach, the function tries multiple approaches in priority order.

If a preferred approach cannot produce an acceptable result, it moves to the next alternative.

The process continues until a sufficiently useful value is obtained or all acceptable alternatives are exhausted.

### Characteristics

- Has multiple possible output paths.
- Alternatives follow an intentional priority order.
- Each alternative may provide a different level of quality, completeness, or availability.
- A lower-priority alternative is considered when a higher-priority alternative fails or is unsuitable.
- Can return a less valuable but still acceptable result.
- Can fail when no acceptable alternative remains.

### Example

```typescript
async function getProfilePicture(
  user: User
): Promise<ProfilePicture | null> {

  const custom = await getCustomPicture(user);
  if (custom) return custom;

  const social = await getSocialPicture(user);
  if (social) return social;

  const fallback = await getDefaultAvatar();
  if (fallback) return fallback;

  return null;
}
```

The function follows this hierarchy:

1. Custom profile picture.
2. Social profile picture.
3. Default avatar.
4. No useful value.

Each step provides an alternative way of obtaining an acceptable result.

### Appropriate Use Cases

- Multiple data providers.
- Cache retrieval with database fallback.
- Alternative image or content sources.
- Local-first applications.
- Remote synchronization.
- Services that support degraded operation.

### Important Considerations

A Ladder must have a meaningful priority order and a defined minimum acceptable result.

Not every alternative is necessarily a valid substitute.

For example, returning outdated financial information instead of current information might be misleading or dangerous unless the caller is explicitly informed about its age.

---

## 4. Estimation

### Definition

Estimation describes a function that produces an estimated value when an exact or directly known value is unavailable or cannot reasonably be obtained.

Instead of claiming certainty, the function provides its best available approximation based on available information, statistical models, historical observations, heuristics, or predictive algorithms.

The output may include additional information describing its uncertainty.

### Characteristics

- Produces an estimated or predicted value.
- Does not claim that the output is guaranteed to be exact.
- Can use incomplete information.
- Can include probability, confidence, uncertainty, or prediction intervals.
- Requires an appropriate interpretation of the uncertainty information.
- May be unable to produce an estimate if insufficient information is available.

### Example

```typescript
type Estimate<T> = {
  value: T;
  confidence: number;
};

function estimateDeliveryDate(
  order: Order
): Estimate<Date> {

  const prediction = deliveryModel.predict(order);

  return {
    value: prediction.date,
    confidence: prediction.confidence
  };
}
```

The function predicts a delivery date and provides a confidence measure.

The returned date is an estimate, not a guaranteed delivery date.

### Appropriate Use Cases

- Predicting delivery dates.
- Estimating project completion times.
- Forecasting demand.
- Estimating missing measurements.
- Machine learning predictions.
- Statistical forecasting.
- Estimating resource consumption.

### Important Considerations

Probability and confidence are not automatically interchangeable.

A probability should describe a clearly defined event. For example, an 85% probability of delivery by Thursday.

A confidence score may instead represent a model-specific measure of certainty or a ranking score.

A numeric score between 0 and 1 does not automatically represent a statistically valid probability.

Where reliability matters, estimates should be calibrated and evaluated against actual outcomes.

---

## 5. Throw

### Definition

Throw describes a function that propagates an exceptional failure instead of treating it as an ordinary output.

It is appropriate when an operation cannot continue according to its contract and the failure should be handled by an appropriate higher-level boundary.

The function does not convert the exceptional failure into an ordinary absence value or silently ignore it.

### Characteristics

- Propagates an exception or equivalent exceptional signal.
- Indicates that the operation could not complete according to its contract.
- Does not require every intermediate caller to handle the failure.
- Allows higher-level boundaries to catch, log, recover from, or terminate execution.
- Is appropriate for broken invariants and failures that cannot be meaningfully handled at the current level.

### Example

```typescript
function loadConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return {
    databaseUrl
  };
}
```

The application cannot operate without the required configuration.

Instead of returning an ordinary unsuccessful outcome, the function throws an exception.

The failure propagates to an appropriate application boundary.

### Appropriate Use Cases

- Missing mandatory configuration.
- Violated internal invariants.
- Corrupted state that makes continued execution unsafe.
- Unexpected programming errors.
- Failures that cannot be meaningfully recovered from at the current abstraction level.

### Important Considerations

Throw should not become the default mechanism for every unsuccessful operation.

Expected business outcomes, such as insufficient funds or an unavailable username, should generally be communicated through ordinary function outputs rather than exceptional failures.

Also, whether a technical failure is exceptional depends on the operation's contract. A database timeout might be an ordinary recoverable failure in one operation and an unrecoverable startup failure in another.

---

## 6. Neither

### Definition

Neither describes a function that performs an operation whose failure must not affect the main execution flow.

If the operation fails, the function handles the failure locally, preserves observability where appropriate, and continues without propagating an exception or returning an error to its caller.

The function is generally used for best-effort operations and non-critical side effects.

### Characteristics

- Does not propagate an ordinary failure to its caller.
- Does not return an error result for the contained failure.
- Handles the failure locally.
- Can log structured warnings or report failures through monitoring.
- Allows the primary operation to continue.
- Must not be used when the failed operation is necessary for correctness or safety.

### Example

```typescript
async function trackWithdrawal(
  event: WithdrawalEvent
): Promise<void> {

  try {
    await telemetry.send(event);
  } catch (error) {
    logger.warn(
      {
        code: "TEL-001",
        cause: String(error)
      },
      "Telemetry delivery failed"
    );
  }
}
```

The function attempts to send a telemetry event.

If telemetry fails, the failure is contained locally. The withdrawal operation is not interrupted simply because an optional analytics service is unavailable.

### Appropriate Use Cases

- Sending optional telemetry.
- Warming non-essential caches.
- Sending non-critical analytics events.
- Updating optional recommendations.
- Performing non-essential background tasks.
- Writing diagnostic breadcrumbs.

### Important Considerations

Neither does not mean silently ignoring failures.

Failures should remain observable through appropriate logging, monitoring, or other operational mechanisms.

It must not be used for operations whose successful completion is required for correctness, security, financial integrity, or user expectations.

For example, a failed financial transaction must never be treated as a Neither failure.

---

## 7. Comparison

| Strategy | Primary behavior | When unsuccessful |
|---|---|---|
| Shot | Attempts one intended output | Produces no useful value |
| Ladder | Tries ordered alternatives | Fails after exhausting alternatives |
| Estimation | Produces an approximate output | May be unable to estimate |
| Throw | Attempts an operation under an exceptional contract | Propagates an exception |
| Neither | Performs a best-effort operation | Contains the failure locally |

---

## 8. Choosing the Appropriate Strategy

The following questions provide a practical decision process.

### Question 1: Is the operation optional?

If the operation is non-critical and its failure must not interrupt the main flow, consider **Neither**.

### Question 2: Is the failure exceptional?

If the operation cannot continue according to its contract and the failure should propagate to a higher-level boundary, use **Throw**.

### Question 3: Does the function need to produce an approximate value?

If the output represents a prediction or approximation rather than a guaranteed value, use **Estimation**.

### Question 4: Can the function use alternative approaches?

If the function has multiple acceptable ways to produce a useful value, use **Ladder**.

### Question 5: Is there only one intended output?

If the function has one specific target and no fallback strategy, use **Shot**.

---

## 9. Combining Strategies

The five strategies describe different aspects of function behavior. They should not be treated as five mutually exclusive implementation mechanisms.

Some strategies can be combined when the function's responsibilities require it.

For example:

**Ladder + Estimation**

A delivery service might:
1. Retrieve a confirmed delivery date.
2. Retrieve a carrier-provided estimated date.
3. Calculate an estimated date using historical data.
4. Return no useful value if no acceptable result can be produced.

**Ladder + Shot**

A function might use a primary retrieval attempt and one or more fallback retrieval attempts, where each individual retrieval operation follows Shot.

**Neither + Ladder**

An optional background process might attempt multiple providers to warm a cache. If every provider fails, the failure is contained locally and the main application continues.

**Throw + Shot**

A function might attempt one specific operation and throw when a required invariant is violated.

These combinations demonstrate that the strategies can describe different levels of a function's behavior.

---

## 10. Design Principles

When applying these strategies, follow these principles:

1. **Make the contract explicit:** Callers should understand what a function promises to produce and what happens when it cannot.
2. **Preserve correctness:** Never return an alternative value that violates the function's requirements.
3. **Make degradation visible:** If a Ladder returns a lower-quality alternative, expose its source or limitations when relevant.
4. **Represent uncertainty honestly:** Estimates must not be presented as guaranteed facts.
5. **Keep exceptional failures exceptional:** Do not use Throw for ordinary business outcomes.
6. **Preserve observability:** Neither must not hide operational problems.
7. **Avoid unnecessary complexity:** Use the simplest strategy that satisfies the function's contract.
8. **Define recovery boundaries:** Make it clear which layer is responsible for handling propagated exceptions.

---

## 11. Final Summary

The five strategies provide a way to describe how functions behave when producing outputs or handling unsuccessful operations.

| Strategy | Core idea |
|---|---|
| **Shot** | One intended output, otherwise no useful value. |
| **Ladder** | Progressively seek acceptable alternatives. |
| **Estimation** | Produce an estimated value with appropriate uncertainty. |
| **Throw** | Propagate an exceptional failure. |
| **Neither** | Contain a non-critical failure and continue. |

Together, these strategies establish a practical vocabulary for function contracts, output behavior, failure propagation, fallback policies, and uncertainty.

The objective is not to force every function into a complicated framework. It is to make the function's behavior intentional, predictable, and understandable to the developers who use and maintain it.