---
title: "Understanding the Docker Layer Cache"
title_it: "Capire la cache dei layer di Docker"
type: note
area: cloud-infrastructure
topics: ["docker", "buildkit", "build-cache", "layer-invalidation", "dockerfile", "image-size"]
description: "How BuildKit decides a step is a cache hit, why one changed line rebuilds everything below it, what --progress=plain shows, and where reading the cache by eye stops being enough."
description_it: "Come BuildKit decide che uno step è un cache hit, perché una riga cambiata ricostruisce tutto ciò che sta sotto, cosa mostra --progress=plain, e dove leggere la cache a occhio smette di bastare."
date: "2026-09-02"
status: published
featured: true
slug: understanding-the-docker-layer-cache
related: ["understanding-docker-image-size"]
---

## Context

A Node service's `docker build` in CI went from 40 seconds to over two minutes.
Nothing in the Dockerfile had changed. What changed was a `COPY . .` that sat
above `RUN npm ci`, so every commit that touched any source file threw away the
dependency layer and re-installed from scratch. This note is the model for
reasoning about that: how BuildKit decides a step is a cache hit, why the miss
cascades, and what the build log actually tells you.

Scope: the local `docker build` cache with BuildKit (the default builder on
Docker 23+). Not the runtime, not `--cache-from` / registry cache in CI, not
multi-platform builds. Node.js app images are the running example.

## Question

Given a Dockerfile and a build context, which steps run and which are reused?

- What goes into the decision "this step is a cache hit"?
- When a step misses, what else has to rebuild?
- What can you read off `docker build --progress=plain`, and what needs a closer
  look?
- Where does "just reorder the Dockerfile" stop being enough?

## Investigation

Mechanism plus the builder's own log, checked against a small reproducible lab
(one tiny Node app, two Dockerfiles).

- **Reading a build.** `docker build --progress=plain` prints one block per step:
  `#N [k/m] <instruction>`, then either `#N CACHED` or `#N DONE <time>s`. The
  `[k/m]` numbering covers the cache-relevant instructions (`FROM`, `WORKDIR`,
  `COPY`, `RUN`, `ADD`); `CMD` / `ENV` / `LABEL` are metadata and do not get a
  step.
- **What a cache key is.** BuildKit hashes each step from its instruction text,
  the digest of its parent step's result, and for `COPY` / `ADD` a checksum of
  the files pulled from the context (path, mode, content). A step is a hit only
  when all of that matches an entry it already has.
- **The lab.** `naive` does `COPY . .` then `RUN npm install`. `ordered` does
  `COPY package.json`, then `RUN npm install`, then `COPY . .`. Change a source
  file that is not `package.json`, rebuild, and read which steps report `CACHED`.

> Done (companion lab, experiment 01): after touching `index.js`, `naive`
> re-runs `npm install` (the `COPY . .` above it changed, so its parent digest
> changed); `ordered` keeps `npm install` cached and rebuilds only the final
> `COPY . .`. Both images come out the same size. Ordering changes what rebuilds,
> not the result.

## Observations

- **A miss cascades to every step below it.** The cache key of a step includes
  its parent's result digest, so once step `k` rebuilds, `k + 1` has a new
  parent and rebuilds too, and so on to the end. The later steps' commands being
  byte-identical does not save them. Measured exactly: a chain of `n` `RUN`
  steps, change step `k`, and `n - k + 1` rebuild, every time.
- **`COPY . .` is the usual cache-buster.** Its key covers every file in the
  context (minus `.dockerignore`), so any source edit changes it. Anything below
  a broad `COPY` pays for that edit. Copy `package.json` alone, install, then
  copy the rest: the dependency layer now sits above the churn.
- **The cache is global and persistent, and `--no-cache` does not isolate you.**
  `--no-cache` stops a build reading the cache; it still writes entries. A later
  build with matching inputs can hit an entry left by an earlier, unrelated
  build. In the lab a fixed marker string produced a spurious hit until each run
  got a unique token. On a shared CI runner this is a real source of "it passed
  locally".
- **`CACHED` is trustworthy; a fast `DONE` is not the same thing.** A step that
  ran but finished quickly still ran. Only `CACHED` means the layer was reused.
- **Image size is a separate axis from cache behaviour.** Experiment 01's two
  variants build same-size final images; only the rebuild path differs.

> Done (companion lab, experiments 02, 05): the cascade is exact. A chain of
> `n` `RUN` steps with step `k` changed rebuilds `n - k + 1` steps at every
> position swept (`n` up to 16), no more and no fewer. And a `.dockerignore`
> that excludes a `node_modules` + `logs` tree cut the context transfer from
> 5.0 MB to 146 B, cut the image from 15.3 MB to 10.3 MB, and kept `COPY . .`
> a cache hit when a file inside the ignored tree changed. Without it, that
> unused file busted `COPY . .`.

## Technical details

**The cache key, per instruction.**

- `FROM`: the resolved image digest. A floating tag (`node:22-alpine`) can
  change under you between builds; a digest pin (`node:22-alpine@sha256:…`) is
  stable.
- `RUN`: the command string plus the parent digest. BuildKit does not look
  inside the command, so `RUN npm ci` is a hit only if nothing above it changed.
  It cannot tell that `npm ci` only reads `package*.json`.
- `COPY` / `ADD`: the source paths, their metadata and a content checksum, plus
  the destination and the parent digest. `.dockerignore` removes files from this
  set before the checksum, which is why it affects both context transfer size
  and whether a `COPY . .` stays cached.
- `WORKDIR`, `ENV`, `ARG`: the literal value plus the parent digest. A changed
  `ARG` used later in a `RUN` busts that `RUN`.

**Ordering rule.** Put the instructions that change least at the top. For a Node
image that is: pinned `FROM`, then `COPY package*.json`, then `RUN npm ci`, then
`COPY . .`, then build. Every step above `COPY . .` is then immune to source
churn.

**Recognising a cache problem from the log.**

- `RUN npm ci` / `RUN pip install` / `RUN go mod download` showing `DONE` on a
  build where only application code changed: something above the dependency step
  is busting it, usually a broad `COPY`.
- A long tail of `DONE` steps after the first miss: the cascade. Find the first
  non-`CACHED` `[k/m]` and fix that one; the rest follow.
- `transferring context: <large>` before the build even starts: a missing or
  thin `.dockerignore`.

## Practical implications

- Order the Dockerfile by rate of change, not by narrative. Dependencies before
  source, always.
- Pin `FROM` by digest for a build you want to be reproducible. A tag is a
  moving target and a silent cache invalidation.
- Keep a real `.dockerignore` (`node_modules`, `.git`, build output, logs). It
  shrinks the context and stops unrelated files from busting `COPY . .`.
- Do not trust "it built fast locally" as evidence the cache is set up right.
  The local daemon may be hitting an entry CI will not have. Check the
  `--progress=plain` log for `CACHED` on the expensive steps.
- When you see a slow build, read the log top-down and stop at the first miss.
  That instruction, not the slow one at the bottom, is the fix.

## Limitations

- **Local `docker build` only.** CI usually needs `--cache-from` /
  `--cache-to` (registry or `type=gha` cache) to carry the cache between runners
  at all. The key mechanics are the same, the plumbing is not, and this note
  does not cover it.
- **`RUN --mount=type=cache` is a separate mechanism.** It keeps a package
  manager's download cache across builds without a layer, so a busted `RUN` no
  longer means "re-download everything". Experiment 03 measured it: after the
  `RUN` layer is busted, a `plain` build fails an offline install while a
  `cachemount` build still works, and the image size is unchanged.
- **Image size is its own note.** Whether a later `rm` shrinks an image and how
  much multi-stage saves are covered separately (experiment 04: a late `rm`
  leaves the image 52 MB larger, multi-stage is 255 MB smaller).
- **BuildKit version.** Cache-key details and `--progress=plain` formatting have
  shifted across BuildKit releases. The lab records the version it ran on.
- **No multi-platform.** `buildx` with QEMU or multiple native nodes changes
  cache behaviour and is out of scope.

## Takeaways

- A step is a cache hit only when its instruction, its parent's result, and (for
  `COPY`) the copied files all match. One miss rebuilds every step below it.
- `COPY . .` above a dependency install is the classic mistake: every source
  edit re-installs. Copy the manifest, install, then copy the rest.
- Pin `FROM` by digest, keep a real `.dockerignore`, order by rate of change.
- `--no-cache` does not give you a clean room. The cache is global and
  persistent, and a matching-input build elsewhere can have populated it.
- Read `--progress=plain` top-down and fix the first non-`CACHED` step. Cache
  behaviour and image size are different problems.

## Evidence: companion lab

[**docker-build-lab**](https://github.com/maku85/docker-build-lab): generated
build contexts (a Dockerfile plus the files it copies) from a fixed template per
experiment, each built with the real `docker build --progress=plain`, with the
verbatim log and the exact context committed under `results/`. Counter-based
(which steps report `CACHED`, `docker history` sizes), not a wall-clock
benchmark. Run: 01 (layer cache ordering), 02 (invalidation cascade, exact
`n - k + 1`), 03 (`RUN --mount=type=cache`), 04 (image-size myths), 05
(`.dockerignore` and context). The image-size results have their own note.
