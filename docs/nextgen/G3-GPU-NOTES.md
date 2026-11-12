# G3 GPU evidence and deterministic work notes

Shipping candidate: `d70f811`, preserved by the lead under `artifacts/nextgen/g3/shipping-dist`. This note separates configured work reductions from measurements on the shared Apple M1 Pro. **The completed intermediate runs do not establish quiet-host 60 fps, and their elapsed-query values do not support isolated additive pass costs.** Final shipping results remain pending the lead's serialized gate/benchmark receipt; no running benchmark was polled to write this note.

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

## Final shipping receipt — pending

| Shipping source | Matrix | Result |
|---|---|---|
| `d70f811` |Lead's serialized full default benchmark: two selected rooms × four rigs × two tiers × three20-second repeats, with per-pass queries|Pending final driver receipt; no values copied from the subtle or pre-AA checkpoints|

The lead will add final shipping frame/load/scale/program summaries and the complete gate results after the frozen run closes. Until then, this note supports the deterministic restructuring and documents the measurement limits; it does not claim the High60fps target or quiet-device signoff has been achieved.
