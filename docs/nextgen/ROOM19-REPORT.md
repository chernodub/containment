# ROOM19

## Before

The desktop baseline is commit 4d3e6ab3, seed 1729, at 1920 × 1080. The two views are `incident-facing-<room>.png` and `combat-calm-<room>.png` under `artifacts/nextgen/room19-before/`.

- Shielding Gate. The carriage sits above the bent leaf at the upper left of the approach. The marine stands between diagonal scratches and bare square panels.
- Breached Loading Bay. Pale ribs protrude beneath the hull at the top of the frame. The centre shows the marine and an intact turning-circle marking with a narrow metal strip across it.
- Armory. The radial rifle magazine sits high and to the right behind the curved issue counter. The open counter end, a tray of loose arms and a large patch of tile dominate the approach.
- Freight Hold. The support lies below the lower corner of the leaning load and disappears behind the crates. The marine faces a booth wall and the broad unmarked top of the load.

## Construction

**Shielding Gate.** A three-knuckle hinge now crosses the fold in the leaf. Three long straps attach the barrel to the skin, and a continuous pin passes through the knuckles. The pin lies inside the existing door cover. Each plate and knuckle cuts away independently when it obscures an actor.

**Breached Loading Bay.** The torn apron fans out from the rib in three pieces. The centre sheet folds into a ragged end, and a separate sliver continues down the path of the impact. Two gouges replace the intact turning plate. Only the undamaged quadrant of its bearing ring survives. The new walkable fragments remain below 22 mm.

**Armory.** The magazine and its 80-unit circular solid moved together from (600, 450) to (515, 488). The shift brings the magazine closer to the port lane and opens the sightline across the counter. The counter retains its footprint. The first candidate at (546, 540) encroached on the arena clearance and was discarded. The lamp now sits at the magazine foot instead of high over the loose tray.

**Freight Hold.** A broad webbing band lies across the tilted lid, turns down its left flank and unravels over the pallet. A flat tail leads to a rectangular anchor on the floor. Light-coloured snapped support members project from the compressed corner. Raised hardware stays within the existing cargo footprint.

**Shared deck.** All twenty story rooms use the existing 768-pixel-wide room wear texture at 16 mm. Overlapping dark strokes accumulate toward hull and void edges. Wider contact shadows ground furniture, and two irregular drag marks curve from the spawn toward the room's practical. The room boundary and void mask clip the marks. One batch follows the hull caps with a subdued diffuser broken at module joints. The other sixteen landmarks keep their authored positions.

## Combat budget

The six High-tier Arc trials on Apple M1 Pro used 25 legal enemies, all four native ability slots and a 12-second observation window per room. Values are peak observed draws, total prepared programs retained at the end of combat, and the final room-specific preparation hold in seconds. Each column reads before → after. Awakening and Relay received the common surfaces only.

| Room | Draw calls | Programs | Preparation (s) | Combat program creations |
|---|---:|---:|---:|---:|
| shielding-gate | 208 → 219 | 150 → 152 | 0.99 → 0.99 | 0 → 0 |
| breached-loading-bay | 168 → 171 | 146 → 149 | 0.89 → 0.90 | 0 → 0 |
| armory | 251 → 259 | 145 → 146 | 0.71 → 0.72 | 0 → 0 |
| freight-hold | 164 → 159 | 144 → 146 | 0.77 → 0.76 | 0 → 0 |
| awakening-bay | 191 → 193 | 159 → 160 | 1.58 → 1.57 | 0 → 0 |
| relay-racks | 182 → 176 | 144 → 146 | 0.72 → 0.71 | 0 → 0 |

The raw trials are in `artifacts/nextgen/room19-bench-before/benchmark.json` and `room19-bench-after/benchmark.json`. Run lengths varied with host load.

The first Gate and Loading Bay trials advanced only 1.91 and 0.61 simulation seconds under load. Repeating them with an eight-simulation-second minimum gave 217 and 170 peak draws, respectively, with zero combat compilations. The larger observed count is retained for each room above. Sampled draw and program inventories do not establish hardware FPS.
