# PERF13 geometry and main-thread performance

PERF13 merges `nextgen` at `32ff0cc0` and measures the new creatures, marine, compressed textures, effects, camera and encounters. The implementation is `c8504fc395d63eacf2246afb35dace250c705fba`. Final measurements and verification receipts are retained under `artifacts/nextgen/perf13-final/`. The final matrix contains 32 realtime trials, 16 CPU-profile trials and 16 GPU/count trials per version.

## Causes and changes

The original deterministic Coolant/Breacher/High profile attributed about 7.9ms/render to camera framing, 3.0ms to renderer submission and 2.0ms to the original UI category (trial start load1m 36.21 on ten cores). Offline final attribution separates ragdoll physics reached through the UI loading proxy from DOM work. These are sample-share estimates apportioned against measured CDP ThreadTime, not separately clocked subsystem durations. The native realtime CPU p95 is reported separately below.

The camera skins roughly 23,000 marine/rig vertices each render to obtain its current deformed silhouette. Three r185's `applyBoneTransform` spreads a Vector3 iterator for each vertex, producing substantial sampled allocation as well as four repeated inverse-bind products. PERF13 caches immutable bind positions and composes each bone into camera space once, then still samples every weighted vertex into the same 160 depth bands. It preserves non-unit weight sums and falls back for morph targets, custom getters or unsupported attributes. The optimized path does not update/upload the skeleton palette a second time. It changes no camera framing rule, playable bounds, motion clip, HUD margin or pose content.

Skeleton scheduling keeps the entire hierarchy for clips, sockets and procedural owners. It only updates palette entries referenced by nonzero skin weights across all rank/rig variants, and marks the bone texture dirty only when a used float32 matrix value changes. Marine palette products fall from 122 to 47; creature joint counts/used entries are crawler 46/18, stalker 38/36, spitter 57/47, brute 63/26 and carrier 73/53. Bone identities, inverse binds, authored animations and weighted output are unchanged. The renderer also skips actor submissions outside its final camera's conservative pose sphere; nearest bounds include authored strike travel. Pool reuse restores visibility, and corpses are reevaluated against the final camera.

Onboarding prompt geometry was repeatedly forcing layout through `getBoundingClientRect`. Ordinary HUD-sync invalidations are coalesced to 100ms; a new prompt, viewport change or bar relocation still measures immediately. No layout, copy, input rule, preference or onboarding eligibility is changed.

### Creature LODs

Meshoptimizer produces about 30% triangle variants retaining the original position, normal and joint/weight rows. Direct reuse of the old normal atlas visibly failed; a seam-safe index-only version could retain only 84–97% of the geometry. Neither is the shipping creature solution. The final low meshes receive new UVs and 512px color/emissive/normal maps baked from the unchanged textured high surface in Blender, then packed to KTX2 using the established encoder settings. UV seam copies retain exact source position/normal/skin rows. The normal strength is baked, so low normal scale is 1. Existing per-actor material hooks and status uniforms remain on the same material; LOD selection swaps its sampler slots and geometry. Both variants and maps are warmed before combat.

| Caste | Full → low triangles | Remaining |
| --- | ---: | ---: |
| Crawler | 7,600 → 2,258 | 29.7% |
| Stalker | 8,800 → 2,630 | 29.9% |
| Spitter | 9,500 → 2,836 | 29.9% |
| Carrier | 10,998 → 3,290 | 29.9% |
| Brute | 11,500 → 3,442 | 29.9% |

Elites and champions keep full rank geometry. The nearest four enemies and ordinary actors within 3m keep full detail; farther ordinary actors use low geometry. Corpses use available low geometry. The marine remains full in the main/HUD passes. A marine low mesh is shipped for shadow coverage, but E10's existing contact-only actor policy means no actor atlas shadow draw runs in combat; no new shadow pass was introduced to use it.

The original high-detail accessors, meshes, nodes/rest transforms, skins, clips, materials and image payloads match the merged baseline for all fourteen modified actor/Brood GLBs. Added creature payload is about 1.06MB geometry, up to 5.24MB compressed GPU mip payload, and 3.32MB main GLB downloads. This is a geometry/time tradeoff, not a texture-memory saving. PNG fallbacks also receive the low meshes/maps. The KTX2 packing script was rerun; its stale fallback source would have changed creature art, so those regenerated original payloads were excluded. The final files preserve committed originals and append separately encoded low maps. Receipts document both the excluded rerun and final preservation.

### Static geometry and shadows

Before logical static geometry: Coolant 84,937 triangles; Crew 85,357; Relay 96,482; Swarm 155,108. The initial 25-enemy crowd contributes 249,290 logical triangles and the selected marine/rig/weapon 28,086, before repeated passes and viewport culling. These inventories are not submitted-frame counts.

Swarm's merged opaque Brood growth accounts for 84,862 triangles. It was already one material batch, so merging again would not remove its triangle cost. Low now uses seam-preserving simplified indices in the same batch and attributes. The kit's source total falls 39,300 → 33,284; room savings depend on instance counts and protected floor trimming. Emissive triangles remain exact because they generate lamp positions/areas. Floor creep retains its existing topology trim. Placements, hulls, native collisions, cutaway colors and support probing are unchanged. Tier switches copy alternate indices into one owned GPU buffer, avoiding a second draw/material pass or deferred buffer ownership.

Architecture shadow caching and contact-only actor shadows were already present and are retained. Steady-combat named audits observe zero shadow draws; preparation is a separate scope. No shadow-cache saving is claimed as new work.

## Measurement method and limits

The requested baseline is rerun at 1920×1080, 25 native enemies, Breacher/Arc, High/Low, twelve realtime seconds, two repeats in each of four rooms. The after matrix uses the same command against a frozen committed build. Deterministic GPU/count and separate CPU-only phases use 360 fixed ticks (six simulation seconds), rendering every tick and yielding RAF opportunities every eight ticks. Counts include debug refresh submissions. Profiles retain source maps and exclusive sample attribution, with idle/unknown explicit. ThreadTime excludes descheduled time; its subsystem split remains statistical and includes fixture/profiling overhead. Native realtime CPU p95 uses the existing wall-duration observer and remains sensitive to scheduling and driver waits.

Named GPU queries are complete, but the backend still gives one-draw AO/bloom intervals similar to whole-scene intervals, and independently sampled children can exceed parents. Raw intervals are retained, never added or promoted into isolated pass costs. Ordinary realtime total GPU intervals are reported as observations where available. Fill counts are render-target footprints, not fragment overdraw. Compressed texture estimates use actual transcoded mip payload lengths; memory inventories cover referenced scene/post/shadow resources and can omit unreferenced cached assets/driver padding.

Each timing comparison carries the recorded host load on ten logical cores. No wall-clock result is treated as load-independent hardware certification. Source-map content hashes verify the frozen builds against their recorded commits in `source-provenance.json`.

## Changes outside the narrow renderer modules

- `src/render/camera/DrawnMarineEnvelope.ts`: exact CPU skin evaluation, demanded by the dominant profile samples.
- `src/render/assets.ts`: extract low siblings before semantic preparation and register palette scheduling after skeleton sharing.
- `src/render/ContextResources.ts`: track alternate LOD geometry before selection, preserving context-loss retirement.
- `src/render/world/OriginalShipKitAssets.ts`: geometry-only extraction/baking/index selection for the measured Brood outlier. No placement list, transform, support rule, fixture position, floor trim or room module was edited.
- `src/ui/onboarding.ts`: measurement cadence only, justified by sampled synchronous layout reads.
- `scripts/nextgen/debug.ts` and `scenarios.mjs`: opt-in full/low comparison fixtures through the existing debug API, with no new global or product UI.

No simulation, AI, encounter, ability rule, model motion clip, authored high mesh or UI screen was changed. Scene dressing placement belongs to the parallel stream and remains untouched.

## Visual comparison scope

Both heavy-combat rigs use the same deterministic 1,117ms frame at 1920×1080 with adaptation disabled. Their before/after PNGs were opened at native size and 480×270. Each caste also has an identical forced-full/forced-low frame beside the full-detail marine, opened at both sizes. Near actors use full detail during ordinary play; the forced-low fixtures deliberately stress that policy. Fine specular/normal details are not pixel-identical, especially on the Brute, but the rebaked variants preserve the recognizable contours and visual hierarchy without the rejected atlas mosaic. The 480px comparisons and crowd frames retain their readability. This is a visual review, not a mathematical assertion of identical shading.

The camera, palette and HUD cadence changes have separate disabled-one-at-a-time capture pairs against a held control build. All were opened at native size and 480×270. Growth High/Low before/after pairs were likewise inspected; High is unchanged and Low keeps the floor/lighting appearance. Capture manifests, PNGs and pixel metrics are retained under the final artifact root. Captures establish appearance, not hardware timing.

The isolated CPU controls precede the final atlas publication and final submission-culling refinement. Their held source, archived maps and recipe allow the camera/palette/HUD changes to be compared separately. The complete final matrix below measures the shipping combination. Rejected index-only assets and obsolete incomplete runs are excluded from final comparisons; their failure receipts explain the replacement.

## Isolated CPU controls

Coolant Plant / Breacher / High, six deterministic CPU-profile seconds and two twelve-second realtime repeats. Each disabled-one build and the held control use the same intermediate assets/source state. Thread means exclude descheduled time but include fixture/profiling overhead; subsystem attribution and host contention can still vary. No isolated realtime result is promoted to a hardware pass.

| Disabled change → held control | Thread CPU mean ms/render | CPU-profile load1m start→end before / after | Realtime frame p95 ms | Realtime CPU p95 ms | Realtime load1m range before / after |
| --- | ---: | --- | ---: | ---: | --- |
| Exact camera skin cache | 16.446 → 8.489 | 16.515→13.779 / 40.416→40.586 | 32.100 → 33.300 | 27.000 → 19.100 | 11.623–13.948 / 31.873–37.580 |
| Sparse skeleton palette | 9.087 → 8.489 | 22.895→19.351 / 40.416→40.586 | 18.200 → 33.300 | 17.600 → 19.100 | 11.961–16.706 / 31.873–37.580 |
| HUD layout cadence | 8.792 → 8.489 | 31.167→34.312 / 40.416→40.586 | 18.100 → 33.300 | 15.300 → 19.100 | 25.082–31.413 / 31.873–37.580 |

Camera-disabled sampled allocation was 10,515,818 estimated bytes/render versus 1,650,990 in the held control (CPU-profile loads in the first row). These are statistical heap-sampling estimates, not exact allocation counters. The camera change removes the per-vertex iterator path while retaining every sampled vertex. The HUD and palette changes have smaller independently observed thread-CPU reductions; the held control still misses the native CPU p95 target under the recorded load.

## Ranked deterministic CPU results

All sixteen CPU-only configurations completed per version with zero GL errors or combat compiles. Equal-weight measured thread CPU/render fell **17.183 → 7.933ms** (53.8%); trial load1m ranges were **18.58–38.48 before / 15.35–50.02 after**, ten cores. This mean includes fixture refresh renders and is not native CPU p95. Each subsystem below is estimated from exclusive active samples. Full per-room/rig/tier clocks, raw GPU scope intervals, counts, footprints and memory inventories are retained in [the ranked breakdown](../../artifacts/nextgen/perf13-final/breakdown.md). No source-map attribution warnings remain.

| Subsystem, ranked by before estimate | Estimated thread CPU ms/render before → after |
| --- | ---: |
| camera framing/threat bias | 8.163 → 1.038 |
| renderer submission/probes | 2.653 → 2.467 |
| animation mixers/skinning | 1.554 → 0.519 |
| simulation step | 1.226 → 1.131 |
| UI/HUD DOM | 0.825 → 0.391 |
| physics/ragdoll presentation | 0.787 → 0.803 |
| unattributed | 0.635 → 0.494 |
| VFX/telegraph batching | 0.609 → 0.569 |
| actor pose/motion | 0.451 → 0.409 |
| GC | 0.248 → 0.085 |
| world dressing update | 0.023 → 0.021 |
| lighting/shadow update | 0.009 → 0.007 |
| fixture driver | 0.000 → 0.000 |

The same phase load ranges above apply to all estimated timings in this table. Camera evaluation is the largest removed cost; palette scheduling reduces the third-ranked animation/skinning category, while native renderer submission remains the largest after category. Simulation/AI and ragdoll presentation remain explicit rather than being misattributed to DOM work. Dressing and lighting update costs were small, so no placement or light-budget change was made. Estimated sampled allocation fell 10,810,984 → 1,985,848 bytes/render across these phases; raw sampling overhead and unknown leaves remain visible.

All sixteen deterministic comparisons retain 360 logical ticks, 25 initial enemies, equal ability-use counts and identical final player coordinates. Their comparison receipt is `deterministic-segment-comparison.json`; this is runtime evidence, not a new test suite.

## Logical geometry inventories

Initial Breacher hierarchy counts, excluding repeated render passes; source full-rank siblings are hidden. After counts include LOD selection and conservative visibility. These are workload counts and do not depend on host scheduling.

| Room | Static High before → after | Static Low before → after | Initial crowd High before → after | Initial crowd Low before → after |
| --- | ---: | ---: | ---: | ---: |
| coolant-plant | 84937 → 84937 | 82585 → 82585 | 249290 → 139406 | 249290 → 139406 |
| crew-checkpoint | 85357 → 85357 | 84341 → 84341 | 249290 → 139756 | 249290 → 139756 |
| relay-racks | 96482 → 96482 | 95562 → 95562 | 249290 → 130834 | 249290 → 130834 |
| swarm-junction | 155108 → 155108 | 153932 → 147971 | 249290 → 131698 | 249290 → 131698 |

The Swarm Low batch removes 5,961 submitted logical triangles while preserving the protected floor/emitter geometry. Stronger index-only reduction did not preserve the atlas appearance. Protected elites/champions, nearby actors, the full marine/HUD skin and room geometry explain why the whole-frame reduction is smaller than the 70% reduction of each ordinary low mesh.

## Realtime before → after

The following table uses pooled recorded samples over both twelve-second native realtime repeats. Every timing row carries its before/after host-load range on ten cores; each repeat is also listed independently. These are observed budget comparisons, not isolated causal speedups or quiet-host certification. Native CPU is update + render + HUD observer duration; audio synchronization is retained separately in raw reports.

| Room / rig / tier | Frame p50 / p95 ms before → after | CPU p95 ms before → after | Triangles p50 before → after | Raw GPU p50 ms before → after | Minimum scale before → after | Load1m range before / after (10 cores) |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| coolant-plant/breacher/high | 17.10 / 26.00 → 16.70 / 32.00 | 24.50 → 15.60 | 463760 → 296050 | 13.05 → 13.04 | 0.900 → 0.900 | 15.21–22.35 / 21.01–23.31 |
| coolant-plant/breacher/low | 16.90 / 25.70 → 16.70 / 18.10 | 24.70 → 12.00 | 450053 → 291951 | 8.97 → 8.24 | 1.000 → 1.000 | 18.94–28.98 / 23.05–26.71 |
| coolant-plant/arc/high | 17.60 / 33.40 → 16.70 / 18.10 | 25.90 → 13.10 | 469074 → 318698 | 13.67 → 12.36 | 0.900 → 0.900 | 28.98–33.53 / 20.79–23.96 |
| coolant-plant/arc/low | 16.70 / 25.10 → 16.70 / 18.20 | 22.10 → 15.20 | 454199 → 313409 | 8.99 → 10.96 | 1.000 → 1.000 | 33.26–35.02 / 20.79–25.83 |
| crew-checkpoint/breacher/high | 25.00 / 40.40 → 16.80 / 33.60 | 33.80 → 20.40 | 487542 → 305494 | 13.23 → 13.40 | 0.900 → 0.900 | 33.26–35.15 / 19.88–24.70 |
| crew-checkpoint/breacher/low | 17.50 / 32.30 → 16.70 / 18.20 | 27.50 → 17.80 | 456207 → 295901 | 10.09 → 7.88 | 1.000 → 1.000 | 35.15–37.00 / 19.88–24.16 |
| crew-checkpoint/arc/high | 17.60 / 26.70 → 16.70 / 17.90 | 26.70 → 17.20 | 480126 → 330026 | 12.92 → 12.24 | 0.900 → 0.900 | 36.66–37.66 / 19.68–24.16 |
| crew-checkpoint/arc/low | 17.10 / 26.10 → 16.70 / 18.20 | 26.30 → 17.20 | 459149 → 321357 | 9.16 → 8.16 | 1.000 → 1.000 | 36.66–49.07 / 19.68–28.13 |
| relay-racks/breacher/high | 24.40 / 34.30 → 16.70 / 32.80 | 29.00 → 17.80 | 489919 → 307303 | 13.29 → 12.04 | 0.900 → 0.900 | 49.07–66.83 / 21.42–23.81 |
| relay-racks/breacher/low | 16.80 / 25.40 → 16.70 / 18.10 | 22.70 → 14.00 | 455360 → 301718 | 9.06 → 7.05 | 1.000 → 1.000 | 45.23–61.37 / 15.67–21.42 |
| relay-racks/arc/high | 16.80 / 25.60 → 16.70 / 25.70 | 24.50 → 13.20 | 460165 → 330353 | 12.00 → 12.10 | 0.900 → 0.900 | 33.57–45.23 / 14.79–16.29 |
| relay-racks/arc/low | 16.70 / 25.20 → 16.70 / 17.90 | 20.20 → 12.00 | 450962 → 323786 | 9.69 → 7.55 | 1.000 → 1.000 | 33.57–36.15 / 14.78–16.48 |
| swarm-junction/breacher/high | 17.00 / 33.20 → 16.70 / 18.10 | 28.90 → 16.60 | 502935 → 356406 | 12.40 → 11.50 | 0.900 → 0.900 | 29.41–35.27 / 16.48–19.88 |
| swarm-junction/breacher/low | 16.80 / 32.00 → 16.70 / 18.10 | 28.70 → 14.30 | 500428 → 348561 | 8.99 → 7.19 | 1.000 → 1.000 | 30.18–50.56 / 16.05–18.98 |
| swarm-junction/arc/high | 17.00 / 32.80 → 16.70 / 25.10 | 26.40 → 14.10 | 528939 → 391783 | 12.04 → 11.56 | 0.900 → 0.900 | 45.05–50.56 / 14.42–17.85 |
| swarm-junction/arc/low | 16.80 / 25.70 → 16.70 / 18.20 | 24.20 → 13.60 | 525786 → 383893 | 9.01 → 8.40 | 1.000 → 1.000 | 40.17–45.60 / 16.58–18.12 |

Pooled nearest-rank percentiles over both twelve-second realtime repeats; each frame contributes once. Raw CPU observer durations include scheduling/driver waits. GPU values are raw elapsed intervals, not additive isolated pass costs. The JSON retains each repeat separately, including host load and its worst frame p95; no timing result is declared load-independent.

| Trial | Frame p50 / p95 ms before → after | CPU p95 ms before → after | Triangles p50 before → after | GPU p50 ms before → after | Load1m before start→end / after start→end |
| --- | ---: | ---: | ---: | ---: | --- |
| coolant-plant-breacher-high-0 | 17.00 / 25.90 → 16.70 / 33.30 | 24.10 → 14.60 | 465600 → 292944 | 13.10 → 13.05 | 15.21→22.35 / 21.01→23.31 |
| coolant-plant-breacher-high-1 | 17.20 / 26.00 → 16.70 / 23.90 | 25.20 → 16.20 | 462910 → 300180 | 12.84 → 12.86 | 22.35→18.94 / 23.31→23.05 |
| coolant-plant-breacher-low-0 | 16.90 / 25.50 → 16.70 / 18.10 | 24.30 → 12.20 | 452165 → 290505 | 9.19 → 8.06 | 18.94→19.91 / 23.05→26.71 |
| coolant-plant-breacher-low-1 | 16.90 / 25.70 → 16.70 / 18.10 | 25.00 → 11.90 | 447987 → 292915 | 8.85 → 8.96 | 19.91→28.98 / 26.71→23.96 |
| coolant-plant-arc-high-0 | 18.50 / 33.80 → 16.70 / 18.10 | 25.60 → 12.40 | 469326 → 317090 | 13.90 → 12.35 | 28.98→33.53 / 23.96→20.80 |
| coolant-plant-arc-high-1 | 17.40 / 33.20 → 16.70 / 18.20 | 26.10 → 14.20 | 468448 → 320300 | 13.37 → 12.39 | 33.53→33.26 / 20.80→20.79 |
| coolant-plant-arc-low-0 | 16.80 / 25.30 → 16.70 / 18.30 | 23.10 → 15.40 | 453985 → 315213 | 9.38 → 10.18 | 33.26→35.02 / 20.79→25.83 |
| coolant-plant-arc-low-1 | 16.70 / 25.00 → 16.70 / 18.10 | 20.70 → 14.80 | 454923 → 311811 | 8.52 → 11.83 | 35.02→33.26 / 25.83→24.70 |
| crew-checkpoint-breacher-high-0 | 24.90 / 34.20 → 16.70 / 26.20 | 32.70 → 18.50 | 489018 → 306746 | 13.06 → 12.56 | 33.26→33.62 / 24.70→22.75 |
| crew-checkpoint-breacher-high-1 | 25.00 / 41.90 → 17.00 / 41.00 | 35.10 → 21.30 | 484402 → 304110 | 13.67 → 28.35 | 33.62→35.15 / 22.75→19.88 |
| crew-checkpoint-breacher-low-0 | 17.50 / 32.20 → 16.70 / 18.10 | 27.10 → 16.10 | 454883 → 293149 | 11.11 → 7.89 | 35.15→36.42 / 19.88→20.18 |
| crew-checkpoint-breacher-low-1 | 17.60 / 32.30 → 16.70 / 18.50 | 28.20 → 20.00 | 457249 → 297909 | 9.27 → 7.88 | 36.42→37.00 / 20.18→24.16 |
| crew-checkpoint-arc-high-0 | 23.40 / 33.20 → 16.70 / 18.00 | 29.30 → 17.90 | 485451 → 326910 | 12.92 → 12.29 | 37.00→37.66 / 24.16→23.21 |
| crew-checkpoint-arc-high-1 | 17.30 / 26.50 → 16.70 / 17.80 | 25.50 → 16.10 | 478210 → 331709 | 13.02 → 12.13 | 37.66→36.66 / 23.21→19.68 |
| crew-checkpoint-arc-low-0 | 17.00 / 25.90 → 16.70 / 18.00 | 26.30 → 17.00 | 459133 → 323225 | 9.56 → 7.65 | 36.66→44.15 / 19.68→28.13 |
| crew-checkpoint-arc-low-1 | 17.20 / 26.30 → 16.70 / 18.40 | 26.20 → 17.30 | 459213 → 319573 | 8.99 → 9.70 | 44.15→49.07 / 28.13→23.81 |
| relay-racks-breacher-high-0 | 23.50 / 34.20 → 16.70 / 33.40 | 28.80 → 17.90 | 473445 → 302919 | 12.99 → 12.56 | 49.07→66.83 / 23.81→23.00 |
| relay-racks-breacher-high-1 | 24.90 / 34.50 → 16.70 / 18.40 | 29.00 → 17.70 | 492344 → 311039 | 13.29 → 12.04 | 66.83→61.37 / 23.00→21.42 |
| relay-racks-breacher-low-0 | 16.80 / 25.40 → 16.70 / 18.10 | 23.10 → 14.20 | 455354 → 303018 | 9.06 → 7.05 | 61.37→53.71 / 21.42→18.58 |
| relay-racks-breacher-low-1 | 16.70 / 25.20 → 16.70 / 18.00 | 21.80 → 13.90 | 455796 → 301356 | 9.03 → 7.15 | 53.71→45.23 / 18.58→15.67 |
| relay-racks-arc-high-0 | 16.80 / 25.20 → 16.70 / 18.00 | 24.50 → 11.70 | 459538 → 330307 | 12.08 → 11.50 | 45.23→35.54 / 15.67→14.79 |
| relay-racks-arc-high-1 | 16.80 / 25.70 → 16.70 / 33.50 | 24.60 → 14.00 | 460627 → 331243 | 11.81 → 12.83 | 35.54→33.57 / 14.79→16.29 |
| relay-racks-arc-low-0 | 16.70 / 25.30 → 16.70 / 17.90 | 20.30 → 12.00 | 452744 → 327122 | 8.46 → 7.98 | 33.57→36.15 / 16.29→14.78 |
| relay-racks-arc-low-1 | 16.70 / 25.20 → 16.70 / 17.80 | 19.80 → 11.60 | 450854 → 320566 | 10.76 → 7.35 | 36.15→35.27 / 14.78→16.48 |
| swarm-junction-breacher-high-0 | 17.30 / 33.40 → 16.70 / 18.10 | 29.60 → 18.00 | 504651 → 360101 | 11.86 → 11.51 | 35.27→31.77 / 16.48→19.88 |
| swarm-junction-breacher-high-1 | 16.80 / 26.10 → 16.70 / 18.20 | 27.50 → 15.00 | 502609 → 348959 | 12.60 → 11.38 | 31.77→29.41 / 19.88→18.98 |
| swarm-junction-breacher-low-0 | 16.70 / 25.90 → 16.70 / 18.10 | 28.10 → 14.40 | 500202 → 349849 | 8.22 → 7.12 | 30.18→35.99 / 18.98→17.78 |
| swarm-junction-breacher-low-1 | 16.80 / 33.20 → 16.70 / 18.20 | 29.00 → 13.70 | 500556 → 346103 | 10.82 → 7.39 | 35.99→50.56 / 17.78→16.05 |
| swarm-junction-arc-high-0 | 17.30 / 33.30 → 16.70 / 18.10 | 27.10 → 13.60 | 525279 → 391793 | 11.90 → 11.52 | 50.56→49.08 / 16.05→14.42 |
| swarm-junction-arc-high-1 | 16.80 / 25.90 → 16.70 / 33.10 | 24.50 → 14.70 | 534149 → 390096 | 12.12 → 11.64 | 49.08→45.05 / 14.42→17.85 |
| swarm-junction-arc-low-0 | 16.80 / 25.60 → 16.70 / 18.30 | 23.40 → 14.10 | 520818 → 384979 | 8.59 → 8.24 | 45.60→44.48 / 17.85→16.92 |
| swarm-junction-arc-low-1 | 16.80 / 25.70 → 16.70 / 18.00 | 24.50 → 12.20 | 530088 → 382963 | 9.53 → 8.54 | 44.48→40.17 / 18.12→16.58 |

## Remaining budget and verification

The requested full performance budget is **not achieved**. Across the sixteen pooled realtime configurations, frame p95 ≤20ms improves from 0/16 to 11/16: all eight Low configurations and three of eight High configurations. CPU p95 improves from 20.2–33.8ms to 12.0–20.4ms, still above 8ms everywhere. These ranges summarize the load-tagged rows above; they are not host-independent hardware results. Mean configuration triangle p50 falls 477,163 → 326,043 (31.7%). Maximum observed draws fall 156 →154; steady combat shader compilation and shadow atlas updates remain zero.

Adaptive resolution retains its existing 0.9 High floor (Low stays at 1.0). Most High trials already run at that floor. Lowering pixel count further cannot remove camera/simulation/driver scheduling spikes, and would violate the requested scale. No additional unmeasured resolution/art reduction was made to manufacture a passing result. The largest remaining sampled category is renderer submission, followed by simulation, exact camera framing and ragdoll physics. Protected near/elite actors, the full marine and unchanged High room geometry also retain a substantial geometry floor. Further gains need targeted work on those owners and a quiet-host confirmation; elapsed GPU query granularity prevents claiming isolated pass milliseconds on this backend.

`npm ci` and `npm run build` completed successfully after merging; the final implementation production build also passed. The final native realtime, CPU-profile and GPU/count phases all completed without recorded browser/GL errors or mid-combat program compilation. Sixteen paired deterministic segments retained 360 simulation ticks, identical ability-use counts and final player positions. No automated tests or assertion gates were added.

The `g1-recovery` fixture completed three High↔Low/room cycles and context loss/restoration through native recovery controls. Equivalent room-cycle resource counts remained 341 geometries /146 textures across all three cycles; restoration completed with `contextLost=false`. Initial/restored inventories differ because the active cache owners differ. `g3-ink-switches` completed Low ink/silhouette/off/full transitions, with expected post-resource allocation/disposal and zero transition compiles. Both fixture manifests have empty errors/failures; their native and 480×270 captures were opened.

The complete raw matrices, readable ranked breakdown, source provenance, capture review and packing receipts are indexed in [the retained evidence](../../artifacts/nextgen/perf13-final/README.md). The source-map archives preserve offline attribution after temporary build cleanup. Failed visual candidates were excluded; a rejection capture/receipt remains. Benchmark budget aliases now match the requested 20ms /0.9 /330 limits; historical raw JSON alias flags predate this normalization, so the numeric measurements and explicit comparisons above are authoritative.

The native Arc seed-1729 campaign completed all twenty rooms, exit 0, with zero recorded errors or defects. It used native mouse/keyboard policy, full presentation and no assistance/fast rendering. Wall duration was 1,594.14s with load1m 20.87 at start /17.87 at end on ten cores. The final fixture reports phase/status/UI `complete` and all twenty completed node IDs; its final combat snapshot also has zero health/dead, so this is the harness’s recorded completion outcome, not a claim of an undamaged victory. Room preparation holds peaked at 2,129.1ms in this campaign (loaded-host observation, not quiet-host certification). The full report, input trace, screenshots and source hashes are retained in `campaign/`.
