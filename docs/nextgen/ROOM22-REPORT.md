# ROOM22

## Baseline

The baseline uses 0b97db74 with one faint stencil per room. Reading the incident and arena views with the lettering ignored gave these six observations.

| Room | Centre before |
|---|---|
| Shielding Gate | Painted guides cross the centre, while the damaged carriage is at the upper edge. |
| Freight Hold | The transverse shoes identify a handling lane, but the tipped load and its narrow belt sit outside the main court. |
| Infested Workshop | A purple deposit points away from the machine at the upper edge and leaves a service trench in the middle. |
| Manual Control Chamber | An abandoned chair and authorization desk sit to the left of a plain access cover. |
| Swarm Junction | Branching seams suggest damaged ducts, with the recognisable growth farther down the lane. |
| Breached Loading Bay | A pale tongue crosses the dock lines, but its folded edge flattens into the deck. |

## Assemblies

The rooms use original geometry authored in ship units and merged by finish. The shaped metal faces, rods, webbing and organic lobes use the same builder as the existing incidents. Each lens registers a source with the existing pooled lighting system. The five occupied windows share the actual Passenger Vault observation texture. The layouts retain the existing collision map and encounter entrances.

| Room | Shape and connection |
|---|---|
| Shielding Gate | The two flanges diverge as they leave the damaged guide. They terminate in a marine-sized U-shaped shoe with an exposed roller, polished jaw and four sheared studs. |
| Freight Hold | Wide folded webbing runs from the load's deck eye across the handling lane. Separate strands lead into a gap before the raised ratchet handle and spool on the deck shoe. |
| Infested Workshop | Roots escape around the exposed spindle of the split mill and fan across the approach. Blisters and patches of tissue join the veins while leaving gaps over the deck. The first capture showed too many parallel bends, so the final version varies their paths and widths. |
| Manual Control Chamber | Five berth-shaped bezels carry the occupied-window image and individual pale green life lamps. Two copper leads bend back to the guarded authorization contact. |
| Swarm Junction | Three flanged ducts meet a raised valve chest with a spoked handwheel. Growth wraps the port side and leaves the opposite flange exposed. |
| Breached Loading Bay | A folded strip with bright upper skin, dark underside and exposed ribs lifts off the existing tear. A lamp at its elbow picks out the lip beside the drag. |

Diagnostic Gallery has an open examination hoop over a narrow bed, with a cyan read head. Safety Interlock has two insulated posts and an open bridging blade, lit amber. Manual Control's horizontal bank of green berth lights leads back to the authorization control. Each retains its original decision text.

## Fighting-window comparison

The two galleries contain the same 24 views under `artifacts/nextgen/room22-before/` and `artifacts/nextgen/room22-after/`. Each room ID has `l8-arena-calm-<room>.png`, `g6-kiting-<room>-01.png`, `g6-kiting-<room>-02.png` and `incident-facing-<room>.png`. The paired colour and greyscale versions are in `room22-comparison/`, with each original shown at 1920×1080 or 480×270. Three additional decision views are in `room22-final-decisions/`.

At 480×270 the joined rail and guide shoe keep their silhouette in the incident view. The bent guide remains visible during kiting, although part of the shoe disappears under the actor cutaway. The Workshop's chain of blisters runs from the mill to the fighting lane in all three views. The folded lip in Loading Bay casts a dark edge alongside the pale drag, visible even when the top of the rupture leaves the screen. The row of five passenger monitors is legible during kiting in greyscale. The cable and authorization contact are clearest together in the incident view.

Swarm Junction and Freight Hold still have the weakest angles. Swarm's wheel gives the quiet court a centre, but the kiting cutaway hides much of the valve and the incident camera puts it near the upper edge. In Freight the wide strap crosses the quiet lane, but the incident view puts the ratchet near the bottom edge. The raised geometry is easier to follow than the individual torn fibres at 480×270.

## Combat budgets

The realtime benchmark used the same six room fixtures with the Arc rig, 25 heavy enemies, both tiers and two passes on the Apple M1 Pro. These are the second passes. Preparation is the renderer's last recorded room preparation. Peak draws are observed in the fight. Each pair reads from baseline 0b97db74 to delivery 332ed716.

| Room | Tier | Peak draws | Prepared programs | Preparation (s) | Combat compiles |
|---|---|---:|---:|---:|---:|
| shielding-gate | high | 216 → 211 | 152 → 154 | 0.97 → 1.09 | 0 → 0 |
| shielding-gate | low | 201 → 200 | 331 → 336 | 0.97 → 1.13 | 0 → 0 |
| freight-hold | high | 156 → 163 | 146 → 148 | 0.92 → 1.02 | 0 → 0 |
| freight-hold | low | 148 → 151 | 319 → 323 | 0.96 → 0.90 | 0 → 0 |
| infested-workshop | high | 196 → 210 | 144 → 146 | 1.00 → 0.83 | 0 → 0 |
| infested-workshop | low | 198 → 200 | 324 → 328 | 1.06 → 0.82 | 0 → 0 |
| manual-control-chamber | high | 206 → 225 | 227 → 231 | 1.41 → 0.88 | 0 → 0 |
| manual-control-chamber | low | 209 → 207 | 409 → 417 | 0.90 → 0.83 | 0 → 0 |
| swarm-junction | high | 131 → 135 | 145 → 150 | 0.95 → 0.60 | 0 → 0 |
| swarm-junction | low | 121 → 122 | 326 → 330 | 0.65 → 0.62 | 0 → 0 |
| breached-loading-bay | high | 164 → 164 | 149 → 151 | 1.12 → 0.97 | 0 → 0 |
| breached-loading-bay | low | 148 → 155 | 322 → 326 | 0.99 → 0.91 | 0 → 0 |

The one-minute load on ten logical cores ranged from 14.9 to 142.5 during baseline second passes and from 6.2 to 32.8 during final second passes. The peak across both final passes was 231 draws. All 24 final samples recorded zero combat compiles. The benchmark returned status 2 on both builds because Manual Control Low exceeded its separate 400-program inventory limit, rising from 409 to 417 on the second pass. The final second passes all prepared within three seconds. In the first pass, Gate Low took 6.31 s and Manual High and Low took 15.44 s and 5.43 s. The raw measurements are in `room22-bench-before/benchmark.json` and `room22-bench-after/benchmark.json`.

A separate High-tier traversal measured the entire wait until input could resume, with six rooms primed and revisited in the same renderer. The two reports are `room22-baseline-preparation/rooms.json` and `room22-warm-preparation/rooms.json`.

| Warm revisit | Baseline (s) | Final (s) |
|---|---:|---:|
| Shielding Gate | 3.01 | 2.46 |
| Freight Hold | 2.66 | 2.33 |
| Infested Workshop | 2.25 | 2.42 |
| Manual Control Chamber | 2.76 | 2.97 |
| Swarm Junction | 2.25 | 2.48 |
| Breached Loading Bay | 2.54 | 2.57 |

The final retained run shared the machine with the native campaign. All six warm revisits met the three-second budget and created zero programs during combat. On the priming traversal Manual Control took 3.12 s and Swarm Junction took 3.86 s, producing exit status 2. The per-row mode and elapsed time identify these as priming visits.

With the campaign and capture browsers closed, the final High-tier audit passed with zero failures and zero combat compiles. The one-minute load was 4.14–4.48 on ten logical cores. Priming visits took 1.32–2.14 s. Warm preparation took 1.77 s in Gate, 1.69 s in Freight, 1.61 s in Workshop, 1.84 s in Manual Control, 1.47 s in Swarm and 1.76 s in Loading Bay. The full receipt is in `room22-solo-preparation/rooms.json`.

## Native campaign

The final production build passed. The competent Standard Breacher cleared all twenty rooms unassisted on seed 1729, with native keyboard and mouse, fast rendering and a 180 s startup timeout. The runner recorded zero errors and five loading-screen defects. It returned status 1. The hold log recorded six transitions over five seconds, including Armory, which the defect list omitted. Awakening Bay lasted 14.36 s, Passenger Vault 10.67 s, Residential Gallery 12.95 s, Armory 10.07 s, Freight Hold 5.93 s and Manual Control 6.72 s. One-minute load fell from 42.4 to 4.9 on ten logical cores across the campaign. The route, inputs and full damage ledger are in `artifacts/nextgen/playtest/room22-native/report.json`.

The following rooms changed by at least 20 points of damage against ROOM21's native Standard Breacher on the same seed. The two runs use different integrated game revisions, so room dressing alone cannot explain the differences.

| Room | ROOM21 damage | ROOM22 damage |
|---|---:|---:|
| Armory | 38.5 | 68.3 |
| Relay Racks | 50.3 | 107.8 |
| Transmission Chamber | 57.6 | 79.9 |
| Diagnostic Gallery | 49.6 | 18.6 |
| Infested Workshop | 44.0 | 0.0 |
| Containment Annulus | 44.0 | 10.1 |
| Manual Control Chamber | 103.5 | 64.9 |
