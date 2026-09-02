---
title: "Understanding the TypeScript Type-Instantiation Budget"
title_it: "Capire il budget di istanziazione dei tipi in TypeScript"
type: note
area: backend
topics: ["typescript", "compiler-performance", "type-instantiations", "trace-analysis", "type-inference", "conditional-types", "generics"]
description: "What the checker spends time on: instantiations, structural relation checks, the relation cache; what --extendedDiagnostics and --generateTrace expose; and where reading a trace stops telling you what to do."
description_it: "Su cosa spende tempo il checker: istanziazioni, confronti strutturali, la relation cache; cosa mostrano --extendedDiagnostics e --generateTrace; e dove leggere una trace smette di dirti cosa fare."
date: "2026-09-01"
status: published
featured: true
slug: understanding-typescript-type-instantiations
related: ["understanding-typescript-conditional-type-distribution"]
---

## Context

A backend package's `tsc --noEmit` went from two seconds to fifteen after a
refactor that added a generic query builder. Nothing was "wrong": the types were
correct, the editor was slow, and CI now had a visible TypeScript step. This
note is the model I built to reason about that class of problem. What the checker
is doing when it is slow, which of its own diagnostics are worth reading, and
where a trace tells you where the cost is without telling you what to change. It
leads into the companion note on conditional-type distribution, which is where a
lot of the cost hides.

Scope: `tsc` type-checking cost for library and backend code: inference,
generics, conditional types, large unions and intersections. Not emit, not
`--build` / project-reference graph time, not editor-server (tsserver) latency
beyond noting that it shares the checker. Versions: TypeScript 5.x, mechanisms
re-checked on 5.6, and the load-bearing ones re-checked again on `typescript@7`
(the Go native port). Numbers are either discharged against the companion lab
(marked "Done (companion lab, experiment NN)") or still marked
`TODO: verify in the lab`.

## Question

When a type-check is slow, what is the checker spending time on, and which
numbers point at the cause?

- What unit of work does the checker do repeatedly, and what makes it multiply?
- What do `--extendedDiagnostics` and `--generateTrace` measure, and what do
  they not measure?
- If a trace says "this file / this type is hot", how far does that get you
  toward a fix?
- Where is the wall, the `excessively deep and possibly infinite` error, and is
  it a cliff or a smell?

## Investigation

The method here is mechanism plus the compiler's own instrumentation, not a
latency benchmark; the empirical parts are called out.

- **Getting numbers.** `tsc --noEmit --extendedDiagnostics` prints
  `Instantiations`, `Types`, `Symbols`, cache sizes (`Assignability cache size`,
  `Identity cache size`, `Subtype cache size`, `Strict subtype cache size`), and
  a time breakdown (`Parse`, `Bind`, `Check`, plus `Program` and `Emit`).
  `Check time` against `Instantiations` is the first read: a high instantiation
  count with high check time is the "types are doing too much work" shape.
- **Getting a map.** `tsc --noEmit --generateTrace trace/` emits `trace.json`
  (a Chrome/Perfetto event trace of `checkSourceFile`, `checkExpression`,
  `structuredTypeRelatedTo`, `instantiateType` spans) and `types.json` (every
  type the checker built, with its id, flags and origin). Open `trace.json` in
  `ui.perfetto.dev`, or run `npx @typescript/analyze-trace trace/` for a ranked
  list of hot spots and "hot types".
- **What "work" means here.** Two operations dominate. Instantiation:
  substituting type arguments into a generic type to produce a concrete one.
  Relation checking: deciding whether type A is assignable to / identical to / a
  subtype of B, which for structural types means walking their members. Both are
  memoised (instantiations by `(type, type-mapper)`, relations by a key built
  from the two type ids), and the cache sizes above show the memo tables
  growing.

> Done (companion lab, experiment 03): a builder / accumulator chain of length L
> is linear in L, not `L²`, across four shapes: a plain `S & Record<K, V>`
> accumulator, explicit per-step annotations, a `Summary<S>` mapped-type
> re-derivation, and a forced (`Expand`) re-derivation. Instantiation caching by
> `(target, mapper)` plus mapped-type laziness keeps every shape linear. The
> "every `.add()` re-instantiates the whole state" model is wrong on 5.6. Where
> multiplicative cost does appear is distributive conditionals over unions
> (experiments 01–02), not accumulation.

## Observations

Working model. The parts confirmed by the compiler's own counters are marked.

- **The checker's cost is instantiations × relation checks, and both multiply
  over unions.** A conditional or mapped type applied to a union of N members is
  evaluated per member; nest two and it is N × M. A union-to-union assignability
  check is roughly "every source member against every target member" with
  short-circuits. Large unions are the single most common amplifier.
  (`--extendedDiagnostics` `Instantiations` tracks this directly.)
- **Memoisation is real but partial.** Identical `(type, mapper)` pairs reuse a
  cached instantiation; structurally identical but separately constructed types
  often do not share a cache entry, so "the same" big intersection written in
  two places is paid for twice. The relation caches key on type identity, not
  structure.
- **`--generateTrace` localises cost, it does not explain it.** The trace and
  `analyze-trace` will reliably tell you which `checkExpression` span, which
  source file, and which type id is expensive. Turning that into a change
  (simplify this conditional, add an explicit return type, break this union) is
  still manual. (Observed: the hot span is trustworthy; the fix it implies is
  not in the trace.)
- **Explicit type annotations bound inference, but they are not free.** An
  annotated boundary stops the checker inferring a type across it. The written
  type still gets instantiated and checked against the implementation, and the
  companion lab (experiment 06) measured that as *more* checker work, not less,
  at moderate scale. The value is a stable published API surface and
  `isolatedDeclarations` compatibility, not a faster `tsc`.
- **The wall is a smell, not just a limit.** `Type instantiation is excessively
  deep and possibly infinite` (TS2589) means a recursive conditional/mapped type
  exceeded the checker's depth or instantiation guard. Hitting it usually means
  the type is doing work that belongs in a simpler formulation, not that the
  limit is too low.

> Done (companion lab, experiments 01–02): a distributive conditional over a
> union of N has `Instantiations` exactly `2N + 1` (swept 1 → 5000); the
> `[T] extends [U]` wrapped form is flat at 6. Nesting a second distributive
> level multiplies: `Instantiations / (N × M)` ≈ 6.1, constant across the grid.
> `Check time` never left the noise floor; the amplifier is visible only in the
> counter.

## Technical details

**Instantiation.** When a generic type or signature is used with type arguments,
the checker builds an instantiation: it clones the type with a type mapper (the
parameter → argument substitution) applied lazily to its constituent types. The
result is cached against `(target, mapper)`. Instantiation is transitive:
instantiating a type that refers to other generics instantiates those too, which
is how one heavily generic API at the top fans out into thousands of
instantiations underneath. The `Instantiations` counter in `--extendedDiagnostics`
is the total across the program; a healthy library build is usually in the low
hundreds of thousands, and a pathological one is in the millions.
`TODO: verify in the lab`: pin down the "usually" with a corpus.

**Relation checking.** `structuredTypeRelatedTo` compares two structural types
member by member. Cost scales with the product of their apparent members, and
with union size on either side. Results go into the assignability / identity /
subtype caches keyed by the pair of type ids; `--extendedDiagnostics` reports
each cache's size, and a cache in the hundreds of thousands is a sign that a lot
of distinct type pairs are being compared, often distinct because they are
freshly instantiated rather than genuinely different.

**What blows up, in rough order of how often it is the cause:**

- **Large unions under a conditional or mapped type**: evaluated per member,
  multiplicatively when nested. Includes big string-literal unions from template
  literal types.
- **Recursive conditional types without a tail-position formulation.** TS 4.5+
  eliminates tail recursion in conditional types, so a recursion that reduces to
  a plain recursive reference goes deep cheaply; one that wraps the recursive
  call in an object/tuple/union does not, and approaches TS2589.
- **Deeply generic builder chains** (fluent APIs where each `.method()` returns
  a new parametrised type carrying accumulated state) are often blamed for
  `O(L²)` check cost, but the companion lab (experiment 03) could not reproduce
  it on 5.6. A plain `&` accumulator, per-step annotations, and a forced
  mapped-type re-derivation all stayed linear in L, because each instantiation is
  cached by `(target, mapper)`. A real builder blow-up, if it exists on current
  TS, likely runs through per-step conditional branching on the accumulated
  state, which is the union-amplifier case below, not accumulation itself.
- **Wide intersections of object types** (`A & B & C & …`): every member of
  every constituent participates in relation checks.
- **Inferred exported types**: the return type of an exported function with no
  annotation is materialised and serialised into the `.d.ts`. Long assumed to be
  cheaper to annotate, but the companion lab (experiment 06) found the opposite
  at moderate scale on 5.6: annotating cost the checker ~3× the instantiations,
  and `.d.ts` `Emit time` was flat either way. Annotate exported return types for
  API stability and `isolatedDeclarations`, not for build speed.

**The guards (approximate, current 5.x, subject to change):** an instantiation
recursion depth around 50–100, an instantiation count guard in the low millions
per type, a finite-recursion check on conditional types. Crossing any of them
yields TS2589. These are deliberately not documented as stable API; treat them
as "you are far off the happy path", not budget to spend.

## Practical implications

- Read `--extendedDiagnostics` first. `Instantiations` and `Check time` together
  say whether the problem is "the types" at all (versus parse/bind, or sheer
  file count). The cache sizes say whether the cost is distinct type pairs.
- Use `--generateTrace` + `analyze-trace` to localise, then treat the hot span
  as "look here", not "the answer". The change is yours to find.
- Annotating an exported boundary bounds inference across it and gives a stable
  API surface (`isolatedDeclarations` finds every place it is missing). Do not
  reach for it as a `tsc` speed fix: experiment 06 measured annotated as more
  checker work, and `.d.ts` emit time unchanged.
- Prefer a `[T] extends [U]` non-distributive conditional unless you want
  per-member distribution; the distributive form over a large union is a common
  silent amplifier. (See the companion note.)
- Treat TS2589 as a design signal: reformulate the recursive type into tail
  position, or cap its depth explicitly, rather than reaching for
  `// @ts-ignore`.
- Put a ceiling in CI: `analyze-trace` exits non-zero past a configurable hot-spot
  threshold, and `Instantiations` from `--extendedDiagnostics` is a single number
  you can assert on to catch the next regression at the PR, not months later.

## Limitations

Reading diagnostics and a trace has real blind spots:

- **A trace is one machine, one config, one moment.** `skipLibCheck`,
  `incremental`, the exact `lib`, and which files are in the program all move the
  numbers. A hot spot on your laptop may not be the hot spot in CI.
- **`analyze-trace` ranks by wall time in the trace**, which is noisy for short
  spans and sensitive to what else the process was doing. The shape (which type,
  which file) is stabler than the milliseconds.
- **It sees the checker, not tsserver.** The editor runs partial checks, caches
  differently, and re-checks on keystroke; a batch `tsc` trace under-represents
  the "typing feels laggy" experience.
- **No causal chain.** The trace shows that instantiating type #48213 was
  expensive; it does not show which source construct authored it without
  cross-referencing `types.json` and reading code. `analyze-trace`'s "hot types"
  help but do not close the gap.
- **The guard numbers are version-specific and undocumented.** Anything in this
  note about depth ~50 or a millions-range instantiation count is "observed on
  5.x", not a contract, and has changed between minor versions before. It did
  hold across the 7.x native rewrite (see the blockquote below), but that is not
  a guarantee either.
- **Emit and project-reference time are out of scope here.** A slow `tsc
  --build` can be graph scheduling, not checking, and this model says nothing
  about that.

> Done (companion lab, experiments 04, 06): the TS2589 wall on 5.6.3 is at
> recursion depth 50 for a non-tail conditional; a tail-position one scales past
> 800. On a small fixture, `skipLibCheck: false` roughly doubles `Check time`
> (all of it `lib.*.d.ts`), and a warm `incremental` run over an unchanged
> program skips the check phase entirely. Still `TODO`: "healthy vs pathological"
> `Instantiations` ranges on a corpus of real libraries.
>
> Done (companion lab, `_ts7-delta`): re-run against `typescript@7.0.2`, the Go
> native port. The distributive `2N + 1` formula and the TS2589 depths (non-tail
> 50, tail past 800) are identical. Nested distribution stays proportional to
> `N × M` but the constant drops from ≈ 6.1 to ≈ 4.1 instantiations per pair. So
> the mechanisms survived a from-scratch reimplementation; one constant factor
> moved. `--extendedDiagnostics` on 7.x drops the `* cache size` lines and
> `--generateTrace` shards `types.json` per worker.

## Takeaways

- The checker's work is instantiations (substituting type args) and relation
  checks (structural member-by-member comparison); both multiply over union size
  and nesting. That product is what you are trying to shrink.
- `--extendedDiagnostics` tells you whether it is the types and how big the memo
  tables got; `--generateTrace` + `analyze-trace` tell you where. Neither tells
  you what to change; that step is manual.
- A distributive conditional over a large union is the most common silent
  amplifier; reach for `[T] extends [U]` unless you want the distribution.
- Builder / accumulator chains are not the amplifier: experiment 03 kept every
  shape linear in length. Annotating exported boundaries is an API-stability
  practice, not a `tsc` speed fix (experiment 06).
- TS2589 is a "you have left the happy path" signal, not a limit to raise.
- The measured numbers (unions, nested distribution, the TS2589 depth, the
  builder and export non-results, the `skipLibCheck` delta) trace back to a
  committed lab run; the corpus-scale `Instantiations` ranges are still `TODO`.

## Evidence: companion lab

[**ts-typecheck-lab**](https://github.com/maku85/ts-typecheck-lab): deterministic
type fixtures generated from a fixed template per experiment (a distributive
conditional swept over unions of growing size; nested distribution over an
N × M grid; a fluent builder chain of growing length; a recursive conditional in
tail vs non-tail position; a wide object intersection; inferred vs annotated
exports). Each is type-checked with the pinned
`tsc --noEmit --extendedDiagnostics --generateTrace`; the raw
`trace.json` / `types.json` and the `--extendedDiagnostics` output are committed
under `results/`. Analysis via `@typescript/analyze-trace`. Counter-based
(`Instantiations`, `Assignability cache size`, the stage of a `TS2589`), not a
wall-clock benchmark. TypeScript is pinned to 5.6.3.

Findings so far: H1 (unions ∝ N) and H2 (nesting ∝ N × M) held as exact integer
formulas; H4 (tail vs non-tail recursion) held, wall at depth 50; H5 (wide
intersection) held via `Assignability cache size` (≈ W²/2). Two did not: H3, a
builder / accumulator chain stayed linear in length across four shapes, not
`L²`; H6, annotating exported return types cost the checker ~3× the
instantiations and left `.d.ts` emit time flat. Both corrections are folded into
the text above. `_ts7-delta` re-runs 01 / 02 / 04 on the `typescript@7` native
port: `2N + 1` and the TS2589 depths are unchanged, nested distribution keeps its
`N × M` shape with the constant down from ≈ 6.1 to ≈ 4.1.
