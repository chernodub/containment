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

## ROOM30

The repeated berth, bay, stop and isolation lettering has been removed from the fighting deck. Each room retains one registration at the exit shoulder. Its artwork is 8 px high and uses a 10% multiply over the floor, equivalent to about 3–4% darkening before lighting. The outlines, rails and other non-text inlays still follow the clipped deck. Swarm Junction has shed shells near the infested pipe. Its repeated black open-lane tendrils have been removed.

Freight’s restraint has torn at the buckle. Two runner scrapes lead to the cradle, and the filters in the crate window match the filters loose on the floor. Diagnostic’s missing bed rail lies across the caster trail. A rumpled sheet and a fallen five-footed drip stand sit beside the cradle. Transmission’s stripped feed exposes three conductors beside a flat reel and hooded inspection lamp.

The inspection lamps at Crew Checkpoint, Shielding Gate and Transmission Chamber sit on the fallen queue post, detached gate tongue and cable reel respectively. In ship-plan coordinates the lamp centres are (509, 480), (761, 441) and (776, 578), respectively. Their distances from the authored arena centres are 2.23 m, 2.16 m and 2.44 m. The three fittings reach approximately 0.16 m, 0.21 m and 0.32 m above the deck. The fallen drip pole lies on its side, and its caster feet sit close to the floor. The hull caps now have a 0.24 m inner fascia beneath their lit top edge. The lane marks and lamp pools share the existing clipped deck draw at 0.0214 m. Fixed fittings use the existing room batches. On Overload Floor the insulated copper shoes follow the sheltered bank selected by the game, including after activation.

### Production measurements

Peak draws in one ten-second Arc run per cell are below. The previous build was local nextgen at 58de1ddf. The ROOM30 release was e26f2dca. Both benchmark runs recorded zero errors and zero combat shader compiles across all four cells. [Previous receipt](../../artifacts/nextgen/room30-before/benchmark.json) · [ROOM30 receipt](../../artifacts/nextgen/room30-final/benchmark.json)

| Room | Tier | Previous | ROOM30 | Combat compiles |
|---|---|---:|---:|---:|
| Safety Interlock Station | High | 288 | 291 | 0 |
| Safety Interlock Station | Low | 284 | 248 | 0 |
| Transmission Chamber | High | 170 | 161 | 0 |
| Transmission Chamber | Low | 158 | 148 | 0 |

### Kiting review

I compared final20 on the left and ROOM30 on the right, using the full frame at 480 × 270 and native-size details around the arena. I ignored all lettering to judge identity. The label count covers readable text or numerals painted on the deck. The HUD, wall signs and machine displays are excluded. “Harder” means the marine, a creature’s bright mark or a visible red warning took longer to find than in final20. These are observations from one staged fight per room.

| Room | Named without labels? | Physical consequence in the lane | Legible deck labels | Harder? |
|---|---|---|---:|---|
| Awakening Bay | Yes | A pleated thaw liner lies in meltwater beneath the opened pod row. | 0 | No |
| Passenger Vault | Yes | A scarf and separated shoes spill out beside the evacuation berths. | 0 | No |
| Residential Gallery | Yes | Broken crockery and a tea spill sit beneath the tipped serving trolley. | 0 | No |
| Communal Atrium | No | Spilled soil and detached leaves reach the irrigation fitting. At small size the leaves look like flakes. | 0 | No |
| Crew Checkpoint | Yes | A queue post has fallen across its webbing below the scanner. Its little lamp catches the weighted foot. | 0 | No |
| Armory | Yes | Loose cartridges scatter beyond the last linked round in the feed belt. | 0 | No |
| Freight Hold | Yes | Two runner skids end at the cradle. A torn strap and loose filters cross the near lane. | 0 | No |
| Breached Loading Bay | Yes | A split plate lifts along the fracture. Frost traces the bend toward the torn hull. | 0 | No |
| Relay Racks | Yes | A broken cable comb trails bent copper contacts from the open rack trench. | 0 | No |
| Transmission Chamber | Yes | A burnt channel leads to a severed feed and lit reel. The dish makes the identification at reduced size. | 0 | No |
| Diagnostic Gallery | Yes | A snapped bed rail crosses a caster track beside the stripped cradle and fallen drip stand. | 0 | No |
| Safety Interlock Station | No | A forked switch contact lies among porcelain chips. The loose contact could be a wrench. | 0 | No |
| Coolant Plant | Yes | Runoff fans out from the header with a pale frost margin and a narrow reflection. | 0 | No |
| Service Shaft Landing | Yes | A frayed sling curls across the deck beside the sheave and winch. | 0 | No |
| Infested Workshop | Yes | Impeller fragments and curled swarf sit in front of the invaded bench. The vise and tool outlines carry at small size. | 0 | No |
| Swarm Junction | Yes | Shed shell halves follow the pipe elbow out of the ribbed nest. | 0 | No |
| Shielding Gate | Yes | A detached tooth and pin lie across scraped track slots below a surviving gate segment. | 0 | No |
| Containment Annulus | Yes | A peeled gasket follows the concentric apron toward the breached seal. | 0 | No |
| Manual Control Chamber | No | A keyed plug and trailing lanyard lead back to the reader. In the kiting view the assembly could still be a relay console. | 0 | No |
| Overload Floor | Yes | A buckled bus and fragments of insulation follow the scorched feed from the reactor. | 0 | No |

The weakest three are Communal Atrium, Safety Interlock Station and Manual Control Chamber. The leaf silhouettes, broken switch contact and keyed reader each convey a local accident, but I needed more context to identify those rooms in the reduced kiting view.

[Colour and greyscale sheets and all previous/current pairs](../../artifacts/nextgen/room30/index.html) · [Sheltered bank during selection](../../artifacts/nextgen/room30-bank/play27-covered-bank-overload-floor.png)

The production build passed. On Standard, the uninterrupted Arc campaign with seed 1729 cleared all twenty rooms and recorded zero errors and zero defects. All four capture manifests completed on e26f2dca with twenty frames apiece and zero failures. The gallery contains 80 original captures, 160 final20/current pairs and eight colour or greyscale contact sheets. [Arc campaign receipt](../../artifacts/nextgen/room30/arc-report.json) · [Capture inventory](../../artifacts/nextgen/room30/captures.json)

## ROOM31

The Freight Hold has paired restraint gouges. One runner skips near impact, while its mate continues to the shackle. Coolant Plant’s spill crosses the plate joints in three lobes. The colour and wet-surface mask use the same contour. Transmission Chamber’s open waveguide trench makes two sharp turns between its burnt ties and the severed feed. Every other room has a debris or wear trail shaped around its working equipment.

Working aisles alternate worn plate with inset service panels. The Atrium carries a planting profile, the checkpoint has inspection bars, and the workshop has slotted tool drawers. The junction uses broken shell profiles, Transmission uses waveguide sections, Manual Control uses reader sockets and Safety Interlock uses paired switch contacts. Console and locker floor wear follows the authored furnishing positions. Flat work shares the original clipped deck draw.

The machine lamps use contrasting practical colours and a slow status pulse driven by the shared environment clock. Upward-facing machine normals get the largest lift and retain the existing contact shadows. Dark conduit pairs and their clips share the wall cap mesh along long side and far-z hull edges. The additions use zero shadow-casting lights. The recorder, workbench and manual console keep their authored positions.

### Draw calls

One ten-second Arc trial per room and tier on the shared host. These are observed peaks. Both releases recorded zero combat shader compiles in all four cells. [Previous benchmark](../../artifacts/nextgen/room31-before/benchmark.json) · [ROOM31 benchmark](../../artifacts/nextgen/room31-after/benchmark.json)

| Room | Tier | Previous (b42a1782) | ROOM31 (ccda8c66) |
|---|---|---:|---:|
| Safety Interlock Station | High | 287 | 266 |
| Safety Interlock Station | Low | 283 | 229 |
| Transmission Chamber | High | 160 | 169 |
| Transmission Chamber | Low | 146 | 158 |

### Kiting read

I ignored lettering and covered the incident visually when judging the floor cue. I then looked at the full kiting frame to judge whether the incident was the third thing I found, after the marine and the creatures. At 480 × 270, none of the twenty comparisons made a marine plate, bright creature mark or visible red warning harder for me to locate. The intended one-fifth lift is an art target. Displayed contrast varies with the local lighting and the marine's position.

| Room | Floor cue with the incident excluded | Incident third? |
|---|---|---|
| Awakening Bay | Rounded pod recesses and thaw creases suggest cryogenics, weakly once the pod row leaves view. | No. The pod row draws my eye first among the fixtures. |
| Passenger Vault | Berth footprints cross the worn aisle. The scarf and shoe trail reads as personal belongings. | Yes |
| Residential Gallery | Mat borders and a fan of broken crockery identify a domestic corridor. | Yes |
| Communal Atrium | A repeating leaf-and-stem border beside the soil fan suggests planting. The smaller leaf fragments lose their shape. | No. The irrigation pipe is easier to pick out than the spill. |
| Crew Checkpoint | Queuing bars, paired stop lines and post-foot marks identify a controlled crossing. | Yes |
| Armory | Two cartridge profiles repeat along the apron beyond the loose rounds. | Yes |
| Freight Hold | Paired runner gouges traverse the lashing grid and split where the restraint failed. | Yes |
| Breached Loading Bay | Long fractures interrupt dock plates, with frost in the lifted seam. | Yes |
| Relay Racks | Parallel conductors step sideways into open trench combs. | Yes |
| Transmission Chamber | Calibration arcs and flanged channel sections give the burnt trench a signal-equipment context. | Yes |
| Diagnostic Gallery | Rounded bed bays with headrest ends line the caster trail. | No. The hanging recorder display still catches the eye. |
| Safety Interlock Station | Paired switch contacts span the aisle. At reduced size they could serve another controls room. | No. The panel bank competes with the loose contact. |
| Coolant Plant | The long ice margin crosses multiple drain panels and follows the runoff. | Yes |
| Service Shaft Landing | Wire rope, sling marks and parallel load rails identify the hoisting lane. | Yes |
| Infested Workshop | Slotted tool-drawer outlines, wrenches and curled swarf put the growth in a workshop. | Yes |
| Swarm Junction | Split shells run along the branching pipe route through the lane. | Yes |
| Shielding Gate | Paired track slots and tooth-shaped recesses continue beyond the collapsed leaf. | Yes |
| Containment Annulus | Concentric double seams and a peeled gasket carry the ring geometry past the fight. | Yes |
| Manual Control Chamber | Reader sockets and keyed leads show a control circuit. I could not infer manual authority from them alone. | No. The console bank wins over its keyed fitting. |
| Overload Floor | Ribbed bus housings and an insulation burn trail mark a high-current deck. | No. The core remains the first environmental read. |

My weakest three are Manual Control Chamber, Safety Interlock Station and Awakening Bay. Their lanes convey control equipment or cryogenics more readily than the specific room function.

The production build passed. The Standard Cryo campaign on seed 1729 cleared nine rooms and ended in Transmission Chamber with zero runtime errors. Its runner exited 1 and recorded four room-loading delays over five seconds. [Campaign receipt](../../artifacts/nextgen/room31/cryo-report.json)

All 80 captures completed on ccda8c66 with zero capture failures or errors. The gallery contains native final21/current pairs, current-only 480 × 270 frames and eight colour or greyscale sheets. [Open gallery](../../artifacts/nextgen/room31/index.html) · [Capture inventory](../../artifacts/nextgen/room31/captures.json)

## ROOM32

The deck lamp has a 36-unit lens and a hooded trapezoidal throw that opens to 145 ship units. The marine’s 32-unit footprint gives the pool a scale of about four and a half marine widths at its outer edge. The lamp pulses on the existing environment clock, and its fixture participates in the existing non-shadow-casting light pool. The raised fragments share the room machine’s geometry batch and contact-shadow footprint pass. They are mounted on the service side of the terminal, with a maximum height of 10 ship units (0.31 m).

Passenger has a toppled berth and a pod-width pair of drag scars. Checkpoint has a bent queue rail between torn anchor shoes, Freight a skewed cradle runner with a slack restraint, and Transmission a broken fork in the waveguide. The manual console, recorder and workbench retain their authored locations.

The centre service panels now have closely spaced grate ribs. The floor symbols from ROOM31 are confined to the outer aisles. Lit-floor gain in Workshop and Junction rises from 0.62 to 1.20. Their near-black perimeter values stay low. The existing outboard conduits supply foreground depth.

The pressure restages use the rig, marine position and facing and the recorded living enemy types and positions from each final22 native pressure snapshot. Timing, attack poses, projectiles and ability effects differ from the native frame. Use the pairs to compare the room at that fight location.

### Peak draw calls

One ten-second Arc trial per room and tier on each build. These are observed peaks on the shared host. [Previous receipt](../../artifacts/nextgen/room32-before/benchmark.json) · [ROOM32 receipt](../../artifacts/nextgen/room32-after/benchmark.json)

| Room | Tier | Previous | ROOM32 | Combat compiles |
|---|---|---:|---:|---:|
| safety-interlock-station | high | 285 | 241 | 0 |
| safety-interlock-station | low | 277 | 223 | 0 |
| transmission-chamber | high | 170 | 162 | 0 |
| transmission-chamber | low | 158 | 158 | 0 |

### Kiting at 480 × 270

The first column records whether the thumbnail identifies the room with the lettering ignored. The last column compares the marine, enemy marks and visible warnings with final22.

| Room | Identifiable | Where the practical shows | Raised consequence | Any harder to find? |
|---|---|---|---|---|
| Awakening Bay | Yes, from the thaw berths | Amber strip on the thaw fitting. The pool overlaps the marine light. | Pleated pad torn out of a pod | No |
| Passenger Vault | Yes | Green below the berth train | Toppled padded berth on two parallel scars | No |
| Residential Gallery | Tentative | Cool light under the serving trolley | Fallen tray and loose plates | No |
| Communal Atrium | No | Violet beside the irrigation manifold | Broken branch and pale leaves. They read as fragments at this size. | No |
| Crew Checkpoint | Yes | Amber between the displaced shoes | Bent queue rail with torn anchor plates | No |
| Armory | Yes | Pale green beside the ammunition spill | Split clip and scattered rounds | No |
| Freight Hold | Yes | Cold white on the lower-left runner | Skewed cargo cradle with a slack restraint | No |
| Breached Loading Bay | Yes | Sodium light at the end of the deck tear | Three lifted plate edges | No |
| Relay Racks | Yes | Amber at the end of the rack wiring | Broken cable comb with splayed pins | No |
| Transmission Chamber | Yes | Amber at the fork beneath the feed | Scorched branching waveguide with exposed ends | No |
| Diagnostic Gallery | Yes | Violet below the dark recorder | Snapped bed rail, casters and bag | No |
| Safety Interlock Station | No | Green to the left of the switch | Switch contact and two bushings. A heavy hides part of the assembly. | No |
| Coolant Plant | Yes | Amber at the break against the cold pipework | Cuffed pipe split above the runoff | No |
| Service Shaft Landing | Yes | Violet at the winch sheave | Wire drum and trailing sling | No |
| Infested Workshop | Tentative | Warm pool under the workbench | Broken impeller and thrown blade | No |
| Swarm Junction | Yes | Pale green below the ruptured pipe | Shed shells following the ribbed nest | No |
| Shielding Gate | Yes | Amber below the gate track | Dropped three-tooth cassette | No |
| Containment Annulus | Yes | Amber beside the curved containment jacket | Short arc of displaced gasket clamps, partly behind the heavy | No |
| Manual Control Chamber | Tentative | Green below the reader at the end of the console | Detached keyed plug and two tails | No |
| Overload Floor | Yes | Cold white on the feeder shoe beside the reactor | Two buckled copper bus bars | No |

The weakest three are Communal Atrium, where leaves merge into general debris, Safety Interlock Station, where the defining contact hides behind a heavy, and Manual Control Chamber, where the reader plug is small beside the console.

The production build passed. Standard Cryo, seed 1729, cleared 12 rooms and died in Coolant Plant with zero errors. The runner recorded three room-loading holds over five seconds in Passenger Vault, Residential Gallery and Crew Checkpoint. [Campaign receipt](../../artifacts/nextgen/room32/cryo-report.json)

[ROOM32 gallery and ten sheets](../../artifacts/nextgen/room32/index.html) · [Capture inventory](../../artifacts/nextgen/room32/captures.json). Each of the five views has 20 accepted captures, a native final22/current pair per room, a current-only 480 × 270 frame and colour and greyscale sheets. The capture receipts retain 13 interrupted kiting/arena attempts from closing stalled browsers. The replacements completed after the capture harness queried shader link status synchronously during preparation. All 100 accepted captures have zero page or console errors.

All 20 pressure restages match the native living-enemy counts. Nineteen also match the recorded marine coordinates exactly. The original Safety Interlock and Manual Control positions initially cropped the physical warning sign. Extra camera settling resolved Safety Interlock at the original position. Manual Control needed a legal position 128 ship units (4 m) away for its accepted frame. Both initial exact-location pairs remain available in the gallery.

## ROOM33

The baseline production build is 8ea499b4. Arena-centre, incident-facing and kiting captures use the ROOM32 cameras at 1920 × 1080. The Pyro comparison uses eight rooms, seed 1729 and fast native rendering. Capture and benchmark receipts live under artifacts/nextgen.

### Feeder and crossing

The base approach fixture measured the existing shot from (1140, 520) toward the first protected step at (778.353, 319.059) in ship-plan units. It first clips at (833.71249, 349.81813). The upper shooter-facing corner of `inc13-reactor-feeder-refuge` is at Three.js world **(26.05352, 1.046875, 10.93182)** in metres (x, height, z). The dark front web faces positive z and the short right face faces positive x. Two conductors run west behind the cap. The contact flash belongs to gameplay presentation.

### Room construction

The berth pans, toppled queue bars, open waveguides and bus shoes use vertex-coloured static batches. Their scars and the twelve rooms’ paired hardware deposits use the existing clipped .0214 m deck skin. Two beam textures and the pooled service light use the physical terminal orientation. The new aperture shapes also feed the static deck irradiance bake. Source particles use the prepared story particle family and the existing High atmosphere option.

### Captures and visual review

All twenty rooms have three 1920 × 1080 comparisons and three 480 × 270 frames. The incident and calm contact sheets have colour and greyscale editions for both builds. The four extended lanes each have three additional fights cropped to 600 × 340 around legal marine positions. The refuge pair uses the same approach position before the first shot. [Gallery and per-room pairs](../../artifacts/nextgen/room33/sheets/index.html) · [Four fighting floors](../../artifacts/nextgen/room33/sheets/four-lanes.jpg) · [Refuge approach](../../artifacts/nextgen/room33/sheets/refuge-approach-native.jpg)

The baseline dist was held fixed while the later incident and kiting jobs recorded the changing checkout SHA. The baseline bundle inventory identifies the executable these jobs used. Passenger was recaptured after the foreground correction. The selected room manifests retain its source receipt. [Baseline bundle inventory](../../artifacts/nextgen/room33/base/bundle.json)

| Room | Falloff | Floor detail | What reads in the frame |
|---|---|---|---|
| awakening-bay | Strip | Pleated liner | The long thaw fitting leads back to the pods, and the ribbed floor stays visible under its lamp. |
| passenger-vault | Under-glow | Berth shoes | Three bent berth pans break the foreground wall, and their gauge repeats in paired scars beside the fight. |
| residential-gallery | Spill | Broken crockery | The overturned trolley and separated dishes make a domestic spill against the brown service aisle. |
| communal-atrium | Broken ring | Split stems | The pipe links the fallen planter to the fight, but branches and broken furniture still merge at thumbnail size. |
| crew-checkpoint | Strip | Anchor plates | The raised rails and long curved scrape trace the dragged barrier through the checkpoint. |
| armory | Split fan | Cartridge clips | The linked ammunition is clear in the centre view, though the incident crop still leaves the cartridge tips looking like spikes. |
| freight-hold | Under-glow | Existing runners | The splayed cargo runner and loose restraint cross several deck plates and remain visible under the crate. |
| breached-loading-bay | Split fan | Existing torn deck | The lifted edges and frost follow the breach diagonally while the marine stands clear of the dark seam. |
| relay-racks | Strip | Existing cable combs | The parallel cable runs lead directly into the rack, and their comb teeth are visible below the fitting. |
| transmission-chamber | Split fan | Feeder offcuts | The hollow-ended guide sections and stepped trench carry the transmitter’s shape out into the lane. |
| diagnostic-gallery | Under-glow | Existing bed hardware | The tilted bed and caster track read clearly beside the dark diagnostic sign. |
| safety-interlock-station | Broken ring | Switch contacts | A small crescent picks out the broken contact, though the sign occupies much of the centre view. |
| coolant-plant | Spill | Runoff lobes | The dark bands on the split header give the marine’s leg a clearer edge above the pale runoff. |
| service-shaft-landing | Broken ring | Wire-rope loops | The rope ties the wheel to the hoist, but the wheel and support still sink into the green shadows. |
| infested-workshop | Split fan | Existing impeller fragments | The thrown blade sits against the slotted work surface and the growth follows the edge of the bench. |
| swarm-junction | Spill | Existing shed shells | The broken pipe and shell trail form a branching silhouette under the magenta growth. |
| shielding-gate | Strip | Existing gear teeth | The row of dropped teeth follows the gate track, leaving the marine distinct along its lower edge. |
| containment-annulus | Broken ring | Existing gasket clamps | The separated clamps continue the jacket’s curve around the encounter floor. |
| manual-control-chamber | Under-glow | Keyed plugs | The darker reader face separates the marine from the console, and the short leads point back to the controls. |
| overload-floor | Spill | Bus links | Repeated bus shoes connect the generator to the far bank, where the capped feeder has a visible stopping face. |

The three weakest incident compositions are Communal Atrium, Armory and Service Shaft Landing. Foliage merges with the fallen furniture in the Atrium, the Armory view crops the ammunition source, and the Shaft wheel is too dim against its support. [Atrium](../../artifacts/nextgen/room33/sheets/communal-atrium/incident-native.jpg) · [Armory](../../artifacts/nextgen/room33/sheets/armory/incident-native.jpg) · [Shaft](../../artifacts/nextgen/room33/sheets/service-shaft-landing/incident-native.jpg)
