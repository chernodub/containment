# PERF14 room preparation and frame budget

## Room preparation

The baseline was `8cc571fb56f283db17cbe50b07dfe8a5370ee6a4` and the final runtime was `62aa8e04`. The hardware Chromium audit ran at 1920×1080, seed 1729, through all twenty story rooms. Each cold row starts on a fresh page after title readiness. The warm rows revisit every room on the same renderer after one complete traversal. The hold measures the debug route through its first refresh. Start and end load are one-minute averages on ten logical cores.


Median cold hold was **1.283 → 1.266 s** and median warm hold was **1.325 → 1.037 s**. The longest cold holds were containment-annulus at 2.972 s (load 43.2–42.1) and shielding-gate at 2.437 s (load 30.6–30.6). The longest warm holds were containment-annulus at 2.524 s (load 50.5–53.4) and awakening-bay at 1.848 s (load 23.9–22.8). The final audit recorded 0 combat program creations. The preparation-only build `638316f8` previously measured 2.170 s in its worst cold room. The earlier 6.060 s Manual campaign hold used a different route and workload.


| Room | Cold hold ms before → after | Cold load start–end, before / after | Revisit hold ms before → after | Revisit load start–end, before / after |
| --- | ---: | --- | ---: | --- |
| awakening-bay | 2011 → 1952 | 32.0–31.5 / 27.4–30.7 | 2023 → 1848 | 56.1–56.1 / 23.9–22.8 |
| passenger-vault | 1472 → 1425 | 33.9–33.9 / 30.7–34.0 | 1372 → 1160 | 56.1–56.1 / 22.8–22.8 |
| residential-gallery | 907 → 903 | 34.9–34.9 / 34.8–34.8 | 856 → 936 | 56.1–56.1 / 22.8–22.8 |
| communal-atrium | 1263 → 1298 | 40.6–40.6 / 37.0–37.0 | 1007 → 983 | 56.1–54.4 / 22.8–22.8 |
| crew-checkpoint | 1193 → 932 | 39.3–42.0 / 35.9–35.9 | 1356 → 1032 | 54.4–54.4 / 22.8–24.3 |
| armory | 1170 → 1234 | 41.4–41.4 / 35.3–35.3 | 1319 → 1026 | 54.4–54.4 / 24.3–24.3 |
| freight-hold | 1138 → 1180 | 43.4–43.4 / 34.4–34.4 | 1338 → 934 | 54.4–53.0 / 24.3–24.3 |
| breached-loading-bay | 1376 → 1547 | 41.9–41.9 / 34.3–34.2 | 1319 → 1044 | 53.0–53.0 / 24.3–24.3 |
| relay-racks | 961 → 958 | 49.0–49.0 / 32.5–32.5 | 1187 → 1002 | 53.0–53.0 / 24.3–23.1 |
| transmission-chamber | 1377 → 1323 | 48.0–47.6 / 31.1–31.1 | 1570 → 1224 | 53.0–53.0 / 23.1–23.1 |
| diagnostic-gallery | 961 → 930 | 47.1–47.1 / 31.8–31.8 | 1184 → 946 | 53.0–52.5 / 23.1–23.1 |
| safety-interlock-station | 1378 → 1299 | 47.3–47.3 / 30.5–30.5 | 1332 → 1112 | 52.5–52.5 / 23.1–23.1 |
| coolant-plant | 893 → 908 | 45.7–45.7 / 30.1–29.0 | 1432 → 877 | 52.5–52.5 / 23.1–23.1 |
| service-shaft-landing | 1136 → 957 | 47.0–47.3 / 29.0–28.6 | 1188 → 954 | 52.5–52.5 / 23.1–22.8 |
| infested-workshop | 1302 → 1219 | 47.3–46.7 / 29.8–29.8 | 1112 → 838 | 52.5–50.5 / 22.8–22.8 |
| swarm-junction | 1062 → 1068 | 45.2–45.2 / 30.1–30.1 | 1381 → 1042 | 50.5–50.5 / 22.8–22.8 |
| shielding-gate | 1999 → 2437 | 43.6–43.6 / 30.6–30.6 | 1333 → 1148 | 50.5–50.5 / 22.8–22.8 |
| containment-annulus | 2972 → 2066 | 43.2–42.1 / 30.6–29.8 | 2524 → 1577 | 50.5–53.4 / 22.8–21.8 |
| manual-control-chamber | 1418 → 1409 | 43.8–43.8 / 30.2–30.2 | 885 → 1145 | 53.4–53.4 / 21.8–21.8 |
| overload-floor | 1989 → 1743 | 42.3–45.9 / 29.7–29.7 | 1279 → 1177 | 53.4–53.4 / 21.8–21.8 |

The cut pass precomputes clip planes and avoids polygon allocations when a polygon lies strictly on one side. Coincident and split polygons take the existing clipping path. Emissive component queries are shared by immutable source geometry. Repeated quality application skips index copies when the tier already matches. The irradiance cache reuses CPU pixels on revisit while each room still owns its texture. Its source key includes the pool, service and exit inputs. The room asset cache already retained GLB and transcoded models. A bounded idle prefetch now transfers one next-room GLB at a time during play and hands the bytes to the same loader. Parsing and GPU work still run under the preparation hold. The fixture skips most natural combat idle time, so it cannot isolate the benefit of that prefetch. Median deck irradiance setup was 107.8 ms cold and 0.0 ms on revisit in the final audit. Containment Annulus improved from 2.972 s (load1m 43.2–42.1) to 2.066 s (30.6–29.8) and still spent 731 ms on interior cuts. Shielding Gate's 2.437 s cold hold included 1.108 s of program polling at load1m 30.6. The warmup path continues to use prepared native shader families with two bounded scene renders. Its measured shader polling time includes scheduler delays.

Phase pairs are cold / revisit in milliseconds on the final runtime. Fetch, parse and KTX2 phases sum over parallel pack loads. KTX2 loading includes worker setup and overlaps GLB parsing. Warm draw includes shadow work and buffer initialization. The first scene/post submission is a CPU measurement. A dash indicates no recorded operation. Load for these same holds appears in the preceding table.

| Room | Owner wait | Pack fetch | GLB parse | KTX2 | Static + kit merge | Dressing + cuts | Deck irradiance | Reflection | Compile submission + wait | Warm draw | Shadow atlas | Texture upload | First scene/post |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| awakening-bay | 874 / 672 | 446 / — | 756 / — | — / — | 46 / 44 | 518 / 513 | 103 / 0 | 331 / 306 | 86 / 35 | 20 / 6 | 14 / 2 | 0 / 0 | 3 / 2 |
| passenger-vault | 733 / 491 | 277 / — | 474 / — | — / — | 43 / 33 | 392 / 352 | 96 / 0 | 270 / 246 | 91 / 16 | 15 / 6 | 10 / 2 | 0 / 0 | 2 / 2 |
| residential-gallery | 332 / 93 | 125 / — | 1001 / — | — / — | 59 / 52 | 38 / 22 | 123 / 0 | 185 / 497 | 82 / 20 | 17 / 5 | 11 / 1 | 0 / 0 | 2 / 2 |
| communal-atrium | 481 / 222 | 125 / — | 994 / — | — / — | 39 / 36 | 146 / 125 | 133 / 0 | 292 / 310 | 116 / 18 | 21 / 6 | 13 / 2 | 0 / 0 | 3 / 2 |
| crew-checkpoint | 353 / 91 | 123 / — | 1101 / — | — / — | 63 / 53 | 36 / 22 | 141 / 0 | 184 / 590 | 91 / 17 | 17 / 5 | 10 / 2 | 0 / 0 | 2 / 2 |
| armory | 570 / 181 | 178 / — | 1651 / — | — / — | 65 / 49 | 146 / 128 | 229 / 0 | 187 / 385 | 82 / 18 | 17 / 6 | 11 / 3 | 0 / 0 | 3 / 3 |
| freight-hold | 567 / 211 | 379 / — | 1000 / — | 105 / — | 84 / 70 | 180 / 139 | 70 / 0 | 198 / 308 | 98 / 17 | 16 / 5 | 10 / 2 | 0 / 0 | 2 / 2 |
| breached-loading-bay | 786 / 252 | 472 / — | 1065 / — | 309 / — | 67 / 50 | 278 / 193 | 96 / 0 | 206 / 201 | 74 / 19 | 16 / 6 | 9 / 2 | 0 / 0 | 2 / 2 |
| relay-racks | 373 / 139 | 222 / — | 1212 / — | — / — | 58 / 52 | 100 / 70 | 101 / 0 | 183 / 450 | 89 / 18 | 21 / 6 | 13 / 2 | 0 / 0 | 3 / 2 |
| transmission-chamber | 651 / 362 | 278 / — | 1373 / — | — / — | 104 / 106 | 313 / 308 | 140 / 0 | 198 / 193 | 80 / 19 | 15 / 6 | 10 / 2 | 0 / 0 | 2 / 2 |
| diagnostic-gallery | 332 / 114 | 96 / — | 758 / — | — / — | 67 / 69 | 44 / 29 | 121 / 0 | 198 / 414 | 85 / 16 | 20 / 6 | 13 / 2 | 0 / 0 | 2 / 2 |
| safety-interlock-station | 554 / 283 | 137 / — | 1037 / — | — / — | 83 / 80 | 245 / 213 | 136 / 0 | 213 / 256 | 89 / 22 | 20 / 5 | 15 / 3 | 0 / 0 | 4 / 3 |
| coolant-plant | 356 / 107 | 199 / — | 1156 / — | — / — | 55 / 47 | 66 / 29 | 112 / 0 | 176 / 411 | 81 / 18 | 18 / 4 | 11 / 1 | 0 / 0 | 2 / 2 |
| service-shaft-landing | 367 / 134 | 328 / — | 1179 / — | — / — | 44 / 40 | 96 / 85 | 98 / 0 | 189 / 389 | 82 / 18 | 16 / 5 | 10 / 2 | 0 / 0 | 3 / 2 |
| infested-workshop | 577 / 248 | 504 / — | 1131 / — | 68 / — | 134 / 120 | 146 / 110 | 103 / 0 | 205 / 183 | 104 / 18 | 17 / 6 | 11 / 3 | 0 / 0 | 4 / 2 |
| swarm-junction | 507 / 151 | 124 / — | 751 / — | 231 / — | 129 / 106 | 93 / 39 | 92 / 0 | 213 / 532 | 79 / 16 | 16 / 6 | 10 / 4 | 0 / 0 | 3 / 3 |
| shielding-gate | 686 / 400 | 460 / — | 1773 / — | 119 / — | 151 / 68 | 255 / 303 | 153 / 0 | 234 / 272 | 1146 / 22 | 21 / 6 | 15 / 2 | 0 / 0 | 3 / 3 |
| containment-annulus | 1308 / 763 | 531 / — | 1571 / — | 76 / — | 247 / 244 | 733 / 509 | 127 / 0 | 269 / 242 | 125 / 19 | 17 / 6 | 10 / 2 | 0 / 0 | 3 / 2 |
| manual-control-chamber | 488 / 175 | 319 / — | 981 / — | 115 / — | 94 / 78 | 149 / 80 | 60 / 0 | 284 / 530 | 301 / 23 | 38 / 7 | 31 / 4 | 0 / 0 | 3 / 4 |
| overload-floor | 687 / 350 | 541 / — | 689 / — | 74 / — | 94 / 87 | 324 / 253 | 85 / 0 | 238 / 249 | 380 / 19 | 35 / 6 | 28 / 2 | 0 / 0 | 3 / 2 |

[Cold baseline](../../artifacts/nextgen/perf14-final/rooms-before.json) · [Revisit baseline](../../artifacts/nextgen/perf14-final/rooms-before-revisit.json) · [Preparation-only comparison](../../artifacts/nextgen/perf14-final/rooms-after.json) · [Final room audit](../../artifacts/nextgen/perf14-final/rooms-final.json)

## Renderer and presentation changes

- Room-value pools now use four individually cached vec4 uniforms. Three's uniform-array setter always flattens the values and calls WebGL on upload, even if every element matches the last submission. The individual vec4 setters compare the four components with the program's last values. Shaders skip the static falloff calculation when the perimeter is 1. The four pool profiles, exit falloff, and marine and landmark lighting use the existing values and equations.
- The hostile priority mask still rasterizes actors, telegraphs and active ground pools at 128×72. It shares each stamp's horizontal distance terms across rows and submits a texture update only when the quantized bytes change. The mask uses CPU rasterization and has no standalone draw pass.
- The framing path packs only weighted joint influences and computes camera-relative transforms only for referenced bones. It keeps the same vertex order, accumulation order and camera-depth bins. Enemy health bars project and write their buffers once against the final camera, down from two projections and writes per frame.
- Corpse fitting reads the source vertex and rank mask once per vertex. The existing six/three ragdoll limits are joined by 100/50-body limits for High/Low, down from theoretical maxima of 120/60. Quiet offscreen bodies at least 1.5 seconds old and beyond 14 m can retire to the existing support-aware settled pose before the six-second timeout. The velocity and spin limits for that early path are 0.18 m/s and 0.30 rad/s.
- HUD ability labels, charge markers and custom properties skip unchanged DOM writes. Low skips disabled distortion updates and projection setup for contact AO. High GTAO skips unused contact-AO matrices outside warmup. The presets retain their existing lighting, silhouette and accessibility behavior.

## Integration requests

The simulation owns encounter scripts, target eligibility and role AI. The CPU profile should retain their real callbacks and geometric queries. An integration follow-up can investigate reusing visibility and topology inputs between callers that observe the same simulation step. Any reuse needs to preserve spawn ordering, the authoritative update cadence, and invalidation after movement or geometry revisions. Exclusive source samples in the Manual and Overload Arc/High baseline segments respectively apportioned about 0.076 and 0.112 ms per fixed tick to the enemy system and engagement modules, and 0.001 and 0.003 ms to the encounter director and authored encounter sources. The two geometry sources accounted for 0.171 and 0.307 ms per tick. These estimates exclude callees attributed to other sources. Load1m was 164.2–122.8 in Manual and 50.9–50.0 in Overload on ten logical cores. Final exclusive samples apportioned 0.149 and 0.263 ms per tick to enemy system and engagement, and 0.006 and 0.003 ms to encounter sources, at respective loads 29.6–27.8 and 36.9–34.7. Geometry remained the larger category in both.

## Visual and lifecycle verification

The production type check and build passed. The deterministic desktop combat capture pairs in Coolant Plant, Crew Checkpoint and Relay Racks were opened at 1920×1080 and 480×270. The native images differed in six, five and one pixels respectively, with all channel deltas below eight on the 8-bit scale. The 480×270 images were pixel-identical. The final build passed both the ink/tier switching fixture and the WebGL loss/restoration fixture.

The first after-capture attempt reported an aborted speculative GLB transfer during a page reload. The capture harness now stops idle scheduling and awaits the active transfer before reloading. The capture rerun on `62aa8e04` recorded zero request errors.

[Before captures](../../artifacts/nextgen/perf14-final/capture-before/index.html) · [After captures](../../artifacts/nextgen/perf14-final/capture-after/index.html) · [Pixel comparison](../../artifacts/nextgen/perf14-final/capture-pixel-deltas.json) · [Tier switch and recovery](../../artifacts/nextgen/perf14-final/recovery/index.html)


## Realtime frame budget

Both hardware realtime matrices ran at 1920×1080 with the same six rooms, Breacher and Arc, High and Low, and two 12-second repeats. Each trial starts at 25 legal native enemies, replenishes through native spawn rules, and exercises all four ability slots. Frame percentiles pool both repeats after discarding the first interval in each repeat. CPU includes update, render submission, HUD synchronization and the fixture driver. Load ranges include both endpoints of both repeats on 10 logical cores. The before build uses `8cc571fb` and the final runtime uses `62aa8e04`.

The final High cohort met both timing targets in **0/12** of the pooled configurations. High p50 was 33.0–41.4 → 16.9–33.0 ms and p95 was 51.0–82.0 → 41.4–58.9 ms. Low p95 was 33.6–42.1 → 24.8–34.6 ms. The final High minimum scale was 0.9. Peak sampled draws were 223 → 220 with 0 → 0 combat compiles. Load1m was 21.5–57.1 before and 18.5–36.6 after, so timing differences combine renderer changes with a different contention window. Low had a lower p95 than High in all 12 matched room/rig configurations. All 24 final Low trials retained an unallocated detached soft-depth target. The Low switch capture retains the marine silhouette, the cyan bay and its spill, deck boundaries and HUD numerals.

| Room / rig / tier | Frame p50/p95 ms | CPU p95 ms | Peak draws | Minimum scale | Load1m range |
| --- | ---: | ---: | ---: | ---: | ---: |
| coolant-plant / breacher / high | 40.7/65.4 → 16.9/41.4 | 24.9 → 17.8 | 138 → 137 | 0.900 → 0.900 | 50.0–57.1 → 30.7–34.6 |
| coolant-plant / breacher / low | 24.2/42.1 → 16.8/33.5 | 19.6 → 17.2 | 124 → 123 | 1.000 → 1.000 | 40.9–55.5 → 24.2–30.7 |
| coolant-plant / arc / high | 34.3/58.8 → 33.0/49.9 | 16.4 → 15.4 | 149 → 150 | 0.900 → 0.900 | 36.6–40.9 → 20.4–24.2 |
| coolant-plant / arc / low | 24.1/41.4 → 17.0/33.7 | 11.1 → 11.1 | 139 → 139 | 1.000 → 1.000 | 36.6–40.9 → 20.4–25.0 |
| crew-checkpoint / breacher / high | 41.4/66.5 → 26.6/58.2 | 33.8 → 27.9 | 132 → 134 | 0.900 → 0.900 | 34.3–40.7 → 23.8–25.4 |
| crew-checkpoint / breacher / low | 24.7/41.6 → 16.8/34.6 | 19.2 → 19.8 | 118 → 121 | 1.000 → 1.000 | 33.3–38.7 → 19.0–23.8 |
| crew-checkpoint / arc / high | 34.8/58.7 → 32.9/50.2 | 25.5 → 24.6 | 149 → 150 | 0.900 → 0.900 | 28.8–33.3 → 19.0–25.2 |
| crew-checkpoint / arc / low | 24.6/41.5 → 16.8/33.6 | 20.4 → 17.1 | 139 → 139 | 1.000 → 1.000 | 28.9–35.3 → 25.2–32.3 |
| relay-racks / breacher / high | 35.1/82.0 → 32.1/58.9 | 29.7 → 25.6 | 140 → 146 | 0.900 → 0.900 | 28.3–36.0 → 24.5–31.6 |
| relay-racks / breacher / low | 24.2/41.7 → 16.8/34.0 | 17.4 → 15.4 | 133 → 133 | 1.000 → 1.000 | 22.3–28.3 → 21.1–24.5 |
| relay-racks / arc / high | 33.6/66.2 → 26.5/51.1 | 19.9 → 17.4 | 152 → 161 | 0.900 → 0.900 | 22.3–49.6 → 21.3–22.4 |
| relay-racks / arc / low | 23.4/41.7 → 16.8/33.6 | 17.2 → 15.1 | 140 → 150 | 1.000 → 1.000 | 46.2–50.9 → 19.1–21.4 |
| swarm-junction / breacher / high | 33.6/56.7 → 25.4/41.9 | 28.2 → 20.2 | 121 → 115 | 0.900 → 0.900 | 35.6–46.2 → 20.1–23.4 |
| swarm-junction / breacher / low | 17.0/33.7 → 16.7/24.8 | 16.5 → 13.4 | 105 → 101 | 1.000 → 1.000 | 29.5–35.6 → 18.6–23.4 |
| swarm-junction / arc / high | 33.6/51.0 → 25.1/41.5 | 15.7 → 14.1 | 135 → 134 | 0.900 → 0.900 | 24.6–29.5 → 18.5–29.4 |
| swarm-junction / arc / low | 18.1/33.6 → 16.7/25.8 | 11.7 → 13.1 | 122 → 124 | 1.000 → 1.000 | 29.4–29.9 → 23.2–29.4 |
| manual-control-chamber / breacher / high | 33.3/67.1 → 25.9/50.5 | 58.2 → 28.0 | 215 → 213 | 0.900 → 0.900 | 23.8–29.8 → 21.4–23.5 |
| manual-control-chamber / breacher / low | 17.7/34.1 → 16.7/25.8 | 20.3 → 17.4 | 198 → 200 | 1.000 → 1.000 | 23.8–35.7 → 21.4–25.4 |
| manual-control-chamber / arc / high | 33.0/57.4 → 25.6/42.5 | 21.5 → 19.8 | 223 → 220 | 0.900 → 0.900 | 28.7–35.7 → 23.2–24.6 |
| manual-control-chamber / arc / low | 17.2/33.8 → 16.7/33.0 | 17.3 → 14.4 | 216 → 211 | 1.000 → 1.000 | 23.1–28.7 → 22.5–24.6 |
| overload-floor / breacher / high | 33.9/59.5 → 25.1/56.9 | 31.3 → 30.6 | 147 → 151 | 0.900 → 0.900 | 21.5–23.1 → 19.6–27.2 |
| overload-floor / breacher / low | 24.5/41.9 → 16.8/33.5 | 24.0 → 22.5 | 130 → 129 | 1.000 → 1.000 | 21.5–30.1 → 27.2–36.6 |
| overload-floor / arc / high | 33.9/51.5 → 26.1/49.9 | 23.7 → 23.5 | 165 → 165 | 0.900 → 0.900 | 23.0–30.1 → 20.9–30.3 |
| overload-floor / arc / low | 24.5/41.6 → 16.9/33.8 | 14.1 → 20.1 | 152 → 148 | 1.000 → 1.000 | 22.5–23.0 → 20.9–22.3 |

[Before realtime trials](../../artifacts/nextgen/perf14-final/realtime-before/benchmark.json) · [After realtime trials](../../artifacts/nextgen/perf14-final/realtime-after/benchmark.json)

## Native Arc Story campaign

The unassisted competent bot completed all 20 rooms on seed 1729. It rendered every fixed tick and recorded zero runtime errors, zero load-time flags and zero other defects. It ran for 2,981.1 wall seconds at load1m 20.1–24.6 from start to finish on ten logical cores. The median of 20 observed holds was 1.554 s, just above the 1.5 s typical target. The longest was 2.656 s in Communal Atrium at load1m 24.8. Manual Control Chamber held for 1.015 s at load1m 22.3–21.2. These are the runner's observed holds along the actual story route. The cold and revisit table measures fixture-route readiness separately.

[Campaign report](../../artifacts/nextgen/perf14-final/campaign/report.json) · [Campaign screenshots and trace](../../artifacts/nextgen/perf14-final/campaign/index.html)


## Deterministic breakdown

Each version ran 48 profiled trials on the same six rooms and two rigs at fixed 1920×1080, both tiers and two repeats. Each trial advanced 360 native ticks. The reference for this comparison is source-mapped preparation commit `638316f8` and the final runtime is `62aa8e04`. CPU means use measured CDP ThreadTime divided by actual render submissions. The subsystem means apportion measured thread time by exclusive active sample share. The operation counters accumulate between observer samples, including fixture refreshes and batches of fixed ticks. Fixed-step wall intervals and raw GPU queries carry fixture scheduling and device contention.

Across the matched trials, the mean of trial p50 counts for vec4-array uploads was **1625 → 147** per sampled batch (91.0% fewer). Total uniform API calls were 14640 → 13172, GL state setter calls 9468 → 9468, and inline CSS setters 211 → 188. Peak draws in frames covered by the GPU pass count probe, including HUD, were 213 → 213. The mean of sampled batch medians for scene skinned submissions was 549 → 549, with 34 → 34 in the HUD pass. The reported counts include repeated submissions of the same actor within the probe interval. Load1m was 30.6–319.7 before and 14.3–40.7 after on ten logical cores. Aggregate thread CPU/render was 9.47 → 9.08 ms.

Transparent and transmissive sorts remained small at the probe's timer precision. The mask change can avoid an upload of the 9,216-byte raster when all its bytes match. The shader change removes repeated array flattening and uploads in native Three programs. Absolute GPU intervals overlapped and included scheduling waits, so they do not isolate the fragment cost of the pool equation itself. A baked approximation would also need equivalent sampling across walls, actors and deck shaders. The build continues to compute the authored profile analytically where it contributes falloff.

| Room / rig / tier | Thread CPU ms/render | Driver GL uniforms p50 | Vec4 array uploads p50 | Transparent sort p95 ms | Load1m range |
| --- | ---: | ---: | ---: | ---: | ---: |
| coolant-plant / breacher / high | 9.59 → 9.81 | 16112 → 14539 | 1706 → 153 | 0.30 → 0.30 | 32.9–42.9 → 19.9–22.4 |
| coolant-plant / breacher / low | 8.59 → 8.32 | 11256 → 9683 | 1689 → 153 | 0.30 → 0.20 | 32.9–48.0 → 17.2–19.9 |
| coolant-plant / arc / high | 11.09 → 10.22 | 15815 → 14296 | 1670 → 153 | 0.30 → 0.30 | 30.6–48.0 → 17.3–23.6 |
| coolant-plant / arc / low | 9.73 → 8.76 | 10968 → 9466 | 1666 → 153 | 0.30 → 0.30 | 30.6–41.9 → 19.2–24.4 |
| crew-checkpoint / breacher / high | 11.06 → 10.55 | 17385 → 15927 | 1643 → 153 | 0.30 → 0.20 | 40.5–44.4 → 20.6–24.4 |
| crew-checkpoint / breacher / low | 8.96 → 8.77 | 11658 → 10211 | 1627 → 153 | 0.20 → 0.20 | 40.5–103.1 → 24.0–24.3 |
| crew-checkpoint / arc / high | 10.15 → 10.17 | 16731 → 15303 | 1530 → 153 | 0.30 → 0.30 | 39.7–84.0 → 20.5–33.9 |
| crew-checkpoint / arc / low | 8.98 → 8.52 | 11514 → 10086 | 1530 → 153 | 0.30 → 0.30 | 39.7–43.5 → 26.7–33.9 |
| relay-racks / breacher / high | 9.36 → 9.09 | 17375 → 15879 | 1702 → 153 | 0.30 → 0.20 | 35.3–56.7 → 18.0–26.7 |
| relay-racks / breacher / low | 8.02 → 7.83 | 11175 → 9650 | 1685 → 153 | 0.20 → 0.20 | 47.0–56.7 → 16.0–18.0 |
| relay-racks / arc / high | 9.43 → 8.67 | 17307 → 15959 | 1598 → 153 | 0.30 → 0.30 | 46.0–55.5 → 14.3–19.4 |
| relay-racks / arc / low | 7.80 → 8.11 | 10962 → 9584 | 1598 → 153 | 0.30 → 0.30 | 55.5–72.4 → 14.3–24.9 |
| swarm-junction / breacher / high | 8.97 → 8.77 | 15800 → 14584 | 1326 → 136 | 0.30 → 0.20 | 68.2–77.3 → 24.9–40.7 |
| swarm-junction / breacher / low | 8.14 → 7.84 | 9792 → 8646 | 1319 → 136 | 0.20 → 0.20 | 77.3–93.9 → 37.1–39.9 |
| swarm-junction / arc / high | 9.68 → 8.94 | 16073 → 14900 | 1308 → 136 | 0.30 → 0.30 | 75.8–93.9 → 32.2–39.0 |
| swarm-junction / arc / low | 8.43 → 7.86 | 10454 → 9272 | 1303 → 136 | 0.30 → 0.20 | 59.7–86.0 → 31.5–32.5 |
| manual-control-chamber / breacher / high | 11.42 → 11.31 | 19792 → 18042 | 1944 → 153 | 0.30 → 0.20 | 59.7–319.7 → 32.3–36.1 |
| manual-control-chamber / breacher / low | 9.54 → 9.21 | 14158 → 12390 | 1885 → 119 | 0.20 → 0.20 | 164.2–319.7 → 29.6–38.0 |
| manual-control-chamber / arc / high | 10.05 → 9.76 | 20131 → 18478 | 1802 → 153 | 0.30 → 0.30 | 100.6–164.2 → 27.8–29.6 |
| manual-control-chamber / arc / low | 9.07 → 8.52 | 14345 → 12660 | 1768 → 119 | 0.30 → 0.20 | 74.3–100.6 → 23.9–29.0 |
| overload-floor / breacher / high | 11.12 → 10.83 | 19242 → 17631 | 1755 → 170 | 0.40 → 0.30 | 45.6–74.3 → 23.9–36.8 |
| overload-floor / breacher / low | 8.90 → 8.64 | 12388 → 10880 | 1712 → 136 | 0.20 → 0.30 | 44.9–50.9 → 28.8–36.9 |
| overload-floor / arc / high | 10.23 → 9.06 | 19013 → 17575 | 1638 → 165 | 0.30 → 0.30 | 50.0–55.3 → 24.7–36.9 |
| overload-floor / arc / low | 9.08 → 8.40 | 11918 → 10491 | 1604 → 131 | 0.30 → 0.30 | 51.3–61.8 → 24.7–31.1 |

Relay Racks and Manual Control Chamber had the two highest pooled High p95 values in the realtime baseline. The first Arc/High fixed replay in each shows the scene's pass mix and the ranked CPU components. Each draw column is a mean per pass submission.

| Room | Opaque draws | Transparent draws | HUD draws | Renderer CPU ms/render | Simulation | Camera | Ragdoll | Motion | HUD CPU | Load1m before / after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| relay-racks | 86.73 → 86.73 | 29.83 → 29.83 | 6.66 → 6.66 | 4.68 → 3.24 | 0.79 → 0.95 | 1.05 → 1.05 | 0.22 → 0.28 | 0.41 → 0.45 | 0.29 → 0.35 | 47.0–46.0 / 16.7–19.4 |
| manual-control-chamber | 143.61 → 143.61 | 36.62 → 36.62 | 6.81 → 6.81 | 8.22 → 6.84 | 0.23 → 0.43 | 0.24 → 0.50 | 0.20 → 0.40 | 0.13 → 0.28 | 0.08 → 0.17 | 164.2–122.8 / 29.6–27.8 |


The measured draw and GL state counts were stable with the existing static batches and transparent ordering. The priority mask stays CPU-rasterized. The CPU attribution includes the renderer probes and varies between repeats. The selected samples show less renderer submission time while allocation-free camera and ragdoll work still varies across runs. The selected profiles supply no isolated camera or ragdoll speedup. The camera keeps the exact deformed silhouette, the ragdoll cap limits solver work only when reached, and the HUD skips redundant writes while keeping the existing state transitions.

[Before breakdown and profiles](../../artifacts/nextgen/perf14-final/breakdown-before/benchmark.json) · [After breakdown and profiles](../../artifacts/nextgen/perf14-final/breakdown-after/benchmark.json)


## Remaining budget misses

High p95 stayed above 20 ms across all twelve pooled configurations. The final High observer CPU p95 ranged from 14.1 to 30.6 ms at load1m 18.5–36.6 on ten logical cores. The renderer and its driver calls remain the largest sampled CPU category in the two worst baseline rooms. Both retain the existing geometry passes and High post pipeline. The GPU timers include device contention and the measured scopes overlap. The recorded wall-time gain combines code changes and lower host load, so the data cannot establish a quiet-host cost for the pool fragment shader or certify 60 fps.

The final cold and revisit audits stayed below 3 s in every room. The full native campaign stayed below 3 s for every observed hold and exceeded the 1.5 s typical target by 0.054 s at the median. The campaign produced no load-time defect.
