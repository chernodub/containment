# ROOM26 room machinery

The Armory carousel now feeds a broad black track with brass cartridges. At the loading shoe the cartridges turn across the belt and spill onto the deck. At Service Shaft Landing a tensioned line doubles back over a snatch block to the broken pallet. Two gouges follow the sling toward the load. A ladder descends below the shaft lip and the return tackle reaches the lower balcony.

The Transmission Chamber feed terminates in a flanged receiver. The Coolant Plant feeds a transverse heat exchanger with pale frost bands along its rim. The Overload Floor reactor exposes five violet induction windings between its structural brackets. At the end of its conduit, the displaced service cover exposes a second bank of conductors. The Manual Control Chamber has an opened console at the loose end of the override harness. The Shielding Gate carriage drags a strapped counterweight along its torn guide. The Containment Annulus carries a curved, ribbed section of its ring into the lane.

In Awakening Bay the opened berth's lining carries a cool glow and a lamp spills onto the release floor. Passenger Vault has a small coat draped over a case on the conveyor. Crew Checkpoint's fallen scanner has a lighter glass face and warm reader. Freight Hold spills banded cargo from the broken pallet. Diagnostic Gallery exposes the probe's foot, arm and head beside the readout. Safety Interlock has broader amber contact faces on the paired isolator uprights and darker ivory and orange machinery around them. In Infested Workshop the rebuilt workbay staggers the blisters along the rib cage, and the floor growth branches into separate large lobes and smaller buds.

All twenty rooms use a room-coloured landmark diffuser and spill painted into the deck. Residential Gallery pairs the cabin lamp with the serving trolley. Communal Atrium pairs the garden with the irrigation line. Breached Loading Bay pairs the torn structure with its anchor. Relay Racks pairs the rack with its electronics tray. Swarm Junction pairs the plenum with its grille. A soft contact patch sits beneath each lane terminal. The added dressing uses renderer geometry, existing deck textures and emissive materials. Gameplay geometry and the light-slot allocation are unchanged.

## Evidence

The [comparison gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-review/index.html) pairs all incident and arena views at 480 × 270. Select a thumbnail for its native original. The before images are the supplied final17 review captures, whose manifest records b74bfa28. The after images use the same staged incident camera and declared arenas.

- [Twenty arena centres](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-review/twenty-arena-calm.png)
- [Twenty incident views](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-review/twenty-incident.png)
- [armory fight](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-fights/g6-kiting-armory-01.png)
- [transmission-chamber fight](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-fights/g6-kiting-transmission-chamber-01.png)
- [freight-hold fight](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-fights/g6-kiting-freight-hold-01.png)

## Rendering and preparation

The production build passed. High draws are the larger of the two staged views. Low draws are the calm spawn view. The fight frames are separate samples. These counts describe the captured frames. Fresh preparation includes the public room-entry wait, with one sample per room and build on the shared host.

| Room | High draws | Low draws | Fresh before (ms) | Fresh delivery (ms) |
|---|---:|---:|---:|---:|
| awakening-bay | 105 | 98 | 5039 | 2035 |
| passenger-vault | 86 | 78 | 3127 | 2544 |
| residential-gallery | 81 | 73 | 2394 | 1036 |
| communal-atrium | 105 | 97 | 2636 | 2128 |
| crew-checkpoint | 80 | 71 | 1030 | 1044 |
| armory | 96 | 171 | 1265 | 1332 |
| freight-hold | 85 | 71 | 1186 | 1198 |
| breached-loading-bay | 93 | 82 | 2020 | 1858 |
| relay-racks | 106 | 97 | 1159 | 1079 |
| transmission-chamber | 95 | 81 | 1436 | 1409 |
| diagnostic-gallery | 87 | 65 | 2253 | 1086 |
| safety-interlock-station | 154 | 111 | 1634 | 1570 |
| coolant-plant | 86 | 71 | 1215 | 916 |
| service-shaft-landing | 83 | 79 | 1803 | 1460 |
| infested-workshop | 117 | 91 | 1245 | 1103 |
| swarm-junction | 68 | 53 | 1027 | 933 |
| shielding-gate | 218 | 92 | 2272 | 2000 |
| containment-annulus | 97 | 75 | 1820 | 1628 |
| manual-control-chamber | 105 | 98 | 7814 | 6158 |
| overload-floor | 105 | 94 | 3499 | 2567 |

Median fresh preparation changed from 1,812 to 1,434 ms. The slowest delivery entry took 6,158 ms. The baseline missed the 3,000 ms budget in four rooms. The delivery sweep recorded 1 budget failures and 0 combat shader compiles. Rooms with a longer individual delivery sample were crew-checkpoint (+14 ms), armory (+67 ms), freight-hold (+11 ms).

Raw timing records include the host load for each entry. [Baseline](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-before/rooms.json) · [Delivery](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-delivery-preparation/rooms.json)

The second full delivery sweep passed all twenty rooms with zero budget failures and zero combat compiles. Median entry was 1,296 ms. Manual Control took 1,384 ms on repeat. In the first delivery sweep, its 6,159 ms included 2,887 ms in reflection capture and 2,528 ms in shader compilation. [Full repeat](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room26-delivery-repeat/rooms.json)

The three staged High fights recorded 178 draws in Armory, 117 in Transmission and 113 in Freight. The marine and landmark brightness ratio was assessed visually. An isolated measurement of the 60% target remains unavailable.

## Campaign

The standard Arc run with seed 1729 (room26-arc) cleared 20 rooms. The recorded outcome was complete, with 0 errors, 0 defects and a sampled peak of 273 draws. [Campaign receipt](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/playtest/room26-arc/report.json)

The campaign used the build before the last Workshop blister placement and Interlock contact-face edits. The final build, room captures and both delivery timing sweeps include those renderer-only edits.
