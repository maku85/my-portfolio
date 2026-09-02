---
title: "Understanding Docker Image Size"
title_it: "Capire la dimensione delle immagini Docker"
type: note
area: cloud-infrastructure
topics: ["docker", "image-size", "multi-stage-builds", "dockerfile", "buildkit"]
description: "Why a later RUN that deletes files does not shrink the image, why multi-stage is the real lever, and how to read docker history to find the weight."
description_it: "Perché un RUN successivo che cancella file non riduce l'immagine, perché il multi-stage è la leva vera, e come leggere docker history per trovare il peso."
date: "2026-09-02"
status: published
featured: false
slug: understanding-docker-image-size
related: ["understanding-the-docker-layer-cache"]
---

## Context

A Node service image was 1.1 GB. The first fix anyone reaches for is a cleanup
step: `RUN apt-get purge -y build-essential && apt-get clean && rm -rf
/var/lib/apt/lists/*`, added as its own instruction after the install. The image
stayed 1.1 GB. This note is why that does not work, what does, and how to see
where the weight is.

Scope: image size for application images built with `docker build` / BuildKit.
Not registry storage, not pull performance beyond noting compressed vs
uncompressed, not the runtime.

## Question

- Why does deleting files in a later `RUN` not make the image smaller?
- What actually removes weight?
- How do you find which instruction added the bulk?

## Investigation

Mechanism plus a small reproducible lab (four Dockerfiles, sizes read from
`docker history`).

- **An image is a stack of layers, each an immutable diff.** A build instruction
  that changes the filesystem produces one layer holding exactly that change.
  The image's size is the sum of its layers. A layer is never edited after it is
  written.
- **Deleting a file adds a layer, it does not remove one.** A `RUN rm /blob` in a
  new instruction writes a *whiteout* entry: a marker that says "this path is
  gone" for anything reading the merged filesystem. The bytes of `/blob` are
  still sitting in the earlier layer. The image now carries both.
- **The lab.** `inline-clean` does `RUN dd …50MB… && rm /blob` in one
  instruction; `late-clean` splits it into `RUN dd` then `RUN rm`.
  `single-stage` installs a build toolchain in the final image; `multi-stage`
  installs it in a build stage and `COPY --from`s only the artifact.

> Done (companion lab, experiment 04): `late-clean` is 52 MB larger than
> `inline-clean` on a 50 MB blob. The later `rm` reclaimed nothing. `multi-stage`
> is 255 MB smaller than `single-stage`: `apk add build-base` (255 MB) stays in
> the discarded build stage and never reaches the final image.

## Observations

- **Cleanup only helps in the same `RUN` that created the mess.** `apt-get
  install … && apt-get clean && rm -rf /var/lib/apt/lists/*` on one line: the
  layer diff is install-minus-cleanup. Split across two `RUN`s: the first layer
  has the full install, the second has a whiteout, the image has both.
- **Multi-stage is the real lever.** Anything you need only to *build* the
  artifact (compilers, headers, dev dependencies, the full `node_modules` before
  pruning) belongs in a stage the final image does not inherit. The final stage
  starts from a clean base and `COPY --from`s the finished output.
- **`docker history` shows the per-layer weight.** `docker history --no-trunc
  <image>` lists each layer's `CreatedBy` and `Size`. The biggest number points
  at the instruction to fix. `dive` is the interactive version.
- **A broad `COPY . .` ships whatever is in the context.** Without a
  `.dockerignore`, `node_modules`, `.git`, build output and logs all land in the
  image. The companion note's experiment 05 measured a 5 MB context collapse to
  146 B with a `.dockerignore`, and the image shrank by the same amount.
- **`docker image inspect .Size` can lie.** For buildx images built with
  attestations it under-reports because it does not sum the platform layers. Use
  the `docker history` sum, or `docker images` (which reports the same
  uncompressed total).

## Technical details

**Layer identity.** Each layer is content-addressed by the digest of its tar
diff. Two builds that produce the same diff share the layer on disk. This is why
order matters for the cache (companion note) and why a whiteout layer is cheap
in bytes but does not delete anything: it is its own small diff on top.

**Whiteouts.** The overlay filesystem represents a deleted path with a `0/0`
character device named `.wh.<name>` (or an opaque-directory marker). A reader of
the merged view sees the file as absent; a tool that walks the layers sees the
original bytes below and the whiteout above.

**Multi-stage mechanics.** `FROM … AS build` names a stage. A later `FROM`
starts a fresh image. `COPY --from=build /path /path` pulls only those paths into
it. Stages you do not copy from and do not target are still *built* (unless
`--target` skips them) but contribute nothing to the output image. BuildKit also
runs independent stages in parallel.

**Where the weight usually is, for a Node image:**

- the base: `node:22` is ~1 GB, `node:22-slim` ~200 MB, `node:22-alpine` ~130 MB
  (musl, not glibc, which can break native modules);
- `npm ci` before pruning dev dependencies, if it lands in a layer that survives;
- OS build tools (`build-base`, `python3`, `make`) pulled in for `node-gyp` and
  never removed;
- a `COPY . .` that includes `.git` and a local `node_modules`.

## Practical implications

- Put install and cleanup in one `RUN`. A separate cleanup instruction is dead
  weight plus a false sense of having done something.
- Use multi-stage. Build in a stage with the toolchain, `COPY --from` the
  artifact (and only the artifact) into a clean final stage.
- Pick the smallest base that still runs your code. `-slim` is the safe default
  for Node; `-alpine` saves more but test native modules against musl.
- Keep a real `.dockerignore` so `COPY` cannot ship `node_modules` / `.git` /
  build output.
- Read `docker history --no-trunc` (or `dive`) before guessing. Fix the biggest
  layer.
- Do not reach for `--squash`. It flattens history, loses layer sharing and
  cache, and does not fix the cause.

## Limitations

- **Uncompressed sizes.** `docker history` and `docker images` report the
  on-disk uncompressed total. A registry push transfers compressed layers, so
  the number people see when pulling is smaller. The relative comparisons hold;
  the absolute MB do not translate one-to-one.
- **No distroless / scratch measurement.** `gcr.io/distroless` and `FROM
  scratch` for static binaries push further than `-alpine`; not tested here.
- **musl vs glibc not exercised.** The `-alpine` caveat about native modules is
  stated, not measured.
- **One base family (alpine) in the lab.** The multi-stage delta (255 MB) is the
  size of `build-base`; a different toolchain gives a different number, though
  the direction is the same.
- **`--platform` differences.** Multi-arch images and per-platform layer sizes
  are out of scope.

## Takeaways

- An image is the sum of immutable layer diffs. A file written in one layer is in
  the image even if a later layer deletes it; the delete is just another (small)
  layer.
- Cleanup only reclaims space inside the `RUN` that made the mess. A separate
  cleanup instruction is useless.
- Multi-stage is how you actually drop weight: build with the toolchain in one
  stage, `COPY --from` only the artifact into a clean final stage.
- `docker history --no-trunc` names the instruction to fix. `docker image
  inspect .Size` can under-report; trust the history sum.
- Smallest viable base, real `.dockerignore`, no `--squash`.

## Evidence: companion lab

[**docker-build-lab**](https://github.com/maku85/docker-build-lab), experiment 04
(image-size myths) and 05 (`.dockerignore` and context). Four Dockerfiles per the
04 fixture, built `--no-cache`, sizes summed from `docker history` layer sizes
(committed per-variant in `summary.json`). `late-clean` minus `inline-clean` =
52 MB; `single-stage` minus `multi-stage` = 255 MB.
