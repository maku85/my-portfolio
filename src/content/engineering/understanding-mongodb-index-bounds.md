---
title: "Understanding MongoDB Index Bounds"
title_it: "Capire gli index bounds di MongoDB"
type: note
area: data
topics: ["mongodb", "indexes", "query-planner", "explain", "index-bounds", "multikey", "query-optimization"]
description: "What indexBounds contains for equality, range, $in, $or and multikey predicates, why keysExamined is the true cost of a filter, and the one case where a COLLSCAN is unavoidable."
description_it: "Cosa contiene indexBounds per predicati di uguaglianza, range, $in, $or e multikey, perché keysExamined è il vero costo di un filtro, e l'unico caso in cui un COLLSCAN è inevitabile."
date: "2026-08-30"
status: published
featured: false
slug: understanding-mongodb-index-bounds
related: ["understanding-mongodb-query-plans", "understanding-mongodb-index-selection"]
---

## Context

The two companion notes — *Understanding MongoDB Query Plans* and *Understanding
MongoDB Index Selection* — kept deferring the same question with a
`TODO: verify with benchmark`: once an index *is* used, how much work does a
given filter actually cost, and how is that decided? This note answers it for
`indexBounds`, from a small reproducible lab (numbered experiments on MongoDB
8.0.16). Where the other two are plan-reading, this one is measurement.

Scope: single-collection reads, WiredTiger, MongoDB 8.0.16, classic execution
engine, single node. Deterministic seeded datasets (a 300k-row scalar
collection, a 50k-row collection with array fields). Plan- and counter-based —
`keysExamined`, `docsExamined`, `nReturned`, `indexBounds`,
`dupsTested` / `dupsDropped`, `seeks` — not a latency benchmark. `$sort`,
aggregation, and how the plan cache reacts to a range shape are out of scope
(separate experiments).

## Question

- What does `indexBounds` actually contain for each predicate type — equality,
  range, `$in`, `$or`, `$elemMatch` — and the same on a multikey (array) index?
- Why is `keysExamined` usually the number that matters, and when does it
  diverge from `nReturned` for harmless reasons?
- When is a `COLLSCAN` the planner's only option, and when is "low selectivity
  forces a `COLLSCAN`" just a myth?
- Does one cost model — *you pay for the bound you traverse* — hold across all of
  these?

## Investigation

The method: one experiment per predicate family. Each builds its indexes, runs
`db.coll.find(...).explain("executionStats")` **cache-free** (a fresh multi-plan
every call, so the counters are a real execution's — spot-checked against
`system.profile`), with **no `hint()`**, and commits the raw `explain()` JSON.

- **Datasets are deterministic.** A seeded PRNG, same seed → same documents. A
  300k-row `users` collection for scalar predicates; a dedicated 50k-row
  collection with `tags` (string array), `scores` (number array) and `items`
  (array of sub-documents) for multikey.
- **What gets read.** The `winningPlan` stage chain, per-`IXSCAN` `indexBounds`
  and `keysExamined`, the `FETCH` / `IXSCAN` residual `filter`, and the
  `dupsTested` / `dupsDropped` counters on an `OR` or a multikey scan.
- **What "cost" means here.** `keysExamined` — index entries stepped over — plus
  `docsExamined` — documents pulled by the `FETCH`. Not milliseconds.

> Verified across the runs: for a cache-free query, `explain("executionStats")`
> counters equal the same query's `system.profile` entry (`fromPlanCache: false`).
> So everything below is the real execution, not an estimate.

## Observations

What the experiments settled:

- **`keysExamined` is bound-traversal work, not a row count.** An `IXSCAN` walks
  one contiguous stretch of the b-tree (or a few); `keysExamined` is how many
  index entries it stepped over. `nReturned` is what came out. They match only
  when the bound *is* the answer.
- **Every predicate type compiles to a bound with a known shape.** Equality → a
  point interval `["v", "v"]`. Range → one interval `[lo, hi]`. `$in` of N
  values → N point intervals. `$or` of equalities on one field → rewritten to
  `$in` *before* planning (same `queryHash`). `$or` across different fields → not
  a bound at all: a `SUBPLAN → OR` that runs one `IXSCAN` per branch and
  de-duplicates by record id.
- **A compound index bounds keys left to right, and a range closes the gate.**
  Leading equality keys pin the scan to one stretch; the first range key opens
  it; every key *after* a range becomes a residual filter, not a bound.
- **Two counters, two diagnoses.** `keysExamined` ≫ `nReturned` → the scan is
  wider than the answer (a loose bound, or a key after a range). `docsExamined` ≫
  `nReturned` → a residual filter is discarding fetched documents. Net of two
  benign contributions: an `$in` of N intervals costs N−1 boundary probes, and a
  multikey index examines one key per matching array element.
- **`COLLSCAN` means "no usable index", full stop.** For a range predicate the
  planner never switches to a `COLLSCAN` on selectivity grounds — a range
  matching the *entire* collection still rode the index. A `COLLSCAN` in an
  otherwise-indexed query means a predicate, or one `$or` branch, has nothing to
  stand on.

## Technical details

**Equality and range (Experiment 06).** Equality is a point interval;
`keysExamined ≈ nReturned`. A range is one interval whose width *is* the cost:
`keysExamined` tracks `|interval|`, independent of how many rows match after the
`FETCH`. In a compound index, a predicate on a key *after* the first range key
does not tighten the scan — it is attached to the `IXSCAN` or `FETCH` as a
`filter`, and shows up as `docsExamined` > `nReturned`.

**`$in` (Experiments 06–07).** N values → N point intervals, scanned as up to ~32
separate `seeks` before the planner coalesces adjacent ones. `keysExamined −
nReturned` for a clean `$in` is roughly N−1 — one boundary probe per interval
gap, not waste. `$in` *cardinality is abstracted from the query-shape hash*: `$in`
of 2 and `$in` of 3 produced the same `queryHash`, so a narrow `$in` and a wide
one map to one plan-cache entry.

**`$or` (Experiment 07).** `$or` of equalities on one field is canonicalised to
`$in` — identical `queryHash`, identical plan; branch order does not matter.
Across different fields it is `SUBPLAN → FETCH → OR → IXSCAN × N`, and the cost
composes:

- `totalKeysExamined` = the **sum** of the branches' `keysExamined` — an
  overlapping region is scanned in every branch that covers it;
- the `OR` stage de-duplicates by record id: `dupsTested = totalKeysExamined`,
  `dupsDropped` = the overlap, `docsExamined = totalKeysExamined − dupsDropped`.

`{a: E, $or: [{b: v1}, {b: v2}]}` with a compound `{a, b}` index collapses back
to a single `IXSCAN` with `$in`-style bounds on `b` — no `SUBPLAN`. Two
overlapping ranges on one field inside a `$or` merge into one interval. But
**one `$or` branch with no usable index turns the whole query into a
`COLLSCAN`** — the entire `$or` becomes a residual filter — and this holds even
when that branch matches zero rows.

**Multikey / array fields (Experiment 08).** Equality and `$in` on an array
field compile to the *same* bounds as scalar; the difference is at execution — a
document reached through several matching array elements is one index key per
element, then de-duplicated: `dupsTested − dupsDropped = docsExamined`. So
`keysExamined` > `docsExamined` on a multikey scan is normal, not a wide scan.

A **two-sided range** `{a: {$gte: x, $lte: y}}` on an array field is **not**
intersected into `[x, y]`. The planner scans one side and re-checks the other on
`FETCH`, because a document `a: [10, 90]` matches `{$gte: 40, $lte: 60}` (10 ≤ 60
*and* 90 ≥ 40) with no element in `[40, 60]` — scanning `[40, 60]` would miss it.
The result: it examines nearly 3× the keys of the equivalent one-sided range.
`{a: {$elemMatch: {$gte: x, $lte: y}}}` *does* get the tight `[x, y]` bound (one
element must satisfy both) — and also means something different: same element vs
any element.

`$all` is **not** an index intersection: it scans the most selective value's
point bound and applies the rest as a residual filter — byte-for-byte the same
plan as `$and` of two equalities on the field. `$elemMatch` on an array of
sub-documents binds both keys of `{"items.sku": 1, "items.qty": 1}`; the dotted
form `{"items.sku": ..., "items.qty": ...}` binds only the leading key and
filters the rest, and matches across elements rather than within one.

**Covering (Experiments 03, 08).** An index covers a query when every projected
path is a key and no document is needed (`PROJECTION_COVERED`, `docsExamined 0`).
A multikey index never covers a projection *of the array field* — it stores
elements, not the array — but still covers a projection of its *scalar prefix*,
at one index key per array element, so a pure-scalar index wins the plan if one
exists.

**The cost model.** `cost ≈ bound-traversal work`, where "the bound" is computed
per predicate type — equality → point, range → interval, `$in` → N points, `$or`
on one field → `$in`, `$or` across fields → sum of branches + de-dup, multikey
range → one-sided unless `$elemMatch`, a key after a range → residual filter, not
a bound. The model **composes**: an `OR` plan costs the sum of its branches' work
plus a hash-set de-dup; a multikey plan costs the tight-bound work plus
per-element de-dup.

## Practical implications

- Read `indexBounds` before trusting `keysExamined`. A bound wider than the
  predicate — a two-sided array range, a key after a range — explains the gap
  with no index actually "missing".
- For a range filter on an array field, wrap it in `$elemMatch`. It is the
  difference between scanning `[40, ∞)` and scanning `[40, 60]`, and it also
  fixes the same-element semantics you probably meant.
- A `COLLSCAN` in a query that has indexes is a diagnosis, not a mystery: find
  the predicate — or the `$or` branch — with no bound to stand on. Selectivity
  is a red herring here.
- `$or` of equalities on one field is just `$in`; write `$in`. `$or` across
  fields is strictly more expensive (two ranges scanned and deduped) — worth it
  only when the branches genuinely span different fields.
- Because `$in` cardinality does not change the shape, a narrow `$in` and a wide
  one share a plan-cache entry — a plan chosen for a tight `$in` can be reused
  for a much wider one.
- `docsExamined − nReturned` is the honest "wasted `FETCH`" number.
  `keysExamined − nReturned` needs the "is this `$in`, or multikey?" check first.

## Limitations

- **MongoDB 8.0.16, classic engine, these datasets.** "Observed in this lab", not
  "MongoDB always". The SBE engine was not exercised.
- **Scalar and single-array-field predicates only.** Nested arrays, parallel
  arrays (the "cannot index parallel arrays" error), `$size`, and negation
  (`$ne` / `$nin` / `$not`) on an array were not tested.
- **`$or` up to two branches.** Three or more, nested `$or`, and `$or` with
  `$elemMatch` were not tested.
- **No `$sort` here.** A separate experiment (09) covers blocking `SORT` vs
  index-provided order and shows the replan frontier fires the same way for a
  range bound width as for an equality's row count; `$elemMatch`'s
  `decisionWorks` is still untested.
- **Counters, not milliseconds.** Conclusions rest on `keysExamined` /
  `docsExamined` / `dupsDropped` / the stage chain, not `executionTimeMillis`.

> TODO: still open — an `$elemMatch` shape's `decisionWorks` in the plan cache;
> `$or` of 3+ branches with mixed indexability; array negation and `$size`; the
> SBE engine.

## Takeaways

- `indexBounds` has a predictable shape per predicate type; `keysExamined` is how
  far you walk that bound, not how many rows you get back.
- One model covers all of it: you pay for the bound you traverse. `$or` and
  multikey compose on top — sum of branches plus de-dup, one-sided unless
  `$elemMatch`.
- `keysExamined − nReturned` = loose bound or a key after a range;
  `docsExamined − nReturned` = a residual filter. Discount `$in` boundary probes
  and multikey de-duplication first.
- A `COLLSCAN` next to an index means a predicate has no bound to stand on —
  never a selectivity threshold.
- Wrap two-sided range filters on array fields in `$elemMatch`: tighter bound,
  and the semantics you meant.

## Evidence — companion lab

[**mongo-query-lab**](https://github.com/maku85/mongo-query-lab) — numbered,
reproducible experiments on a deterministic seeded dataset, each running
`explain("executionStats")` with no `hint()` and committing the raw output under
`results/`. MongoDB 8.0.16, classic engine, single node. Plan- and
counter-based, still in progress.

This note draws on:

- **03 — Covered queries and index-only execution:** when a projection reaches
  `PROJECTION_COVERED` and when a `FETCH` is unavoidable.
- **06 — Index bounds and the cost of a predicate:** point vs interval bounds,
  `keysExamined` as bound-traversal work, the trailing-key residual filter, and
  `COLLSCAN` vs `IXSCAN` as binary on index existence.
- **07 — `$or` / SUBPLAN and the unindexed-branch COLLSCAN:** one-field `$or` →
  `$in`, cross-field `$or` → `SUBPLAN → OR` with additive keys and record-id
  de-dup, and one unindexed branch → whole-query `COLLSCAN`.
- **08 — Multikey indexes and array bounds:** the un-intersected two-sided range,
  `$elemMatch` vs dotted paths, `$all` as scan-plus-filter, and covering the
  scalar prefix of a multikey index.
- **09 — `SORT`, range bounds, and the plan cache:** blocking-`SORT` cost is
  `rows_in × row_size` (the feeding scan's `keysExamined`, one stage up); the
  replan frontier fires the same way for a range bound width as for an
  equality's row count.
