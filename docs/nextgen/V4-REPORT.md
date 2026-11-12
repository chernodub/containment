# V4 — Ability construction and friendly-effect priority

Branch: `t3/ability-vfx-construction`. Baseline renderer: `ab71db8a35d99c3311582a7779136fe9a9742021`. Full visual-construction build: `b0aad1be97aadab0ce9b7487304b20aa7ee41060`. Final renderer/benchmark build: `76ca501ff3c0044513b9f6028b27f55beb52599f` (coverage-preserving raster/shader optimization only; no emitter changes). Final reporting HEAD is supplied in the handoff.

## What shipped

- Sixteen ability constructions use distinct physical sources, varied shapes and retained instanced pools. Effects remain un-inked and use hot cores with clean falloff.
- Shared local sustained-effect priority, reduced duplicated ground coverage/boundary draws, and distinct attached burning/chilled/shocked enemy feedback.
- Additive PNG review and priority-overlap fixtures. Simulation, hit decisions, input, checkpoints, UI hooks, assets and dependencies are unchanged.

## Capture evidence

Capture labels: `v4-before`, `v4-before-env`, `v4-final-r4`, `v4-final-r4-env`. All use seven authored phases, native 1920×1080 desktop frames and exact area-reduced 480×270 frames; the reductions are not phone captures. Before/final comparison sheets: `artifacts/nextgen/v4/comparisons/`. Before and final each contain 140 core frames / 20 sheets and 84 environment frames / 12 sheets, with errors[] and failures[]. Final status adds 14 frames / 2 sheets; priority overlap adds 16 frames / eight matched pairs. All 32 seven-phase before/after comparisons assert matching simulation times. Four critique→fix rounds and final native/reduced PNG inspections are recorded in the plan.

Native full-kit sheets for all four rigs in Containment Annulus, Infested Workshop and Low Armory are enumerated with absolute paths in the [before manifest](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before-env/native/manifest.json) and [after manifest](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4-env/native/manifest.json). All 64 before/after native sheets and three final focused sheets were generated and verified; every cell preserves the source 1920×1080 pixels.

Each row links a separate full-resolution derivative sheet with seven original 1920×1080 cells. The harness’s original capped sprite sheets and native frames remain untouched. Exact 480×270 counterparts use the same stem with `review/<stem>-sheet.png` under the same label.

| Ability | Construction | Before sheet (absolute) | After sheet (absolute) |
|---|---|---|---|
| Ram | One forward armored prow and two dust shoulders replace four stacked diamond shields; contact and skid remain at native arrival. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-ram-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-ram-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-ram-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-ram-awakening-bay-sheet.png) |
| Seismic Slam | One low matte expanding pressure edge; unequal bent branching fractures; larger chisel fragments launch near the source and settle with directional dust. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-seismic-slam-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-seismic-slam-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-seismic-slam-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-seismic-slam-awakening-bay-sheet.png) |
| Bulwark | Continuous projected field with grounded end hardware; idle hex paving removed, localized load-response cells retained. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-bulwark-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-bulwark-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-bulwark-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-bulwark-awakening-bay-sheet.png) |
| Railbreaker | White penetrating core with three unequal pressure collars rather than six repeated rings; restrained varied heat channels and wall impact. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-railbreaker-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-railbreaker-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-railbreaker-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-railbreaker-awakening-bay-sheet.png) |
| Frost Trail | Irregular native capsule frost film with asymmetric directional crystal clusters, fern seams and low mist; no diamond rectangle. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-frost-trail-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-frost-trail-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-frost-trail-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-frost-trail-awakening-bay-sheet.png) |
| Cryo Nova | Broken matte cold billows, unequal radial shards and progressive lingering needles; retired the foil-like emissive torus. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-cryo-nova-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-cryo-nova-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-cryo-nova-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-cryo-nova-awakening-bay-sheet.png) |
| Glacier | Varied height, width, depth, lean and spacing in grounded interlocking ice spires; native wall length/thickness retained. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-glacier-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-glacier-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-glacier-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-glacier-awakening-bay-sheet.png) |
| Whiteout | Three circulating soft mist currents with varied directional snow, an exact clear eye and progressive enemy frost; retired the straight floating bands. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-whiteout-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-whiteout-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-whiteout-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-whiteout-awakening-bay-sheet.png) |
| Afterburn | One thin glossy fuel stroke on the native dash footprint, short direction-leaning flames and low aftermath. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-afterburn-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-afterburn-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-afterburn-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-afterburn-awakening-bay-sheet.png) |
| Flashfire | Nozzle-hot continuous 3D pressure jet with a dominant stream and shorter asymmetric curls, breaking into varied flames and smoke at range. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-flashfire-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-flashfire-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-flashfire-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-flashfire-awakening-bay-sheet.png) |
| Napalm Charge | Glossy dark orange liquid pool, sparse tall localized vents, smoke column and varied ballistic glossy droplets on impact. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-napalm-charge-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-napalm-charge-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-napalm-charge-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-napalm-charge-awakening-bay-sheet.png) |
| Meltdown | Attached hot suit seams, asymmetric shoulder/backpack exhaust, moving combustion wake and small heat patch; aura fire ring removed. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-meltdown-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-meltdown-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-meltdown-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-meltdown-awakening-bay-sheet.png) |
| Static Step | Marine torso/limb bolt and actual dash path, brief electrical afterimage and small arrival contact rather than generic volume. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-static-step-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-static-step-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-static-step-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-static-step-awakening-bay-sheet.png) |
| Overload | White hot core with restrained violet halo, length-based branches along actual target hops, contact bursts and short afterimage. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-overload-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-overload-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-overload-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-overload-awakening-bay-sheet.png) |
| Tesla Pylon | Retained grounded pylon, stronger live target and marine cables, small electrical landing contact rather than torn torus. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-tesla-pylon-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-tesla-pylon-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-tesla-pylon-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-tesla-pylon-awakening-bay-sheet.png) |
| Overclock | Broader charged suit/weapon seams, animated muzzle discharge, two separated articulated marine echoes and subdued world ripples; floating right-angle marks removed. | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/native/v2-overclock-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-before/review/v2-overclock-awakening-bay-sheet.png) | [full](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/native/v2-overclock-awakening-bay-sheet.png) / [480](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-r4/review/v2-overclock-awakening-bay-sheet.png) |

Look first:

- [Pyro bright full-kit before/after](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/comparisons/v2-full-pyro-containment-annulus-containment-annulus.png)
- [Arc dark full-kit before/after](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/comparisons/v2-full-arc-infested-workshop-infested-workshop.png)
- [Cryo bright full-kit before/after](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/comparisons/v2-full-cryo-containment-annulus-containment-annulus.png)
- [Breacher dark full-kit before/after](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/comparisons/v2-full-breacher-infested-workshop-infested-workshop.png)
- [Meltdown seven-phase before/after](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/comparisons/v2-meltdown-awakening-bay.png)
- [Cryo local danger priority](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/priority/cryo-infested-workshop.png)

## Yield mechanism and integration

`AbilityPriorityMask` retains one 128×72 one-channel DataTexture and raster storage. It projects the marine capsule, live enemy silhouettes using authored actor height/span, the Queen, hostile projectile capsules, snapshot warning fallback, and optional renderer warning shapes. Every prepared ability ShaderMaterial samples it; sustained per-instance weight begins at 250 ms and reaches full suppression at 370 ms. A masked pixel loses up to 97% of friendly alpha. Attached suit/status signals and actual new contact/impact instances stay exempt. Sustained emitter particles inherit their source priority, wake aftermath yields from birth, and refreshed Overclock echoes use the total ability age; refreshing an emitter cannot renew impact grace. No render pass, render target, mesh or draw is added by the mask.

The optional `HostilePrioritySource.forEachHostilePriority(visit)` accessor is feature-detected. The minimal `AttackEffects.forEachHostilePriority` implementation exposes its actual live stable hostile circles in renderer metres using retained scratch storage; it does not change their rendering. Snapshot charge/spit/Queen warnings and hostile bullets remain fallback inputs. A concurrent hostile telegraph renderer should expose its live circle/line/wall shapes through this same read-only accessor.

Surgical renderer bindings already landed: set the source to existing `effects`; provide `statusActor(id)` from the existing actor map/Queen; pass the current frame status-ownership facade to legacy AfflictionBatches. The latter suppresses duplicate burn/frost only for targets actually drawn by the new system. Poison, distant targets and overflow retain legacy presentation. No further integration request is required for this branch.

Enemy-state evidence is split deliberately: `v4-final-r4-status` covers actual burning, chilled/progressive frost and frozen states in High/Low; it contains no shocked target. Actual shocked targets are visible in the Arc Overload/Tesla/full-kit core sheets (the Overload receipt records five shocked targets). Do not infer shock coverage from the mixed-state label alone.

Priority screenshots use explicit presentation-only warnings after a 650 ms sustained hold, with matched reference mask clearing. They demonstrate local composition and do not claim native enemy scheduling. Proof receipts remain in their manifests.

## Performance

Acceptance is **not met**: the final optimized build passes the CPU p95 comparison in all 16 groups, but fails peak draw count in 8 of 16 groups. Global draw peak falls from 324 to 317. `npm run bench` exits 0 with 48 valid trials, zero combat shader compiles, errors[] and budgetFailures[]; the stricter comparison exits 1. The original full final candidate and alternating controls remain preserved below.

Final optimized comparison: [table](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/bench-final-perf.md), [chart](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/bench-final-perf.png), [all raw trials](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-final-perf-bench/benchmark.json). The same predeclared best-of-three CPU p95 / worst-of-three draw peak policy and zero threshold apply. The table load belongs to each CPU-selected trial; all three raw host records remain available. Host load differs substantially between baseline and final; CPU gains are observational and cannot all be attributed to the code changes.

Original before report: `artifacts/nextgen/v4-before-bench/benchmark.json` (48 valid trials, 25 native sustained actors, all four slots accepted, High/Low, three repeats, Relay Racks and Diagnostic Gallery). Baseline global draw peak 324, errors[], budgetFailures[], combat shader compiles0.

The comparison uses the best CPU p95 of three repeats and the worst draw peak across all repeats in each matched room/rig/tier group. Zero-increase threshold has no percentage allowance. Raw timing misses and load are retained; this very contended shared M1 Pro/ANGLE Metal host is not quiet-hardware or GPU-completion certification.

Cost changes: three friendly boundary batches share one unchanged summed 304-slot pool; redundant large sustained zone quads retire in the rich owner; fire atlas sampling becomes analytic; Whiteout uses bounded local gusts; repeated collars/idle grids/fire rings retire; short electrical crackles use length-based subdivision; streamed upload ranges and status epochs reuse storage. No runtime mesh/light/material family is created in combat. The tested final follow-up optimization preserves the same raster bytes while clipping offscreen capsules, hoisting per-row arithmetic and skipping already saturated stamp pixels. Soot fans/fracture discs reject empty coverage before fracture work; cold gusts skip calculations that were immediately overwritten. These changes alter no emitter construction, capacity, alpha rule or draw family.

### Final optimized native comparison

| Fixture | CPU p95 before → after ms | Δ | Draw peak before → after | Δ | Load before → after | Strict result |
|---|---:|---:|---:|---:|---:|---|
| relay-racks / breacher / high | 20.00 → 12.60 | -7.40 | 283 → 298 | 15 | 333.16 → 44.62 | CPU pass, draw FAIL |
| relay-racks / breacher / low | 10.40 → 7.90 | -2.50 | 176 → 178 | 2 | 277.98 → 36.88 | CPU pass, draw FAIL |
| relay-racks / cryo / high | 18.30 → 12.40 | -5.90 | 323 → 305 | -18 | 321.01 → 31.08 | CPU pass, draw pass |
| relay-racks / cryo / low | 7.40 → 7.10 | -0.30 | 191 → 185 | -6 | 671.08 → 36.17 | CPU pass, draw pass |
| relay-racks / pyro / high | 22.80 → 12.70 | -10.10 | 324 → 317 | -7 | 725.58 → 75.39 | CPU pass, draw pass |
| relay-racks / pyro / low | 9.30 → 7.70 | -1.60 | 187 → 179 | -8 | 752.46 → 63.87 | CPU pass, draw pass |
| relay-racks / arc / high | 16.00 → 10.70 | -5.30 | 289 → 291 | 2 | 642.60 → 56.13 | CPU pass, draw FAIL |
| relay-racks / arc / low | 7.10 → 6.50 | -0.60 | 167 → 168 | 1 | 533.99 → 44.95 | CPU pass, draw FAIL |
| diagnostic-gallery / breacher / high | 22.90 → 21.40 | -1.50 | 229 → 243 | 14 | 333.32 → 51.30 | CPU pass, draw FAIL |
| diagnostic-gallery / breacher / low | 10.70 → 8.90 | -1.80 | 145 → 153 | 8 | 361.54 → 31.69 | CPU pass, draw FAIL |
| diagnostic-gallery / cryo / high | 22.30 → 14.50 | -7.80 | 246 → 236 | -10 | 315.46 → 29.92 | CPU pass, draw pass |
| diagnostic-gallery / cryo / low | 9.70 → 9.20 | -0.50 | 143 → 147 | 4 | 300.36 → 43.26 | CPU pass, draw FAIL |
| diagnostic-gallery / pyro / high | 18.50 → 18.40 | -0.10 | 262 → 252 | -10 | 319.26 → 65.28 | CPU pass, draw pass |
| diagnostic-gallery / pyro / low | 10.70 → 9.40 | -1.30 | 155 → 145 | -10 | 285.13 → 32.32 | CPU pass, draw pass |
| diagnostic-gallery / arc / high | 16.20 → 11.30 | -4.90 | 214 → 227 | 13 | 385.21 → 20.68 | CPU pass, draw FAIL |
| diagnostic-gallery / arc / low | 9.60 → 8.00 | -1.60 | 132 → 131 | -1 | 454.35 → 29.75 | CPU pass, draw pass |

### Separate equal-state draw diagnosis

[Fixed-step table](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/draw-inventory.md), [raw milestone snapshots and frame samples](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4-draw-inventory/inventory.json), [log](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/draw-inventory.log).

All 16 room/rig/tier groups pass: identical six milestone game snapshots and every sampled frame time, 25 initial actors, all four native casts accepted, six further simulation seconds. Total draw peaks fall by 1–7 calls and ability peaks by 2–5; zero combat shader compiles and errors[]. For example, Relay Breacher High is 241→239 total / 10→8 ability; Relay Pyro High is 249→242 total / 12→7 ability. This supports reduced VFX draw cost for matched states. It does not certify native CPU/GPU performance or waive the eight native per-fixture misses.

```text
Equal-state draw inventory: 16 matched groups, 0 peak increases, zero combat compiles, errors[].
```

Rejected diagnostic drafts are retained: `draw-inventory-invalid-intercept.*` sampled the public method that fixed stepping bypasses and yielded no valid draws; `draw-inventory-placement-attempt.log` stopped while adding the same native legal-placement search as the benchmark; `draw-inventory-aim-attempt.*` caught differing initial point-target intent after page focus changes. The passing version samples actual frame completion, asserts nonempty finite draws, explicitly sets the same public initial aim intent, and retains every snapshot comparison. No existing gate assertion changed.

### Preserved pre-optimization measurements

The earlier full candidate had 5 CPU and 5 draw misses across 16 groups; its paired controls had 6 CPU and 2 draw misses across 8 groups.

Full 48-trial comparison: [table](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/bench.md), [chart](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/bench.png). Alternating controls ran 48 additional trials against identical frozen original/final-r4 builds. All 48 final trials, 48 paired-control trials and 48 original before trials remain separate.

| Paired fixture | CPU p95 before → after ms | Peak draws before → after | Zero-increase result |
|---|---:|---:|---|
| diagnostic-gallery / arc / high | 11.10 → 11.70 | 215 → 219 | CPU FAIL, draws FAIL |
| diagnostic-gallery / pyro / high | 18.80 → 20.60 | 264 → 248 | CPU FAIL, draws pass |
| relay-racks / arc / low | 6.50 → 6.90 | 169 → 169 | CPU FAIL, draws pass |
| relay-racks / breacher / high | 13.50 → 15.80 | 293 → 297 | CPU FAIL, draws FAIL |
| relay-racks / breacher / low | 9.10 → 8.10 | 180 → 175 | CPU pass, draws pass |
| relay-racks / cryo / high | 11.80 → 13.50 | 317 → 308 | CPU FAIL, draws pass |
| relay-racks / cryo / low | 7.10 → 7.20 | 193 → 186 | CPU FAIL, draws pass |
| relay-racks / pyro / low | 7.90 → 7.90 | 197 → 181 | CPU pass, draws pass |

Workload confound: native simulation progress per 20 wall seconds varied substantially, especially on High (one selected Cryo Relay before trial reached 13.95 simulation seconds / 378 frames, its final counterpart 1.38 seconds / 29 frames). All existing workload guards still passed. This prevents treating draw/timing changes as a clean same-state causal GPU comparison. It does not waive failed acceptance.

Final shader-focused capture `v4-final-perf-focus` contains 21 clean native frames / three sheets (Slam, Flashfire and Whiteout), plus exact 480×270 reductions. The full 16-ability/kit construction sheets remain tied to b0aad1b; 76ca501 changes only identical-coverage raster/shader work. No emitter or geometry differs between these final builds.

## Gates

`npm ci` passed. The final code gate used one Vitest worker and one browser at a time. Summary lines:

```text
Test Files  255 passed | 1 skipped (256)
     Tests  3017 passed | 1 skipped (3018)
node --test scripts/cryo-model-preview.test.mjs: ℹ pass 2; ℹ fail 0
npm run build: tsc --noEmit passed; ✓ built in 458ms
npm run test:room-evidence: ℹ tests 28; ℹ pass 28; ℹ fail 0; ragdoll {"passed":true,"cpuOnly":true,"checks":33}
Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
Authored desktop: 20/20 rooms, native keyboard movement/fire, errors[], fatal authorization retained; retry exit 0.
npm run bench: exit 0; 48/48 valid trials; combat compiles 0; errors[]; budgetFailures[]
Strict final comparison: CPU 0/16 misses, draw 8/16 misses; exit 1
npm run verify: exit 1 — FileNotFoundError: [Errno 2] No such file or directory: 'blender'; FAILED (errors=1)
```

Logs: [unit/verify](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/gates/final-r4-verify.log), [build](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/gates/final-r4-build.log), [room evidence](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/gates/final-r4-room-evidence.log), [smoke](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/gates/final-r4-smoke.log), [all20 authored retry](/Users/chernodub/.t3/worktrees/containment-game/t3-7902484d/artifacts/nextgen/v4/gates/authored-all20-retry.log). The first extended authored attempt timed out waiting for native Space firing in Awakening Bay; its failure PNG/JSON and log remain under `v4/gates/authored-first-failure` and `final-r4-authored-all20.log`. The unchanged isolated Awakening assertion and then the unchanged full 20-room run passed. No timeout or input assertion was relaxed.

The `verify` aggregate remains failed solely at the documented missing-Blender asset test after unit/Node tests pass. Remaining JS/browser gates were run separately. Blender was not installed and no Python assertion or GLB was changed.

New coverage includes priority-source access, mask lifecycle, sustained/impact age propagation and a byte-for-byte max-composited raster regression across 304 overlapping/clipped stamps.

## Presentation pins rewritten

- `Readability.test.ts`: three friendly boundary draws becomes one with equal total capacity; added coexistence of exact casts, waves and sustained footprints, plus no duplicate broad ground surface.
- `SpectaclePrimitives.test.ts`: upright flame count/height pins become bounded directional streaming, exact flow endpoints, varied scales and matte front styles using the same retained resources. Trench width pin accommodates the unchanged full strip width convention.
- `AbilityFireMaterials.test.ts`: flame flipbook ownership becomes analytic alpha coverage with no flame texture; smoke atlas disposal remains covered. Generic upright pool flames become glossy fuel plus bounded directional fire.
- `PyroPresentation.test.ts`: tall Afterburn wall/dense Napalm bands/Meltdown fire-rim pins become exact low fuel trail, sparse localized pool vents, ballistic droplets, attached exhaust, movement wake, impact grace and lifecycle/tier guarantees.
- `ArcPresentation.test.ts`: .012-capped cable pin becomes readable native endpoints/Low cable; generic torus and dial-shard pins become small electrical contact, exact-radius curved ripples, animated muzzle attachment, body echoes and hostile-projectile independence. StaticStep retains torso/limb extent with bounded short-bolt topology rather than a high segment count.
- `CryoPresentation.test.ts`: solid frost sheet/regular crystal count/perimeter-bar pins become exact capsule/annulus bounds, varied directional growth, clear eye, connected Low/High mist currents and conservative coverage.
- `breacher.test.ts`: six identical Rail collars/four Ram shields/idle hex grid/old thin Slam pins become three varied collars/one prow/local load response/matte front and source-tied debris. Native launch, arrival, wall, cooldown and lifecycle assertions remain.

No gameplay, determinism, persistence, navigation, native input, desktop resizing, context recovery, authored-room or safety assertion was removed or relaxed.

## Four critique → fix rounds

See `docs/nextgen/plans/V4.md` for the capture-led findings and corrections. Failed and corrected source builds/manifests remain separate. The baseline environment wrapper recorded a later harness HEAD while serving identical original before-dist bytes; `artifacts/nextgen/v4/runtime-witness.json` proves the app hashes and actual renderer SHA without rewriting receipts.

## Integration requests

No additional code hook is outstanding on this branch. The minimal read-only hostile accessor, renderer service bindings and legacy status handoff are already committed. The world telegraph lead should preserve `forEachHostilePriority(visit)` when replacing hostile presentation. Integration still needs acceptance of the unresolved native performance result; do not label the strict comparison passed.

## Honest ranking and remaining gaps

The ordinal ranking below judges physical identity and 480×270 readability, not damage or balance. It reflects the frozen final core sheets, native keyframes and reduced review, with separate rig reviewers' critiques. It is not an independent art-director approval or an AAA-quality claim.

| Rank | Ability | Honest assessment |
|---:|---|---|
| 1 | Tesla Pylon | Clearest machine and conductive route; compact hardware and contact bursts survive reduction. Enemy contacts still overlap arrows and bodies. |
| 2 | Napalm Charge | Distinct wet pooled fuel and localized tall vents; airborne cubes are gone. Surface remains smooth/jelly-like and its smoke column needs more structure. |
| 3 | Railbreaker | Purposeful charge, white penetrating core and fewer unequal collars. Its large central beam still has a simple straight graphic construction. |
| 4 | Bulwark | Clear continuous cover with grounded projectors; no idle hex wallpaper. The field remains a plain rectangular sheet between hardware. |
| 5 | Glacier | Strong ice-wall purpose and varied grounded growth. A row of triangular/pyramidal bases remains visible. |
| 6 | Afterburn | A low fuel line with short swept flame, distinct from the pool and jet. The reduced image still shows a regular dotted flame rhythm. |
| 7 | Static Step | Travelled body bolt and departure contact read. The arrival pack/flash can hide the marine at contact. |
| 8 | Seismic Slam | Expanding pressure edge, larger source-tied chips and branching fractures. The front is still a simple ring and some debris reads as primitive chips. |
| 9 | Flashfire | Strong hot nozzle connection and directional pressure. The long lobes still resemble graphic fingers/feathers; range breakup needs more turbulent flow. |
| 10 | Cryo Nova | Unequal matte cold billows and a clear radial impact. The broad smooth band still exposes its torus/sheet base. |
| 11 | Overload | Main white bolt and actual target contacts read. Hop order is hard to follow inside packed bodies at 480; target numbers communicate multiple hits better than the interior route. |
| 12 | Frost Trail | The capsule film now leaves a continuous chilled track with directional growth. Fine ferns mostly vanish at 480 and bright deck weakens the film. |
| 13 | Meltdown | Attached upper-body heat is much stronger and the head/floor stay open. Fixed panel seams become brackets at 480; authored vent sockets and directional exhaust need clearer physical attachment. |
| 14 | Ram | One prow plus directional shove/skids avoids the old stacked stamps. Under a dense pack the short signature remains easy to lose. |
| 15 | Overclock | Stronger weapon/suit signal and separated echoes now carry more identity than the world ripple. Echo boxes and merged torso rails remain apparent; this is not yet a convincing full suit transformation. |
| 16 | Whiteout | Open eye, soft circulating mist and stronger tangent snow preserve readable interior space. Joined clouds still resemble soft hooks/tape; a coherent advected weather volume is the weakest construction. |

The next art work should replace primitive marine echo proxies with an authored silhouette, bind furnace vents to explicit suit sockets, expose chain contact heights above crowded bodies, and develop continuous curved mist geometry/advection within the same compact screen coverage. Keep the local danger priority and native hit outlines while doing so.
