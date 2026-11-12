---
thumbnail: ./v1-cover.jpg
---

# Shot, Ladder, and Estimation

## 1. Overview

Within the **Throw / Result / Neither (TRN)** error-handling model, Result defines how a function communicates an expected outcome or failure to its caller.

However, not all successful results are produced in the same way.

A function may:
- Attempt to produce one specific, useful value and fail if it cannot.
- Try multiple alternatives, progressively accepting less valuable results.
- Produce an estimated value when an exact value cannot be known.

To classify these behaviors, we introduce three Result Output Strategies:

1. **Shot** — Single-attempt result.
2. **Ladder** — Progressive fallback result.
3. **Estimation** — Probabilistic or uncertain result.

These strategies describe **how a function obtains and delivers its output**, rather than how it communicates errors.

---

## 2. Shot

### Definition

Shot is a result strategy in which a function attempts to produce one specific intended value.

The function either:
- Successfully produces the intended useful value.
- Fails to produce a useful value and returns an appropriate failure.

There is no fallback mechanism and no progressive degradation of the expected output.

### Characteristics

- Has one primary target outcome.
- Does not substitute alternative values when the intended value is unavailable.
- Returns a useful value on success.
- Returns an explicit failure when it cannot produce that value.

### Example

```typescript
function getUser(id: string): Result<User, DomainError> {
  const user = database.findUser(id);

  if (!user) {
    return err(userNotFound(id));
  }

  return ok(user);
}
```

The function either returns the requested user or communicates that the user does not exist.

It does not return another user's information, a default user, or an approximate user.

### Appropriate Use Cases

- Retrieving a specific database record.
- Validating a particular input.
- Performing a required calculation.
- Checking whether a specific resource exists.
- Executing a business operation with a clearly defined expected outcome.

---

## 3. Ladder

### Definition

Ladder is a result strategy in which a function attempts to produce the best available value through a predefined hierarchy of alternatives.

If the preferred approach cannot produce a useful result, the function moves to the next alternative.

This continues until:
- A sufficiently useful value is produced.
- All available alternatives are exhausted.

The function aims to maximize the usefulness of its output rather than requiring one exact source or method.

### Characteristics

- Has multiple possible output sources or strategies.
- Alternatives follow an intentional priority or quality order.
- A lower-priority alternative is attempted when a higher-priority alternative is unavailable or unsuitable.
- The returned value may have lower quality or completeness than the preferred value.
- Failure is returned only when no acceptable alternative remains.

### Example

```typescript
async function getProfilePicture(
  user: User
): Promise<Result<ProfilePicture, DomainError>> {

  const custom = await getCustomPicture(user);
  if (custom) return ok(custom);

  const social = await getSocialPicture(user);
  if (social) return ok(social);

  const defaultPicture = await getDefaultAvatar();
  if (defaultPicture) return ok(defaultPicture);

  return err(profilePictureUnavailable());
}
```

The function follows this priority:

1. User's custom picture.
2. Social profile picture.
3. Default avatar.
4. No useful value.

Each alternative provides a different level or source of value.

### Appropriate Use Cases

- Profile pictures and user-facing assets.
- Cache retrieval with database fallback.
- Multiple data providers.
- Content retrieval from alternative sources.
- Local-first applications with remote synchronization fallbacks.
- Services that support degraded operation.

### Important Consideration

A Ladder must have a meaningful fallback policy.

Not every available value is an acceptable substitute. Alternatives must preserve the minimum correctness and usefulness required by the caller.

For example, returning stale financial information as a fallback for current financial information may be unsafe unless its age and limitations are explicitly communicated.

---

## 4. Estimation

### Definition

Estimation is a result strategy in which a function produces an estimated value rather than claiming to have obtained an exact or guaranteed value.

The output represents the function's best available estimate based on incomplete information, statistical models, historical observations, heuristics, or other predictive methods.

Where appropriate, the estimate includes uncertainty information, such as a probability, confidence measure, or prediction interval.

### Characteristics

- Does not require an exact or directly observable value.
- Produces an estimated or predicted output.
- Can include a measure of uncertainty.
- The estimated value must not be presented as a guaranteed fact.
- The uncertainty measure must have a clearly defined meaning.

### Example

```typescript
type Estimate<T> = {
  value: T;
  confidence: number;
};

function estimateDeliveryDate(
  order: Order
): Result<Estimate<Date>, DomainError> {

  const prediction = deliveryModel.predict(order);

  return ok({
    value: prediction.date,
    confidence: prediction.confidence
  });
}
```

The function returns a predicted delivery date alongside a confidence measure.

The date is an estimate, not a guaranteed delivery date.

### Appropriate Use Cases

- Predicting delivery dates.
- Estimating project completion times.
- Predicting demand.
- Estimating missing or unavailable measurements.
- Statistical forecasting.
- Machine learning predictions.
- Reconstructing values from incomplete information.

### Important Considerations

**Probability and confidence are not interchangeable.**

A probability should describe a clearly defined event, such as:

- There is an 85% probability that delivery will occur by Thursday.

A confidence score may instead represent a model-specific measure of certainty or a ranking score.

A value between 0 and 1 does not automatically represent a statistically valid probability.

Where statistical reliability matters, estimates should be calibrated and evaluated against actual outcomes.

---

## 5. Comparison

| Characteristic | Shot | Ladder | Estimation |
|---|---|---|---|
| Primary objective | Obtain a specific value | Obtain the best available value | Predict or approximate a value |
| Output sources | One intended target | Multiple alternatives | Model, observations, or assumptions |
| Fallbacks | None | Yes | Not required |
| Exactness | Intended exact value | Depends on selected alternative | Not guaranteed |
| Failure possibility | Yes | Yes, after exhausting alternatives | Yes, if estimation is impossible |
| Uncertainty | Usually not represented | May vary by alternative | Explicitly represented where appropriate |

---

## 6. Relationship Between the Three Strategies

These strategies describe different ways of producing a Result. They should not automatically be considered mutually exclusive.

For example, a Ladder may use an Estimation strategy as one of its fallback alternatives.

Consider a delivery-date service:

1. Retrieve the confirmed delivery date.
2. If unavailable, retrieve a carrier-provided estimated date.
3. If unavailable, calculate an estimated date using historical delivery data.
4. If no meaningful estimate can be produced, return a failure.

This combines Ladder and Estimation.

Therefore:

- **Shot** describes a single intended output path.
- **Ladder** describes progressive alternatives.
- **Estimation** describes the epistemic nature of an output: it is estimated rather than known exactly.

They are useful classifications, but they do not necessarily represent three mutually exclusive execution models.

---

## 7. Relationship With Throw / Result / Neither

The three output strategies belong inside the broader Result contract.

They do not replace the TRN classification.

TRN determines how a failure is communicated:

- Throw: propagate an exceptional failure.
- Result: return an explicit success or failure.
- Neither: contain a non-critical failure locally and continue.

Shot, Ladder, and Estimation describe the behavior of functions that use Result.

For example:

| Scenario | TRN Contract | Output Strategy |
|---|---|---|
| Retrieve a specific user | Result | Shot |
| Retrieve an image using alternative providers | Result | Ladder |
| Predict a delivery date | Result | Estimation |
| Retrieve a cached value, then fall back to a database | Result | Ladder |
| Send optional analytics | Neither | Not applicable |

A function's output strategy should be selected independently of its failure-reporting contract.

---

## 8. Design Principles

When implementing these strategies, follow these principles:

1. **Preserve correctness:** A fallback must not introduce an invalid or misleading value.
2. **Make degradation visible:** When a Ladder returns a lower-quality alternative, expose its source or quality when that information matters.
3. **Represent uncertainty honestly:** An estimate must never be presented as a guaranteed value.
4. **Do not hide failures:** Exhausting all acceptable alternatives should produce an explicit failure when the operation requires a useful result.
5. **Keep contracts explicit:** Callers should understand whether they are receiving an exact value, a fallback, or an estimate.
6. **Avoid unnecessary complexity:** Use Shot when one outcome is sufficient. Do not introduce a Ladder or Estimation mechanism without a real need.

---

## 9. Summary

The Result Output Strategies provide a way to classify how a function produces useful values:

- **Shot:** One intended value, otherwise failure.
- **Ladder:** Progressively seek acceptable alternatives until a useful value is found or all alternatives are exhausted.
- **Estimation:** Produce an estimated value and represent its uncertainty appropriately.

Together, they provide a vocabulary for describing not only whether a function succeeds, but also the nature and quality of the value it delivers.