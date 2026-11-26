# Performance pass — September 6, 2026

## Findings and changes

The earlier pass removed CPU corpse baking, but live boon events still validated the entire event ledger and copied its arrays on every shot/hit. Work grew with encounter length. A live resolver now keeps the same deduplication, depth, per-chain and encounter limits using Set/Map lookups. Its effect-command generator is shared with the original pure reducer; differential tests check that both produce identical commands and state across mixed combat events. Checkpoint and public reducer input validation remain intact.

SkeletonUtils cloned a distinct 122-bone skeleton for each of the marine's 22 mesh parts. Equivalent skeletons now share one skeleton within each actor; materials likewise share four actor-local copies. Different actors retain independent bones/materials. Marine aim/socket calculations update only the required ancestor paths rather than repeatedly forcing the entire rig hierarchy. Disposal releases shared actor resources once.

Enemy rigs and materials now return to a bounded pool after corpses clear or rooms change. Loading prepares two normal rigs and one elite for each standard species, plus the queen. Common animation actions, all five weapon poses, textures, screen-output shader variants with/without shadows, and initial GPU buffers are prepared before the title becomes interactive. Shader preparation uses the actual screen output configuration: compiling only an offscreen target would prepare different color/tone-mapping variants. New pool misses may still construct a rig; no claim that every spawn is allocation-free. Pools retain at most four idle rigs per species/elite key.

Reverse navigation reuses its queue, adjacency and expanded obstacle rectangles. Slab collision queries no longer allocate nested arrays per segment. Settled corpses stop doing collision movement checks.

## Graphics workload

- Presentation targets 60 Hz on 60/120/144 Hz displays. Elapsed time is retained; missed frames do not create a backlog of catch-up renders.
- High is the default on desktop and touch, with bloom, shadows and DPR up to 1.5.
- Low is manually selected, caps DPR at 1 and disables shadows/postprocessing.
- Automatic quality and frame-budget downgrades have been removed. WebGL recovery reapplies the selected quality. Reloading starts at High.
- Hidden tabs stop rendering. WebGL loss handling remains in place.

## CPU measurements

Measured in the same Node test environment using production model geometry/animations with textures removed for Node loading. Values below are milliseconds per operation, medians. These are CPU microbenchmarks, not browser FPS or GPU timings.

| Operation | Before | After |
|---|---:|---:|
| Late-encounter boon event (events 1900–1999) | 0.828 | 0.005 |
| New enemy rig + first animation | 2.385 | 2.064 |
| Reused prepared enemy rig + first animation | — | 0.029 |
| Marine + 18 enemies: animation, matrices and skeleton updates | 1.790 | 1.396 |
| Navigation goal change | 0.370 | 0.143 |
| Marine skeleton instances | 22 | 1 |

The late-event median fell approximately 99.4%. Reusing a prepared rig cost approximately 98.8% less than constructing one in the baseline. Neither percentage is an overall game speedup. Raw p95/max data are retained in `performance/before.json` and `performance/after.json`; some post-change maxima are higher because these short, shared-host runs include scheduling/GC noise. They do not prove elimination of worst-case frame gaps.

Reproduce the CPU report from the project directory:

```sh
PROFILE_GAME=profile.json npm test -- tests/performance-profile.test.ts
```

## Verification and diagnostics

Regression coverage checks pure/live event equivalence, history isolation and safety limits, skeleton independence, single resource disposal, pooled corpse revival, 60/120/144 Hz pacing, and manual High/Low quality selection and recovery. Existing combat, all 48 boons, collision, navigation, weapon alignment, health-bar and checkpoint tests remain part of the full suite.

For future device diagnosis, `window.__containmentPerformance` returns a local snapshot on demand: recent frame times, update CPU times, render-submission CPU times, frames over 50 ms, effective quality, all-pass draw calls/triangles, geometry/texture counts and context-loss state. A fixed 120-sample ring records numbers; it does not write logs, send telemetry or add gameplay UI. Render-submission timing is not GPU execution timing.

No physical MacBook, Safari, or browser performance trace was available in this pass. Browser testing was not performed. First-time room construction, audio decode, driver behavior and device-specific GPU limits can still produce pauses; the changes target reproduced CPU scaling defects and identified rendering costs.

## PERF42 — Safety Interlock update spikes

CDP sampled the renderer thread at a requested 100 µs interval in each 15 s combat window. A User Timing marker aligned the trace clock with the native frame observer. The observer's update window includes synchronous presentation callbacks from simulation events. It excludes render submission and the bench's fixture work. Figures below are sampled milliseconds per selected frame. The first comparison uses the three slowest and three middle updates out of 56 High Pyro frames on a shared host. Inclusive rows overlap. Native built-ins can lack source coordinates.

| Function and source line | Work | Slow self / inclusive | Middle self / inclusive | Excess self |
|---|---|---:|---:|---:|
| `checkGeometryIntersection`, Three core 23731 | Wall decal raycast | 3.044 / 6.314 | 0 / 0 | 3.044 |
| `synthesize`, `src/game/audio/synthesis.ts:52` | Audio presentation | 2.300 / 2.414 | 0 / 0 | 2.300 |
| `Mesh.getVertexPosition`, Three core 23467 | Wall decal raycast | 2.068 / 2.068 | 0 / 0 | 2.068 |
| `AudioSystem.buffer`, `src/game/audio/AudioSystem.ts:316` | Audio presentation | 1.503 / 3.970 | 0 / 0 | 1.503 |
| `Ray.intersectTriangle`, Three core 22920 | Wall decal raycast | 1.287 / 1.287 | 0 / 0 | 1.287 |
| `createBufferSource`, native Web Audio | Audio presentation | 1.266 / 1.266 | 0 / 0 | 1.266 |
| `Mesh._computeIntersections`, Three core 23563 | Wall decal raycast | 0.662 / 7.357 | 0 / 0 | 0.662 |
| `#snapshotEnemy`, `src/game/enemies/EnemySystem.ts:739` | Simulation snapshot | 0.606 / 0.606 | 0.103 / 0.103 | 0.503 |
| `Vector3[Symbol.iterator]`, Three core 6030 | Three vector iteration | 0.485 / 0.485 | 0 / 0 | 0.485 |
| `intersect`, Three core 56188 | Wall decal raycast traversal | 0.425 / 7.793 | 0 / 0 | 0.425 |

The recurring stack is `DepthGame.update → updateBullets → AttackEffects.event → wallSurface → Raycaster`. It pays for triangle tests before discarding hits under hidden parents, then casts up to four more rays to validate a decal's support. An independent High trace reproduced the raycast and also had GC among the top sampled frames. Shader compilation and texture upload were absent from these leading stacks.

For the audio owner, extend `AudioSystem.scheduleWarm` and `requestWorkerBuffer` to queue the three gun variants keyed by `recipe.id:variant` and prioritize the recipe IDs that miss in `buffer` during combat. Send the variant to the existing synthesis worker and use its PCM to populate `cueBuffers`. Retain the synchronous fallback for unavailable workers. In `EnemySystem.getSystemSnapshot`, investigate reusing immutable per-enemy snapshots by state revision on the full-list path before replacing the per-update freeze. Keep the readonly API and invalidate on every snapshot-visible mutation.
