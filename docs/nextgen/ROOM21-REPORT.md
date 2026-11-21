# ROOM21

## Baseline fighting views

The baseline is 064f0acd. Both builds use the same 1920 × 1080 arena camera and the same G6 kiting fixture. The two additional comparison rooms are Coolant Plant and Awakening Bay.

| Room | What identified the centre before |
|---|---|
| Shielding Gate | A short ladder-shaped insert sits in a violet pool. The torn leaf is barely inside the top left. |
| Breached Loading Bay | A surviving arc and the tips of pale hull strips reach the marine. Most of the central surface is square tile. |
| Freight Hold | Two thin lines and a transverse fitting suggest rails. The warm brown grade does more to identify the room than the hardware. |
| Crew Checkpoint | A scanner at the right and arrows across a pale inspection court suggest screening. Its centre is a small covered slot. |
| Swarm Junction | The purple hue and edges of organic material suggest infestation. The central grille itself could be installed anywhere. |
| Relay Racks | A cabinet bank identifies the room on the right. The centre holds a narrow trench and two orange spots with no visible lamps. |

## Floor construction

The central lanes use the same disposable colour and normal maps as the existing wear sheet. Each room supplies its own bay spacing, axis, stencil and service hardware. Sections repeat behind the camera as the player circles. They sit at 0.0214 m, share the authored hull and void mask, and add no colliders, render passes or realtime lights.

| Deck stencil | Surface carried through the fighting lane |
|---|---|
| CRYO 01 | Slotted thaw-water collectors under the berth access plates |
| BERTH 02 | Double luggage guides and paired floor catches |
| CABIN 03 | Ribbed threshold runners along the accommodation gallery |
| GARDEN 04 | Branching irrigation joints along the planting bays |
| SCREEN 05 | Bounded inspection strips with scanner slats and a separate reader plate |
| ISSUE 06 | Rows of equipment sockets across the issue apron |
| CARGO 07 | Transverse cargo shoes on twin transport rails |
| DOCK 08 | Dock-lane paint with inset tie-down sockets |
| BUS 09 | Bundled cable runs that disappear beneath slanted grating |
| ARRAY 10 | Three bent parallel feeds meeting a wide access grate |
| TRIAGE 11 | Washable strip flooring with instrument registration ticks |
| LOCK 12 | Double interlock tracks linked by clamp shoes |
| DRAIN 13 | A slotted drain crossed by short tributary channels |
| LIFT 14 | Broad shaft grates and reinforced crossbars |
| LATHE 15 | Machine-bed slots and branched cuts near the tool positions |
| DUCT 16 | Slanted duct grating broken by branching seams |
| GATE 17 | Parallel guide faces with faded diagonal paint between them |
| SEAL 18 | Repeating curved seal channels |
| BYPASS 19 | Banks of removable access covers with inset handles |
| CORE 20 | Three staggered bus strips feeding the overload floor |

## Sources in the play space

The paired orange spots and synthetic violet accent were removed from the baked deck field. The landmark worklight now has two louvres and casts a three-pane throw towards the arena. Both graphics tiers sample the existing 256-pixel light bake. The fallback pooled practical uses an oriented aperture.

The Gate's guide continues from its sill through three broken leaf sections. The ragged end of Loading Bay's folded hull reaches the dock lane beside the drag. Freight's strap comes down the folded lid corner and frays beside the numbered floor shoe. A scrape follows the pallet's diagonal path.

Coolant feeds through the gap between two misaligned flanges into an irregular wet margin. A low junction box terminates each energized bus, with visible contacts at its head. A brass bolt bridges the sealed shutter and retracts into its keeper before the leaves part. Dark rooms retain a fraction of the landmark practical and a cool grazing value on raised surfaces. Crew Checkpoint has a lower deck value and kit-floor gain. All condition visuals consume the existing simulation state.

The first native review showed the old central inserts obscuring the Gate guide and the Loading Bay hull. The final build removes those inserts and Swarm's central drain, and paints the wear sheet at 1024 pixels across. The relief map stays at 192 pixels across. The final Gate and Bay views expose the incident across the centre at 480 × 270.

## Fighting-window comparison

The capture labels are `artifacts/nextgen/room21-before` and `artifacts/nextgen/room21-after`. Each contains eight 1920 × 1080 arena frames and two kiting frames per room, separated by 150 ms. In each directory the names are `l8-arena-calm-<room>.png`, `g6-kiting-<room>-01.png` and `g6-kiting-<room>-02.png`. The comparison directory uses the same filenames with `1920-`, `480-`, `grey-1920-` or `grey-480-` prefixes. Before is on the left.

| Room | What the player sees from the centre |
|---|---|
| Shielding Gate | The hinge and fallen leaf feed into a kinked guide from the left. Pale diagonal paint runs between parallel rails below the marine. Both the quiet camera and the turn away from the gate keep a length of GATE 17 track visible. |
| Breached Loading Bay | The crumpled hull at the upper edge has a ragged tongue that crosses the dock lane underfoot. The rectangular sockets, broken paint line and DOCK 08 stencil still identify the apron as enemies surround the marine. |
| Freight Hold | Twin cargo rails cross rows of rectangular deck shoes. A marked socket at the upper left catches the worklight near the fallen load. The handling lines and CARGO 07 stencil remain visible farther into the fight. |
| Crew Checkpoint | A bank of narrow scanner slats crosses the inspection court and leads to the upright screening arch. The unlit side of the court has a lower value. In the quiet frame a clear left-hand deck sample at (280,280), 340 × 240 pixels, dropped from a median grey value of 49 to 39 out of 255. |
| Swarm Junction | The old straight central drain has given way to a slanted duct cover. Three seams kink and fork beyond its edge. The kiting frame picks up the damaged duct pattern again beside the growth at the lower left. |
| Relay Racks | Three cable runs turn under sections of slanted grating and lead back to the cabinet bank. The open runs and BUS 09 stencil show between the marine and the racks. |
| Coolant Plant | Diagonal slotted drains cross an open bay below the split pipe. The original bright wet trail is still the highest-value surface. |
| Awakening Bay | A line of thaw-water collectors continues the rhythm of the berths into the fighting lane. The open berth and reflected spill remain the strongest identifiers. |

Freight and Swarm are the weakest remaining rooms in this sample. Freight reads immediately as a cargo deck, but the full restraint and bent corner are hard to follow at 480 when the load is near the top edge. Swarm's branched seams read near the marine, but the greyscale view away from the living growth can still suggest a cable trench. At native size the painted service marks have softer edges than the raised machinery.

## Condition views

The four targeted captures are under `artifacts/nextgen/room21-conditions`. The charging conduit shows a three-contact junction box at the end of each run. The sealed heavy capture includes a closed shutter at the upper left. In Dark Heavy the Atrium's raised planter and its frame remain visible behind eighteen attackers while the floor beyond the suit lamp falls dark. The first coolant inspection exposed doubled translucent rims at intersecting patches. The final shader assigns each wet fragment to the closest spill, and a recessed feed brings the first coupling in from the wall.

In the recapture, the first coolant coupling is visible to the marine's left, connected back to the bulkhead, and the former interior overlap line has disappeared. The outer footprint still follows the three simulated slick zones.

## Live combat budgets

The existing realtime benchmark staged 25 enemies with the Arc rig, once on each tier in each of eight rooms. Each sample ran for at least ten wall-clock seconds and six simulated seconds. Values below run from baseline 064f0acd to final rendering commit 21c0ab09. Programs are resident WebGL programs after the fight. The Low benchmark changes tiers on an initialized page, so its inventory includes programs already prepared on High.

| Room | Tier | Peak draws | Resident programs | Renderer preparation (s) | Combat compiles |
|---|---|---:|---:|---:|---:|
| shielding-gate | high | 214 → 213 | 152 → 152 | 1.11 → 3.60 | 0 → 0 |
| shielding-gate | low | 207 → 201 | 332 → 332 | 5.85 → 5.14 | 0 → 0 |
| breached-loading-bay | high | 163 → 159 | 149 → 146 | 0.98 → 0.93 | 0 → 0 |
| breached-loading-bay | low | 153 → 151 | 325 → 325 | 1.94 → 1.75 | 0 → 0 |
| freight-hold | high | 161 → 160 | 146 → 143 | 0.87 → 0.72 | 0 → 0 |
| freight-hold | low | 146 → 150 | 319 → 322 | 0.94 → 0.74 | 0 → 0 |
| crew-checkpoint | high | 153 → 150 | 147 → 144 | 0.69 → 0.59 | 0 → 0 |
| crew-checkpoint | low | 140 → 143 | 323 → 323 | 1.03 → 0.82 | 0 → 0 |
| swarm-junction | high | 140 → 139 | 148 → 148 | 0.64 → 0.56 | 0 → 0 |
| swarm-junction | low | 131 → 130 | 326 → 326 | 0.87 → 0.76 | 0 → 0 |
| relay-racks | high | 182 → 183 | 145 → 146 | 0.97 → 0.74 | 0 → 0 |
| relay-racks | low | 167 → 165 | 321 → 322 | 0.86 → 0.77 | 0 → 0 |
| coolant-plant | high | 157 → 161 | 145 → 142 | 0.74 → 0.49 | 0 → 0 |
| coolant-plant | low | 149 → 144 | 316 → 319 | 0.61 → 0.50 | 0 → 0 |
| awakening-bay | high | 187 → 186 | 161 → 161 | 1.99 → 1.63 | 0 → 0 |
| awakening-bay | low | 175 → 174 | 339 → 339 | 4.87 → 3.56 | 0 → 0 |

The M1 Pro has ten logical cores. The one-minute host load ranged from 36.4 to 72.4 during the baseline run and 5.2 to 16.0 during the final run. Other Chromium and Blender processes were active. The busiest final fight used 213 of the 330 allowed draws on High and 201 on Low. There were zero combat shader compilations in all 32 before/after samples. These runs provide resource counts under different loads. Their frame times do not establish a hardware speedup.

The initial final Gate preparations exceeded three seconds on both tiers. Reflection capture took 2.85 s of the 3.60 s High preparation, and 4.39 s of 5.14 s on Low. Gate's incident dressing took 21 ms and 20 ms respectively. Awakening Bay also exceeded the target during the Low tier switch. Raw data is in `artifacts/nextgen/room21-bench-before/benchmark.json` and `artifacts/nextgen/room21-bench-after/benchmark.json`.

A second benchmark visited all twenty story rooms in a retained renderer while the native campaign ran in another Chromium process. All eight gallery rooms prepared within three seconds on that pass. Relay Racks was slowest of the eight at 2.78 s. Across all twenty, seven exceeded three seconds, including a 10.47 s Manual Control Chamber and an 18.61 s Overload Floor. The latter spent 17.30 s in reflection capture. Every room recorded zero post-ready and combat program creations. The complete first replay is in `artifacts/nextgen/room21-preparation/rooms.json`.

### Quiet-host preparation

After the campaign closed, the quiet retained-renderer audit measured 1.20–2.03 s for all eight gallery rooms. One-minute loads were 5.1–6.2 on ten cores. Eighteen of the twenty story rooms met the cap. Manual Control Chamber took 8.78 s, including 5.19 s of reflection capture. Overload Floor took 16.40 s, including 15.38 s of reflection capture. Their native campaign loading holds were 1.20 s and 2.11 s. The retained replay jumps directly between validated campaign boundaries and does not include the preceding native reward and route time.

| Room | Quiet preparation (s) |
|---|---:|
| Shielding Gate | 1.46 |
| Breached Loading Bay | 1.89 |
| Freight Hold | 1.24 |
| Crew Checkpoint | 1.36 |
| Swarm Junction | 1.34 |
| Relay Racks | 1.51 |
| Coolant Plant | 1.20 |
| Awakening Bay | 2.03 |

A separate quiet tier-switch check measured Gate at 3.02 s High and 4.55 s Low, and Awakening at 1.56 s High and 3.99 s Low. The load ranged from 2.6 to 4.5. A repeat of the twenty-room retained replay put the eight gallery rooms at 1.16–2.70 s, with Manual at 7.82 s and Overload at 3.56 s. The pinned baseline replay put the two reactor rooms at 2.72 s and 2.80 s. These misses remain open. An experimental build restoring the earlier blackout shader still missed on both Low transitions and both reactor rooms, so the delivered build keeps the reviewed emergency lighting. The reports are in `room21-solo-tier`, `room21-solo-preparation`, `room21-repeat-preparation` and `room21-baseline-solo-preparation` under `artifacts/nextgen/`.

## Native campaign

The Standard Breacher on seed 1729 cleared all twenty rooms unassisted with the competent bot and zero runner errors. The run used native keyboard and mouse, the fixed 60 Hz fast mode, a 180 s startup timeout and a two-hour wall-clock allowance. The one-minute host load was 44.6 at startup and 2.9 at completion. The production build passed. The campaign and the final captures used the pinned 21c0ab09 distribution.

The runner returned status 1 because it recorded three loading-screen defects. Awakening Bay held for 12.00 s, Passenger Vault for 11.12 s and Residential Gallery for 9.71 s. Communal Atrium held for 3.54 s. Every subsequent hold was under three seconds. No combat or progression defect was recorded. The inputs, damage ledger and individual loading holds are in `artifacts/nextgen/playtest/room21-native/report.json`.

For comparison with the ROOM17 Standard Breacher cohort recorded in ROOM19, total damage exceeded the earlier maximum in Armory (38.5 versus 10.0), Relay Racks (50.3 versus 33.5), Shielding Gate (89.9 versus 65.4) and Manual Control Chamber (103.5 versus 62.9). Freight took zero damage and Loading Bay took 10.0. The native bot and the earlier simulation cohort use different runners.
