# The Poles

*Third document in this set. [State vs Condition](./state-vs-condition.md) defines two kinds of facts and the asymmetric ownership rule between them. [View & Rendition](./view-and-rendition.md) defines who is allowed to consult those facts and render something, and — in §7.2–7.3 — surfaces the gap this document exists to close. Read both first. This document defines only the tests and rules for the three placement poles; every worked-out example lives in [Worked Examples](./worked-examples.md), which this document links to rather than reproduces.*

*Assumes the roles defined in [`../base/architecture.md`](../base/architecture.md) — every pole below is a placement question about where a Component, Decoration, Aligner, or UI Element (as those roles are defined there) actually lives.*

---

## 1. The Gap

The base architecture ([`../base/architecture.md`](../base/architecture.md): Page → View → Component → Decoration/Aligner → UI Element) only ever described two placement poles for any piece of implementation:

```
GLOBAL   → lives in a shared, app-wide location (ui/elements, shared/conditions);
            purpose-agnostic; any feature, anywhere, may consume it.

LOCAL    → lives with its one owner; colocated; exactly one consumer, one call site.
```

This binary held for a long time because most real sharing situations really do resolve to one of the two. It broke on a concrete case: a Component (`_FundCard`, in the worked example) that is consumed by **more than one** sibling, and therefore isn't Local by the definition above — but has **no reason to exist for anyone outside that specific sibling set**, and therefore isn't Global either. Forcing it into either pole was wrong both times:

- Filed as **Local**, colocated inside one of its two consumers → the other consumer now reaches into a sibling's folder to import it, and the "single owner, single call site" premise of Local silently stops being true.
- Filed as **Global**, promoted to `ui/` or `components/` → it now sits alongside genuinely purpose-agnostic primitives (`Button`, `Input`) while itself being irreducibly specific to fund data. Anyone browsing `ui/` for a reusable primitive finds something that was never meant for them.

Neither placement was dishonest by accident — the model simply didn't have a slot for what actually happened. This document adds the missing slot.

---

## 2. The Three Poles

```
GLOBAL         → any feature, anywhere, may consume it; purpose-agnostic;
                  has a reason to exist independent of any specific consumer.

GLOBAL-LOCAL   → consumed by more than one sibling, but ONLY siblings belonging to
                  one closed, specific family; has no reason to exist, and no other
                  consumer, outside that family.

LOCAL          → exactly one consumer, one call site, one owner.
```

Global-Local sits between the other two not as a compromise or a "not sure yet" bucket, but as its own answer with its own test (§3). It is not "Global with fewer consumers" and not "Local with more consumers" — consumer *count* was never the deciding factor for any of the three poles. What decides is whether the thing has a reason to exist **beyond the specific set of siblings that currently use it**.

---

## 3. The Test

The same instinct this architecture already uses elsewhere — the companion document's "if I deleted every other View in the app, would this still happen?" (State vs Condition, §2) — extends directly to placement:

> **If every current sibling consumer were deleted, would this piece have any remaining consumer, or any reason to exist?**

- **Yes, anything in the app could plausibly consume it** → **Global**. Its purpose does not depend on which features currently happen to use it.
- **No — it would have no consumer and no reason to exist, but it is currently used by more than one sibling** → **Global-Local**. Its purpose is defined entirely by, and only by, that specific family.
- **There is only one consumer, period, now and by design** → **Local**.

This test is decided the same way ownership is decided elsewhere in this architecture (companion doc §5–6): by asking what the thing's reason for existing actually is, not by how many places currently reference it, and not by what it is named.

### The closed-family requirement

Global-Local requires the family of consumers to be a **closed, enumerable set** — in the worked example, exactly `FundCardListRendition` and `FundCardGridRendition`, and nothing else, by design. This is what distinguishes Global-Local from "Global, but I haven't found the third consumer yet." A piece is not Global-Local merely because it currently has two consumers and an uncertain future — that is just a Global candidate with insufficient evidence. Global-Local is the deliberate, permanent judgment that this piece's *entire reason for existing* is to serve one named, closed family, and that this will remain true even if the family's members change internally.

### 3.1 A Second Test: Tier-Locking, for Feature-Wide Folders

§3's test asks about *actual current consumers* of one specific file. That test is correct for a file sitting inside one View's own folder (`FundCardView/_FundCard.tsx` — its consumers are literally the two Renditions in that same folder, countable, real). It gives the wrong answer, though, for an entire **feature-level tier** — `funds/components/`, `funds/decorations/`, `funds/hooks/` — because a tier is not one file with a fixed set of consumers to count. It is a **designated pool**, built to serve every View `funds/` will ever have, whether that's one View today or ten next year. Applying §3's literal file-by-file consumer count to a tier folder produces the wrong reclassification pressure: it would keep asking "does this file have a second consumer *yet*?" and answering Local every time, right up until the moment a second View appears — at which point nothing about the file actually changed, only the count did. That instability is the signal that consumer-counting was never the right test for a tier; the tier's membership was decided by **where it was deliberately placed**, not by how many imports currently point at it.

So a second, independent test governs this case:

> **Was this folder deliberately created as the shared pool for one feature's Views, Components, Decorations, or hooks — regardless of how many currently exist inside it?**

- **Yes — it is a feature-level tier** (`funds/components/`, `funds/decorations/`, `funds/hooks/`) → **Global-Local, locked to that feature**, the moment something is placed there. This is true even for the first file ever placed in an otherwise-empty tier, and even if that file currently has only one consumer — the lock comes from the tier's designated role, not from a consumer count.
- **No — it lives inside one View's own folder** (`FundCardView/_FundCard.tsx`, `FundCardView/_FundCardActions.tsx`) → governed by §3's ordinary consumer test instead, scoped to that View alone.

These two tests are not in tension; they simply apply to different placements. §3 asks "how many things actually consume this one file?" — the right question inside a single View's folder, where consumers are few and countable. §3.1 asks "what pool was this folder designed to be?" — the right question one level up, at the feature's own `components/`/`decorations/`/`hooks/` folders, where the pool's membership is a design decision, not a running tally.

```
INSIDE a View's own folder         → §3's test: count actual current consumers.
                                       (FundCardView/_FundCard.tsx, FundCardView/_FundCardActions.tsx)

AT a feature's own tier folder     → §3.1's test: is this folder the feature-wide pool?
(funds/components/, funds/            If yes, everything placed there is Global-Local,
 funds/decorations/, funds/hooks/)     locked to that feature, regardless of current count.
```

One feature's tier is never shared with a sibling feature's tier of the same name. `funds/components/` and `checkout/components/` share a folder *name* but not a family — nothing in `checkout/` may reach into `funds/components/`, and nothing in `funds/` may reach into `checkout/components/`. Each tier's lock is scoped to the one feature it sits inside, never to `features/` as a whole and never to sibling features that merely share a naming convention. Sitting at the same visual depth in the tree, or sharing a folder name, is not itself evidence of any relationship — only actual placement inside one specific feature's tier locks something to that feature.

---

## 4. Why Global-Local Surfaced Where It Did — and Why It Isn't Limited to That Case

This is worth stating precisely, because it separates *why* Global-Local was first noticed from *what it actually applies to* — those turned out to be two different things.

**Where it was first noticed.** The View & Rendition document (§7.3) establishes one specific, named fact: Component and Rendition are **symmetric** with each other — a Component can be built from a Rendition and a Rendition can be built from a Component, with neither direction blocking or requiring the other, because neither one is a fact-producer (contrast State/Condition, which are **asymmetric**: one side may causally own an effect, the other may only read one it did not cause, companion doc §5). This is a fact about that one specific pair. It is not a claim that Decoration, Aligner, or UI Element belong to some broader "symmetric family" — no such family is asserted here. It is simply the case that the concrete example which first surfaced Global-Local (`_FundCard`, shared between two Renditions) happened to involve that specific pair.

**What Global-Local actually applies to.** The test in §3 — *would this piece have any remaining consumer or reason to exist if its current family of siblings were deleted?* — does not mention Views, Renditions, or any particular pair of roles. It is a general placement test, answerable for **any** two ordinary siblings that share an implementation, regardless of what roles they are or whether a View/Rendition split exists anywhere above them. [Worked Examples](./worked-examples.md) §2 works a second example that has no View, no Rendition, and no fact anywhere in it, specifically to demonstrate that Global-Local does not depend on the Component/Rendition symmetry that happened to introduce it — that symmetry made the *first* case easy to spot, but it is not a precondition for the pole to apply.

```
Component/Rendition symmetry:
    → a specific, narrow fact about one named pair — neither is a fact-producer,
      so composition between them has no forced direction.
    → this is what made the FundCard case easy to spot; it is not itself the rule
      that defines Global-Local.

Global-Local (§3's test):
    → a general placement test, asked per-relationship, about any two siblings
      that share implementation — with or without a View/Rendition anywhere near them.
    → applies wherever the test's question can honestly be asked; [Worked Examples](./worked-examples.md) §2 shows it
      applying to two ordinary Components with no View involved at all.
```

On the asymmetric side (State/Condition), by contrast, the test genuinely does not apply, for a reason specific to that pair: a State hook's ownership is already pinned to exactly one caller by the causation rule itself (companion doc §5) — there is no scenario of "two siblings legitimately sharing ownership of one State fetch," because ownership there was never a placement question to begin with, it was already answered by the create-vs-listen test. That is the one place in this architecture where Global-Local genuinely cannot arise — not because of some general "asymmetric roles never share," but because that specific pair's ownership question is pre-decided by causation before placement is ever asked.


---

## 5. Folder Placement Rule

```
GLOBAL         → shared/, ui/elements/, ui/renditions/ — anywhere the base architecture
                  or the companion documents already designate as the app-wide layer.
                  No lock. No family. Any feature may import.

GLOBAL-LOCAL   → two distinct configurations, governed by two distinct tests (§3, §3.1):

                  (a) INSIDE one View's own folder — colocated at the nearest common
                      ancestor of its closed family of actual consumers (§3's test:
                      count real consumers). Never promoted further out, never buried
                      inside one of its own siblings.

                  (b) AT a feature's own tier folder — features/<feature>/components/,
                      features/<feature>/decorations/, features/<feature>/hooks/ (§3.1's
                      test: is this folder the feature-wide pool?). Everything placed
                      here is locked to that one feature, regardless of current
                      consumer count — the lock comes from the tier, not a tally.

                  Convention either way: prefix with `_` only for configuration (a),
                  where the file sits directly beside the specific siblings it's
                  scoped to and needs to visually stand apart from them. Files in a
                  feature-wide tier (b) don't need the underscore — the tier folder
                  itself already signals the lock.

LOCAL          → colocated with its single owner, exactly as the base architecture
                  and companion documents already specify. This includes every file
                  living inside one View's own folder that only that View's Renditions
                  actually consume (§3's ordinary test) — being in the same feature as
                  other Views does not, by itself, promote anything to Global-Local;
                  only actual placement in the feature's own tier folder does.
```

**Two tests, not one — a common source of confusion worth restating.** §3 asks "how many things actually consume this specific file?" — correct for anything living inside a single View's own folder, where the file's siblings are few, named, and countable. §3.1 asks "was this folder deliberately built as the feature-wide pool?" — correct for a feature's own `components/`, `decorations/`, `hooks/` tiers, where membership is a design decision about the tier as a whole, not a running count of one file's current importers. Applying §3's consumer-count test to a whole tier folder gives an unstable, wrong answer (see §3.1 for why); applying §3.1's tier test to a file that simply sits beside its two actual consumers inside one View's folder would over-promote it for no reason — it isn't a feature-wide pool, it's two Renditions sharing one file. Which test applies is decided entirely by **where the file is placed**, never by guessing at its future.

**Sibling features never share a tier, even when the tier folder shares a name.** `features/funds/components/` and `features/checkout/components/` are two separate, independently-locked tiers that happen to be named `components/` by convention — nothing in `checkout/` may import from `funds/components/`, and nothing in `funds/` may import from `checkout/components/`. Being drawn at the same visual depth in a folder tree, or sharing a folder name, is never itself evidence of a relationship — only an actual import crossing between two files establishes one.

**Neither `features/` nor `funds/`/`checkout/` are fixed vocabulary.** Every example in this document writes `features/<name>/` because that's a common convention, but §3.1's test never checks for a folder literally named `features` — it asks whether a folder is "a feature's own tier," a question about role, not spelling. A project is free to call its top-level grouping `capabilities/`, `modules/`, `domains/`, `packages/`, or anything else, and to call an individual feature `funds` or `fund-management` or `wallet` — none of that changes which folders are tier-locked or to what. The only things that matter for §3.1 are: (1) is this folder deliberately the shared pool for one bounded unit of the app, and (2) is it a *sibling* unit's tier, in which case no lock crosses between them regardless of what either is named. The same caveat already applies to `shared/` and `ui/` in the worked trees below — those names are illustrative, not required.

---

## 6. Quick Reference

| Question | Answer | Pole |
| --- | --- | --- |
| Could any feature, anywhere, plausibly use this? | Yes | **Global** |
| Is this file inside one View's own folder, with more than one actual consumer in that same folder, and would it have zero remaining consumers if that closed family were deleted? | Yes | **Global-Local (a)** — §3's test |
| Is this file placed in a feature's own `components/`/`decorations/`/`hooks/` tier folder, built to serve any View that feature has or will have? | Yes | **Global-Local (b)** — §3.1's test, regardless of current consumer count |
| Is there exactly one consumer, by design, and is the file not placed in a feature-wide tier? | Yes | **Local** |
| Is the pair being placed a fact-producer (State/Condition)? | Yes | Not this model — see companion doc §5 for the asymmetric ownership rule instead |

---

## 7. The Complete Model

The base architecture's placement question was always: *where does this piece belong, and who is allowed to consume it?* That question had a two-value answer for as long as every real case happened to be either app-wide-and-purpose-agnostic or single-owner-and-bespoke. The FundCard case first proved a third, stable answer exists: **shared, but only within a closed family that is itself the entire reason the shared piece exists** — and [Worked Examples](./worked-examples.md) §2 confirmed that answer is general, holding just as well for two ordinary Components as it did for Component/Rendition. [Worked Examples](./worked-examples.md) §3 then showed that Global-Local itself has two configurations, governed by two different tests (§3 vs §3.1), depending on whether the shared piece sits beside its literal, countable consumers or sits at a feature's own deliberately-built tier.

```
                    PLACEMENT
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       GLOBAL      GLOBAL-LOCAL      LOCAL
   (any feature,    ┌────┴────┐      (one owner,
    purpose-        ↓         ↓       one call
    agnostic)      (a) View  (b) Tier  site)
                   -scoped,   -scoped,
                   §3's       §3.1's
                   consumer   design-
                   count      intent
                   test       test
```

This completes the placement model wherever either test can honestly be asked. The one documented exception is the State/Condition pair specifically (companion doc §5): there, ownership is pre-decided by causation before placement is ever asked, so neither test in this document has a case to apply to, and no third pole exists on that specific pair.

---

**Previous: [View & Rendition](./view-and-rendition.md)** — where the Global-Local gap was first surfaced (§7.2) and where the Component/Rendition symmetry that made it easy to spot was established (§7.3).
**See also: [State vs Condition](./state-vs-condition.md)** — the one pair this document's §4 confirms Global-Local does not apply to, and why.
**See also: [Worked Examples](./worked-examples.md)** — every tree and classification this document's rules are drawn from, consolidated in one place instead of repeated here.
**Built on directly by: [Wrapper Component](./wrapper-component.md)** (its placement is decided by the poles defined here), **[Specialised Component](./specialised-component.md)** (its base-Component underscore test cites §3 directly), and **[The Settled-Behavior Axiom](./settled-behavior-axiom.md)** (generalizes §3's closed-family requirement to behavior, not just consumers).
