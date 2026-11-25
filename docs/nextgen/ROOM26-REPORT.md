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

## ROOM27

In the final18 arena sheet I see the diagonal connector and small lit end most clearly in Awakening Bay, Residential Gallery, Breached Loading Bay, Relay Racks, Diagnostic Gallery, Safety Interlock, Coolant Plant and Service Shaft Landing. Transmission also follows that arrangement, although its receiver already has a distinct fork. Shielding Gate runs across the view and has a different problem. The loose fitting reads more clearly than the gate that broke.

| Recomposed room | What now crosses the lane |
|---|---|
| Service Shaft Landing | A sagging hoist line turns through a two-turn coil at the upper landing. An open six-spoke sheave stands on the lower landing where the incident camera crops the winch. |
| Shielding Gate | Two broad, staggered rows of wedge teeth reveal the break between the gate leaves. |
| Diagnostic Gallery | A patient cradle crosses beneath the probe. A divided headrest, side rails and two restraint straps show its scale. |
| Awakening Bay | An open thaw blanket with raised bolsters spreads beside the berth hose. |
| Residential Gallery | The rails carry a stopped service cart on four bogies. Its tray and raised stop occupy the middle of the track. |
| Breached Loading Bay | An open-web gantry has fallen across the direction of travel. The deck shows through its diagonal braces. |
| Relay Racks | A transverse cable trench exposes the rack combs. The displaced cover lies beside the trench. |
| Coolant Plant | Four branches of ice fan sideways from the split return header. |
| Safety Interlock | A row of broken stanchions extends across the isolator track. The posts lean at different heights. |

All twenty rooms use their own palette on offset deck plates. The plates continue into the parts of the room where the native campaign kites away from the declared arena. Plate lips, inset grate bars and a drain give the deck shallow relief. A lighter traffic path crosses the arena beside a bolted hatch and a wet patch coloured by the local practical. The marks share the existing 0.0214 m deck skin. Contact paint follows the bounds of grounded kit pieces and individual lane-machine parts. A short cast shadow extends away from the key.

Fourteen rooms gained emissive surfaces on the machinery and a local painted spill. The six retained treatments are Armory, Passenger Vault, Communal Atrium, Infested Workshop, Containment Annulus and Overload Floor. No pooled light was added.

### ROOM27 evidence and verification

- [All twenty arena pairs](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-review/l8-arena-calm-pairs.png)
- [All twenty incident pairs](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-review/incident-facing-pairs.png)
- [Native comparison gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-review/index.html)
- [Three native Cryo fights](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-review/native-fights.png)

The sheets put final18 on the left and ROOM27 on the right. Each half is 480 × 270. The gallery also links 18 full-resolution pairs covering both views of the nine recomposed rooms.

High is the larger draw count in the arena and incident captures. Low uses the calm spawn capture. The campaign peak samples include actors and effects. Fresh preparation is one measured entry per room on the shared host.

| Room | High | Low | Native fight peak | final18 fresh (ms) | ROOM27 fresh (ms) |
|---|---:|---:|---:|---:|---:|
| awakening-bay | 107 | 100 | 136 | 2169 | 2029 |
| passenger-vault | 87 | 78 | 111 | 1851 | 1582 |
| residential-gallery | 83 | 74 | 109 | 1089 | 939 |
| communal-atrium | 106 | 98 | 132 | 1462 | 1797 |
| crew-checkpoint | 82 | 72 | 111 | 1079 | 956 |
| armory | 97 | 171 | 184 | 1416 | 1259 |
| freight-hold | 87 | 73 | 117 | 1369 | 1136 |
| breached-loading-bay | 95 | 84 | 136 | 1939 | 1393 |
| relay-racks | 108 | 98 | 147 | 1455 | 1008 |
| transmission-chamber | 97 | 83 | 138 | 2164 | 1320 |
| diagnostic-gallery | 89 | 67 | 139 | 2259 | 1680 |
| safety-interlock-station | 156 | 113 | 261 | 4373 | 1437 |
| coolant-plant | 88 | 73 | 160 | 933 | 874 |
| service-shaft-landing | 84 | 80 | 142 | 1043 | 1244 |
| infested-workshop | 118 | 92 | 198 | 1092 | 1061 |
| swarm-junction | 70 | 56 | 123 | 956 | 897 |
| shielding-gate | 220 | 95 | 271 | 2334 | 1268 |
| containment-annulus | 98 | 75 | 166 | 5145 | 1607 |
| manual-control-chamber | 107 | 100 | 212 | 3367 | 1340 |
| overload-floor | 106 | 95 | 144 | 2193 | 2544 |

Median fresh preparation changed from 1,657 to 1,294 ms. The baseline recorded 3 budget failures. All twenty ROOM27 entries met the budget and recorded zero combat shader compiles. The individual samples for Communal Atrium, Service Shaft Landing and Overload Floor were slower than their baseline entries. [Baseline](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-baseline/rooms.json) · [Delivery](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-quiet-prep/rooms.json)

The median sampled local floor contrast was 8% of the sampled marine-to-deck difference across 20 arena views. This uses screenshot luminance and local floor patches. Bright prop edges, warnings and the dark parts of the marine affect individual samples. [Per-room measurements](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-review/floor-contrast.json)

The production build passed. The standard, competent-profile Cryo campaign with seed 1729 cleared 20 rooms, finished with outcome complete, and recorded 0 errors and 0 defects. Highest sampled campaign draw count was 271. [Native campaign receipt](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/playtest/room27-cryo/report.json)

The Armory frame catches the Warden’s red sightline crossing the plate seams. In the Shaft frame, the red attack wedge covers the hoist lane. The Coolant frame catches eight enemies around the marine with an amber attack circle visible at the lower edge of the fight. [Armory](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/playtest/room27-cryo/r6-armory-pressure.png) · [Shaft](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/playtest/room27-cryo/r14-service-shaft-landing-pressure.png) · [Coolant](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/playtest/room27-cryo/r13-coolant-plant-pressure.png)

The Shaft retake shows the lower wheel face-on above the marine. Transmission’s incident crop still leaves the mast high in the frame, and the pale feed is easier to pick out in the arena view. The intended third-place brightness hierarchy was judged visually. The floor-contrast sample measures deck contrast only.

An earlier final-build preparation sweep overlapped the native campaign. Awakening Bay exceeded the 3,000 ms limit in that sweep (3,708 ms). The table uses the sweep after both campaign and capture finished. [Overlapping sweep](/Users/chernodub/.t3/worktrees/containment-game/t3-104d1dfe-1d612b52db1898b8/artifacts/nextgen/room27-final-prep/rooms.json)

## ROOM29

Passenger Vault replaces the conveyor centre with three berths and a coat. Freight Hold replaces the long handling rails with a sprung four-corner cradle. At Breached Loading Bay a stepped fold in the deck leads toward the torn structure. The three use different floor marks in the lanes beyond the machinery: numbered boarding spaces, lashing sockets and branching stress fractures.

The other rooms carry marks associated with their work across the clipped deck skin. The Annulus lines are concentric with the sealed core. Transmission pairs calibration marks with a cupped reflector. Diagnostic Gallery has a scanner hoop over the patient cradle. The Atrium grow light is amber. Workshop tendrils reach one jaw of the impeller vise, and the reactor core has overlapping armour along the sheltered approach. A small hooded machine lamp casts a trapezoidal pool into each room’s existing deck texture.

The [comparison gallery](../../artifacts/nextgen/room29/index.html) uses final19 on the left and ROOM29 on the right, with native and 480 × 270 pairs for spawn, incident, arena and kiting. The incident captures use the final19 incident-facing camera fixture. The kiting captures use the staged G6 fight. The native Arc run is recorded separately.

### Greyscale kiting review

I ignored the room title and compared the previous and current frames at 480 × 270. “Harder” records whether I found the marine, a bright creature mark or a visible warning harder to locate in the new frame. I also checked colour for the red cues. These are visual judgements from one staged fight per room.

| Room | Could I name it? | What survived reduction | Harder? |
|---|---|---|---|
| Awakening Bay | Yes | Pod outlines and numbered thaw stations continue behind the opened berth. | No |
| Passenger Vault | Yes | Three berths and queue bays give the evacuated passengers a place in the lane. | No |
| Residential Gallery | Yes | Repeated cabin thresholds and woven mat diamonds frame the trolley. | No |
| Communal Atrium | No | The exposed irrigation feed could still belong to a service room once the planting leaves the frame. | No |
| Crew Checkpoint | Yes | Stop bars and the arch separate the inspection lanes. | No |
| Armory | Yes | Cartridge profiles on the deck repeat the rounds spilling from the carousel. | No |
| Freight Hold | Yes | Numbered lashing bays surround the torn webbing. The broken cradle is less distinct during the fight. | No |
| Breached Loading Bay | Yes | Branching fractures and tilted plate ends lead up to the hull tear. | No |
| Relay Racks | Yes | Parallel cable runs elbow into the open rack trench. | No |
| Transmission Chamber | Yes | RF calibration arcs repeat around the dish and feed. | No |
| Diagnostic Gallery | Yes | Rounded bed bays and bed numbers carry the patient story beyond the scanner. | No |
| Safety Interlock Station | Yes | Repeated switch contacts and ISO stencils echo the isolator. | No |
| Coolant Plant | Yes | The frosted header and drains belong together. The fluid sheen is faint. | No |
| Service Shaft Landing | Yes | The winch and load-rating stencils identify a lifting deck. | No |
| Infested Workshop | Yes | Wrench shadows surround the growth climbing the bench. | No |
| Swarm Junction | Yes | Branching growth crosses the pipe and continues into the fighting lane. | No |
| Shielding Gate | Yes | Parallel track slots lead to the surviving upright and broken teeth. | No |
| Containment Annulus | Yes | Wide concentric double lines stay legible behind the marine. | No |
| Manual Control Chamber | No | The desk reads as a control station, but the bus lines could also serve a relay room. | No |
| Overload Floor | Yes | The reactor edge and paired bank ducts identify the room. The staged frame shows little of the sheltered approach. | No |

My three weakest reads are Communal Atrium, Manual Control Chamber and Freight Hold. The first two still depend on the landmark for their specific identity. In Freight the lashing bays identify the room more reliably than the broken metalwork.

### Draw calls

Each value is the largest observed draw count across three standard ten-second Arc combat trials on the specified tier. The [previous build](../../artifacts/nextgen/room29-base-complete/benchmark.json) used b1f1d1ed. The [ROOM29 build](../../artifacts/nextgen/room29/benchmark.json) used 281c9456. Both receipts contain twelve trials, zero trial errors and zero combat shader compiles. ROOM29 peaked at 299 draws on High against the 330 budget.

| Room | Tier | Previous | ROOM29 |
|---|---|---:|---:|
| Safety Interlock Station | High | 243 | 299 |
| Safety Interlock Station | Low | 276 | 286 |
| Transmission Chamber | High | 161 | 170 |
| Transmission Chamber | Low | 158 | 158 |

Earlier attempts on the shared host missed the sustained-enemy or accepted-ability requirement. The final delivery run enabled the runner’s continue-on-error option to collect every trial. All twelve passed. The [extended delivery sweep](../../artifacts/nextgen/room29/extended-matrix.json) also passed every trial with five seconds of minimum simulated combat. Its highest High-tier counts were 269 for Safety Interlock and 169 for Transmission. The table uses the standard window on both builds.

### Native Arc campaign

The production build passed. The [uninterrupted standard Arc campaign](../../artifacts/nextgen/playtest/room29-uninterrupted/report.json) cleared all twenty rooms on seed 1729 with zero errors and zero defects. It ran on the final build with the capture and benchmark browsers closed.

An earlier [seed-1729 Arc run](../../artifacts/nextgen/playtest/room29-delivery-arc/report.json) cleared 16 rooms before crawler contact killed the marine in Shielding Gate. The [checkpoint continuation](../../artifacts/nextgen/playtest/room29-arc-continued/report.json) replayed from the recorded Swarm Junction reward with the earned resources. It finished Overload Floor with 20 rooms cleared and zero runtime errors. Across both legs the runner recorded loading delays above five seconds in Passenger Vault, Residential Gallery and Manual Control Chamber. Those defects produced a nonzero runner exit even on completion.

The [capture inventory](../../artifacts/nextgen/room29/captures.json) records the selected source for each of the 80 frames. Six machines received per-part cutaways after the first kiting review. Their four views were recaptured on 281c9456. The gallery retains the identical-room views from the preceding renderer build for the other fourteen rooms.
