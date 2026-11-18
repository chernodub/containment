# LIGHT14 — landmark correction across twenty rooms

Branch: `t3/complete-twenty-room-lighting`. Correction base: `450fa1e0` after `git merge nextgen` (boss creatures and Overdrive changes retained). Room-profile implementation: `4064242e`; final bounded shader: `2e24807c369b463c7b216b00ee7dd28a316cbd3a`. Twenty individual room commits and opened-frame notes are recorded in `plans/LIGHT14-review.md`.

## Result and scope

Every room, including the three LIGHT13 standards, now has a bounded landmark source: position, hue, radius, body self-light, deck spill and an existing pooled practical slot. The shader gives source emitters life, preserves saturated red/green status hues, and adds a faint wall-foot wash. Marine/actor grading is unchanged by this correction. No simulation, encounters, difficulty, camera, UI, model-generating or ability-effect modules changed; no grade/bloom thresholds changed.

The source reuses one of the existing four practical slots, retained on Low. No lights, draws, meshes, passes or textures were added. The material/batching cache key changed together; shared room uniforms reset on room load and remain excluded from actor materials. Initial GPU samples prompted a cost simplification: body/emitter arithmetic is skipped when its existing body weight is zero. The room and batching cache keys advance together to v12. Opened Crew/Coolant calm and Swarm heavy reductions plus native Coolant retain the same appearance. The twenty-up sheets and Low frames predate this mathematically equivalent bound; follow-up frames are under `raw/bounded/`.

Awakening cryo banks are cyan; Passenger drawers periwinkle; Residential cabins amber; Atrium foliage green under a cool key; Checkpoint gate ice blue; Armory carousel white; Freight gantry sodium; breach pod cold blue; Relay racks cyan; uplink signal blue; Diagnostic probe cyan; Safety bank warm amber; Coolant turbines frost teal; shaft below-light green; Workshop machinery violet; Swarm heart pink-violet; Shielding emitters lavender; Annulus ring cool teal; Manual instruments warm; reactor orange with deck spill toward combat. Sources were tightened or moved after review where the first result lit the floor or the wrong asset area.

## Visual evidence

Current gallery: `artifacts/nextgen/light14-final/index.html`. Current sheets and native sources: `landmark-correction/` beneath that root. `twenty-source.json` records every selected frame, parent manifest, source SHA and retained failures. `relocated-sources.json` maps per-room capture parents to their final locations. Each room index includes a colour/greyscale previous/current calm pair and native source links; previous images are historical LIGHT14, not an exact new render of 450fa1e0.

All twenty rooms passed their individual build and seven-frame native review batch (calm, five tour marks, one heavy frame); each had 480×270 colour/greyscale reductions and a native frame opened before its room commit. The resumed pass finished Coolant through Manual Control after the restart. Coolant was tightened to light the turbines rather than spread a green floor wash; Swarm body fill was reduced to retain shell relief.

Both current twenty-up sheets were opened in colour and greyscale against previous LIGHT14 sheets; both final7 historical sheets were opened too. The correction restores visible landmarks without returning to final7's bright general deck lighting. Separate twenty-landmark sheets use labeled entry or selected tour views where a set piece is outside the spawn/kiting camera. The prior first-pass ability, pickup/exit and benchmark evidence remains in the gallery as historical evidence.

The long all-room batch suffered a screenshot timeout in Shielding, then lost its debug page for some late views. Fresh Shielding/Annulus kiting, Manual calm and Overload calm captures supplied the replacements. Failed parents remain retained. Manual still fails the pre-existing complete-warning HUD-safe guard in ordinary G6 and later DRESS13 frames, as final7 also documented. Its kiting cell explicitly uses the first verified current DRESS13 frame. This is a twenty-room art comparison, not a successful twenty-room four-frame G6 certification. No guard or camera behavior was changed.

Low Atrium, Relay and Overload passed and were opened in colour/greyscale; Atrium was also opened native. Their landmarks stay visible with distinct colours. Low's unshadowed canopy is paler: a manually selected native canopy ROI has sRGB Rec.709 p98 163 versus marine ROI p98 202 (not radiometric luminance or a full-image segmentation). HUD, warning text, route feet, cover and exit chevrons remain readable in the reviewed frames. Far corners/voids remain black; the lit playable approach retains deck seams and boundary feet.

## Verification

- Final production build: passed (normal Vite chunk-size advisory).
- Profile-revision Story Cryo/1729 campaign (`4064242e`): completed all twenty rooms, 0 errors and 0 defects; unassisted, normal rendering, 3213.3 wall seconds. Native report/trace/screens are under `landmark-correction/campaigns/story/`.
- Final bounded-shader Story Cryo/1729 (`2e24807c`): completed all twenty rooms, 0 runtime errors; unassisted, normal rendering, 1727.4 wall seconds. Command exits 1 for one medium performance defect: Manual Control loading exceeded 5s (first flagged at 5.135s; full recorded hold 6.060s). Report/trace/native frames: `landmark-correction/campaigns/story-final/`.
- Earned Annulus-boundary continuation diagnostic aborted before new gameplay: the existing runner asserts native difficulty as Standard while expecting the inherited Story difficulty. Its one runner error and inherited loading flag remain under `campaigns/late-recheck/`; it is not substituted for either complete campaign. No runner, difficulty, checkpoint or loading-limit code was changed.
- Current benchmark: sixteen ten-second trials (one per room/source), Cryo High, fixed 1.0 resolution, on ten logical cores. Four rooms × initial baseline `450fa1e0`, initial candidate `4064242e`, bracketing baseline recheck, final bounded `2e24807c`. All 16 have 0 runtime errors and 0 combat shader compilations; light/program inventories remain stable.
- Trial start/end one-minute load ranged 17.9–51.8. Initial candidate GPU samples exceeded both baseline samples, prompting the bounded shader. Final frame medians match or slightly improve on the initial baseline. Final Relay GPU remains higher; one short trial per source on this shared host does **not certify small GPU-cost neutrality**.
- Candidate benchmark commands exit 2 for the existing Freight 350/330 draw limits: initial baseline 580, initial candidate 578, baseline recheck 588, final 591. Baselines use the explicit baseline flag; their raw draw counts/budgets remain retained. No budgets were changed.

P50 milliseconds, initial baseline → final bounded source:

| Room | Frame | GPU elapsed | CPU submission |
|---|---:|---:|---:|
| Crew Checkpoint |25.00 → 25.00|49.01 → 47.93|14.90 → 13.80|
| Freight Hold |24.80 → 24.80|44.04 → 44.54|13.30 → 13.00|
| Relay Racks |25.00 → 25.00|44.99 → 47.75|12.90 → 11.90|
| Swarm Junction |24.90 → 24.80|44.56 → 45.11|11.50 → 11.60|

`landmark-correction/benchmark-comparison.png` / JSON retain all four series and loads; raw datasets are `bench-before/`, `bench-after/`, `bench-before-check/` and `bench-bounded/`. `before-dist/provenance.json` describes the isolated baseline build. Screenshots and fixed-step campaign timings are not hardware FPS evidence.

Runtime/capture failures are retained explicitly; late capture timeouts coincided with host one-minute load around 643–739 on ten logical cores. This correlation does not prove a game-code cause or certify hardware performance.

## Weakest rooms and limits

Crew Checkpoint still has a broad grey centre. Containment Annulus has pale circulation and a ring partly outside the spawn view. Freight Hold has a broad amber floor and its gantry reads best from the tour. Marine rig hue is still weaker than plate-value identity. Existing vapour/sparks are subtle; this pass adds source life to existing surfaces rather than new particle systems. Manual's historical warning/HUD fixture defect remains, and the final campaign recorded its six-second preparation hold; the boundary continuation helper could not recheck it because of its startup difficulty assertion.

The original pass's Standard/Story campaigns, sixteen-ability pale/dark impacts and 28 benchmark trials are historical, before this correction and the merged boss/Overdrive content. Their reports and raw data remain in the gallery root under `campaigns/`, `raw/`, `bench-before/`, `bench-after/` and `bench-before-check/`. They are not substituted for current verification. Original bench Freight draw-budget misses and contested-host timing limitations remain documented in `benchmark-comparison.json` and repository history.
