# R8 — fourth independent verdict, on the wave-5 build (2026-11-13)

Scores (R6 → R7 → R8): first impression 6 → 6 → 6 · UI/UX 7 → 7 → 8 · combat readability 4 → 6 → 6.5 · environments 5 → 6 → 5.5 ·
ability spectacle 5 → 5.5 → 5 · cohesion 5 → 6 → 6.
Calibration: "advanced prototype visually, with polished-indie interface work". "Could ship as a free browser game today: yes, on presentation
grounds" — reviewers would praise the interface and build systems and criticize sparse arenas, repetitive lighting, inexpensive-looking flames
and an underwhelming boss. Measured: High holds 60 fps (p50 16.7 ms, p95 ≤ 18.2 ms, 80/80 trials), room prep ≤ 2.45 s, 3,411 tests green.

Lead's reading: three art passes of code-authored geometry/effects have plateaued (environments and ability spectacle have not moved).
The class of work must change, not the effort: bring in artist-authored, clearly licensed (CC0) asset kits and effect textures and restyle
them through the ink/banded pipeline (Wave 6).

Remaining defects (images under `artifacts/nextgen/final3/`):
- C1 S1 rooms read as machinery displayed in empty rooms; infestation sits on machines (combat-calm-residential-gallery.png, combat-calm-infested-workshop.png).
- C2 S1 title/ending illustration below the interface's standard: stiff schematic marine, cartoon alien, simple broken ship (title.png, complete-fixture.png).
- C3 S1 camera gives screen to the outside of the room; marine too small in late rooms (organic/arc-r13-coolant-plant-mid.png, organic/arc-r18-containment-annulus-mid.png).
- C4 S2 HUD fade ghosts ammo/cooldown numerals (organic/pyro-r6-armory-mid.png, g2-kiting-low-overload-floor-04.png).
- C5 S2 frozen crowds homogenize enemies (combat-kiting-breached-loading-bay-04.png, combat-kiting-passenger-vault-04.png).
- C6 S2 Queen weak point looks like an attached badge (g2-queen-exposed-reactor-vault-04.png, combat-calm-reactor-vault.png).
- C7 S2 Pyro flames are flat ribbons pasted on the scene (v2-full-pyro-infested-workshop-infested-workshop-04.png).
- C8 S2 repeated light stamps flatten the ten moods (combat-calm-relay-racks.png, combat-kiting-shielding-gate-02.png).
- C9 S2 Whiteout and Overclock lack an ultimate-level state change (v2-whiteout-awakening-bay-04.png, v2-overclock-awakening-bay-04.png).
- C10 S2 small enemy families collapse into floor insects (g5-silhouettes-containment-annulus-02.png, organic/arc-r20-overload-floor-mid.png).
- C11 S2 Bulwark resembles furniture; Glacier folded geometry (v2-bulwark-awakening-bay-04.png, v2-glacier-awakening-bay-04.png).
- C12 S2 shop shows meaningless 100,000 maxima and a no-benefit card (shop.png).

Strong: rig selection, upgrade cards, hostile charge markings, Arc chains, pause/checkpoint communication, controls screen.
