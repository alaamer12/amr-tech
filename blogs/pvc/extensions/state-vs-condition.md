---
title: "State vs Condition"
order: 5
---


*Companion document: [View & Rendition](./view-and-rendition.md) — defines the layer that consumes State and Condition and turns them into rendered UI. Read this document first; it defines the two facts. The companion document defines who is allowed to look at those facts and render something.*

*Third document: [The Poles](./the-poles.md) — explains why the asymmetry defined below (§5) is a special case of a more general rule, and why that same rule produces no asymmetry at all on the Component/Rendition side.*

*Assumes the roles defined in [`../base/architecture.md`](../base/architecture.md) — a View, in the sense used throughout this document, is the base architecture's View ([`../base/architecture.md`](../base/architecture.md) §5) with the hooks described below attached to it.*

---

### 0. The Naming Rule — Read This First

> **`useXxxCondition()` and `useXxxState()` are hooks. They return a fact. They never return JSX.**

This is not a style preference — it's load-bearing for everything below. Earlier drafts of this document named JSX-returning functions `MaintenanceCondition`, `SearchState`, `SearchDisabledCondition`, `EtaLoadingState`. All of that was wrong, and has been corrected throughout this document. The reasoning:

- `Condition` names a fact about the world (`isOnline`, `isMaintenance`). A fact does not render — rendering is a decision made *after* consulting the fact.
- `State` names a fact about a request's own lifecycle (`"loading" | "success" | "error"`). Same reasoning: it's a value, not a view.
- The function that consults these facts and decides what to render is a **View**. What gets rendered is a **Rendition**. Both are defined in the companion document, because they're a different concern from this one — this document is only about the two kinds of *facts*, not about who renders them.

```
useXxxCondition()   → hook, fact only, never renders
useXxxState()       → hook, fact only, never renders
XxxView              → the ONLY function that both consults facts and selects a Rendition (companion doc)
XxxRendition         → JSX only, no hooks, no facts, pure props → markup (companion doc)
```

Every code example from here on follows this convention exactly.

---

### 1. The Boundary Statement

> **State** is what *this View's own data cycle* is doing right now.
> **Condition** is what *the outside world* is imposing on this View right now.

Both used to be lumped under the single word "state." They are kept apart because they differ on every axis that matters for where the code lives and who is allowed to touch it:

| | **State** | **Condition** |
| --- | --- | --- |
| Caused by | This View's own request/action | Something external (network, server, ops, permissions) |
| Lifespan | Finite, expected to resolve on its own | Indefinite, resolves only when the outside world changes |
| Who resolves it | The View itself, automatically | An external event (reconnect, deploy ends, role granted) |
| Typical values | idle, loading, success, error, empty | offline, maintenance, unauthorized, kill-switched, feature-off |

---

### 2. The One Question to Ask

> **"If I fixed this by waiting, would it resolve on its own — or does something outside this View have to change first?"**

- Resolves by *this View's own request finishing* → **State**
- Resolves by *something external changing* (reconnecting, maintenance ending, permission granted) → **Condition**

A second, faster check that gives the same answer:

> **"If I deleted every other View in the app, would this still happen?"**

- Yes, tied only to this View's own data → likely **State**
- No, it would happen to others too → likely **Condition** (see §4 — this only decides *scope*, not cause)

---

### 3. Decision Checklist

Walk through in order — stop at the first `yes`.

1. **Did *this View* trigger it by making a request or performing an action?**
   → Yes: it's **State**.
2. **Does resolving it require something outside this View's control** (reconnect, an ops team ending maintenance, a role being granted)?
   → Yes: it's **Condition**.

If still unsure, default to Condition — Conditions are the ones that quietly get miscast as State, because "the screen looks broken" in both cases. The cause, not the appearance, decides.

---

### 4. Cause Is Not Scope — Two Independent Axes

An early version of this guide assumed Condition always meant "global" and State always meant "local." That's false. **Cause** (who triggered it) and **Scope** (who else is affected) are independent:

```
                    LOCAL                        GLOBAL
              (one View/feature)           (every View at once)

CONDITION     Camera permission           Offline, Maintenance,
(external      denied, one widget          session expired,
 cause)        down, one feature flag      kill-switch

STATE         Search is loading,          App-level bootstrap
(internal      one form failed              fetch ("checking auth
 cause)        to submit                     on load") — rare, but
                                              still owned by one thing
                                              (the App shell), just
                                              the biggest one.
```

Reusability is a **third**, separate decision — "does the implementation file get shared, or does it stay bespoke to one place?" — orthogonal to both Cause and Scope. A local Condition (camera permission denied) can still be a reusable hook shared across camera/mic/location; a global Condition (`useAppKillSwitchCondition`) can still be a one-off, never reused. Scope decides *where it's consulted from*; reusability decides *where the hook lives*.

---

### 5. Nesting, and the Asymmetry in Ownership

Because State and Condition are both just facts consulted by a View, and Views can contain Views, a View that primarily reacts to a State can also own a nested State fetch triggered by a Condition, and vice versa. Both directions are real. **But they are not the same kind of relationship**, and treating them as symmetric is a mistake worth naming precisely.

> **A View reacting to a Condition may create and own a State, because resolving that Condition can legitimately require its own data fetch.**
> **A View reacting to a State may only read a pre-existing Condition, because a Condition by definition exists independently of any single View's request — nothing can "own" what it didn't cause.**

The test that exposes this: **does the hook's `useEffect` create the thing, or does it merely listen to a thing that already exists, before and after this View's lifetime?**

#### Condition owning a State — real composition

The maintenance ETA only exists *because* the View needed it to decide which Rendition to show. Nobody else needed that fetch; it is created and destroyed with this View:

```tsx
// hooks/useMaintenanceCondition.ts — fact only, PRE-EXISTS independently, never renders
function useMaintenanceCondition() {
    const [isMaintenance, setIsMaintenance] = useState(false);
    useEffect(() => {
        // subscribes to an external ops signal — does not create it, only listens
        const unsubscribe = subscribeToOpsChannel(setIsMaintenance);
        return unsubscribe;
    }, []);
    return { isMaintenance };
}

// hooks/useMaintenanceEtaState.ts — fact only, OWNED by whoever calls it, never renders
function useMaintenanceEtaState() {
    const [state, setState] = useState<"loading" | "success" | "error">("loading");
    const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/maintenance/eta", { signal: controller.signal })   // CREATES the request
            .then(r => r.json())
            .then(data => { setEtaMinutes(data.eta); setState("success"); })
            .catch(() => setState("error"));

        return () => controller.abort();   // DESTROYS it — scoped to this hook's caller
    }, []);

    return { state, etaMinutes, retry: () => setState("loading") };
}
```

*(How a View consults both of these hooks and selects a Rendition is shown in the companion document, §"Ownership in Practice" — this document only defines the facts themselves.)*

#### State reading a Condition — a dependency, not composition

`navigator.onLine` exists whether or not any particular View ever mounts. It was not created by any one View, will not be destroyed by any one View, and every View in the app could ask the same hook the same question and get the same answer:

```tsx
// hooks/useNetworkCondition.ts — fact only, PRE-EXISTS independently, never renders
function useNetworkCondition() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    return { isOnline };   // the browser's own signal — LISTENS, never creates
}

// hooks/useSearchState.ts — fact only, OWNED by whoever calls it, never renders
function useSearchState() {
    const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [results, setResults] = useState<Result[]>([]);
    const [error, setError] = useState<string | null>(null);
    // ...fetch effect, CREATED and DESTROYED with this hook's caller
    return { state, results, error, retry: () => {/*...*/} };
}
```

#### Why the asymmetry exists — the actual proof

This isn't a stylistic preference; it falls directly out of §1 and §4:

- A Condition's own resolution can genuinely *depend on a fetch* ("how long is this maintenance?" only makes sense as a question that arises from inside a View already reacting to the maintenance condition). That fetch has no reason to exist independent of that View — so the View legitimately **creates, scopes, and owns** it. That is real parent/child composition.
- A Condition, by definition in §1, is something that **exists independently of any single View's request**. That's not incidental — it's the defining property. A View reacting to State therefore cannot "own" a Condition, because ownership would require it to have caused the fact, and by definition nothing local ever causes a Condition. The most it can do is **read** — consult the current value of something it did not create and cannot destroy.

```
Condition → may own  → State      (legitimate composition: the resolving View caused the fetch)
State     → may only read → Condition  (a dependency, not composition: the View did not cause the fact)
```

This holds regardless of what the enclosing View is named — the asymmetry lives entirely inside the hooks (create vs. listen), not in the View's label. See companion doc §"Confirming the Asymmetry Is Naming-Independent" for the worked proof.

**Why this asymmetry exists at all, stated at the level of the whole architecture:** State and Condition are both **fact-producers** — each one is backed by a side effect (a fetch, a subscription) that was caused by *somebody*. Asymmetry only ever arises between a fact and its consumer, because "who caused the effect" has an unequal answer by construction — Condition, by definition (§1), precludes local causation, so a View can never stand in the "creator" position relative to it. This is not a general property of every pairing in the architecture. It is specific to fact-producing pairs. See [The Poles](./the-poles.md) for the contrasting case — Component and Rendition, which produce no facts and own no effects, and are therefore symmetric with each other in a way State and Condition can never be.

---

### 6. Where Each Hook Lives

**State hooks** — colocated with the View that owns the fetch:

```
features/search/hooks/useSearchState.ts
```

**Condition hooks** — placement follows Scope (§4), not Cause:

```
Global Condition hooks   → shared, ownerless
                            shared/conditions/useNetworkCondition.ts
                            shared/conditions/useMaintenanceCondition.ts
                            consulted from a View near app/route root

Local Condition hooks    → shared if reusable, still consulted per-feature
                            shared/conditions/useCameraPermissionCondition.ts

Non-reusable hooks        → stay inside whoever owns them, regardless of scope
                            app/shell/hooks/useAppKillSwitchCondition.ts   (global, bespoke)
                            features/checkout/hooks/usePaymentProcessingState.ts (local, bespoke)
```

Rule of thumb: **non-reusable always lives with its owner** (feature folder for local, `app/shell` for global). **Reusable always moves to a shared `conditions/`/`state/` folder**, and Scope is expressed purely by *which View consults it*, not by where the hook file lives.

---

### 7. The Tell in the Code Itself

- Writing a **global Condition check** inline inside many different Views means copy-pasting the same check everywhere. That duplication is the signal it should be consulted once, by one View near the root, instead.
- Writing a **State hook**'s logic at the root is impossible without that root somehow knowing about one specific feature's internal fetch — which breaks the point of the root being generic. That impossibility is the signal too.
- A View that tries to **mutate** a Condition it didn't cause (e.g. calling a setter for `isOnline` from inside a feature) is a defect — Conditions are read, never written, by the Views that consult them.
- A hook named with the `Condition` or `State` suffix that returns JSX is always wrong. No exceptions. See §0.

If a check feels awkward to place, that discomfort is diagnostic, not incidental.

---

### 8. Quick Reference

| Example | State or Condition? | Why |
| --- | --- | --- |
| Search results are loading | State | Caused by this View's own fetch; resolves when it completes |
| Search returned zero results | State | Outcome of this View's own request |
| Search request failed (500) | State | This View's own request failed; retry re-triggers the same request |
| Fetching a maintenance ETA, owned by a View reacting to `useMaintenanceCondition` | State (nested) | Caused, scoped, and killed by the View that owns it — real ownership |
| Reading `navigator.onLine` from inside a View reacting to `useSearchState` | Condition (read, not owned) | Existed before this View, will exist after — a read, not composition |
| Device has no internet | Condition | External; affects every View simultaneously; resolves outside the app |
| Server is in maintenance mode | Condition | External; ops-controlled |
| Camera permission denied | Condition (local) | External cause, but scoped to one feature, not the whole app |
| User's session expired / unauthorized | Condition | External to this View's own logic |
| A feature flag is off | Condition | Externally imposed, not tied to one View's request |

---

**Next: [View & Rendition](./view-and-rendition.md)** — how these facts get turned into what the user actually sees.
