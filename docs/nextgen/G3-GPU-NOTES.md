# G3 GPU evidence and deterministic work notes

Current correctness candidate: **`34b3c30`**. Frozen timing checkpoints below are explicitly source-labeled `d70f811` or `4939853`; neither is exact-final-HEAD performance evidence. A lead negative-control check on `4939853` prompted the later geometry-buffer fix: reserve/clear background ID0 once per frame and preserve overlay sentinel255, with no extra geometry or post draw. No pending `34b3c30` capture, regression or smoke-retry values are included here. This note separates configured work reductions from completed shared-host measurements. **Reliable additive GPU pass attribution and quiet-host High60fps acceptance are not established.**

## Evidence identity and scope

All completed runs below used Chromium145, ANGLE Metal / Apple M1 Pro, desktop1920×1080 DPR1, Manual-control Chamber / Arc,25 legally staged/replenished enemies, actual native full-kit uses and the existing population/resource/error assertions. A trial requests20 wall seconds. `frames` means retained performance-observer samples (`count`), not simulation steps or resolved GPU queries; frame statistics exclude the first interval. CPU below is update+render+HUD, including fixture-driver work. Render JS is submission time, not GPU completion. Load is the1-minute system load average on10 logical cores, not utilization.

Raw evidence roots are absolute paths in this assigned worktree:

- [Original multi-query diagnostic](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-gpu-before/benchmark.json): preserved original build,2 completed High trials, intentionally interrupted during trial3; no Low trial. Superseded, never a complete passing matrix.
- [Complete isolated baseline](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-gpu-before-isolated/benchmark.json): original source `ab71db8a35d99c3311582a7779136fe9a9742021`,3 repeats per tier,6/6 trials, exit0, `errors:[]`, `budgetFailures:[]`.
- [Intrusive baseline flush diagnostic](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-gpu-before-flush/benchmark.json): same original source,1 repeat per tier,2/2 trials, exit0. Frame/CPU values are explicitly ineligible for production FPS acceptance.
- [Intrusive subtle checkpoint](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-gpu-subtle-flush/benchmark.json): frozen `6616dfe`,1 repeat per tier,2 trials retained, exit1 for one Low combat compile. This art direction was subsequently rejected. No draw/program-inventory miss; the compile assertion remained fatal.
- [Bold before final AA](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-bold-pre-aa/benchmark.json): frozen `cbf1718`,1 repeat per tier,2/2 trials, exit0, `errors:[]`, `budgetFailures:[]`; ordinary submission with the default total-frame GPU probe, before the final FXAA stage. This is intermediate evidence, not the shipping build.

The immutable original directory is `artifacts/nextgen/g3/before-dist`. The subtle JSON records the then-current `g3/final-dist` directory and its source SHA; later directory reuse must not be mistaken for new provenance. Bold-pre-AA JSON records `g3/bold-dist` and `cbf1718`.

## Complete original baseline: N=3 per tier

One rotating stage was queried every third rendered frame, with no flush boundaries. All6 trials retain zero combat compiles, no context/error/resource failures and all native kit/population guards. Program inventories include retained prepared programs, not new combat programs.

| Tier / repeat | Frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Draw peak | Programs / combat compiles | Load1m start→end |
|---|---:|---:|---:|---:|---:|---:|---:|
| High0 |143|84.8 /117.0|9.1 /12.3|10.5 /15.4|201|178 /0|433.0→431.4|
| High1 |94|117.1 /274.4|7.6 /10.7|9.1 /13.1|198|178 /0|431.4→428.9|
| High2 |55|150.6 /292.7|7.0 /9.9|8.5 /13.1|194|178 /0|428.9→439.5|
| Low0 |1094|16.7 /25.0|5.0 /6.9|5.8 /8.8|131|229 /0|439.5→426.7|
| Low1 |1124|16.7 /18.2|4.6 /6.2|5.3 /7.6|132|229 /0|426.7→432.2|
| Low2 |1172|16.7 /18.3|4.3 /6.2|5.0 /7.7|132|229 /0|432.2→427.2|

Baseline internal scale is1 throughout. The script's best-of-N selection uses the smallest scene-color query p50 and keeps the selected trial's same frame/load distribution: High0 and Low1. Because pass attribution is unsupported here, this selection is reproducible bookkeeping rather than evidence that these query values isolate application cost. Choosing lowest CPU p95 instead would select a different High repeat; it cannot be silently substituted.

## Intermediate bold checkpoint: N=1 per tier

The actual-HDR-target preparation correction is present; both tiers have zero combat compiles. The final post-ink FXAA stage is absent. These trials use ordinary submission, but the host was far from quiet and High varied its internal scale. They must not be used as a causal before/after estimate against the baseline at different load and fixed scale1.

| Tier | Frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Draw peak | Programs / combat compiles | Adaptive min / p50 / max | Load1m start→end |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| High |566|25.7 /58.3|5.7 /9.1|6.7 /11.5|206|178 /0|.70 /.70 /.95|697.1→755.5|
| Low |636|18.1 /58.7|5.5 /9.4|6.3 /11.5|130|293 /0|1 /1 /1|755.5→768.2|

High's scale p95 is.925 and mean.7581; Low stays1. Every draw/program guard passes. Both frame distributions miss the requested timing acceptance, and this N=1 checkpoint is not a best-of-three shipping result.

## Why the per-pass values are retained but not attributed

The opt-in profiler uses `EXT_disjoint_timer_query_webgl2`, checks availability asynchronously, rejects pending disjoint queries, never nests elapsed queries, caps retained handles and restores wrapped methods/timer state. The initial multiple-query-per-frame diagnostic produced almost equal hundreds-of-milliseconds readings for scene, tiny bloom passes and HUD. The revised profiler queries only one selected stage per sampled frame; this still produced similarly coarse readings. The further `--gpu-flush` mode calls `gl.flush()` before beginQuery and after endQuery, requesting submission boundaries without `finish`, `readPixels` or a completion wait. It still did not establish reliable stage isolation.

Representative **raw elapsed-query** p50/p95 values below are milliseconds, not accepted isolated shader costs. The baseline column is High0 of the completed isolated N=3 matrix; the subtle column is its one intrusive High trial. Exact per-stage query counts accompany the values. These builds also differ in scale and presentation, so subtracting the columns would not isolate an optimization even with reliable scopes.

| Scope | Original isolated p50 / p95 (query N) | Subtle flush p50 / p95 (query N) |
|---|---:|---:|
| Scene color, including shadow updates |168.38 /194.37 (6)|30.38 /105.85 (26)|
| GTAO |144.06 /174.54 (6)|25.78 /91.00 (26)|
| AO denoise |171.01 /191.89 (5)|31.09 /47.60 (26)|
| Bloom extraction |138.07 /196.19 (5)|34.72 /77.84 (25)|
| Bloom horizontal |149.36 /201.13 (5)|28.75 /62.66 (25)|
| Bloom vertical |147.51 /191.33 (5)|28.97 /67.76 (25)|
| Distortion |163.67 /226.63 (5)|28.79 /62.15 (25)|
| Composite |163.63 /205.85 (5)|32.40 /77.42 (25)|
| HUD |169.82 /199.75 (5)|38.38 /74.98 (25)|
| Separately selected shadow update |not measured|16.91 /52.06 (19), actual1024² target|

For the original isolated selected Low1 trial, scene/HUD query p50/p95 were9.51/21.43ms (N188) and9.35/24.45ms (N187), also too similar to support additive pass attribution. No GPU disjoint interval or nested/busy query was reported in these examples; absence of that flag does not validate timing granularity. The original flush High trial resolved only one query per non-HUD stage: scene168ms, quarter-resolution bloom extraction327ms and blur538/462ms. Its HUD query remained unresolved. This is not sufficient sampling or credible additive cost evidence.

The subtle flush High trial retained801 frames, scale.70–1 (p50.70), load297.4→311.0, frame16.9/50.0ms,215 draws,178 programs and0 combat compiles. Its Low trial retained1094 frames, scale1, load311.0→309.3, frame16.7/17.9ms,134 draws,288 programs and1 combat compile; the unchanged guard failed. Flush frame/CPU values are intrusive and cannot certify production pacing. Root cause is **not proven**: Metal/ANGLE command-buffer granularity and shared-device scheduling are plausible inferences from the observations, not established driver defects or an excuse to accept the values.

Do not sum stage medians or p95s. Scene color explicitly includes shadows, so scene/shadow scopes overlap even on an ideal timer backend. Resolved/pending/abandoned counts remain in each raw JSON. Reliable uncontested pass attribution and quiet-host acceptance remain open. The profiler exposes unsupported or contaminated observations rather than replacing them with invented GPU costs.

Per-pass profiling also suspends the runtime total-frame GPU timer to avoid query nesting. The adaptive controller therefore uses its frame-time fallback in those opt-in trials. They exercise the bounded scale/hysteresis path but do not independently certify production GPU-feedback behavior.

## Deterministic configured work before and shipping

At1920×1080 there are2,073,600 target pixels. The following are logical storage/target-area calculations from the configured formats and samples; they exclude alignment, driver compression, tiling, hidden resolve allocations, screen/swapchain storage, shadow maps and the other AO/bloom/distortion targets. They are neither measured VRAM nor actual covered fragment counts.

| Main target storage | Original configuration | Shipping configuration |
|---|---:|---:|
| HDR color |RGBA16F,8B/px|RGBA16F,8B/px|
| Geometry normal+identity |none|RGBA8,4B/px|
| Sampled depth |4B/px logical|4B/px logical|
| Multisample color+depth |(8+4)×2 =24B/px|none|
| Resolved color+depth |8+4 =12B/px|included in the single-sample targets above|
| Graded ink presentation |none|RGBA8/sRGB,4B/px|
| Total compared logical footprint |36B/px =74.6496MB|20B/px =41.4720MB|

The compared main footprint falls44.44% at native internal scale. At adaptive.70, shipping's compared internal targets occupy.70² of those pixels: **20.32128MB**, excluding the full-size final output. MB here means10⁶ bytes. The original36B estimate assumes the requested2× sample configuration; it is not a statement about a driver's physical sample allocation.

- **Zero extra geometry draws:** normals, actor identity and class share the main opaque MRT draw. Geometry skinning/triangle submissions are not repeated for a separate prepass. The attachment adds output bandwidth; it is not free.
- **MSAA resolve work removed:** main HDR/depth targets use samples0; final FXAA filters the graded ink result. This trades multisample storage/resolve work for one final fullscreen stage and a4B/px presentation target. No GPU-ms saving is inferred solely from the storage ratio.
- **GTAO normal lookup:** the former depth-derived normal evaluates9 depth fetches. A valid geometry-buffer normal needs1 geometry fetch and octahedral decode. At the unchanged half-resolution960×540 AO target, the upper bound is **8×518,400 =4,147,200 fewer normal-reconstruction texture lookups per frame** if all AO pixels have valid geometry. This excludes the unchanged horizon integration/depth samples. Invalid/effect-contaminated geometry still falls back to depth reconstruction after its geometry lookup, so actual savings depend on valid coverage and can be smaller. At adaptive.70,672×378 gives an analogous upper bound2,032,128 lookups. These are lookup counts, not memory transactions or timing measurements.
- **AO and bloom resolution preserved:** AO+denoise remain half resolution, bloom+distortion quarter resolution. At native scale that is518,400 pixels for each AO stage and129,600 for each bloom/distortion stage. The shipping change does not claim another half/quarter-resolution cut that P1 had already implemented.
- **Final AA adds one pass:** without active distortion, High changes7→8 render submissions in this post pipeline (scene included); with distortion,8→9. Default Low changes the original1 forward scene draw to3 submissions (scene→compact composite→final AA). Explicit Low ink-off retains1 forward draw with no post resources. Optional Low AO/bloom/distortion targets stay1×1 and their passes are skipped. HUD rendering is separate and unchanged.
- **Configured area versus executed work:** without active distortion, summing target areas gives original High5,572,800 and shipping native High7,646,400 target-pixels per frame; shipping at adaptive.70 gives4,804,272 because the final AA output remains full-size. These sums ignore geometry coverage, overdraw, MSAA and tap counts and must not be called shaded-fragment totals. Default Low's native sum is6,220,800 versus the old2,073,600; the added contour/AA work is an explicit cost.
- **AA is bounded, not zero-cost:** the retained Three FXAA source declares9 neighborhood luminance samples, an early coherent-pixel return, two edge searches bounded by6 steps each, and a final color sample. The exact compiler execution/cache behavior is not measured here. The former7-tap scene-AA helper is removed from the composite, which again starts with1 scene sample; the new stage filters the ink as well as surfaces. Graded ink is stored in8-bit sRGB for dark-value precision, sampled back to linear, then encoded for the screen after FXAA.
- **Minor point-light specular removed in graphic mode:** point slots beyond the four authored practicals retain diffuse light/attenuation but skip GGX/multiscatter DFG work. The nine pooled minor lights alone can therefore avoid up to **18 DFG texture queries per affected fragment** (two per contributing light), plus BRDF arithmetic. This is a per-fragment upper bound when all nine actually contribute, not a screen average or global18-query saving. Authored practical, key, spot and directional responses remain on their retained paths.
- **Fine floor masks skipped coherently:** full bold shading bypasses the `deckGrain`, `deckScratchPatch` and `deckScratch` fine-detail expressions with a shared uniform branch. Coarse authored floor structure is retained. These three mask expressions can contain multiple noise operations; the claim is not exactly three hardware instructions. Strength/detail/ramp changes use uniforms rather than new shader defines or combat program variants.

The additive options expose full/silhouette/off ink and an independent adaptive-resolution switch. High defaults to full ink plus adaptive.70–1; Low to silhouette and scale1. Manual resolution selection remains separate. Runtime feedback, scale and profiler lifecycle are exposed through the existing performance snapshot/debug renderer rather than new gameplay globals. Deterministic guards remain330 draw headroom (original350 guard also retained),400 programs,160 material families,12 compile passes and zero combat compiles. Changing the look does not authorize relaxing them.

## Earlier RGBA16F candidate — completed full matrix

Application source **`d70f811`**, frozen in `g3/shipping-dist`. The [full benchmark JSON](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-shipping-bench/benchmark.json), [same-selection summary](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3/shipping-gpu-summary.json) and [completed serialized driver receipt](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3/gates/final-gates.json) are retained. The default heavy-room scan selected **Relay Racks and Diagnostic Gallery**;48 trials cover both rooms × four rigs × two tiers × three20-second repeats. There are **37,230 retained performance samples**, `errors:[]`, `budgetFailures:[]`, **zero combat compiles in all48 trials**, maximum **322 draws** and maximum **225 prepared programs**. The330/350-draw and400-program guards pass unchanged.

The command used `--gpu-passes` without `--gpu-flush`. Submission was ordinary, with opt-in asynchronous query instrumentation. As documented above, pass profiling suspends the runtime total-frame GPU timer; adaptive resolution uses the controller's frame-time fallback in this matrix. Raw per-pass attribution remains unvalidated. Trial endpoint load1m ranges **162.8–464.7** on10 cores. The complete benchmark command, including its room scan, took1524.06s at load724.0→162.8. This is not a quiet-device run.

Each row below uses the existing `gpuBestOfN.selectedRun`: lowest scene-color elapsed-query p50 among that case's three repeats. **The selected trial supplies every frame/CPU/load/scale and pass value in that row; no best-CPU substitution or independently selected pass minimum is used.** This reproducible selector does not validate its GPU attribution. The selected run name is `<room>-<rig>-<tier>-<repeat>`. Draw/program peaks in the last column cover all three repeats.

| Room / rig / tier | Selected repeat / frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Scale min / p50 / max | Same-run load1m start→end | Peak draws / programs, all3 |
|---|---:|---:|---:|---:|---:|---:|---:|
|relay-racks /breacher /high|0 /905|16.9 /41.1|7.3 /14.3|8.0 /15.8|0.7 /0.8 /0.95|434.7→434.5|311 /106|
|relay-racks /breacher /low|2 /1095|16.7 /18.0|5.8 /8.4|6.5 /9.5|1 /1 /1|390.0→363.1|173 /221|
|relay-racks /cryo /high|1 /870|16.8 /41.5|6.9 /13.3|7.6 /14.9|0.7 /0.7 /0.95|353.9→417.2|314 /106|
|relay-racks /cryo /low|0 /1087|16.7 /25.3|4.8 /7.3|5.5 /8.6|1 /1 /1|444.3→464.7|185 /221|
|relay-racks /pyro /high|1 /612|18.2 /59.6|7.9 /12.9|8.7 /14.7|0.7 /0.7 /0.925|399.5→367.8|322 /106|
|relay-racks /pyro /low|0 /627|16.8 /83.6|5.4 /9.8|6.2 /11.6|1 /1 /1|341.4→325.9|192 /221|
|relay-racks /arc /high|2 /566|23.7 /66.7|6.6 /12.8|7.5 /14.4|0.7 /0.7 /0.925|274.6→297.7|295 /106|
|relay-racks /arc /low|1 /1093|16.7 /18.1|5.0 /6.5|5.7 /7.6|1 /1 /1|347.8→371.6|167 /221|
|diagnostic-gallery /breacher /high|0 /579|25.1 /58.5|12.8 /23.5|14.1 /27.6|0.7 /0.7 /0.95|428.0→423.9|249 /108|
|diagnostic-gallery /breacher /low|2 /960|16.7 /33.8|5.7 /8.3|6.4 /11.5|1 /1 /1|369.8→342.0|142 /225|
|diagnostic-gallery /cryo /high|1 /717|23.7 /50.7|6.0 /13.4|7.1 /15.6|0.7 /0.7 /0.925|325.4→307.2|241 /108|
|diagnostic-gallery /cryo /low|0 /1156|16.7 /25.1|5.8 /10.8|6.6 /12.2|1 /1 /1|322.1→313.1|156 /225|
|diagnostic-gallery /pyro /high|1 /610|25.3 /56.7|9.5 /17.2|10.7 /20.1|0.7 /0.7 /0.925|293.3→253.9|266 /108|
|diagnostic-gallery /pyro /low|0 /758|17.3 /49.7|6.2 /9.5|7.1 /12.8|1 /1 /1|231.2→218.5|160 /225|
|diagnostic-gallery /arc /high|1 /721|23.7 /49.8|6.9 /10.6|7.6 /13.1|0.7 /0.7 /0.925|206.3→207.8|225 /108|
|diagnostic-gallery /arc /low|2 /763|16.9 /48.8|4.8 /7.6|5.5 /10.0|1 /1 /1|166.4→162.8|132 /225|

**Raw elapsed-query readings, not accepted isolated GPU costs.** Every cell below is p50/p95 milliseconds **[resolved query N]** from the same selected trial as the frame table. Target dimensions and all raw samples remain in JSON. The final AA and HUD target the1920×1080 screen; selected shadow scopes bind actual1024² maps. High scene/composite and half/quarter targets change with the reported adaptive scale. Scene includes shadows; the separate shadow row overlaps it. No stage percentiles are added, and no original→shipping subtraction is presented as a causal pass saving.

### relay-racks / high: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. shadow|24.32 /48.65 [25]|27.43 /38.84 [24]|25.30 /50.19 [18]|28.76 /70.05 [16]|
|GTAO|25.55 /41.93 [25]|24.37 /48.60 [24]|22.59 /60.85 [18]|20.30 /47.42 [16]|
|AO denoise|26.88 /57.58 [25]|24.81 /56.86 [23]|24.38 /78.95 [17]|37.44 /71.97 [16]|
|Bloom extract|27.30 /54.57 [25]|27.23 /40.26 [23]|30.54 /78.07 [17]|27.36 /68.70 [16]|
|Bloom horizontal|30.54 /47.88 [25]|25.77 /46.30 [23]|39.64 /89.52 [17]|35.19 /66.47 [15]|
|Bloom vertical|24.87 /64.66 [25]|27.15 /56.07 [23]|31.96 /60.49 [17]|26.64 /92.28 [15]|
|Distortion|28.44 /49.29 [5]|32.89 /39.26 [2]|25.89 /54.00 [14]|27.95 /58.18 [4]|
|Composite|27.04 /50.57 [25]|29.99 /43.61 [23]|29.69 /88.75 [17]|32.58 /64.60 [15]|
|Final AA|25.54 /73.43 [24]|33.31 /80.31 [23]|33.22 /73.87 [17]|29.84 /59.20 [15]|
|HUD|32.26 /63.90 [24]|33.31 /54.74 [23]|36.09 /61.74 [17]|34.45 /252.00 [15]|
|Shadow update only|18.19 /49.68 [15]|21.48 /37.42 [16]|17.43 /51.43 [13]|17.13 /51.26 [13]|

### relay-racks / low: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. shadow|11.26 /29.17 [92]|13.66 /45.38 [91]|24.04 /59.00 [53]|13.84 /44.75 [91]|
|Composite|9.08 /33.70 [91]|11.25 /45.08 [91]|21.01 /41.60 [52]|13.27 /40.43 [91]|
|Final AA|10.57 /33.92 [91]|11.78 /36.85 [90]|21.58 /52.94 [52]|14.93 /45.05 [91]|
|HUD|11.51 /27.92 [91]|13.40 /40.48 [90]|19.77 /51.07 [52]|15.91 /35.05 [91]|

### diagnostic-gallery / high: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. shadow|40.62 /72.89 [17]|30.69 /39.79 [21]|45.60 /83.85 [18]|32.07 /72.33 [21]|
|GTAO|37.11 /65.26 [17]|34.51 /90.98 [21]|37.56 /117.61 [18]|29.83 /64.20 [21]|
|AO denoise|46.10 /65.88 [17]|34.89 /64.14 [21]|38.42 /93.19 [18]|38.21 /64.52 [21]|
|Bloom extract|51.00 /63.64 [17]|28.52 /72.63 [21]|41.01 /75.71 [17]|39.93 /65.26 [21]|
|Bloom horizontal|34.97 /78.17 [17]|35.19 /54.71 [21]|35.62 /86.24 [17]|33.35 /49.15 [21]|
|Bloom vertical|34.76 /52.15 [17]|33.19 /57.88 [21]|43.83 /82.31 [17]|38.15 /63.77 [21]|
|Distortion|40.82 /75.02 [17]|36.27 /72.99 [21]|40.40 /68.59 [17]|37.59 /55.35 [21]|
|Composite|40.25 /96.02 [17]|33.34 /77.62 [20]|50.75 /69.90 [17]|36.81 /57.66 [21]|
|Final AA|41.94 /97.71 [17]|41.80 /67.57 [20]|53.59 /83.57 [17]|39.04 /71.65 [21]|
|HUD|44.72 /81.72 [17]|33.32 /82.50 [20]|47.95 /70.92 [17]|33.09 /49.67 [21]|
|Shadow update only|21.21 /65.59 [17]|20.22 /80.24 [17]|24.18 /51.45 [13]|15.71 /45.97 [18]|

### diagnostic-gallery / low: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. shadow|24.43 /65.27 [81]|6.91 /25.67 [97]|33.00 /65.37 [63]|29.29 /53.57 [64]|
|Composite|25.22 /50.82 [80]|7.96 /27.06 [96]|33.64 /66.86 [63]|31.43 /67.91 [64]|
|Final AA|27.70 /56.79 [80]|7.61 /24.70 [96]|31.74 /56.30 [63]|36.25 /81.61 [63]|
|HUD|26.17 /58.72 [80]|7.66 /28.32 [96]|33.88 /64.33 [63]|30.77 /61.78 [63]|

The shipping readings continue to show similarly large elapsed values for scene, tiny bloom stages and HUD. For example Relay/Breacher High selected scene24.32ms, quarter-resolution bloom-horizontal30.54ms and HUD32.26ms medians cannot establish independent additive pass costs. This remains a measurement limitation, not proof of a particular driver defect. The complete data does not cure the attribution issue seen in the earlier isolated/flush experiments.

The requested timing acceptance is **not achieved in this matrix**. All24 High trials fail both recorded High p50≤16.7ms and p95≤20ms flags. Five of24 Low trials pass the recorded Low p50≤16.7ms flag; none of48 passes the historical frame-p95≤16.6ms flag, and one of48 passes CPU-p95≤8ms. Flags use unrounded values, so a displayed16.7 can still miss the exact flag. The selected High rows span frame p50 **16.8–25.3ms** and p95 **41.1–66.7ms**; Low also has substantial tails. Neither adaptive scale reductions nor the contested-host explanation supplies quiet-hardware signoff. Different rooms/load/scales prevent treating this matrix and the earlier Manual-control baseline as a matched before/after performance estimate.

The serialized driver also completed the following unchanged desktop gates:

| Gate | Exit | Wall seconds | Load1m start→end | Receipt |
|---|---:|---:|---:|---|
|Desktop smoke|0|128.01|335.9→409.3|`artifacts/nextgen/g3/gates/smoke.log`|
|All20 authored desktop rooms|0|162.33|409.3→625.4|`artifacts/nextgen/g3/gates/authored.log`|
|All42 fresh/retained room entries|0|120.59|625.4→724.0|`artifacts/nextgen/g3/gates/rooms.log`|
|Full48-trial benchmark|0|1524.06|724.0→162.8|`artifacts/nextgen/g3/gates/bench.log`|

The closed room audit records42/42 entries, `errors:[]`, `failures:[]`, maximum complete readiness2078.4ms (<3000),197 prepared programs (<400),66 material families (<160),11 compile passes (<12), and zero first-frame or combat compiles. These are preparation/resource checks, not organic-campaign or quiet-frame certification. Other build/unit/asset gate results belong to the lead report.

This completed full-matrix section supersedes its earlier pending placeholder. The separately completed matched Manual-control comparison is recorded below without mixing its selection or counts into this full-matrix receipt. The configured storage/lookup reductions above are deterministic; reliable per-pass GPU attribution and the High60fps acceptance remain open.

## Matched room/rig shipping recheck — N=3 per tier

The completed [Manual-control Chamber / Arc shipping receipt](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-shipping-matched/benchmark.json) uses the same room/rig,1920×1080,25-enemy native full-kit fixture and three20-second repeats per tier as the [original isolated baseline](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-gpu-before-isolated/benchmark.json). Shipping source is `d70f811`; original is `ab71db8`. All6 shipping trials completed, exit0, with `errors:[]`, `budgetFailures:[]`, **zero combat compiles**, maximum215 draws and294 programs. They retain2888 performance samples. The all-trial shipping load1m endpoint range is160.8–184.7. Both labels use rotating per-pass queries without flush; the runtime adaptive GPU timer is suspended for the same query-ownership reason described above.

This is **matched content, not matched host conditions or internal resolution**. Original High is scale1 and shipping High spends much of the trial at.70; the original selected load is433.0→431.4 versus shipping164.6→171.1. The original and shipping Low both stay scale1, but their host/device contention was not controlled or interleaved. Lower load average alone does not measure GPU availability. These receipts do not establish a causal speedup or explain away a possible Low regression.

The before/after table selects each label's existing `gpuBestOfN.selectedRun`, not the lowest CPU or frame trial. The selected run supplies all timing/load/scale fields. Draw/program peaks cover that label's three repeats for the tier.

| Build / tier | Selected repeat / frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Scale min / p50 / max | Same-run load1m start→end | Peak draws / programs, all3 |
|---|---:|---:|---:|---:|---:|---:|---:|
|Original /high|0 /143|84.8 /117.0|9.1 /12.3|10.5 /15.4|1 /1 /1|433.0→431.4|201 /178|
|Original /low|1 /1124|16.7 /18.2|4.6 /6.2|5.3 /7.6|1 /1 /1|426.7→432.2|132 /229|
|Shipping /high|0 /699|24.1 /49.4|5.4 /8.2|6.1 /10.4|0.7 /0.7 /1|164.6→171.1|215 /179|
|Shipping /low|0 /262|31.7 /250.0|5.5 /9.1|6.5 /11.2|1 /1 /1|181.3→184.7|130 /294|

All shipping repeats remain visible below. In particular the GPU-based selector chooses Low0 (31.7/250.0ms), while Low2 has the lowest frame p50/p95 (25.4/108.3ms); substituting Low2 into the selected table would change the declared selection rule.

| Shipping tier / repeat | Frames | Frame p50 / p95 ms | Load1m start→end | Combat compiles |
|---|---:|---:|---:|---:|
|high /0|699|24.1 /49.4|164.6→171.1|0|
|high /1|573|24.9 /58.5|171.1→183.1|0|
|high /2|606|24.7 /58.3|183.1→181.3|0|
|low /0|262|31.7 /250.0|181.3→184.7|0|
|low /1|308|33.1 /158.0|184.7→169.7|0|
|low /2|440|25.4 /108.3|169.7→160.8|0|

**Raw elapsed-query readings remain unsupported as isolated pass costs.** Each cell is p50/p95 ms **[resolved query N]** from the same selected trial above. No values are summed or subtracted as causal stage savings. A dash means the scope was absent, disabled or not separately measured; it is not a measured zero. Original High has no separately isolated shadow row in that older profiler receipt; shipping scene/shadow scopes overlap. Original Low has no composite/final-AA stage, while shipping Low pays for both.

| Scope | Original High | Shipping High | Original Low | Shipping Low |
|---|---:|---:|---:|---:|
|Scene incl. any shadow|168.38 /194.37 [6]|34.41 /80.76 [21]|9.51 /21.43 [188]|41.41 /100.17 [22]|
|GTAO|144.06 /174.54 [6]|30.02 /52.81 [21]|—|—|
|AO denoise|171.01 /191.89 [5]|31.56 /58.01 [20]|—|—|
|Bloom extract|138.07 /196.19 [5]|37.49 /78.12 [20]|—|—|
|Bloom horizontal|149.36 /201.13 [5]|27.23 /55.88 [20]|—|—|
|Bloom vertical|147.51 /191.33 [5]|28.49 /61.77 [20]|—|—|
|Distortion|163.67 /226.63 [5]|34.55 /65.61 [20]|—|—|
|Composite|163.63 /205.85 [5]|33.10 /54.80 [20]|—|24.55 /59.80 [22]|
|Final AA|—|32.68 /55.66 [20]|—|22.35 /61.64 [22]|
|HUD|169.82 /199.75 [5]|33.15 /77.67 [20]|9.35 /24.45 [187]|29.19 /98.01 [21]|
|Shadow update only|—|21.32 /40.99 [17]|—|—|

Shipping selected High is24.1/49.4ms, which misses both requested High targets despite scale p50.70. Shipping selected Low is31.7/250.0ms, worse than the original selected16.7/18.2ms at scale1. Across all shipping repeats High p50 is24.1–24.9ms and Low p50 is25.4–33.1ms; no trial passes its relevant requested timing flags. **The measured Low slowdown is unresolved and must not be presented as a preserved16.7ms Low path.** The added MRT/composite/AA work is a real configured cost; scheduling, device contention and query effects may also contribute, but their shares are not established by these non-interleaved trials. The raw Low scene/composite/AA/HUD query medians41.41/24.55/22.35/29.19ms still cannot isolate those causes.

The subsequently completed production-feedback and current-host original-Low rechecks are recorded in the next section; no then-pending result was used in the matched table above. Quiet-device60fps acceptance, reliable GPU pass attribution and Low performance preservation remain unproven by the completed evidence.

## Completed Low and production-feedback supplements

Three later completed receipts investigate the unresolved Low cost; no pending packed-HDR capture or timing result is included:

- [`g3-production-feedback`](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-production-feedback/benchmark.json): original full-matrix shipping checkpoint `d70f811`, Manual-control / Arc,1 trial per tier,2 completed trials, per-pass profiler off and no flush. The default sparse total-render GPU query remains, so this is not entirely uninstrumented.
- [`g3-baseline-low-recheck`](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-baseline-low-recheck/benchmark.json): preserved original `ab71db8`, same room/rig,3 Low trials with per-pass queries and no flush, checking the original Low path on the later shared host.
- [`g3-low-aa-bench`](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-low-aa-bench/benchmark.json): five-tap Low-AA candidate `7e098b2`, same room/rig,3 Low trials with per-pass queries and no flush. It includes the equivalent actor-silhouette work skip `a63c0f4`; High retains the previous FXAA. These receipts predate the later packed-HDR experiment and are not evidence for that format.

All8 supplement trials completed with `errors:[]`, `budgetFailures:[]` and **zero combat compiles**. No gameplay, population, native-slot or resource assertion was relaxed. The frame/load/scale values below come directly from each trial; the N=1 production-feedback rows are not labeled best-of-three.

| Receipt / tier / repeat | Frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Scale min / p50 / max | Load1m start→end | Draw peak / programs / combat compiles |
|---|---:|---:|---:|---:|---:|---:|---:|
|g3-production-feedback /high /0|296|41.9 /150.9|5.2 /9.1|6.2 /11.9|0.7 /0.775 /0.95|152.0→150.7|202 /179 /0|
|g3-production-feedback /low /0|297|33.2 /174.6|5.3 /9.2|6.2 /12.0|1 /1 /1|150.7→216.7|128 /294 /0|
|g3-baseline-low-recheck /low /0|576|17.2 /84.4|4.7 /7.5|5.4 /9.1|1 /1 /1|191.9→174.5|127 /227 /0|
|g3-baseline-low-recheck /low /1|711|16.8 /66.0|4.2 /6.7|4.9 /9.1|1 /1 /1|174.5→168.5|127 /229 /0|
|g3-baseline-low-recheck /low /2|396|17.4 /183.4|4.4 /6.5|5.1 /8.7|1 /1 /1|168.5→162.3|125 /229 /0|
|g3-low-aa-bench /low /0|480|32.6 /75.0|5.4 /8.5|6.4 /10.9|1 /1 /1|144.2→117.3|133 /294 /0|
|g3-low-aa-bench /low /1|246|41.5 /266.1|5.5 /10.2|6.7 /12.1|1 /1 /1|117.3→102.7|127 /294 /0|
|g3-low-aa-bench /low /2|468|25.1 /83.0|4.7 /8.6|5.5 /10.8|1 /1 /1|102.7→124.3|133 /294 /0|

Disabling the per-pass profiler did **not** restore the old checkpoint to its target in this run: High41.9/150.9ms and Low33.2/174.6ms. The total-render elapsed query recorded High55.52/92.88ms and Low53.37/92.65ms p50/p95, again not a validated decomposition of frame cost. That earlier harness did not retain `renderPipeline` feedback diagnostics; its scale history is available, but the JSON alone cannot establish the runtime timer's enabled state or feedback freshness throughout the run. The later harness now retains those diagnostics. In all three five-tap Low trials it records adaptive disabled, scale1 and GPU timer disabled, as required for Low; the historical completed-sample counters are not evidence of an active Low timer.

The current-host original Low recheck returns frame p50 **17.2/16.8/17.4ms** with bad p95 tails **84.4/66.0/183.4ms**. The five-tap candidate returns p50 **32.6/41.5/25.1ms**, p95 **75.0/266.1/83.0ms**, at scale1. Neither set certifies the16.7ms target. However, the preserved original returning near17ms while the owned Low path remains materially slower makes **owned presentation cost a credible unresolved contributor**. The outcome cannot be hand-waved as shared-host load: the candidate's load1m is lower (102.7–144.2 versus the original recheck162.3–191.9), although load average still does not control GPU scheduling. The runs are sequential and not a randomized, device-isolated causal experiment; they do not quantify how much of the slowdown belongs to rendering versus contention.

### Same-rule selected Low scopes

Existing `gpuBestOfN` selects original-recheck Low1 (711 frames,16.8/66.0ms) and candidate Low2 (468 frames,25.1/83.0ms). These are the only trials supplying the following raw per-pass values; each cell is p50/p95 ms **[resolved query N]**. The same-stage values remain unvalidated isolated attribution and must not be summed or subtracted as measured savings. Original lacks the compact composite/final-AA stages, so dashes are absent scopes, not measured zeros.

| Scope | Current-host original Low1 | Five-tap candidate Low2 |
|---|---:|---:|
|Scene|26.33 /76.44 [118]|49.02 /125.52 [39]|
|Compact composite|—|56.46 /139.84 [39]|
|Final AA|—|46.63 /123.89 [39]|
|HUD|23.29 /74.16 [118]|44.39 /136.49 [38]|

The candidate's final-AA raw median46.63ms despite a five-read fullscreen shader is another reason not to interpret these scopes as direct isolated shader cost. Both labels keep original resource guards: current-host original max127 draws/229 programs; candidate max133 draws/294 programs; all combat compile counts0.

### Five-tap work bound, not a measured frame win

`7e098b2` replaces **Low only** with five fixed presentation samples, no edge-search loop and a convex blend retaining at least68% of the center pixel. The lead reports acceptance of13 native matched Low quality pairs; this note does not substitute timing for that visual decision. High keeps the bounded Three FXAA described above. The configured Low final-AA ceiling becomes **5×2,073,600 =10,368,000 texture lookups** for a1920×1080 fullscreen draw, before compiler/cache behavior. The previous FXAA source declared9 neighborhood reads plus bounded edge searches; reducing that source-work envelope is deterministic, but the receipts above do **not** show a measured frame-time win or restore Low acceptance. Low still has scene→composite→AA and its extra targets; the five-read filter does not remove those submissions.

`a63c0f4` also skips eight unused neighbor-depth reads and view-position reconstructions for valid actor ID silhouettes; its actor contour branch uses the same identity boundary result and leaves major actor crease processing separate. That bound is per covered actor pixel, not eight reads saved across every screen pixel. It changes shader work rather than hit/gameplay decisions and adds no geometry pass or program variant. Its timing contribution is not isolated by these combined candidate runs.

The completed supplement evidence therefore narrows the issue without closing it: per-pass-query overhead is not the sole explanation for the old checkpoint's miss, the current-host original remains faster than the owned Low candidate, and five-tap AA only proves a smaller deterministic work bound. High60fps, Low preservation and reliable GPU stage attribution remain unaccepted. The subsequently completed packed-HDR matched candidate is recorded in the next section; no then-pending result was used to interpret these five-tap receipts.

## Completed packed-HDR matched candidate — `4939853`

The completed [`g3-packed-bench` receipt](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-packed-bench/benchmark.json) uses frozen `4939853` from `g3/packed-hdr-dist`: Manual-control / Arc,1920×1080,three20-second trials per tier, rotating per-pass queries without flush. All6 trials completed with `errors:[]`, `budgetFailures:[]`, **zero combat compiles**,3766 performance samples, maximum208 draws and294 prepared programs. This matched-content receipt remains separate from the subsequently completed full packed-build matrix and driver recorded below.

| Tier / repeat | Frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Scale min / p50 / max | Load1m start→end | Draw peak / programs / combat compiles |
|---|---:|---:|---:|---:|---:|---:|---:|
|high /0|475|32.8 /76.4|6.4 /10.7|7.6 /14.0|0.7 /0.7 /0.925|90.0→89.9|208 /179 /0|
|high /1|301|41.7 /140.5|5.4 /7.9|6.6 /9.8|0.7 /0.775 /0.95|89.9→91.7|201 /179 /0|
|high /2|636|25.0 /50.4|5.1 /7.5|5.8 /9.8|0.7 /0.7 /0.95|91.7→83.1|207 /179 /0|
|low /0|879|16.8 /42.0|4.8 /7.3|5.5 /9.4|1 /1 /1|83.1→79.5|130 /294 /0|
|low /1|706|16.8 /49.7|4.6 /7.2|5.3 /9.0|1 /1 /1|79.5→74.9|130 /294 /0|
|low /2|769|16.9 /49.9|4.5 /6.8|5.2 /9.1|1 /1 /1|74.9→74.2|130 /292 /0|

Existing `gpuBestOfN` selects **High2** (636 frames,25.0/50.4ms,scale p50.70,load91.7→83.1) and **Low0** (879 frames,16.8/42.0ms,scale1,load83.1→79.5). Their raw elapsed-query p50/p95 values and resolved N follow; no best-CPU or independently selected stage minimum is substituted. Attribution remains unsupported: quarter-resolution and screen-stage query values are still too coarse/overlapping to support additive causal pass costs.

| Scope | Packed High2: p50 / p95 ms [N] | Packed Low0: p50 / p95 ms [N] |
|---|---:|---:|
|Scene incl. any shadow|37.67 /59.74 [19]|29.18 /79.97 [74]|
|GTAO|33.05 /80.17 [19]|—|
|AO denoise|36.31 /57.39 [19]|—|
|Bloom extract|34.88 /89.01 [19]|—|
|Bloom horizontal|37.89 /102.27 [18]|—|
|Bloom vertical|42.49 /92.93 [18]|—|
|Distortion|43.90 /73.48 [18]|—|
|Composite|35.08 /100.97 [18]|31.95 /69.95 [73]|
|Final AA|38.54 /64.61 [18]|31.62 /83.78 [73]|
|HUD|37.49 /94.39 [18]|31.56 /77.34 [73]|
|Shadow update only|29.73 /49.89 [16]|—|

The High end-of-trial `renderPipeline` snapshots show adaptive enabled, final scale.70 and last estimate source `frame`; GPU timer enabled after profiler cleanup. Because the per-pass profiler suspends that timer during its query ownership, the restored end-state is not proof of concurrent runtime GPU feedback throughout the trial. Low snapshots correctly show adaptive/GPU timer disabled and scale1. Raw snapshots remain in the receipt.

### Storage change and quality evidence

Only the main scene-color attachment changes from64-bit RGBA16F to positive32-bit **R11F_G11F_B10F**. Geometry staysRGBA8, sampled depth stays4B/px logical, AO/denoise remain half-float at half resolution, and the graded-ink presentation remains8-bit sRGB. The audited main-color consumers read RGB; source-alpha blending remains in the fragment output, and no destination-alpha blend dependency uses this attachment. This is not a conversion of all HDR intermediates or actor textures. Packed HDR removes stored alpha and reduces floating-point precision; it is not bitwise equivalent to RGBA16F.

The lead accepted the completed24 native captures under `g3-packed-check` across both tiers and bright/dark/crowd scenes, plus8 High and14 Low packing-comparison pairs under `g3-packed-high-ab` / `g3-packed-low-ab`. These visual receipts support the reviewed precision trade; they do not measure GPU time or guarantee every future lighting situation.

| Compared main-target storage | Original High | Pre-packed G3 | Packed candidate |
|---|---:|---:|---:|
| Logical bytes per internal pixel |36|20|16|
| Native1920×1080 MB |74.6496|41.4720|33.1776|
| At.70 internal scale MB |not the measured original setting|20.32128|16.257024|
| Reduction versus original High logical footprint |—|44.44%|55.56%|

Packed G3 is20% smaller than pre-packed G3 in this compared footprint. The16B calculation is sceneRGB4 + geometry4 + depth4 + presentation4; the original36B includes its configured2× HDR/depth multisample storage and resolved attachments. These remain logical format/sample calculations excluding alignment, driver tiling/compression, other targets and full-size output. Original Low had a direct forward path without these post targets, so the36B High comparison must not be reused to claim a memory saving against original Low. There is no extra geometry pass or change to the half/quarter-resolution AO/bloom schedule from packing. No measured GPU-ms saving is inferred from the byte ratio.

Packed Low now records p50 **16.8/16.8/16.9ms** and p95 **42.0/49.7/49.9ms**, a materially better observed distribution than the preceding five-tap candidate25.1–41.5ms p50. However the packed Low host load is74.2–83.1 versus102.7–144.2 for that prior candidate; the trials are not interleaved or device-isolated. This does not prove packing caused the recovery, nor does it dismiss the earlier owned Low slowdown. All packed Low p50 values still exceed the strict16.7ms target and retain long tails. High p50 **32.8/41.7/25.0ms** likewise misses60fps, with p95 **76.4/140.5/50.4ms**, despite adaptive scaling. **Timing acceptance remains open for both tiers.** Only the later completed full-build gates and separate production-feedback receipt may extend acceptance evidence; no pending result is used here.

## Completed `4939853` full matrix — before the background-clear correction

The [packed full benchmark](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-packed-full-bench/benchmark.json), [same-selection summary](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3/packed-full-gpu-summary.json) and [closed packed driver receipt](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3/packed-gates/final-gates.json) describe frozen **`4939853`** from `g3/packed-hdr-dist`. These timings precede `34b3c30`'s reserved-background-ID correction; they are not relabeled as exact final-HEAD results. The default scan again selects Relay Racks and Diagnostic Gallery. All48 ordinary20-second trials (two rooms × four rigs × two tiers × three repeats) completed with `errors:[]`, `budgetFailures:[]`, **zero combat compiles**, maximum **326 draws**, maximum **225 programs**, and45,404 retained performance samples. The330/350-draw and400-program guards remain unchanged.

Trial endpoint load1m ranges66.5–254.7 on10 cores. The whole benchmark command including scan took1471.67s at load138.8→170.0. It uses per-pass queries without flush; normal timing rows retain their ordinary-submission eligibility while the adaptive controller uses its frame fallback during query ownership. These remain heavily contested observations, not a quiet-hardware signoff.

The existing GPU-based selector supplies the same trial's frame/CPU/load/scale and pass values below. It is not replaced by a best-CPU selection. The last column is the worst draw/program inventory across the case's three repeats; all corresponding combat compile counts are0.

| Room / rig / tier | Selected repeat / frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Scale min / p50 / max | Same-run load1m start→end | Peak draws / programs, all3 |
|---|---:|---:|---:|---:|---:|---:|---:|
|relay-racks /breacher /high|2 /698|23.6 /50.1|7.4 /11.8|8.2 /13.9|0.7 /0.7 /0.925|118.8→130.9|293 /106|
|relay-racks /breacher /low|0 /1037|16.7 /25.8|5.8 /10.5|6.5 /11.8|1 /1 /1|130.9→130.6|174 /221|
|relay-racks /cryo /high|0 /1007|16.8 /33.3|6.0 /10.2|6.7 /11.6|0.7 /0.7 /0.95|167.7→168.3|311 /106|
|relay-racks /cryo /low|0 /1048|16.7 /25.9|5.7 /8.6|6.4 /10.1|1 /1 /1|174.4→210.3|187 /221|
|relay-racks /pyro /high|2 /776|17.2 /50.0|7.3 /13.7|8.3 /15.9|0.7 /0.7 /0.95|179.1→216.6|326 /106|
|relay-racks /pyro /low|0 /1121|16.7 /25.0|5.4 /7.5|6.1 /8.7|1 /1 /1|216.6→229.9|194 /221|
|relay-racks /arc /high|0 /1020|16.8 /33.4|5.8 /8.8|6.5 /9.9|0.7 /0.7 /0.95|248.9→241.1|306 /106|
|relay-racks /arc /low|0 /1100|16.7 /25.0|4.8 /7.0|5.4 /8.0|1 /1 /1|199.8→208.2|170 /221|
|diagnostic-gallery /breacher /high|1 /803|17.7 /42.2|8.7 /16.2|9.6 /19.5|0.7 /0.7 /0.95|196.2→209.8|243 /108|
|diagnostic-gallery /breacher /low|2 /1083|16.7 /18.1|5.5 /7.3|6.3 /10.8|1 /1 /1|226.4→230.0|148 /225|
|diagnostic-gallery /cryo /high|1 /978|16.8 /32.8|6.2 /11.1|7.0 /12.8|0.7 /0.75 /0.95|212.2→199.3|245 /108|
|diagnostic-gallery /cryo /low|2 /1130|16.7 /25.1|5.2 /7.1|5.9 /9.6|1 /1 /1|179.7→176.0|147 /225|
|diagnostic-gallery /pyro /high|0 /966|16.8 /33.1|7.7 /12.0|8.6 /14.8|0.7 /0.7 /0.95|176.0→166.6|248 /108|
|diagnostic-gallery /pyro /low|0 /1086|16.7 /24.0|5.6 /7.6|6.4 /11.7|1 /1 /1|137.7→139.8|153 /225|
|diagnostic-gallery /arc /high|1 /1063|16.7 /25.8|6.2 /8.9|6.9 /11.2|0.825 /0.825 /0.95|150.1→155.2|227 /108|
|diagnostic-gallery /arc /low|1 /826|16.7 /50.3|5.2 /7.9|5.9 /9.9|1 /1 /1|192.4→187.6|134 /225|

Every raw stage cell below is p50/p95 elapsed-query ms **[resolved N]**, from exactly the selected row above. It is **unvalidated isolated attribution**, not a sum-able pass budget. Actual target dimensions and all samples remain in JSON; final AA/HUD use1920×1080, shadow updates bind1024² maps, and scene/composite/AO/bloom dimensions follow the same trial's adaptive scale. Scene includes shadows, so the separate shadow row overlaps it.

### Packed relay-racks / high: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. any shadow|31.20 /108.12 [19]|24.68 /51.16 [27]|28.08 /69.92 [22]|23.47 /47.63 [28]|
|GTAO|27.99 /59.24 [19]|28.90 /53.97 [27]|28.49 /53.44 [22]|21.81 /55.55 [28]|
|AO denoise|35.97 /75.17 [19]|27.00 /44.38 [27]|26.04 /93.78 [22]|18.24 /54.41 [28]|
|Bloom extract|37.07 /81.44 [19]|24.47 /47.74 [27]|24.34 /62.56 [22]|25.51 /54.72 [28]|
|Bloom horizontal|30.26 /69.53 [19]|27.81 /50.52 [27]|29.41 /49.79 [22]|26.27 /49.66 [28]|
|Bloom vertical|34.63 /77.41 [19]|21.75 /41.41 [27]|23.70 /64.55 [22]|28.32 /53.51 [28]|
|Distortion|17.22 /45.05 [3]|24.85 /28.76 [3]|33.87 /75.03 [17]|24.77 /29.39 [8]|
|Composite|36.38 /66.76 [19]|27.15 /52.85 [27]|32.00 /62.08 [22]|27.17 /41.07 [27]|
|Final AA|31.12 /95.94 [18]|31.47 /47.17 [26]|33.82 /84.36 [22]|26.32 /44.63 [27]|
|HUD|32.69 /81.69 [18]|26.38 /52.10 [26]|32.20 /71.13 [22]|27.29 /52.15 [27]|
|Shadow update only|13.11 /42.88 [14]|15.02 /43.74 [17]|18.80 /69.42 [12]|14.73 /37.46 [14]|

### Packed relay-racks / low: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. any shadow|21.63 /48.49 [87]|19.48 /53.14 [88]|9.94 /25.02 [94]|7.47 /27.67 [92]|
|Composite|21.73 /47.85 [86]|16.13 /52.90 [87]|8.13 /23.02 [94]|7.82 /23.77 [92]|
|Final AA|19.14 /42.63 [86]|17.38 /51.80 [87]|8.03 /28.10 [93]|9.16 /31.95 [92]|
|HUD|22.22 /48.49 [86]|16.42 /45.56 [87]|9.92 /29.68 [93]|8.68 /28.95 [91]|

### Packed diagnostic-gallery / high: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. any shadow|24.87 /55.40 [23]|21.02 /48.96 [29]|21.03 /45.81 [28]|8.85 /37.44 [31]|
|GTAO|35.74 /56.99 [23]|24.06 /46.48 [29]|22.36 /49.54 [28]|8.77 /34.37 [31]|
|AO denoise|28.20 /69.33 [23]|25.46 /38.13 [29]|26.16 /58.38 [28]|6.66 /34.85 [30]|
|Bloom extract|32.79 /58.34 [23]|24.35 /46.34 [28]|19.31 /46.47 [28]|8.44 /45.20 [30]|
|Bloom horizontal|36.62 /56.73 [23]|21.08 /41.93 [28]|20.66 /39.21 [28]|8.79 /40.08 [30]|
|Bloom vertical|33.81 /72.38 [23]|25.10 /42.70 [28]|24.35 /41.01 [28]|7.94 /34.20 [30]|
|Distortion|33.71 /66.19 [23]|25.33 /48.08 [28]|24.86 /73.59 [28]|5.61 /29.12 [30]|
|Composite|37.59 /63.64 [23]|28.60 /39.96 [28]|19.81 /46.09 [28]|9.99 /35.05 [30]|
|Final AA|35.02 /59.50 [23]|22.90 /44.74 [28]|24.65 /40.56 [28]|9.66 /33.84 [30]|
|HUD|39.70 /68.12 [23]|26.39 /44.20 [28]|23.06 /57.49 [27]|10.20 /39.38 [30]|
|Shadow update only|22.41 /54.80 [19]|13.11 /34.87 [19]|18.03 /54.74 [16]|0.49 /30.32 [15]|

### Packed diagnostic-gallery / low: raw per-pass readings

| Scope |breacher|cryo|pyro|arc|
|---|---:|---:|---:|---:|
|Scene incl. any shadow|14.72 /39.35 [90]|12.19 /27.43 [95]|15.55 /31.90 [91]|21.05 /54.30 [69]|
|Composite|16.33 /41.48 [90]|9.33 /26.18 [94]|13.18 /31.26 [91]|18.93 /53.13 [69]|
|Final AA|17.28 /36.76 [90]|10.49 /29.68 [94]|13.58 /31.57 [90]|22.97 /57.42 [69]|
|HUD|14.81 /35.96 [90]|12.10 /28.38 [94]|15.52 /37.22 [90]|21.29 /47.11 [69]|

The completed packed matrix still misses timing acceptance: **0/24 High p50 flags,0/24 High p95≤20ms flags,8/24 Low p50 flags,0/48 historical p95≤16.6ms flags and2/48 CPU-p95≤8ms flags pass**. Unrounded flags are retained; displayed16.7 may differ from the exact flag by measurement rounding. Some selected cases approach a16.7ms median, but their tails remain above target, and most High cases spend substantial time at.70 scale. Even the relatively low Diagnostic/Arc High query medians (scene8.85ms, GTAO8.77ms, bloom8.44ms, finalAA9.66ms) are similarly sized across very different scopes; they do not validate isolated costs. No timing gains are attributed solely to packed storage or used to accept High60fps.

### Packed production-feedback checkpoint: N=1 per tier

The separately completed [`g3-packed-production`](/Users/chernodub/.t3/worktrees/containment-game/t3-5762f7c1/artifacts/nextgen/g3-packed-production/benchmark.json) is also exact source `4939853`: Manual-control / Arc, one20-second ordinary trial per tier, per-pass profiler off, default sparse total-render queries retained, no flush. Both trials pass their native/population/resource/error guards, with `errors:[]`, `budgetFailures:[]`,0 combat compiles and1290 performance samples. There is no best-of-three selection for this N=1 supplement.

| Tier | Frames | Frame p50 / p95 ms | Render JS p50 / p95 ms | CPU p50 / p95 ms | Scale min / p50 / max | Load1m start→end | Draw peak / programs / combat compiles |
|---|---:|---:|---:|---:|---:|---:|---:|
|high|627|23.8 /58.4|5.2 /8.8|6.1 /10.8|0.7 /0.7 /0.925|168.9→155.0|214 /179 /0|
|low|663|16.9 /74.3|4.3 /6.8|5.0 /9.1|1 /1 /1|155.0→136.4|130 /294 /0|

The High end snapshot now verifies the runtime feedback plumbing: adaptive enabled, scale.70, estimate source `gpu`, smoothed estimate47.23ms, GPU timer enabled with44 completed samples, latest56.30ms and age12 frames,0 disjoint samples. Unlike the earlier missing-metadata production run, this proves recent GPU feedback was being consumed at this snapshot; it does not prove accurate isolated timer granularity or a60fps frame budget. Low correctly records both adaptive and runtime GPU timer disabled at scale1. Whole-render raw elapsed p50/p95 is41.41/79.56ms on High and35.15/63.67ms on Low; these are not pass decompositions. The observed production-feedback frames23.8/58.4ms High and16.9/74.3ms Low still fail requested timing acceptance.

### Closed `4939853` driver and unresolved gate failures

The driver finished, but **not every subcommand passed**. This table retains each recorded exit instead of calling the whole set green:

| Closed driver step | Exit | Wall seconds | Load1m start→end | Receipt |
|---|---:|---:|---:|---|
|resolution-070|0|42.26|62.2→80.6|`artifacts/nextgen/g3/packed-gates/resolution-070.log`|
|allrooms|0|89.43|80.6→110.6|`artifacts/nextgen/g3/packed-gates/allrooms.log`|
|unit|1|167.89|110.6→116.4|`artifacts/nextgen/g3/packed-gates/unit.log`|
|model|0|1.10|116.4→116.4|`artifacts/nextgen/g3/packed-gates/model.log`|
|room-evidence|0|1.15|116.4→116.4|`artifacts/nextgen/g3/packed-gates/room-evidence.log`|
|build|0|6.91|116.4→112.9|`artifacts/nextgen/g3/packed-gates/build.log`|
|smoke|1|103.64|112.9→127.3|`artifacts/nextgen/g3/packed-gates/smoke.log`|
|authored|0|114.98|127.3→110.9|`artifacts/nextgen/g3/packed-gates/authored.log`|
|rooms|0|89.98|110.9→138.8|`artifacts/nextgen/g3/packed-gates/rooms.log`|
|bench|0|1471.67|138.8→170.0|`artifacts/nextgen/g3/packed-gates/bench.log`|
|production-feedback|0|58.01|170.0→136.4|`artifacts/nextgen/g3/packed-gates/production-feedback.log`|

Unit result is **261 files passed,1 failed,1 skipped;3029 tests passed,1 failed,1 skipped**. The retained failure is the unchanged desktop `UiScreens.test.ts` settings/controls fit at1280×720: measured744 exceeds allowed661. Production smoke exits1 on the retained `equipment.glb: net::ERR_ABORTED` asset-request error after its native graphics/input/audio/persistence phases; the error assertion is not filtered or weakened. These failures are not relabeled as passes or assigned an unproven root cause. A later smoke retry is outside this closed receipt.

All20 authored desktop rooms pass. The42-entry fresh/retained room audit has `errors:[]`, `failures:[]`, maximum complete readiness2649.5ms (<3000),197 programs,66 material families,11 compile passes and0 first-frame/0 combat compiles. Build, model preview, room evidence and the completed captures have exit0 as recorded. The lead also ran the new GPU-free micro/lifecycle tests:24 passed plus the existing benchmark self-test; no native micro throughput result is included here.

`34b3c30` is a later correctness candidate, not a claim that these4939853 timing and gate results automatically cover the corrected background-ID behavior. Its pending targeted capture,8-case rig/tier regression, smoke retry and20-room gallery are intentionally absent. The lead will append those only when complete. Quiet timing acceptance remains open, and the UI/asset failures above remain visible until independently resolved or rechecked.
