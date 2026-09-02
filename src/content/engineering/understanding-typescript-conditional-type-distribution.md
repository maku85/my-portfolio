---
title: "Understanding Conditional Type Distribution and infer"
title_it: "Capire la distribuzione dei tipi condizionali e infer"
type: note
area: backend
topics: ["typescript", "conditional-types", "distributive-conditional-types", "infer", "type-inference", "generics", "compiler-performance"]
description: "When a conditional type distributes over a union and when it doesn't, how [T] extends [U] switches it off, which infer position wins, and why the distributive form is a performance amplifier."
description_it: "Quando un tipo condizionale distribuisce su una union e quando no, come [T] extends [U] lo disattiva, quale posizione di infer vince, e perché la forma distributiva amplifica il costo."
date: "2026-09-01"
status: published
featured: false
slug: understanding-typescript-conditional-type-distribution
related: ["understanding-typescript-type-instantiations"]
---

## Context

A utility type `NonNullableKeys<T>` worked in tests and then returned `never`
for a real type. The cause was distribution: the conditional was written over a
naked type parameter, the input was a union, and one member of that union
reduced the whole result to `never`. This note is the mechanics of when a
conditional type distributes, how to turn it off, how `infer` resolves when
there is more than one candidate, and why the distributive form is also the
expensive form. The cost angle continues in the companion note on the
type-instantiation budget.

Scope: conditional types, distribution, and `infer` in TypeScript 5.x
(re-checked on 5.6). Not mapped types beyond where they interact with
distribution, not template-literal type inference beyond `infer` in a template
position.

## Question

- Exactly when does `T extends U ? X : Y` iterate over the members of a union
  `T`, and when does it treat `T` whole?
- What does wrapping both sides in a one-tuple (`[T] extends [U]`) change, and
  what does it cost in readability?
- With several `infer` positions for the same variable, which one wins, and does
  covariance vs contravariance change the answer?
- Why does the distributive form show up as a hot spot in a `--generateTrace`
  run?

## Investigation

Mechanism, checked against small reproductions in the playground and against
`--extendedDiagnostics` `Instantiations` for the cost claims.

- **The distribution rule.** A conditional type is distributive when the type
  being checked (the part before `extends`) is a naked type parameter: a bare
  `T`, not `T[]`, not `[T]`, not `{ x: T }`, not `Promise<T>`. When it is naked
  and the argument is a union, the checker evaluates the conditional once per
  union member and unions the results.
- **The off switch.** Any wrapper around the checked type stops distribution.
  The idiom is `[T] extends [U] ? X : Y`: the one-tuple makes `T` non-naked, so
  the union is compared as a whole.
- **`never` is the empty union.** Distributing over `never` produces `never`
  (zero members, empty union). This is why `T extends any ? … : …` with
  `T = never` "skips" the true branch: there is nothing to distribute over.
- **`infer` candidates.** A single `infer R` can appear in several positions.
  The checker collects a candidate from each and combines them: union for
  covariant positions (e.g. multiple return positions, multiple array element
  positions), intersection for contravariant positions (function parameters).
  Same `infer` name in both kinds of position, and the contravariant combination
  generally dominates for the parameter side.

## Observations

- **Distribution is a property of syntax, not intent.** `type F<T> = T extends
  string ? A : B` distributes; `type F<T> = [T] extends [string] ? A : B` does
  not. Nothing about the name or the union says which you meant; the presence or
  absence of a wrapper does.
- **Distribution changes the result, not just the performance.** Over `T = "a"
  | "b"`, a distributive `T extends "a" ? 1 : 0` is `1 | 0`; the non-distributive
  `[T] extends ["a"] ? 1 : 0` is `0`. A `never` member can collapse a
  distributive result; it cannot collapse a wrapped one.
- **Built-ins pick deliberately.** `Exclude`, `Extract`, `NonNullable` are
  distributive on purpose (they filter union members). `Awaited` uses `infer`
  with recursion. If you are writing a "does this whole type satisfy X"
  predicate, you almost always want the wrapped, non-distributive form.
- **The distributive form is the expensive form.** Per-member evaluation means
  a conditional over a union of N is N instantiations, and nesting multiplies.
  In a `--generateTrace`, an unwrapped conditional over a large string-literal
  union is a classic hot span. Measured in the companion lab
  ([`ts-typecheck-lab`](https://github.com/maku85/ts-typecheck-lab), TS 5.6.3):
  the distributive form's `Instantiations` is exactly `2N + 1` for a union of N
  (1 → 5000); the `[U] extends […]` wrapped form is flat at 6. Nesting a second
  distributive level multiplies: `Instantiations / (N × M)` stays ≈ 6.1 across
  the grid.
- **`infer` in a rest/tuple position is how variadic inference works**, and it
  is cheap relative to a distributive conditional. The cost problem is
  distribution, not `infer` itself.

## Technical details

**Naked vs wrapped, precisely.** "Naked" means the type parameter is the entire
type in the checked position, with no surrounding constructor. `T` is naked;
`T & {}`, `T[]`, `[T]`, `keyof T`, `T extends infer U ? …` (the `infer` form)
are not. Only the naked form triggers per-member distribution. The wrapper does
not have to be a tuple; a tuple is the least intrusive choice, and `T & unknown`
also works but reads worse.

**Distribution and `boolean` / `any`.** `boolean` is `true | false` internally,
so a distributive conditional over `boolean` runs twice. `any` in the checked
position takes both branches and yields `X | Y`. `never` yields `never` (empty
distribution). These three are the usual "why did I get a union / `never` I
didn't expect" causes.

**`infer` combination rules.** For `type P<T> = T extends { a: infer U; b: infer
U } ? U : never`, both positions are covariant (property types), so `U` is
`T["a"] | T["b"]`. For `type Q<T> = T extends (a: infer U, b: infer U) => any ?
U : never`, both are contravariant (parameter positions), so `U` is `T`-param-a
`& ` `T`-param-b. Mixed positions: the checker still collects all candidates;
the practical rule is "return-like positions union, parameter-like positions
intersect". Constrained `infer` (`infer U extends string`) filters candidates
and, since TS 4.8, can also act as a cast in the true branch.

**Recursion and tail position (from the companion note, restated).** A
conditional type may reference itself. TS 4.5+ evaluates a tail-position
recursive conditional iteratively, so `type Trim<S> = S extends ` `` `${" "}${infer R}` `` `
? Trim<R> : S` is cheap and deep. Wrapping the recursive call (`[...Trim<R>]`,
`{ x: Trim<R> }`, `Trim<R> | X`) puts it off tail position and it becomes
depth-limited and TS2589-prone.

## Practical implications

- Decide distribution explicitly. "Filter members of a union" → naked `T`.
  "Does the whole type satisfy this" → `[T] extends [U]`. Write the wrapper even
  when the current input happens not to be a union, because it is the input that
  changes later.
- If a utility type mysteriously returns `never` or a wider union than expected,
  check for an unwrapped conditional and a `never` / `boolean` / `any` member in
  the input.
- For "which `infer` wins" surprises, name the position: parameters intersect,
  returns/properties union. If you need one specific position, don't reuse the
  `infer` name across kinds.
- Keep recursive conditional types in tail position. If you must build up a
  structure, accumulate in a type parameter that is itself in tail position
  rather than wrapping the recursive call.
- When a `--generateTrace` hot span is a conditional type, the first question is
  "is this distributing, and does it need to?". The wrapped form is often a free
  win, and behaviour-preserving if you didn't want distribution.

## Limitations

- **Mixed-variance `infer` is underspecified in practice.** The "parameters
  intersect, returns union" rule covers the common cases; exotic positions
  (a `this` parameter, an `infer` inside a mapped type inside the conditional)
  can surprise, and this note does not chart all of them.
- **"Tail position" is a checker-internal judgement.** The examples here are
  clear cases; whether a given nested form counts as tail-recursive is
  ultimately what the 5.x checker does, and it has shifted across minors.
- **Cost claims are `Instantiations`-based**, from small fixtures, not
  wall-clock on a real project. See the companion note's lab protocol.
- **Playground-checked reproductions.** The behavioural claims are from minimal
  repros on 5.6; a different `lib` / `strict` setting can change edge results,
  notably around `any` and `unknown` in the checked position.

## Takeaways

- A conditional type distributes over a union iff the checked type is a naked
  type parameter; any wrapper (`[T] extends [U]` is the idiom) turns it off.
- Distribution changes the result, not only speed: `never` / `boolean` / `any`
  members are the usual "unexpected `never` or union" causes.
- Multiple `infer` for one variable: covariant positions union, contravariant
  (parameter) positions intersect.
- The distributive form is also the expensive form, per-member instantiation and
  multiplicative under nesting, so an unwrapped conditional over a large union is
  a `--generateTrace` hot span you can often just wrap.
- Keep recursive conditionals in tail position or they hit the TS2589 wall.
