# ROOM24

## Baseline

The integrated f4212bf2 build was captured in the quiet arena and while kiting. The four additional lighting comparison rooms are Awakening Bay, Passenger Vault, Freight Hold and Infested Workshop.

| Room | What identifies the original fighting lane |
|---|---|
| Relay Racks | Cable markings cross a grille, but the removable electronics are all in the rack row. |
| Service Shaft Landing | Twin guides suggest lift travel, while the ribbed winch drum sits below the lane. |
| Armory | The issue strip follows the counter, but its removable weapon mounts stay on the carousel. |
| Transmission Chamber | A branching deck pattern points toward the antenna equipment without a physical coupling in the lane. |
| Crew Checkpoint | The scanner already straddles a short slatted conveyor, with no luggage entering it. |
| Shielding Gate | The jammed carriage and torn shoe share a guide along the left margin. |
| Manual Control Chamber | The berth lamps and their short leads already identify the authorization station. |
| Coolant Plant | The drain alongside the ice sheet identifies the wet floor, while the pipework stays near the upper edge. |

## What crosses each lane

| Room | Physical connection |
|---|---|
| Relay Racks | Three dark trunk cables dogleg out of the racks to a pulled drawer. Four green-grey cards stand between its sides, behind a bare metal pull. |
| Service Shaft Landing | A winch cable runs diagonally onto the upper landing and bends across a broad guide sheave. Its rim, spokes and raised axle distinguish it from a hatch. |
| Armory | Two feed rails follow the carousel's issue side into a dropped magazine cradle. The dark base, retaining cheeks and tan magazine remain visible when the carousel cuts away. |
| Transmission Chamber | A paired metal waveguide bends away from the dish. A bolted coupling and its worklight interrupt the long run near the marine. |
| Crew Checkpoint | A roller bed extends the scanner into the lane. A raised baggage tray holds a single case, giving the player a way to recognize the scanner from above. |
| Shielding Gate | Alternating links sag away from the jammed shoe, cross the deck and reach a toothed drive sprocket. |
| Manual Control Chamber | A three-conductor loom leads from the authorization station along the passenger bank to a five-contact connector in the lane. |
| Coolant Plant | Two channel edges lead away from the cold header. Frost scales catch the light between them and collect against the drain bars. |

Each assembly occupies one merged draw batch and uses the existing deterministic collision map. The player can cross the low service fittings. The camera and Overload Floor encounter objects keep their integrated behaviour.

## Landmark lighting

All twenty story rooms use the same position for the hooded lens, its soft, directional deck spill and the High-tier point light. The eight machines put the lens beside their working end. The other twelve put it within 92 ship units of the arena centre, on the approach to the original landmark, plus the small mounting offset. The room supplies the accent. Manual Control uses the passenger bank's green. The spill is painted into the existing clipped 0.0214 m skin, so it persists on Low and when a combat effect takes the dynamic slot.

The High light requests the existing four-slot pool at priority −10. At the deck beneath the source its nominal direct illuminance is 65% of the marine lamp before colour and material response, with intensity scaled by the squared ratio of mounting heights. Blackout dims the source. The rendered pixels also include surrounding fixtures, material response and the marine's own glow.

## Visual verification

The twelve-room before and after galleries each contain 36 matched views. For each room, compare `l8-arena-calm-<room>.png` and both frames of `g6-kiting-<room>-01/02.png` under `artifacts/nextgen/room24-before/` and `room24-after/`. The pairs under `room24-comparison/` preserve 1920×1080 per side or reduce each side to 480×270. Files prefixed `grey-` show luminance without hue.

The first comparison exposed roller ends outside Checkpoint's angled inspection bed and a lens hidden by the worklight hood when viewed from above. The delivery build, cf43b116, aligns the rollers with the bed and exposes a strip of coloured glass on the hood's top. No camera changes were needed.

The eight service lights project 26–41% across and 40–53% down the quiet arena frame. At 480×270, the pulled rack drawer, lift sheave and slatted baggage tray still have distinct outlines in greyscale. In the four extra rooms the worklight sits along the thaw trail in Awakening, on the approach to the berth in Passenger Vault, beside the restraint in Freight and alongside the root fan in Workshop. Its coloured glass is clearer at native size than its soft spill under combat lighting.

Armory and Coolant Plant retain the weakest angles. The dropped magazine cradle stays in the kiting view, but when the carousel cuts away its rails lead to an empty circular footprint. Coolant's gutter connects the broken pipe to the drain, but frost inside the channel loses contrast against the surrounding ice at 480×270.

## Combat budgets

The Apple M1 Pro ran two realtime Arc fights with 25 heavy enemies in each of eight rooms on both tiers. The table gives second passes, from f4212bf2 to cf43b116. Preparation here is the renderer's last recorded preparation. Across all 32 final fights the peak was 260 draws against 330 allowed. Program inventory ranged from 144 to 429. All 32 fights recorded zero mid-combat compiles. Both builds returned benchmark status 2 solely for the separate 400-program inventory limit in Manual Control on Low. It recorded 429 then 426 programs on delivery, versus 429 on both baseline passes.

| Room | Tier | Peak draws | Prepared programs | Preparation (s) | Combat compiles |
|---|---|---:|---:|---:|---:|
| relay-racks | high | 170 → 170 | 148 → 145 | 0.75 → 0.86 | 0 → 0 |
| relay-racks | low | 155 → 157 | 329 → 329 | 0.72 → 0.85 | 0 → 0 |
| service-shaft-landing | high | 163 → 156 | 151 → 151 | 0.66 → 0.68 | 0 → 0 |
| service-shaft-landing | low | 149 → 149 | 331 → 334 | 0.68 → 0.69 | 0 → 0 |
| armory | high | 257 → 259 | 149 → 149 | 0.98 → 0.71 | 0 → 0 |
| armory | low | 245 → 250 | 330 → 330 | 0.86 → 0.78 | 0 → 0 |
| transmission-chamber | high | 160 → 160 | 149 → 149 | 1.19 → 1.04 | 0 → 0 |
| transmission-chamber | low | 147 → 150 | 330 → 330 | 1.18 → 1.13 | 0 → 0 |
| crew-checkpoint | high | 152 → 153 | 151 → 150 | 0.55 → 0.57 | 0 → 0 |
| crew-checkpoint | low | 139 → 140 | 334 → 334 | 0.56 → 0.59 | 0 → 0 |
| shielding-gate | high | 210 → 207 | 156 → 156 | 1.18 → 1.05 | 0 → 0 |
| shielding-gate | low | 197 → 202 | 343 → 342 | 1.19 → 1.01 | 0 → 0 |
| manual-control-chamber | high | 201 → 213 | 238 → 238 | 0.86 → 0.77 | 0 → 0 |
| manual-control-chamber | low | 191 → 186 | 429 → 426 | 0.85 → 0.80 | 0 → 0 |
| coolant-plant | high | 160 → 160 | 144 → 144 | 0.60 → 0.51 | 0 → 0 |
| coolant-plant | low | 145 → 144 | 325 → 326 | 0.57 → 0.51 | 0 → 0 |

The ten-core host's one-minute load ranged from 4.2 to 33.0 during baseline second passes and 5.2 to 19.3 during final second passes. The raw measurements are in `room24-bench-before/benchmark.json` and `room24-bench-after/benchmark.json` under `artifacts/nextgen/`.

## Full room-entry waits

Each High-tier traversal primed eight rooms, then revisited them in the same renderer. These measurements include the full wait until input resumed. All final warm revisits stayed under three seconds and had zero combat compiles. The shared final traversal passed on both visits. With the other runners closed, Shaft took 3.07 s on its priming visit, causing exit status 2. The baseline exceeded three seconds in six visits.

Baseline one-minute host load was 10.9–13.1 on ten logical cores.
Final with campaign one-minute host load was 6.9–7.6 on ten logical cores.
Final alone one-minute host load was 5.2–6.6 on ten logical cores.

| Warm revisit | Baseline (s) | Final with campaign (s) | Final alone (s) |
|---|---:|---:|---:|
| relay-racks | 3.73 | 1.96 | 2.40 |
| service-shaft-landing | 3.22 | 1.85 | 1.87 |
| armory | 2.09 | 1.46 | 1.20 |
| transmission-chamber | 2.26 | 1.75 | 1.68 |
| crew-checkpoint | 2.41 | 1.63 | 1.81 |
| shielding-gate | 2.46 | 2.16 | 2.24 |
| manual-control-chamber | 2.08 | 1.96 | 1.98 |
| coolant-plant | 1.33 | 1.72 | 1.75 |

Per-visit logs are in `room24-baseline-preparation/rooms.json`, `room24-shared-preparation/rooms.json` and `room24-solo-preparation/rooms.json`.

## Campaign

The production build passed. The competent Standard Breacher on seed 1729 died in Coolant Plant after twelve clears. Continuing through the normal Continue action from its earned Safety Interlock reward checkpoint preserved the build and resources. That continuation cleared all twenty rooms unassisted with zero runner errors and zero recorded defects. The receipts are `playtest/room24-final-native/report.json` and `playtest/room24-continued/report.json` under `artifacts/nextgen/`. Both used fast rendering and a 180 s startup timeout.

These rooms changed by at least 20 damage points compared with the ROOM23 competent run on the same seed. The ROOM24 column includes the successful continuation. The integrated builds also differ in combat logic.

| Room | ROOM23 | ROOM24 |
|---|---:|---:|
| communal-atrium | 27.8 | 0.0 |
| relay-racks | 95.0 | 0.0 |
| transmission-chamber | 50.9 | 85.1 |
| diagnostic-gallery | 69.2 | 117.4 |
| safety-interlock-station | 35.1 | 69.1 |
| coolant-plant | 38.9 | 110.3 |
| infested-workshop | 60.0 | 0.0 |
| swarm-junction | 84.1 | 146.6 |
| shielding-gate | 44.0 | 0.0 |
| manual-control-chamber | 159.5 | 110.5 |
| overload-floor | 133.6 | 84.0 |

A fresh expert-profile Standard Breacher run on the same seed and delivery build cleared all twenty rooms from the start, unassisted, with zero errors and zero recorded defects. The full native receipt is `artifacts/nextgen/playtest/room24-expert/report.json`.
