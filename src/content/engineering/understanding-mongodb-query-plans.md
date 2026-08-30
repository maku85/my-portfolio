---
title: "Understanding MongoDB Query Plans"
title_it: "Capire i query plan di MongoDB"
type: note
area: data
topics: ["mongodb", "mongoose", "query-planner", "indexes", "explain", "query-optimization", "esr-indexing-rule"]
description: "The reasoning behind mongoose-lens: how MongoDB builds a query plan, what explain() actually shows, and where a plan-reading heuristic stops being enough."
description_it: "Il ragionamento dietro mongoose-lens: come MongoDB costruisce un query plan, cosa mostra davvero explain() e dove un'euristica basata sulla lettura del piano smette di bastare."
date: "2026-08-26"
status: published
featured: true
slug: understanding-mongodb-query-plans
related: ["understanding-mongodb-index-selection", "understanding-mongodb-index-bounds"]
---

## Context

`mongoose-lens` does something deliberately narrow: it intercepts slow Mongoose
queries, runs `explain()` on them, flags two stages — `COLLSCAN` and a blocking
`SORT` — and proposes a compound index ordered by the ESR rule. Building that
meant deciding which signals in a query plan are safe to act on automatically and
which need a human. This note is the reasoning behind those choices, and where
the approach runs out of road. The index-selection mechanics are in the
companion note; here the focus is the plan itself and the limits of reading it.

Scope: single-collection reads, WiredTiger, MongoDB 6.x/7.x (core mechanisms
re-checked on 8.0.16, classic engine — unchanged). Not sharding, not the
aggregation framework beyond `$match` / `$sort`. Everything here is plan-reading;
the parts that need a benchmark to confirm are marked as such.

## Question

What can you actually conclude from a single `explain()` output, and what are you
only guessing at?

- How does MongoDB arrive at *the* plan it runs, and how stable is that choice?
- Which stages are unambiguous problems, and which are "it depends"?
- If a heuristic suggests an index from one plan, what could that suggestion
  break elsewhere?

## Investigation

The method here was to read plans, not to benchmark — so most of what follows is
mechanism, with the empirical parts called out explicitly.

- **Getting a plan.** `db.coll.find(query).explain("executionStats")` returns
  `queryPlanner` (candidate + winning plans) and `executionStats` (what actually
  happened for that run). `mongoose-lens` keys off `executionStats` because the
  stage tree alone doesn't tell you how bad a scan was.
- **Reading the winning plan.** It's a tree of stages executed leaves-first. The
  ones that matter: `IXSCAN` (an index was used; `indexBounds` shows how tight),
  `FETCH` (documents pulled by `_id` after an `IXSCAN`), `COLLSCAN` (every
  document examined), `SORT` (a blocking, in-memory sort — no index satisfied the
  `sort()`, so the full result set is materialised and ordered in memory, subject
  to the sort memory limit).
- **Numbers to compare.** `nReturned` vs `totalKeysExamined` vs
  `totalDocsExamined`. `keysExamined` ≫ `nReturned` usually means the index scan
  is wide — but discount a multi-interval `$in` (one boundary probe per interval)
  and a multikey index (one key per matching array element), where the gap is
  normal, not waste. `docsExamined` ≫ `nReturned` is the sharper signal: the
  `FETCH` is discarding rows a residual filter could not push down.
  `executionTimeMillis` is the headline and the most variable number.

> Done (companion lab, Experiment 06): swept a predicate from very selective to
> matching the whole collection and recorded `indexBounds` / `keysExamined` at
> each step. `keysExamined` tracks the interval width; the switch to `COLLSCAN`
> never happens on selectivity grounds alone — see the note below.

## Observations

Working model — the trial/cache mechanics and the `COLLSCAN` behaviour are
confirmed by testing; the blocking-`SORT` half is not yet:

- MongoDB enumerates candidate plans from indexes whose key pattern is compatible
  with the query, runs them in a short **trial**, and keeps the one that made
  progress with the least work. The winner is cached per query *shape* (the query
  with its values abstracted away).
- `explain()` is cache-free: it re-runs the planner on every call and reports the
  plan it would pick *now*, ignoring any cached entry (`isCached` stays false). So
  its plan is stable for fixed data and indexes — but it can still mislead two
  ways. It re-plans as the data or the specific values change, so a different
  parameter can yield a different `explain()` plan; and a *real* query may run a
  cached plan — chosen for an earlier data distribution and reused value-blind —
  that `explain()` will never show you. (Checked against `system.profile` in the
  companion lab, Experiments 04–08.)
- `COLLSCAN` and blocking `SORT` are the two stages almost always worth acting
  on: the first means no index was usable at all, the second means an index was
  usable for the filter but not for the order. Both are structural, not
  data-dependent — which is why a tool can flag them without running anything.
- `IXSCAN` is *not* automatically fine. An index scan with `keysExamined` far
  above `nReturned`, or followed by a large `FETCH`, is still a bad plan.

> Done (companion lab, Experiments 04–05): cold vs warm cache and
> `planCacheClear` behaviour — a plan is chosen by a trial, cached per *shape*,
> and then reused **value-blind** until the accumulated work overruns a
> `decisionWorks × ratio` budget and the shape is replanned. `explain()` never
> reads the cache, so "data vs cache" is only visible in `system.profile`
> (`fromPlanCache`) or the mongod log.
> TODO: verify with benchmark — a query sorting on `{ a: 1, b: 1 }` against an
> index `{ a: 1, b: -1 }`; confirm it forces a `SORT` and measure the cost
> against a matching-direction index.

## Technical details

**Query shape → index eligibility.** An index is a candidate when its key prefix
matches the query's equality and range predicates and, ideally, its later keys
match the sort. Equality predicates collapse the scan to a contiguous stretch of
the b-tree; a range predicate opens it; keys *after* a range key can't be used to
narrow further or to provide order.

**ESR.** Order compound index keys as **E**quality, then **S**ort, then
**R**ange: equality fields first pin the scan to one contiguous stretch; sort
fields next let the index return rows already ordered, removing the blocking
`SORT`; range fields last, because everything after a range is unusable for
equality or ordering. It's a heuristic, not a law — it degrades with two
independent range predicates, with `$in` (which sits between equality and range),
and when a covered query changes the trade-off.

**Why `COLLSCAN` / `SORT` are the automatable signals.** Neither depends on data
distribution: a `COLLSCAN` is a `COLLSCAN` at 1k or 1M documents, and a blocking
`SORT` always materialises the full result set. The *severity* scales with data,
the *diagnosis* doesn't — so a heuristic can name the problem and propose an
ESR-shaped index without executing a benchmark.

**Recognising a potentially problematic query, from the plan alone:**

- `COLLSCAN` on a collection that isn't tiny;
- a `SORT` stage;
- `totalKeysExamined` ≫ `nReturned` (wide index scan — after discounting a
  multi-interval `$in` and multikey de-duplication, where the gap is expected);
- `totalDocsExamined` ≫ `nReturned` (wasteful `FETCH` — rows dropped by a
  residual filter);
- `$or` where one branch has no usable index (can force a `COLLSCAN` for the
  whole query);
- a sort direction that doesn't match any index's key direction.

## Practical implications

- A tool can safely flag `COLLSCAN` and blocking `SORT` and propose an ESR index,
  because those are structural. It should not silently trust `IXSCAN` — the
  examined-vs-returned ratio has to be checked too.
- An index suggestion is a starting point for a human, not a migration. It has a
  write cost on every insert/update, it takes cache RAM, it may duplicate the
  prefix of an existing index, and it can shift the planner onto a worse plan for
  a different query shape.
- Because the plan cache exists, "it was fast before" is not evidence. Re-run
  `explain()` now, and again after the data grows or its distribution shifts.
- A slow-query interceptor never sees the queries just under the threshold, or
  the rare-but-catastrophic ones. Sampling only the slow queries is a biased view
  of the workload.

## Limitations

A heuristic that reads one `explain()` and suggests an ESR index has real blind
spots:

- **One sample, one parameter set.** `explain()` is a single execution with
  specific values against the current data. A different parameter, date range, or
  skew you didn't hit can produce a completely different plan. The suggestion is
  fitted to one point.
- **No write-side view.** It sees reads. It can't weigh the suggested index
  against write amplification, index build time on a live primary, or cache
  pressure.
- **Redundancy blindness.** Without inspecting the existing indexes it may
  propose something already covered by an existing compound index's prefix.
- **Global effects.** An index that fixes query A can make the planner choose a
  worse plan for query B — same shape, different selectivity.
- **Plan-cache coupling.** The slow execution that triggered the tool may have
  run on a stale *cached* plan, but the `explain()` the tool then runs is
  cache-free and shows a freshly planned one — so the two can disagree, and the
  real cause (a cache entry that outlived its data) never appears in the
  `explain()` output. `planCacheClear` plus a re-run is what exposes it.
- **Multikey and nested paths.** Arrays change index-bounds semantics: a
  two-sided range (`{$gte, $lte}`) on an array field is *not* intersected into
  one interval, `$all` is *not* an index intersection, and a compound index turns
  multikey the moment one key is an array. A suggestion derived from a scalar
  reading of the query can be wrong for a multikey field. (Companion lab,
  Experiment 08.)
- **`$or`, `$in`, negation.** ESR ordering and "just add the index" both get
  shakier here, and a simple reader can miss that one `$or` branch is unindexed —
  which forces a `COLLSCAN` for the *whole* query. (Companion lab, Experiment 07.)

> TODO: verify with benchmark — for a query with an obvious `COLLSCAN`, apply the
> ESR-suggested index and measure `executionTimeMillis` and `totalDocsExamined`
> before and after at ~1e4 / 1e5 / 1e6 documents. This is the one number that
> would justify the suggestion.
> TODO: verify with benchmark — construct a case where an index that fixes query
> A regresses query B (same shape, different selectivity), to quantify the
> "global effects" risk.

## Takeaways

- A query plan is chosen by trial and cached per shape. `explain()` itself is
  cache-free and re-plans every call, so it is stable for fixed data and indexes
  — but a real query may run a different, cached plan it will not reveal.
- `COLLSCAN` and blocking `SORT` are structural signals — safe to flag
  automatically. `IXSCAN` needs the examined-vs-returned check before you trust
  it.
- ESR is a reasonable default order for a suggested compound index, and a
  heuristic, not a rule.
- A plan-reading tool like `mongoose-lens` is a *detector*, not a fixer: it
  narrows where to look. The index decision still needs a human who can see the
  write cost, the existing indexes, and the other queries.
- Every claim in this note with a number attached is marked `TODO: verify with
  benchmark` until it's been run. The companion lab below has since discharged
  several; the ones still open are still marked.

## Evidence — companion lab

The claims here were later checked in a small, reproducible lab:
[**mongo-query-lab**](https://github.com/maku85/mongo-query-lab) — numbered
experiments on a deterministic seeded dataset (same seed → same data), each one
running `explain("executionStats")` with no `hint()` and committing the raw
output under `results/`. MongoDB 8.0.16, classic engine, single node. It is
plan- and counter-based, not a latency benchmark, and still in progress (the
`SORT`-interaction and aggregation experiments are not done yet).

Relevant so far:

- **01 — COLLSCAN vs IXSCAN**, **06 — Index bounds and the cost of a predicate**:
  `keysExamined` is index-bound-traversal work; equality → point bound, range →
  interval. The switch to `COLLSCAN` is binary on "does a usable index exist",
  not a selectivity threshold — a range matching the whole collection still used
  the index.
- **04 — Plan cache and query shapes**, **05 — Selectivity and cached-plan
  tolerance**: per-shape caching, value-blind reuse, and the
  `decisionWorks × ratio` replan frontier. `explain()` is cache-free and matches
  a real cache-free execution's counters.
- **07 — `$or` / SUBPLAN**: `$or` of equalities on one field is canonicalised to
  `$in`; across fields it is `SUBPLAN → OR` with per-branch `IXSCAN` and record-id
  dedup; one unindexed branch forces a `COLLSCAN` for the whole query, even if
  that branch matches nothing.
- **08 — Multikey indexes and array bounds**: multikey de-duplication
  (`keysExamined > docsExamined` is normal), the un-intersected two-sided range,
  `$elemMatch` vs dotted paths, `$all` is not an index intersection, and covering
  the scalar prefix of a multikey index.
