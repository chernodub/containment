# I8 — integration and acceptance

Branch **t3/integrate-visual-overhaul**. Measured combat application HEAD **5d47065d74be5fccd3ac9b5eaff4c936fb122d3f**; frozen bytes: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/budgeted-dist`. Evidence harness HEAD at campaign start: `c50a250ef7e91a176222c130cfa81d6f952dff31`. Final gallery/application HEAD is **21e0859fbb0fa488b5a29b3ef23d3f4be5250fa8**. Only four title-armor lines differ from the measured source: both detached shoulder pieces are removed, retaining two fitted back plates and the same three merged draws. Combat, camera, materials, post, lights and simulation are unchanged; the exact diff is `artifacts/nextgen/i8/title-only-runtime-diff.patch`. Full desktop gates are repeated on the final title source. The 80-trial cohort and four campaigns retain their actual 5d provenance; no old pixels are relabeled. All work stays local in this worktree. No push, PR, other-checkout modification, mobile work, new runtime dependency, asset-license change or balance change.

## What shipped

- Requested V4→G4→G3 merge order, preserving per-ability constructions, local priority mask, industrial form kit, real actor footprint, camera safe inset, authored title/Queen, packed HDR/MRT ink, banded shading and adaptive resolution.
- Complete native graphics controls: **Ink outlines: Off / Silhouettes / Full**, **Adaptive resolution**, **Stylized shading**, labels/hints, persistence and context recovery on each tier/mode. Settings fit desktop 1280×720 and 1920×1080. Projection/clearance hooks continue reading native camera/CSS coordinates when internal targets resize.
- Graphite marine with rig panels/identifiers; the cyan-white skin overlay is now genuinely occlusion-only, borrowing current scene depth using native viewport UVs. Low's forward path retains greater-depth occlusion. It adds no target/draw/owned texture and composites before hostile warnings/projectiles.
- Enemy native texture sampling replaces actor mip-bias softening; narrow three-band response and russet/moss/dark-body+pale-plate/navy/plum family palettes retain acid sacs, brood accents and crests. Full geometry identity silhouettes use 3px bold ink, stronger major form lines and a quiet local light rim for very dark backgrounds. Status droplets and friendly effects preserve the actor geometry attachment, including opaque droplets: they no longer punch holes into actor IDs.
- Native warnings read authoritative pendingAttack/windupMs. Charge capsules match unchanged 330×.65 sweep and enemy radius, clipped against authored blockers; Spitter uses its radius 9 locked aim marker instead of duplicated large circles. Progress fills follow the simulation; resolution, cancellation and death remove the warning immediately. Shared constants only relocate existing values. V4 consumes those retained shapes plus the Queen warning.
- Cryo Nova keeps its first 100ms impact, then narrows/lowers the front; Frost Trail and Whiteout settled interiors yield much more, retaining edges/storm currents and local priority. Title uses cloned shared graphite body shading, fitted physical plates/gaskets/rig strips, controlled cyan rim, plum emerging creature/hot eyes and one emergency shaft. Menu-only right-half exposure rises 65%, leaving left 45% calm. A subsequent native review caught an off-body shoulder plate; both shoulder pieces were removed before the final gallery, retaining fitted back armor.
- Dominant props use shared lighter tops/dark sides, bevel/seam/trim and graphic details; Armory has one added worktop finish. Existing batches/material/footprint/disposal limits remain. Floors receive no screen-space ink.

## Conflicts and resolutions

1. V4 merge `c558c06`: README/scenario append conflicts retain U4 and V4 additions.
2. G4 merge `2f23497`: additive README/fixtures; renderer retains V4 priority/status ownership while adopting G4 camera/title/HUD-danger geometry, real radius/height and Queen warnings.
3. G3 merge `9a48125`: all imports/contracts retained; new and borrowed enemy/Queen/nest models receive separate IDs, including elite classification. Acid retains G4 order 29 and G3 exclusion. Inspection receipts combine U4/G4/G3 proofs; settings use actual union choices. Queen role pin is bounded to preserve G4 abdomen behavior.

## Art iterations and before/after evidence

Initial merge critique rejected the cyan ghost, Armory slab, weak dark-room Stalker and small title threat. Round 1 palettes/props improved forms; Round 2 fixed the real unconditional HUD skin; Round 3 bounded ink cost without losing the new forms. The lead's later review rejected soft bodies, pale title, excess/stale circles and Cryo sheets. The final round removed the MRT overwrite, restored native sampling/narrow bands, tied warnings to native clocks and thinned settled Cryo interiors. Plan/critique record: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/docs/nextgen/plans/I8.md`. Old in-progress final2 captures are preserved as `pre-lead-final2*`, with their original PNG bytes; the new final2 is a fresh capture.

| Requirement | Before | After |
|---|---|---|
| Marine | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-before/combat-calm-communal-atrium.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-calm-communal-atrium.png |
| Native enemy edges / Cryo interior | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/pre-lead-final2-rooms/combat-kiting-armory-02.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-kiting-armory-02.png |
| Dark status contours | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/pre-lead-final2-rooms/combat-kiting-infested-workshop-03.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-kiting-infested-workshop-03.png |
| Bright family palette | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-before-families/i8-families-containment-annulus-01.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/i8-families-containment-annulus-01.png |
| Dark family palette | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-before-families/i8-families-infested-workshop-01.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/i8-families-infested-workshop-01.png |
| Warm family palette | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-before-families/i8-families-overload-floor-01.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/i8-families-overload-floor-01.png |
| Armory form breakup | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-before/g4-forms-high-armory.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-calm-armory.png |
| Title | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/pre-lead-final2-ui/title.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/title.png |
| High corpse-retention trade | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-corpse-before2/i8-corpse-budget.png | /Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-corpse-after/i8-corpse-budget.png |


Exact source-pixel 600×400 crops and title/gameplay consistency: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/native-crops/native-before-after.png` with coordinates/provenance in its manifest. Retention trade pair: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/corpse-budget-before-after.png`. Bright/dark/warm family fixture uses 15 legal spread native actors across five families, including elites/champions; it is staged recognition evidence, not a balance certificate. Both native and exact 480×270 frames are retained.

## Gates

`npm ci` passed in this worktree.

**280 test files passed, 1 skipped; 3262 tests passed, 1 skipped.** Model preview 2/2; room evidence 28/28 plus 33 ragdoll checks. Production build, desktop smoke, explicit twenty-room authored smoke and three-room playtest smoke pass. Native mouse/keyboard, resizing, checkpoint feedback, audio and graphics recovery assertions are preserved.

`npm run verify` exits 1 only at the documented missing Blender executable (`FileNotFoundError`). The Python asset chain stops there; later Python checks are not claimed as run. Blender and the asset tests/GLBs were not altered. JavaScript gates were then run separately through the serialized driver.

| Gate | Exit | Seconds | Load1m start → end |
|---|---:|---:|---:|
| verify-mounted | 1 | 187.5 | 73.2 → 116.4 |
| build-mounted | 0 | 7.0 | 116.4 → 115.9 |
| room-evidence-mounted | 0 | 1.0 | 115.9 → 115.9 |
| smoke-mounted | 0 | 100.6 | 115.9 → 107.0 |
| authored-twenty-mounted | 0 | 358.7 | 107.0 → 29.6 |
| playtest-smoke-mounted | 0 | 56.2 | 29.6 → 35.5 |
| rooms-mounted | 0 | 67.1 | 35.5 → 25.1 |
| bench-budgeted | 0 | 1298.4 | 20.8 → 11.9 |
| bench-budgeted-extra | 0 | 799.9 | 11.9 → 84.3 |
| profile-budgeted | 0 | 53.7 | 84.3 → 87.3 |

Authored wall time includes an intentional gate-driver hold after its browser had closed, until Cryo finished, to isolate the subsequent room audit. Original timing is retained; see `mounted-gate-hold.txt`.

Final source gate receipts: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/logs/acceptance-mounted.json`; combat benchmark receipts: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/logs/acceptance-budgeted.json`. The driver supplies the explicit twenty-room list to `npm run test:authored-smoke:all`; the package alias otherwise retains the smaller default. All twenty authored receipts have errors[]; screenshots live in `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/authored-smoke/desktop` because the package script's first `--out` wins. Failed stale mocks/presentation attempts remain separately retained, followed by passing rechecks.

## Performance acceptance and changes

**80 native sustained trials: 48 primary + 32 supplemental, five per case, one exclusively owned benchmark browser.** Every median reports 16.7ms; High p95 17.9–18.1ms; High median scales 0.975–1.000, observed minimum 0.975. At most two resolution changes and one reversal per 20-second trial: no repeated down/up cycle. Peak 329 draws; zero combat compiles, browser errors or budget failures. Native 1920×1080 DPR1, Apple M1 Pro / ANGLE Metal / WebGL2, 25 legal enemies replenished through native spawns, actual full-kit cooldowns/damage-based Overdrive after initial charge. Carrier brood remains native. The scan chooses its heaviest and median inventory room; both are shown below.

One-minute host load spans 11.51–134.79 on ten logical cores; this is system load, not CPU utilization. Owner simulator background work remained active. Every case was repeated five times; no best-of-N selection. Raw double timestamp arithmetic remains in JSON; reporting/target comparison uses the browser’s 0.1ms precision rather than treating sub-picosecond differences around 16.7 as physical misses. Campaign/capture timings are never used for hardware acceptance.

Room benchmark: 42/42 entries, median 381.5ms, p95 541.1ms, max 679.5ms. Across 64 distinct recorded preparation receipts, median 425.0ms and worst 2378.0ms, including initial cold work; both requested preparation limits hold. Program inventory peaks 200; zero post-ready/combat compiles. Source: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-rooms-mounted/rooms.json`.

Changes/trades:

- Ink returns before all floor kernels; props use four major-crease directions while actors retain eight and full silhouettes. Packed HDR, half-resolution AO, quarter-resolution bloom, shadows and bounded AA remain. Adaptive minimum rises .70→.80 with original hysteresis/manual controls. Visual work reduction pair: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-round2/g4-forms-high-armory.png` → `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-round3/g4-forms-high-armory.png`.
- The decisive pacing fix carries early-frame debt rather than clamping it and allows at most 2ms early presentation. Original jitter caused 25ms/8ms pairs: one retained trial had 197 late 20–30ms frames, 143 immediately followed by <13ms. The superseded 18-trial cohort's High p95 ranges 17.9–25.3ms; all 80 final trials are below 20ms. Deterministic tests preserve 60/120/144Hz counts, elapsed time, reset and stalls. This is not a simulation time change.
- The post-lead-art cohort caught a real 331-call Pyro peak. Its 24 completed trials remain under `i8-accepted-bench`; they are failed/superseded, not final acceptance. High retains the newest ten presentation corpses instead of twelve; Low remains six. Oldest-only pooled retirement is tested; kills, pickups, authoritative death ownership, physics impulse and live rendering remain unchanged. The matched native 13-death pair proves 12→10 retained IDs. Final 80-trial peak is 329.

### Five native trials per case

All 80 source trials retained; no best-of-N selection. Frame values below are reported to 0.1ms browser timestamp precision; raw double values remain in JSON. Host load is 1m system load, not utilization.

| Room / rig / tier | Frame p50 (all5), ms | Frame p95 (all5), ms | CPU p95 range, ms | Scale median range | Load1m range | Peak draws | Combat compiles |
|---|---|---|---|---|---|---:|---:|
| relay-racks/breacher/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18.1 / 18 / 18 / 17.9 | 9.1–10.5 | 1.000–1.000 | 11.89–25.75 | 329 | 0 |
| relay-racks/breacher/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 18 / 18 / 18.1 / 18.1 | 7–7.4 | 1.000–1.000 | 14.4–22.96 | 195 | 0 |
| relay-racks/cryo/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 17.9 / 18 / 18 / 18 | 9.7–10.7 | 1.000–1.000 | 13.34–18.73 | 325 | 0 |
| relay-racks/cryo/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18 / 18 / 17.9 / 18 | 7.1–7.8 | 1.000–1.000 | 13.34–17.25 | 196 | 0 |
| relay-racks/pyro/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 17.9 / 17.9 / 17.9 / 18 | 9.9–10.8 | 1.000–1.000 | 15.07–46.2 | 323 | 0 |
| relay-racks/pyro/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18 / 17.9 / 17.9 / 18 | 7.6–7.8 | 1.000–1.000 | 15.27–46.2 | 195 | 0 |
| relay-racks/arc/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 17.9 / 18 / 17.9 / 17.9 | 8.7–9.7 | 0.975–0.975 | 12.59–45.31 | 308 | 0 |
| relay-racks/arc/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 17.9 / 18 / 18.1 / 18 | 6.8–7.3 | 1.000–1.000 | 12.38–54.44 | 182 | 0 |
| swarm-junction/breacher/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18 / 18 / 18 / 18.1 | 11.1–12.5 | 1.000–1.000 | 14.95–61.92 | 243 | 0 |
| swarm-junction/breacher/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 17.9 / 18 / 17.9 | 9.2–11.6 | 1.000–1.000 | 22.05–107.35 | 143 | 0 |
| swarm-junction/cryo/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 18.1 / 17.9 / 18 | 10.1–10.8 | 0.975–1.000 | 13.94–134.79 | 232 | 0 |
| swarm-junction/cryo/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 17.9 / 18 / 18 / 18 | 7.5–9.2 | 1.000–1.000 | 13.66–134.79 | 153 | 0 |
| swarm-junction/pyro/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18 / 18 / 17.9 / 18 | 11.4–11.9 | 1.000–1.000 | 13.66–121.71 | 242 | 0 |
| swarm-junction/pyro/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 17.9 / 18.1 / 17.9 / 18 | 8.5–9.7 | 1.000–1.000 | 13.04–94.96 | 144 | 0 |
| swarm-junction/arc/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 18 / 18 / 17.9 | 7.3–8.3 | 1.000–1.000 | 13.04–81.06 | 212 | 0 |
| swarm-junction/arc/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 17.9 / 18 / 18 / 17.9 | 6.2–7.3 | 1.000–1.000 | 11.51–84.34 | 128 | 0 |


Chart: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/performance.png`; all samples: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/performance.json` and raw `i8-budgeted-bench/benchmark.json`, `i8-budgeted-extra/benchmark.json`.

G3 rotating per-pass queries were used separately. Raw tiny bloom and scene scopes both remain near 6–7ms, so these are not an additive GPU decomposition or proof of individual pass cost. No summed GPU-time claim or causal single-trial speedup is made. Final diagnostic values:

| Case / rotating scope | Raw p50 / p95 ms | Resolution |
|---|---:|---|
| relay-racks / sceneColor | 6.35 / 8.91 | 1920×1080 |
| relay-racks / gtao | 5.98 / 7.84 | 960×540 |
| relay-racks / bloomExtract | 6.39 / 8.66 | 480×270 |
| relay-racks / composite | 7.48 / 9.19 | 1920×1080 |
| relay-racks / finalAA | 7.79 / 9.01 | 1920×1080 |
| swarm-junction / sceneColor | 6.96 / 9.89 | 1920×1080 |
| swarm-junction / gtao | 6.87 / 8.56 | 960×540 |
| swarm-junction / bloomExtract | 7.43 / 8.75 | 480×270 |
| swarm-junction / composite | 8.49 / 10.08 | 1920×1080 |
| swarm-junction / finalAA | 8.71 / 10.03 | 1920×1080 |


Raw: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8-profile-budgeted/benchmark.json`. Main-thread CPU p95 remains above the engineering 8ms aspiration in some loaded cases; requested actual frame targets pass. Fine oblique geometry still lacks temporal AA.

## Final campaigns

All four default native seed 1729 campaigns terminated naturally, with zero errors, defects or soft-locks. No assisted/fast/realtime/legacy flag, retry or continuation. One campaign browser at a time; no benchmark overlap. Breacher's natural death is reported as a death, not completion. All use frozen combat source 5d47065; harness checkout SHAs remain separate, with identical harness content hashes. Final title-only 21e0859 revision is explicitly excluded from their source claim.

| Rig | Outcome / clears / entered | Deaths | Overdrives / receipts | V intervals min / median / max s | Holds count / max ms | Wall s | Load1m start → end |
|---|---|---:|---:|---|---:|---:|---:|
| breacher | dead / 19 / 20 | 1 | 16 / 16 | 32.92 / 42.43 / 68.70 | 6 / 227.56 | 686.92 | 79.3 → 80.7 |
| cryo | complete / 20 / 20 | 0 | 14 / 14 | 31.72 / 52.90 / 77.12 | 5 / 300.44 | 591.91 | 70.1 → 27.8 |
| pyro | complete / 20 / 20 | 0 | 14 / 14 | 28.23 / 39.33 / 48.08 | 5 / 277.31 | 622.01 | 21.7 → 61.6 |
| arc | complete / 20 / 20 | 0 | 16 / 16 | 29.27 / 40.85 / 61.97 | 8 / 251.36 | 664.54 | 47.6 → 61.1 |

CPU statistics below are ranges/medians of per-room fixed-step **update+render submission** quantiles, not pooled frames, GPU completion or production FPS. Every fixed tick rendered; original traces and ordinary RAF diagnostics remain separately retained.

| Rig | Per-room CPU p50 min / median / max ms | Per-room CPU p95 min / median / max ms |
|---|---:|---:|
| breacher | 3.30 / 4.90 / 6.40 | 4.80 / 7.80 / 9.40 |
| cryo | 3.60 / 4.70 / 7.10 | 5.30 / 7.20 / 10.50 |
| pyro | 4.00 / 5.50 / 7.30 | 5.50 / 8.40 / 13.50 |
| arc | 3.50 / 5.50 / 6.10 | 5.60 / 8.40 / 12.70 |

Full campaign summary: `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/reviewed-campaign-summary.json`; detailed report `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/reviewed-campaign-report.md`. Each rig's native report/trace is under `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/playtest/i8-reviewed-final-<rig>-1729/`. All 80 original 1920×1080 mid-fight PNGs are copied to `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/organic` with application-source provenance. The previous four pre-lead-art 72c78b1 campaigns remain separate historical evidence.


## Final galleries and twelve showcase frames

Capture labels **final2** (1920×1080) and **final2-720** (1280×720), each with **606 native frames and 109 phase sheets**, errors[] and failures[]. Both contain all 534 previous final frames by filename, plus 72 proofs. All batch source receipts and identical application asset hashes resolve to final application `21e0859`; native dimensions, 480×270 dimensions, historical inventory, source hashes and organic byte identity are checked in `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/final-evidence-audit.json`.

- 1080p gallery: [final2/index.html](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/index.html).
- 720p gallery: [final2-720/index.html](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2-720/index.html).
- Three-generation comparison: [compare.html](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/compare.html).
- Before/after sheet: [before-after.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/before-after.png).
- Twelve-frame selection: [showcase.html](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/showcase.html), with `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/showcase.png` and hashed `showcase.json`.
- Organic mid-fight gallery: [organic/index.html](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/organic/index.html), 80 unchanged campaign originals from measured combat source `5d47065`.

Each resolution includes all screens; calm plus motion/kiting sheets for all twenty rooms; heavy combat in ten rooms; closed, opening, exposed and closing Queen; all sixteen seven-phase ability sheets; four full kits in bright/dark rooms; statuses, champions, pickups and Low in three rooms. Added proofs cover fifteen spread enemies in bright/dark/warm lighting, large industrial props, native hostile priority through all four kits, graphics diagnostics and U4 clearance/story displays. The comparison contains twenty views × three generations: four UI screens and calm/combat in the seven named rooms and boss. Missing historical results/calm-boss captures are explicitly labeled original death/arrival substitutes, retaining actual filenames and hashes.

The first four frames below are the UI review starting point; the next four cover prop and fight readability. All twelve selected native paths:

1. [title.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/title.png)
2. [starting-boon.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/starting-boon.png)
3. [route.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/route.png)
4. [x3-results-statistics.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/x3-results-statistics.png)
5. [combat-calm-armory.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-calm-armory.png)
6. [combat-calm-diagnostic-gallery.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-calm-diagnostic-gallery.png)
7. [combat-kiting-armory-02.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-kiting-armory-02.png)
8. [combat-kiting-infested-workshop-03.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/combat-kiting-infested-workshop-03.png)
9. [i8-families-overload-floor-03.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/i8-families-overload-floor-03.png)
10. [g2-queen-exposed-reactor-vault-04.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/g2-queen-exposed-reactor-vault-04.png)
11. [v2-full-pyro-containment-annulus-containment-annulus-04.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/v2-full-pyro-containment-annulus-containment-annulus-04.png)
12. [v2-full-arc-infested-workshop-infested-workshop-04.png](/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/final2/v2-full-arc-infested-workshop-infested-workshop-04.png)

Visual review ledgers live in `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/visual-*-review.md` with exact opened-page lists. All 1,212 staged native frames were inspected: 470 world/combat/Low frames, 336 ability/full-kit frames and 406 UI/detail/proof frames. All 80 native organic originals were also inspected. Root inspected every staged frame at exact 480×270 and all 80 organic thumbnails; native review was split by disjoint scope, with source-pixel 600×400 enemy/title crops inspected separately. The final comparison has its own native source ledger. Phase bursts establish sampled continuity; they cannot certify absence of every temporal shimmer between samples.

A calm-boss fixture initially requested the normal v3 room catalog for the legacy v2 Reactor Vault. Only that fixture now requests its actual version, matching existing boss fixtures; normal room assertions are unchanged. The failed batch and receipt remain under `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/failed-final2-extra-boss-version` and `/Users/chernodub/.t3/worktrees/containment-game/t3-543f904d/artifacts/nextgen/i8/logs/capture-jobs-before-boss-calm-fix.json`; the entire extra batch was recaptured cleanly. Native/480 review helpers now integer-copy equal-size pixels and area-reduce thumbnails, avoiding a review-sheet-only repeated-row artifact. Original captures were never resampled or relabeled.


## Tests rewritten/added and invariants


- `tests/U4EndingSettings.test.ts`: the hypothetical boolean ink field becomes the actual native union select with all three choices; other additive boolean/numeric/unknown-union coverage remains.
- `tests/UiSettings.test.ts`: explicitly selects Full now that Off is also selectable; every mode additionally reloads through the real native control/persistence path.
- `tests/ActorGeometryMaterial.test.ts`: champion crest discard pin bounds only its role, preserving G4's separate abdomen role; hinge/normal/ID/exclusion guarantees retained.
- `src/render/G2Presentation.test.ts`: bounded title mesh count 6→7 for exactly one 24-triangle atmosphere shaft; adds no-lights, tier, disposal and separate-title-material guarantees. Casing hide/reveal excludes the transparent shaft and preserves actual solid concealment plus the emerging head in the right-side frame.
- `src/render/X2Actors.test.ts`: old absolute HUD draw order >1001 becomes the W4 priority guarantee: marine after friendly content but before hostile warning 30/projectile 40, with no group override. Exact skin ownership/pose/lifecycle checks remain.
- `tests/NextgenPost.test.ts`: floor screen-space ink pin becomes no ink on floors; local HDR sampling selects line color only after a geometry-identity edge. Edge coverage remains geometry-based, not luminance-based. Actor silhouettes/AA/state/lifecycle checks remain.
- `tests/PerformanceRegression.test.ts`: adds high-refresh jitter intervals with 60Hz count and elapsed-time preservation; original 60/120/144Hz and stall/storage assertions are unchanged.
- `tests/AdaptiveResolution.test.ts` and `tests/G3LifecycleReview.test.ts`: bounded floor .70→.80 and corresponding target 1536×864, preserving step/hysteresis/recovery/manual-disable guarantees.
- `tests/I2GraphicsPreferences.test.ts`: each ink mode × each tier survives context-invalidated warmup/retry with both new booleans overridden. Fake pool release now detaches temporary models just as the real pool does, avoiding artificial ownership exhaustion across the larger cohort.
- Added allocation-free Queen/enemy footprint coverage, palette relationships, Armory broad-value/detail budget and borrowed-depth lifetime checks. No gameplay, deterministic, persistence, input, accessibility, safety or authored-room assertion was removed or weakened.


- `tests/GraphicSurface.test.ts` replaces the superseded actor mip-softening pin with native sampling/zero actor bias and narrow-band behavior; floor sampling/normal/specular/tier behavior remains.
- `tests/I8ActorGraphics.test.ts` checks dark Brute body plus pale physical plates, retaining all family relationships. Cryo presentation replaces the old constant late Nova width pin with first 100ms impact plus subsequent narrowing/low interior coverage; radius/variant/flash/edge identity remain.
- `tests/GeometryBuffer.test.ts` adds high-order friendly and opaque-droplet ID preservation; explicit hostile ownership replaces accidental render-order classification in its fixture. Hostile priority behavior remains asserted.
- `tests/NativeWarningShapes.test.ts` adds native shape dimensions, simulation-bound progress, blocker clipping and cancellation/death. Existing native gameplay/determinism tests remain untouched.
- `src/render/DeathRagdolls.integration.test.ts` mock implements the new warning-sync presentation method; original ten physics/gameplay assertions are preserved. New eleventh test proves newest-ten High retention, oldest-only release, duplicate death ownership and complete disposal.
- The 720p ability-inspection fixture selects a legal northern mark and settles the normal camera so the product's marine-clearance rule does not correctly hide the requested tooltip. Product clearance assertions are unchanged.

No gameplay, determinism, persistence, input, accessibility, authored-room or safety assertion was removed or weakened. No balance changes; attack constants preserve exact existing values.

## Integration requests and honest gaps

No cross-worktree integration request, new runtime dependency or license change. Final documentation/harness commits remain local; do not push or open a PR.

- The retained props/creatures remain visibly procedural. Title composition and graphite form improved, but fitted rectangular armor plates and the creature’s flat mauve front remain short of bespoke cinematic hero art. Relay interiors stay dark, and freight roofs remain relatively sparse.
- Family identity is strongest without status overlays. Frozen bodies retain contours but share icy hues; distant family values are muted. Dark Stalkers remain the weakest small silhouettes, especially on Low. Champion color is a crest/inner emissive rim around near-black ink. Three-band shading retains continuous lighting/sac modulation rather than literally three RGB values.
- Spatial AA cannot guarantee zero subpixel crawl on every moving thin leg. Sampled bursts and exact native crops establish crisp sampled edges, not continuous temporal certification. Pale Overclock duplicates and brief impact fans/damage numbers can obscure individual target details; sustained friendly zones yield locally.
- The bottom dock can conceal peripheral enemies or part of a lower-edge warning, while the marine stays clear and threat markers persist. Valid intersecting charge capsules can remain visually congested. The synthetic Marine Down banner fixture intentionally retains playing state/standing marine and can overlap the reticle at 720p; real death/results and the native campaign death are separate evidence.
- CPU submission p95 exceeds the engineering 8ms aspiration in some loaded cases. Requested frame/preparation/draw/compile targets pass across all retained trials. One seed/four bot attempts is not broad balance certification; Breacher died in the final Overload Floor holdout. Blender’s absence prevents the full Python asset chain from passing. Historical results/calm-boss substitutions are labeled with actual filenames and hashes.

Recommended next art work: bespoke title armor/creature forms, stronger small dark-family value accents on Low, and temporal treatment for thin limbs, preserving the current hostile-warning hierarchy and native hit shapes.
