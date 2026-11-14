# I10 bounded floor architecture: R1 visual review

Reviewer: `/root/license_audit`. This is a historical R1 review, not final acceptance of the pending R2 floor-value candidate. No browser, capture, benchmark, or application edit was performed during this review.

## Sources and actual-open evidence

Before: application `2d644e1f02bb7daa6c41ea17634d2ea3ae6bd54d`, `artifacts/nextgen/i10-deck-before-{1080,720}/`.

After R1: application `8307da8e0cf4d5cacc84a9479aa8ca5b8528862d`, `artifacts/nextgen/i10-floor-trial-{1080,720}/`.

For each source and resolution I actually opened and emitted all 24 assigned original PNGs at `detail: original`, and their exact 480×270 reductions: four calm and four kiting phases in each of Residential Gallery, Crew Checkpoint, and Transmission Chamber. That is 96 original PNGs plus 96 reductions across both sides and sizes. Preparation alone is not counted as viewing. The four ledgers each contain 24 distinct original/reduction path and SHA256 pairs:

- `artifacts/nextgen/i10/license-review/i10-deck-before-1080/actual-opens.json`
- `artifacts/nextgen/i10/license-review/i10-deck-before-720/actual-opens.json`
- `artifacts/nextgen/i10/critical-reviews/floor-trial-license-1080.json`
- `artifacts/nextgen/i10/critical-reviews/floor-trial-license-720.json`

Common reductions live under `artifacts/nextgen/i10/license-review/<capture-folder>/480/`. These ledgers preserve the captured source SHA; R1 must not be relabeled R2. A future review bridge requires both original and reduction hashes to match a witnessed pair exactly.

## Actual visual assessment

The three calm-room treatments improve the broad blank central deck at both native sizes and at 480×270. Residential's framed access covers share a continuous spine and feeds toward the cabins; Crew's bounded inspection apron connects to the checkpoint gate; Transmission's three covers return toward the existing trench. Their larger shapes remain distinguishable after reduction and make these views read as planned functional areas.

This is flat graphic infrastructure. Residential and Transmission repeat rectangular covers; the color bands suggest framing and ribs but do not create convincing recessed depth or AAA environmental complexity. The intervention resolves the observed blank-field composition locally, not every possible camera view in the entire room. Existing furniture, cabins, gate and dish remain the primary volumetric landmarks.

In the reviewed combat shots the marine keeps a recognizable pale helmet/shoulder mass, weapon and separated bent legs. New floor geometry does not cover anatomy. Crew's apron remains subordinate beneath the frost volume and orange hostile discs: particularly `combat-kiting-crew-checkpoint-02.png` through `04.png` in both sizes retain distinct orange threats beside the marine. At 480×270, primary health/ammo/cooldown numerals remain readable as the HUD panels fade. Small subordinate explanatory text is not equivalently readable at that reduction.

Frozen large families retain overall size, head profile and limbs rather than becoming white rectangles, while the small green families remain distinct. Repeated pale heads and dense thin legs still merge in the crowd; actor-to-actor overlap and peripheral/nonfocused crops remain presentation qualifications. The flat architecture introduces no new overhead or tall dressing occlusion in these views.

Transmission kiting is staged on the northern/opposite side of the dish/racks. The new western access covers are largely outside that camera view. Its four combat phases therefore support nonregression, not a claim that the new architecture improved that particular combat composition. The marine stays visible between the dish equipment and the crowd; orange hostile discs remain recognizable over the blue friendly ice in phases 02 and 04.

Before/after native input poses are not always pixel-identical. For example Crew 1080 phase 04 has a different marine vertical position, and Residential 720 phase 04 differs horizontally. These captures support comparative composition/readability, not a deterministic pixel-only causal comparison of the geometry change.

## Geometry and test scope

The implementation is limited to the three observed rooms in `KitDeckArchitecture.ts`, called through the existing floor painter. It adds no mesh, material, draw, asset, light, collider or gameplay state. The highest floor-only overlay is 0.021 m, below the 0.022 m cap and existing combat decal surfaces. Each affected room is bounded by 800 additional triangles; legal floor, void and obstacle sampling remains delegated to the existing painter.

The five focused CPU tests passed after formatting/type correction (1.38 s reported by that run), covering deterministic legal geometry, height and triangle bounds, unaffected-room no-ops, whole affected kit triangle totals below 30,000, material counts and disposal. Existing scoped KitFloorSurface/RoomKitDressing checks previously passed for the three affected rooms. No presentation pin was rewritten. The parent separately ran TypeScript and the combined R1 build successfully.

The parent's/soft agent's full R1 floor-value audit places these three rooms' calm and combat samples inside the requested bands at both resolutions. This does not establish all-room value acceptance: unrelated Annulus 720 calm and Freight 1080 combat samples require R2. No all-room band-pass claim is made here.

## Recommended comparison frames

- Residential: `x2-calm-motion-high-residential-gallery-01.png` in each before/after size shows the previously broad blank deck and connected cover pattern clearly.
- Crew: `x2-calm-motion-high-crew-checkpoint-01.png` shows the functional apron; `combat-kiting-crew-checkpoint-03.png` shows hostile-disc precedence and marine body readability over it.
- Transmission: `x2-calm-motion-high-transmission-chamber-01.png` shows the linked access covers, trench and dish composition. Its kiting shots are useful nonregression evidence but not showcase proof of the new covers.
