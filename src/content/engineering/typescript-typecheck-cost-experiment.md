---
title: "TypeScript Type-Check Cost Experiment"
title_it: "Esperimento sul costo del type-check in TypeScript"
type: experiment
area: backend
topics: ["typescript", "compiler-performance", "type-instantiations", "trace-analysis", "conditional-types", "distributive-conditional-types", "infer"]
description: "A deterministic fixture-based protocol for measuring how tsc's instantiation count and check time react to union size, builder-chain length, recursion position and intersection width, using --extendedDiagnostics and --generateTrace."
description_it: "Un protocollo basato su fixture deterministiche per misurare come il conteggio delle istanziazioni e il check time di tsc reagiscono alla dimensione delle union, alla lunghezza delle builder chain, alla posizione della ricorsione e alla larghezza delle intersezioni, con --extendedDiagnostics e --generateTrace."
date: "2026-09-01"
status: published
featured: false
slug: typescript-typecheck-cost-experiment
related: ["understanding-typescript-type-instantiations", "understanding-typescript-conditional-type-distribution"]
---

The protocol below was written first, design-only. It has since been run
([`ts-typecheck-lab`](https://github.com/maku85/ts-typecheck-lab), TypeScript
5.6.3), and section 10 holds the results. H1, H2, H4 and H5 held as stated; F3
and F6 did not. A builder / accumulator chain stayed linear across four shapes,
and annotating exported return types did not speed up the checker or `.d.ts`
emit. The numbers a companion note now cites all trace back to a committed run
under that repo's `results/`.

## 1. Research question

For a set of type constructs known to be expensive, each swept along one axis on
an otherwise fixed program:

- How do `Instantiations` and `Check time` (from `--extendedDiagnostics`) grow
  along the axis: linear, multiplicative, stepwise?
- How predictably: can the growth be anticipated from the construct's shape alone
  (union size N, chain length L, intersection width W)?
- Which change in source form (wrapping a conditional, annotating a return type,
  moving recursion to tail position) moves the numbers, and by how much?
- Where is the wall: at what depth / instantiation count does TS2589 fire on 5.6,
  by construction?

## 2. Hypotheses

Directional, to confirm or refute, no magnitudes asserted:

- **H1**: a distributive conditional over a union of N members costs
  `Instantiations` proportional to N; the `[T] extends [U]` non-distributive
  form of the same predicate is roughly constant in N.
- **H2**: two nested distributive conditionals over unions of N and M cost
  proportional to N × M.
- **H3**: a fluent builder chain of length L costs `Instantiations` proportional
  to L² (each call re-instantiates the accumulated state type), and an explicit
  type annotation on the chain result caps it near linear.
- **H4**: a recursive conditional type in tail position scales to large input
  sizes with bounded depth; the same recursion with the recursive call wrapped
  in a tuple/object/union hits TS2589 at an input size one to two orders of
  magnitude smaller.
- **H5**: a wide intersection `A & B & … (W constituents)` compared for
  assignability costs relation-check work proportional to W × (members per
  constituent), visible as growth in `Assignability cache size`.
- **H6**: `analyze-trace`'s top hot type corresponds, in every fixture, to the
  construct being swept, i.e. the trace localises correctly.

## 3. Fixtures

One directory per fixture, each a self-contained `.ts` file plus a
`tsconfig.json` that differs only in `files`. All fixtures share:
`strict: true`, `noEmit: true`, `skipLibCheck: true`, a pinned `lib`, no
`incremental`. Deterministic generation: a small Node script emits the `.ts`
source for each point on the axis from a fixed template (no randomness).

- **F1, distributive vs wrapped conditional.** `Unwrapped<U>` and `Wrapped<U>`
  computing the same predicate; `U` a string-literal union of size
  N ∈ {1, 10, 100, 1000, 5000}.
- **F2, nested distribution.** A conditional over N that itself maps each member
  through a conditional over M; (N, M) on a small grid.
- **F3, builder chain.** A `Builder<State>` with `.add<K, V>()` returning
  `Builder<State & Record<K, V>>`; chains of length L ∈ {1, 5, 10, 25, 50, 100},
  measured with and without an explicit annotation on the final type.
- **F4, recursion position.** `Trim<S>` / a length-counter, written once in tail
  position and once with the recursive call wrapped; input size swept until
  TS2589.
- **F5, intersection width.** `A₁ & A₂ & … & A_W` with W ∈ {2, 5, 10, 25, 50},
  each `Aᵢ` a distinct object type of fixed member count, then a function that
  requires assignability to the full intersection.
- **F6, inferred vs annotated export.** A module exporting 10–300 functions with
  non-trivial inferred return types (`Deep<Seed & { tagN: N }>`); a copy with all
  return types annotated. Three passes: check-only, `--emitDeclarationOnly`
  (`Emit time`), and a `skipLibCheck` / `incremental` side-run.

## 4. Method

For each fixture point:

1. `tsc --noEmit --extendedDiagnostics --generateTrace trace/ -p <fixture>`,
   three runs, cold (`--incremental false`, no `.tsbuildinfo`).
2. Record from `--extendedDiagnostics`: `Files`, `Types`, `Instantiations`,
   `Symbols`, `Assignability cache size`, `Identity cache size`,
   `Subtype cache size`, `Parse time`, `Bind time`, `Check time`,
   `Total time`.
3. Commit the raw `trace.json` and `types.json` under `results/<fixture>/<point>/`.
4. `npx @typescript/analyze-trace results/<fixture>/<point>/` and commit its
   output; record the top three hot spots and hot types.
5. For fixtures that can hit TS2589 (F4), record the smallest axis value at
   which the error appears and the exact diagnostic text.

## 5. What counts as the measurement

`Instantiations` and `Check time` are the primary series. `Check time` is
reported as the median of three cold runs with min/max noted; it is the noisy
one. Cache sizes are secondary series: they explain why `Instantiations` grew,
distinct pairs vs reused. `analyze-trace` output is used for localisation (H6),
not as a time measurement. `Total time` and `--declaration` emit time are
recorded only for F6.

## 6. Controls

- Same TypeScript version (pinned exact, 5.6.x) for every run; the version is
  recorded in each results directory.
- `skipLibCheck: true` everywhere, so `lib.d.ts` checking is not in the numbers.
- Identical `tsconfig` across a fixture's points except the generated source.
- Fixture source generated from one template per fixture, so the only thing that
  changes along an axis is the axis.
- Machine, Node version and CPU governor recorded once in the repo README; all
  runs on the same machine.

## 7. Environment

TypeScript 5.6.3, Node 24, Apple M3 Pro, a single local machine.
`@typescript/analyze-trace` pinned. No editor / tsserver involvement, batch `tsc`
only. No project references, single-file programs. A separate pass
(section 11) re-runs F1, F2 and F4 against `typescript@7.0.2`, the Go native
port, installed under a package alias.

## 8. Expected output

A small table per fixture (axis value → `Instantiations`, `Check time`, relevant
cache size) and, for F4, the TS2589 threshold. Each companion-note `TODO` line
maps to one fixture:

- type-instantiation note, "unions are the amplifier" → F1, F2
- type-instantiation note, generic-builder regression → F3
- type-instantiation note, TS2589 guards on 5.6 → F4
- type-instantiation note, `skipLibCheck` / `incremental` effect → a small
  side-run on F6 toggling those two flags
- conditional-distribution note, `Instantiations` for wrapped vs unwrapped → F1

## 9. Limitations

- **Synthetic fixtures.** These isolate one construct each; a real codebase mixes
  them and has caching interactions this protocol does not reproduce.
- **`Check time` is wall-clock and noisy.** Conclusions lean on `Instantiations`
  (deterministic) and treat time as corroborating, not primary.
- **One version, one machine.** The TS2589 guards and the constant factors are
  5.6-and-this-CPU specific; the shape of the growth is the transferable part.
- **No tsserver.** The "editor feels slow" experience is out of scope; this
  measures batch checking only.
- **`analyze-trace` ranking is time-based**, so H6 (localisation) is judged on
  which type/file it names, not on the milliseconds it attributes.
- **Emit largely excluded.** Only F6 touches `--declaration`; general emit and
  `--build` scheduling are not measured.

## 10. Results

TypeScript 5.6.3, classic compiler, Apple M3 Pro, Node 24. Full tables and raw
`--extendedDiagnostics` / trace output:
[`ts-typecheck-lab/results/`](https://github.com/maku85/ts-typecheck-lab/tree/main/results).

| # | hypothesis | outcome |
| --- | --- | --- |
| F1 / H1 | distributive ∝ N, wrapped ∝ 1 | **held**. Distributive `Instantiations` is exactly `2N + 1` (1 → 5000); wrapped flat at 6 |
| F2 / H2 | nested distribution ∝ N × M | **held**. `Instantiations / (N × M)` ≈ 6.1, constant across a 16× span of the product (60 609 at 100 × 100); `outerOnly` = `8N + 17`, flat in M |
| F3 / H3 | builder chain ∝ L², annotation caps it | **not reproduced**. `inst/L` flat across four shapes: plain `&` accumulator (26), per-step annotations (33), `Summary<S>` re-derivation and a forced (`Expand`) re-derivation (16). Instantiation caching by `(target, mapper)` keeps every shape linear |
| F4 / H4 | non-tail recursion walls far earlier than tail | **held**. Non-tail `TS2589` at recursion depth 50; tail scales past 800, walls in `(800, 2000]` |
| F5 / H5 | wide intersection relation-check ∝ W | **held**. `Assignability cache size` 4 → 1276 for W = 2 → 50 (≈ W²/2); `Instantiations` stays 0 (no generics), so the cache line is the one to read |
| F6 | annotating exported return types speeds up `tsc` / `.d.ts` emit | **not reproduced**. Annotating cost the checker ~3× the instantiations (1204 → 3697 at 300 exports); `.d.ts` `Emit time` was flat (0.01–0.03 s) either way. Side-run: `skipLibCheck: false` ~doubled check time; a warm `incremental` run skipped the check phase |
| H6 | `analyze-trace` localises the hot cost to the swept construct | **plumbing only**. It named `fixture.ts` in every traced run, but the fixtures are too cheap for a type-level hot spot |

Reads:

- **The instantiation count is a clean, deterministic series.** F1 and F2 are
  exact integer formulas in N (and N × M). `Check time` never left the
  0.01–0.06 s noise floor even at the largest fixtures, so the note's
  "instantiations is the signal, check time is noise" holds.
- **F3 and F6 failed usefully.** "Builder chains cost L²" did not reproduce
  under any of four accumulator shapes; instantiation caching keeps them
  linear. "Annotate exported return types to speed up the build" is also
  folklore: annotating cost the checker more and left `.d.ts` emit unchanged.
  Both are useful corrections; both are folded into the companion notes.
- **The one multiplicative cost this lab found is unions under conditionals**
  (F1, F2), not accumulation. That is where `[T] extends [U]` earns its keep.
- **The TS2589 depth (50, non-tail) is now a measured number**, not "roughly 50".

## 11. TS 7 delta

F1, F2 and F4 re-run against `typescript@7.0.2` (the Go native port), 5.6.3 vs
7.0.2 side by side.

| result | 5.6.3 | 7.0.2 |
| --- | --- | --- |
| distributive `Instantiations` (F1) | `2N + 1` exactly | `2N + 1`, identical at N = 10 … 5000 |
| nested `Instantiations / (N × M)` (F2) | ≈ 6.1, flat | ≈ 4.1, flat |
| non-tail TS2589 depth (F4) | 50 | 50 |
| tail TS2589 depth (F4) | in `(800, 2000]` | in `(800, 2000]` |

Two mechanisms transferred exactly to a from-scratch reimplementation; nested
distribution kept its `N × M` shape with a lower constant. Nothing in F1, F2 or
F4 was 5.x-specific in kind. What changed is the reporting: 7.x
`--extendedDiagnostics` drops the `* cache size` lines and adds `Memory allocs` /
`Config time`, and `--generateTrace` shards `types.json` one file per worker.
