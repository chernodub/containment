# PERF17 desktop rendering performance

## Three-commit comparison

The benchmark ran on Chromium ANGLE Metal (Apple M1 Pro, 10 logical cores), at 1920×1080 with native adaptive resolution, 20 seconds per trial. Each round ran Safety Interlock Station and Overload Floor with Pyro and Cryo on High and Low. The final10 heavy inventory ranked these rooms first and eleventh of twenty by draws. The order alternated ABC, CBA, ABC, with A = `d89ed056`, B = `8f5db23b`, C = `35ccb126`. Each build was compiled from its own committed source and dependency lockfile. The matrix uses the same current benchmark driver throughout. The native simulation differs between revisions, including balance and encounter changes.

**The three rounds do not establish a repeatable frame-p95 regression.** Mean High p95 across matched trials was 47.01 → 46.07 → 47.18 ms. From A to B the round differences were +13.88, −4.05 and −12.65 ms. From B to C they were +0.63, −1.23 and +3.95 ms. Mean Low p95 was 30.94 → 29.58 → 31.21 ms. The other checkout's gallery logged capture batches during these trials, through 13:07:02 UTC. One-minute host load alone cannot establish GPU contention. Program counts and draw counts met the requested combat compilation and draw budgets in all 72 baseline trials. The benchmark separately flagged 402–403 retained programs against its inventory limit of 400 in Low Overload on B and C.

Timing columns show the means of four per-trial p50/p95 pairs, in milliseconds. Counts are peaks across the four trials, except compiles, which are summed. Host load spans the four start/end pairs. The [72 individual trial rows](../../artifacts/nextgen/perf17/baseline-rows.txt) retain load for every measurement. Raw samples and trial metadata are in each `baseline-*` directory under [perf17](../../artifacts/nextgen/perf17).

| Round/build | Tier | Trials | Frame | Update | Render JS | HUD | GPU timer | Draws | Triangles | Live lights | Live instances | Retained programs | Combat compiles | Load1m |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| baseline-1-35ccb126 | high | 4 | 20.82/54.38 | 1.78/8.83 | 11.30/26.38 | 0.00/0.55 | 32.82/91.48 | 294 | 583640 | 9 | 668 | 226 | 0 | 21.5–40.1 |
| baseline-1-35ccb126 | low | 4 | 16.73/33.68 | 1.65/7.77 | 10.10/20.47 | 0.00/0.55 | 11.84/49.07 | 282 | 532878 | 0 | 278 | 403 | 0 | 21.5–41.3 |
| baseline-1-8f5db23b | high | 4 | 19.32/53.75 | 2.28/12.80 | 9.17/14.65 | 0.00/0.60 | 39.17/93.85 | 295 | 574720 | 9 | 673 | 226 | 0 | 34.1–89.7 |
| baseline-1-8f5db23b | low | 4 | 16.73/33.73 | 2.00/11.75 | 7.75/10.85 | 0.00/0.60 | 11.60/53.11 | 283 | 543948 | 0 | 252 | 402 | 0 | 34.1–89.7 |
| baseline-1-d89ed056 | high | 4 | 16.80/39.88 | 1.55/6.10 | 7.10/16.38 | 0.00/0.50 | 27.77/72.41 | 292 | 539986 | 9 | 617 | 211 | 0 | 60.4–82.2 |
| baseline-1-d89ed056 | low | 4 | 16.70/27.32 | 1.53/5.73 | 6.50/13.57 | 0.00/0.50 | 10.49/46.15 | 280 | 488164 | 0 | 254 | 372 | 0 | 60.4–85.4 |
| baseline-2-35ccb126 | high | 4 | 20.50/53.88 | 1.78/8.67 | 11.70/25.35 | 0.00/0.55 | 34.03/94.06 | 292 | 585372 | 9 | 667 | 226 | 0 | 34.1–55.5 |
| baseline-2-35ccb126 | low | 4 | 16.77/36.03 | 1.72/8.10 | 10.20/19.95 | 0.00/0.55 | 17.80/47.05 | 274 | 552776 | 0 | 282 | 403 | 0 | 27.5–55.5 |
| baseline-2-8f5db23b | high | 4 | 20.72/55.10 | 2.22/13.08 | 8.77/15.42 | 0.00/0.60 | 35.81/93.06 | 298 | 575696 | 9 | 597 | 226 | 0 | 23.2–29.4 |
| baseline-2-8f5db23b | low | 4 | 16.73/35.48 | 2.05/11.20 | 7.30/10.57 | 0.00/0.60 | 13.58/57.04 | 285 | 552788 | 0 | 255 | 402 | 0 | 20.3–29.4 |
| baseline-2-d89ed056 | high | 4 | 28.90/59.15 | 1.92/7.80 | 8.33/19.48 | 0.00/0.55 | 53.24/103.53 | 297 | 533008 | 9 | 630 | 211 | 0 | 20.2–42.3 |
| baseline-2-d89ed056 | low | 4 | 20.68/40.08 | 1.72/6.88 | 6.95/14.68 | 0.00/0.52 | 27.20/61.75 | 301 | 510334 | 0 | 258 | 372 | 0 | 20.8–42.3 |
| baseline-3-35ccb126 | high | 4 | 16.82/33.30 | 1.65/7.63 | 10.73/21.95 | 0.00/0.55 | 30.35/40.98 | 296 | 578432 | 9 | 662 | 226 | 0 | 22.2–33.4 |
| baseline-3-35ccb126 | low | 4 | 16.70/23.92 | 1.60/7.38 | 9.78/18.72 | 0.00/0.55 | 10.33/13.08 | 278 | 529560 | 0 | 282 | 403 | 0 | 20.8–33.4 |
| baseline-3-8f5db23b | high | 4 | 16.83/29.35 | 1.95/11.13 | 8.40/12.93 | 0.00/0.60 | 31.92/41.01 | 295 | 587552 | 9 | 619 | 226 | 0 | 33.8–50.6 |
| baseline-3-8f5db23b | low | 4 | 16.70/19.55 | 1.97/10.80 | 7.10/9.93 | 0.00/0.60 | 10.08/12.43 | 282 | 544652 | 0 | 259 | 402 | 0 | 29.8–48.6 |
| baseline-3-d89ed056 | high | 4 | 22.95/42.00 | 1.75/6.70 | 8.03/17.55 | 0.00/0.52 | 35.67/68.06 | 290 | 533080 | 9 | 602 | 209 | 0 | 21.8–41.1 |
| baseline-3-d89ed056 | low | 4 | 16.90/25.43 | 1.60/5.72 | 6.25/14.13 | 0.00/0.50 | 15.87/25.13 | 292 | 505792 | 0 | 262 | 372 | 0 | 21.8–51.7 |

## Attribution

Two instrumented Pyro High runs on `35ccb126` used `--breakdown`, which enables cost auditing, CPU/heap profiles, GC tracing and rotating GPU pass queries. These are diagnostic data. The Overload run retained its samples but failed the sustained population guard under instrumentation. All ordinary baseline trials passed that guard. The rotating GPU queries include command scheduling and have overlapping lifetimes. Their values cannot be added or treated as isolated pass costs.

| Contributor | Observed cost | Evidence |
|---|---|---|
| Render submission and matrix uniforms | 7.57 ms estimated thread CPU per render in Safety Interlock, 3.30 ms in Overload | Dominant Safety Interlock leaves include `uniformMatrix4fv`, `uniform3f` and `bindVertexArray`. Median audit buckets cover 17 renders and record about 25,456 uniform uploads in Safety Interlock and 16,974 in Overload. The audit wrappers contribute to these estimates. |
| Creature bounds and motion | 3.58 ms estimated pose/motion CPU per Overload render, plus 0.45 ms mixer/skinning | The two top `applyBoneTransform` stacks are `computeBoundingBox` and `computeBoundingSphere` during rank selection on pool release. Together they account for 4.2 s of raw samples. Their callers scan the same deformed vertices. |
| Post, outlines, and masks | One composite draw and about nine post draws per submission; a median of one gas-depth blit per submission | WARN16 uses the existing composite and borrowed scene buffers. The committed-ID lookup and ground masks do not add a dedicated silhouette pass. The rotating pass queries do not isolate a silhouette or mask overhead. |
| Residues and decals | 0.69–0.91 ms estimated CPU per render across all VFX and telegraph batching; about 35–37 transparent draws per sampled submission | The audit's transparent scope includes all transparent scene work. Recycling and instance ceilings already cover the contact effects. It does not isolate residue or deck overdraw. |
| Pooled lights | Up to 9 active fixture lights on High and 0 on Low. Estimated update share was 0.005–0.008 ms per render | No new scene lights were allocated during ordinary trials. The sample cannot isolate GPU shading per light. |
| Allocations and GC | GC accounted for 0.06–0.17 ms estimated CPU per render with longest traced pauses of 17.3 and 15.1 ms | Concurrent heap and cost probes allocate and can perturb collection. The longest pauses can consume a frame budget, but these runs do not tie GC to the ordinary p95 difference. |
| HUD and markers | 0.25–0.38 ms estimated CPU per render in the profiles, with 0.5–0.6 ms ordinary HUD p95 | The marker code acquired computed styles even when only fixed-color glyphs or no markers were painted. The profiles do not isolate marker drawing, condition chips, hints, or the weapon strip individually. |

[Safety Interlock breakdown](../../artifacts/nextgen/perf17/audit-current/safety-interlock-station-pyro-high-0.md) · [Overload Floor breakdown](../../artifacts/nextgen/perf17/audit-current/overload-floor-pyro-high-0.md)

## Changes

- Rank selection now accumulates Three's skinned box and sphere in the same vertex traversal. It still uses the mesh's native vertex reader and preserves each bound's accumulation order.
- A creature released to a full pool proceeds directly to existing resource disposal. Retained models still restore full detail and reset their pose.
- Target markers request computed styles at most once per update and only when a visible pod or resistance marker needs a theme token.

## Post-restart comparison

The benchmark repeated the same configurations in AB, BA order with the original build and the PERF17 candidate. The initial one-minute load was 75.0. Every trial started above 8. Candidate Overload Floor rows failed the sustained population guard in both rounds and are retained as diagnostics. Certification against the 16.7 ms p50 and 20 ms p95 budgets requires a quiet machine.

| Round | Build | Room | Rig | Tier | Frame p50 ms | Frame p95 ms | Peak draws | Compiles | Load1m start → end |
|---:|---|---|---|---|---:|---:|---:|---:|---:|
| 1 | candidate | safety-interlock-station | pyro | high | 83.1 | 183.3 | 289 | 0 | 37.2 → 29.0 |
| 1 | candidate | safety-interlock-station | pyro | low | 50.7 | 192.4 | 260 | 0 | 29.0 → 23.5 |
| 1 | candidate | safety-interlock-station | cryo | high | 91.6 | 249.6 | 275 | 0 | 23.5 → 21.5 |
| 1 | candidate | safety-interlock-station | cryo | low | 58.5 | 204.9 | 254 | 0 | 21.5 → 19.8 |
| 1 | candidate | overload-floor | pyro | high | 83.8 | 216.0 | 155 | 0 | 19.8 → 17.0 |
| 1 | candidate | overload-floor | pyro | low | 58.3 | 200.1 | 139 | 0 | 17.0 → 19.2 |
| 1 | candidate | overload-floor | cryo | high | 91.9 | 246.5 | 151 | 0 | 19.2 → 15.0 |
| 1 | candidate | overload-floor | cryo | low | 50.0 | 117.2 | 136 | 0 | 15.0 → 12.9 |
| 1 | d89ed056 | safety-interlock-station | pyro | high | 25.4 | 75.1 | 297 | 0 | 69.8 → 45.9 |
| 1 | d89ed056 | safety-interlock-station | pyro | low | 17.5 | 50.0 | 287 | 0 | 45.9 → 38.9 |
| 1 | d89ed056 | safety-interlock-station | cryo | high | 50.1 | 125.0 | 273 | 0 | 38.9 → 44.9 |
| 1 | d89ed056 | safety-interlock-station | cryo | low | 32.5 | 75.4 | 271 | 0 | 44.9 → 70.9 |
| 1 | d89ed056 | overload-floor | pyro | high | 58.4 | 167.5 | 161 | 0 | 70.9 → 68.1 |
| 1 | d89ed056 | overload-floor | pyro | low | 42.1 | 182.8 | 139 | 0 | 68.1 → 55.6 |
| 1 | d89ed056 | overload-floor | cryo | high | 83.7 | 317.0 | 144 | 0 | 55.6 → 42.7 |
| 1 | d89ed056 | overload-floor | cryo | low | 41.8 | 241.4 | 136 | 0 | 42.7 → 41.0 |
| 2 | candidate | safety-interlock-station | pyro | high | 92.8 | 386.4 | 275 | 0 | 13.2 → 11.1 |
| 2 | candidate | safety-interlock-station | pyro | low | 66.6 | 391.3 | 253 | 0 | 11.1 → 10.6 |
| 2 | candidate | safety-interlock-station | cryo | high | 116.6 | 446.0 | 265 | 0 | 10.6 → 10.2 |
| 2 | candidate | safety-interlock-station | cryo | low | 41.8 | 182.4 | 264 | 0 | 10.2 → 11.8 |
| 2 | candidate | overload-floor | pyro | high | 66.7 | 265.8 | 155 | 0 | 11.8 → 13.7 |
| 2 | candidate | overload-floor | pyro | low | 49.3 | 156.8 | 141 | 0 | 13.7 → 12.9 |
| 2 | candidate | overload-floor | cryo | high | 83.0 | 349.3 | 152 | 0 | 12.9 → 12.1 |
| 2 | candidate | overload-floor | cryo | low | 50.2 | 157.2 | 137 | 0 | 12.1 → 10.3 |
| 2 | d89ed056 | safety-interlock-station | pyro | high | 99.5 | 192.0 | 286 | 0 | 10.3 → 10.8 |
| 2 | d89ed056 | safety-interlock-station | pyro | low | 25.1 | 65.9 | 281 | 0 | 10.8 → 15.6 |
| 2 | d89ed056 | safety-interlock-station | cryo | high | 48.7 | 109.6 | 286 | 0 | 15.6 → 20.8 |
| 2 | d89ed056 | safety-interlock-station | cryo | low | 41.3 | 107.4 | 271 | 0 | 20.8 → 17.5 |
| 2 | d89ed056 | overload-floor | pyro | high | 33.5 | 75.2 | 153 | 0 | 17.5 → 18.5 |
| 2 | d89ed056 | overload-floor | pyro | low | 17.6 | 58.6 | 146 | 0 | 18.5 → 16.9 |
| 2 | d89ed056 | overload-floor | cryo | high | 41.3 | 67.5 | 152 | 0 | 16.9 → 16.0 |
| 2 | d89ed056 | overload-floor | cryo | low | 16.7 | 33.8 | 136 | 0 | 16.0 → 17.1 |

The candidate’s measured High p50 was 66.7–116.6 ms and High p95 was 183.3–446.0 ms. Both frame-time targets were missed under the observed load. Across the 32 trials, peak draws were 297 and combat compiles were zero. The minimum trial-start load was 10.2.

## Room preparation

The audit completed all 42 fresh and sequential rows with zero runtime errors and zero combat compiles. Four readiness holds exceeded 3 s.

| Room | Mode | Hold s | Reflection s | Other named phase | Load1m start → end |
|---|---|---:|---:|---|---:|
| manual-control-chamber | fresh | 8.92 | 4.95 | prepareScene 3.23 s | 16.42 → 16.83 |
| overload-floor | fresh | 3.01 | 1.20 | prepareScene 0.98 s | 16.21 → 16.11 |
| reactor-vault | fresh | 3.10 | 1.80 | prepareScene 0.65 s | 16.18 → 16.18 |
| overload-floor | sequential | 16.74 | 15.62 | loadRoom 0.33 s | 15.20 → 14.54 |

Reflection capture dominated the sequential Overload Floor spike. These phase timings are wall time under load. [Room audit](../../artifacts/nextgen/perf17-rooms/rooms.json)

## Build and desktop verification

- The production type check and build passed. The fast native Pyro playtest on seed 1729 cleared all four requested rooms with zero errors. Its Awakening Bay readiness hold was 3.92 s. [Playtest report](../../artifacts/nextgen/playtest/perf17-finish/report.json)
- Compared both requested fixtures against the frozen pre-change build at 1920×1080 and reviewed them at native size and 480×270. All four Relay Racks crowd frames were pixel-identical. The last two initial Pyro frames had different adaptive scales. With adaptive resolution disabled on both builds, seven of eight Pyro frames were pixel-identical. The last differed at 12 pixels by one channel value at most. The three optimizations are retained. [Relay Racks capture](../../artifacts/nextgen/perf17-finish-after/index.html) · [Fixed-resolution Pyro capture](../../artifacts/nextgen/perf17-fixed-after/index.html)
