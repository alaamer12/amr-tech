# Implementing the Five Function Outcome Strategies in TypeScript

## 1. Introduction

The five function outcome strategies describe different ways a function can produce a value or handle an unsuccessful operation:

1. **Shot** — Attempt to produce one specific value.
2. **Ladder** — Try alternative approaches until one produces an acceptable value.
3. **Estimation** — Produce an estimated value with appropriate uncertainty information.
4. **Throw** — Propagate an exceptional failure.
5. **Neither** — Handle a non-critical failure locally without interrupting the main execution flow.

These strategies are architectural concepts, not built-in TypeScript or Effect features.

This document demonstrates two ways to implement them:

- **Plain TypeScript:** Using ordinary types, functions, promises, and exceptions.
- **Effect:** Using Effect's typed error channel, `Option`, fallback operators, and failure-handling mechanisms.

The examples use Effect v4 APIs, released in [Effect 4.0](https://effect.website/blog/releases/effect/40). Effect v4 has a dependency-free core, and it renames several error-handling functions. The Effect examples below follow the v4 names, and the references at the end link to the v4 migration guide, the changelog, and the breaking-change notes.

---

## 2. Shared Types

Before implementing the strategies, let's define the types used throughout the examples.

```ts
interface User {
  id: string;
  name: string;
}

interface Picture {
  url: string;
}

interface Estimate<T> {
  value: T;
  confidence: number;
}

interface Config {
  databaseUrl: string;
}
```

For Effect examples, import:

```ts
import { Effect, Option } from "effect";
```

---

## 3. Shot

### Definition

Shot makes one attempt to produce a specific intended value.

It either produces the requested value or communicates that no useful value could be obtained. It does not try alternative approaches.

### Plain TypeScript

A simple implementation can use `null` to represent the absence of a value.

```ts
type Shot<T> = T | null;

function getUser(id: string): Shot<User> {
  const user = users.find(user => user.id === id);

  if (!user) {
    return null;
  }

  return user;
}
```

Checking the result with `=== null` works, but a small helper reads more clearly. An `absence()` helper reports whether a value is missing:

```ts
function absence<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}
```

Now the calling code becomes:

```ts
const user = getUser("123");

if (absence(user)) {
  console.log("User not found");
} else {
  console.log(user.name);
}
```

TypeScript narrows `user` to `User` in the `else` branch, so no extra check is needed.

Using `absence()` keeps the check readable and pairs well with `Shot<T>`.

For asynchronous operations, the same idea can be represented with `Promise<T | null>`.

```ts
async function getUser(id: string): Promise<Shot<User>> {
  const user = await database.findUser(id);

  return user ?? null;
}
```

### With Effect

Effect provides `Option` to represent a value that may or may not exist.

We can also keep technical failures separate from ordinary absence.

```ts
class DatabaseError extends Error {}

function getUser(id: string): Effect.Effect<
  Option.Option<User>,
  DatabaseError
> {
  return Effect.tryPromise({
    try: () => database.findUser(id),
    catch: () => new DatabaseError("Could not access database")
  }).pipe(
    Effect.map(user => Option.fromNullable(user))
  );
}
```

Usage:

```ts
const program = getUser("123").pipe(
  Effect.map(
    Option.match({
      onNone: () => "User not found",
      onSome: user => `Hello, ${user.name}`
    })
  )
);

Effect.runPromise(program).then(console.log);
```

### Comparison

| Plain TypeScript | Effect |
|---|---|
| `T \| null` | `Option.Option<T>` |
| `Promise<T \| null>` for asynchronous work | `Effect.Effect<Option.Option<T>, E>` |
| `null` represents absence | `Option.none()` represents absence |
| Exceptions or rejected promises represent technical failures | Typed error channel represents technical failures |

**Important:** Absence and technical failure are different outcomes. A user not existing is not the same as the database being unavailable.

---

## 4. Ladder

### Definition

Ladder attempts to produce the best available value by following an ordered hierarchy of alternatives.

If one approach cannot produce an acceptable result, the function moves to the next alternative.

It stops when it obtains a successful result or exhausts all alternatives.

### Plain TypeScript

We can create a reusable helper that accepts an ordered list of asynchronous strategies.

```ts
class PictureUnavailable extends Error {}

type Ladder<T> = T | null;

async function firstSuccess<T>(
  strategies: (() => Promise<T>)[]
): Promise<Ladder<T>> {

  for (const strategy of strategies) {
    try {
      return await strategy();
    } catch (error) {
      if (!(error instanceof PictureUnavailable)) {
        throw error;
      }
    }
  }

  return null;
}
```

Now we can implement our profile picture example:

```ts
async function getProfilePicture(
  user: User
): Promise<Ladder<Picture>> {

  return firstSuccess([
    () => getCustomPicture(user),
    () => getSocialPicture(user),
    () => getGooglePicture(user),
    () => getGravatarPicture(user),
    () => getDefaultPicture()
  ]);
}
```

The execution order is:

1. Try the custom picture.
2. If unavailable, try the social picture.
3. If unavailable, try the Google picture.
4. If unavailable, try Gravatar.
5. If unavailable, try the default picture.
6. If every source is unavailable, return `null`.

The helper only treats `PictureUnavailable` as a reason to try another source. Unexpected failures are allowed to propagate.

### With Effect

Effect provides `Effect.firstSuccessOf()` to execute multiple effects sequentially and return the first successful result.

```ts
class PictureUnavailableError extends Error {}

function getProfilePicture(
  user: User
): Effect.Effect<Picture, PictureUnavailableError> {

  return Effect.firstSuccessOf([
    getCustomPicture(user),
    getSocialPicture(user),
    getGooglePicture(user),
    getGravatarPicture(user),
    getDefaultPicture()
  ]);
}
```

The implementation is much shorter because Effect handles the fallback process.

If every source fails with the expected typed error, `Effect.firstSuccessOf()` propagates the last error.

If we want the function to return `Option.none()` instead, we can use `Effect.option()`:

```ts
function getProfilePicture(
  user: User
): Effect.Effect<Option.Option<Picture>> {

  return Effect.firstSuccessOf([
    getCustomPicture(user),
    getSocialPicture(user),
    getGooglePicture(user),
    getGravatarPicture(user),
    getDefaultPicture()
  ]).pipe(
    Effect.option
  );
}
```

Here, all typed failures are converted into `Option.none()`. This is appropriate when those failures all mean that an acceptable picture could not be obtained.

Unexpected defects are not converted into `Option.none()`.

### Comparison

| Plain TypeScript | Effect |
|---|---|
| A loop over ordered functions | `Effect.firstSuccessOf()` |
| `try/catch` handles expected unavailable results | Typed errors trigger fallback |
| Returns `null` after exhausting alternatives | Fails with the last error, or returns `Option.none()` with `Effect.option()` |
| Requires a custom fallback helper | Provides a built-in fallback operator |

**Important:** A Ladder must have a meaningful priority order. A fallback is not automatically acceptable just because it is available.

For example, returning outdated financial information instead of current information could be misleading.

---

## 5. Estimation

### Definition

Estimation produces an approximate or predicted value when an exact value is unavailable or cannot reasonably be obtained.

The result may include confidence, probability, uncertainty, or prediction intervals.

### Plain TypeScript

We can represent an estimate using a generic type.

```ts
type Estimate<T> = {
  value: T;
  confidence: number;
};
```

Example:

```ts
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

Usage:

```ts
const result = estimateDeliveryDate(order);

console.log(result.value);
console.log(result.confidence);
```

The function returns a predicted delivery date along with information about the prediction's confidence.

### With Effect

Effect can return the same estimate while also representing failures that may occur during prediction.

```ts
class EstimationError extends Error {}

function estimateDeliveryDate(
  order: Order
): Effect.Effect<Estimate<Date>, EstimationError> {

  return Effect.try({
    try: () => {
      const prediction = deliveryModel.predict(order);

      return {
        value: prediction.date,
        confidence: prediction.confidence
      };
    },
    catch: () => new EstimationError("Could not estimate delivery date")
  });
}
```

Usage:

```ts
const program = estimateDeliveryDate(order);

Effect.runPromise(program).then(console.log);
```

The successful output is still an `Estimate<Date>`, but Effect also describes the possible estimation failure in its type.

### Comparison

| Plain TypeScript | Effect |
|---|---|
| `Estimate<T>` | `Estimate<T>` |
| `Promise<Estimate<T>>` for asynchronous prediction | `Effect.Effect<Estimate<T>, E>` |
| Exceptions or rejected promises represent failures | Typed errors represent failures |
| Confidence is part of the returned value | Confidence is part of the returned value |

**Important:** Probability and confidence are not automatically interchangeable. A confidence score between 0 and 1 does not necessarily represent a statistically valid probability.

---

## 6. Throw

### Definition

Throw propagates an exceptional failure instead of treating it as an ordinary output.

It is appropriate when an operation cannot continue according to its contract and the failure should be handled by a higher-level boundary.

### Plain TypeScript

JavaScript and TypeScript provide `throw` directly.

```ts
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

The function either returns the required configuration or throws an exception.

The caller can handle it at an appropriate boundary:

```ts
try {
  const config = loadConfig();

  startApplication(config);
} catch (error) {
  console.error("Application startup failed", error);
}
```

Notice that the return type is simply `Config`. TypeScript does not encode the possibility of a thrown exception in this return type.

### With Effect

Effect distinguishes between expected typed failures and defects.

A defect represents an unexpected failure that is not part of the normal typed error channel.

We can use `Effect.sync()` to describe synchronous work that might throw.

```ts
function loadConfig(): Effect.Effect<Config> {

  return Effect.sync(() => {

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required");
    }

    return {
      databaseUrl
    };
  });
}
```

The thrown exception is captured as a defect by Effect rather than becoming a typed error.

Usage:

```ts
const program = loadConfig();

Effect.runPromise(program).catch(console.error);
```

The defect can also be inspected through Effect's failure-handling mechanisms.

### Comparison

| Plain TypeScript | Effect |
|---|---|
| `throw new Error(...)` | A defect, for example through `Effect.sync()` or `Effect.die()` |
| Exception propagates through the call stack | Defect propagates through the Effect runtime |
| Return type does not describe thrown exceptions | Defects are represented in Effect's `Cause`, not its typed error parameter |
| Catch at an appropriate boundary | Handle or inspect failures at an appropriate Effect boundary |

**Important:** `Effect.fail()` and `Effect.die()` are not interchangeable.

- `Effect.fail(error)` represents an expected, typed failure.
- `Effect.die(defect)` represents an unexpected defect.

If you want the failure to be part of the function's declared error type, use a typed error instead of a defect.

---

## 7. Neither

### Definition

Neither describes a best-effort operation whose failure must not interrupt the main execution flow.

The function handles the failure locally, preserves observability where appropriate, and continues.

It is useful for non-critical side effects such as telemetry and optional analytics.

### Plain TypeScript

We can use `try/catch` to contain the failure.

```ts
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

If telemetry fails, the error is handled locally.

The caller does not need to handle the telemetry failure, and the main operation can continue.

### With Effect

Effect provides `Effect.catch()` to handle typed failures. In Effect v4, `Effect.catchAll()` was renamed to `Effect.catch()`.

```ts
function trackWithdrawal(
  event: WithdrawalEvent
): Effect.Effect<void> {

  return Effect.catch(
    telemetry.send(event),
    error =>
      Effect.logWarning(
        `Telemetry delivery failed: ${String(error)}`
      )
  );
}
```

The failure is handled locally by logging a warning.

The resulting Effect no longer has the original typed error in its error channel.

Usage:

```ts
const program = trackWithdrawal(event);

Effect.runPromise(program);
```

### Comparison

| Plain TypeScript | Effect |
|---|---|
| `try/catch` | `Effect.catch()` |
| Handle the error locally | Recover from the typed error locally |
| `logger.warn()` | `Effect.logWarning()` |
| Function can resolve normally after failure | Effect can complete successfully after recovery |

**Important:** Neither does not mean silently ignoring failures.

Failures should remain observable through logging, monitoring, or another suitable mechanism.

Also, `Effect.catch()` handles typed failures, not defects. In Effect v4, if the cause also contains a defect, such as a finalizer that dies after the effect failed, the handler does not run. If you intentionally need to recover from defects too, use `Effect.catchDefect()` or `Effect.catchCause()`, which replaces v3's `Effect.catchAllCause()`. This should be used carefully.

---

## 8. Complete Comparison

| Strategy | Plain TypeScript | Effect |
|---|---|---|
| **Shot** | `T \| null` | `Option.Option<T>` |
| **Ladder** | Ordered functions + fallback helper | `Effect.firstSuccessOf()` |
| **Estimation** | `Estimate<T>` | `Effect<Estimate<T>, E>` |
| **Throw** | `throw` / exceptions | Defects, such as `Effect.die()` |
| **Neither** | `try/catch` + local handling | `Effect.catch()` |

The main difference is that plain TypeScript relies on ordinary language features and conventions, while Effect provides dedicated abstractions for representing and composing computations.

---

## 9. Important Design Considerations

### 9.1 Not Every Strategy Needs a Special Type

Some strategies have a natural type representation:

- Shot can use `T | null` or `Option<T>`.
- Estimation can use a generic `Estimate<T>` structure.

Other strategies describe behavior rather than a return type:

- Ladder describes how alternatives are attempted.
- Throw describes how exceptional failures propagate.
- Neither describes how failures are contained locally.

For example:

```ts
type Throw<T> = T;
type Neither<T> = T;
```

These aliases do not enforce throwing or failure containment. They are effectively the same type.

The behavior must be implemented through the function itself.

### 9.2 Expected Failures and Exceptional Failures Are Different

An unsuccessful operation does not always mean an exception should be thrown.

Consider these examples:

| Situation | Appropriate strategy |
|---|---|
| A requested user does not exist | Shot |
| A preferred image source is unavailable | Ladder |
| A delivery date must be predicted | Estimation |
| Required application configuration is missing | Throw |
| Optional telemetry cannot be delivered | Neither |

Choose the strategy based on the operation's contract, not simply on whether something went wrong.

### 9.3 The Strategies Can Be Combined

The five strategies are not mutually exclusive.

For example, a Ladder can contain several Shot operations:

```ts
async function getProfilePicture(
  user: User
): Promise<Picture | null> {

  return firstSuccess([
    () => getCustomPicture(user),
    () => getSocialPicture(user),
    () => getGooglePicture(user)
  ]);
}
```

Each individual retrieval is a Shot, while the overall function is a Ladder.

Similarly, an optional background process can use Ladder to try multiple providers and Neither to contain the failure if every provider is unavailable.

---

## 10. Final Summary

The five strategies describe different decisions about function behavior:

1. **Shot:** Make one attempt to produce the intended value.
2. **Ladder:** Try ordered alternatives until one succeeds.
3. **Estimation:** Produce an approximate value with uncertainty information.
4. **Throw:** Propagate an exceptional failure.
5. **Neither:** Contain a non-critical failure locally.

Both plain TypeScript and Effect can implement all five strategies.

The choice between them depends on the application's needs:

- Plain TypeScript is sufficient for many straightforward functions.
- Effect becomes useful when you need explicit error types, composable asynchronous operations, controlled failure propagation, and reusable recovery mechanisms.

The objective is not to introduce a library for every function. It is to make each function's behavior intentional, predictable, and clear to its callers.

---

## References

- [Effect 4.0 release post](https://effect.website/blog/releases/effect/40)
- [Effect v4 documentation — Getting Started](https://effect.website/docs/v4/getting-started/)
- [Effect v3 to v4 migration guide (MIGRATION.md)](https://github.com/Effect-TS/effect/blob/main/MIGRATION.md)
- [Error handling: `catch*` renamings](https://github.com/Effect-TS/effect/blob/main/migration/error-handling.md)
- [Effect changelog (packages/effect/CHANGELOG.md)](https://github.com/Effect-TS/effect/blob/main/packages/effect/CHANGELOG.md)