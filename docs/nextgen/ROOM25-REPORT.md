# ROOM25 · Machinery through the fighting lane

## Before

Captured the reviewed build at 4ea56510. The quiet arena frame and both kiting frames are in `artifacts/nextgen/room25-before/` as `l8-arena-calm-<room>.png` and `g6-kiting-<room>-01.png` / `-02.png`. Transmission and Coolant have the same three reference views.

| Room | What the lane shows before |
|---|---|
| Awakening Bay | The thaw streak reaches in from the pod row, then gives way to a dry grate beside the marine. |
| Passenger Vault | The berth bank faces a broad strip of uninterrupted blue deck. |
| Residential Gallery | A few dishes have rolled from the table into the lane. |
| Communal Atrium | The garden throws green across the apron, but the lane ends at a narrow grille. |
| Freight Hold | The floor socket and diagonal scrape point back toward the dropped load. |
| Breached Loading Bay | Peeled steel already runs down the apron beneath the marine. |
| Diagnostic Gallery | The recorder console and its readout sit beside an ordinary deck joint. |
| Safety Interlock Station | The recorder and warm flank machinery frame a plain central approach. |
| Infested Workshop | A chain of swollen growths reaches from the mill to the marine. |
| Swarm Junction | The overgrown manifold reaches the near side of the lane. |
| Containment Annulus | A cracked deck leads to the ring, with little of the ring hardware at the marine's feet. |
| Overload Floor | A thin service line crosses the deck between the marine and the reactor. |

## What crosses the lane

| Room | What the player sees |
|---|---|
| Awakening Bay | A heavy thaw hose sags between the pod bank and a twist-lock coupling beside the marine. A thinner return line follows its bends. |
| Passenger Vault | A roller conveyor comes off the berth bank with two belted cases, one slipping sideways at the end. |
| Residential Gallery | A low serving trolley carries a plate and a cup on two runners leading back to the overturned dining unit. |
| Communal Atrium | A row of irrigation outlets leads from the garden to the mouth of a tipped planter, with leaves spilling over the rim. |
| Freight Hold | Pallet rails and widely spaced sleepers lead out from the fallen load to a pair of worn wheel stops. |
| Breached Loading Bay | Two mooring cables spread from the peeled lip and come together around a low deck cleat. |
| Diagnostic Gallery | A narrow rail links the recorder to a pivoting sensor arm with two inspection lenses. |
| Safety Interlock Station | A sliding lock bar fills the central channel and ends in three heavy keeper teeth. The flank controls have their original positions and interactions. |
| Infested Workshop | A swarf chute runs out from the mill beside the growth and tips curled metal into a shallow catch tray. |
| Swarm Junction | A collared duct branches off the overgrown manifold and forks at a vent in the fighting lane. |
| Containment Annulus | Five curved lengths of clamp casing lead from the ring to an open pair of steel jaws. |
| Overload Floor | A flanged coolant main comes off the reactor side and elbows beside the fighting lane. The authored relay banks and both crossing routes retain their encounter geometry. |

The twelve assemblies use one merged vertex-coloured prop apiece. Each lamp sits at the service end of its machine. The High-tier worklight requests 65% of the marine lamp's height-normalised intensity and yields its slot to combat lights. That percentage describes the source setting. Floor albedo, the viewing angle and fog affect the visible ratio. Both tiers receive the hood's shaped spill on the deck. Transmission has a second hood on the dish receiver and Coolant has one on the split header. Both use the existing landmark illumination and baked spill.

## Fighting-distance comparison

Compared 42 paired frames from 4ea56510 and dfcd758a at 1920×1080 and 480×270 in colour and greyscale. The final gallery is `artifacts/nextgen/room25-after/` with the same names as the baseline. Under `room25-comparison/`, `480-` and `1920-` prefix the side-by-side images, and `grey-` prefixes their greyscale versions. Each capture manifest records 42 shots with zero errors or failed captures.

Passenger Vault's conveyor and the arc of Containment Annulus's clamp remain distinct when hostiles cover their middle sections. The quiet view in Residential exposed a cutaway hiding the whole serving trolley. Lowering the shelf and sensor head in the delivery build keeps both machines visible near the marine. Transmission's receiver now projects blue light onto the waveguide end. The second cold hood in Coolant picks out the pipe break even when the marine is down by the drain.

**The two weakest rooms are Safety Interlock and Infested Workshop.** Interlock's bar reads from the side while kiting, but the recorder sign covers its keeper teeth from the quiet camera. Workshop's chute has a continuous edge back to the mill, but in a crowded 480×270 frame the swarf becomes a dark knot beside the brighter blisters.

## Performance

Separate Arc stress fights on High and Low measured rendering cost, with two trials per room and tier. Across both trials in the twelve rooms the highest draw count was 295 before and 258 after, against a limit of 330. No shader compiled during combat. On the ten-core host the one-minute load during second passes was 3.5–9.6 before and 3.5–7.8 after.

The table gives second-pass values from the combat runner. Preparation is in seconds. Arrows run from baseline to delivery.

| Room | Tier | Peak draws | Prepared programs | Preparation (s) | Combat compiles |
|---|---|---:|---:|---:|---:|
| awakening-bay | high | 186 → 187 | 165 → 167 | 1.58 → 1.57 | 0 → 0 |
| awakening-bay | low | 173 → 175 | 352 → 356 | 1.55 → 1.59 | 0 → 0 |
| passenger-vault | high | 150 → 153 | 158 → 160 | 1.12 → 1.11 | 0 → 0 |
| passenger-vault | low | 141 → 138 | 347 → 351 | 1.09 → 1.12 | 0 → 0 |
| residential-gallery | high | 141 → 144 | 151 → 151 | 0.55 → 0.60 | 0 → 0 |
| residential-gallery | low | 131 → 142 | 336 → 336 | 0.56 → 0.57 | 0 → 0 |
| communal-atrium | high | 174 → 176 | 158 → 160 | 0.93 → 0.94 | 0 → 0 |
| communal-atrium | low | 163 → 165 | 349 → 353 | 0.97 → 1.00 | 0 → 0 |
| freight-hold | high | 157 → 160 | 152 → 154 | 0.76 → 0.77 | 0 → 0 |
| freight-hold | low | 145 → 146 | 339 → 343 | 0.73 → 0.78 | 0 → 0 |
| breached-loading-bay | high | 167 → 165 | 155 → 157 | 0.87 → 0.91 | 0 → 0 |
| breached-loading-bay | low | 155 → 152 | 342 → 346 | 0.86 → 0.92 | 0 → 0 |
| diagnostic-gallery | high | 149 → 149 | 159 → 161 | 0.68 → 0.69 | 0 → 0 |
| diagnostic-gallery | low | 138 → 136 | 352 → 356 | 0.66 → 0.70 | 0 → 0 |
| safety-interlock-station | high | 284 → 240 | 160 → 162 | 1.06 → 1.07 | 0 → 0 |
| safety-interlock-station | low | 274 → 238 | 353 → 357 | 1.10 → 1.08 | 0 → 0 |
| infested-workshop | high | 199 → 198 | 153 → 151 | 0.62 → 0.62 | 0 → 0 |
| infested-workshop | low | 186 → 202 | 341 → 337 | 0.64 → 0.65 | 0 → 0 |
| swarm-junction | high | 141 → 140 | 154 → 152 | 0.57 → 0.56 | 0 → 0 |
| swarm-junction | low | 130 → 131 | 343 → 339 | 0.65 → 0.54 | 0 → 0 |
| containment-annulus | high | 163 → 156 | 156 → 158 | 1.21 → 1.08 | 0 → 0 |
| containment-annulus | low | 151 → 146 | 345 → 349 | 1.35 → 1.08 | 0 → 0 |
| overload-floor | high | 162 → 165 | 234 → 238 | 1.08 → 0.80 | 0 → 0 |
| overload-floor | low | 149 → 152 | 425 → 429 | 0.91 → 0.83 | 0 → 0 |

The first final sweep stopped after the second Overload High trial because enemy population dropped below the sustained-stress threshold. An isolated repeat completed both Overload tiers. Its Low trials retained 427 and 429 programs, over the benchmark's separate 400-program ceiling. Both baseline Low trials also exceeded that ceiling at 425. The repeat recorded zero combat compiles. The raw records are `room25-bench-before/benchmark.json`, `room25-bench-after/benchmark.json` and `room25-overload-repeat/benchmark.json` under `artifacts/nextgen/`.

### Transmission and Coolant landmark lamps

Both additional lighting rooms ran the same two-trial combat measurement on each tier. Second-pass results follow. The raw runs are in `room25-lights-before/benchmark.json` and `room25-lights-after/benchmark.json`.

| Room | Tier | Peak draws | Resident programs | Preparation (s) | Combat compiles |
|---|---|---:|---:|---:|---:|
| transmission-chamber | high | 159 → 161 | 151 → 153 | 1.01 → 1.03 | 0 → 0 |
| transmission-chamber | low | 149 → 144 | 336 → 340 | 1.02 → 1.01 | 0 → 0 |
| coolant-plant | high | 161 → 160 | 149 → 151 | 0.51 → 0.53 | 0 → 0 |
| coolant-plant | low | 148 → 148 | 332 → 336 | 0.54 → 0.54 | 0 → 0 |

### Full input-ready room-entry time

The retained-renderer High traversal primed all twelve rooms and revisited each one. Baseline warm entries took 0.85–2.29 s at a one-minute host load of 9.0–9.2. The final traversal ran after the campaign and combat runner finished. Its warm entries took 0.63–2.24 s at load 3.3–4.0 on ten logical cores. Every final entry, including the priming visits, met the three-second budget. The data are in `room25-prep-before/rooms.json` and `room25-prep-after/rooms.json`.

| Full room-entry wait | Before (s) | After (s) |
|---|---:|---:|
| awakening-bay | 2.29 | 2.24 |
| passenger-vault | 1.28 | 1.23 |
| residential-gallery | 0.98 | 0.63 |
| communal-atrium | 1.03 | 1.01 |
| freight-hold | 0.86 | 0.84 |
| breached-loading-bay | 1.24 | 1.21 |
| diagnostic-gallery | 0.85 | 0.79 |
| safety-interlock-station | 1.24 | 1.22 |
| infested-workshop | 1.05 | 0.85 |
| swarm-junction | 1.24 | 0.63 |
| containment-annulus | 1.59 | 1.38 |
| overload-floor | 1.74 | 1.25 |

## Campaign

The production build passed. The Standard Breacher, seed 1729, cleared all twenty rooms from the start with zero errors and zero recorded defects. The run used the expert policy, fast rendering and a 180-second startup timeout, matching the unassisted ROOM24 expert comparison. The highest sampled campaign draw count was 273 in Shielding Gate. The receipt is `artifacts/nextgen/playtest/room25-native/report.json`.

Seven rooms changed by at least 20 damage points against `playtest/room24-expert/report.json`. These figures compare one run per integrated build.

| Room | ROOM24 damage | ROOM25 damage | Change |
|---|---:|---:|---:|
| breached-loading-bay | 0.0 | 27.7 | +27.7 |
| transmission-chamber | 11.1 | 35.4 | +24.3 |
| service-shaft-landing | 9.1 | 34.3 | +25.2 |
| infested-workshop | 0.0 | 27.7 | +27.7 |
| swarm-junction | 54.5 | 34.0 | -20.5 |
| shielding-gate | 9.9 | 50.2 | +40.3 |
| overload-floor | 12.8 | 65.8 | +53.0 |
