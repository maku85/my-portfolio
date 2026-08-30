---
title: "Understanding MongoDB Index Selection"
title_it: "Capire la selezione degli indici in MongoDB"
type: note
area: data
topics: ["mongodb", "indexes", "query-planner", "explain", "esr-indexing-rule"]
description: "How MongoDB's query planner picks an index, what to read in explain output, and why a 'correct' index still gets ignored."
description_it: "Come il query planner di MongoDB sceglie un indice, cosa leggere nell'output di explain e perché un indice 'corretto' viene comunque ignorato."
date: "2026-08-26"
status: published
featured: false
slug: understanding-mongodb-index-selection
related: ["understanding-mongodb-query-plans", "understanding-mongodb-index-bounds"]
---

## Context

Index selection is the part of MongoDB I most often get wrong in hindsight. The
failure mode is usually the same: a query that looks like it should ride an index
either doesn't, or picks an index that examines far more keys than it returns.
This note is where I pin down the mental model so I stop re-deriving it under
pressure.

Scope: single-collection reads on WiredTiger, MongoDB 6.x/7.x (core mechanics
re-checked on 8.0.16, classic engine — unchanged). Not sharding, not
aggregation-pipeline optimization beyond `$match` / `$sort`.

> TODO: add the specific production case that triggered this note — collection,
> query shape, the symptom (latency spike / CPU / cache churn), and how it was
> first noticed.

## What I wanted to understand

- How the planner *chooses* among candidate indexes — the selection procedure,
  not "which index is best".
- Which fields in `explain()` output are signal and which are noise.
- When a `COLLSCAN` is a legitimate choice and when an `IXSCAN` is the actual trap.
- How the shape of a query (equality vs range vs sort) maps to whether an index
  is usable.
- Whether ESR is a rule or a heuristic, and the cases where it stops applying.
- Why an index that looks obviously correct gets ignored at runtime.
- What indexes actually cost, so "just add an index" isn't an automatic answer.

## Experiment / examples

Testbed collection (illustrative shape, not production data):

```js
// orders
{ _id, tenantId, status, createdAt, total, customerId, region }
```

Query families I care about:

```js
// A: tenant + status filter, newest first
db.orders.find({ tenantId: T, status: "open" }).sort({ createdAt: -1 })

// B: tenant + status filter, amount range
db.orders.find({ tenantId: T, status: "open", total: { $gte: 100 } })

// C: tenant + $or on status
db.orders.find({ tenantId: T, $or: [{ status: "open" }, { status: "hold" }] })
```

Candidate indexes to compare:

```js
{ tenantId: 1, status: 1, createdAt: -1 }   // ESR-shaped for A
{ tenantId: 1, createdAt: -1 }              // sort-friendly, weaker filter
{ tenantId: 1, status: 1, total: 1 }        // ESR-shaped for B
{ tenantId: 1, total: 1 }
```

Method: for each query, `db.orders.find(...).explain("executionStats")`; read
`queryPlanner.winningPlan`, `rejectedPlans`, and `executionStats`. Then repeat
with `.hint()` forcing each candidate to measure the delta.

> Partly done (companion lab — see the end of this note): a deterministic seeded
> collection with skew (`status` ~82% one value, Zipf-distributed tenants),
> recording `totalKeysExamined` / `totalDocsExamined` / `nReturned` / the stage
> tree / `indexBounds` per run. Not done: the 1e4 / 1e5 / 1e6 size sweep and the
> blocking-`SORT` case.
> Done (companion lab, Experiment 04): the winning plan does **not** differ
> between cold and warm cache — `explain()` always replans and ignores the cache;
> a real query's reuse of a cached plan shows only in `system.profile`.

## Observations

Working model — the trial-and-cache mechanics, the `COLLSCAN` rule and the
`SORT` interaction below are confirmed by testing:

- The planner enumerates candidate plans from indexes whose key pattern is
  compatible with the query shape, runs them in a short **trial** on real data,
  and keeps the one that makes progress with the fewest internal "works". The
  winner is cached per query shape.
- The `explain()` fields I actually read: the `winningPlan.stage` tree
  (`IXSCAN` → `FETCH` → `SORT`?), `totalKeysExamined` vs `nReturned` (key
  over-scan, net of `$in` interval-boundary probes and multikey duplication),
  `totalDocsExamined` vs `nReturned` (fetch amplification — rows a residual
  filter could not push down), the presence of `SORT` (the index did not provide
  order), and `indexBounds` (how tight the scan is).
- `COLLSCAN` is what you get when the collection is tiny or when **no usable
  index exists** — no index is a prefix of the query, an `$or` branch is
  unindexed, or the predicate is a negation. Low selectivity alone does **not**
  trigger it: with a usable index present the planner keeps the `IXSCAN` even
  when a range matches almost the whole collection — there is no selectivity
  crossover to `COLLSCAN` (companion lab, Experiment 06). `IXSCAN` is the trap
  when `totalKeysExamined` greatly exceeds `nReturned` (discounting a
  multi-interval `$in` and multikey de-duplication), or when it is followed by a
  large `FETCH` and a blocking `SORT`.

> TODO: for query A, record whether `{tenantId, status, createdAt}` beats
> `{tenantId, createdAt}` and by how much when `status` is highly skewed.

Since tested (companion lab, Experiment 07), on `$or`:

- Query C as written — `$or` of two equalities on the **same** field — is
  canonicalised to `{status: {$in: ["open", "hold"]}}` before planning: same
  `queryHash`, a single `IXSCAN` with multi-interval bounds, no `SUBPLAN`. `$or`
  and `$in` are interchangeable *only* in this one-field case.
- A `$or` across **different** fields is planned as `SUBPLAN → FETCH → OR →
  IXSCAN` per branch, deduplicated by record id — `totalKeysExamined` is the sum
  of the branches and `docsExamined = totalKeysExamined − dupsDropped`. One
  branch with no usable index demotes the **whole** query to a `COLLSCAN` with
  the `$or` as a residual filter, true even when that branch matches zero rows;
  adding an index on the offending field flips it straight back.

## What surprised me

Reproduced in the companion lab (Experiments 04–09, see the end of this note):

- **A cached plan is reused value-blind, well past the point it still fits.** The
  plan cache keys on the query *shape*, not the values; a plan chosen while one
  value was highly selective keeps serving a later query of the same shape whose
  value is not, until the accumulated work overruns a `decisionWorks × ratio`
  budget and the shape is replanned. `explain()` hides this — it always replans —
  so the regression only shows in `system.profile` (`fromPlanCache: true`) or the
  mongod log.
- **A multikey (array) index changes bounds semantics.** A two-sided range
  `{a: {$gte: x, $lte: y}}` on an array field is *not* intersected into `[x, y]`:
  the planner scans one side and re-checks the other on `FETCH`, so it examines
  *more* keys than the equivalent one-sided range. `{a: {$elemMatch: {$gte: x,
  $lte: y}}}` does get `[x, y]` — and means something different (one element vs
  any element). `$all` is not an index intersection either: it scans the most
  selective value and filters the rest. A compound index becomes multikey the
  moment one key is an array; it can still cover a projection of its scalar
  prefix, but never one of the array field.
- **Sort direction is per-pattern, not per-key.** A query sorting `{a: 1, b: 1}`
  against an index `{a: 1, b: -1}` *does* force a blocking `SORT` — but
  `{a: -1, b: 1}` (the index's exact mirror) does not, and neither does a
  single reversed sort key: the b-tree is walked backward. Only a *partial*
  direction conflict on a compound sort needs the `SORT`.
- **The planner will pick a much wider scan to avoid a blocking `SORT`.** For a
  `{range} + sort` query it keeps the selective-filter + `SORT` plan only while
  the range is very selective (~2%), then switches to a sort-supplying index
  that scans far more keys — because a blocking stage produces nothing during
  the trial, so a streaming plan out-ranks it. Add a `limit`, or an ESR index,
  or `hint` the selective one.

Still to reproduce:

- A less selective index winning the trial because it produced enough results
  within the work budget before a more selective plan "warmed up".

## Practical implications

- Design compound indexes around **query-shape families**, not individual fields.
  One well-ordered compound index usually beats several single-field indexes that
  the planner has to intersect — index intersection is rarely the plan you want.
- **ESR ordering** (Equality, Sort, Range) as a heuristic: equality predicates
  first collapse the scan to a contiguous b-tree range; sort fields next let the
  index supply order and skip a blocking `SORT`; a range predicate goes last
  because fields after a range can't be used for further equality or sort
  narrowing. It stops applying cleanly with two independent range predicates,
  with `$in` (which sits between equality and range), and when making the query
  covered changes the trade-off.
- Low-cardinality leading fields (booleans, a `status` with one dominant value)
  mostly cost index bytes and buy little selectivity — still occasionally worth
  it if they let the index satisfy the sort.
- A "correct" index gets skipped for concrete reasons: a type mismatch between
  the query value and the stored value (string vs number, `ObjectId` vs string),
  a collation mismatch, the index not being a prefix of what the query needs, an
  unindexed `$or` branch or a negation blocking index use, or a plan-cache entry
  chosen by a trial on an earlier — or unrepresentative — data distribution and
  still being reused. (The classic planner is trial-based, not statistics-based:
  it keeps no histograms, so "the estimate was wrong" is really "the trial
  sample, or the cached shape, no longer matches the data".) `hint()` is a
  diagnostic to identify which one — not a fix to leave in the code.
- The plan cache means "it was fast last week" is not evidence. Re-check
  `explain()` now, and again after data volume or distribution shifts.

## Takeaways

- Index selection = shape-compatible candidates → trial on real data → cheapest
  by "works" → cached per shape.
- Read `explain("executionStats")` for `keysExamined` / `docsExamined` vs
  `nReturned`, and for an unexpected `SORT`.
- ESR is a heuristic for compound key order, not a law — verify with `explain`
  and `hint`.
- Every index is paid for on every write and in cache RAM; adding one is a
  trade, not a free win.
- Anything with a measured number in it stays a TODO until I've run it myself —
  the companion lab below has since discharged several.

## Evidence — companion lab

[**mongo-query-lab**](https://github.com/maku85/mongo-query-lab) is where I put
these claims under test: numbered experiments on a deterministic seeded dataset
(same seed → same data), each running `explain("executionStats")` with **no
`hint()`** and committing the raw output under `results/`. MongoDB 8.0.16,
classic engine, single node. It reasons from plan shape and counters, not
latency, and is still in progress (the aggregation experiments are not done).

What it has settled so far, mapped to this note:

- **02 — Compound indexes and the ESR rule:** equality collapses the scan, a
  range opens it, keys after a range key stop narrowing — ESR holds, and frays
  exactly where the note says (`$in`, two ranges, covered).
- **03 — Covered queries:** when a projection makes `PROJECTION_COVERED`
  reachable and when a `FETCH` is unavoidable.
- **04 / 05 — Plan cache:** shape-compatible candidates → trial → cheapest by
  `works` → cached per shape → reused **value-blind** until a
  `decisionWorks × ratio` budget triggers a replan. `explain()` is cache-free.
- **06 — Index bounds:** `COLLSCAN` vs `IXSCAN` is binary on index existence, not
  a selectivity crossover.
- **07 — `$or` / SUBPLAN:** same-field `$or` → `$in`; cross-field `$or` →
  `SUBPLAN → OR`; one unindexed branch → whole-query `COLLSCAN`.
- **08 — Multikey / array bounds:** the un-intersected two-sided range,
  `$elemMatch` vs dotted paths, `$all` is not an intersection, and a multikey
  index still covering its scalar prefix.
- **09 — `SORT`, range bounds, and the plan cache:** an ESR index removes the
  blocking `SORT` (preferred even at equal `keysExamined`); sort direction is
  per-pattern (exact match or exact mirror), not per-key; the planner accepts a
  much wider scan to avoid a blocking stage; and the replan frontier fires the
  same way for a range bound width and a `$in` arity swing as for an equality's
  row count.

## Related topics

- Plan cache internals and `planCacheClear` as an operational lever.
- Blocking `SORT`, `allowDiskUse`, and the in-memory sort limit.
- Partial, sparse, and wildcard indexes — when each earns its keep.
- Multikey index semantics and `$elemMatch`.
- Covered queries, and when a projection changes the best index.
- Building indexes on a live primary without stalling writes.

## Related project: mongoose-lens

[`mongoose-lens`](https://github.com/maku85/mongoose-lens) is where I put this
analysis into an always-on check: it intercepts slow Mongoose queries, runs
`explain()` automatically, flags `COLLSCAN` / `SORT` stages, and suggests an
index ordered by the ESR rule. This note is the reasoning; `mongoose-lens` is the
guardrail that catches the same class of mistake before it reaches production.

> TODO: once the benchmark numbers exist, link the specific cases above back to
> concrete `mongoose-lens` output.
