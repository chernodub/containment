# L8 — authored ship layouts, convergence record

Branch: `t3/re-author-story-room-layouts`. Gameplay is byte-identical to repaired-navigation **`c7c75b985a30eb297596680cff9735e2ca86d6de`**; production rendering is byte-identical to mounted-fitting **`26d45f0ae140f229411cd8f714a199d39e4b1fd9`**. Convergence commit: `96ceeb69dd5890ab43a61e0d72acce473d291eff`. The Freight19 request and rejected service-ingress/Swarm-baffle code were removed. Freight remains 18. No Freight19 cohort ran.

The twenty rooms now use articulated hulls, connected partitions, named sub-spaces, structural bays and feature-backed breaches. The checker requires ≥60% connected solid UNION, ≤2 freestanding groups, ≥3 named spaces, 140-unit openings, R70 threshold clearance, full R32 opening sweeps, an R144 fight circle and ±20% walkable area. Nonholdouts also require alternate physical routes with each opening sealed; Transmission and Overload retain deliberate holdout exemptions. All 16 legacy templates, route ids, story, run generation and checkpoint schema remain unchanged.

|Room|What changed|
|---|---|
|Awakening Bay|Wake threshold, pod aisle, recovery bay and observation/service circuit.|
|Passenger Vault|Hull-backed cryo banks, inspection aisle and service return.|
|Residential Gallery|Six furnished open-front cabins, central gallery, common nook and exit bay.|
|Communal Atrium|Galley frontage, common floor, garden and welcome nook.|
|Crew Checkpoint|Vestibule, inspection booths, scanner hall, two bypasses, guard cage and exit lock.|
|Armory|Retained horseshoe issue counter connected to magazine and fitting/weapon court.|
|Freight Hold|Loading neck, stock court/control booth, tow floor and dispatch recess.|
|Breached Loading Bay|Dock apron, repair trunk around the retained hull scar and pressure lock.|
|Relay Racks|Paired rack aisles, service spine, cross-aisles and console bay.|
|Transmission Chamber|Defensible nave, uplink chancel/apse, airlock and service chapel.|
|Diagnostic Gallery|Four three-sided workbays, side doors, nave and access landings.|
|Safety Interlock Station|Open recorder/AI gallery, two-ended interlock cage and battery return.|
|Coolant Plant|Pump galleries, split return banks and cross-service opening.|
|Service Shaft Landing|Retained C balcony/shaft, docking recesses and lift landing.|
|Infested Workshop|Loading dock, lathe/tool/gantry workbays, side door and rear service gallery.|
|Swarm Junction|Deep hull-connected vent banks, growth crossing and northern throat; no candidate baffles.|
|Shielding Gate|Offset shield banks, scanner floor and sterilization bypass.|
|Containment Annulus|Intact core translated (+200,+80), inspection ring, paired airlocks and western fight floor.|
|Manual Control Chamber|Authorization booth, core threshold and fatal-cost gallery.|
|Overload Floor|Retained translated hot core, reaction feed, exhaust and western holdout floor.|

Decks subtract the actual solid UNION. Existing CC0 furniture fits the new spaces; interior walls use 0.90m cutaways with 0.91m caps. Architecture-shaped fixture spill replaces circular suit-fill discs; the marine lamp remains. Function-tied markings replace the repeated patch/confetti/bar recipe, infestation follows structural seams, and sixty mounted ingress fittings use actual backing faces. Maximum dressing is 11860/12000 triangles. Safety's 903 static meshes batch to 24 without changing geometry/material ownership. Camera/body/HUD guards remain; the radar follows the geometry without UI edits. No actor or ability-system source changed.

## Simulation and accepted balance record

The navigation repair expires stale commitments after eight distinct deterministic decisions without one unit of net improvement; repeated speculative queries in one decision do not advance it. Final c7 proof: 2256 legal marine goals / 45120 family routes, 3360 native family opportunities, 168 mixed-crowd targets and 157 opening targets / 3140 actors, all with zero unresolved cases. Worst opening crowd resolution is 18.05s against the unchanged 60s bound. Four rigs ×20 rooms replay identically. The additional active Swarm attack-access regression passes 288/288 native trials across 36 positions, maximum 8.55s.

The accepted audit uses forty fixed seeds per rig, 160 matched attempts per profile and the unchanged reference bot. Exact source identities, per-room distributions and all 320 report hashes remain in [the c7 comparison](../../artifacts/nextgen/l8-final/converged/balance/c7-N160-comparison.md) and its [JSON](../../artifacts/nextgen/l8-final/converged/balance/c7-N160-comparison.json).

|Metric|Before|c7 accepted record|
|---|---:|---:|
|Completion|88/160,55.00%|94/160,58.75%|
|Breacher / Cryo / Pyro / Arc completion|47.5 /75 /35 /62.5%|42.5 /70 /52.5 /70%|
|Maximum rig distance from overall rate|20.00pp|**16.25pp — accepted miss** against≈15pp|
|Ordinary-room median|32.175s|**29.916667s — accepted miss** against30–45s|
|Transmission median|67.4417s|61.4333s|
|Rooms per Overdrive, per-rig range|1.364–1.429|1.393–1.429|

The lead accepted those two misses on 2026-11-15; neither is rounded into a pass. All 160 runs clear the first five rooms; 94 complete and 66 die naturally, deaths in rooms10–20, with no errors/censors or ordinary-room Overdrive-cap violations. Full-kit ability attribution is 33.169/32.601/42.340/32.646%, clear times 93.25/97.15/80.70/89.05s, spread 1.20384×: unchanged 30–45% and≤1.25× guards pass.

Encounter changes from baseline are limited to Transmission 32→34 (last 23900→25400ms), Diagnostic 27→29 (4230→4410ms), Safety 28→30 (4320→4500ms), Shielding 31→33 (4400→4580ms): eight additional requests total. Every original prefix/RNG field, family pool, cap and introductory encounter remains; Freight 18 and Overload 48 remain. Numeric geometry changes and c7 soak receipts are retained under `artifacts/nextgen/l8-final/converged/simulation/`.

## Final gates and evidence

All requested convergence gates passed once on the frozen source; full logs and browser receipts are in `artifacts/nextgen/l8-final/converged/verification/`.

```text
Vitest: Test Files 405 passed | 2 skipped (407)
Vitest: Tests 5264 passed | 2 skipped (5266); Duration 434.00s
cryo preview: tests 2; pass 2; fail 0
build: ✓ built in 562ms (existing large-chunk warning)
room-evidence: pass 28; fail 0; ragdoll {"passed":true,"cpuOnly":true,"checks":33}
Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
Authored desktop smoke passed: 20 rooms, native move/fire, Continue/route, pause/resume, Low quality, no browser errors.
l8-converged-smoke: room-limit; 3 rooms cleared; 0 errors
```

The initial sandboxed smoke invocation could not bind 127.0.0.1 and stopped before browser assertions; the permitted invocation above is the completed run. No test failure was rerun.

The source-frozen 27 JS/CSS build assets match the mounted26 distribution exactly. [The migration ledger](plans/L8-test-migrations.md) lists each rewritten layout/presentation test and its replacement behavioral guarantee; gameplay, navigation, persistence, determinism, input and accessibility invariants were retained. Proposal-only suites were removed with the rejected code.

Final evidence root: `artifacts/nextgen/l8-final/converged/`. [Gallery](../../artifacts/nextgen/l8-final/converged/index.html), [old/new twenty-room plans](../../artifacts/nextgen/l8-final/converged/twenty-old-new-plans.png), [twenty calm](../../artifacts/nextgen/l8-final/converged/twenty-calm.png), [twenty kiting](../../artifacts/nextgen/l8-final/converged/twenty-kiting02.png), [per-room absolute before/after paths and hashes](../../artifacts/nextgen/l8-final/converged/gallery.json). Native PNGs, exact 480×270 and grayscale reviews, four-phase storyboards and parent manifests are retained there. Kiting is a guarded staged native fixture, not an organic campaign or balance proof.

Per lead convergence, no final per-rig native browser campaigns or quiet hardware benchmarks ran: integration owns those after merge. No final hardware FPS/budget pass is claimed. The staged final G6 captures contain **eleven draw-cap misses** against 330: Armory 360/356/356, Freight 365/355/339/357, Transmission 493/492/395/355. Calm/arena-calm and the canonical standard stay ≤330. These are recorded misses, left unchanged by convergence; staged counters do not establish hardware FPS. The retained capture preparation counters have median 0.680s and worst 1.994s; all twenty arena-calm views add zero new programs. [Staged budget receipt](../../artifacts/nextgen/l8-final/converged/verification/staged-budget-summary.json). The existing Freight/Breacher hardware miss is not certified resolved. Superseded L8 capture rounds and uncited simulation raw outputs are removed after verifying final copies; the c7 comparison and cited proof remain. Cleanup removed 100 paths /5.366GiB; `cleanup.json` records every retired path and the retained replacements.

## What still looks weak

- Low partition walls often read as thin floor stripes or shallow modular blocks from the gameplay camera.
- Crew Checkpoint, Diagnostic, Infested Workshop, Swarm Junction, Containment Annulus and Manual Control spawn views are mostly bare tile grid.
- Furniture and mounted architectural detail often sit outside the close fighting crop; Residential's fight floor still feels sparse.
- Freight's low box masses do not fully convey the scale and weight of a working cargo hold.
- Workshop growth reads as thin graphic strands; several combat floors share a sterile value/tiling pattern.
- The Annulus foundation remains visually heavy, while Overload's heat composition is stronger than its quiet-floor detail.

These are follow-up art work, left unchanged by the convergence decision. This report does not claim premium environment-art acceptance.
