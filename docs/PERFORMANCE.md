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
| `createBufferSource`, via `src/game/audio/MixEngine.ts:102` | Audio presentation | 1.266 / 1.266 | 0 / 0 | 1.266 |
| `Mesh._computeIntersections`, Three core 23563 | Wall decal raycast | 0.662 / 7.357 | 0 / 0 | 0.662 |
| `#snapshotEnemy`, `src/game/enemies/EnemySystem.ts:739` | Simulation snapshot | 0.606 / 0.606 | 0.103 / 0.103 | 0.503 |
| `Vector3[Symbol.iterator]`, Three core 6030 | Renderer corpse grounding | 0.485 / 0.485 | 0 / 0 | 0.485 |
| `intersect`, Three core 56188 | Wall decal raycast traversal | 0.425 / 7.793 | 0 / 0 | 0.425 |

The recurring stack is `DepthGame.update → updateBullets → AttackEffects.event → wallSurface → Raycaster`. It pays for triangle tests before discarding hits under hidden parents, then casts up to four more rays to validate a decal's support. An independent High trace reproduced the raycast and also had GC among the top sampled frames. Shader compilation and texture upload were absent from these leading stacks.

For the audio owner, extend `AudioSystem.scheduleWarm` and `requestWorkerBuffer` to warm the active rig’s `handleAbility` cues before general recipes, plus all three gun variants. Key jobs by `recipe.id:variant`. Send the variant to the existing synthesis worker and use its PCM to populate `cueBuffers`. Retain the synchronous fallback for unavailable workers. In `EnemySystem.getSystemSnapshot`, investigate reusing immutable per-enemy snapshots by state revision on the full-list path before replacing the per-update freeze. Keep the readonly API and invalidate on every snapshot-visible mutation.

### Renderer change and paired profiles

Wall and impact decals now share a renderer-owned probe with reusable scratch vectors and hit buffers. The recursive cast prunes invisible branches before they produce hits, and standard rigid meshes get a local bounding box during room preparation. The initial ray still uses Three's geometry, side, layer rules and stable distance order. A supported mark still requires all four support points to reach a coplanar surface. A failed corner terminates the support checks immediately.

The same pre-change probe occupied 10.91 ms per selected slow frame on Interlock Low and 17.05 ms on Transmission High. Low therefore shares the update spike. It showed more render-submission headroom in this sample, with a render p95 of 14.1 ms against 20.6 ms at Interlock High. The wall-probe inclusive samples averaged 7.84 → 7.10 ms per selected slow frame at Interlock High, 10.91 → 0 sampled ms at Interlock Low and 17.05 → 6.94 ms at Transmission High. A later Interlock High slow frame also contained corpse grounding in `models.ts` via precise `Box3.setFromObject`, which transforms skinned vertices on death.

| Pyro room and tier | One-minute load before start → end / after start → end | Frames | Update p95 ms | Update p99 ms | Updates >8 ms | GC count / total ms |
|---|---|---:|---:|---:|---:|---:|
| Safety Interlock High | 25.48 → 25.41 / 21.34 → 22.55 | 56 → 27 | 10.9 → 10.0 | 27.2 → 22.2 | 7 → 4 | 15 / 57.82 → 5 / 18.74 |
| Safety Interlock Low | 25.41 → 21.09 / 22.55 → 26.11 | 34 → 32 | 11.2 → 8.3 | 25.8 → 8.7 | 3 → 2 | 5 / 10.33 → 5 / 9.53 |
| Transmission High | 21.09 → 22.01 / 26.11 → 22.77 | 37 → 46 | 22.5 → 17.7 | 43.6 → 43.0 | 21 → 20 | 103 / 70.56 → 109 / 65.85 |

GC counts use main renderer-thread Chrome trace events inside the combat window. Maximum pauses were 23.97 → 9.45 ms, 6.54 → 5.60 ms and 10.30 → 5.69 ms respectively. No combat shaders compiled in the paired windows. The unchanged population guard flagged Interlock Low on both builds (average/median 19.76/20 → 18.94/17). The windows advanced only 1.3–2.7 simulation seconds under host contention. The proportion of Interlock High updates over 8 ms was 12.5% → 14.8%. The small cohorts and varying load leave the overall update tail unresolved. Raw profiles, frame timings, exact GC events and the attribution script are retained under `artifacts/nextgen/perf42/`.

### Matched captures

The 1920×1080 Safety Interlock rifle-impact pair is identical at every RGB pixel. Five shots produced four identical marks with matching positions and normals. An instrumented count in the capture recorded 512 → 504 mesh raycast entries, before Three's geometry bounds and triangle tests. The pincer pair differs at 198 pixels (0.00955%), with small local differences around the creature silhouettes. Both pairs were inspected at native crop size and 480×270. Native/480 pairs and pixel counts are retained under `artifacts/nextgen/perf42/visual/`.

### Loading holds

The current runner exercised Pyro seed 1729 on the frozen `94e3167d` build through three rooms, then used the same flags through thirteen rooms on PERF42. They ran serially. The candidate load was higher, so the elapsed differences are observational.

| Build and room | Runner hold (s) | One-minute load start → end | Renderer preparation (s) | Assets wait (s) | Model parse / transcode (s) | Reflection (s) | Shader wait (s) | Texture uploads (ms) |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| 94e3167d Passenger Vault | 4.39 | 24.20 → 24.67 | 3.23 | 0.86 | 0.43 / 0.32 | 2.00 | 0.03 | 7.0 |
| PERF42 Passenger Vault | 9.05 | 29.85 → 29.36 | 4.36 | 0.81 | 0.35 / 0.22 | 3.19 | 0.07 | 7.5 |
| 94e3167d Residential Gallery | 8.19 | 25.20 → 26.34 | 3.65 | <0.01 | 0.02 / — | 1.84 | 1.19 | 25.4 |
| PERF42 Residential Gallery | 7.93 | 30.90 → 31.22 | 4.24 | <0.01 | 0.07 / — | 3.33 | 0.11 | 19.1 |

Residential Gallery reproduced the five-second defect on the baseline. Passenger Vault crossed it in the candidate trial and also in the earlier PERF41 run on the same-era renderer at much higher load (20.03 s with Arc). The serial comparison cannot isolate a regression at matched load. Reflection capture renders six room views and builds a filtered environment map. It was the largest measured preparation phase in both rooms. Shader readiness was a secondary cost in the older Gallery run. The asset wait includes the ability asset promise, and atlas upload has no separate timer. The runner's hold includes polling/scheduling and can include the time spent saving the loading evidence, so it does not necessarily equal the renderer's preparation total.

The production build passed. The PERF42 native Pyro campaign reached Safety Interlock as room 12, cleared it, and finished at the 13-room limit with zero browser or runner errors. The runner returned exit 1 for the recorded loading defects in Passenger Vault and Residential Gallery. The three-room baseline completed with zero errors and recorded the Residential Gallery loading defect. Receipts are `artifacts/nextgen/playtest/perf42-pyro/report.json` and `artifacts/nextgen/playtest/perf42-w32-load/report.json`.

## PERF43 — wall impacts, audio preparation, and Transmission

### Wall impacts

A room-local horizontal grid indexes triangles intersecting the height band reachable by the impact ray and its four support probes. The bins borrow source attributes, copy only query indices and never enter the render scene. Three performs the actual intersection using the original transform and material. The main probe preserves scene/face order at equal distances. Unsupported and moved meshes retain their native raycasts. At most two probes are drained per presentation frame and room changes clear pending work and dispose query geometries.

### Audio preparation

The first playable room waits for the unlocked audio director to warm active-rig ability phases, all five weapons and three variants per weapon, encounter families including reinforcements, and pickup/UI cues. The synthesis worker receives the actual variant and transfers PCM for the director's cache. A small reserve holds unstarted one-shot Web Audio sources; the mixer refills it between frames. Muting and leaving the run cancel queued preparation and release the reserve. A cold gameplay cue can schedule its buffer for later without replaying an event after a mute or transition.

### Transmission High attribution

The initial 15 s, 100 µs CDP run observed 265 frames. The table ranks the mean excess self time in the 14 slowest native updates against the middle 14. This cohort is separate from the serial verification pair.

| Function and source | Work | Slow self / inclusive (ms) | Middle self / inclusive (ms) | Excess self (ms) |
|---|---|---:|---:|---:|
| `Ray.intersectTriangle`, Three core 22920 | Wall probe | 3.71 / 3.71 | 0 / 0 | 3.71 |
| `checkGeometryIntersection`, Three core 23731 | Wall probe | 3.49 / 12.78 | 0 / 0 | 3.49 |
| `Mesh.getVertexPosition`, Three core 23467 | Wall probe | 2.02 / 5.02 | 0 / 0 | 2.02 |
| `BufferAttribute.getX`, Three core 17147 | Wall probe vertex data | 1.59 / 1.63 | 0 / 0 | 1.59 |
| `#snapshotEnemy`, `src/game/enemies/EnemySystem.ts:739` | Simulation | 1.51 / 1.54 | 0.32 / 0.32 | 1.18 |
| `Mesh._computeIntersections`, Three core 23563 | Wall probe | 0.80 / 13.58 | 0 / 0 | 0.80 |
| `Mesh.raycast`, Three core 23517 | Wall probe | 0.67 / 14.33 | 0 / 0 | 0.67 |
| `checkIntersection`, Three core 23700 | Wall probe | 0.66 / 4.32 | 0 / 0 | 0.66 |
| `Vector3.fromBufferAttribute`, Three core 5983 | Wall probe vertex data | 0.53 / 3.00 | 0 / 0 | 0.53 |
| `clearPolygonTopology`, `src/game/world/polygonGeometry.ts:58` | Simulation navigation | 0.55 / 1.71 | 0.09 / 0.83 | 0.47 |

The largest HeapProfiler allocation sites were `clearPolygonTopology` (233.3 MB sampled), `DrawnMarineEnvelope.captureSkin` (225.8 MB), `Mesh.getVertexPosition` (85.5 MB, several stacks), iterator advancement (75.0 MB, several stacks), `pointSegmentDistanceSquared` (68.6 MB), `segmentDistanceSquared` (51.2 MB), `inside` (48.2 MB), and `#snapshotEnemy` (44.8 MB). Sampling includes objects subsequently collected. The largest navigation path led through `FacilityNavigation.closest` and `waypoint` into room movement. In the gameplay workstream, a candidate optimization is to retain immutable polygon edge coefficients and padded bounds by polygon identity, and reuse them in `clearEdges` inside `clearPolygonTopology`. Maintain the existing continuous collision predicates.

The renderer collapses equal bind vertices and ordered skin influences during envelope-cache construction. Every distinct deformed point still contributes to the existing depth bins. The bin reduction writes only improving extrema. The other large renderer allocation path was the wall probe covered above.

### Serial CPU and allocation profiles

The 15-second windows ran consecutively at the loads below. Update timing excludes the benchmark driver. GC counts are main-renderer-thread Chrome trace events. Audio counts come from Chrome main-thread samples. Source creation is counted only inside the measured native update/render windows.

| Pyro case | One-minute load, start → end before / after | Frames | Update p95 ms | Update p99 ms | Updates >8 ms | GC count / total pause ms |
|---|---|---:|---:|---:|---:|---:|
| Safety Interlock High | 21.55 → 18.97 / 25.13 → 24.30 | 370 → 360 | 8.3 → 6.0 | 15.5 → 7.7 | 20 → 2 | 49 / 56.55 → 36 / 66.97 |
| Safety Interlock Low | 18.97 → 21.82 / 24.30 → 23.22 | 621 → 595 | 5.2 → 5.3 | 15.3 → 8.1 | 23 → 6 | 48 / 79.71 → 49 / 95.98 |
| Transmission High | 21.82 → 25.70 / 23.22 → 21.82 | 306 → 581 | 16.8 → 7.6 | 21.0 → 10.3 | 41 → 25 | 46 / 72.38 → 59 / 75.83 |

| Pyro case | Wall probe inclusive ms per slow update | Main-thread `synthesize` samples | `AudioSystem.buffer` samples | `createBufferSource` samples inside frames |
|---|---:|---:|---:|---:|
| Safety Interlock High | 6.27 → 0 sampled | 54 → 0 | 12 → 0 | 43 → 0 |
| Safety Interlock Low | 6.07 → 0 sampled | 90 → 0 | 59 → 0 | 66 → 0 |
| Transmission High | 11.13 → 0 sampled | 114 → 0 | 79 → 0 | 42 → 0 |

In the render segment corresponding to the Interlock High slow-update cohort, the wall probe averaged 0.041 sampled inclusive ms per frame, with zero sampled self time. The Interlock Low population guard passed in both paired runs (average/median 24.41/25 and 24.25/25). There were zero combat shader compiles.

| Transmission High allocation or GC measure | Before | After |
|---|---:|---:|
| Sampled allocation MB/s | 84.5 | 110.4 |
| Sampled allocation MB per observed frame | 4.19 | 2.87 |
| GC events per 100 observed frames | 15.03 | 10.15 |
| GC pause ms per 100 observed frames | 23.65 | 13.05 |
| `clearPolygonTopology` sampled allocation MB | 286.8 | 401.5 |
| `Mesh.getVertexPosition` sampled allocation MB, all stacks | 87.3 | 55.5 |

The candidate produced nearly twice as many Transmission frames in the same wall-clock window. The remaining absolute allocation growth was led by navigation. The unusually large `captureSkin` allocation leaf from the initial attribution run was absent in both paired windows, so that allocation reduction cannot be isolated from these profiles. Raw profiles, traces and analysis scripts are retained under `artifacts/nextgen/perf43/`.
