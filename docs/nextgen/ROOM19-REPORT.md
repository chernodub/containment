# ROOM19

## Before

The desktop baseline is commit 4d3e6ab3, seed 1729, at 1920 × 1080. The two views are `incident-facing-<room>.png` and `combat-calm-<room>.png` under `artifacts/nextgen/room19-before/`.

- Shielding Gate. The carriage sits above the bent leaf at the upper left of the approach. The marine stands between diagonal scratches and bare square panels.
- Breached Loading Bay. Pale ribs protrude beneath the hull at the top of the frame. The centre shows the marine and an intact turning-circle marking with a narrow metal strip across it.
- Armory. The radial rifle magazine sits high and to the right behind the curved issue counter. The open counter end, a tray of loose arms and a large patch of tile dominate the approach.
- Freight Hold. The support lies below the lower corner of the leaning load and disappears behind the crates. The marine faces a booth wall and the broad unmarked top of the load.

## Construction

**Shielding Gate.** A three-knuckle hinge now crosses the fold in the leaf. Three long straps attach the barrel to the skin, and a continuous pin passes through the knuckles. The pin lies inside the existing door cover. Each plate and knuckle cuts away independently when it obscures an actor.

**Breached Loading Bay.** The torn apron fans out from the rib in three pieces. The centre sheet folds into a ragged end, and a separate sliver continues down the path of the impact. Two gouges replace the intact turning plate, and an alternating three-toed trail crosses the apron. Only the undamaged quadrant of its bearing ring survives. The new walkable fragments remain below 22 mm.

**Armory.** The magazine and its 80-unit circular solid moved together from (600, 450) to (515, 488). The shift brings the magazine closer to the port lane and opens the sightline across the counter. The counter retains its footprint. The first candidate at (546, 540) encroached on the arena clearance and was discarded. The lamp now sits at the magazine foot instead of high over the loose tray.

**Freight Hold.** A broad webbing band lies across the tilted lid, turns down its left flank and unravels over the pallet. A flat tail leads to a rectangular anchor on the floor. Light-coloured snapped support members project from the compressed corner. Raised hardware stays within the existing cargo footprint.

**Shared deck.** All twenty story rooms use the existing 768-pixel-wide room wear texture at 21.4 mm. Overlapping dark strokes accumulate toward hull and void edges. Wider contact shadows ground furniture, and two irregular drag marks curve from the spawn toward the room's practical. The room boundary and void mask clip the marks. One batch follows the hull caps with a subdued diffuser broken at module joints. The other sixteen landmarks keep their authored positions.

## Combat budget

The six High-tier Arc trials on Apple M1 Pro used 25 legal enemies, all four native ability slots and a 12-second observation window per room. Values are peak observed draws, total prepared programs retained at the end of combat, and the final room-specific preparation hold in seconds. Each column reads before → after. Awakening and Relay received the common surfaces only.

| Room | Draw calls | Programs | Preparation (s) | Combat program creations |
|---|---:|---:|---:|---:|
| shielding-gate | 208 → 219 | 150 → 152 | 0.99 → 0.97 | 0 → 0 |
| breached-loading-bay | 168 → 171 | 146 → 149 | 0.89 → 0.86 | 0 → 0 |
| armory | 251 → 263 | 145 → 147 | 0.71 → 0.68 | 0 → 0 |
| freight-hold | 164 → 163 | 144 → 146 | 0.77 → 0.76 | 0 → 0 |
| awakening-bay | 191 → 190 | 159 → 161 | 1.58 → 1.60 | 0 → 0 |
| relay-racks | 182 → 176 | 144 → 146 | 0.72 → 0.73 | 0 → 0 |

The raw trials are in `artifacts/nextgen/room19-bench-before/benchmark.json` and `room19-bench-final/benchmark.json`. The final run required at least eight simulated seconds in each room after early review trials advanced only 1.91 seconds in Gate and 0.61 seconds in Loading Bay under host load. Sampled draw and program inventories describe the measured fights.

### Low tier

The same six rooms used the same 25-enemy Arc trial on Low. The shared hull trim adds one unlit batch and the deck reuses the existing wear texture. All twelve before/after trials recorded zero mid-combat program creations. The raw JSON is in `room19-low-before/` and `room19-low-final/` under `artifacts/nextgen/`.

| Room | Peak draws | Programs | Preparation (s) |
|---|---:|---:|---:|
| shielding-gate | 207 → 207 | 328 → 332 | 4.42 → 3.71 |
| breached-loading-bay | 156 → 159 | 321 → 325 | 1.50 → 1.50 |
| armory | 236 → 253 | 319 → 323 | 0.81 → 0.82 |
| freight-hold | 150 → 151 | 318 → 322 | 0.68 → 0.68 |
| awakening-bay | 179 → 182 | 334 → 339 | 3.00 → 3.26 |
| relay-racks | 163 → 178 | 318 → 322 | 0.62 → 0.68 |

## Incident lighting

In each final incident-facing view the highest-energy active pooled practical belongs to the landmark assembly. The display measurements below use the 90th percentile of Rec.709 code values in a 17 × 7 pixel window around the projected diffuser, median sampled visible floor, and the 99th percentile inside the marine's projected body bounds. These are screenshot measurements at the authored camera marks.

| Room | Diffuser | Floor | Diffuser / floor | Marine |
|---|---:|---:|---:|---:|
| Shielding Gate | 91 | 46 | 1.98 | 197 |
| Breached Loading Bay | 124 | 54 | 2.29 | 191 |
| Armory | 120 | 48 | 2.49 | 194 |
| Freight Hold | 100 | 43 | 2.36 | 196 |

Against the darker median floor in the entry-position combat-calm frames the same four ratios are 2.66, 3.66, 3.53 and 2.36. All four diffuser windows stay below their marine sample in both views. The two brightest entry ratios belong to Loading Bay and Armory.

## Matched visual review

Sixteen baseline PNGs in `artifacts/nextgen/room19-before/` match sixteen in `room19-after/`. Each folder contains `incident-facing-<room>.png` and `combat-calm-<room>.png` for shielding-gate, breached-loading-bay, armory, freight-hold, awakening-bay, diagnostic-gallery, relay-racks and communal-atrium. The comparison folder contains the same names prefixed with `1920-`, `480-`, `grey-1920-` or `grey-480-`. Before is on the left. The final capture manifest records zero failures and zero errors. Its longest room-specific preparation was 2.10 seconds.

At 480 × 270, the pin and folded leaf in Gate occupy the space immediately left of the marine. In Loading Bay three metal tongues and dark scratches cross the apron from the breach. The claw impressions are easier to distinguish at full size. Armory's complete rifle carousel reads in both views, including its open upper ring. In Freight the restraint breaks up the blank lid in greyscale. Its lower end remains close in value to the pallet.

Awakening Bay retains the reflection and footprints from the berth. In Diagnostic Gallery the scuffs pass beneath the gantry, and the sign still dominates the entrance. Relay's tracks bend into the cabinet beneath its existing rectangular service channels. The Atrium's perimeter darkens around the planter. On broad stretches of open deck, the tile grid remains visible under the new wear.

**Weakest remaining rooms.** Freight Hold's upper band is clear, but the snapped support and anchor still crowd the booth wall at thumbnail size. In Communal Atrium the planter, bent bench and debris still merge into one silhouette in greyscale.

## Native campaign

The first Standard Breacher run on seed 1729 cleared all twenty rooms unassisted, with zero runner errors and zero defects. It used the competent bot and native keyboard and mouse inputs. Its Armory loading screen lasted 3.50 seconds. A second run uses the final build after raising the floor wear sheet by 5.4 mm.

The final-build run also cleared all twenty rooms unassisted with zero errors and zero defects. Both runs used the same rig, seed, difficulty and profile. Their reports are `artifacts/nextgen/playtest/room19-native/report.json` and `artifacts/nextgen/playtest/room19-final-native/report.json`.

The final campaign had two loading-screen holds above three seconds. Residential Gallery held for 3.77 seconds, with 1.76 seconds measured inside renderer preparation. Manual Control Chamber held for 4.41 seconds and measured 4.44 seconds of preparation. Reflection capture accounted for 3.19 seconds, compared with 0.28 seconds in the first campaign. The Manual room incident-dressing phase took 0.018 seconds. This is a real end-to-end budget miss.

### Room damage

ROOM17 figures come from the six Standard Breacher simulations at merge ec1846f0 in `playtest/lead-s17-std-breacher/breacher-*.json`. The two ROOM19 columns are native campaigns. Damage is cumulative armor and health damage, including damage recovered during the encounter.

| Room | ROOM17 median | ROOM17 observed range | First native | Final native |
|---|---:|---:|---:|---:|
| awakening-bay | 0.0 | 0.0–10.0 | 0.0 | 0.0 |
| passenger-vault | 0.0 | 0.0–0.0 | 0.0 | 0.0 |
| residential-gallery | 0.0 | 0.0–0.0 | 0.0 | 0.0 |
| communal-atrium | 0.0 | 0.0–10.0 | 0.0 | 0.0 |
| crew-checkpoint | 10.3 | 0.0–102.3 | 0.0 | 0.0 |
| armory | 0.0 | 0.0–10.0 | 59.1 | 59.1 |
| freight-hold | 22.0 | 0.0–40.0 | 0.0 | 0.0 |
| breached-loading-bay | 29.7 | 0.0–46.8 | 33.3 | 0.0 |
| relay-racks | 10.0 | 0.0–33.5 | 22.4 | 71.8 |
| transmission-chamber | 42.7 | 32.2–78.8 | 97.7 | 113.6 |
| diagnostic-gallery | 37.2 | 0.0–86.2 | 53.6 | 63.2 |
| safety-interlock-station | 47.0 | 8.8–66.9 | 35.1 | 26.3 |
| coolant-plant | 59.2 | 50.0–150.4 | 60.4 | 87.5 |
| service-shaft-landing | 77.2 | 0.0–107.8 | 33.5 | 90.6 |
| infested-workshop | 33.2 | 0.0–44.0 | 0.0 | 10.0 |
| swarm-junction | 58.2 | 29.7–108.0 | 71.1 | 48.8 |
| shielding-gate | 42.0 | 11.9–65.4 | 68.1 | 47.0 |
| containment-annulus | 23.2 | 0.0–65.8 | 12.0 | 12.0 |
| manual-control-chamber | 48.0 | 24.0–62.9 | 195.9 | 71.1 |
| overload-floor | 24.0 | 22.0–86.0 | 47.5 | 24.0 |

Final-run damage exceeded the historical maximum by 49.1 in Armory, 38.3 in Relay Racks, 34.8 in Transmission and 8.2 in Manual Control Chamber. These comparisons span two runner types and do not establish that the artwork caused the difference. Freight and Loading Bay both cleared without damage in the final run.

### Preparation replay

A separate sequential preparation replay visited all twenty story rooms in one retained renderer on the final build. Shielding Gate was slowest at 2.54 seconds. Manual Control Chamber took 2.31 seconds and Residential Gallery 0.80 seconds. All twenty had zero post-ready and combat program creations. The audit recorded no failures or errors. The native Manual outlier did not recur in this replay. The room-by-room diagnostics are in `artifacts/nextgen/room19-preparation/rooms.json`.
