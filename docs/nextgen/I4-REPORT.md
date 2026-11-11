# I4 — world integration and performance

Working branch: `t3/integrate-world-performance`. Validated application source: `997ba63b8ef6da266671f3bfeb62d44f52c2eb0d`; benchmark accounting: `912053cefce8ed1fd2fafa24d408e4e9648b0935`. The earlier `f533841` gallery and profiles are retained as pre-layout diagnostics. The final handoff supplies the report-only HEAD. No push, PR or merge into `nextgen` was performed.

## What shipped

- Merged G2 (`62e0a04`) into the I3/V2 base (`2248e22`), preserving cinematic world content, all twenty compositions, enemy identity/status treatment, V2 effects, post processing, audio and UI integration.
- Isolated the cinematic render layer from retained actors, projectiles, acid, combat flashes and effects. The native return-to-menu fixture failed on the previous build with 24 foreign gameplay draws, then passed with 0 while retaining 2 live enemies and Continue. The camera mask and autoClear restore even if rendering interrupts; preparation and picking keep their normal layer.
- Advertised `menuPresentation = 'cinematic'`, removed the redundant full-screen DOM veil over that presentation, and retained the readable left-side title scrim. The optional ship SVG is omitted; no scan circle or decorative sector tick remains over the 3D cast.
- Resolved marine weapon/socket transforms after V2 body posing, so brace/dash transitions and shot origins agree in the same frame. A real marine + V2 regression covers brace, dash, paused refresh and restore. Status attachments now refresh after shared-pool aging, matching ability/projectile attachments; Queen ID−1 receives bounded V2 strike/status accents through explicit receipt liveness.
- Fitted the marine and Queen together inside an envelope below the boss header and above the action bar. This is renderer-only camera composition; no collision, resistance, damage or ability balance changed.
- Moved deferred GPU uniform/attribute introspection into preparation without disabling shader error reporting. Static room local transforms and identity scene roots avoid redundant matrix composition; projected marine bounds reuse scratch and cached resize geometry.
- Replaced repeated ragdoll ancestor/subtree walks with one exact parent-first hierarchy pass. Solver rate, iterations, fitted skin contacts, void behavior and budgets are unchanged.
- Reused actor rotation scratch and emissive state; uploaded only live affliction/ability instance prefixes; wrote equivalent particle transforms into retained buffers and cached element color conversions. No VFX capacity or visual tier was reduced.
- Added conservative polygon-edge rejection before the unchanged continuous distance predicate, eliminated query arrays/closures, and reused private navigation grid coordinates while preserving fresh public waypoints and exact route order.
- Merged the22 compatible marine beacon skins into one exact borrowed-skeleton overlay, with retained per-skin fallback for changed visibility, transforms or geometry. Pickups now use retained per-kind/material instances at the native60-item cap; silhouettes, UVs, bob/rotation and shadow flags are preserved. Invisible corpse identity draws are omitted and rigid exit finishes merge. Exact vertex/normal/transform and recovery/disposal tests cover these changes.
- Removed repeated canvas layout reads from pooled UI projection after the final source-mapped profile identified `projectWorld` as the largest JS self-time group. The renderer samples exact CSS dimensions on resize; combat text, threats and health bars share them. Existing projection/near-far/depth/bearing/resize assertions remain, and a new regression proves zero layout reads for 28 projected labels after each of three desktop resizes.
- Added `npm run bench`: sequential production Chromium, native full-kit receipts, 25 legal initial actors, High/Low, twenty-second real-time trials, CPU/heap profiles, GC traces, GPU queries, resource counts and host load. New deterministic tests bound resources, scratch reuse and hierarchy/query work. All High options, effect caps and native corpse limits remain intact.

## Merge conflicts and semantic resolutions

Text conflicts were confined to `scripts/nextgen/README.md`, `capture.mjs`, `debug.ts` and `scenarios.mjs`. The renderer merged automatically; both world and ability hooks remain. Room construction/preparation precedes actor synchronization, ability effects consume the resulting poses, and post receives the final scene/camera.

README retains both workflows. Capture retains comparison/sprite/timing options plus G2's preserved-dist options. Debug retains presentation reset/realtime controls plus G2's seed override. Frame inspection retains I3 layout/map/beat receipts and G2 champion/pickup/Queen receipts.

A semantic conflict survived the automatic merge: G2's generated setup functions interpolated `stageKiting`, whose I3 signature differed. They now explicitly use the retained `stageGraphicsKiting` for room/tier/champion staging. A functional boundary test verifies dispatch. Canonical I3 kiting retains its eighteen-world/twelve-visible gates, spacing and actual input receipts.

## Performance evidence

Final sustained labels: `integration-4-before-budget` / `integration-4-after-budget` (48 unprofiled trials each); `integration-4-profile-before-budget` / `integration-4-profile-after-budget` (16 separate sampled runs each). Raw runs retain all samples and start/end load readings.

Hardware: Apple M1 Pro, 10 logical cores / ANGLE Metal, full Chromium, 1920×1080, DPR1. The machine was severely contended initially: load171–477, 3,172 processes, 63 running, 2.39% CPU idle, 29GB used with 11GB compression. External Chromium/GPU and simulator processes were observed; none was stopped or changed. Later loads decreased but remained variable. Before the final timing queue, load again reached 267 with 2–10% idle; the controller was paused for two ten-minute load retries, recorded in `gates/host-settle-retry.log`. No unrelated process was changed. This work must not be called quiet-host certification.

A final fixture audit rejected the initial-cohort20s runs because losses could leave part of the window calm. The sustained replacement caught363 draws in Breacher (mean25.27 live actors). Invisible corpse identity meshes now skip their already fully discarded draw; rigid exit parts merge by unchanged shared materials. Both remove work without lowering quality or reducing corpse limits. Before runs explicitly use observational baseline mode, allowing a known draw miss to remain measured; final runs retain the350-call gate.

The initial world-only scan selected Relay Racks; an additional full-Arc-kit scan over all twenty rooms selected Awakening Bay at312 draws. Diagnostic Gallery,249 draws versus median252, remains the middle comparison. The first48 trials and the failed/partial fixtures remain separate diagnostic artifacts. A full-kit receipt assertion caught a cursor-placement fixture that could omit Glacier; the final matched driver probes legal cursor positions through the ordinary game API. No cooldown, health or collision override was introduced to repair it.

Final draw budget misses: 4/48 trials (benchmark returns2 when any exceed350). Native audio enabled; target25 replenished native enemies, losses/corpses retained; update includes fixture-driver CPU; CPU also includes post-render HUD synchronization. Before is observational and may exceed resource budgets. Best CPU-P95 trial of three per scenario, selected explicitly; every trial remains in the source JSON. Shared-machine load differs between runs. These are observations, not an isolated causal estimate or quiet-host certification.

| Room / rig / tier | Load before → after | Frame p50 / p95 ms before → after | CPU + HUD average / p95 ms before → after | Draw peak before → after | GPU p95 ms before → after |
|---|---:|---:|---:|---:|---:|
| awakening-bay / breacher / high | 52.57 → 307.91 | 16.70 → 16.70 / 24.90 → 25.30 | 11.60 → 8.85 / 18.70 → 13.40 | 384 → 333 | 11.51 → 14.83 |
| awakening-bay / breacher / low | 41.94 → 313.22 | 16.70 → 16.70 / 25.00 → 25.20 | 10.20 → 6.54 / 15.40 → 9.20 | 205 → 193 | 11.64 → 10.88 |
| awakening-bay / cryo / high | 54.68 → 349.03 | 16.70 → 16.70 / 25.20 → 25.20 | 12.60 → 9.74 / 18.70 → 14.10 | 403 → 346 | 12.55 → 12.93 |
| awakening-bay / cryo / low | 121.78 → 354.58 | 16.70 → 16.70 / 25.30 → 25.30 | 10.05 → 6.81 / 15.80 → 9.60 | 217 → 192 | 11.42 → 12.24 |
| awakening-bay / pyro / high | 123.12 → 338.43 | 16.70 → 16.70 / 25.20 → 18.10 | 13.07 → 10.50 / 19.80 → 14.20 | 396 → 372 | 15.00 → 11.85 |
| awakening-bay / pyro / low | 83.38 → 346.71 | 16.70 → 16.70 / 25.30 → 18.00 | 10.11 → 7.09 / 16.00 → 9.80 | 221 → 190 | 11.35 → 12.28 |
| awakening-bay / arc / high | 55.23 → 351.01 | 16.70 → 16.70 / 25.30 → 25.20 | 10.52 → 7.77 / 15.90 → 11.50 | 361 → 325 | 11.75 → 12.96 |
| awakening-bay / arc / low | 92.45 → 357.03 | 16.70 → 16.70 / 25.20 → 18.00 | 8.94 → 6.26 / 13.20 → 8.30 | 202 → 176 | 11.21 → 11.87 |
| diagnostic-gallery / breacher / high | 84.58 → 316.95 | 16.70 → 16.70 / 25.20 → 18.10 | 8.39 → 8.56 / 12.90 → 13.00 | 314 → 293 | 12.90 → 11.70 |
| diagnostic-gallery / breacher / low | 35.90 → 345.52 | 16.70 → 16.70 / 25.30 → 25.20 | 5.84 → 6.01 / 8.90 → 9.10 | 195 → 161 | 11.31 → 11.84 |
| diagnostic-gallery / cryo / high | 21.53 → 274.66 | 16.70 → 16.70 / 18.10 → 25.30 | 10.37 → 9.61 / 14.20 → 13.70 | 312 → 288 | 12.78 → 11.68 |
| diagnostic-gallery / cryo / low | 56.15 → 313.48 | 16.70 → 16.70 / 25.10 → 25.20 | 6.86 → 6.20 / 9.80 → 8.80 | 196 → 165 | 11.30 → 11.27 |
| diagnostic-gallery / pyro / high | 33.89 → 238.29 | 16.70 → 16.70 / 18.10 → 25.30 | 10.73 → 9.36 / 15.00 → 13.70 | 337 → 280 | 11.26 → 12.22 |
| diagnostic-gallery / pyro / low | 49.67 → 246.77 | 16.70 → 16.70 / 18.10 → 18.00 | 7.75 → 6.64 / 11.20 → 10.20 | 212 → 170 | 12.04 → 12.36 |
| diagnostic-gallery / arc / high | 43.95 → 266.68 | 16.70 → 16.70 / 25.20 → 17.90 | 7.60 → 6.87 / 11.20 → 10.10 | 300 → 256 | 13.42 → 13.37 |
| diagnostic-gallery / arc / low | 127.30 → 255.44 | 16.70 → 16.70 / 25.30 → 18.00 | 5.77 → 4.97 / 8.50 → 7.40 | 180 → 150 | 12.48 → 12.09 |

All requested p50/p95/max fields, including update, render JS, post-render HUD, audio synchronization, fixture-driver cost, triangles, total visible scene instances and active scene lights, are in [the complete metrics table](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/performance-metrics.md). [Separate allocation/GC/native-audio profiles](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/profiles.md), [exclusive CPU self-time groups](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/cpu-costs.md), [all selected runs and samples](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/performance.json), and [runtime asset/source witnesses](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/runtime-witness.json) accompany it. All three repeats remain in each source label's `benchmark.json`; the same best-CPU-p95 trial supplies every metric in each row.

Across all 48 final timing trials, draw-budget failures are Awakening/Cryo repeats0 and1 (355 and352), and Awakening/Pyro repeats1 and2 (372 and369). The benchmark correctly returns exit2; the other44 trials meet the draw threshold. This is a real resource-budget miss, independently of host contention. Every final trial records a running native audio context, all four accepted kit receipts, zero `createProgram` calls, no GL error and no context loss. All final timing loads span238.29–396.20 on ten logical cores; before loads span20.87–140.97. The host remained busy through two timed retry windows, so there is no quiet-machine acceptance result.

The final cached-viewport profile removes `projectWorld` from the top30 exclusive self-time groups; its pre-fix group consumed10,714.7 sampled milliseconds across the16 diagnostic runs. Remaining final groups include world matrices (9,139.5 ms), Rapier WASM function417 (9,027.6 ms) and Three material/program setup (7,408.5 ms). Those are aggregate exclusive samples, not per-frame timings or isolated causal speedup estimates. Sampled allocation remains42.97–90.68MB/s after versus43.26–447.73MB/s before (including instrumentation and collected objects). Native graph capacity averages0.06–0.07%; individual callback CPU duration remains unavailable. Global allocation-free hot-loop acceptance is unfulfilled.

Initial-cohort and silent datasets are retained as diagnostics only.

Before runtime is the preserved merged build plus opt-in instrumentation, under `artifacts/nextgen/integration-4-before-dist/`; its SHA256 witness is retained. The benchmark's `sha` identifies the harness checkout, not a claim that a preserved before build contains later implementation. The final after runtime is likewise preserved with source maps under `artifacts/nextgen/integration-4-budget-dist/`; earlier after snapshots remain diagnostic.

A final trial targets25 live enemies through legal native spawns, retains deaths/corpses, and uses normal movement/collision/rifle firing and accepted native abilities whenever available. Marine invulnerability, initial Overdrive charge and fixture population are the only overrides. Realized simulation time, enemy min/average/percentiles, replenishments, movement and slot receipts are reported. Population median must remain≥24 and average≥22, allowing transient burst deaths and natural reinforcements. Fixture-driver CPU is measured and included in update totals. The conservative CPU total also adds the post-render HUD synchronization cost; the separate updateRender field retains update+render alone. This is repeatable sustained combat, not organic balance certification. The first RAF interval straddles setup: retained raw, excluded only from frame interval statistics; CPU samples remain intact.

The first mapped CPU profile identified shader `getProgramInfoLog` as the largest non-idle sample group, then polygon edge predicates, Rapier and world matrices. The admission/skin-fit audit found only about8ms sampled over the whole20s run, so another geometry cache was deliberately not added. A later native-audio profile mapped the largest remaining JS self group to repeated canvas dimensions in `projectWorld`, interleaved with combat-text DOM writes. The cached viewport fix addresses this measured layout thrash without changing projection math, clipping or desktop resize behavior. Post remains half-resolution AO, quarter-resolution bloom/distortion and the existing High DoF; no quality setting was lowered.

An additional fixture audit found that a canvas click did not invoke `audio.unlock()`. Earlier silent timing/profile datasets remain diagnostic only. The final matched matrix uses the real Start handler and asserts a running native realtime WebAudio context for every trial.

Audio figures are main-thread audio synchronization/routing. Profiling additionally records CDP WebAudio graph rendering capacity and running callback-interval means; individual native callback CPU durations are not exposed. GPU timer queries are available but include scheduling contention. Heap sampling includes collected objects and benchmark instrumentation; traces and raw profiles are retained. Immutable simulation snapshots, Three/Rapier bindings and input/UI paths still allocate: the deterministic tests prove bounded retained render resources and specific hot-path reuse, not global zero allocation.

## Visual review

Round1 (`integration-4-round1`,720p):25 frames. Opened title, armored Queen and all four full-kit sheets. Found the redundant veil and Queen/header/action-bar composition defects, then fixed both.

Round2 (`integration-4-round2`,720p):13 frames, no failures/errors. Opened title, armored/exposed Queen and Pyro sheet. Hero/alien visibility and logotype contrast are restored; both Queen phases retain headroom and the action bar stays below the marine. The matched Pyro frame differs in only80/921,600 pixels beyond RGB-sum6 (byte RMSE0.434), with no intentional quality reduction.

The final capture matrix passed all ten batches with **zero failures and zero console/page errors**: 1080p title (fresh and saved run), four rig selections, onboarding/beat, armored/exposed Queen, radar, five pickups, champions, authored standby exit, reward/route/results; native breach; sixteen `ability:*` sheets; four25-enemy full-kit Armory sheets; calm+kiting sheets for all20 story rooms; Low in Awakening/InfestedWorkshop/ManualControl; 720p title/rig/onboarding/Queen/native kiting/Pyro/results; actual V2/G1 recovery. Opened every20-room combined sheet, every16 canonical ability sheet, all four kits, all three Low kiting sheets and the critical1080p/720p views. Additionally opened the sixteen V2 phase timelines (112 frames, including short dash anticipation) and eight full-kit palette sheets (56 frames on green Infested Workshop and warm Overload Floor). The latter use twelve-enemy visual setups and do not replace the sustained 25-enemy benchmark. Raster-comparison evidence follows below.

Title text stays in the left≈44%, both menu states retain crisp focus and both cinematic actors fit. Queen, marine, intro card, bar, action bar and radar retain clear separation at720p. Cryo facets/white cores, Pyro edge/smoke forms, kinetic amber and Arc forks remain distinct against the new deck surfaces; deployables have normal prop/depth occlusion. Dense overlapped enemy bodies can still obscure local accents, and some Low practical highlights remain bright: inherited art limits, not a claim of universal readability.

A further raster critique caught a batching regression: exit emissive-strip positions were lost, changing practical selection near the door. `batch(...,true)` now retains original light origins and tags merged geometry; a functional SceneLighting test proves equal candidates, selected positions/colors/energy and bounds. The corrected batching comparison at `f533841` has world-only exit light ROI byte RMSE 0.527; the later `997ba63` viewport cache preserves the projection math and geometry, and receives its own full capture/gate rerun. The full 720p image differs in 45,921 pixels (4.98%, byte RMSE 17.206): inspection shows transient HUD/toast timing and onboarding placement differ, so the full image is retained rather than claimed identical. Exact candidate/color/energy tests and the world-only comparison support lighting equivalence. Raw batching comparison: `artifacts/nextgen/integration-4-pre-layout/batching-quality-comparison-final.json`. All old batches/comparison data remain; final labels end in `-final` and are recaptured from the corrected build. Pickups differ in 3 pixels (0.00033%, RMSE 0.032); the matched seven Pyro phases differ in 0.06–0.76% of pixels with RMSE 0.47–1.81. No visual quality tier was lowered. The subsequent cached-viewport comparison (`viewport-quality-comparison.json`) retains all 20 matched phase-3 frames: the four full-kit heavy fights are byte-identical (RMSE 0), while all sixteen individual abilities remain within 0.00024–0.867% changed pixels and byte RMSE 0.056–1.317. Full differences are retained rather than labeled identical.

First ten review paths (capture label `integration-4`; **438 frames / 98 sheets**, final source batches):

1. [Title after combat,1080p](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-core-final-i4-menu-after-combat.png)
2. [Fresh title,720p](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-720-final-i4-title-new.png)
3. [Queen plus intro/HUD,720p](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-720-final-i4-boss-beat-fixture-reactor-vault.png)
4. [Exposed Queen](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-core-final-g2-queen-exposed-reactor-vault-sprite.png)
5. [Breacher heavy kit](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-kits-final-v2-full-breacher-armory-armory-sprite.png)
6. [Cryo heavy kit](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-kits-final-v2-full-cryo-armory-armory-sprite.png)
7. [Pyro heavy kit](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-kits-final-v2-full-pyro-armory-armory-sprite.png)
8. [Arc heavy kit](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/integration-4-kits-final-v2-full-arc-armory-armory-sprite.png)
9. [All twenty room compositions](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/rooms-overview.png)
10. [All sixteen abilities](/Users/chernodub/.t3/worktrees/containment-game/t3-b97e3a5f/artifacts/nextgen/integration-4/abilities-overview.png)

 The native Queen/intro-card check additionally found the radar covering the right silhouette. Two CSS rules move boss radar into the camera-reserved bottom band, including short desktop windows; all29 HUD/beat tests pass and the recapture clears the model without widening the camera.

Gallery consolidation rejects failed batches and mismatched application JS/CSS fingerprints, retains each source manifest/SHA and produces calm+kiting sheets for every room. Native breach/exit fixtures require actual scheduling/spawn and visibility receipts; the Queen/beat fixture is explicitly marked as presentation evidence.

## Tests and gates

No gameplay, determinism, persistence, desktop, keyboard, accessibility, navigation or safety assertion was removed or weakened. No presentation pin was removed or rewritten by I4. G2's inherited presentation-test rewrites remain unchanged and are itemized in `G2-REPORT.md`.

Fixture updates only:

- `SafeRoomLoading.test.ts`: supplies benchmark observer variables when executing the actual RAF body; every freeze/resume/input assertion remains.
- `DeathRagdolls.integration.test.ts`: supplies retained player-velocity scratch to the thin renderer fixture; every lifecycle/contact assertion remains.
- `RendererPreparation.test.ts`: supplies a real empty static world for transform preparation; every image-readiness assertion remains.

Additive coverage: cinematic layer isolation and exception-safe restoration; exit light-origin preservation; exact pickup instancing, merged beacon vertices/normals and lifecycle; same-frame marine weapon/socket alignment and shared-light ordering; bounded Queen V2 status/strike receipts; zero-layout-read projection after three desktop resizes; exact particle matrix/color equivalence and buffers; all16 abilities under saturation with bounded meshes/materials/geometries/instances/lights; actor scratch/status transitions; ragdoll pose equivalence and one-visit hierarchy; camera envelope; shader introspection before input release; static transform retention; all20 audio/renderer environments; polygon differential EPS/tangency/void probes; prior navigation paths and mutation isolation; capture helper dispatch.

Final source `997ba63` passed all independent gates below. HUD is included in the conservative main-thread total. Independent Vitest used `VITEST_MAX_WORKERS=2`:

```text
npx vitest run --exclude scripts/cryo-model-preview.test.mjs
Test Files  210 passed | 1 skipped (211)
Tests       2525 passed | 1 skipped (2526)
Duration    126.45s
node --test scripts/cryo-model-preview.test.mjs: 2 passed, 0 failed
npm run build: tsc --noEmit + vite build passed
npm run test:room-evidence: 28 passed, 0 failed; ragdoll CPU checks 33 passed
npm run test:smoke: Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
npm run test:authored-smoke:all: exit 0 (default three-room desktop suite)
20-room authored extension: exit 0; all 20 real keyboard move/fire receipts, errors []
Capture integration-4: 438 frames / 98 sheets, zero failures/errors
npm run verify: exit 1 at documented missing Blender; preceding unit/model and first three Python artifact stages passed
```

`verify` first encountered two unchanged 5-second tests timing out under severe host contention (PCM synthesis and Room8 material disposal). The independent full Vitest rerun passed without changes, then a serialized `VITEST_MAX_WORKERS=1 npm run verify` rerun passed unit/model stages and the first three Python artifact stages before the documented missing Blender failure. The failed run is retained as `gates/verify-load-timeouts.log`; no timeout or assertion was relaxed.

`npm ci` completed at the start. Gate logs and result JSON are retained in `artifacts/nextgen/integration-4/gates/`. Build retains the existing large-chunk warning; bundle restructuring belongs to the parallel UI/bundle task. Blender was neither installed nor bypassed, and the Python tests were not modified.

## Integration requests and honest gaps

Keep the cinematic feature contract/scrim, optional debug performance observer and room-aware G2 setup dispatch when merging parallel UI/playtest work. The UI task's input/accessibility/bundle ownership was respected; edits there are confined to the cinematic parent veil, two boss-radar placement rules, opt-in frame measurement and small viewport access hooks in gameAdapter/combat text/threats. Preserve the renderer viewport getters and these hooks: the source-mapped profile identified repeated canvas layout reads as the remaining top JS group.

Strict High frame/CPU/draw acceptance and global zero-allocation acceptance remain **unmet**. In the selected best-of-three High trials, conservative CPU average is6.87–10.50ms and p95 is10.10–14.20ms; frame p95 is17.90–25.30ms against16.6ms. Four of48 final trials exceed350 draws, peaking372. No performance-budget signoff is implied by the successful functional gates. Recommended follow-up: repeat the unchanged matrix on quiet hardware, then address remaining actor/skeleton matrix work, Rapier/query costs, material submission and immutable snapshot churn without lowering effect capacities or changing balance. These artifacts do not certify another mid-range GPU. The existing GLB topology, sprite volumes and dense actor overlap remain inherited art limits; this task does not redesign them. No new dependency, licensed asset, phone path, push or PR was introduced.
