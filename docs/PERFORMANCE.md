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

### Matched decal captures and room preparation

The 1920×1080 pairs use staged rifle and shotgun hit events against the authored ivory recorder face, the steel island base, and a controlled rotated, mirrored two-sided panel. The panel was added to the visual fixture only. All six decal positions and normals match exactly. Each full image pair had zero differing RGB pixels with the HUD hidden. The native crops were inspected. The pairs are `artifacts/nextgen/perf43/visual/wall-1-native.png` through `wall-3-native.png`.

Reflection capture still reuses its filtered target for a valid room world. Reloads can recreate geometry, dressing and light state, so a room ID alone is insufficient for reuse across a reload. Splitting the six views across frames would spread submission without removing the work from the startup hold. It would also require freezing scene inputs across those frames to preserve the current result. This pass retains capture and filtering within the existing preparation boundary. In the Arc run, Passenger Vault held for 3.37 s at load 22.65, with 2.09 s spent capturing/filtering reflections. Residential Gallery held for 1.66 s at load 20.55, with 0.82 s in reflections. These timings are observations across builds and rigs, with no reflection change to isolate.

The production build passed. The requested Arc seed 1729 campaign cleared Safety Interlock as room 12 and finished at 13 rooms with zero errors, zero recorded defects, and exit status 0. The campaign receipt is `artifacts/nextgen/playtest/perf43-arc/report.json`. The paired profile baseline was `931092c1` and the candidate runtime was `d262ef54`.

## PERF44 — Safety Interlock High render submission

Cleaned former PERF37–PERF42 artifacts and old performance playtests from the assigned worktree. `df -h /Users/chernodub` available space increased from 18 GiB to 34 GiB. PERF43 evidence was retained. The baseline runtime was `d34a6a86`, and the candidate runtime was `2dc1a5be`.

The 15-second Pyro windows used the 100 µs CDP CPU sampler, native frame indices and the existing timestamp anchor. The render interval starts immediately after native update. The middle 5% and slowest 5% are selected by native render duration. Function times below are sampled milliseconds per selected frame. Inclusive rows overlap. Rapier WASM functions are listed by their profiler identifier because the browser build has no Rust line mapping. The corresponding JS call chain reaches `DeathRagdolls.update` at `src/render/DeathRagdolls.ts:219` and `World.step` at line 245. In the initial High profile, the same WASM stack led the tail.

The GPU pass audit now records CPU scope durations alongside the existing asynchronous GPU samples. Scene color includes draw submission, which includes GL calls. The actor draw bucket covers skinned submissions. Light, envelope and effect preparation run before Three resets its counters, so their per-pass means use the adjacent render index. Ink is part of composite, and transparent render time includes gas draws where present. DOM HUD time is the existing native observer's HUD duration. Audit wrappers add CPU overhead. Counts below are direct observations from the instrumented trials.

| Case | Load | Frames | Render p50 / p95 / p99 ms | Program switches p50 | Uniform uploads p50 | Draws peak | DOM HUD p95 ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Before High | 4.17 → 4.87 | 754 | 10.500 / 15.000 / 18.300 | 93 | 1498 | 201 | 2.10 |
| Before Low | 4.87 → 5.31 | 839 | 9.800 / 12.800 / 14.900 | 86 | 1046 | 187 | 1.90 |
| After High | 5.31 → 4.86 | 777 | 10.400 / 13.000 / 14.800 | 98 | 1543 | 211 | 2.10 |
| After Low | 4.86 → 4.66 | 842 | 9.700 / 12.200 / 15.100 | 89 | 1090 | 197 | 1.90 |

| CPU scope (mean ms/frame) | Before High | Before Low | After High | After Low |
| --- | --- | --- | --- | --- |
| ragdollUpdate | 1.795 | 1.296 | 1.445 | 1.312 |
| lightUpdate | 0.005 | 0.003 | 0.006 | 0.004 |
| abilityUpdate | 0.288 | 0.258 | 0.296 | 0.250 |
| marineEnvelope | 0.815 | 0.825 | 0.801 | 0.812 |
| healthBarUpdate | 0.044 | 0.049 | 0.047 | 0.045 |
| effectUpdate | 0.208 | 0.185 | 0.186 | 0.193 |
| pickupUpdate | 0.005 | 0.003 | 0.007 | 0.008 |
| bindFramebuffer | 0.012 | 0.009 | 0.012 | 0.010 |
| bufferSubData | 0.105 | 0.101 | 0.101 | 0.105 |
| bufferData | 0.000 | 0.000 | 0.000 | 0.000 |
| clear | 0.004 | 0.003 | 0.003 | 0.002 |
| useProgram | 0.045 | 0.040 | 0.037 | 0.038 |
| uniformUploads | 0.460 | 0.352 | 0.470 | 0.356 |
| roomAndOtherOpaqueDraw | 1.262 | 1.118 | 1.250 | 1.081 |
| actorDraw | 0.858 | 0.770 | 0.838 | 0.765 |
| transparentVFX | 0.611 | 0.554 | 0.608 | 0.531 |
| gasDepthSnapshot | 0.012 | — | 0.012 | — |
| sceneColor | 4.526 | 4.271 | 4.470 | 4.189 |
| gtao | 0.059 | — | 0.054 | — |
| aoDenoise | 0.017 | — | 0.022 | — |
| bloomExtract | 0.017 | — | 0.017 | — |
| bloomBlurHorizontal | 0.012 | — | 0.011 | — |
| bloomBlurVertical | 0.011 | — | 0.008 | — |
| distortion | 0.017 | — | 0.017 | — |
| composite | 0.024 | 0.075 | 0.026 | 0.072 |
| finalAA | 0.021 | 0.030 | 0.023 | 0.025 |
| frameTotal | 4.773 | 4.424 | 4.715 | 4.334 |
| hud | 0.102 | 0.102 | 0.102 | 0.104 |

#### High median versus Low median
| Function and source | High self / inclusive | Reference self / inclusive | Excess self |
| --- | --- | --- | --- |
| `wasm-function[417] · 007b5d42 · 1` | 0.223 / 0.223 | 0.114 / 0.114 | 0.108 |
| `updateMatrixWorld · node_modules/three/build/three.core.js · 12900` | 0.314 / 0.919 | 0.232 / 0.896 | 0.082 |
| `setValueV3f · Three module · 5234` | 0.157 / 0.393 | 0.090 / 0.256 | 0.068 |
| `toArray · node_modules/three/build/three.core.js · 11146` | 0.166 / 0.166 | 0.104 / 0.104 | 0.061 |
| `wasm-function[42] · 007b5d42 · 1` | 0.109 / 0.248 | 0.048 / 0.158 | 0.061 |
| `addCoordinates · src/render/camera/DrawnMarineEnvelope.ts · 109` | 0.213 / 0.213 | 0.153 / 0.153 | 0.060 |
| `project · node_modules/three/build/three.core.js · 5279` | 0.119 / 0.179 | 0.060 / 0.094 | 0.059 |
| `multiplyMatrices · node_modules/three/build/three.core.js · 10407` | 0.154 / 0.154 | 0.106 / 0.106 | 0.048 |
| `wasm-function[251] · 007b5d42 · 1` | 0.100 / 0.251 | 0.052 / 0.202 | 0.048 |
| `render · src/render/DepthRenderer.ts · 645` | 0.149 / 9.984 | 0.102 / 9.251 | 0.047 |

#### High slowest 5% versus High median
| Function and source | High self / inclusive | Reference self / inclusive | Excess self |
| --- | --- | --- | --- |
| `wasm-function[28] · 007b5d42 · 1` | 0.885 / 0.990 | 0.173 / 0.177 | 0.712 |
| `wasm-function[417] · 007b5d42 · 1` | 0.710 / 0.710 | 0.223 / 0.223 | 0.487 |
| `(garbage collector) ·  · 0` | 0.402 / 0.402 | 0.020 / 0.020 | 0.381 |
| `wasm-function[35] · 007b5d42 · 1` | 0.401 / 4.889 | 0.077 / 1.207 | 0.325 |
| `fitRankBounds · src/render/OriginalCreatureAnatomy.ts · 140` | 0.311 / 0.937 | 0.000 / 0.000 | 0.311 |
| `wasm-function[385] · 007b5d42 · 1` | 0.342 / 0.342 | 0.066 / 0.066 | 0.276 |
| `getComponent · node_modules/three/build/three.core.js · 17113` | 0.260 / 0.273 | 0.000 / 0.000 | 0.260 |
| `wasm-function[325] · 007b5d42 · 1` | 0.363 / 0.363 | 0.127 / 0.127 | 0.236 |
| `applyMatrix4 · node_modules/three/build/three.core.js · 8471` | 0.231 / 0.231 | 0.013 / 0.013 | 0.218 |
| `wasm-function[71] · 007b5d42 · 1` | 0.241 / 0.479 | 0.037 / 0.095 | 0.204 |

#### GPU query receipts
| Case | Scopes | Frame total samples / query p50 ms | Scene color query p50 ms | Composite query p50 ms |
| --- | --- | --- | --- | --- |
| Before High | 14 | 18 / 31.570 | 24.781 | 15.875 |
| Before Low | 7 | 40 / 11.034 | 9.939 | 9.481 |
| After High | 14 | 19 / 50.993 | 28.715 | 18.882 |
| After Low | 7 | 41 / 10.954 | 9.804 | 9.436 |

The largest baseline CPU scope differences were ragdoll stepping (0.50 ms/frame), the inclusive scene submission (0.26 ms), opaque draws outside the skinned bucket (0.14 ms), and uniform uploads (0.11 ms). Light updates, framebuffer binds, clears, buffer uploads and GL program switches were small differences. High had substantially more uniform calls. Three's `setValueV3f` already caches equal values at the uniform location. The observed cost did not justify bypassing that cache or reordering material submissions. State calls (all state-changing APIs) were counted in the bench receipts.

The runtime now caches weighted bone slot inventories per shared geometry and attribute revision, and computes only the three used components of each affine rank-bound transform in the same arithmetic order. Rank bounds still fit the current pose, and Rapier stepping and the High effect pipeline retain their original quality. High p95 fell by 2.0 ms in the instrumented pair. The lower measured ragdoll cost accounts for part of that delta, and the candidate drew more objects. A small improvement in the quiet render tail is plausible, with low confidence that this change alone will meet the 5% budget.

The browser exposed EXT_disjoint_timer_query_webgl2 and returned samples. The High total and scene query medians were consistently larger than Low. Even tiny fullscreen stages reported 15–19 ms and the measured High query envelope exceeded displayed frame intervals. The readings point toward greater High GPU-side pressure, with queue and scheduling time confounded. They cannot establish standalone GPU pass costs or conclusively classify the quiet slips as GPU-bound. The CPU profile separately establishes a ragdoll-heavy submission tail.

The three matched 1920×1080 High captures changed 255 pixels (0.0123%) in the Interlock pincer, 134 (0.0065%) in the Interlock edge warning, and zero in the Swarm Junction crowd. The native crops were inspected. Full-frame differences are below 0.2%, including moving effects. Before and after High manifests had empty error and failure lists.

High's sampled inclusive `fitRankBounds` cost in the slow-render cohort was 0.937 → 0.563 ms/frame. Median GL state calls were 770 → 783 on High and 673 → 704 on Low. All four paired windows recorded zero combat shader compiles.

The production build passed. The Pyro seed 1729 playtest cleared all 13 rooms, including Safety Interlock at room 12, with zero errors and exit status 0. The receipt is `artifacts/nextgen/playtest/perf44-pyro/report.json`. High capture evidence is in `artifacts/nextgen/perf44-visual-after/manifest.json`. The original Low benchmark capture attempted to stage combat while the tier change was preparing materials. Selecting Low before staging the room resolved the capture, with an empty error and failure list in `artifacts/nextgen/perf44-low-fight/manifest.json`.

## PERF45 — ragdoll presentation time budget

The baseline runtime was `2644531f` plus measurement hooks. The 15 s High Pyro and Arc profiles recorded frame-indexed Rapier solve duration, broader ragdoll scope time, active corpses, bodies, joints, end-of-frame contact pairs, solve count and physics admissions. A contact pair is Rapier's narrow-phase pair entry reported per ragdoll collider, including candidates with no active contact point. The count is a workload indicator. It does not count contact points or establish which individual corpse has slept.

### Baseline attribution

Values are p50 / p95 / p99 / max over the initial observed frame windows.

| Rig | Frames | Solver ms | Active records | Bodies | Joints | Contact pairs | Sub-steps | Physics starts |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Pyro | 549 | 0 / 6.8 / 9.3 / 13.4 | 1 / 6 / 6 / 6 | 0 / 87 / 87 / 87 | 0 / 81 / 81 / 81 | 0 / 1710 / 1721 / 1721 | 0 / 6 / 6 / 6 | 0 / 0 / 0 / 5 |
| Arc | 576 | 1.0 / 3.5 / 5.0 / 7.4 | 1 / 3 / 3 / 3 | 15 / 44 / 44 / 44 | 14 / 41 / 41 / 41 | 353 / 885 / 900 / 908 | 2 / 5 / 6 / 6 | 0 / 0 / 0 / 1 |

The slowest 5% of Pyro frames all had six active records with 87 bodies and 81 joints. The median was 1,690 contact pairs and three solves, with up to six solves. Arc's slow cohort had three active records, with medians of 41 bodies, 38 joints, 753 contact pairs and four solves. Neither slow cohort had any multi-start frames. Pyro had a five-start frame elsewhere in the window. The data point to repeated solves with loaded contact graphs rather than admission bursts. They do not identify a never-sleeping record.

### Scheduler and paired run

The presentation world performs at most two solves per render. After an expensive solve, a subsequent frame can use a 60 Hz step when enough time is available. The scheduler uses a rolling solve estimate and an elapsed admission budget of 1.5 ms on High or 1.0 ms on Low before admitting another solve. It drops unpaid whole-step debt. One Rapier solve is synchronous and can exceed the soft budget. Body and joint budgets, collision geometry, solver iterations, admission order and retirement rules are preserved. The 60 Hz step advances hold and terminal timers by the simulated time. The renderer retains existing fall/support handling.

| High rig | Load before / after (start → end) | Frames | Solver p50 / p95 / p99 / max ms before → after | Frames above 2 ms | Render p95 ms | Frame share >20 ms |
|---|---|---:|---|---:|---:|---:|
| Pyro | 5.19→4.95 / 4.71→3.98 | 686 → 661 | 2.1 / 4.7 / 8.9 / 12.2 → 1.2 / 2.3 / 2.5 / 8.4 | 388 → 72 | 13.2 → 10.4 | 16.64% → 27.42% |
| Arc | 4.95→4.59 / 3.98→3.65 | 701 → 655 | 1.5 / 3.8 / 5.0 / 9.3 → 0.8 / 1.4 / 1.9 / 6.6 | 193 → 6 | 11.4 → 10.1 | 23.00% → 25.69% |

Maximum sub-steps fell from six to two in both cases. The broader ragdoll scope p95 was 5.2 → 2.5 ms for Pyro and 4.0 → 1.5 ms for Arc. The runtime retains six visible High ragdolls. The actual maximum active in the Pyro pair was six before and five after, with peak dynamic bodies 71 → 78. All paired windows had zero combat shader compiles. Lower solve and render tails should help on a quiet machine. Instrumented frame shares rose and do not establish that the quiet matrix will meet the 5% goal. Raw profiles and indexed metrics are in `artifacts/nextgen/perf45/`.

### Native death strips

The Pyro fixture used a live Napalm Charge to kill four staged Crawlers on the pool tick. The Arc fixture used a live Overload chain to kill four staged Crawlers. A direct lethal Brute hit exercised the native corpse path. The Brute fixture was moved clear of a sign for the final paired strip. All final capture manifests had empty error and failure lists. Individual captures are 1920×1080 at 0, 100, 250, 500 and 1,000 ms relative to the first captured kill frame.

The strips use unscaled native crops, before on top and after below. Inspected samples show continued movement through the falls. I saw no pop, persistent float, mid-air freeze or stiff locked pose. Later crawler rotations differ slightly after the scheduler changes. The two Brute sequences show the same broad fold and fall, with minor differences in limb orientation. The sign obscures part of one crawler in the multi-kill views. The strips are `artifacts/nextgen/perf45/visual/pyro-crop.png`, `arc-crop.png` and `brute-crop.png` in the same directory.

The production build passed. The requested native Pyro seed 1729 campaign cleared all 13 rooms, including Safety Interlock as room 12, with zero errors and exit status 0. The receipt is `artifacts/nextgen/playtest/perf45-pyro/report.json`.
