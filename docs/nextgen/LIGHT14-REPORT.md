# LIGHT14 — value hierarchy across the twenty-room route

Implementation branch: `t3/complete-twenty-room-lighting`. Parent: `76a48c2bb43db7a927427edbbdd4415d4e2b0848`. Room-by-room decisions and opened-frame observations: `plans/LIGHT14-review.md`.

## Changes

Seventeen room profiles join the three LIGHT13 standards. Each supplies three explicit native fixture/landmark centres after the authored fight circle, exit gain, floor/wall values, tint, neutral fixture scale and practical/ambient gains. The deck bake and analytic surface field consume the same centres. No simulation, encounter, difficulty, camera, UI, model-generation or ability-effect code changed.

Crew has explicit inspection/scanner/gallery centres and tighter pool radii. Practical bounce uses a soft elliptical footprint; floor aperture transitions are broader. Creature material rims are thinner and weaker, with dark cool contours replacing the pale/bronze contour treatment. Marine top-facing armour receives broader saturated rig tint; existing weapon materials receive a small shared-uniform rig band. Marine ink retains its contour over hot fills. Existing material preparation and batching cache ownership remain intact. No lights, passes, textures or meshes were added for these changes.

These shared corrections are **partial art completion**, not a claim that all LIGHT13 weaknesses are solved: Crew's central floor still reads as a grey slab; Freight retains an east-edge bright shape; rig colour remains pale after tone mapping at 480×270. Those need further art work.

## Evidence

`artifacts/nextgen/light14-final/index.html` contains twenty-calm/twenty-kiting sheets, copied final7 reference sheets, all 16 abilities on pale/dark floors at impact and sustained phases, and three Low rooms/title. Native sources are under `raw/` and per-room review captures under `room-reviews/`. `before-final7/` is historical comparison, not an exact parent render. `raw/first-permitted/` is the exact parent Awakening calm capture. `relocated-sources.json` records original capture locations; unchanged manifest paths may retain their original locations.

All 17 new rooms were built, captured and reviewed before their individual commits. Calm, tour03 and heavy reductions were opened for every room; Awakening/Passenger included all tour marks. Crew heavy was also opened at native size. A seventeen-exit contact from each retained tour 05 was opened at original size: chevrons, door faces and local exit pools remain visible. Both twenty-up sheets and both final7 references were opened. Canonical ability capture produced 228 PNGs: seven phases ×16 abilities ×2 rooms, plus title and three Low views. All16 were opened at phases 03/05 in both Annulus and Workshop. No grade/bloom thresholds were changed; ability effects retain localized cores without a broad white wash.

Manual Control has a retained existing fixture defect: ordinary G6 fails the fatal-warning HUD-safe guard; the documented DRESS13 variant passes frame01 then fails later. The sheet explicitly labels the first verified DRESS13 frame. Both failed parents remain under `raw/`; no camera/guard change was made. The final7 DEFECTS log already identifies this exact missing kiting burst. The twenty-up sheet is not a successful twenty-room four-frame G6 certification.

Low Awakening/Freight/Swarm retain room identity, marine and HUD readability. Pickups, exits, cover and onboarding text remain visible in the opened room/ability frames. Title/gameplay still endpoints have compatible dark values; these stills do not establish the animated transition's perceptual quality.

## Verification

- `npm ci`: passed.
- Production builds: passed for every room and shared correction; final build passed (normal Vite chunk-size advisory).
- Standard Cryo/1729 campaign: natural death in Armory after 5 rooms cleared, 0 errors.
- Story Cryo/1729 campaign: natural death in Diagnostic Gallery after 10 rooms cleared, 0 errors.
- Four-room benchmark: completed 12 parent + 12 LIGHT14 + 4 parent recheck trials. High/Cryo, fixed resolution 1.0, 10-second trials; parent rebuilt separately under `baseline-runtime/` from the original tracked runtime source. Current source was restored immediately; active production dist was untouched.
- All 28 trials: 0 runtime errors and 0 combat shader compilations. All three bench commands exit 2 because Freight already exceeds 350 draw calls / 330 headroom on both parent and LIGHT14 (parent 585–599; LIGHT14 570–599; recheck 583). These budgets were not changed.
- Host has 10 logical cores. One-minute load drifted 67.3→21.8 through the initial parent run; candidate 16.7–26.6; parent recheck 16.7–24.3. Frame/GPU times broadly overlap and the parent recheck reproduces candidate CPU ranges. No clear added frame-time cost is established, but small-cost neutrality is **not certified** on this loaded host. Screenshots and fixed-step campaign timings are not hardware FPS evidence.

Median of the three trial p50s, milliseconds (parent → LIGHT14):

| Room | Frame | GPU elapsed | CPU submission |
|---|---:|---:|---:|
| Crew |24.70 →24.80|43.08 →44.30|13.30 →13.90|
| Freight |23.70 →23.70|38.98 →39.55|12.10 →13.30|
| Relay |23.70 →24.40|40.20 →40.66|12.70 →13.30|
| Swarm |23.90 →23.80|39.90 →39.77|10.70 →11.20|

Raw trials, load, budgets and the bracketing parent recheck are retained in `bench-before/`, `bench-after/`, `bench-before-check/`; `benchmark-comparison.json` and its PNG summarize them. Candidate benchmark's short source alias `1ec4d903` resolves to runtime implementation `1ec4d90324f9cafd800f6bd5589a145a393a1804`. Later commits contain gallery/report changes only.

## Weakest rooms

Crew Checkpoint (grey centre), Freight Hold (bright east edge), Containment Annulus (broad pale circulation), Communal Atrium (dark canopy), Overload Floor (nearly black secondary growth in tour). Marine rig hue still needs stronger480 identity. Manual's historical warning/HUD fixture defect remains.
