---
title: "PostgreSQL Index and Query Planner Experiment"
title_it: "Esperimento su indici e query planner in PostgreSQL"
type: experiment
area: data
topics: ["postgresql", "indexes", "query-planner", "explain", "performance-tuning"]
description: "A local Docker + Node.js protocol for watching how PostgreSQL's planner changes the chosen plan as b-tree, composite, partial, covering, BRIN, expression and GIN indexes are introduced for a fixed set of query shapes."
description_it: "Un protocollo locale Docker + Node.js per osservare come il planner di PostgreSQL cambia il piano scelto introducendo indici b-tree, composti, parziali, covering, BRIN, su espressione e GIN per un insieme fisso di query."
date: "2026-08-26"
status: draft
featured: false
slug: postgresql-index-planner-experiment
related:
  ["understanding-mongodb-query-plans", "understanding-mongodb-index-selection"]
---

This is the **design only**. Nothing has been run yet — the "Results" section is
empty on purpose and no numbers are claimed anywhere. The point is to fix the
protocol tightly enough that the eventual technical note rests on real output.

## 1. Research question

As different index types are added, one at a time, for a fixed set of query
shapes on a fixed dataset:

- **How** does the PostgreSQL planner change the chosen plan (node tree, scan
  type, presence of a Sort)?
- **How predictably** — can the change be anticipated from the index definition
  and the query shape alone?
- **Which** plan changes translate into a real drop in execution time, and which
  are just a different plan at similar cost?
- Where a predicate's selectivity is varied, is there a threshold at which the
  plan flips between a sequential scan and an index-based scan?

## 2. Hypothesis

Directional predictions, to confirm or refute — no magnitudes asserted:

- **H1** — For each query family there is exactly one index configuration where
  the planner switches away from `Seq Scan` **and** execution time drops
  materially. Other configurations either don't change the plan or change it
  without improving time.
- **H2** — Removing the blocking `Sort` for the "filter + `ORDER BY` + `LIMIT`"
  query requires a composite b-tree with the equality columns first and the sort
  column last (matching direction). A single-column index on the filter alone
  does not.
- **H3** — For the same indexed query, the plan flips between `Seq Scan` and an
  index-based scan as the predicate's selectivity crosses some threshold.
- **H4** — A covering (`INCLUDE`) index yields an `Index Only Scan` only when the
  visibility map is current (after `VACUUM`); otherwise it degrades to
  `Index Scan` with heap fetches.
- **H5** — BRIN on the time column beats a b-tree for a wide range scan and loses
  for a narrow one, given that physical row order correlates with the time column.

## 3. Dataset

One table, `~1,000,000` rows, generated deterministically (fixed seed / index
`i = 0..N-1`) so the run is reproducible. Small enough to sit in a local
container; large enough that `Seq Scan` and `Index Scan` costs clearly diverge.

Row generation rules (from `i`):

| column | rule | intent |
| --- | --- | --- |
| `tenant_id` | `i % 5 < 2 → 1`, else `2 + (i % 49)` | one "hot" tenant holds ~40% of rows; 49 normal tenants — drives selectivity |
| `status` | `i%100 < 90 → 'active'`, `< 98 → 'archived'`, else `'deleted'` | heavy skew — for the partial index |
| `created_at` | `base_ts + i * interval '1 second'` | strictly increasing → correlates with physical order (BRIN) |
| `amount` | `((i * 2654435761) % 100000) / 100.0` | pseudo-uniform `0..1000` — range predicates |
| `email` | `'user' || (i % 250000) || '@ex.com'`, half with an uppercase first letter | ~250k distinct, mixed case — expression index |
| `tags` | `{}` for ~94%, `{'flagged'}` ~5%, `{'flagged','urgent'}` ~1% | for GIN |
| `region` | `(ARRAY['eu','us','apac'])[1 + i % 3]` | composite second column |

Load with `COPY` from the Node harness. Then `VACUUM (ANALYZE) events;`. Disable
autovacuum on the table for the run.

## 4. Schema

```sql
CREATE TABLE events (
  id          bigserial PRIMARY KEY,
  tenant_id   integer       NOT NULL,
  status      text          NOT NULL,   -- 'active' | 'archived' | 'deleted'
  created_at  timestamptz   NOT NULL,
  amount      numeric(12,2) NOT NULL,
  email       text          NOT NULL,
  tags        text[]        NOT NULL DEFAULT '{}',
  region      text          NOT NULL
);
-- only the PK exists at baseline; all experiment indexes are ix_exp_*
```

## 5. Queries

Parameters are fixed per family. Q7 is the deliberate exception (selectivity is
its independent variable).

```sql
-- Q1  tenant dashboard: filter + ordered + limited
SELECT id, amount, created_at
FROM events
WHERE tenant_id = $1 AND status = 'active'
ORDER BY created_at DESC
LIMIT 20;                                   -- $1 = 2 (normal tenant)

-- Q1b same body, $1 = 1 (hot tenant, ~40% of rows) — selectivity contrast

-- Q2  equality on skewed column + range
SELECT count(*) FROM events
WHERE status = 'active' AND amount > 900;

-- Q3w wide range (~10% of rows)     |  Q3n narrow range (~0.1%)
SELECT count(*) FROM events
WHERE created_at BETWEEN $1 AND $2;

-- Q4  expression predicate
SELECT id FROM events WHERE lower(email) = 'user123@ex.com';

-- Q5  array containment
SELECT count(*) FROM events WHERE tags @> ARRAY['flagged'];

-- Q6  index-only-scan candidate (only indexed/INCLUDEd columns touched)
SELECT tenant_id, status, sum(amount)
FROM events
WHERE tenant_id = $1 AND status = 'active'
GROUP BY tenant_id, status;                 -- $1 = 2

-- Q7  selectivity sweep: Q1 body with tenant_id = $1 for
--     $1 in { hot tenant, a mid tenant, a rare tenant }
```

## 6. Indexes to compare

Each configuration is tested **in isolation**: `DROP INDEX IF EXISTS ix_exp_*` →
create the config's index(es) → `VACUUM (ANALYZE) events;` → measure.

| id | definition | targets |
| --- | --- | --- |
| C0 | *(none — PK only)* | baseline |
| C1 | `ON events (tenant_id)` | Q1, Q7 |
| C2 | `ON events (tenant_id, status, created_at DESC)` | Q1, Q1b, Q6 |
| C3 | `ON events (status, tenant_id)` | column-order contrast vs C2 |
| C4 | `ON events (tenant_id, created_at DESC) WHERE status = 'active'` | Q1, Q2 (partial) |
| C5 | `ON events (tenant_id, status) INCLUDE (amount, created_at)` | Q6 (covering / IOS) |
| C6 | `USING brin (created_at) WITH (pages_per_range = 32)` | Q3w, Q3n |
| C7 | `ON events (created_at)` | Q3w, Q3n (BRIN contrast) |
| C8 | `ON events (lower(email))` | Q4 |
| C9 | `USING gin (tags)` | Q5 |

A final control run with **all** `ix_exp_*` present, to observe planning-time
growth and any cross-query plan changes.

## 7. EXPLAIN / EXPLAIN ANALYZE to use

Two forms per (query × config):

```sql
-- plan shape + estimates + active planner settings, no execution
EXPLAIN (FORMAT JSON, SETTINGS) <query>;

-- real timings, actual rows, buffers, per-node detail
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS, FORMAT JSON) <query>;
```

- Run the `ANALYZE` form **6 times** per case; discard run 1 (cache priming);
  aggregate runs 2–6 (median + min/max) on `Execution Time`.
- Read `Planning Time` and `Execution Time` as separate numbers.
- For Q6, read `Heap Fetches` on the scan node to confirm/deny `Index Only Scan`.
- Parse the JSON tree, don't scrape text — record the node-type path of the
  winning plan.
- `EXPLAIN (ANALYZE)` instrumentation adds overhead; treat all timings as
  comparative, not absolute.

## 8. Metrics to collect

One record per (query, config, run-aggregate), appended to `results/*.jsonl`:

| metric | source |
| --- | --- |
| winning-plan node path (e.g. `Limit → Index Scan`) | `Plan` tree |
| estimated total cost | `Total Cost` |
| estimated rows vs actual rows | `Plan Rows` / `Actual Rows` |
| execution time — median / min / max (ms) | `Execution Time` over runs 2–6 |
| planning time (ms) | `Planning Time` |
| shared hit / read blocks | `Shared Hit Blocks` / `Shared Read Blocks` |
| `Sort` present? method? | `Sort` node `Sort Method` |
| heap fetches (Q6) | `Heap Fetches` |
| rows removed by filter / index recheck | `Rows Removed by Filter` / `... by Index Recheck` |
| bitmap lossy? | recheck rows > 0 with a Bitmap Heap Scan |
| index size (MB) | `pg_relation_size('ix_exp_…')` |
| `pg_stats.correlation` for `created_at` | `pg_stats` (BRIN sanity) |
| plan changed vs C0? | derived |

## 9. Variables to keep constant

- **PostgreSQL image** pinned to an exact patch (e.g. `postgres:16.4`); a mounted
  `postgresql.conf` with fixed values, all echoed back via `EXPLAIN (… SETTINGS)`:
  `shared_buffers = 256MB`, `effective_cache_size = 1GB`, `work_mem = 16MB`,
  `random_page_cost = 1.1` (SSD assumption — pinned, **not** the default 4),
  `seq_page_cost = 1.0`, `max_parallel_workers_per_gather = 0` (deterministic
  plans; a parallel pass is a follow-up, not the baseline), `jit = off`,
  `default_statistics_target = 100`.
- **Dataset**: fixed seed, `N = 1,000,000`, distributions exactly as in §3.
  Regenerate identically, or snapshot the data volume between configs.
- **One index config at a time.** `DROP INDEX IF EXISTS ix_exp_*` before each.
- `VACUUM (ANALYZE) events;` after load and after every `CREATE INDEX`, before
  measuring. Autovacuum off during the run.
- Single connection, autocommit, no concurrent clients, no long-lived snapshot.
- Same host, no other DB or heavy CPU load.
- Query parameters fixed per family (Q7 excepted).
- Same warm-up discipline (discard run 1) for every case.

## 10. Expected observations

Predictions to check against the JSON — not results:

- **C0** — `Seq Scan` everywhere; Q1 also gets a top-N `Sort` before `Limit`.
- **C1** (`tenant_id`) — Q1 for a normal tenant: `Bitmap Index Scan` +
  `Bitmap Heap Scan` + `Filter(status)` + `Sort` + `Limit`. Likely no help for
  Q1b (hot tenant ≈ 40% → `Seq Scan` may still win).
- **C2** (`tenant_id, status, created_at DESC`) — Q1 / Q1b-normal: `Index Scan`,
  **no `Sort`**, `Limit` stops early; expected cheapest for Q1. Q1b (hot tenant)
  may stay on `Seq Scan` — confirm.
- **C3** (`status, tenant_id`) — worse than C2 for Q1: leading with
  `status = 'active'` (~90%) barely narrows.
- **C4** (partial `WHERE status = 'active'`) — smallest index; used for
  Q1(active) / Q2; the planner should **refuse** it for a `status = 'archived'`
  query — verify.
- **C5** (covering) — Q6 → `Index Only Scan` with `Heap Fetches ≈ 0` *iff* the
  post-`CREATE` `VACUUM` ran; otherwise `Index Scan` + many heap fetches.
- **C6** (BRIN) — Q3w: BRIN bitmap scan, index in KB not MB. Q3n: planner likely
  prefers C7 (if present) or falls back to `Seq Scan`. Check
  `pg_stats.correlation(created_at) ≈ 1`.
- **C7** (b-tree `created_at`) — Q3n: `Index Scan`. Q3w: planner may still choose
  `Seq Scan` (too many rows) — locate the crossover.
- **C8** (`lower(email)`) — Q4: `Seq Scan` → `Index Scan`, only because the index
  expression exactly matches the predicate.
- **C9** (GIN `tags`) — Q5: `Bitmap Index Scan (GIN)` + `Bitmap Heap Scan`.
- **Q7 sweep** — a selectivity point where the plan flips `Seq Scan` ↔
  index/bitmap scan. The location of that point is the thing being measured.

## 11. Possible surprising results

Worth writing up if they occur:

- An index that lowers the **estimated** cost but not the **actual** time, or the
  reverse — estimate/actual divergence.
- `Bitmap Heap Scan` chosen where a plain `Index Scan` looks better; `work_mem`
  making the bitmap lossy (`Rows Removed by Index Recheck > 0`).
- The covering index **not** producing an `Index Only Scan` because autovacuum was
  off and the manual `VACUUM` was skipped — the process mistake becomes a finding.
- BRIN's advantage on Q3w (and disadvantage on Q3n) being larger than expected.
- `LIMIT 20` flipping a plan from `Sort` + `Limit` to a backward `Index Scan` on a
  different index.
- Q1b (hot tenant) staying on `Seq Scan` for **every** index configuration — no
  index rescues a ~40% predicate.
- `Planning Time` becoming a visible fraction of total once the "all indexes"
  control run adds candidates.
- Re-running one family with `random_page_cost = 4` (the default) flipping index
  plans back to `Seq Scan` — the "right" index unused purely because of a config
  default.
- `Incremental Sort` / `Memoize` nodes appearing and not matching the mental
  model.

## 12. Limitations

- Synthetic, hand-designed distribution; real skew, correlation and NULL patterns
  drive planner statistics differently.
- ~1M rows mostly fit in cache → this measures a **warm** workload. Disk-bound
  behaviour (where `random_page_cost` bites hardest) is under-sampled; a
  tiny-`shared_buffers` config is a partial mitigation, not a fix.
- Single machine, single instance, no concurrency → no lock waits, no buffer
  contention, no autovacuum-under-load effects.
- One PostgreSQL major version; defaults and planner nodes change across versions.
- `EXPLAIN ANALYZE` instrumentation inflates execution time — fine for comparison,
  not for absolute latency.
- Measures the **chosen** plan, not the full plan space. Forcing alternatives
  with `enable_*` flags is a separate sub-study.
- No write path: index maintenance cost on `INSERT` / `UPDATE`, bloat over time
  and `VACUUM` cost are not measured (only static index size).
- Results are "this planner, this data, this box" — directional input for a note,
  not a benchmark to cite.

## Harness (design)

- `docker-compose.yml`: the pinned `postgres` image + a mounted `postgresql.conf`.
- `run.mjs` with the `pg` driver, ~150–250 lines: connect → build schema →
  `COPY` generated rows → `VACUUM ANALYZE` → for each config `{ drop ix_exp_*;
  create; VACUUM ANALYZE; for each query: run both EXPLAIN forms ×6; parse JSON;
  append to results/*.jsonl }` → write a summary CSV.
- No web server, no ORM.

## Results

> TODO: run the protocol and record real output here — per-query/per-config plan
> paths and the §8 metrics — before writing the technical note. Do not fill this
> section with anything that hasn't been produced by an actual run.
