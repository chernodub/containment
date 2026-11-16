# F11 renderer performance

F11 instruments costs and reduces redundant presentation work. The full six-room, two-rig, two-tier matrix is retained under `artifacts/nextgen/f11-final/`. Counts and payload measurements establish the savings below. Shared-host CPU/GPU contention prevents certification of the 16.7/20ms frame budget; raw GPU timer intervals do not isolate additive pass costs on this ANGLE/Metal run.

## Implementation

`npm run bench -- --breakdown` enables asynchronous rotating GPU scopes, native draw/triangle/target-footprint counts, referenced texture/render-target payload estimates and CDP CPU/heap capture. The combat driver advances a fixed 720 ticks at seed 1729 for a twelve-second simulation segment; native spawning/refills and ability rules remain authoritative. This is a deterministic staged combat segment, not a native campaign or a hardware FPS test. Ordinary `bench` remains realtime. A separate `--breakdown --cpu-only --fixed-resolution` phase profiles 360 fixed ticks (six simulation seconds) with pass/count probes and GPU timers disabled, keeping all ticks rendered. CDP `ThreadTime` supplies measured main-thread CPU ticks; exclusive active sample counts estimate its subsystem split. This excludes descheduled time in the measured total, while the subsystem split remains statistical. Raw CPU profiles are source-mapped, with exclusive sample weights assigned to the leaf's subsystem or nearest recognized caller for native/unidentified leaves. Idle and unknown samples remain explicit.

GPU scopes include shadow updates, native opaque, transparent/VFX, demanded gas depth copies, AO/denoise, bloom stages, distortion, combined ink/lens/grade composite, final AA and HUD geometry. Ink/lens/grade share one shipping shader and cannot be separately timed without changing the workload. `sceneColor` includes native scopes, shadows and copies; total scopes overlap children. Never add their percentiles. Targets/fill are footprint counts, not fragment overdraw. Memory estimates exclude driver padding, hidden browser buffers and unreferenced pool resources.

## Changes

- Denoised AO uses R16F rather than RGBA16F. The packed source AO still retains all four channels for normal-aware denoising. Composite reads only denoised red; its precision is unchanged. At 1920×1080, one half-resolution target saves 3,110,400 bytes and the same amount of attachment write payload per denoise pass. No passes or draws are removed.
- Reticle CSS setters skip unchanged position, dimensions, opacity, spread, contact opacity, reload ring and state values. Reads use inline style state; no geometry/layout read is added. Timers, events and visible cadence remain unchanged.
- Fullscreen replacement post passes replace attachment clears with color-attachment invalidation, preserving the discard intent for tile renderers. GTAO and its denoiser retain their white clears because their shaders discard background pixels; opaque scene/depth clears remain intact. At 1080p with bloom active, this replaces five clears covering 4,536,000 target pixels per frame (six and 4,665,600 pixels when distortion is active). Low replaces the composite/AA clears covering 4,147,200 pixels.
- Adaptive resolution starts responding after 250ms above its threshold, versus 650ms; the GPU threshold is 16ms instead of 17.5ms, and fallback threshold 18ms instead of 20.2ms. The lower bound is 0.9 instead of 0.8. This preserves requested image scale and does not guarantee frame timing under overload.

## Measurement limits

Shared-host load reached hundreds in the one-minute load average. GPU elapsed queries also include device scheduling contention. Tiny post draws sometimes report tens of milliseconds, demonstrating that the assumption of load-independent pass milliseconds does not hold on this ANGLE/Metal run. CPU sampling time deltas also contain scheduling effects; native CPU estimates use active sample counts apportioned against measured thread CPU ticks, with raw wall weights retained. [Chromium records ThreadTime from ThreadTicks](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/inspector/inspector_performance_agent.cc); [ThreadTicks excludes descheduled time](https://raw.githubusercontent.com/chromium/chromium/main/base/time/time.h). Profiling overhead, fixture refresh renders, cache contention and clock frequency still prevent treating this as quiet-host frame certification. Fixed-step observer intervals contain eight logical ticks and frozen RAF presentation opportunities; they are not native frame latencies. Per-render profile estimates include debug refresh submissions. Ordinary realtime trials are kept separately for total CPU/frame observations. Counts and payload differences are the strongest evidence here. Invalidation replaces a clear API call rather than reducing total API calls; its timing benefit is unproven unless the amplified diagnostic supports it. Earlier [G3 observations](G3-GPU-NOTES.md) also failed to establish reliable additive stage costs, including with intrusive flush boundaries; no driver root cause is asserted.

The new marine's four referenced 2048² RGBA maps consume about 85.3MiB including mips. Reducing actor texture sizes or changing loading policy is outside F11 ownership. Existing static-shadow invalidation, half-resolution AO and quarter-resolution bloom were already implemented and retained.

## Candidates retained

Static architecture shadows already invalidate only when dirty. AO and denoise were already half resolution, bloom/distortion quarter resolution. M10 already shares marine mixer evaluation, freezes hidden enemy pose sampling and samples waiting/circling skeletons at 30Hz while keeping attacks, reactions, roots and facing live. Active actor/nest ID sets and HUD layout transforms are already retained. F11 preserves these paths rather than claiming them as new savings.

## Structural results

All 24 GPU/count trials per version began with 25 legal native enemies. Both rigs exercised dash, tactical, power and Overdrive through native rules; replenishment kept pressure near 25. Both matrices recorded zero GL errors, zero context loss and zero combat program creations. The maximum over **all actual renders**, including HUD geometry, was 124 draws before and after, below the 330-draw cap. No draw reduction is claimed.

Across after High trials the minimum scale was 0.9; the baseline minimum was 0.925. Earlier response can lower scale sooner, so changing scale is not an isolated shader-speed comparison. In five Breacher rooms the final High render-target inventory was 45.9–48.0MiB versus Low's 39.6MiB; Overload Floor was 53.9MiB versus 47.6MiB. Inventories reflect the target size at collection, while scale minima describe the whole trial. Referenced scene textures were unchanged by F11. Low retains fewer post passes, fewer draws and fewer referenced textures than High.

For Coolant Plant/Breacher/High, measured inline CSS setters fell from 32.253 to 29.090 per fixed tick (9.8%); Arc fell from 34.219 to 31.051 (9.3%). These counts include debug refresh/RAF renders. Low clear calls fell from 6.375 to 2.125 per fixed tick, with 4.25 invalidations replacing them. High clear savings vary with distortion activity. The replacement preserves attachment-discard intent; it does not reduce GL API call count. AO denoise storage falls from eight to two bytes/texel, saving 3,110,400 bytes at 960×540; Low's unused 1×1 placeholder saves only six bytes. Target inventories also change with adaptive scale, and those changes are not all attributed to R16F.

## Verification and visual evidence

The production type-check and Vite build passed after merging `nextgen` and installing its repaired lockfile with `npm ci`. No tests were added or run. The native Breacher campaign at seed 1729 finished by natural death in Diagnostic Gallery: ten rooms cleared, eleven entered, zero runner errors and zero recorded defects. It rendered every fixed simulation tick; no fast or forced-progress mode was used. Campaign wall duration was 1,957.206s; host load was 296.65/331.25/404.42 initially and 374.04/325.58/330.97 at the end on ten cores. This establishes an error-free campaign attempt, not full-story completion.

The recovery fixture completed room cycling and context restoration with `contextLost=false`; its retained resource counts were 244 geometry/114 textures before, 321/117 after room cycling, and 291/91 after restoration. The graphics-switch fixture exercised off/silhouette/off/full ink preparation through the native tier paths, holding gameplay for preparation and recording zero new combat programs at each switch. Both fixture PNGs were opened at native size; the world, HUD and checkpoint feedback remained legible.

Fixed-resolution before/after pairs use the same deterministic 1,117ms combat frame for both rigs in Coolant Plant, at 1920×1080 and scale 1. Both pairs were opened at native size and as 480×270 images. Each differs at only 43 of 2,073,600 pixels, with maximum channel difference 1/255 and mean absolute channel difference 0.000010288/255. Marine contours, warnings, floor detail and HUD look unchanged. These pairs cover the production rendering, AO format, invalidation and HUD changes together; their individual pass/storage differences are quantified separately. Pixel equality is visual evidence, not a performance measurement.

## Source identity and reproducibility

The baseline runtime is merged `nextgen` commit `1f86a69cc9fcbc65598b40d982924cf02291abd9`, including the larger K11/K12 assets. The GPU/count after runtime is `8c773dad7d1dbb89927a59131e5074908f8424b4`; the clean CPU, native realtime, captures, campaign and recovery runtime is `e9f24eedf2b2326c30e5f26a15d1df0050d097bc`. The latter additionally reuses formatted HUD strings inside the change guards. Their renderer bundles are byte-identical. Source-map embedded source hashes verify these identities in `provenance.json`. The GPU-after command's source label was stale because the queued shell had read an earlier command; its metadata was corrected with original label, original report hash and correction reason retained. Measurement samples were unchanged.

Raw profiles, JSON/Markdown trial reports, retained source maps, capture manifests and provenance are retained with the final artifacts. A first clean-CPU setup attempt changed graphics after staging and produced GL1282 on the unchanged baseline. It was interrupted; ensuing TargetClosed/CDP errors are interruption fallout. The tool now applies the existing capture graphics helper before Start/staging. Failed receipts remain under `failed-cpu-setup`; the complete replacement matrices are reported separately. This was a fixture setup correction, with no error suppression or claimed runtime regression fix.

## Remaining costs and ownership boundaries

Native renderer submission dominates the sampled CPU work. The new marine's four 2k maps contribute about 85.3MiB of referenced mipmapped texture payload. Asset sizing, model/material restructuring and loading changes belong to K11/K12; F11 leaves them intact. A follow-up for those owners should measure fewer material groups and smaller maps against close-up appearance before changing them.

The player-beacon presentation shares the marine skeleton and traverses the source hierarchy after the main render. Three's render-frame counter can cause another bone upload for the HUD submission. Safely skipping it needs an explicit matrices-current contract and identity-aware skeleton caching, with measurements of the cache overhead. No speculative skip was shipped. Fullscreen composite defocus math can also potentially reject zero-mask central pixels before depth reconstruction; its measured gain remains unknown. Neither candidate is counted as a saving.

The existing static-shadow cache, half-size AO, quarter-size bloom and actor update scheduling were already active. Disabling them or reducing visual quality would not establish a new invisible optimization. No additional actor cadence reduction, shader-family proliferation, asset change or simulation change was introduced.

## Reproduction commands

```sh
npm ci
npm run build
npm run bench -- --breakdown --rooms=coolant-plant,crew-checkpoint,relay-racks,transmission-chamber,freight-hold,overload-floor --rigs=breacher,arc --tiers=high,low --repeat=1 --seconds=12 --out=artifacts/nextgen/f11-final/breakdown-run
npm run bench -- --breakdown --cpu-only --fixed-resolution --rooms=coolant-plant,crew-checkpoint,relay-racks,transmission-chamber,freight-hold,overload-floor --rigs=breacher,arc --tiers=high,low --repeat=1 --seconds=6 --out=artifacts/nextgen/f11-final/cpu-run
npm run bench -- --rooms=coolant-plant,crew-checkpoint,relay-racks,transmission-chamber,freight-hold,overload-floor --rigs=breacher,arc --tiers=high,low --repeat=1 --seconds=12 --min-simulation-seconds=4 --out=artifacts/nextgen/f11-final/realtime-run
npm run playtest -- --rig=breacher --seed=1729
```

`--breakdown` builds source maps for source-level CPU attribution and writes each room/rig/tier JSON/Markdown record plus raw `.cpuprofile` files. `--cpu-only` disables GPU probes and the native draw interception; its measured thread total is preferable for CPU comparisons. Ordinary realtime mode retains normal presentation cadence. Frozen `--dist` builds were used for this report's before/after runs, with full source identities above. `bench-summary.mjs` combines the GPU/count directories and optional clean CPU directories offline; retained maps allow re-attribution after the temporary builds are removed.

## Room preparation observations

Maximum completed target-room preparation per four rig/tier trials; zero-total in-progress entries and initial Awakening Bay preparation are excluded. Each value carries its trial start load1m (ten cores). Shader wait and warm phases overlap and must not be added.

| Room | Maximum ms before → after | Load1m before / after |
| --- | ---: | ---: |
| coolant-plant | 3072.4 → 2939.1 | 773.09765625 / 564.41259765625 |
| crew-checkpoint | 3414.4 → 2082.8 | 444.59130859375 / 523.72216796875 |
| relay-racks | 2209.2 → 2023.5 | 303.11474609375 / 612.96875 |
| transmission-chamber | 2768.2 → 2418.0 | 406.2216796875 / 513.6953125 |
| freight-hold | 1941.9 → 2001.0 | 660.0185546875 / 291.3388671875 |
| overload-floor | 13081.0 → 6629.8 | 630.46240234375 / 334.8564453125 |

After Low Overload Floor recorded 6,629.8ms at load 334.86: compile wait 3,538.5ms and warm 5,650.9ms overlap. Earlier baseline Low Overload Floor recorded 13,081ms at load 630.46. These values identify the remaining observed preparation gap, without attributing the difference to F11 or certifying quiet-host readiness.

## Ranked CPU results

The clean CPU phase completed all 24 configurations per version with zero runner/GL errors and zero combat shader compiles. Equal-weight means of per-trial measured thread CPU/render were **9.071 → 9.284ms**. This is not an overall CPU speedup. Renderer submission increased while other categories moved down; driver scheduling, active waits, profiling and host contention remain possible contributors. Subsystem values below are statistical sample-share estimates, not independent clocks or causal savings. The full per-room/rig/tier rankings and host loads are in [F11-breakdown](plans/F11-breakdown.md).

| Subsystem, ranked by before estimate | Estimated CPU ms/render before → after |
| --- | ---: |
| renderer submission/probes | 6.388 → 7.104 |
| animation mixers/skinning | 0.606 → 0.460 |
| unattributed | 0.523 → 0.521 |
| UI/HUD DOM | 0.516 → 0.399 |
| simulation step | 0.478 → 0.359 |
| VFX/telegraph batching | 0.346 → 0.266 |
| actor pose/motion | 0.165 → 0.126 |
| GC | 0.037 → 0.041 |
| world dressing update | 0.008 → 0.006 |
| lighting/shadow update | 0.003 → 0.002 |
| fixture driver | 0.000 → 0.000 |

UI/HUD DOM estimates fell 0.516 → 0.399ms/render alongside fewer setter calls, but this matrix cannot isolate the milliseconds caused by that change. GC stayed small (0.037 → 0.041ms/render); actor scheduling and dressing were not the largest measured costs. Renderer submission dominates at 6.388 → 7.104ms/render. No broad CPU-budget victory is claimed.

## Ordinary realtime totals

These separate trials use normal realtime presentation with no CPU profiler or pass/draw interception. Values are observations under the adjacent one-minute host load on ten cores. GPU intervals remain contention-sensitive. CPU is measured thread CPU divided by observed renders and includes fixture work. No wall-clock frame pass/fail or causal GPU speedup is inferred.

| Room / rig / tier | GPU p50 / p95 ms before → after | CPU thread mean ms/frame before → after | Frame p50 / p95 ms before → after | Load1m before start→end / after start→end |
| --- | ---: | ---: | ---: | --- |
| Coolant Plant / breacher / high | 105.43 / 201.60 → 81.28 / 119.97 | 26.64 → 23.99 | 58.60 / 125.70 → 41.50 / 91.40 | 385.34→456.91 / 747.47→768.60 |
| Coolant Plant / breacher / low | 58.07 / 142.32 → 59.83 / 88.99 | 15.96 → 13.98 | 42.20 / 109.80 → 25.00 / 58.50 | 456.91→472.08 / 768.60→752.83 |
| Coolant Plant / arc / high | 111.00 / 267.41 → 86.08 / 122.91 | 22.80 → 13.87 | 66.40 / 141.70 → 41.40 / 76.20 | 472.08→442.21 / 752.83→719.52 |
| Coolant Plant / arc / low | 60.85 / 118.16 → 50.17 / 85.99 | 16.54 → 12.85 | 40.30 / 125.80 → 26.10 / 58.50 | 442.21→408.47 / 719.52→695.66 |
| Crew Checkpoint / breacher / high | 111.02 / 180.74 → 92.20 / 175.06 | 24.32 → 24.65 | 50.60 / 132.30 → 41.20 / 116.30 | 408.47→349.25 / 695.66→650.95 |
| Crew Checkpoint / breacher / low | 59.67 / 100.36 → 46.37 / 67.81 | 18.04 → 17.88 | 25.00 / 100.70 → 24.90 / 58.80 | 349.25→311.57 / 650.95→613.15 |
| Crew Checkpoint / arc / high | 70.00 / 107.61 → 85.89 / 130.78 | 18.51 → 21.34 | 33.30 / 75.40 → 41.60 / 125.60 | 311.57→305.27 / 613.15→544.02 |
| Crew Checkpoint / arc / low | 43.69 / 79.24 → 43.09 / 77.27 | 14.73 → 16.18 | 17.40 / 50.40 → 18.10 / 58.40 | 305.27→323.61 / 544.02→504.01 |
| Relay Racks / breacher / high | 75.17 / 176.19 → 81.70 / 191.42 | 17.23 → 22.55 | 32.90 / 76.00 → 41.50 / 82.10 | 323.61→302.81 / 504.01→465.84 |
| Relay Racks / breacher / low | 35.84 / 51.59 → 40.52 / 114.11 | 13.90 → 13.97 | 18.00 / 51.70 → 26.20 / 74.80 | 302.81→305.91 / 465.84→436.06 |
| Relay Racks / arc / high | 78.29 / 150.03 → 88.74 / 140.88 | 16.50 → 17.73 | 40.80 / 100.00 → 41.70 / 91.70 | 305.91→322.51 / 436.06→407.21 |
| Relay Racks / arc / low | 40.49 / 73.19 → 47.38 / 78.05 | 14.41 → 17.09 | 18.20 / 50.00 → 25.20 / 59.00 | 322.51→344.19 / 407.21→359.47 |
| Transmission Chamber / breacher / high | 72.38 / 142.06 → 95.02 / 169.48 | 22.18 → 20.29 | 33.30 / 76.20 → 49.00 / 84.20 | 344.19→374.71 / 359.47→345.62 |
| Transmission Chamber / breacher / low | 33.53 / 57.31 → 36.60 / 63.52 | 12.51 → 12.91 | 16.90 / 50.20 → 16.90 / 42.00 | 374.71→383.83 / 345.62→345.20 |
| Transmission Chamber / arc / high | 58.95 / 92.63 → 81.88 / 128.38 | 16.87 → 18.61 | 33.00 / 58.90 → 41.70 / 66.90 | 383.83→432.45 / 345.20→324.84 |
| Transmission Chamber / arc / low | 37.07 / 62.95 → 47.83 / 80.33 | 14.00 → 13.07 | 17.80 / 49.10 → 24.70 / 57.70 | 432.45→462.22 / 324.84→315.37 |
| Freight Hold / breacher / high | 65.79 / 184.03 → 91.60 / 149.13 | 18.56 → 19.01 | 33.90 / 75.20 → 41.40 / 90.80 | 462.22→502.83 / 315.37→302.29 |
| Freight Hold / breacher / low | 37.02 / 67.53 → 36.75 / 59.78 | 12.93 → 13.38 | 17.30 / 50.80 → 17.30 / 50.00 | 502.83→530.28 / 302.29→304.74 |
| Freight Hold / arc / high | 60.13 / 124.85 → 68.25 / 112.79 | 16.18 → 16.46 | 33.20 / 74.90 → 35.20 / 66.70 | 530.28→520.94 / 304.74→316.57 |
| Freight Hold / arc / low | 39.51 / 72.35 → 42.30 / 77.93 | 13.07 → 13.38 | 17.70 / 49.30 → 18.20 / 49.60 | 520.94→519.86 / 316.57→330.03 |
| Overload Floor / breacher / high | 60.45 / 161.78 → 72.36 / 131.84 | 21.17 → 24.10 | 34.00 / 74.00 → 33.70 / 59.90 | 519.86→531.33 / 330.03→362.18 |
| Overload Floor / breacher / low | 36.83 / 63.28 → 15.89 / 34.63 | 12.57 → 11.75 | 17.90 / 50.20 → 16.70 / 25.10 | 531.33→555.63 / 362.18→361.03 |
| Overload Floor / arc / high | 76.08 / 146.25 → 44.40 / 56.99 | 14.27 → 13.67 | 33.90 / 82.30 → 24.70 / 41.50 | 555.63→581.50 / 361.03→356.72 |
| Overload Floor / arc / low | 46.40 / 87.99 → 23.25 / 34.81 | 13.64 → 10.12 | 24.80 / 50.30 → 16.70 / 18.10 | 581.50→670.97 / 356.72→340.94 |

## Ranked GPU workload

The named raw timer ranking appears for every configuration in [F11-breakdown](plans/F11-breakdown.md). It is a ranking of observed intervals, not reliable pass execution cost: one-draw post stages report 100ms-class intervals alongside similarly sized native-scene intervals. Rotating non-overlapping queries avoid nesting, but do not remove device contention or this backend timing behavior. Ink, outline, lens and grade are physically one composite shader, so their individual timings are unavailable without changing the workload. Static shadow-atlas updates did not recur in these steady combat samples; missing query samples are not presented as zero milliseconds.

By submitted work, native opaque geometry dominates draw/triangle volume, followed by transparent/VFX geometry and the HUD marine submission. High post adds AO, denoise and three bloom draws, plus intermittent distortion and demanded depth copies. Low omits that work. Transparent target-footprint counts do not measure actual overdraw; a reduction in quad coverage cannot be inferred from them. No such reduction is claimed.

After High/Breacher workload, averaged per actual render (all selected frames, including intermittent scopes):

| Room | Opaque draws / triangles | Transparent draws / triangles | Composite / AA pixels |
| --- | ---: | ---: | ---: |
| coolant-plant | 73.1 / 661089 | 16.6 / 4030 | 1880138 / 2073600 |
| crew-checkpoint | 66.7 / 725731 | 15.5 / 4146 | 1779544 / 2073600 |
| relay-racks | 81.7 / 659282 | 16.4 / 4145 | 1779287 / 2073600 |
| transmission-chamber | 72.2 / 695782 | 16.5 / 4012 | 1879881 / 2073600 |
| freight-hold | 71.8 / 632008 | 17.0 / 4259 | 1780662 / 2073600 |
| overload-floor | 74.8 / 630875 | 20.6 / 4391 | 1781353 / 2073600 |

## Amplified GPU diagnostic

A separate full-resolution Coolant Plant/Breacher/High diagnostic repeated each selected post draw 1, 8 and 32 times, with three attempts per count. This tests same-target throughput; it is not isolated normal-pass latency. Start load1m was 390.39 before and 572.67 after on ten cores.

| Stage | Supported throughput ms/repeat before → after | Result |
| --- | ---: | --- |
| composite | unavailable → unavailable | No supported before/after comparison |
| finalAA | 0.321 → unavailable | No supported before/after comparison |
| gtao | unavailable → unavailable | No supported before/after comparison |
| aoDenoise | unavailable → unavailable | No supported before/after comparison |

No stage has a supported before/after pair. Clear-to-invalidate timing benefit and AO timing benefit remain unproven; their structural changes and visual equivalence are the supported results. No raw rejected slope is promoted to a measured saving.

## Adaptive capture comparison and acceptance status

The additional ordinary-adaptive pairs use the same 1,117ms deterministic frame. Baseline Breacher/Arc captured at scale 1.0/0.95; after both captured at 0.9. All four images were opened at native size and 480×270. Small sampling differences are visible in fine floor/grate edges at native size; actor silhouettes, warning boundaries and HUD readability remain intact. This is the expected image-scale tradeoff of earlier adaptation, not evidence that changing resolution is pixel-identical. The fixed-scale pairs above isolate the rendering/HUD changes and are visually indistinguishable. No stronger claim of invisible adaptive resampling is made.

The 330-draw, zero-combat-compile and minimum-scale conditions are supported in the measured matrices. The 16.7ms p50 / 20ms p95 frame targets remain **unverified** on the loaded host, and the measured thread CPU total did not improve overall. Low Overload Floor also retains the observed preparation gap. The requested load-independent additive GPU pass milliseconds could not be established: the timer-query implementation is complete, but this backend/device contention invalidates that interpretation. The amplified fallback also yielded no supported before/after pair. The matrix, combined-change capture comparisons, campaign attempt and recovery verification completed. Individual AO, invalidation and HUD changes also have separate full-resolution capture variants, described below. Their milliseconds were not independently isolated; structural counts and payloads support the narrower savings above. The largest CPU cost was not reduced in this stream. These gaps remain explicit rather than being converted into a budget pass.

Retained evidence: [artifact index](../../artifacts/nextgen/f11-final/README.md), [complete ranked matrix](plans/F11-breakdown.md), [interactive realtime comparison](../../artifacts/nextgen/f11-final/comparison.html), [fixed-scale image metrics](../../artifacts/nextgen/f11-final/capture-comparison.json), [campaign receipt](../../artifacts/nextgen/f11-final/campaign/report.json). Capture folders are `captures/f11-before-fixed`, `captures/f11-after-fixed`, `captures/f11-before`, `captures/f11-after-adaptive` and `captures/f11-recovery` beneath the final artifact root. Their original manifest paths are preserved as historical metadata after relocation.

## Individual change capture pairs

Three additional builds start from final production source and disable exactly one change: R16F denoise storage, clear-to-invalidate submission, or HUD change guards. The recipe is retained as `capture-variants.py`; variant source labels are descriptive, not Git commit SHAs. The production source was restored in a `finally` block and rebuilt successfully afterward. Both rigs were captured at the same 1,117ms deterministic frame with adaptation disabled. Every native image and its 480×270 version was opened and compared with `f11-after-fixed`.

| Change | Before folder → after folder | Breacher changed pixels / maximum channel delta | Arc changed pixels / maximum channel delta | Supported isolated saving |
| --- | --- | ---: | ---: | --- |
| R16F denoise | `f11-without-ao` → `f11-after-fixed` | 43 / 1 | 0 / 0 | 8 → 2 bytes/texel; 3,110,400 bytes at 960×540 |
| Attachment invalidation | `f11-without-invalidation` → `f11-after-fixed` | 43 / 1 | 0 / 0 | Five fullscreen clears replaced on High without distortion; two on Low |
| HUD change guards | `f11-without-hud` → `f11-after-fixed` | 43 / 1 | 0 / 0 | Coolant High setters/tick: Breacher 32.253 → 29.090; Arc 34.219 → 31.051 |

Folders are beneath `artifacts/nextgen/f11-final/captures/`; every pair uses `k10-heavy-<rig>-coolant-plant-01.png`, with `-01-480.png` for thumbnails. These changes are invisible in the inspected frames. Pixel metrics and hashes are in `individual-capture-comparison.json`. Shared 43-pixel, one-level variation is below visible precision; it is not claimed as a quality improvement. Adaptive response has its separate scale-varying comparison and explicit sampling caveat above.
