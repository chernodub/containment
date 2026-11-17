# VFX14 — remaining ability presentation

Branch: `t3/vfx14-remaining-ability-effects`. Runtime source: `9fc29a5ba6fa967252a4356e85bda1a0c82a2212`; subsequent delivery commits contain documentation only. Integration baseline: `807e8a132ec7a097c46657a3feeb5f2eb1285ed8` (merged `nextgen`, including T12). No push or PR.

The four rigs have implementation and two opened look/fix rounds, followed by focused correction captures and a frozen-source delivery capture. The contrast and timing improvements do not make every remaining ability equal to the best VFX13 effects. Napalm, Ram, Frost Trail and Overclock remain the weakest. Detailed accepted and rejected observations are in [VFX14-review.md](plans/VFX14-review.md).

## Implementation

`FlagshipFx.ts` retains 24 pooled meshes sharing one geometry and one shader source. New effects are uniform-switched modes: Crack, Fuel, Pressure, Pillar, FuelStrip, FrostStrip and Blizzard. Adding a type means adding its uniform-selected vertex/fragment branch, leasing a fixed slot from `ElementKit.fx`, and feeding the native cone/line/radius and lifetime. The existing ability root participates in material preparation and `AbilityPriorityMask`; no separate program or new mid-combat preparation route is needed. Whiteout's dedicated two-material weather module was removed in favour of this shared family.

Fixed retained surface/zone/discharge records and seed ownership checks prevent a recycled pool slot from being moved or cleared by an old owner. Native snapshots and events determine geometry and contacts; presentation does not determine a hit. Native segment-distance hit checks include semicircular end caps: FuelStrip and FrostStrip now extend and clip to that exact capsule, including a zero-length birth circle. Afterburn retains one strip lease throughout that birth/growth transition. The Frost Trail review found that the native strip is born at zero length and grows during the dash: the retained visual now refreshes the complete native transform and extent every snapshot. At +740ms the visual receipt matches the native 150×44-unit zone (4.6875m centre-line length, .6875m capsule radius; 6.0625m total end-to-end extent).

| Rig | Result |
| --- | --- |
| Breacher | Seismic Slam has a precise deck ripple, dark crack decal, dust and hopping debris. Ram adds a restrained shock cone and translucent prow while retaining observed shove/skids/sparks. Bulwark unfolds centre-out across its hex face, keeps hit ripples and collapses into light fragments. |
| Pyro | Napalm has a soot-backed, native-radius boiling fuel bed, small vertical jets, embers/smoke, native canister/landing feedback and burst. Afterburn uses one continuous native-width/length fuel strip instead of the rejected circular stamps, plus steady exhaust. Meltdown attaches raised shoulder flames and emits pooled kill bursts. |
| Arc | Overload uses staggered thick violet-white links, forks, contact nodes, lingering crackle and a restrained floor trace. Continuous path jitter replaces the rejected fence pattern. Tesla Pylon slams/settles, glows and keeps a live wavering marine link and native-target arcs. Static Step adds a silhouette echo/residual arrival discharge. Overclock follows the marine with a restrained time field, longer tracers and the existing afterimage pool. |
| Cryo | Glacier has bottom-up columns, inner light cores, cracks, frost base and reduced shatter wash. Frost Trail uses a dark-backed connected strip with bright rime edges and low mist. Whiteout has a sparse native-radius curved blizzard dome, open centre and native freeze pulses; the old dedicated shader family is gone. |

The flagship corrections add Flashfire depth slices and a larger hot muzzle core; Railbreaker retains last-observed target contacts so killed enemies still produce contact flares; Cryo Nova gets an earlier stronger ring/crystal beat and replaces its old mist curtain with restrained gusts; Overdrive uses a narrower wave and cylindrical broken light filaments rather than flat pillar cards.

Low keeps shapes and decals, uses fewer noise octaves/sparser weather, and follows existing light/distortion tier limits. Shader time freezes under reduced motion; existing camera, exposure, bloom/light and distortion helpers continue to apply `screenShake`, `flashIntensity` and reduced-motion preferences. Impacts use the existing pooled light system. No new frame-loop arrays, materials or geometries were introduced.

## Visual evidence

Gallery: `artifacts/nextgen/vfx14-final/index.html` — sixteen before/after PNG sheets and comparison pages, 256 exact box-reduced 480×270 ability sample tiles and eight heavy-combat tiles, and complete native timeline galleries. Thirteen remaining abilities have both Crew Checkpoint and Relay Racks studies; three flagship studies additionally have both floors, with their Awakening Bay studies retained. All four rigs have High and Low Armory combat bursts.

The original VFX13 distribution was reconstructed locally from the merged baseline's seven changed source files, without changing sparse checkout. Its 245 native frames (203 main +42 flagship-floor supplement) and the final source's 301 native frames (one final-source cohort) are retained under `before/`, `before-flagships/` and `after/`, with original manifests and application asset hashes. Both sources have zero capture errors/failures; all 258 measured final-source combat-compilation samples are zero. Cast samples without a measurement remain unmeasured, rather than being silently counted as zero.

Opened the per-ability 480 timelines and native impact/aftermath frames during both rounds; the critique log records rejected pale fire, circular Afterburn stamps, fence-like lightning and invisible Frost Trail extents. Final native and 480 High/Low combat observations retain complete marine outlines, enemy silhouettes and the hostile charge/contact telegraphs through friendly effects. These are staged readability observations, not hardware-performance measurements.

Successful intermediate PNGs were retired after retaining reduced review sheets, unchanged parent manifests and SHA/byte inventories under `review-rounds/` and `provenance/`. Failed raw evidence remains intact. The complete artifact bundle is retained locally under the repository artifact ignore rule; code, review and this report are committed. Early `vfx14-slam-before` was Awakening Bay only: named V2 fixtures do not consume `--rooms`. Explicit pale/dark scenario variants fix the actual review path. Wall studies choose a different legal placement lane to expose the wall face; the production camera and native placement validation remain unchanged.

## Verification

`npm ci` and `npm run build` passed. The production build includes TypeScript checking; no tests or test infrastructure were added. Only ability presentation, its V2 capture fixtures and documentation changed. No simulation, difficulty, actor/model/motion, camera/world/UI, hostile telegraph or DepthRenderer changes. No external assets/dependencies were added; existing credits and licenses are unchanged.

Native unassisted standard-difficulty campaigns, seed `1729`, ordinary fixed 60 Hz with every simulation tick rendered (no fast/assisted/room-limit overrides):

| Rig | Outcome | Rooms cleared | Errors | Defects | Source |
| --- | --- | ---: | ---: | ---: | --- |
| breacher | dead | 13 | 0 | 0 | 9fc29a5ba6fa |
| pyro | dead | 14 | 0 | 0 | 9fc29a5ba6fa |
| arc | dead | 12 | 0 | 0 | 9fc29a5ba6fa |
| cryo | dead | 16 | 0 | 0 | 9fc29a5ba6fa |

A natural death is a completed campaign attempt, not a twenty-room completion. Raw reports, screenshots and input traces are under the gallery's `campaigns/<rig>/`. Earlier sources `656a6612`/`239b0d48` Breacher and source `e90d7437` Pyro attempts are retained separately under provenance; each records its own executed source. No outcome or runtime error was discarded. Fixed-step bot timings are submission evidence, not hardware FPS.

Armory / Breacher High: one matched breakdown trial of 20 simulated seconds per source, fixed 1920×1080, a fixture with 25 legal enemies and native cooldowns. Both trials finished with zero WebGL errors, no lost context, zero combat compilations and no resource-budget misses.

| Measure | Original 807e8a13 | Final 9fc29a5b |
| --- | ---: | ---: |
| Draws p50 / p95 / max | 142 / 157 / 164 | 144 / 158 / 168 |
| Prepared programs | 128 | 126 |
| Combat compilations | 0 | 0 |
| Exclusive transparent VFX GPU ms p50 / p95 / max | 56.49 / 98.52 / 161.21 | 70.21 / 108.41 / 117.06 |
| One-minute host load, start → end | 66.5 → 82.2 | 16.8 → 17.1 |

![Instrumented Armory breakdown](../../artifacts/nextgen/vfx14-final/benchmark-comparison.svg)

The extra surfaces add a few draws; removing Whiteout's dedicated material pair reduces the prepared program inventory. The final trial records higher transparent GPU p50 than the baseline; shared GPU contention prevents attributing that delta to VFX alone, so it remains a performance uncertainty rather than a claimed win. This is an instrumented, shared-host diagnostic with asynchronous GPU queries, not quiet timing acceptance. Do not infer a hardware FPS or speedup from these timings, and do not sum pass percentiles. CPU source maps were absent in the frozen production distributions, so subsystem attribution is mostly unavailable; no CPU allocation or subsystem-performance claim is made. Raw profiles, counts, pass resolutions and host observations remain in `bench-before/` and `bench-after/`.

An initially over-expanded profiling matrix was intentionally stopped after its first completed baseline trial when host load exceeded 200; closing its page produced cancellation errors in the remaining matrix cells. That entire failed raw run remains unchanged in `bench-expanded-interrupted/`. The clean single-trial comparison above replaces it; successful earlier after trials remain under provenance.

## Remaining visual weaknesses

- **Napalm Charge:** the soot fixes pale-floor disappearance and the edge persists, but the fuel still reads as a flat lava-like bed with small jets. Its burst is less sculpted than Flashfire; it is below flagship quality.
- **Ram:** the new cone/prow is deliberately transparent and the native skids remain the strongest read. It lacks the flagship effects' sense of compressed rolling mass.
- **Frost Trail:** the corrected full native strip now reads on both floors, but its restrained crystallisation is less dramatic than Cryo Nova. **Whiteout** is readable and sparse, yet the weather pattern remains procedural.
- **Meltdown:** the attached suit jets remain modest; the kill-burst has more presence. **Overclock:** sustained tracer/echo/time accents preserve readability, but its identity is modest compared with the flagship casts. Static Step is also less elaborate than the strongest Arc contact effects.
- **Flagships:** Flashfire still reveals its stacked-sheet construction at this camera; Railbreaker's individual contact flares remain brief beside its lance; some secondary Cryo perimeter gusts still resemble smoke. The Overdrive pillar has depth now, but remains an abstract filament effect.

Slam, Bulwark, Glacier, Afterburn and the revised Arc links are the closest improvements to the flagship standard. Pyro remains the busiest rig in simultaneous combat. The preserved gallery is the basis for these judgments; this report does not mark all art targets as equal quality.
