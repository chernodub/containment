# R10 — sixth independent verdict, on the wave-7 build (2026-11-15)

Scores (R6 → R7 → R8 → R9 → R10): first impression 6 → 6 → 6 → 6 → 7 · UI/UX 7 → 7 → 8 → 8 → 7.5 · combat readability 4 → 6 → 6.5 → 7 → 7 ·
environments 5 → 6 → 5.5 → 5.5 → 5.5 · ability spectacle 5 → 5.5 → 5 → 5.5 → 6 · cohesion 5 → 6 → 6 → 6 → 6.5.
Calibration: "advanced prototype overall, with several interface screens already at polished-indie quality"; shippable as a free browser game;
"ambitious for a browser game; not competitive with the strongest premium genre releases". Enemy families now listed among the strengths.
Measured: 3,852 tests; 77/80 bench trials (Freight/Breacher High p95 ≈ 24 ms misses — regression to fix); prep worst 1.7 s; campaigns 15/20/16/17 rooms, 0 errors.

Biggest blocker: **the playable world looks assembled from modular arena pieces rather than authored as an inhabited, dying ship.**
Lead's reading: environments have scored 5–6 through four dressing passes because the ROOMS THEMSELVES are open rectangles with a few obstacle
islands; dressing cannot fix layout. Wave 8 lifts the "never change collision" rule for a deliberate level-architecture pass.

Remaining defects (images under `artifacts/nextgen/final5/`):
- F1 S1 floor dressing recipe (flat polygon + confetti + bar) repeated everywhere (combat-calm-crew-checkpoint.png x1050–1690,y500–720).
- F2 S1 landmarks get the screen, fights sit at margins (organic/arc-r18-containment-annulus-mid.png, organic/cryo-r20-overload-floor-mid.png).
- F3 S2 Flashfire = separated yellow blobs (v2-full-pyro-containment-annulus-containment-annulus-04.png).
- F4 S2 ten moods differ in hue more than spatial lighting character (lighting-ten-grayscale.png, combat-calm-manual-control-chamber.png).
- F5 S2 infestation decorates equipment islands (combat-calm-swarm-junction.png).
- F6 S2 idle placement footprints too prominent / wrong color (organic/cryo-r4-communal-atrium-mid.png).
- F7 S2 Overclock rectangular scanline fields + multiple bright afterimages (v2-full-arc-containment-annulus-containment-annulus-04.png).
- F8 S2 Whiteout communicates radius, not blizzard (v2-whiteout-awakening-bay-04.png).
- F9 S2 ink: small world surface edges compete with contours (combat-calm-awakening-bay.png).
- F10 S2 combat HUD: narrative paragraph + build inventory too prominent in fights (organic/breacher-r11-diagnostic-gallery-mid.png).
- F11 S2 effect family vs set membership not taught (starting-boon.png; Reactor badge in organic/arc-r18-…).
- F12 S3 rig portraits share one silhouette (rig-select-pyro.png, rig-select-arc.png).
