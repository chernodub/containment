# R9 — fifth independent verdict, on the wave-6 build (2026-11-14)

Scores (R6 → R7 → R8 → R9): first impression 6 → 6 → 6 → 6 · UI/UX 7 → 7 → 8 → 8 · combat readability 4 → 6 → 6.5 → 7 ·
environments 5 → 6 → 5.5 → 5.5 · ability spectacle 5 → 5.5 → 5 → 5.5 · cohesion 5 → 6 → 6 → 6.
Calibration: "advanced prototype, with a polished-indie interface"; "could reasonably ship as a free browser game today";
"impressive for a browser game" is plausible, "looks like a premium commercial action roguelike" is not yet supported.
Measured on the frozen build: 80/80 bench trials pass (frame p50 16.7 ms, worst High p95 18.2 ms, adaptive scale ≥ 0.90, 289 draws),
room preparation median 0.76 s / worst 2.02 s, ~3,500 tests, 20/20 authored rooms, bot campaigns: 3 endings + 1 death, zero errors.

Biggest blocker now: **enemy art** — the dominant family reads as off-white trapezoid shells over tangled dark limbs ("repeated white pennants"); the Queen lacks a focal design.

Remaining defects (images under `artifacts/nextgen/final4/`):
- D1 S1 dominant enemy = pale shell + thin limbs (combat-kiting-residential-gallery-03.png, c6-silhouettes-containment-annulus-03.png).
- D2 S1 floors read as arena diagrams: nested rectangles, stencils, props on rectangular bases (combat-calm-residential-gallery.png, combat-calm-transmission-chamber.png).
- D3 S1 Queen: no head/sensory cluster, smooth plates, exposed cavity reads as a bowl/flower (boss-reactor-vault-01.png, g2-queen-exposed-reactor-vault-04.png).
- D4 S1 sustained ultimates look like ordinary statuses (v2-whiteout/meltdown/overclock-awakening-bay-06.png).
- D5 S2 infestation = flat lavender coverage (combat-calm-infested-workshop.png, combat-calm-swarm-junction.png).
- D6 S2 sectors share a blue-gray baseline (combat-calm-relay-racks.png, combat-calm-crew-checkpoint.png, combat-calm-shielding-gate.png).
- D7 S2 landmarks get more screen than the encounter (organic/breacher-r18-containment-annulus-mid.png, organic/arc-r7-freight-hold-mid.png).
- D8 S2 VFX languages clash: photographic explosion sprite; Seismic Slam's stone debris (organic/pyro-r20-overload-floor-mid.png, v2-seismic-slam-awakening-bay-03.png).
- D9 S2 acid pool lacks hostile boundary (boss-reactor-vault-01.png).
- D10 S2 title marine drawing: rigid elbows, grip, stance (title.png).
- D11 S2 "Need clear ground" shown in the HUD slot, not at the cursor footprint (organic/cryo-r1-awakening-bay-mid.png).
- D12 S2 in-play marine identical across rigs (rig-select-pyro.png vs organic/pyro-r1-…, organic/cryo-r1-…).

Strong: interface system, rig selection, shop, hostile attack lanes through friendly effects, marine/cursor anchors, Glacier, reactor landmark.
