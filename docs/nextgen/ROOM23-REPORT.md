# ROOM23

## Baseline

The baseline is the integrated 1d943a1f production build. The quiet view in Residential shows patterned deck beneath furniture at the upper edge. Checkpoint shows a numbered barrier edge-on. At Gate the shoe is visible but its rails leave the view. Armory shows the carousel above an issue strip, while the central deck gets more space than its clamps. Freight's strap and floor socket are already readable as a pair. Workshop's pale blisters draw attention away from the marine's plates.

The baseline gallery is `artifacts/nextgen/room23-before/`. Each of the six rooms has one quiet arena frame, a kiting burst and an incident-facing frame.

## Objects and deck

| Room | What changed |
|---|---|
| Residential Gallery | A tilted supper table sits at the fighting-lane margin. Its folding steel legs, two padded stools and three spilled dishes carry the domestic scene out from the upper wall. |
| Crew Checkpoint | A blue-grey arch spans a short slatted inspection conveyor. The two upright readers face the bed and a practical picks out its exit. |
| Shielding Gate | A skewed roller carriage straddles the bent guides. The torn drawbar ends beside the detached shoe. A dark stop pad, worn metal lip and painted bogie separate the parts. |
| Armory | Eight loading shoes repeat around the installed weapon hoop. Each has a painted housing, a dull inset pad and a bare outer lip. A native crop showed the first edit had landed on the fallback carousel, so the final shoes are seated on the production hoop. |
| Freight Hold | The folded strap on the tilted lid has a dark chafe sleeve and steel corner protector. The sprung ratchet has a dark handgrip, distinct from its metal loop and tan cargo web. |
| Infested Workshop | The blister bodies are a darker plum. Their caps and the tissue between lobes sit closer to the machine's value while the spindle remains visible. |
| Manual Control Chamber | Dark contact pads interrupt the passenger bank's front lip below its five lit bezels. |
| Swarm Junction and Breached Loading Bay | A dark hand contact on the valve wheel and a dark isolating strip beneath the hull fitting break up the steel. |

The centre dressing is baked into the existing clipped 0.0214 m deck skin. Awakening Bay, Passenger Vault, Coolant Plant and Workshop have a drain with a wet margin. Relay Racks, Transmission Chamber, Diagnostic Gallery, Safety Interlock, Swarm Junction and Manual Control have cable bundles held by two clips. Armory, Containment Annulus, Overload Floor and Crew Checkpoint have a vent beside short scorch streaks. Residential Gallery, Communal Atrium, Freight Hold, Breached Loading Bay, Service Shaft Landing and Shielding Gate have small piles of dislodged slats. The details have short contact shadows. Each room's single registration now sits on the approach to its exit. Collision, encounter entrances and the surface shader were untouched.

## Fighting-window comparison

The final gallery uses delivery build 4f6a078f. The matching names under `room23-before/` and `room23-after/` are `l8-arena-calm-<room>.png`, `g6-kiting-<room>-01.png` through `-04.png` and `incident-facing-<room>.png`. In `room23-comparison/`, the `1920-` and `480-` pairs show the original and final views side by side. The `grey-` pairs use the same geometry and framing without colour.

At 480×270 the overturned table and spilled dishes read together, and the Gate carriage stays beside its shoe in the incident frame. Freight's sleeve interrupts the continuous web across the tilted lid. Workshop's blisters are visibly darker in matching frames. Checkpoint and Armory are the weakest views. Checkpoint's narrow arch looks straight down onto its cap in the incident view, making the slatted bed easier to identify than the opening. Armory's pads are visible on the hoop at native size but the carousel cuts away altogether during kiting. The final kiting comparison confirms its grip pads disappear with it.

## Combat budgets

The Apple M1 Pro ran two realtime 25-enemy Arc fixtures per room and quality tier. The table shows the second pass, from baseline 1d943a1f to final 4f6a078f. Preparation is the renderer's last recorded preparation. Peak draws and program inventories are direct observations. All 24 final samples stayed under 330 draws, peaking at 256, and no program compiled during combat. The raw results are in `room23-bench-before/benchmark.json` and `room23-bench-after/benchmark.json`.

| Room | Tier | Peak draws | Prepared programs | Preparation (s) | Combat compiles |
|---|---|---:|---:|---:|---:|
| residential-gallery | high | 143 → 142 | 147 → 149 | 0.58 → 0.76 | 0 → 0 |
| residential-gallery | low | 131 → 131 | 326 → 330 | 0.60 → 0.69 | 0 → 0 |
| crew-checkpoint | high | 150 → 152 | 149 → 151 | 0.51 → 0.56 | 0 → 0 |
| crew-checkpoint | low | 140 → 144 | 330 → 334 | 0.54 → 0.57 | 0 → 0 |
| shielding-gate | high | 210 → 212 | 156 → 156 | 1.11 → 1.11 | 0 → 0 |
| shielding-gate | low | 198 → 200 | 343 → 343 | 1.00 → 1.09 | 0 → 0 |
| armory | high | 262 → 256 | 148 → 149 | 0.82 → 0.80 | 0 → 0 |
| armory | low | 257 → 245 | 327 → 330 | 0.77 → 0.84 | 0 → 0 |
| freight-hold | high | 159 → 159 | 150 → 150 | 0.85 → 0.91 | 0 → 0 |
| freight-hold | low | 146 → 147 | 333 → 333 | 0.88 → 0.86 | 0 → 0 |
| infested-workshop | high | 196 → 196 | 151 → 151 | 0.83 → 0.83 | 0 → 0 |
| infested-workshop | low | 184 → 201 | 335 → 335 | 0.83 → 0.82 | 0 → 0 |

One-minute load on ten logical cores ranged from 25.4 to 50.5 during the baseline second passes and from 29.1 to 76.0 during the final second passes. These fights shared the host with other rendering work.

## Warm room entry

Each High-tier traversal primed six rooms and revisited them in the same renderer. Times below include the full wait until input resumed. All three traversals passed with zero combat compiles. The receipts are in the corresponding `room23-*-preparation/rooms.json` files.

The baseline run had a one-minute load of 44.1–44.4 on ten logical cores.
The shared run had a one-minute load of 67.2–71.2 on ten logical cores.
The solo run had a one-minute load of 13.4–14.0 on ten logical cores.

| Room | Baseline (s) | Final with campaign (s) | Final with campaign closed (s) |
|---|---:|---:|---:|
| residential-gallery | 1.66 | 1.46 | 0.89 |
| crew-checkpoint | 1.45 | 1.57 | 0.91 |
| shielding-gate | 1.86 | 1.50 | 1.28 |
| armory | 1.30 | 1.51 | 0.88 |
| freight-hold | 1.30 | 1.64 | 0.88 |
| infested-workshop | 1.59 | 1.54 | 0.92 |

## Native campaign

The competent Standard Breacher cleared all twenty rooms unassisted on seed 1729 with zero runner errors. The runner returned status 1 for a single loading-screen defect. Manual Control took 7.24 seconds to enter. The production build passed. The inputs, load holds and damage ledger are in `artifacts/nextgen/playtest/room23-native/report.json`.

Damage changed by at least 20 points in the following rooms compared with ROOM22 on the same rig, difficulty and seed. The integrated builds also differ in combat logic.

| Room | ROOM22 | ROOM23 |
|---|---:|---:|
| communal-atrium | 0.0 | 27.8 |
| armory | 68.2 | 10.5 |
| breached-loading-bay | 20.0 | 0.0 |
| transmission-chamber | 79.9 | 50.9 |
| diagnostic-gallery | 18.6 | 69.2 |
| infested-workshop | 0.0 | 60.0 |
| shielding-gate | 76.4 | 44.0 |
| manual-control-chamber | 64.9 | 159.5 |
| overload-floor | 16.3 | 133.6 |
