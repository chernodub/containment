# G2 — World art pass

Branch: `t3/world-art-overhaul`. Final renderer freeze: `90cf8ed` (the final report commit follows this revision). The complete fourth story round used `a8b13ff`; the later manual-console correction is identified per shot. Legacy calibration used `6a888d3`. Starting integrated renderer: `a6b970085b479bce04feccc1e814c11301ba5c89`. No push, PR, merge, sparse-checkout change, third-party dependency or simulation change.

## What shipped

- Six creature families retain their authored anatomy, with surface-fitted eyes/sacs/seams, family carapace tints, a cool silhouette rim, stronger fixed-pixel health bars and elite/champion crests. Snapshot-driven wind-up brightening, camouflage, flinch, pooled220ms emergence, and frost/char/acid corpse finishes sit on the existing animation/ragdoll system. Queen exposure changes her crown and surface glow.
- Queen arena receives a front/high shadowed key, cold counter-rim and lower-output ring so the body owns the composition. Camera weighting and zoom preserve crown clearance. Existing nests, acid emissives, warnings and defeat state remain tied to real boss snapshots.
- Marine suit strips follow the active rig. Raised broad fill and a softer forward cone reveal the floor without the original foot hotspot. No new actor lights.
- Original128² albedo/normal/ARM finishes replace the brick motif; world-space irregular plates, macro wear, scratches, frost/wetness/tissue/heat response and environment-specific deck treatment supplement them. Generated chipped paint, lanes, bay IDs, chevrons and wall fittings remain flush or outboard of supported ground. Three generated PNGs total27,460 bytes; `scripts/nextgen/g2-surfaces.mjs` reproduces them.
- Smooth clustered garden canopies, machined carousel trim, coolant/workshop/reactor detail, bounded shaft/annulus bevels, container labels and generated instrument displays improve the near-camera props. Deterministic merged dressing samples actual obstacle roofs; branching breach growth roots at real breach locations. No collision or navigation data changes.
- Twenty authored room compositions encode the story beat in a named lighting idea. The formerly uncalibrated rooms and all legacy palette mappings are included. Cargo/comms/manual-console shadow bounce is bounded in material uniforms; broad practical near-field energy is capped to preserve machine finish.
- Cinematic renderer-only cryobay menu set and three-quarter camera put marine/alien on the right and leave the left45% quiet. High-only subtle depth of field uses the existing depth buffer/composite, no extra target; respects lensEffects and reduced motion. Low retains the direct path. Menu toggles reuse the light inventory, and the gameplay camera returns normally.
- Exit guidance changes amber→cyan with route readiness. Five physical pickup silhouettes replace identical boxes. New room/title/material families enter the retained material registry and existing real High/Low preparation draws.

## DepthRenderer.ts integration seams

Keep the V2 ability routing intact. G2 changes are localized to:

1. Imports/ownership for `TitlePresentation`, `addDeckMarkings`, `addWorldDressing`, `addExitSignal` and `pickupModel`.
2. Constructor creates/registers the title's materials. Room assembly adds flush markings/dressing before mood application, lighting discovery and material registration; `applyRoomMood` receives `node.templateId`.
3. Exit construction adds one guidance mesh. Existing disposal handles room-owned meshes/materials; title receives explicit disposal.
4. Render forwards rig/wind-up/champion/camouflage values, includes champion health bars, updates dressing/exit uniforms, switches world/backdrop/menu set visibility and applies the title camera through the existing `menu` flag.
5. Existing post call receives view-space marine/menu focus distance; pickup construction delegates to its five-shape factory. No ability-VFX file changed.

## Captures and visual critique

Final label: `g2-final`; gallery root is `/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/`.

Before: `g2-before`121 PNGs, one live FreightHold fixture lost visible threats;0consoleerrors. `g2-before-short-low`63 PNGs fills every matching short Low calm/kiting fixture with0 failures/errors, using the preserved original production output. Original baseline was read read-only from the main checkout.

Round1:126 PNGs, every story room on both tiers plus boss/title. Opened all eight room sheets and representative full-size frames. Rejected the bright clay-like Queen, oval anatomical attachments, overly clean deck, unsupported dish and flat menu shot. Replaced with embedded seams/crests, worn plates, supported instruments, bounded machine irradiance, independent menu lens/set.

Round2: the initial attempt failed before producing screenshots because a local variable was redeclared by Three's unrolled point-light loop. The inline fix is covered by structural tests. `g2-round2-valid`:126 PNGs,0 errors/failures, all eight room sheets opened. Corrected Queen crown clipping, hidden title alien, shaft task light, vault brightness and remaining overly dark legacy compositions.

Round3: `g2-round3`:127 PNGs including recovery,0 errors/failures. All eight room sheets opened. Cargo and communications shadows still crushed; manual-console combat was too dark. An isolated14 shot High/Low calibration restored shadow detail and motivated a fourth complete gallery. All review stats are decoded from actual PNGs, never synthetic shader estimates.

Fourth complete round:132 PNGs,0 errors/failures, all 20 High/Low calm+kiting plus Queen/title, real champions, five pickup types and exposed Queen/nests. Opened all 20calm/combat sheets, focused full-size phase/pickup/champion frames and all four comparison sheets. One Low calm manual-console local median64.4 remained; a focused six-shot correction is recorded as a provenance-preserving overlay below.

Legacy:30 PNGs covering every other version2template on both tiers,0 errors/failures after selecting real combat-bearing seeds. Opened all four sheets, rejected dim cargo lanes/crushed prop shadows, added per-template composition and recaptured30 PNGs. Early fixture attempts are retained, not counted. The Queen supplies the16thlegacy template.

The 10 screenshots to open first (absolute paths):

1. [boss-reactor-vault-02.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/boss-reactor-vault-02.png)
2. [g2-queen-exposed-reactor-vault-02.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/g2-queen-exposed-reactor-vault-02.png)
3. [title.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/title.png)
4. [g2-kiting-high-transmission-chamber-02.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/g2-kiting-high-transmission-chamber-02.png)
5. [g2-champions-armory-02.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/g2-champions-armory-02.png)
6. [g2-pickups-awakening-bay.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/g2-pickups-awakening-bay.png)
7. [g2-calm-high-communal-atrium.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/g2-calm-high-communal-atrium.png)
8. [g2-calm-high-service-shaft-landing.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/g2-calm-high-service-shaft-landing.png)
9. [g2-calm-high-manual-control-chamber.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/g2-calm-high-manual-control-chamber.png)
10. [comparison/baseline-before-after-2.png](/Users/chernodub/.t3/worktrees/containment-game/t3-0adea502/artifacts/nextgen/g2-final/comparison/baseline-before-after-2.png)

The comparison sheets contain all twenty rooms, with original-baseline / integrated-before / G2-final columns. Only ten matching historical baseline rooms were supplied; the other ten cells explicitly say no historical capture rather than substitute another room. These columns include the deliberate G1 camera change and are not pixel-aligned regression comparisons.

## Value structure

Method: sRGB Rec.709 luminance, central ROI x15–85%,y20–80%,4px grid, masked by actual room boundary via inverse camera. Separate legal visible floor samples within3m of the marine. `luminance.json` retains unmasked statistics and16-bin histograms too. Approximate G1 bands: P5≈12–28, median≈50–80, P95≈170–215; local median≥70. Report every outlier instead of describing the whole gallery as a strict pass.

| Room | High calm P5 / median / P95 | Low calm P5 / median / P95 | Lowest local median, both tiers calm+combat |
|---|---:|---:|---:|
| awakening-bay | 28.1 / 76.4 / 168.7 | 18.2 / 57.1 / 194.7 | 97.4 |
| passenger-vault | 23.4 / 80.5 / 174.9 | 17.4 / 57.9 / 175.7 | 76.3 |
| residential-gallery | 20.1 / 51.2 / 160.8 | 28.4 / 50.1 / 150.6 | 86.3 |
| communal-atrium | 16.4 / 77.1 / 171.9 | 12.9 / 56.4 / 195.9 | 84.4 |
| crew-checkpoint | 51.5 / 65.3 / 182.8 | 48.8 / 63.9 / 202 | 113.6 |
| armory | 15.4 / 56.5 / 170.6 | 12.1 / 54.6 / 129.5 | 108.9 |
| freight-hold | 20.7 / 49.9 / 153.9 | 20.4 / 47 / 158.5 | 125.2 |
| breached-loading-bay | 29.1 / 73 / 176 | 28.1 / 61.1 / 181.1 | 86.8 |
| relay-racks | 35.5 / 56.3 / 168.5 | 41.6 / 60.5 / 188 | 90.3 |
| transmission-chamber | 15.5 / 52.4 / 179.7 | 23.1 / 55.5 / 187.7 | 76.9 |
| diagnostic-gallery | 10.5 / 82.1 / 205.9 | 34.2 / 54.1 / 209.9 | 86.3 |
| safety-interlock-station | 24.2 / 53.1 / 169.3 | 38.2 / 55.4 / 191.9 | 88.7 |
| coolant-plant | 20.6 / 52.3 / 169.3 | 20.8 / 47.4 / 179.1 | 84.8 |
| service-shaft-landing | 19.3 / 49.7 / 189.1 | 24.4 / 51.1 / 193.9 | 74.7 |
| infested-workshop | 25.1 / 50.7 / 166.5 | 19.2 / 47.5 / 179.4 | 83.9 |
| swarm-junction | 24.9 / 83.7 / 213.6 | 7.7 / 48.6 / 217.7 | 137.7 |
| shielding-gate | 29.4 / 66 / 167.7 | 24.1 / 63.8 / 172.5 | 89.0 |
| containment-annulus | 27.6 / 69.5 / 184.7 | 24.7 / 74.2 / 148.4 | 116.1 |
| manual-control-chamber | 19.8 / 72.5 / 161.3 | 21.6 / 75.3 / 165.5 | 74.2 |
| overload-floor | 27.7 / 80.7 / 172.1 | 28.2 / 82.1 / 179.8 | 75.9 |

Each kiting cell lists P5 range / median range / P95 range over the two deterministic motion frames.

| Room | High kiting | Low kiting |
|---|---:|---:|
| awakening-bay | 12.2–12.7 / 64.3–66.7 / 171.1–181.1 | 7.2–13.5 / 50.5–56.2 / 146.5–161.9 |
| passenger-vault | 14.3–15.1 / 59.2–74.7 / 168.2–177.1 | 15.8–15.8 / 56.0–63.2 / 188.8–192.0 |
| residential-gallery | 22.7–23.8 / 54.7–55.0 / 183.2–183.4 | 40.1–40.5 / 62.6–63.2 / 194.9–195.1 |
| communal-atrium | 13.6–16.4 / 54.8–77.0 / 169.8–174.6 | 11.8–11.9 / 44.9–55.5 / 175.3–191.2 |
| crew-checkpoint | 23.4–23.6 / 61.8–67.3 / 158.9–194.3 | 37.4–41.7 / 61.4–67.7 / 171.6–208.7 |
| armory | 15.6–16.3 / 57.3–57.4 / 185.6–187.3 | 10.9–11.3 / 61.9–62.5 / 195.0–197.0 |
| freight-hold | 18.9–22.8 / 55.8–57.3 / 185.4–191.8 | 20.4–28.4 / 58.1–58.5 / 177.7–182.1 |
| breached-loading-bay | 24.7–28.5 / 66.4–67.6 / 200.6–202.9 | 28.9–29.1 / 57.5–68.1 / 195.3–197.8 |
| relay-racks | 29.1–30.1 / 82.5–84.0 / 182.0–183.9 | 35.3–35.5 / 67.8–79.3 / 189.1–195.2 |
| transmission-chamber | 18.0–20.0 / 55.5–56.7 / 143.6–158.2 | 23.7–26.1 / 58.8–59.1 / 157.6–158.9 |
| diagnostic-gallery | 16.3–19.0 / 58.3–64.7 / 156.8–180.1 | 37.3–38.2 / 69.6–73.8 / 191.2–205.9 |
| safety-interlock-station | 17.0–18.5 / 61.0–62.6 / 133.9–136.3 | 38.3–38.3 / 63.0–64.2 / 155.9–157.9 |
| coolant-plant | 19.3–19.9 / 53.2–77.2 / 166.7–193.9 | 31.2–32.1 / 62.2–71.5 / 188.5–209.9 |
| service-shaft-landing | 15.2–16.6 / 49.5–49.7 / 108.1–110.1 | 24.6–25.2 / 58.7–58.9 / 114.4–115.1 |
| infested-workshop | 23.3–23.3 / 55.2–61.7 / 191.4–197.4 | 36.4–36.9 / 59.1–72.7 / 212.9–218.6 |
| swarm-junction | 17.5–20.5 / 58.7–68.7 / 204.5–205.6 | 15.9–22.0 / 70.4–73.7 / 234.5–244.8 |
| shielding-gate | 31.2–32.7 / 67.2–67.9 / 187.1–191.1 | 40.5–40.6 / 65.2–66.0 / 190.7–194.4 |
| containment-annulus | 13.7–13.7 / 87.4–88.6 / 192.0–198.3 | 24.7–24.7 / 90.4–93.1 / 200.4–201.7 |
| manual-control-chamber | 15.6–16.6 / 53.1–53.2 / 160.5–160.7 | 19.8–20.0 / 57.9–58.0 / 164.3–164.3 |
| overload-floor | 14.8–15.8 / 82.3–83.1 / 170.1–170.3 | 16.1–19.2 / 79.2–80.6 / 178.1–179.0 |


Legacy calibration (calm P5 / median / P95; the boss is shown separately in the gallery):

| Legacy template | High | Low | Lowest local median |
|---|---:|---:|---:|
| receiving | 26.8 / 52.6 / 162.2 | 39.1 / 48.1 / 159.9 | 142.6 |
| forklift-loop | 22.9 / 48.8 / 168.2 | 23.5 / 49.3 / 176.2 | 146.5 |
| cold-aisle | 11.7 / 80.8 / 183.7 | 16.2 / 74.4 / 209 | 149.6 |
| freight-crossing | 24 / 55.7 / 164.7 | 21.4 / 47.1 / 170.7 | 141.6 |
| rail-depot | 21.1 / 49.8 / 159.3 | 23.3 / 50.1 / 171.2 | 146.5 |
| cryo-gallery | 10.9 / 97.1 / 189.7 | 14.4 / 66.8 / 207.8 | 147.5 |
| pump-ring | 31.4 / 64.2 / 184.7 | 26.9 / 52.1 / 186 | 127.9 |
| filtration | 25 / 51 / 171.6 | 29.6 / 52.2 / 184.7 | 123.4 |
| specimen-bay | 51.1 / 59.6 / 172.3 | 45.4 / 54 / 184.3 | 141 |
| quarantine-cross | 28.9 / 71.5 / 173.7 | 26.3 / 64.1 / 193.5 | 127 |
| security-lock | 45.3 / 82.3 / 194.4 | 33.7 / 71.3 / 225.9 | 114.7 |
| turbine-hall | 14.8 / 84.1 / 211.4 | 16.6 / 54.3 / 212.6 | 119.6 |
| waste-processing | 31.3 / 80.2 / 187.8 | 12.4 / 59.5 / 223.9 | 135.3 |
| power-conduits | 12.2 / 75.6 / 210.4 | 14.6 / 62.4 / 209.1 | 120 |
| hive-approach | 32.4 / 65.8 / 186.4 | 15.9 / 54.3 / 210.2 | 140.8 |


Marine-local readability passes in every measured calm/kiting story view: minimum74.2. The corrected six manual-console frames replaced their exact fixtures with source90cf8ed; round4-original/ retains the original manifest and displaced PNGs. This is an explicit focused fifth correction after four full rounds, not another full-round claim.

The percentile targets remain approximate, and **not every room is within all three bands**. Larger remaining misses include CrewCheckpoint calm P5≈49–52, Relay calm P5≈36–42, LowArmory calm P95=129.5, LowAnnulus calm P95=148.4, ServiceShaft kiting P95≈110–115 and LowSwarm kiting P95up to244.8. Several calm focal highlights remain below170; CryogenicGallery legacy High median97.1 and SpecimenBay shadow percentiles are too high. The tables expose those limitations. The local-floor guarantee is stronger than a claim of universal histogram compliance.

## Gates

| Gate | Result |
|---|---|
| npm ci | Passed before initial build/capture. |
| npm run verify | 178 files passed,1 skipped;2,282 tests passed,1 skipped. Model-preview2/2 passed; first three Python artifact stages passed. Stops at documented missing Blender in test_monitor_artifacts.py. |
| npm run build | tsc --noEmit + Vite production build passed; existing large-chunk advisory remains. |
| npm run test:room-evidence | 28/28 +33 CPU ragdoll checks passed. |
| npm run test:smoke | Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits. Checkpoint feedback, graphics High/Low and real Arc Shift/Q/F/V flow passed. |
| npm run test:authored-smoke:all (all 20 explicit IDs) | All 20 passed at1280×900 Low, real keyboard move/fire, errors[]. Overload alone uses explicit fatal authorization. |
| Final capture / shaders / lifecycle | Fourth round132 PNGs,0 errors/failures; legacy30 PNGs,0 errors/failures;20 native room shader counters0 after 4 isolated preparation retries; stable recovery cycles (details below). |

Logs live under final gallery gates/. No smoke assertion was changed. Production browser gates used a process-local Playwright launch preload to select the installed Metal renderer, without enabling unsafe SwiftShader; the capture harness independently records the same ANGLE/Apple M1 Pro/Metal GPU. Initial failed attempts are retained separately. The generated texture asset correction restored the existing nine environment-request assertion rather than weakening it. Blender was neither installed nor bypassed; remaining verify-chain gates were executed separately.

## Performance, preparation and lifecycle

**Strict performance acceptance remains unresolved.** The intended isolated runs encountered active test browsers from another worktree. Process evidence (parent working directories and active renderer/GPU processes) is saved in gates/host-contention.txt; no unrelated process or checkout was changed. These are contested-host measurements, not an uncontested regression estimate or a16.6ms certification.

Same heavy frozen fixture,1920×1080,DPR1,Apple M1 Pro/ANGLEMetal,120 sample window after480 RAFs. Values are before→after; frame/render/update in ms. The original renderer was served from the preserved a6b9700 build; the final renderer from90cf8ed.

| Room / tier | Draws | Triangles | Frame avg | Frame P95 | Update avg | Render submission avg |
|---|---:|---:|---:|---:|---:|---:|
| awakening-bay / high | 172→204 | 551038→560830 | 26.944→33.886 | 58.8→67.3 | 0.045→0.047 | 3.179→4.433 |
| relay-racks / high | 170→203 | 288830→299952 | 20.353→33.462 | 48.6→59.3 | 0.036→0.045 | 3.032→3.626 |
| awakening-bay / low | 160→192 | 550315→560107 | 16.597→16.597 | 25.0→25.1 | 0.047→0.054 | 2.920→3.764 |
| relay-racks / low | 158→191 | 288211→299333 | 16.738→16.668 | 25.2→18.2 | 0.041→0.039 | 2.480→3.505 |

All eight before/after heavy fixtures recorded0 new GPU programs. Frozen update cost is not an organic simulation benchmark. Final live Arc+pylon+Overclock,3 seconds of actual RAF simulation:

| Room / tier | Frame avg / P95 | Update avg | Render avg | Update+render avg | Draws / triangles |
|---|---:|---:|---:|---:|---:|
| awakening-bay / high | 35.835 / 91.5 | 1.890 | 7.472 | 9.362 | 257 / 747671 |
| relay-racks / high | 21.188 / 41.6 | 0.415 | 5.187 | 5.602 | 249 / 255554 |
| awakening-bay / low | 16.732 / 25.2 | 1.591 | 3.985 | 5.576 | 142 / 374029 |
| relay-racks / low | 16.664 / 18.2 | 0.371 | 3.651 | 4.022 | 145 / 139409 |

Draw calls stay below350: final short kiting peaks at152 High/141 Low in RelayRacks; these longer live fixtures peak257 High. Low is near60Hz in the recorded cases. High frame pacing is above16.6ms and live Awakening update+render reaches9.362ms, above8ms, on the contested host. **Do not mark the frame/CPU budget gate passed from this evidence.** Repeat both builds and live fixtures on a quiet host and another mid-range GPU; if the misses persist, GPU-profile the world shader/composite and CPU submission before integrating as performance-approved. The screenshot work and value measurement are complete; performance certification is the explicit remaining integration gate.

Native preparation audit:16 rooms passed in the initial run and4preparation timeouts passed when retried alone, all 20 with actual `gl.createProgram` counters at0 during staged combat. The900 RAF settle bound was unchanged. Both audit manifests/logs are retained. No failed scenario was relabeled as a pass.

Final recovery proof: three repeated room cycles each145 geometries/79 textures; after restoration139 geometries/77 textures,1,028 retained programs, contextLost=false and drawErrors[]. Initial144/76 grows once as caches settle, then stays flat. Structural tests cover disposal/reduced-motion/tier transitions too. Timing numbers from the full galleries are excluded from the dedicated benchmark tables; the later discovered external host contention is stated explicitly above.

### Quiet-host acceptance rerun

Run sequentially after other GPU browser work has ended; keep the preserved original build. These commands change only local capture artifacts.

```sh
npm run capture -- --label=g2-perf-before-quiet --dist=/private/tmp/g2-before-dist --dist-source-sha=a6b970085b479bce04feccc1e814c11301ba5c89 --rooms=awakening-bay,relay-racks --scenarios=g1-benchmark-high,g1-benchmark-low --burst=1
npm run capture -- --label=g2-perf-after-quiet --rooms=awakening-bay,relay-racks --scenarios=g1-benchmark-high,g1-benchmark-low --burst=1
npm run capture -- --label=g2-perf-live-quiet --rooms=awakening-bay,relay-racks --scenarios=i2-kiting-high,i2-kiting-low --burst=1
```

## Tests added and existing presentation assertions updated

New systems have cheap structural/lifecycle checks: six-family identities, champion/exposure/rig uniforms, rest-surface fitting cached outside hot paths, emergence/ragdoll handoff, corpse-state reset, five pickup silhouettes, deterministic dressing and supported placement, clipped paint, texture provenance/mean, manufactured bounds/budgets, all legacy palettes, twenty compositions, menu camera/reduced motion/disposal, shared light inventory and bounded shadow bounce.

Existing tests changed; none removed:

- `CommunalGarden.test.ts`: replaces an obsolete exact canopy triangle sum with retained bounded-detail validation; donor geometry, bounds, lifecycle and original32 mesh/8 material/45ktriangle budget remain.
- `NextgenCamera.test.ts`: health bars now assert4px fill/6px backing and family/elite semantic colors. Desktop framing, projection, resize and HUD separation assertions remain.
- `NextgenLighting.test.ts`: replaces old lamp aim/range and low boss-key position pins with forward soft coverage, bounded foot irradiance and an above/front boss key. Local-floor readability checks remain.
- `NextgenPost.test.ts`: enabled composite texture-read budget accounts for the bounded six-tap depth-of-field kernel; disabled path remains one scene read and Low retains no post resources.
- `PracticalOcclusion.test.ts`: shader cache suffix and bounded near-field/shared-shadow tuning; adds retained-uniform dark-surface bounce coverage. Original Three light ordering, dynamic-slot exemption and finite shadow behavior remain.
- `SceneLighting.test.ts`: replaces exact old lamp24/4.8 constants with bounded foot illumination and3m coverage. Recovery, topology, disposal and fixed-light inventory assertions remain.
- G2's newly introduced composition test key ceiling changed 2→2.5 after the cargo/transmission calibration reached2.1; finite offsets and twenty unique ideas remain asserted.

No smoke, game, input, UI, audio or ability-VFX source was modified. No gameplay/determinism/persistence/accessibility/navigation/safety invariant was removed.

## Integration requests and honest gaps

No required foreign-file code hook. Required acceptance follow-up: quiet-host High frame/CPU certification, as detailed above. UI's title redesign can continue to use `render(game,dt,true)`; the left45% remains reserved. Its current large scan diagram/veil sits over the rendered characters and is intentionally untouched.

This is a substantial renderer-content pass, not an AAA content replacement. The existing GLB topology and animation library still show at close range. Embedded seams, tint, crests and cool rims improve identification but cannot provide six bespoke creature remeshes. Foliage is smooth clustered stylization, and many machine bodies retain broad blockout masses. Spawn is a short pooled emergence with existing breach light; frost/char/acid add surface death variety, not a bespoke mesh-shatter animation. Queen intro/defeat use renderer staging and existing rig motion rather than a fully authored cinematic performance. Practical shadowing shares the key's visibility rather than tracing each practical, and reflections remain static low-resolution probes. Some repeated manufacturing grain remains visible despite removing the old brick texture.

Performance figures above are measurements on the recorded M1 Pro/Metal setup. They do not establish a strict worst-case16.6ms certification or another mid-range GPU result. Exact percentile misses and any unresolved gates are called out above. Recommended next content work is authored creature/Queen animation and topology, followed by foliage/prop material atlases and a separate live organic-combat GPU certification.
