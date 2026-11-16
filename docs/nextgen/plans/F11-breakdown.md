# F11 renderer breakdown comparison

Before: /Users/chernodub/.t3/worktrees/containment-game/t3-fa3de00d/artifacts/nextgen/f11-final/before-v2; source 1f86a69cc9fcbc65598b40d982924cf02291abd9.

After: /Users/chernodub/.t3/worktrees/containment-game/t3-fa3de00d/artifacts/nextgen/f11-final/after; source 8c773dad7d1dbb89927a59131e5074908f8424b4.

CPU totals use the CDP ThreadTime delta (thread CPU ticks, excluding descheduled time). Subsystem CPU milliseconds are estimates that apportion that total by exclusive active sample counts; they are not individually clocked subsystem durations. Profile probes and the fixture driver are included. Raw sample timeDeltas remain separately visible. Clock semantics: [Chromium metric implementation](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/inspector/inspector_performance_agent.cc) and [ThreadTicks definition](https://raw.githubusercontent.com/chromium/chromium/main/base/time/time.h).

GPU timer queries measure device execution intervals and can include shared-device contention. CPU sampling is exclusive sampled wall duration subject to host scheduling, not uncontended subsystem execution time. These instrumented observations do not certify the hardware frame budget.

GPU scopes are ranked by before p50 (after p50 when no before sample exists). Never sum independently sampled percentiles. sceneColor includes native opaque, transparent, shadow and depth-copy work; exclusive scopes overlap that inclusive scope. Composite physically combines ink/outline, lens and grade. Missing samples stay unavailable.

Draw/triangle/fill means below divide scope totals by actual render submissions counted by finalAA draws (one per shipping High/Low render), falling back to the maximum recorded frame ID and then observer count. This includes fixed-step refresh and RAF submissions, including frames where an intermittent scope did not execute. Fill means render-target footprint × named submissions, not actual fragment invocations or transparent overdraw. Memory is estimated texture payload, not driver allocation telemetry.

Native CPU profile sources: before 1f86a69cc9fcbc65598b40d982924cf02291abd9; after e9f24eedf2b2326c30e5f26a15d1df0050d097bc.

## coolant-plant/breacher/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 975.67/873.04/902.76 → 773.10/833.35/883.48 (10 cores); changed 591.49/612.84/588.63 → 564.41/599.13/585.17 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 965.900 → 449.500 |
| batched observer interval p95 ms (not game frame latency) | 2134.400 → 899.700 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.700 → 6.600 |
| GPU-audit frozen RAF CPU observer p95 ms | 8.500 → 8.700 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 155.590 → 86.314 |
| adaptive scale minimum | 0.950 → 0.925 |
| adaptive scale p50 | 0.975 → 0.950 |
| draws maximum | 111.000 → 111.000 |
| triangles maximum | 698742.000 → 698740.000 |
| measured thread CPU total ms | 7823.852 → 8458.301 |
| thread CPU mean per actual render ms (instrumented) | 10.214 → 11.042 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 32.253 → 29.090 |
| GL clears per fixed tick (includes refresh/RAF) | 17.424 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.049 |
| GL calls per fixed tick (includes refresh/RAF) | 3723.357 → 3725.278 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| transparentVFX | 186.150 → 89.550 | 409.257 → 427.018 | 34 → 34 | 16.599 → 16.599 | 4026.317 → 4029.970 | 1979020 → 1880138 |
| sceneColor | 163.892 → 84.196 | 333.537 → 192.478 | 34 → 34 | 89.716 → 89.716 | 665114.910 → 665118.563 | 1979020 → 1880138 |
| mainOpaque | 161.250 → 80.331 | 236.013 → 222.252 | 34 → 34 | 73.117 → 73.117 | 661088.593 → 661088.593 | 1979020 → 1880138 |
| hud | 156.882 → 83.851 | 244.163 → 173.190 | 33 → 33 | 7.687 → 7.687 | 24177.609 → 24177.609 | 2073600 → 2073600 |
| frameTotal | 155.590 → 86.314 | 421.903 → 177.144 | 34 → 34 | 96.915 → 96.915 | 665122.109 → 665125.762 | 2073600 → 2073600 |
| gtao | 140.379 → 78.466 | 370.126 → 116.964 | 34 → 34 | 1.000 → 1.000 | 1.000 → 1.000 | 494951 → 470300 |
| aoDenoise | 128.393 → 56.201 | 466.281 → 120.602 | 34 → 34 | 1.000 → 1.000 | 1.000 → 1.000 | 494951 → 470300 |
| finalAA | 123.643 → 56.446 | 217.412 → 104.229 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| bloomBlurHorizontal | 118.771 → 63.559 | 297.151 → 163.853 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 123894 → 117748 |
| gasDepthSnapshot | 116.945 → 52.789 | 321.076 → 168.253 | 18 → 18 | 0.000 → 0.000 | 0.000 → 0.000 | 270262 → 256774 |
| bloomExtract | 113.712 → 60.123 | 288.421 → 113.224 | 34 → 34 | 1.000 → 1.000 | 1.000 → 1.000 | 123894 → 117748 |
| composite | 112.300 → 56.585 | 307.817 → 112.697 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 1979020 → 1880138 |
| bloomBlurVertical | 110.359 → 59.732 | 286.838 → 135.442 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 123894 → 117748 |
| distortion | 100.284 → 61.143 | 139.193 → 78.644 | 7 → 7 | 0.199 → 0.199 | 0.199 → 0.199 | 23612 → 22372 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 340729641 → 340729641 |
| render-target textures | 55563008 → 50292392 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.799 → 8.199 | 66.6% → 74.3% | 12376.380 → 19401.079 |
| UI/HUD DOM | 1.045 → 0.805 | 10.2% → 7.3% | 1895.795 → 2184.730 |
| unattributed | 0.669 → 0.677 | 6.6% → 6.1% | 1124.888 → 1306.604 |
| animation mixers/skinning | 0.667 → 0.541 | 6.5% → 4.9% | 1255.691 → 1413.788 |
| simulation step | 0.499 → 0.423 | 4.9% → 3.8% | 868.312 → 928.039 |
| VFX/telegraph batching | 0.311 → 0.233 | 3.0% → 2.1% | 597.214 → 498.270 |
| actor pose/motion | 0.187 → 0.121 | 1.8% → 1.1% | 396.161 → 369.305 |
| GC | 0.022 → 0.033 | 0.2% → 0.3% | 52.118 → 125.613 |
| lighting/shadow update | 0.008 → 0.003 | 0.1% → 0.0% | 11.589 → 5.421 |
| world dressing update | 0.007 → 0.007 | 0.1% → 0.1% | 18.193 → 25.654 |
| idle | unavailable → unavailable | unavailable → unavailable | 1751.239 → 8258.168 |

Active sampled duration: 18596.341 → 26258.503 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before index-CH45HxKO.js, debug-DkVQIwzz.js, DepthRenderer-CAaA-2E0.js, presentation-shared-DSPhp2Lx.js, AbilityVisuals-WfopSGEM.js, expedition-mTxs7weK.js, PickupSystem-DaOfTIP9.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js; after debug-DkVQIwzz.js, index-DeffeJpW.js, rigPortraits-h8XV7YY-.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-er_fwrFp.js, StaticColliderParts-CNQ9HfP0.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js.

## coolant-plant/breacher/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 773.10/833.35/883.48 → 869.59/856.16/888.53 (10 cores); changed 564.41/599.13/585.17 → 562.38/595.24/584.34 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 373.400 → 224.900 |
| batched observer interval p95 ms (not game frame latency) | 1015.700 → 418.000 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.500 → 6.100 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.800 → 8.100 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 83.897 → 53.545 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 94.000 → 94.000 |
| triangles maximum | 661893.000 → 661889.000 |
| measured thread CPU total ms | 6537.285 → 6739.988 |
| thread CPU mean per actual render ms (instrumented) | 8.534 → 8.799 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 32.253 → 29.100 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2855.910 → 2854.729 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 83.897 → 53.545 | 193.348 → 95.310 | 73 → 73 | 78.415 → 78.415 | 614806.486 → 614814.662 | 2073600 → 2073600 |
| sceneColor | 73.088 → 54.734 | 169.687 → 123.630 | 73 → 73 | 76.415 → 76.415 | 614804.486 → 614812.662 | 2073600 → 2073600 |
| hud | 60.782 → 45.826 | 150.402 → 75.301 | 72 → 72 | 7.687 → 7.687 | 24177.609 → 24177.609 | 2073600 → 2073600 |
| mainOpaque | 59.340 → 40.605 | 164.498 → 83.314 | 73 → 73 | 65.835 → 65.835 | 611843.691 → 611843.691 | 2073600 → 2073600 |
| composite | 45.419 → 29.734 | 92.799 → 48.621 | 73 → 73 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| finalAA | 44.007 → 31.365 | 80.547 → 50.536 | 73 → 73 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 42.791 → 23.779 | 91.036 → 44.875 | 73 → 73 | 10.580 → 10.580 | 2960.795 → 2968.971 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 309255977 → 309255977 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 4.459 → 6.239 | 52.3% → 70.9% | 4659.917 → 10840.113 |
| animation mixers/skinning | 1.079 → 0.643 | 12.6% → 7.3% | 1230.826 → 1177.514 |
| simulation step | 0.867 → 0.496 | 10.2% → 5.6% | 843.844 → 926.438 |
| UI/HUD DOM | 0.844 → 0.556 | 9.9% → 6.3% | 941.981 → 1060.343 |
| VFX/telegraph batching | 0.492 → 0.276 | 5.8% → 3.1% | 600.240 → 513.518 |
| unattributed | 0.415 → 0.346 | 4.9% → 3.9% | 474.745 → 743.312 |
| actor pose/motion | 0.288 → 0.199 | 3.4% → 2.3% | 362.568 → 394.235 |
| GC | 0.074 → 0.030 | 0.9% → 0.3% | 146.940 → 90.782 |
| world dressing update | 0.013 → 0.007 | 0.1% → 0.1% | 26.006 → 9.642 |
| lighting/shadow update | 0.002 → 0.006 | 0.0% → 0.1% | 1.748 → 7.910 |
| fixture driver | unavailable → 0.001 | unavailable → 0.0% | unavailable → 1.498 |
| idle | unavailable → unavailable | unavailable → unavailable | 2498.698 → 5319.042 |

Active sampled duration: 9288.815 → 15765.305 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-DaOfTIP9.js, StaticColliderParts-CNQ9HfP0.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js; after debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-er_fwrFp.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js.

## coolant-plant/arc/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 869.59/856.16/888.53 → 743.38/799.97/860.07 (10 cores); changed 562.38/595.24/584.34 → 543.48/583.13/580.52 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 1117.200 → 434.300 |
| batched observer interval p95 ms (not game frame latency) | 2649.400 → 751.100 |
| GPU-audit frozen RAF CPU observer p50 ms | 7.200 → 6.900 |
| GPU-audit frozen RAF CPU observer p95 ms | 14.400 → 9.100 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 190.954 → 85.860 |
| adaptive scale minimum | 0.950 → 0.900 |
| adaptive scale p50 | 0.975 → 0.925 |
| draws maximum | 117.000 → 117.000 |
| triangles maximum | 723249.000 → 723249.000 |
| measured thread CPU total ms | 7169.365 → 7578.258 |
| thread CPU mean per actual render ms (instrumented) | 9.359 → 9.893 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 34.219 → 31.051 |
| GL clears per fixed tick (includes refresh/RAF) | 17.467 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.092 |
| GL calls per fixed tick (includes refresh/RAF) | 3645.701 → 3646.907 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| sceneColor | 214.608 → 79.967 | 653.177 → 159.328 | 37 → 37 | 90.692 → 90.695 | 662677.456 → 662667.500 | 1979615 → 1779484 |
| frameTotal | 190.954 → 85.860 | 767.341 → 112.528 | 38 → 37 | 97.911 → 97.914 | 662684.675 → 662674.719 | 2073600 → 2073600 |
| mainOpaque | 137.165 → 48.072 | 530.716 → 82.774 | 37 → 37 | 70.746 → 70.745 | 638013.769 → 637996.252 | 1979615 → 1779484 |
| finalAA | 103.723 → 40.497 | 419.673 → 109.117 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| aoDenoise | 102.799 → 43.911 | 492.781 → 97.040 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 495099 → 445056 |
| bloomExtract | 98.400 → 38.195 | 496.151 → 81.800 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123930 → 111336 |
| hud | 98.214 → 33.118 | 544.393 → 83.449 | 37 → 37 | 7.815 → 7.815 | 24319.236 → 24319.220 | 2073600 → 2073600 |
| gtao | 87.554 → 31.165 | 661.276 → 93.769 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 495099 → 445056 |
| distortion | 85.671 → 34.918 | 390.168 → 77.902 | 12 → 12 | 0.219 → 0.219 | 0.219 → 0.219 | 26946 → 24078 |
| bloomBlurHorizontal | 78.390 → 39.612 | 419.992 → 146.227 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123930 → 111336 |
| bloomBlurVertical | 73.941 → 40.114 | 545.327 → 76.146 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123930 → 111336 |
| transparentVFX | 73.127 → 30.808 | 468.592 → 68.647 | 37 → 37 | 19.946 → 19.950 | 24663.687 → 24671.247 | 1979615 → 1779484 |
| composite | 72.557 → 40.604 | 439.654 → 85.235 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 1979615 → 1779484 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 340731945 → 340731945 |
| render-target textures | 55563008 → 48414560 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.779 → 8.173 | 72.4% → 82.6% | 14078.018 → 28113.667 |
| UI/HUD DOM | 0.631 → 0.387 | 6.7% → 3.9% | 1442.318 → 1493.232 |
| animation mixers/skinning | 0.570 → 0.318 | 6.1% → 3.2% | 1323.074 → 1296.466 |
| unattributed | 0.513 → 0.531 | 5.5% → 5.4% | 1096.103 → 1604.533 |
| simulation step | 0.389 → 0.206 | 4.2% → 2.1% | 832.414 → 754.947 |
| VFX/telegraph batching | 0.312 → 0.175 | 3.3% → 1.8% | 658.320 → 693.924 |
| actor pose/motion | 0.124 → 0.084 | 1.3% → 0.8% | 269.935 → 293.598 |
| GC | 0.027 → 0.015 | 0.3% → 0.2% | 78.918 → 85.421 |
| world dressing update | 0.009 → 0.003 | 0.1% → 0.0% | 16.018 → 20.651 |
| lighting/shadow update | 0.004 → 0.002 | 0.0% → 0.0% | 7.658 → 5.333 |
| idle | unavailable → unavailable | unavailable → unavailable | 3178.174 → 6541.961 |

Active sampled duration: 19802.776 → 34361.772 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js, PickupSystem-DaOfTIP9.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js; after debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-er_fwrFp.js, facilityGeometry-aDvEV29y.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, rigPortraits-h8XV7YY-.js.

## coolant-plant/arc/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 743.38/799.97/860.07 → 634.53/753.05/833.85 (10 cores); changed 543.48/583.13/580.52 → 527.12/574.71/577.60 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 1141.600 → 231.900 |
| batched observer interval p95 ms (not game frame latency) | 1982.700 → 482.000 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.800 → 6.300 |
| GPU-audit frozen RAF CPU observer p95 ms | 13.500 → 8.200 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 202.032 → 36.069 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 98.000 → 98.000 |
| triangles maximum | 670955.000 → 670933.000 |
| measured thread CPU total ms | 6307.488 → 6250.278 |
| thread CPU mean per actual render ms (instrumented) | 8.234 → 8.160 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 34.217 → 31.044 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2829.674 → 2828.700 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 202.032 → 36.069 | 553.824 → 92.307 | 73 → 73 | 79.796 → 79.796 | 612496.173 → 612489.307 | 2073600 → 2073600 |
| sceneColor | 201.083 → 31.965 | 477.031 → 88.765 | 73 → 73 | 77.796 → 77.796 | 612494.173 → 612487.307 | 2073600 → 2073600 |
| mainOpaque | 126.206 → 32.244 | 372.486 → 81.060 | 73 → 73 | 63.900 → 63.900 | 590552.965 → 590552.965 | 2073600 → 2073600 |
| finalAA | 91.797 → 20.226 | 244.995 → 46.959 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 87.365 → 15.581 | 249.369 → 43.258 | 72 → 72 | 13.896 → 13.896 | 21941.208 → 21934.342 | 2073600 → 2073600 |
| hud | 87.111 → 32.774 | 379.790 → 87.778 | 72 → 72 | 7.815 → 7.815 | 24319.220 → 24319.220 | 2073600 → 2073600 |
| composite | 72.946 → 18.796 | 241.374 → 55.629 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 309255977 → 309255977 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 4.630 → 5.883 | 56.2% → 72.1% | 6005.871 → 11761.276 |
| animation mixers/skinning | 0.968 → 0.568 | 11.8% → 7.0% | 1230.937 → 1279.714 |
| UI/HUD DOM | 0.878 → 0.490 | 10.7% → 6.0% | 1098.487 → 1090.962 |
| simulation step | 0.631 → 0.366 | 7.7% → 4.5% | 666.963 → 714.572 |
| unattributed | 0.397 → 0.470 | 4.8% → 5.8% | 719.928 → 968.808 |
| VFX/telegraph batching | 0.367 → 0.214 | 4.5% → 2.6% | 413.148 → 476.028 |
| actor pose/motion | 0.289 → 0.132 | 3.5% → 1.6% | 307.616 → 267.729 |
| GC | 0.055 → 0.027 | 0.7% → 0.3% | 92.041 → 107.024 |
| world dressing update | 0.015 → 0.006 | 0.2% → 0.1% | 16.812 → 10.825 |
| lighting/shadow update | 0.004 → 0.002 | 0.1% → 0.0% | 9.841 → 3.006 |
| idle | unavailable → unavailable | unavailable → unavailable | 2091.280 → 4643.974 |

Active sampled duration: 10561.644 → 16679.944 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before debug-DkVQIwzz.js, index-CH45HxKO.js, DepthRenderer-CAaA-2E0.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, rigPortraits-h8XV7YY-.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-DaOfTIP9.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-er_fwrFp.js, StaticColliderParts-CNQ9HfP0.js.

## crew-checkpoint/breacher/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1535 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 634.53/753.05/833.85 → 371.11/560.04/730.05 (10 cores); changed 527.12/574.71/577.60 → 523.72/564.29/573.45 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 2267.000 → 424.400 |
| batched observer interval p95 ms (not game frame latency) | 4658.700 → 1067.700 |
| GPU-audit frozen RAF CPU observer p50 ms | 7.000 → 6.700 |
| GPU-audit frozen RAF CPU observer p95 ms | 11.300 → 8.500 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 367.560 → 86.999 |
| adaptive scale minimum | 1.000 → 0.900 |
| adaptive scale p50 | 1.000 → 0.925 |
| draws maximum | 103.000 → 103.000 |
| triangles maximum | 775973.000 → 775993.000 |
| measured thread CPU total ms | 7420.999 → 7519.470 |
| thread CPU mean per actual render ms (instrumented) | 9.688 → 9.817 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 27.025 → 23.844 |
| GL clears per fixed tick (includes refresh/RAF) | 17.350 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 10.975 |
| GL calls per fixed tick (includes refresh/RAF) | 3534.175 → 3538.207 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 367.560 → 86.999 | 934.342 → 166.147 | 34 → 34 | 89.384 → 89.385 | 729901.189 → 729884.439 | 2073600 → 2073600 |
| transparentVFX | 339.384 → 91.951 | 1155.912 → 172.220 | 34 → 33 | 15.485 → 15.486 | 4149.722 → 4145.961 | 2073600 → 1779544 |
| sceneColor | 337.426 → 81.358 | 732.828 → 168.111 | 34 → 34 | 82.220 → 82.220 | 729894.025 → 729877.275 | 2073600 → 1779544 |
| gasDepthSnapshot | 278.554 → 50.228 | 651.635 → 122.515 | 19 → 19 | 0.000 → 0.000 | 0.000 → 0.000 | 286049 → 244709 |
| finalAA | 250.895 → 56.569 | 504.676 → 96.704 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| bloomExtract | 244.247 → 48.622 | 525.131 → 101.719 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111340 |
| bloomBlurHorizontal | 244.057 → 50.829 | 469.715 → 76.465 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111340 |
| mainOpaque | 241.654 → 48.445 | 675.693 → 74.870 | 34 → 34 | 66.735 → 66.734 | 725744.302 → 725731.314 | 2073600 → 1779544 |
| distortion | 239.643 → 54.212 | 401.475 → 109.304 | 6 → 6 | 0.164 → 0.164 | 0.164 → 0.164 | 21276 → 17512 |
| composite | 210.802 → 52.468 | 473.408 → 84.959 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 1779544 |
| aoDenoise | 210.250 → 50.509 | 580.758 → 86.754 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 445071 |
| gtao | 207.301 → 48.388 | 564.797 → 86.438 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 445071 |
| bloomBlurVertical | 203.112 → 46.100 | 565.214 → 97.816 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111340 |
| hud | 167.306 → 33.882 | 435.779 → 85.524 | 33 → 33 | 7.887 → 7.887 | 24179.438 → 24179.432 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 323954733 → 323954733 |
| render-target textures | 55563008 → 48161840 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.587 → 7.699 | 68.0% → 78.4% | 13499.780 → 22483.727 |
| unattributed | 0.688 → 0.632 | 7.1% → 6.4% | 1189.697 → 1815.812 |
| UI/HUD DOM | 0.643 → 0.427 | 6.6% → 4.4% | 1313.125 → 1398.384 |
| animation mixers/skinning | 0.570 → 0.355 | 5.9% → 3.6% | 1186.503 → 1131.732 |
| simulation step | 0.566 → 0.359 | 5.8% → 3.7% | 1072.203 → 1120.237 |
| VFX/telegraph batching | 0.422 → 0.205 | 4.4% → 2.1% | 710.010 → 703.906 |
| actor pose/motion | 0.157 → 0.107 | 1.6% → 1.1% | 265.728 → 337.103 |
| GC | 0.031 → 0.023 | 0.3% → 0.2% | 108.367 → 113.388 |
| world dressing update | 0.018 → 0.007 | 0.2% → 0.1% | 32.656 → 17.844 |
| lighting/shadow update | 0.006 → 0.002 | 0.1% → 0.0% | 7.808 → 3.394 |
| idle | unavailable → unavailable | unavailable → unavailable | 1317.246 → 7321.516 |

Active sampled duration: 19385.877 → 29125.527 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, expedition-mTxs7weK.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-DaOfTIP9.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js; after AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, PickupSystem-er_fwrFp.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js.

## crew-checkpoint/breacher/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1535 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 371.11/560.04/730.05 → 343.93/479.71/671.85 (10 cores); changed 523.72/564.29/573.45 → 624.00/584.47/580.34 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 1218.600 → 332.700 |
| batched observer interval p95 ms (not game frame latency) | 2483.000 → 866.100 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.400 → 6.300 |
| GPU-audit frozen RAF CPU observer p95 ms | 10.300 → 10.000 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 218.761 → 56.977 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 88.000 → 88.000 |
| triangles maximum | 726640.000 → 726620.000 |
| measured thread CPU total ms | 6545.781 → 7216.644 |
| thread CPU mean per actual render ms (instrumented) | 8.545 → 9.421 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 27.025 → 23.871 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2723.710 → 2723.049 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 218.761 → 56.977 | 455.033 → 136.566 | 73 → 73 | 74.127 → 74.129 | 693360.907 → 693355.810 | 2073600 → 2073600 |
| sceneColor | 195.105 → 63.978 | 509.081 → 103.203 | 73 → 73 | 72.127 → 72.129 | 693358.907 → 693353.810 | 2073600 → 2073600 |
| mainOpaque | 167.899 → 49.262 | 372.713 → 84.716 | 73 → 73 | 60.662 → 60.662 | 690302.152 → 690299.554 | 2073600 → 2073600 |
| transparentVFX | 124.900 → 35.995 | 257.396 → 78.452 | 72 → 72 | 11.465 → 11.467 | 3056.754 → 3054.256 | 2073600 → 2073600 |
| finalAA | 121.132 → 38.880 | 250.967 → 85.285 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| hud | 118.561 → 30.363 | 396.257 → 104.174 | 72 → 72 | 7.887 → 7.887 | 24179.438 → 24179.432 | 2073600 → 2073600 |
| composite | 113.064 → 40.511 | 214.205 → 78.600 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 305063981 → 305063981 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 4.546 → 7.024 | 53.2% → 74.5% | 5328.409 → 21197.981 |
| animation mixers/skinning | 0.979 → 0.436 | 11.5% → 4.6% | 1297.950 → 1397.618 |
| simulation step | 0.915 → 0.390 | 10.7% → 4.1% | 1096.057 → 1153.250 |
| unattributed | 0.769 → 0.844 | 9.0% → 9.0% | 897.807 → 2583.691 |
| VFX/telegraph batching | 0.603 → 0.282 | 7.1% → 3.0% | 752.882 → 804.528 |
| UI/HUD DOM | 0.373 → 0.241 | 4.4% → 2.6% | 496.333 → 761.494 |
| actor pose/motion | 0.274 → 0.136 | 3.2% → 1.4% | 318.060 → 391.711 |
| GC | 0.054 → 0.060 | 0.6% → 0.6% | 92.459 → 229.566 |
| world dressing update | 0.025 → 0.005 | 0.3% → 0.0% | 34.699 → 7.412 |
| lighting/shadow update | 0.005 → 0.003 | 0.1% → 0.0% | 4.572 → 10.057 |
| fixture driver | 0.002 → 0.001 | 0.0% → 0.0% | 1.519 → 1.708 |
| idle | unavailable → unavailable | unavailable → unavailable | 1477.795 → 3614.484 |

Active sampled duration: 10320.747 → 28539.016 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before debug-DkVQIwzz.js, catalog-BS-Wgrcu.js, index-CH45HxKO.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, PickupSystem-DaOfTIP9.js, OriginalCreatureAnatomy-DOhHIavL.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, PickupSystem-er_fwrFp.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js.

## crew-checkpoint/arc/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1535 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 343.93/479.71/671.85 → 444.59/456.31/625.59 (10 cores); changed 624.00/584.47/580.34 → 612.19/589.17/582.47 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 1316.300 → 448.700 |
| batched observer interval p95 ms (not game frame latency) | 3500.000 → 934.300 |
| GPU-audit frozen RAF CPU observer p50 ms | 7.200 → 6.700 |
| GPU-audit frozen RAF CPU observer p95 ms | 13.200 → 9.300 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 246.986 → 101.464 |
| adaptive scale minimum | 0.950 → 0.900 |
| adaptive scale p50 | 0.975 → 0.925 |
| draws maximum | 107.000 → 107.000 |
| triangles maximum | 785313.000 → 785291.000 |
| measured thread CPU total ms | 6828.615 → 7018.461 |
| thread CPU mean per actual render ms (instrumented) | 8.926 → 9.162 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 32.968 → 29.800 |
| GL clears per fixed tick (includes refresh/RAF) | 17.482 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.107 |
| GL calls per fixed tick (includes refresh/RAF) | 3536.033 → 3536.975 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| sceneColor | 249.197 → 87.122 | 653.485 → 154.292 | 37 → 37 | 83.659 → 83.663 | 728812.266 → 728788.587 | 1977434 → 1778917 |
| frameTotal | 246.986 → 101.464 | 672.941 → 194.211 | 38 → 37 | 90.885 → 90.889 | 728819.492 → 728795.813 | 2073600 → 2073600 |
| mainOpaque | 164.610 → 80.723 | 538.791 → 203.289 | 37 → 37 | 64.509 → 64.504 | 704034.494 → 703978.815 | 1977434 → 1778917 |
| distortion | 159.607 → 41.517 | 315.926 → 105.059 | 12 → 12 | 0.226 → 0.226 | 0.226 → 0.226 | 27631 → 24795 |
| finalAA | 136.968 → 47.437 | 375.415 → 134.590 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| aoDenoise | 129.896 → 35.225 | 434.436 → 108.479 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 494555 → 444916 |
| composite | 127.367 → 50.692 | 344.931 → 123.184 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 1977434 → 1778917 |
| bloomBlurVertical | 126.167 → 52.283 | 278.171 → 148.654 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123797 → 111300 |
| bloomBlurHorizontal | 120.024 → 50.255 | 371.852 → 101.080 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123797 → 111300 |
| gtao | 113.171 → 47.391 | 397.376 → 127.070 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 494555 → 444916 |
| bloomExtract | 100.993 → 41.151 | 378.622 → 103.594 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123797 → 111300 |
| hud | 97.158 → 73.532 | 268.748 → 177.029 | 37 → 37 | 7.858 → 7.858 | 24321.973 → 24321.965 | 2073600 → 2073600 |
| transparentVFX | 87.581 → 45.347 | 332.589 → 145.950 | 37 → 37 | 19.150 → 19.159 | 24777.772 → 24809.772 | 1977434 → 1778917 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 323957037 → 323957037 |
| render-target textures | 55563008 → 48414560 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.262 → 7.797 | 70.1% → 85.1% | 12399.501 → 28051.317 |
| unattributed | 0.591 → 0.298 | 6.6% → 3.3% | 1170.041 → 2251.714 |
| simulation step | 0.582 → 0.317 | 6.5% → 3.5% | 1109.198 → 1174.810 |
| animation mixers/skinning | 0.568 → 0.280 | 6.4% → 3.1% | 1121.752 → 1163.703 |
| UI/HUD DOM | 0.409 → 0.180 | 4.6% → 2.0% | 801.212 → 750.608 |
| VFX/telegraph batching | 0.320 → 0.168 | 3.6% → 1.8% | 685.772 → 666.725 |
| actor pose/motion | 0.154 → 0.059 | 1.7% → 0.6% | 318.553 → 238.166 |
| GC | 0.032 → 0.054 | 0.4% → 0.6% | 86.623 → 251.779 |
| world dressing update | 0.007 → 0.007 | 0.1% → 0.1% | 16.760 → 28.844 |
| lighting/shadow update | 0.002 → 0.001 | 0.0% → 0.0% | 3.036 → 2.210 |
| fixture driver | unavailable → 0.001 | unavailable → 0.0% | unavailable → 1.395 |
| idle | unavailable → unavailable | unavailable → unavailable | 2085.356 → 7479.051 |

Active sampled duration: 17712.448 → 34581.271 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, index-CH45HxKO.js, debug-DkVQIwzz.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, PickupSystem-DaOfTIP9.js, presentation-shared-DSPhp2Lx.js, OriginalCreatureAnatomy-DOhHIavL.js, expedition-mTxs7weK.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, rigPortraits-h8XV7YY-.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, rigPortraits-h8XV7YY-.js, facilityGeometry-aDvEV29y.js, PickupSystem-er_fwrFp.js, DeferredRagdolls-lKG9qDcl.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, DeathRagdolls-MgqYw7Ni.js.

## crew-checkpoint/arc/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1535 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 444.59/456.31/625.59 → 444.37/454.19/608.76 (10 cores); changed 612.19/589.17/582.47 → 601.36/588.97/582.66 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 465.500 → 241.700 |
| batched observer interval p95 ms (not game frame latency) | 2098.700 → 467.100 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.600 → 6.100 |
| GPU-audit frozen RAF CPU observer p95 ms | 10.100 → 7.700 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 80.777 → 38.907 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 93.000 → 93.000 |
| triangles maximum | 755972.000 → 755976.000 |
| measured thread CPU total ms | 6339.479 → 6106.649 |
| thread CPU mean per actual render ms (instrumented) | 8.276 → 7.972 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 33.001 → 29.833 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2743.885 → 2743.156 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 80.777 → 38.907 | 210.887 → 55.349 | 73 → 73 | 76.296 → 76.303 | 697813.061 → 697816.130 | 2073600 → 2073600 |
| sceneColor | 80.618 → 33.409 | 370.177 → 50.097 | 73 → 73 | 74.296 → 74.303 | 697811.061 → 697814.130 | 2073600 → 2073600 |
| mainOpaque | 63.445 → 34.255 | 125.849 → 68.412 | 73 → 73 | 59.200 → 59.199 | 675735.601 → 675709.383 | 2073600 → 2073600 |
| hud | 53.701 → 38.193 | 115.415 → 63.933 | 72 → 72 | 7.858 → 7.858 | 24321.973 → 24321.965 | 2073600 → 2073600 |
| composite | 43.154 → 23.652 | 110.758 → 37.547 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| finalAA | 40.921 → 24.821 | 92.177 → 40.795 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 35.652 → 19.884 | 84.880 → 33.054 | 72 → 72 | 15.096 → 15.104 | 22075.459 → 22104.748 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 305066285 → 305066285 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 4.491 → 5.208 | 54.3% → 65.3% | 4985.470 → 11052.819 |
| animation mixers/skinning | 0.954 → 0.555 | 11.5% → 7.0% | 1263.949 → 1164.927 |
| simulation step | 0.953 → 0.586 | 11.5% → 7.4% | 1204.418 → 1026.492 |
| UI/HUD DOM | 0.607 → 0.387 | 7.3% → 4.9% | 849.817 → 792.656 |
| unattributed | 0.570 → 0.829 | 6.9% → 10.4% | 740.219 → 1222.102 |
| VFX/telegraph batching | 0.365 → 0.223 | 4.4% → 2.8% | 390.402 → 379.422 |
| actor pose/motion | 0.264 → 0.135 | 3.2% → 1.7% | 303.865 → 235.195 |
| GC | 0.047 → 0.037 | 0.6% → 0.5% | 121.003 → 76.655 |
| world dressing update | 0.018 → 0.006 | 0.2% → 0.1% | 15.665 → 10.735 |
| lighting/shadow update | 0.005 → 0.005 | 0.1% → 0.1% | 6.384 → 5.579 |
| fixture driver | 0.002 → unavailable | 0.0% → unavailable | 1.578 → unavailable |
| idle | unavailable → unavailable | unavailable → unavailable | 2175.259 → 4448.085 |

Active sampled duration: 9882.770 → 15966.582 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, PickupSystem-DaOfTIP9.js, DeathRagdolls-MgqYw7Ni.js, DeferredRagdolls-lKG9qDcl.js, facilityGeometry-aDvEV29y.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, catalog-BS-Wgrcu.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-er_fwrFp.js, facilityGeometry-aDvEV29y.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js.

## relay-racks/breacher/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1535 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 444.37/454.19/608.76 → 303.11/395.74/558.94 (10 cores); changed 601.36/588.97/582.66 → 583.82/585.75/581.83 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 1558.700 → 423.500 |
| batched observer interval p95 ms (not game frame latency) | 2640.500 → 791.800 |
| GPU-audit frozen RAF CPU observer p50 ms | 7.100 → 6.700 |
| GPU-audit frozen RAF CPU observer p95 ms | 10.200 → 8.000 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 225.926 → 73.704 |
| adaptive scale minimum | 0.950 → 0.900 |
| adaptive scale p50 | 0.975 → 0.925 |
| draws maximum | 122.000 → 122.000 |
| triangles maximum | 702005.000 → 702065.000 |
| measured thread CPU total ms | 7709.490 → 7889.810 |
| thread CPU mean per actual render ms (instrumented) | 10.065 → 10.300 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 30.567 → 27.414 |
| GL clears per fixed tick (includes refresh/RAF) | 17.350 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 10.975 |
| GL calls per fixed tick (includes refresh/RAF) | 3943.454 → 3944.504 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| transparentVFX | 238.535 → 86.466 | 710.543 → 154.403 | 33 → 33 | 16.414 → 16.412 | 4144.867 → 4144.891 | 1979612 → 1779287 |
| frameTotal | 225.926 → 73.704 | 578.543 → 111.466 | 34 → 34 | 105.326 → 105.323 | 663425.851 → 663433.767 | 2073600 → 2073600 |
| sceneColor | 217.085 → 77.077 | 594.847 → 125.368 | 34 → 34 | 98.162 → 98.159 | 663418.687 → 663426.603 | 1979612 → 1779287 |
| gtao | 212.427 → 58.716 | 481.946 → 106.303 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 495100 → 445008 |
| mainOpaque | 200.254 → 69.155 | 568.610 → 124.297 | 34 → 34 | 81.748 → 81.747 | 659273.820 → 659281.712 | 1979612 → 1779287 |
| hud | 182.861 → 74.998 | 569.158 → 101.463 | 33 → 33 | 7.869 → 7.869 | 24192.035 → 24192.040 | 2073600 → 2073600 |
| finalAA | 167.099 → 51.071 | 334.099 → 75.632 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| bloomBlurHorizontal | 154.289 → 53.440 | 426.704 → 89.268 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 123931 → 111323 |
| bloomExtract | 150.533 → 50.450 | 343.464 → 91.911 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 123931 → 111323 |
| gasDepthSnapshot | 136.536 → 49.212 | 280.318 → 120.099 | 19 → 19 | 0.000 → 0.000 | 0.000 → 0.000 | 264772 → 237586 |
| bloomBlurVertical | 134.916 → 52.969 | 459.560 → 76.656 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 123931 → 111323 |
| aoDenoise | 126.348 → 52.912 | 435.829 → 87.447 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 495100 → 445008 |
| composite | 107.911 → 53.449 | 413.819 → 83.295 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 1979612 → 1779287 |
| distortion | 65.679 → 49.677 | 141.721 → 66.788 | 6 → 6 | 0.164 → 0.164 | 0.164 → 0.164 | 19534 → 17501 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 340731945 → 340731945 |
| render-target textures | 55563008 → 48161840 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 7.027 → 8.204 | 69.8% → 79.6% | 12228.166 → 26300.986 |
| UI/HUD DOM | 0.920 → 0.498 | 9.1% → 4.8% | 1692.062 → 1638.167 |
| animation mixers/skinning | 0.685 → 0.384 | 6.8% → 3.7% | 1359.708 → 1190.193 |
| simulation step | 0.452 → 0.269 | 4.5% → 2.6% | 860.764 → 742.761 |
| unattributed | 0.441 → 0.555 | 4.4% → 5.4% | 1033.643 → 1588.906 |
| VFX/telegraph batching | 0.333 → 0.223 | 3.3% → 2.2% | 669.062 → 607.080 |
| actor pose/motion | 0.159 → 0.102 | 1.6% → 1.0% | 326.078 → 274.843 |
| GC | 0.038 → 0.057 | 0.4% → 0.6% | 114.624 → 338.133 |
| lighting/shadow update | 0.005 → 0.002 | 0.1% → 0.0% | 10.815 → 6.075 |
| world dressing update | 0.004 → 0.007 | 0.0% → 0.1% | 7.022 → 19.751 |
| idle | unavailable → unavailable | unavailable → unavailable | 3296.639 → 7625.852 |

Active sampled duration: 18301.944 → 32706.895 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, PickupSystem-DaOfTIP9.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js; after AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-er_fwrFp.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js.

## relay-racks/breacher/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 303.11/395.74/558.94 → 368.97/398.44/550.57 (10 cores); changed 583.82/585.75/581.83 → 626.32/595.51/585.51 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 333.400 → 224.700 |
| batched observer interval p95 ms (not game frame latency) | 701.200 → 398.800 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.700 → 6.100 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.000 → 7.700 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 63.329 → 39.040 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 104.000 → 104.000 |
| triangles maximum | 660786.000 → 660746.000 |
| measured thread CPU total ms | 6333.883 → 6596.149 |
| thread CPU mean per actual render ms (instrumented) | 8.269 → 8.611 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 30.567 → 27.414 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2980.833 → 2980.833 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 63.329 → 39.040 | 124.390 → 67.510 | 73 → 73 | 88.124 → 88.124 | 619210.763 → 619202.658 | 2073600 → 2073600 |
| sceneColor | 58.963 → 38.563 | 126.950 → 65.781 | 73 → 73 | 86.124 → 86.124 | 619208.763 → 619200.658 | 2073600 → 2073600 |
| mainOpaque | 53.315 → 31.994 | 125.557 → 69.468 | 73 → 73 | 74.728 → 74.728 | 616070.714 → 616070.714 | 2073600 → 2073600 |
| hud | 47.596 → 37.636 | 87.980 → 55.426 | 72 → 72 | 7.869 → 7.869 | 24192.030 → 24192.030 | 2073600 → 2073600 |
| finalAA | 39.421 → 29.125 | 74.839 → 45.100 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| composite | 37.401 → 26.534 | 70.003 → 40.157 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 36.156 → 24.113 | 64.962 → 40.409 | 72 → 72 | 11.396 → 11.396 | 3138.050 → 3129.944 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 309258281 → 309258281 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 5.612 → 5.786 | 67.9% → 67.2% | 9306.025 → 9350.055 |
| animation mixers/skinning | 0.690 → 0.715 | 8.3% → 8.3% | 1233.671 → 1274.810 |
| unattributed | 0.595 → 0.598 | 7.2% → 6.9% | 987.275 → 970.738 |
| simulation step | 0.469 → 0.518 | 5.7% → 6.0% | 778.429 → 783.946 |
| UI/HUD DOM | 0.343 → 0.393 | 4.1% → 4.6% | 612.465 → 636.025 |
| VFX/telegraph batching | 0.320 → 0.317 | 3.9% → 3.7% | 637.331 → 625.966 |
| actor pose/motion | 0.180 → 0.190 | 2.2% → 2.2% | 313.837 → 360.097 |
| GC | 0.043 → 0.081 | 0.5% → 0.9% | 110.092 → 239.507 |
| world dressing update | 0.009 → 0.011 | 0.1% → 0.1% | 14.046 → 13.055 |
| lighting/shadow update | 0.006 → 0.001 | 0.1% → 0.0% | 9.645 → 1.535 |
| idle | unavailable → unavailable | unavailable → unavailable | 3252.769 → 3497.225 |

Active sampled duration: 14002.816 → 14255.734 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, PickupSystem-DaOfTIP9.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-er_fwrFp.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js.

## relay-racks/arc/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1535 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 368.97/398.44/550.57 → 505.12/433.62/544.79 (10 cores); changed 626.32/595.51/585.51 → 612.97/600.67/588.49 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 883.400 → 591.400 |
| batched observer interval p95 ms (not game frame latency) | 2098.800 → 1050.000 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.700 → 6.800 |
| GPU-audit frozen RAF CPU observer p95 ms | 10.600 → 9.200 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 139.389 → 108.811 |
| adaptive scale minimum | 0.950 → 0.900 |
| adaptive scale p50 | 0.975 → 0.925 |
| draws maximum | 124.000 → 124.000 |
| triangles maximum | 692105.000 → 692149.000 |
| measured thread CPU total ms | 7377.155 → 8303.774 |
| thread CPU mean per actual render ms (instrumented) | 9.631 → 10.840 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 29.147 → 26.029 |
| GL clears per fixed tick (includes refresh/RAF) | 17.431 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.056 |
| GL calls per fixed tick (includes refresh/RAF) | 3808.164 → 3809.193 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| sceneColor | 151.041 → 101.005 | 452.608 → 190.204 | 37 → 37 | 98.439 → 98.436 | 643562.742 → 643579.617 | 1979551 → 1782036 |
| frameTotal | 139.389 → 108.811 | 263.090 → 182.788 | 37 → 38 | 105.641 → 105.638 | 643569.945 → 643586.819 | 2073600 → 2073600 |
| mainOpaque | 121.703 → 68.547 | 246.326 → 166.955 | 37 → 37 | 78.901 → 78.907 | 619073.798 → 619119.570 | 1979551 → 1782036 |
| hud | 105.022 → 54.021 | 238.943 → 140.488 | 37 → 37 | 7.777 → 7.777 | 24320.133 → 24320.169 | 2073600 → 2073600 |
| gtao | 99.367 → 51.885 | 160.311 → 139.023 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 495084 → 445695 |
| finalAA | 94.142 → 51.251 | 217.991 → 114.041 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| composite | 91.949 → 54.037 | 251.092 → 105.609 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 1979551 → 1782036 |
| bloomBlurHorizontal | 83.824 → 47.848 | 232.177 → 114.682 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123927 → 111498 |
| transparentVFX | 82.313 → 49.520 | 185.496 → 107.985 | 37 → 37 | 19.538 → 19.528 | 24488.945 → 24460.047 | 1979551 → 1782036 |
| distortion | 80.470 → 49.702 | 149.720 → 115.043 | 12 → 12 | 0.202 → 0.202 | 0.202 → 0.202 | 24764 → 22218 |
| aoDenoise | 79.740 → 51.650 | 167.379 → 129.569 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 495084 → 445695 |
| bloomExtract | 76.507 → 44.131 | 177.473 → 105.301 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123927 → 111498 |
| bloomBlurVertical | 74.798 → 49.491 | 178.721 → 115.384 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123927 → 111498 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 340723753 → 340723753 |
| render-target textures | 55563008 → 48414560 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 7.829 → 9.143 | 81.3% → 84.3% | 22506.957 → 29645.816 |
| unattributed | 0.476 → 0.210 | 4.9% → 1.9% | 1409.221 → 1687.054 |
| animation mixers/skinning | 0.352 → 0.349 | 3.7% → 3.2% | 1145.783 → 1292.303 |
| VFX/telegraph batching | 0.287 → 0.371 | 3.0% → 3.4% | 990.558 → 1087.368 |
| UI/HUD DOM | 0.280 → 0.289 | 2.9% → 2.7% | 940.341 → 1052.107 |
| simulation step | 0.261 → 0.291 | 2.7% → 2.7% | 831.104 → 796.255 |
| actor pose/motion | 0.080 → 0.108 | 0.8% → 1.0% | 271.536 → 328.803 |
| GC | 0.060 → 0.073 | 0.6% → 0.7% | 290.193 → 277.720 |
| world dressing update | 0.005 → 0.005 | 0.1% → 0.0% | 18.840 → 28.613 |
| lighting/shadow update | 0.001 → 0.001 | 0.0% → 0.0% | 5.391 → 3.018 |
| idle | unavailable → unavailable | unavailable → unavailable | 7267.305 → 15727.900 |

Active sampled duration: 28409.924 → 36199.057 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before debug-DkVQIwzz.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, index-CH45HxKO.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, rigPortraits-h8XV7YY-.js, PickupSystem-DaOfTIP9.js, facilityGeometry-aDvEV29y.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js; after debug-DkVQIwzz.js, DepthRenderer-D8JGnmx1.js, presentation-shared-DSPhp2Lx.js, AbilityVisuals-WfopSGEM.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, PickupSystem-er_fwrFp.js, facilityGeometry-aDvEV29y.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, rigPortraits-h8XV7YY-.js.

## relay-racks/arc/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 505.12/433.62/544.79 → 446.63/433.74/536.24 (10 cores); changed 612.97/600.67/588.49 → 578.61/594.10/586.69 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 458.300 → 283.100 |
| batched observer interval p95 ms (not game frame latency) | 1158.300 → 475.300 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.500 → 5.900 |
| GPU-audit frozen RAF CPU observer p95 ms | 10.700 → 7.700 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 66.287 → 48.968 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 108.000 → 108.000 |
| triangles maximum | 663550.000 → 663550.000 |
| measured thread CPU total ms | 6472.118 → 6207.428 |
| thread CPU mean per actual render ms (instrumented) | 8.449 → 8.104 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 29.147 → 26.001 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2922.096 → 2922.093 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 66.287 → 48.968 | 264.631 → 125.031 | 73 → 73 | 89.797 → 89.796 | 610568.115 → 610567.957 | 2073600 → 2073600 |
| hud | 64.114 → 33.009 | 193.713 → 75.263 | 72 → 72 | 7.777 → 7.777 | 24320.133 → 24320.133 | 2073600 → 2073600 |
| sceneColor | 60.437 → 45.085 | 235.256 → 136.306 | 73 → 73 | 87.797 → 87.796 | 610566.115 → 610565.957 | 2073600 → 2073600 |
| mainOpaque | 58.952 → 37.215 | 261.180 → 81.126 | 73 → 73 | 73.314 → 73.314 | 588644.673 → 588644.673 | 2073600 → 2073600 |
| finalAA | 42.406 → 24.695 | 188.252 → 54.576 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 35.438 → 25.352 | 159.742 → 58.273 | 72 → 72 | 14.483 → 14.481 | 21921.442 → 21921.284 | 2073600 → 2073600 |
| composite | 33.601 → 26.823 | 130.053 → 57.256 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 309258281 → 309258281 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 5.478 → 4.826 | 64.8% → 59.5% | 9218.457 → 7162.298 |
| animation mixers/skinning | 0.683 → 0.750 | 8.1% → 9.3% | 1222.606 → 1147.923 |
| unattributed | 0.586 → 0.549 | 6.9% → 6.8% | 1060.488 → 764.098 |
| UI/HUD DOM | 0.531 → 0.659 | 6.3% → 8.1% | 932.210 → 853.030 |
| simulation step | 0.499 → 0.554 | 5.9% → 6.8% | 748.066 → 760.551 |
| VFX/telegraph batching | 0.451 → 0.522 | 5.3% → 6.4% | 714.569 → 694.221 |
| actor pose/motion | 0.170 → 0.190 | 2.0% → 2.3% | 267.299 → 277.435 |
| GC | 0.045 → 0.043 | 0.5% → 0.5% | 154.104 → 88.768 |
| world dressing update | 0.004 → 0.008 | 0.1% → 0.1% | 6.901 → 10.190 |
| lighting/shadow update | 0.001 → 0.003 | 0.0% → 0.0% | 6.111 → 2.950 |
| idle | unavailable → unavailable | unavailable → unavailable | 2740.032 → 2652.973 |

Active sampled duration: 14330.811 → 11761.464 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, presentation-shared-DSPhp2Lx.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js, PickupSystem-DaOfTIP9.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js, rigPortraits-h8XV7YY-.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, presentation-shared-DSPhp2Lx.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, PickupSystem-er_fwrFp.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js.

## transmission-chamber/breacher/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1535 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 446.63/433.74/536.24 → 401.98/419.16/517.35 (10 cores); changed 578.61/594.10/586.69 → 513.70/571.56/578.81 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 717.500 → 534.400 |
| batched observer interval p95 ms (not game frame latency) | 2574.400 → 1258.300 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.800 → 6.600 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.600 → 9.500 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 137.451 → 90.964 |
| adaptive scale minimum | 1.000 → 0.925 |
| adaptive scale p50 | 1.000 → 0.950 |
| draws maximum | 118.000 → 118.000 |
| triangles maximum | 757340.000 → 757386.000 |
| measured thread CPU total ms | 7425.354 → 6677.573 |
| thread CPU mean per actual render ms (instrumented) | 9.694 → 8.717 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 33.004 → 29.857 |
| GL clears per fixed tick (includes refresh/RAF) | 17.429 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.054 |
| GL calls per fixed tick (includes refresh/RAF) | 3654.219 → 3658.925 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 137.451 → 90.964 | 549.943 → 195.769 | 34 → 34 | 95.945 → 95.949 | 699826.254 → 699801.179 | 2073600 → 2073600 |
| transparentVFX | 134.472 → 117.089 | 898.226 → 376.890 | 34 → 34 | 16.526 → 16.531 | 4017.300 → 4012.246 | 2073600 → 1879881 |
| sceneColor | 120.950 → 104.165 | 721.948 → 198.777 | 34 → 34 | 88.744 → 88.747 | 699819.053 → 699793.978 | 2073600 → 1879881 |
| mainOpaque | 119.615 → 105.845 | 429.196 → 234.455 | 34 → 34 | 72.218 → 72.216 | 695801.752 → 695781.731 | 2073600 → 1879881 |
| hud | 110.487 → 92.175 | 495.288 → 203.818 | 33 → 33 | 7.546 → 7.546 | 24170.225 → 24170.224 | 2073600 → 2073600 |
| distortion | 100.671 → 53.652 | 194.591 → 75.670 | 7 → 7 | 0.201 → 0.201 | 0.201 → 0.201 | 26089 → 22662 |
| finalAA | 91.641 → 68.449 | 500.426 → 146.547 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| aoDenoise | 91.459 → 77.917 | 417.035 → 241.621 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 470236 |
| gtao | 88.847 → 97.401 | 488.620 → 235.453 | 34 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 470236 |
| composite | 83.362 → 79.987 | 466.527 → 153.859 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 1879881 |
| bloomBlurVertical | 81.824 → 76.640 | 317.254 → 213.191 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 117732 |
| bloomBlurHorizontal | 78.343 → 68.751 | 221.704 → 235.240 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 117732 |
| gasDepthSnapshot | 78.003 → 60.140 | 481.414 → 136.943 | 18 → 18 | 0.000 → 0.000 | 0.000 → 0.000 | 280307 → 253849 |
| bloomExtract | 74.199 → 70.686 | 532.443 → 188.978 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 117732 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 340734249 → 340734249 |
| render-target textures | 55563008 → 50292392 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 7.782 → 6.142 | 80.3% → 70.5% | 24001.536 → 11997.716 |
| unattributed | 0.622 → 0.545 | 6.4% → 6.3% | 1740.616 → 1200.413 |
| UI/HUD DOM | 0.364 → 0.553 | 3.8% → 6.3% | 1225.481 → 1109.542 |
| animation mixers/skinning | 0.347 → 0.586 | 3.6% → 6.7% | 1150.864 → 1137.425 |
| simulation step | 0.274 → 0.434 | 2.8% → 5.0% | 807.463 → 853.873 |
| VFX/telegraph batching | 0.180 → 0.252 | 1.9% → 2.9% | 658.654 → 624.631 |
| actor pose/motion | 0.093 → 0.163 | 1.0% → 1.9% | 337.646 → 314.980 |
| GC | 0.025 → 0.034 | 0.3% → 0.4% | 127.005 → 108.373 |
| lighting/shadow update | 0.003 → unavailable | 0.0% → unavailable | 14.220 → unavailable |
| world dressing update | 0.003 → 0.009 | 0.0% → 0.1% | 6.396 → 11.980 |
| idle | unavailable → unavailable | unavailable → unavailable | 7388.923 → 3789.595 |

Active sampled duration: 30069.881 → 17358.933 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-DaOfTIP9.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, rigPortraits-h8XV7YY-.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, catalog-BS-Wgrcu.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, presentation-shared-DSPhp2Lx.js, AbilityVisuals-WfopSGEM.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, PickupSystem-er_fwrFp.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js.

## transmission-chamber/breacher/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 406.22/419.76/516.98 → 514.08/445.01/520.14 (10 cores); changed 513.70/571.56/578.81 → 485.71/553.37/571.52 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 399.900 → 458.400 |
| batched observer interval p95 ms (not game frame latency) | 1266.000 → 916.400 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.300 → 5.900 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.300 → 7.700 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 61.195 → 100.780 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 98.000 → 98.000 |
| triangles maximum | 705762.000 → 705644.000 |
| measured thread CPU total ms | 5948.585 → 5655.634 |
| thread CPU mean per actual render ms (instrumented) | 7.766 → 7.383 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 33.010 → 29.857 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2810.694 → 2810.881 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| mainOpaque | 67.867 → 77.563 | 200.017 → 169.618 | 73 → 73 | 65.284 → 65.284 | 663911.257 → 663911.257 | 2073600 → 2073600 |
| sceneColor | 62.509 → 98.507 | 245.551 → 231.703 | 73 → 73 | 77.015 → 77.014 | 666837.392 → 666839.437 | 2073600 → 2073600 |
| hud | 61.365 → 75.113 | 212.836 → 134.700 | 72 → 72 | 7.546 → 7.546 | 24170.224 → 24170.224 | 2073600 → 2073600 |
| frameTotal | 61.195 → 100.780 | 143.780 → 175.976 | 73 → 73 | 79.015 → 79.014 | 666839.392 → 666841.437 | 2073600 → 2073600 |
| finalAA | 42.025 → 55.948 | 108.110 → 104.167 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 39.193 → 54.094 | 111.049 → 108.933 | 72 → 73 | 11.731 → 11.729 | 2926.136 → 2928.180 | 2073600 → 2073600 |
| composite | 38.750 → 47.180 | 177.025 → 98.715 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 309260585 → 309260585 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 5.441 → 3.649 | 70.1% → 49.4% | 10180.984 → 4376.899 |
| animation mixers/skinning | 0.547 → 0.854 | 7.0% → 11.6% | 1051.591 → 913.175 |
| unattributed | 0.504 → 0.629 | 6.5% → 8.5% | 1163.321 → 788.692 |
| simulation step | 0.481 → 0.759 | 6.2% → 10.3% | 879.062 → 917.739 |
| UI/HUD DOM | 0.314 → 0.612 | 4.0% → 8.3% | 634.309 → 680.534 |
| VFX/telegraph batching | 0.286 → 0.518 | 3.7% → 7.0% | 665.212 → 588.682 |
| actor pose/motion | 0.160 → 0.271 | 2.1% → 3.7% | 274.329 → 301.988 |
| GC | 0.020 → 0.066 | 0.3% → 0.9% | 70.999 → 88.130 |
| lighting/shadow update | 0.008 → 0.008 | 0.1% → 0.1% | 15.956 → 9.097 |
| world dressing update | 0.007 → 0.017 | 0.1% → 0.2% | 12.197 → 13.925 |
| idle | unavailable → unavailable | unavailable → unavailable | 3187.731 → 2441.749 |

Active sampled duration: 14947.960 → 8678.861 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-DaOfTIP9.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-er_fwrFp.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js.

## transmission-chamber/arc/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1535 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 514.08/445.01/520.14 → 653.37/518.53/540.06 (10 cores); changed 485.71/553.37/571.52 → 358.07/492.83/546.15 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 675.000 → 840.100 |
| batched observer interval p95 ms (not game frame latency) | 2365.700 → 1401.200 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.800 → 6.900 |
| GPU-audit frozen RAF CPU observer p95 ms | 13.100 → 9.000 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 134.556 → 159.181 |
| adaptive scale minimum | 0.950 → 0.900 |
| adaptive scale p50 | 0.975 → 0.925 |
| draws maximum | 115.000 → 115.000 |
| triangles maximum | 772647.000 → 772691.000 |
| measured thread CPU total ms | 7988.875 → 8498.967 |
| thread CPU mean per actual render ms (instrumented) | 10.429 → 11.095 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 32.496 → 29.332 |
| GL clears per fixed tick (includes refresh/RAF) | 17.464 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.089 |
| GL calls per fixed tick (includes refresh/RAF) | 3699.553 → 3701.064 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 134.556 → 159.181 | 403.538 → 218.752 | 37 → 37 | 98.619 → 98.616 | 715893.151 → 715904.567 | 2073600 → 2073600 |
| sceneColor | 120.570 → 153.251 | 488.696 → 214.344 | 37 → 37 | 91.401 → 91.399 | 715885.934 → 715897.350 | 1978690 → 1781412 |
| mainOpaque | 76.128 → 95.638 | 328.447 → 150.219 | 37 → 37 | 71.596 → 71.598 | 690897.001 → 690917.758 | 1978690 → 1781412 |
| bloomBlurVertical | 69.398 → 70.337 | 382.513 → 161.503 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123874 → 111459 |
| composite | 66.074 → 78.487 | 255.200 → 146.212 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 1978690 → 1781412 |
| finalAA | 62.476 → 83.120 | 318.038 → 157.821 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| gtao | 58.627 → 75.203 | 320.437 → 143.308 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 494869 → 445539 |
| aoDenoise | 58.534 → 64.296 | 323.533 → 148.515 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 494869 → 445539 |
| bloomExtract | 58.507 → 64.204 | 261.077 → 171.973 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123874 → 111459 |
| bloomBlurHorizontal | 57.047 → 79.152 | 253.797 → 147.212 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 123874 → 111459 |
| hud | 54.028 → 64.194 | 133.257 → 111.439 | 37 → 37 | 7.545 → 7.545 | 24311.266 → 24311.268 | 2073600 → 2073600 |
| transparentVFX | 52.302 → 78.445 | 381.054 → 142.741 | 37 → 37 | 19.804 → 19.801 | 24988.932 → 24979.592 | 1978690 → 1781412 |
| distortion | 48.514 → 73.624 | 262.843 → 134.805 | 10 → 10 | 0.218 → 0.218 | 0.218 → 0.218 | 26733 → 24021 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 340734249 → 340734249 |
| render-target textures | 55563008 → 48414560 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 8.400 → 9.004 | 80.5% → 81.2% | 23953.802 → 36513.124 |
| VFX/telegraph batching | 0.432 → 0.329 | 4.1% → 3.0% | 1285.820 → 1277.748 |
| unattributed | 0.413 → 0.728 | 4.0% → 6.6% | 1624.223 → 2653.501 |
| animation mixers/skinning | 0.395 → 0.368 | 3.8% → 3.3% | 1244.817 → 1436.134 |
| UI/HUD DOM | 0.350 → 0.298 | 3.4% → 2.7% | 1145.498 → 1167.847 |
| simulation step | 0.279 → 0.235 | 2.7% → 2.1% | 779.756 → 723.150 |
| actor pose/motion | 0.107 → 0.092 | 1.0% → 0.8% | 277.142 → 311.091 |
| GC | 0.045 → 0.035 | 0.4% → 0.3% | 195.947 → 166.585 |
| world dressing update | 0.007 → 0.004 | 0.1% → 0.0% | 20.545 → 12.096 |
| lighting/shadow update | 0.001 → 0.001 | 0.0% → 0.0% | 2.954 → 4.634 |
| fixture driver | 0.001 → unavailable | 0.0% → unavailable | 1.541 → unavailable |
| idle | unavailable → unavailable | unavailable → unavailable | 5965.909 → 3837.440 |

Active sampled duration: 30532.045 → 44265.910 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-DaOfTIP9.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js; after index-DeffeJpW.js, debug-DkVQIwzz.js, DepthRenderer-D8JGnmx1.js, presentation-shared-DSPhp2Lx.js, expedition-mTxs7weK.js, AbilityVisuals-WfopSGEM.js, PickupSystem-er_fwrFp.js, AudioSystem-g3SHKf5y.js, OriginalCreatureAnatomy-DOhHIavL.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js.

## transmission-chamber/arc/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 653.37/518.53/540.06 → 629.62/533.52/544.42 (10 cores); changed 358.07/492.83/546.15 → 340.44/463.43/531.53 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 326.400 → 474.900 |
| batched observer interval p95 ms (not game frame latency) | 608.500 → 723.800 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.000 → 6.600 |
| GPU-audit frozen RAF CPU observer p95 ms | 7.800 → 8.400 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 49.346 → 72.913 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 98.000 → 98.000 |
| triangles maximum | 737288.000 → 737288.000 |
| measured thread CPU total ms | 6968.223 → 7276.083 |
| thread CPU mean per actual render ms (instrumented) | 9.097 → 9.499 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 32.496 → 29.328 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2855.572 → 2855.560 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 49.346 → 72.913 | 81.334 → 121.732 | 73 → 73 | 81.696 → 81.700 | 682764.228 → 682771.363 | 2073600 → 2073600 |
| hud | 48.824 → 60.798 | 104.990 → 142.223 | 72 → 72 | 7.545 → 7.545 | 24311.266 → 24311.264 | 2073600 → 2073600 |
| sceneColor | 42.990 → 67.596 | 84.531 → 111.090 | 73 → 73 | 79.696 → 79.700 | 682762.228 → 682769.363 | 2073600 → 2073600 |
| mainOpaque | 40.867 → 63.743 | 106.278 → 126.111 | 73 → 73 | 64.735 → 64.735 | 660599.213 → 660589.984 | 2073600 → 2073600 |
| composite | 29.740 → 40.845 | 70.930 → 88.674 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 29.351 → 39.110 | 62.979 → 81.125 | 72 → 72 | 14.962 → 14.965 | 22163.016 → 22179.379 | 2073600 → 2073600 |
| finalAA | 28.642 → 41.624 | 60.357 → 91.754 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 309260585 → 309260585 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 5.724 → 7.206 | 62.9% → 75.9% | 9218.573 → 23027.876 |
| animation mixers/skinning | 0.779 → 0.393 | 8.6% → 4.1% | 1352.954 → 1211.590 |
| unattributed | 0.703 → 0.854 | 7.7% → 9.0% | 1064.283 → 2421.820 |
| VFX/telegraph batching | 0.663 → 0.314 | 7.3% → 3.3% | 1013.331 → 1007.121 |
| simulation step | 0.487 → 0.282 | 5.4% → 3.0% | 720.849 → 791.137 |
| UI/HUD DOM | 0.467 → 0.261 | 5.1% → 2.8% | 772.427 → 831.154 |
| actor pose/motion | 0.232 → 0.119 | 2.5% → 1.3% | 345.937 → 375.576 |
| GC | 0.029 → 0.062 | 0.3% → 0.7% | 84.038 → 258.484 |
| world dressing update | 0.008 → 0.007 | 0.1% → 0.1% | 9.432 → 20.629 |
| lighting/shadow update | 0.005 → 0.001 | 0.0% → 0.0% | 5.794 → 1.519 |
| idle | unavailable → unavailable | unavailable → unavailable | 3446.952 → 6551.959 |

Active sampled duration: 14587.618 → 29946.906 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-DaOfTIP9.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js, DeferredRagdolls-lKG9qDcl.js, rigPortraits-h8XV7YY-.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, catalog-BS-Wgrcu.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, PickupSystem-er_fwrFp.js, presentation-shared-DSPhp2Lx.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, facilityGeometry-aDvEV29y.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js.

## freight-hold/breacher/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1535 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 629.62/533.52/544.42 → 566.03/533.59/543.76 (10 cores); changed 340.44/463.43/531.53 → 346.83/429.27/510.59 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 424.700 → 858.400 |
| batched observer interval p95 ms (not game frame latency) | 850.300 → 1673.900 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.600 → 7.100 |
| GPU-audit frozen RAF CPU observer p95 ms | 8.100 → 9.300 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 81.638 → 166.413 |
| adaptive scale minimum | 1.000 → 0.900 |
| adaptive scale p50 | 1.000 → 0.925 |
| draws maximum | 113.000 → 113.000 |
| triangles maximum | 692082.000 → 691998.000 |
| measured thread CPU total ms | 7892.502 → 8577.803 |
| thread CPU mean per actual render ms (instrumented) | 10.304 → 11.198 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 31.808 → 28.665 |
| GL clears per fixed tick (includes refresh/RAF) | 17.404 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.029 |
| GL calls per fixed tick (includes refresh/RAF) | 3609.085 → 3613.481 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| transparentVFX | 86.304 → 193.696 | 205.966 → 448.927 | 34 → 34 | 17.033 → 17.031 | 4262.678 → 4258.731 | 2073600 → 1780662 |
| frameTotal | 81.638 → 166.413 | 141.553 → 316.623 | 34 → 34 | 96.057 → 96.056 | 636259.085 → 636274.079 | 2073600 → 2073600 |
| sceneColor | 73.165 → 149.642 | 193.064 → 305.375 | 34 → 34 | 88.868 → 88.866 | 636251.896 → 636266.890 | 2073600 → 1780662 |
| mainOpaque | 67.880 → 158.273 | 172.714 → 282.761 | 34 → 34 | 71.834 → 71.835 | 631989.218 → 632008.159 | 2073600 → 1780662 |
| finalAA | 56.857 → 110.908 | 80.545 → 161.879 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| hud | 56.568 → 149.711 | 99.013 → 225.971 | 33 → 33 | 7.683 → 7.682 | 24173.115 → 24173.122 | 2073600 → 2073600 |
| bloomBlurVertical | 56.050 → 101.819 | 138.904 → 241.832 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111411 |
| bloomBlurHorizontal | 53.879 → 114.587 | 120.649 → 210.695 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111411 |
| composite | 52.535 → 108.704 | 111.811 → 190.333 | 33 → 33 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 1780662 |
| aoDenoise | 49.988 → 116.972 | 101.931 → 231.626 | 34 → 34 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 445352 |
| gtao | 49.868 → 107.910 | 115.063 → 182.153 | 34 → 34 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 445352 |
| gasDepthSnapshot | 49.460 → 113.241 | 108.732 → 262.472 | 18 → 18 | 0.000 → 0.000 | 0.000 → 0.000 | 288263 → 246519 |
| bloomExtract | 47.569 → 88.919 | 122.563 → 157.713 | 34 → 34 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111411 |
| distortion | 45.692 → 111.627 | 57.661 → 122.750 | 7 → 7 | 0.190 → 0.190 | 0.190 → 0.190 | 24585 → 20195 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 323957037 → 323957037 |
| render-target textures | 55563008 → 48161840 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 8.324 → 10.057 | 80.8% → 89.8% | 23954.979 → 41158.047 |
| UI/HUD DOM | 0.606 → 0.385 | 5.9% → 3.4% | 1793.315 → 2038.020 |
| animation mixers/skinning | 0.377 → 0.256 | 3.7% → 2.3% | 1200.292 → 1252.264 |
| unattributed | 0.362 → 0.068 | 3.5% → 0.6% | 1205.070 → 390.904 |
| simulation step | 0.292 → 0.194 | 2.8% → 1.7% | 823.667 → 949.393 |
| VFX/telegraph batching | 0.202 → 0.126 | 2.0% → 1.1% | 572.882 → 571.792 |
| actor pose/motion | 0.114 → 0.079 | 1.1% → 0.7% | 289.873 → 325.350 |
| GC | 0.022 → 0.030 | 0.2% → 0.3% | 98.868 → 172.142 |
| world dressing update | 0.005 → 0.002 | 0.0% → 0.0% | 11.662 → 8.317 |
| lighting/shadow update | 0.001 → 0.001 | 0.0% → 0.0% | 1.411 → 1.018 |
| idle | unavailable → unavailable | unavailable → unavailable | 5173.787 → 14036.747 |

Active sampled duration: 29952.019 → 46867.247 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-DaOfTIP9.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js; after debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, PickupSystem-er_fwrFp.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, rigPortraits-h8XV7YY-.js.

## freight-hold/breacher/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 566.03/533.59/543.76 → 612.98/550.03/549.03 (10 cores); changed 346.83/429.27/510.59 → 341.79/410.89/497.25 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 366.800 → 531.800 |
| batched observer interval p95 ms (not game frame latency) | 974.100 → 1016.400 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.500 → 6.500 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.300 → 8.600 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 54.715 → 111.181 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 95.000 → 95.000 |
| triangles maximum | 635574.000 → 635556.000 |
| measured thread CPU total ms | 6755.834 → 6729.097 |
| thread CPU mean per actual render ms (instrumented) | 8.820 → 8.785 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 31.808 → 28.656 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2802.800 → 2805.610 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 54.715 → 111.181 | 268.211 → 184.353 | 73 → 73 | 79.917 → 79.917 | 598391.648 → 598393.021 | 2073600 → 2073600 |
| sceneColor | 50.648 → 102.985 | 191.904 → 224.013 | 73 → 73 | 77.917 → 77.917 | 598389.648 → 598391.021 | 2073600 → 2073600 |
| mainOpaque | 43.717 → 75.397 | 205.278 → 165.007 | 73 → 73 | 65.902 → 65.902 | 595398.576 → 595398.576 | 2073600 → 2073600 |
| composite | 41.974 → 59.526 | 112.636 → 105.821 | 73 → 73 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| finalAA | 38.681 → 59.183 | 171.397 → 109.918 | 73 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| hud | 36.213 → 41.539 | 206.398 → 125.447 | 72 → 72 | 7.683 → 7.683 | 24173.115 → 24173.115 | 2073600 → 2073600 |
| transparentVFX | 36.087 → 62.339 | 105.337 → 108.922 | 73 → 73 | 12.015 → 12.015 | 2991.072 → 2992.445 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 305066285 → 305066285 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.071 → 7.303 | 68.8% → 83.1% | 10837.933 → 21386.502 |
| UI/HUD DOM | 0.729 → 0.403 | 8.3% → 4.6% | 1451.742 → 1349.284 |
| animation mixers/skinning | 0.636 → 0.342 | 7.2% → 3.9% | 1211.494 → 1211.544 |
| simulation step | 0.484 → 0.270 | 5.5% → 3.1% | 806.189 → 773.480 |
| unattributed | 0.376 → 0.192 | 4.3% → 2.2% | 684.774 → 992.776 |
| VFX/telegraph batching | 0.314 → 0.152 | 3.6% → 1.7% | 579.767 → 493.054 |
| actor pose/motion | 0.171 → 0.091 | 1.9% → 1.0% | 288.874 → 267.484 |
| GC | 0.027 → 0.025 | 0.3% → 0.3% | 87.566 → 118.374 |
| world dressing update | 0.011 → 0.004 | 0.1% → 0.0% | 22.276 → 9.957 |
| lighting/shadow update | 0.001 → 0.003 | 0.0% → 0.0% | 2.077 → 8.794 |
| idle | unavailable → unavailable | unavailable → unavailable | 3331.040 → 10153.782 |

Active sampled duration: 15972.692 → 26611.249 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, PickupSystem-DaOfTIP9.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js; after index-DeffeJpW.js, debug-DkVQIwzz.js, DepthRenderer-D8JGnmx1.js, presentation-shared-DSPhp2Lx.js, AbilityVisuals-WfopSGEM.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-er_fwrFp.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js, rigPortraits-h8XV7YY-.js.

## freight-hold/arc/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1535 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 612.98/550.03/549.03 → 672.12/608.73/574.16 (10 cores); changed 341.79/410.89/497.25 → 291.34/371.17/470.73 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 1575.100 → 974.600 |
| batched observer interval p95 ms (not game frame latency) | 3592.200 → 2025.100 |
| GPU-audit frozen RAF CPU observer p50 ms | 7.100 → 7.100 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.500 → 9.300 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 294.124 → 190.967 |
| adaptive scale minimum | 1.000 → 0.900 |
| adaptive scale p50 | 1.000 → 0.925 |
| draws maximum | 117.000 → 117.000 |
| triangles maximum | 714242.000 → 714242.000 |
| measured thread CPU total ms | 8348.161 → 7804.663 |
| thread CPU mean per actual render ms (instrumented) | 10.898 → 10.189 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 33.740 → 30.572 |
| GL clears per fixed tick (includes refresh/RAF) | 17.478 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 11.103 |
| GL calls per fixed tick (includes refresh/RAF) | 3582.474 → 3587.300 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 294.124 → 190.967 | 645.811 → 321.555 | 38 → 37 | 97.821 → 97.827 | 648515.847 → 648518.542 | 2073600 → 2073600 |
| sceneColor | 265.471 → 187.190 | 679.093 → 343.934 | 37 → 37 | 90.597 → 90.603 | 648508.623 → 648511.318 | 2073600 → 1781044 |
| mainOpaque | 197.130 → 123.838 | 623.452 → 275.960 | 37 → 37 | 70.552 → 70.550 | 623644.646 → 623619.384 | 2073600 → 1781044 |
| transparentVFX | 160.923 → 76.526 | 425.713 → 260.461 | 37 → 37 | 20.045 → 20.053 | 24863.977 → 24891.933 | 2073600 → 1781044 |
| aoDenoise | 139.349 → 79.316 | 356.415 → 219.438 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 445447 |
| composite | 126.220 → 102.761 | 323.105 → 184.193 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 1781044 |
| bloomBlurHorizontal | 115.031 → 85.970 | 397.024 → 238.096 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111435 |
| bloomBlurVertical | 114.790 → 81.518 | 305.332 → 235.503 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111435 |
| hud | 111.862 → 83.703 | 417.197 → 240.589 | 37 → 37 | 7.671 → 7.671 | 24319.002 → 24318.988 | 2073600 → 2073600 |
| distortion | 110.232 → 77.692 | 552.438 → 162.939 | 12 → 12 | 0.224 → 0.224 | 0.224 → 0.224 | 29044 → 24722 |
| bloomExtract | 106.662 → 85.501 | 392.863 → 230.089 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 129600 → 111435 |
| finalAA | 106.508 → 85.912 | 450.478 → 181.111 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| gtao | 106.422 → 67.381 | 445.418 → 211.344 | 37 → 37 | 1.000 → 1.000 | 1.000 → 1.000 | 518400 → 445447 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 323950637 → 323950637 |
| render-target textures | 55563008 → 48414560 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 8.921 → 6.611 | 81.9% → 64.9% | 28572.604 → 11843.266 |
| unattributed | 0.541 → 0.962 | 5.0% → 9.4% | 1877.734 → 1688.160 |
| animation mixers/skinning | 0.369 → 0.680 | 3.4% → 6.7% | 1392.401 → 1313.574 |
| UI/HUD DOM | 0.355 → 0.622 | 3.3% → 6.1% | 1306.122 → 1127.683 |
| VFX/telegraph batching | 0.287 → 0.558 | 2.6% → 5.5% | 1139.881 → 1063.845 |
| simulation step | 0.282 → 0.487 | 2.6% → 4.8% | 870.861 → 918.135 |
| actor pose/motion | 0.105 → 0.201 | 1.0% → 2.0% | 347.856 → 368.569 |
| GC | 0.032 → 0.055 | 0.3% → 0.5% | 160.751 → 118.673 |
| lighting/shadow update | 0.003 → 0.003 | 0.0% → 0.0% | 7.704 → 5.072 |
| world dressing update | 0.003 → 0.010 | 0.0% → 0.1% | 22.862 → 16.893 |
| fixture driver | 0.001 → unavailable | 0.0% → unavailable | 1.496 → unavailable |
| idle | unavailable → unavailable | unavailable → unavailable | 7442.477 → 6726.924 |

Active sampled duration: 35700.272 → 18463.870 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, expedition-mTxs7weK.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, PickupSystem-DaOfTIP9.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js; after debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, PickupSystem-er_fwrFp.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js.

## freight-hold/arc/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 660.02/607.27/573.85 → 492.59/565.53/561.59 (10 cores); changed 291.34/371.17/470.73 → 330.85/367.02/461.83 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 925.100 → 541.500 |
| batched observer interval p95 ms (not game frame latency) | 2091.900 → 900.000 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.500 → 6.100 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.400 → 8.600 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 161.653 → 90.309 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 102.000 → 102.000 |
| triangles maximum | 687804.000 → 687826.000 |
| measured thread CPU total ms | 7461.623 → 6772.778 |
| thread CPU mean per actual render ms (instrumented) | 9.741 → 8.842 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 33.712 → 30.572 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2786.614 → 2786.685 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 161.653 → 90.309 | 330.968 → 188.341 | 73 → 73 | 81.740 → 81.740 | 610414.214 → 610420.491 | 2073600 → 2073600 |
| sceneColor | 149.375 → 83.602 | 325.357 → 157.472 | 73 → 73 | 79.740 → 79.740 | 610412.214 → 610418.491 | 2073600 → 2073600 |
| mainOpaque | 97.344 → 64.425 | 274.483 → 134.530 | 73 → 73 | 64.743 → 64.743 | 588455.439 → 588455.439 | 2073600 → 2073600 |
| hud | 71.637 → 42.821 | 256.698 → 131.627 | 72 → 72 | 7.671 → 7.671 | 24318.988 → 24318.988 | 2073600 → 2073600 |
| finalAA | 71.094 → 36.969 | 143.376 → 93.992 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| composite | 67.129 → 41.905 | 155.649 → 100.296 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 64.425 → 41.752 | 172.739 → 96.624 | 72 → 72 | 14.997 → 14.997 | 21956.775 → 21963.052 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 305057581 → 305057581 |
| render-target textures | 41566248 → 41566242 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.310 → 7.066 | 64.8% → 79.9% | 9818.707 → 18693.065 |
| animation mixers/skinning | 0.837 → 0.412 | 8.6% → 4.7% | 1343.739 → 1300.487 |
| UI/HUD DOM | 0.739 → 0.342 | 7.6% → 3.9% | 1081.951 → 972.714 |
| simulation step | 0.623 → 0.294 | 6.4% → 3.3% | 861.889 → 772.012 |
| VFX/telegraph batching | 0.488 → 0.291 | 5.0% → 3.3% | 879.023 → 802.596 |
| unattributed | 0.405 → 0.266 | 4.2% → 3.0% | 722.940 → 1056.429 |
| actor pose/motion | 0.259 → 0.108 | 2.7% → 1.2% | 387.874 → 275.075 |
| GC | 0.062 → 0.055 | 0.6% → 0.6% | 158.307 → 229.311 |
| world dressing update | 0.014 → 0.006 | 0.1% → 0.1% | 21.479 → 14.751 |
| lighting/shadow update | 0.005 → 0.001 | 0.0% → 0.0% | 4.613 → 1.504 |
| idle | unavailable → unavailable | unavailable → unavailable | 4747.126 → 6213.809 |

Active sampled duration: 15280.522 → 24117.944 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-DaOfTIP9.js, OriginalCreatureAnatomy-DOhHIavL.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js; after presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, PickupSystem-er_fwrFp.js, facilityGeometry-aDvEV29y.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js.

## overload-floor/breacher/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1534 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 492.59/565.53/561.59 → 630.46/587.51/570.21 (10 cores); changed 330.85/367.02/461.83 → 334.86/361.17/451.67 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 700.000 → 600.100 |
| batched observer interval p95 ms (not game frame latency) | 1449.700 → 1392.100 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.400 → 6.400 |
| GPU-audit frozen RAF CPU observer p95 ms | 8.700 → 7.900 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 139.037 → 109.543 |
| adaptive scale minimum | 0.925 → 0.900 |
| adaptive scale p50 | 0.950 → 0.925 |
| draws maximum | 123.000 → 123.000 |
| triangles maximum | 691994.000 → 691996.000 |
| measured thread CPU total ms | 6749.391 → 7432.831 |
| thread CPU mean per actual render ms (instrumented) | 8.811 → 9.703 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 29.592 → 26.438 |
| GL clears per fixed tick (includes refresh/RAF) | 19.125 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 12.750 |
| GL calls per fixed tick (includes refresh/RAF) | 3813.439 → 3816.278 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| transparentVFX | 149.835 → 123.423 | 345.335 → 234.043 | 35 → 35 | 20.598 → 20.598 | 4378.993 → 4391.424 | 1876285 → 1781353 |
| frameTotal | 139.037 → 109.543 | 257.910 → 227.646 | 36 → 36 | 103.426 → 103.426 | 635262.434 → 635274.864 | 2073600 → 2073600 |
| sceneColor | 137.230 → 118.852 | 271.450 → 235.778 | 35 → 35 | 95.426 → 95.426 | 635254.434 → 635266.864 | 1876285 → 1781353 |
| mainOpaque | 133.363 → 95.959 | 203.665 → 197.326 | 35 → 35 | 74.829 → 74.829 | 630875.441 → 630875.441 | 1876285 → 1781353 |
| hud | 121.843 → 80.576 | 191.342 → 191.029 | 35 → 35 | 7.846 → 7.846 | 24184.232 → 24184.232 | 2073600 → 2073600 |
| bloomBlurHorizontal | 109.456 → 67.138 | 184.986 → 189.150 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 117503 → 111455 |
| bloomExtract | 107.670 → 70.668 | 209.282 → 176.010 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 117503 → 111455 |
| gtao | 101.621 → 87.633 | 182.090 → 170.190 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 469336 → 445525 |
| aoDenoise | 95.869 → 71.946 | 173.505 → 147.021 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 469336 → 445525 |
| composite | 94.341 → 71.115 | 133.225 → 122.134 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 1876285 → 1781353 |
| bloomBlurVertical | 93.851 → 77.465 | 180.617 → 147.152 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 117503 → 111455 |
| finalAA | 85.799 → 72.663 | 154.507 → 119.477 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| gasDepthSnapshot | 84.156 → 68.466 | 234.640 → 152.035 | 18 → 18 | 0.000 → 0.000 | 0.000 → 0.000 | 258602 → 245648 |
| distortion | 79.184 → 69.223 | 150.591 → 120.642 | 35 → 35 | 1.000 → 1.000 | 1.000 → 1.000 | 117503 → 111455 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 325706469 → 325706469 |
| render-target textures | 61640632 → 56550448 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 7.133 → 8.105 | 81.0% → 83.5% | 22587.536 → 34679.325 |
| unattributed | 0.466 → 0.779 | 5.3% → 8.0% | 1520.982 → 2656.693 |
| animation mixers/skinning | 0.329 → 0.230 | 3.7% → 2.4% | 1088.315 → 1329.827 |
| UI/HUD DOM | 0.303 → 0.194 | 3.4% → 2.0% | 1099.122 → 936.339 |
| simulation step | 0.251 → 0.161 | 2.8% → 1.7% | 733.467 → 730.709 |
| VFX/telegraph batching | 0.227 → 0.147 | 2.6% → 1.5% | 681.777 → 781.021 |
| actor pose/motion | 0.088 → 0.054 | 1.0% → 0.6% | 297.064 → 379.584 |
| GC | 0.013 → 0.030 | 0.1% → 0.3% | 80.644 → 177.465 |
| lighting/shadow update | 0.002 → 0.000 | 0.0% → 0.0% | 4.622 → 1.532 |
| world dressing update | 0.001 → 0.004 | 0.0% → 0.0% | 1.116 → 16.750 |
| idle | unavailable → unavailable | unavailable → unavailable | 4315.031 → 9436.954 |

Active sampled duration: 28094.645 → 41689.245 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, presentation-shared-DSPhp2Lx.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-DaOfTIP9.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js; after debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, PickupSystem-er_fwrFp.js, StaticColliderParts-CNQ9HfP0.js, OriginalCreatureAnatomy-DOhHIavL.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, rigPortraits-h8XV7YY-.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js.

## overload-floor/breacher/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1534 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 630.46/587.51/570.21 → 720.64/632.83/589.79 (10 cores); changed 334.86/361.17/451.67 → 316.97/352.06/442.63 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 433.600 → 382.500 |
| batched observer interval p95 ms (not game frame latency) | 1734.700 → 733.700 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.500 → 6.200 |
| GPU-audit frozen RAF CPU observer p95 ms | 9.800 → 7.700 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 122.050 → 63.932 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 102.000 → 102.000 |
| triangles maximum | 641016.000 → 641016.000 |
| measured thread CPU total ms | 6000.476 → 6357.613 |
| thread CPU mean per actual render ms (instrumented) | 7.834 → 8.300 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 29.592 → 26.439 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2922.683 → 2922.486 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| sceneColor | 131.025 → 63.348 | 442.059 → 113.504 | 73 → 73 | 82.489 → 82.493 | 601642.984 → 601648.090 | 2073600 → 2073600 |
| frameTotal | 122.050 → 63.932 | 702.670 → 105.756 | 73 → 73 | 84.489 → 84.493 | 601644.984 → 601650.090 | 2073600 → 2073600 |
| mainOpaque | 81.673 → 62.800 | 270.402 → 127.490 | 73 → 73 | 68.914 → 68.916 | 598533.556 → 598542.416 | 2073600 → 2073600 |
| hud | 79.395 → 68.415 | 380.262 → 117.961 | 72 → 72 | 7.846 → 7.846 | 24184.230 → 24184.232 | 2073600 → 2073600 |
| composite | 53.949 → 44.838 | 120.894 → 75.331 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| finalAA | 49.035 → 45.652 | 123.894 → 76.174 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 48.716 → 38.327 | 174.115 → 65.187 | 72 → 72 | 13.575 → 13.577 | 3109.427 → 3105.674 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 306815717 → 306815717 |
| render-target textures | 49954856 → 49954850 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 5.802 → 6.924 | 74.1% → 83.4% | 12960.563 → 21904.773 |
| unattributed | 0.501 → 0.278 | 6.4% → 3.4% | 1153.109 → 1540.009 |
| animation mixers/skinning | 0.467 → 0.341 | 6.0% → 4.1% | 1117.734 → 1151.453 |
| simulation step | 0.356 → 0.234 | 4.5% → 2.8% | 772.251 → 687.685 |
| VFX/telegraph batching | 0.292 → 0.193 | 3.7% → 2.3% | 708.755 → 832.509 |
| UI/HUD DOM | 0.257 → 0.197 | 3.3% → 2.4% | 572.709 → 656.790 |
| actor pose/motion | 0.128 → 0.104 | 1.6% → 1.3% | 300.381 → 376.873 |
| GC | 0.026 → 0.023 | 0.3% → 0.3% | 100.638 → 127.192 |
| world dressing update | 0.004 → 0.003 | 0.0% → 0.0% | 5.190 → 8.497 |
| lighting/shadow update | 0.002 → 0.002 | 0.0% → 0.0% | 5.187 → 8.644 |
| idle | unavailable → unavailable | unavailable → unavailable | 4914.518 → 4254.409 |

Active sampled duration: 17696.517 → 27294.425 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, catalog-BS-Wgrcu.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, PickupSystem-DaOfTIP9.js, FacilityNavigation-DcJ0u4OS.js, facilityGeometry-aDvEV29y.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, StaticColliderParts-CNQ9HfP0.js; after index-DeffeJpW.js, debug-DkVQIwzz.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, assets-CanSENVc.js, PickupSystem-er_fwrFp.js, StaticColliderParts-CNQ9HfP0.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, facilityGeometry-aDvEV29y.js.

## overload-floor/arc/high/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1535 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 720.64/632.83/589.79 → 607.28/621.17/589.67 (10 cores); changed 316.97/352.06/442.63 → 307.34/338.81/427.89 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 751.000 → 809.000 |
| batched observer interval p95 ms (not game frame latency) | 1058.200 → 1357.200 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.500 → 6.700 |
| GPU-audit frozen RAF CPU observer p95 ms | 8.700 → 8.300 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 118.409 → 142.174 |
| adaptive scale minimum | 0.925 → 0.900 |
| adaptive scale p50 | 0.950 → 0.925 |
| draws maximum | 112.000 → 112.000 |
| triangles maximum | 666718.000 → 666718.000 |
| measured thread CPU total ms | 6245.100 → 6883.680 |
| thread CPU mean per actual render ms (instrumented) | 8.153 → 8.987 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 35.296 → 32.128 |
| GL clears per fixed tick (includes refresh/RAF) | 19.125 → 6.375 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 12.750 |
| GL calls per fixed tick (includes refresh/RAF) | 3586.043 → 3586.675 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| sceneColor | 122.461 → 166.592 | 262.372 → 294.086 | 39 → 39 | 90.746 → 90.742 | 621242.612 → 621244.863 | 1876480 → 1779037 |
| frameTotal | 118.409 → 142.174 | 204.208 → 261.293 | 39 → 40 | 98.746 → 98.742 | 621250.612 → 621252.863 | 2073600 → 2073600 |
| mainOpaque | 113.884 → 105.752 | 230.257 → 195.157 | 39 → 39 | 68.256 → 68.259 | 596439.838 → 596474.225 | 1876480 → 1779037 |
| hud | 100.069 → 95.281 | 180.722 → 208.650 | 39 → 39 | 7.488 → 7.489 | 24327.774 → 24327.798 | 2073600 → 2073600 |
| bloomExtract | 80.384 → 76.784 | 163.814 → 192.681 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 117515 → 111307 |
| bloomBlurHorizontal | 77.391 → 75.914 | 179.878 → 214.607 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 117515 → 111307 |
| gtao | 75.689 → 74.113 | 150.228 → 159.001 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 469385 → 444946 |
| finalAA | 70.033 → 73.897 | 204.037 → 157.271 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| transparentVFX | 66.249 → 66.167 | 188.755 → 158.023 | 39 → 39 | 22.490 → 22.483 | 24802.774 → 24770.637 | 1876480 → 1779037 |
| bloomBlurVertical | 65.282 → 76.769 | 175.354 → 214.007 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 117515 → 111307 |
| aoDenoise | 61.005 → 72.378 | 146.444 → 155.948 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 469385 → 444946 |
| distortion | 60.239 → 71.735 | 140.597 → 190.985 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 117515 → 111307 |
| composite | 56.822 → 71.245 | 132.708 → 159.798 | 39 → 39 | 1.000 → 1.000 | 1.000 → 1.000 | 1876480 → 1779037 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 325690085 → 325690085 |
| render-target textures | 61766272 → 56803168 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.883 → 8.154 | 84.4% → 90.7% | 25201.741 → 36500.975 |
| unattributed | 0.347 → 0.135 | 4.3% → 1.5% | 1505.832 → 1117.807 |
| animation mixers/skinning | 0.264 → 0.217 | 3.2% → 2.4% | 1073.095 → 1183.152 |
| simulation step | 0.235 → 0.161 | 2.9% → 1.8% | 776.859 → 813.284 |
| VFX/telegraph batching | 0.181 → 0.116 | 2.2% → 1.3% | 693.256 → 588.418 |
| UI/HUD DOM | 0.158 → 0.135 | 1.9% → 1.5% | 679.953 → 713.913 |
| actor pose/motion | 0.061 → 0.055 | 0.8% → 0.6% | 232.496 → 326.046 |
| GC | 0.019 → 0.009 | 0.2% → 0.1% | 97.979 → 62.093 |
| lighting/shadow update | 0.004 → 0.002 | 0.0% → 0.0% | 9.389 → 10.898 |
| world dressing update | 0.002 → 0.002 | 0.0% → 0.0% | 4.520 → 8.433 |
| idle | unavailable → unavailable | unavailable → unavailable | 6805.047 → 6458.607 |

Active sampled duration: 30275.120 → 41325.019 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before debug-DkVQIwzz.js, DepthRenderer-CAaA-2E0.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, index-CH45HxKO.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, PickupSystem-DaOfTIP9.js, OriginalCreatureAnatomy-DOhHIavL.js, StaticColliderParts-CNQ9HfP0.js, assets-CanSENVc.js, rigPortraits-h8XV7YY-.js; after AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, DeferredRagdolls-lKG9qDcl.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-er_fwrFp.js, DeathRagdolls-MgqYw7Ni.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js.

## overload-floor/arc/low/0

CPU phase: before CPU-only, pass/count probes and timers disabled (360 fixed ticks); after CPU-only, pass/count probes and timers disabled (360 fixed ticks).

before audit version: 2; denominator: 1533 actual submissions.

after audit version: 2; denominator: 1533 actual submissions.

Host load (1/5/15 minute) before trial → after trial: baseline 607.28/621.17/589.67 → 584.61/612.30/588.15 (10 cores); changed 307.34/338.81/427.89 → 328.00/339.39/422.06 (10 cores).

| Observed metric | before → after |
| --- | ---: |
| batched observer interval p50 ms (not game frame latency) | 358.400 → 491.500 |
| batched observer interval p95 ms (not game frame latency) | 675.400 → 741.700 |
| GPU-audit frozen RAF CPU observer p50 ms | 6.000 → 6.300 |
| GPU-audit frozen RAF CPU observer p95 ms | 8.900 → 9.500 |
| UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback) | 67.239 → 94.462 |
| adaptive scale minimum | 1.000 → 1.000 |
| adaptive scale p50 | 1.000 → 1.000 |
| draws maximum | 95.000 → 95.000 |
| triangles maximum | 645566.000 → 645566.000 |
| measured thread CPU total ms | 6100.732 → 6132.957 |
| thread CPU mean per actual render ms (instrumented) | 7.964 → 8.006 |
| mid-combat program creations | 0 → 0 |
| CSS style setters per fixed tick (includes refresh/RAF) | 35.281 → 32.126 |
| GL clears per fixed tick (includes refresh/RAF) | 6.375 → 2.125 |
| GL invalidates per fixed tick (includes refresh/RAF) | unavailable → 4.250 |
| GL calls per fixed tick (includes refresh/RAF) | 2783.643 → 2783.381 |

| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frameTotal | 67.239 → 94.462 | 123.568 → 219.501 | 73 → 73 | 81.691 → 81.691 | 602125.611 → 602125.736 | 2073600 → 2073600 |
| sceneColor | 55.313 → 105.243 | 138.048 → 258.789 | 73 → 73 | 79.691 → 79.691 | 602123.611 → 602123.736 | 2073600 → 2073600 |
| mainOpaque | 38.136 → 61.151 | 95.757 → 127.998 | 73 → 73 | 64.256 → 64.256 | 580199.838 → 580199.838 | 2073600 → 2073600 |
| finalAA | 33.728 → 39.029 | 73.352 → 105.802 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| composite | 31.773 → 39.094 | 65.416 → 94.992 | 72 → 72 | 1.000 → 1.000 | 1.000 → 1.000 | 2073600 → 2073600 |
| hud | 31.478 → 70.569 | 102.495 → 156.046 | 72 → 72 | 7.488 → 7.488 | 24327.774 → 24327.774 | 2073600 → 2073600 |
| transparentVFX | 25.456 → 36.931 | 68.332 → 98.739 | 72 → 72 | 15.436 → 15.436 | 21923.773 → 21923.898 | 2073600 → 2073600 |

| Estimated memory | bytes before → after |
| --- | ---: |
| scene textures | 306815717 → 306815717 |
| render-target textures | 49954856 → 49954850 |
| renderbuffers | 0 → 0 |

Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.

| CPU subsystem | estimated CPU ms/render before → after | exclusive active sample share before → after | raw sampled wall ms before → after |
| --- | ---: | ---: | ---: |
| renderer submission/probes | 6.023 → 6.091 | 75.6% → 76.1% | 13497.112 → 14731.234 |
| unattributed | 0.609 → 0.523 | 7.6% → 6.5% | 1753.157 → 1539.553 |
| animation mixers/skinning | 0.440 → 0.464 | 5.5% → 5.8% | 1233.762 → 1221.070 |
| simulation step | 0.336 → 0.332 | 4.2% → 4.2% | 883.286 → 726.314 |
| UI/HUD DOM | 0.245 → 0.267 | 3.1% → 3.3% | 680.674 → 682.801 |
| VFX/telegraph batching | 0.161 → 0.181 | 2.0% → 2.3% | 405.243 → 452.462 |
| actor pose/motion | 0.110 → 0.114 | 1.4% → 1.4% | 231.180 → 268.060 |
| GC | 0.037 → 0.025 | 0.5% → 0.3% | 145.170 → 137.540 |
| world dressing update | 0.002 → 0.004 | 0.0% → 0.1% | 7.450 → 11.194 |
| lighting/shadow update | 0.001 → 0.005 | 0.0% → 0.1% | 1.528 → 8.810 |
| idle | unavailable → unavailable | unavailable → unavailable | 5609.845 → 3204.361 |

Active sampled duration: 18838.562 → 19779.038 ms. Idle remains separately visible; unknown samples are retained as unattributed.

Source maps resolved: before AudioSystem-g3SHKf5y.js, debug-DkVQIwzz.js, index-CH45HxKO.js, expedition-mTxs7weK.js, DepthRenderer-CAaA-2E0.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, FacilityNavigation-DcJ0u4OS.js, OriginalCreatureAnatomy-DOhHIavL.js, PickupSystem-DaOfTIP9.js, DeferredRagdolls-lKG9qDcl.js, DeathRagdolls-MgqYw7Ni.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js; after debug-DkVQIwzz.js, index-DeffeJpW.js, expedition-mTxs7weK.js, AudioSystem-g3SHKf5y.js, DepthRenderer-D8JGnmx1.js, AbilityVisuals-WfopSGEM.js, presentation-shared-DSPhp2Lx.js, catalog-BS-Wgrcu.js, PickupSystem-er_fwrFp.js, OriginalCreatureAnatomy-DOhHIavL.js, DeathRagdolls-MgqYw7Ni.js, DeferredRagdolls-lKG9qDcl.js, StaticColliderParts-CNQ9HfP0.js, rigPortraits-h8XV7YY-.js, FacilityNavigation-DcJ0u4OS.js.
