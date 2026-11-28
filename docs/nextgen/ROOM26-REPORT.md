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

The revised gallery, source luminance measurements and final campaign receipt are in [the ROOM33 revision](#room33-revision) below. The first pass is retained for comparison.

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

### Desktop verification

Peak draws below use a matched native kiting fixture at both tiers. Each sample advances the running battle by 50 ms and records the renderer’s submitted draw calls. Each cell covers 30 samples following preparation. WebGL compileShader calls were counted during that interval. [Baseline diagnostics](../../artifacts/nextgen/room33/base/draws/manifest.json) · [Current diagnostics](../../artifacts/nextgen/room33/now/draws/manifest.json) · [Final Passenger diagnostic](../../artifacts/nextgen/room33/now/passenger-lane-draws/manifest.json)

| Room | High base → ROOM33 | Low base → ROOM33 | Combat shader compiles, base → ROOM33 |
|---|---:|---:|---:|
| awakening-bay | 138 → 139 | 127 → 127 | 0 → 0 |
| passenger-vault | 115 → 118 | 104 → 106 | 0 → 0 |
| residential-gallery | 113 → 114 | 104 → 104 | 0 → 0 |
| communal-atrium | 130 → 131 | 121 → 121 | 0 → 0 |
| crew-checkpoint | 107 → 109 | 98 → 99 | 0 → 0 |
| armory | 199 → 200 | 190 → 190 | 0 → 0 |
| freight-hold | 118 → 119 | 107 → 107 | 0 → 0 |
| breached-loading-bay | 126 → 127 | 116 → 116 | 0 → 0 |
| relay-racks | 135 → 136 | 125 → 125 | 0 → 0 |
| transmission-chamber | 120 → 122 | 109 → 110 | 0 → 0 |
| diagnostic-gallery | 120 → 121 | 108 → 108 | 0 → 0 |
| safety-interlock-station | 269 → 270 | 258 → 258 | 0 → 0 |
| coolant-plant | 120 → 121 | 108 → 108 | 0 → 0 |
| service-shaft-landing | 116 → 117 | 105 → 105 | 0 → 0 |
| infested-workshop | 189 → 190 | 179 → 179 | 0 → 0 |
| swarm-junction | 105 → 106 | 94 → 94 | 0 → 0 |
| shielding-gate | 258 → 259 | 247 → 247 | 0 → 0 |
| containment-annulus | 130 → 131 | 119 → 119 | 0 → 0 |
| manual-control-chamber | 153 → 154 | 141 → 141 | 0 → 0 |
| overload-floor | 138 → 140 | 125 → 127 | 0 → 0 |

The separate Safety Interlock Arc benchmark peaked at **273 → 245 High draws** with zero combat shader compiles. Both trials recorded at least five seconds of live simulation and zero trial errors. Shared-host timings do not establish hardware frame rate. A preliminary timed all-room benchmark lacked full-kit receipts under contention and was stopped. The table uses the fixed-step capture diagnostics. [Base Arc benchmark](../../artifacts/nextgen/room33-safety-base/benchmark.json) · [ROOM33 Arc benchmark](../../artifacts/nextgen/room33-safety-now/benchmark.json)

Baseline Pyro cleared 8 rooms on seed 1729 and ended at the room limit with 0 runtime errors. The runner flagged loading holds over five seconds in passenger-vault (6.82 s), residential-gallery (5.79 s). [Campaign receipt](../../artifacts/nextgen/playtest/room33-pyro-base/report.json)

ROOM33 Pyro cleared 8 rooms on seed 1729 and ended at the room limit with 0 runtime errors. The runner flagged loading holds over five seconds in passenger-vault (5.77 s), residential-gallery (6.34 s). [Campaign receipt](../../artifacts/nextgen/playtest/room33-pyro/report.json)

The production build passed. The first contact flash remains with the play delegate. The third-tier read is weakest at the Shaft and in the Atrium, and the Armory source still falls outside its incident crop.

Both campaigns returned exit code 1 because the runner recorded loading defects. The final run’s total Crew Checkpoint hold was 6.26 seconds versus 4.55 seconds at baseline. The runner did not classify Crew Checkpoint as a loading defect. Safety Interlock’s highest observed ROOM33 result across the matched capture and full Arc benchmark was 270 High draws.

<a id="room33-revision"></a>

### ROOM33 revision · incident exposure, fighting floors and feeder refuge

The native pairs and contact sheets now compare the original baseline against the revised production artwork. Final production source is `f71fb2ed`. The selected manifest records the originating capture for every PNG. The six last exposure adjustments use `f71fb2ed`, the other refitted rooms use `a9e4beb8`, and rooms untouched by either adjustment use their identical presentation from `c33affea`. This section supersedes the first ROOM33 lighting assessment and draw counts. The receiver follows the damaged fitting in both cameras. Broad strips, interrupted rings, split fans, under-glows and spills have feathered edges and an occluder shadow. Six smoked receivers and two lighter deck finishes return suit light locally when the marine approaches. The far fitting retains its own exposure. Source motes use the existing High-only particle path.

Passenger has two berth-gauge troughs with exposed lips. Checkpoint has a single broad burnished arc with rubber deposits and broken bar shoes. Transmission has a stepped channel with interrupted twin conductors. All three share the clipped 0.0214 m fighting-floor skin. The Coolant header bands, Manual Control reader finish, twelve floor clusters and displaced berth pans on the Passenger wall carry forward.

The reactor sill has a painted steel cap, recessed near-black front, orange edge return and a deck shadow behind the protected side. The shooter-facing corner of **`inc13-reactor-feeder-refuge`** is **(26.05352, 1.09375, 10.93182) m** in renderer world XYZ, above ship-plan (833.71249, 349.81813). The first contact flash remains with the play delegate.

[Native comparisons and 480 × 270 gallery](../../artifacts/nextgen/room33/sheets/index.html) · [Twelve fighting-floor crops in greyscale](../../artifacts/nextgen/room33/sheets/four-lanes-grey.jpg) · [Pre-shot refuge comparison](../../artifacts/nextgen/room33/sheets/refuge-approach-native.jpg)

#### Matched source photometry

The incident and arena cameras use the same native source rectangle for the baseline and revision, 320 × 224 pixels centred on the projected lamp throw. Where the service head is off-screen, the rectangle follows the visible incident mount. Camera clipping and HUD exclusions apply identically to both images. The current renderer’s opaque floor attachment supplies a shared mask, eroded at geometry edges. The source sample excludes a 115-pixel horizontal-radius ellipse about the marine’s foot. The marine peak uses the floor inside that ellipse, with its vertical radius divided by 1.3. This measures the visible deck including any specular contributions. The image-area figure counts sampled native pixels at linear luminance ≥ 0.080. Luminance is Rec. 709 on linearised sRGB, normalised to white = 1.

The incident and centre proof retain the original calm staging for camera matching. Kiting and the twelve lane crops show live enemies. Each row gives mean, peak and lit area as baseline → revision. The marine column is the current peak. “Marine ceiling” marks a 1.5× baseline target at or above the marine. “Below 1.5×” marks residual headroom. [Source boxes, pixel counts and unrounded measurements](../../artifacts/nextgen/room33/now/revision-selected/luminance.json)

| Room | Camera | Mean | Peak | Marine | Lit pixels | 1.5× comparison |
|---|---|---:|---:|---:|---:|---|
| awakening-bay | Incident | 0.090 → 0.112 | 0.216 → 0.216 | 0.224 | 21223 → 25591 | marine ceiling |
| awakening-bay | Arena | 0.143 → 0.340 | 0.465 → 0.492 | 0.532 | 24902 → 31486 | marine ceiling |
| passenger-vault | Incident | 0.035 → 0.247 | 0.073 → 0.315 | 0.414 | 0 → 22362 | 1.5× |
| passenger-vault | Arena | 0.167 → 0.264 | 0.455 → 0.497 | 0.578 | 19125 → 20274 | marine ceiling |
| residential-gallery | Incident | 0.072 → 0.257 | 0.168 → 0.323 | 0.424 | 19046 → 34654 | 1.5× |
| residential-gallery | Arena | 0.192 → 0.324 | 0.464 → 0.484 | 0.694 | 27392 → 33430 | marine ceiling |
| communal-atrium | Incident | 0.085 → 0.181 | 0.365 → 0.321 | 0.323 | 14478 → 24863 | marine ceiling |
| communal-atrium | Arena | 0.151 → 0.308 | 0.466 → 0.485 | 0.565 | 12276 → 23268 | marine ceiling |
| crew-checkpoint | Incident | 0.106 → 0.143 | 0.227 → 0.354 | 0.445 | 22395 → 22538 | 1.5× |
| crew-checkpoint | Arena | 0.176 → 0.215 | 0.423 → 0.457 | 0.669 | 15840 → 18292 | below 1.5× |
| armory | Incident | 0.178 → 0.136 | 0.374 → 0.247 | 0.255 | 24657 → 25940 | marine ceiling |
| armory | Arena | 0.202 → 0.305 | 0.455 → 0.462 | 0.602 | 17036 → 18721 | marine ceiling |
| freight-hold | Incident | 0.036 → 0.140 | 0.067 → 0.256 | 0.368 | 0 → 55577 | 1.5× |
| freight-hold | Arena | 0.231 → 0.253 | 0.573 → 0.607 | 0.640 | 25445 → 28346 | marine ceiling |
| breached-loading-bay | Incident | 0.116 → 0.308 | 0.324 → 0.439 | 0.475 | 35677 → 47884 | marine ceiling |
| breached-loading-bay | Arena | 0.208 → 0.343 | 0.577 → 0.589 | 0.722 | 34195 → 42041 | marine ceiling |
| relay-racks | Incident | 0.107 → 0.235 | 0.324 → 0.405 | 0.466 | 28294 → 40310 | marine ceiling |
| relay-racks | Arena | 0.198 → 0.285 | 0.439 → 0.461 | 0.635 | 28829 → 31903 | marine ceiling |
| transmission-chamber | Incident | 0.082 → 0.156 | 0.245 → 0.366 | 0.370 | 12305 → 23439 | below 1.5× |
| transmission-chamber | Arena | 0.165 → 0.194 | 0.389 → 0.480 | 0.649 | 18905 → 21980 | below 1.5× |
| diagnostic-gallery | Incident | 0.125 → 0.358 | 0.283 → 0.425 | 0.431 | 16782 → 24008 | 1.5× |
| diagnostic-gallery | Arena | 0.159 → 0.366 | 0.450 → 0.488 | 0.647 | 15735 → 24280 | marine ceiling |
| safety-interlock-station | Incident | 0.164 → 0.156 | 0.262 → 0.269 | 0.312 | 12664 → 12961 | marine ceiling |
| safety-interlock-station | Arena | 0.194 → 0.297 | 0.445 → 0.491 | 0.522 | 5028 → 6910 | marine ceiling |
| coolant-plant | Incident | 0.257 → 0.418 | 0.547 → 0.563 | 0.598 | 16071 → 17308 | marine ceiling |
| coolant-plant | Arena | 0.191 → 0.374 | 0.511 → 0.513 | 0.732 | 7166 → 7804 | marine ceiling |
| service-shaft-landing | Incident | 0.025 → 0.202 | 0.073 → 0.310 | 0.386 | 0 → 33221 | 1.5× |
| service-shaft-landing | Arena | 0.290 → 0.357 | 0.557 → 0.615 | 0.682 | 28298 → 28381 | marine ceiling |
| infested-workshop | Incident | 0.095 → 0.110 | 0.220 → 0.343 | 0.432 | 16168 → 19374 | 1.5× |
| infested-workshop | Arena | 0.165 → 0.250 | 0.415 → 0.447 | 0.713 | 15395 → 19090 | below 1.5× |
| swarm-junction | Incident | 0.042 → 0.220 | 0.118 → 0.302 | 0.372 | 5235 → 53319 | 1.5× |
| swarm-junction | Arena | 0.025 → 0.220 | 0.062 → 0.273 | 0.531 | 0 → 42206 | 1.5× |
| shielding-gate | Incident | 0.082 → 0.239 | 0.288 → 0.331 | 0.355 | 16720 → 32696 | marine ceiling |
| shielding-gate | Arena | 0.167 → 0.280 | 0.381 → 0.454 | 0.650 | 26810 → 31087 | below 1.5× |
| containment-annulus | Incident | 0.086 → 0.305 | 0.387 → 0.374 | 0.384 | 2768 → 7930 | marine ceiling |
| containment-annulus | Arena | 0.168 → 0.372 | 0.520 → 0.522 | 0.686 | 14125 → 16850 | marine ceiling |
| manual-control-chamber | Incident | 0.143 → 0.192 | 0.346 → 0.379 | 0.506 | 20495 → 27505 | marine ceiling |
| manual-control-chamber | Arena | 0.092 → 0.155 | 0.269 → 0.292 | 0.307 | 22466 → 34755 | marine ceiling |
| overload-floor | Incident | 0.112 → 0.310 | 0.231 → 0.384 | 0.404 | 15723 → 25034 | 1.5× |
| overload-floor | Arena | 0.174 → 0.354 | 0.432 → 0.449 | 0.520 | 7493 → 12061 | marine ceiling |

#### Frame review

| Room | Falloff | What reads at 480 × 270 |
|---|---|---|
| awakening-bay | Strip | A warm strip follows the thaw fitting’s ribs, with a visible break beneath its shoe and a cool pool around the marine. |
| passenger-vault | Under-glow | The green light catches the displaced berth train, and two broad, parallel gouges identify the lane after the berths leave the crop. |
| residential-gallery | Spill | A warm spill picks out the overturned trolley and the loose dishes against the darker aisle. |
| communal-atrium | Broken ring | The lavender break in the ring reveals the fallen planter’s pipe, but the foliage and overturned furniture still merge at thumbnail size. |
| crew-checkpoint | Strip | The amber bar shadow crosses a single burnished sweep, and the torn shoes interrupt its edge. |
| armory | Split fan | The green fan separates the linked cartridges from the deck, though the incident crop cuts off their feed and the tips resemble spikes. |
| freight-hold | Under-glow | The warm return picks out the splayed cargo runner in the centre, but the incident view leaves a gap between the light and the fallen load. |
| breached-loading-bay | Split fan | Amber light follows the diagonal of the peeled loading plates, with exposed dark gaps between the bent leaves. |
| relay-racks | Strip | The amber strip under the rack makes the comb teeth and their parallel cable runs legible at thumbnail size. |
| transmission-chamber | Split fan | The amber fittings lead into an angular trench whose separated conductor bars remain visible in the fighting-floor crops. |
| diagnostic-gallery | Under-glow | The violet under-glow frames the tipped diagnostic bed and its trailing caster marks beneath the sign. |
| safety-interlock-station | Broken ring | The green return makes the split contact visible through the gap between the sign and the switch bank. |
| coolant-plant | Spill | The warm spill follows the split header while its dark bands keep the marine’s legs distinct from the pale runoff. |
| service-shaft-landing | Broken ring | A short inspection light catches the sheave rim and reveals its open spokes against the lower balcony. |
| infested-workshop | Split fan | An amber patch beneath the thrown impeller separates its broken blades from the purple growth. |
| swarm-junction | Spill | The green spill separates the dark shell fragments and broken pipe from the magenta growth. |
| shielding-gate | Strip | The gate teeth and their shadows interrupt the amber strip while the marine crosses the darker lower track. |
| containment-annulus | Broken ring | The amber crescent follows the separated jacket clamps, leaving the deck beside the marine cooler. |
| manual-control-chamber | Under-glow | A green under-glow follows the keyed reader, whose dark face keeps its edge beside the marine. |
| overload-floor | Spill | The bus shoes repeat the generator’s rhythm through the fight, and the orange-capped dark feeder face marks the sheltered step. |

#### Draw and campaign receipts

Each High and Low peak is the maximum of 30 matched combat renders after preparation. The compile counter wraps WebGL compileShader during those renders. [Baseline receipt](../../artifacts/nextgen/room33/base/draws/manifest.json) · [Revised receipt](../../artifacts/nextgen/room33/now/revision-selected/lane-draws/manifest.json)

| Room | High baseline → revision | Low baseline → revision | Combat compiles High / Low |
|---|---:|---:|---:|
| awakening-bay | 138 → 140 | 127 → 128 | 0 / 0 |
| passenger-vault | 115 → 119 | 104 → 107 | 0 / 0 |
| residential-gallery | 113 → 115 | 104 → 105 | 0 / 0 |
| communal-atrium | 130 → 132 | 121 → 122 | 0 / 0 |
| crew-checkpoint | 107 → 110 | 98 → 100 | 0 / 0 |
| armory | 199 → 201 | 190 → 191 | 0 / 0 |
| freight-hold | 118 → 120 | 107 → 108 | 0 / 0 |
| breached-loading-bay | 126 → 128 | 116 → 117 | 0 / 0 |
| relay-racks | 135 → 137 | 125 → 126 | 0 / 0 |
| transmission-chamber | 120 → 123 | 109 → 111 | 0 / 0 |
| diagnostic-gallery | 120 → 122 | 108 → 109 | 0 / 0 |
| safety-interlock-station | 269 → 271 | 258 → 259 | 0 / 0 |
| coolant-plant | 120 → 122 | 108 → 109 | 0 / 0 |
| service-shaft-landing | 116 → 118 | 105 → 106 | 0 / 0 |
| infested-workshop | 189 → 191 | 179 → 180 | 0 / 0 |
| swarm-junction | 105 → 107 | 94 → 95 | 0 / 0 |
| shielding-gate | 258 → 260 | 247 → 248 | 0 / 0 |
| containment-annulus | 130 → 132 | 119 → 120 | 0 / 0 |
| manual-control-chamber | 153 → 155 | 141 → 142 | 0 / 0 |
| overload-floor | 138 → 141 | 125 → 128 | 0 / 0 |

All 40 fixed source boxes have at least the baseline lit area. The source peak stays below the measured marine pool in 40/40 views. 10 reach 1.5× baseline and 25 place that target at or above the marine peak. The other 5 have measurable headroom. The arena views in Checkpoint, Transmission, Infested Workshop and Shielding Gate put the marine beside or over the fixture. Their lower exposures retain the actor and equipment edges. Transmission incident reaches 1.497×. Three incident baseline peaks already exceed the revised marine peak, in Communal Atrium, Armory and Containment Annulus. Awakening incident differs from baseline by less than 0.0003 in linear luminance.

The weakest three compositions are **Communal Atrium**, where the foliage overlaps the overturned furniture, **Armory**, where the ammunition feed is cropped, and **Freight Hold**, where the incident light still reads separately from the load at small size. [Atrium](../../artifacts/nextgen/room33/sheets/communal-atrium/incident-native.jpg) · [Armory](../../artifacts/nextgen/room33/sheets/armory/incident-native.jpg) · [Freight](../../artifacts/nextgen/room33/sheets/freight-hold/incident-native.jpg)

The separate live High Arc benchmark peaked at 273 → 248 draws in Safety Interlock, with 0 combat shader compiles and 5.00 simulated seconds in the final trial. An intermediate exposure build peaked at 291 in its own live trial. The matched fixed-step table measures the draw change for identical encounter samples. [Baseline benchmark](../../artifacts/nextgen/room33-safety-base/benchmark.json) · [Intermediate benchmark](../../artifacts/nextgen/room33-revision-safety/benchmark.json) · [Final benchmark](../../artifacts/nextgen/room33-final-safety/benchmark.json)

The final default production build passed. All 60 native comparison subjects, the 12 lane subjects and the refuge capture have empty error lists. Pyro ran on seed 1729 and reached **room-limit** after 8 rooms with 0 runtime errors. The baseline runner flagged loading over five seconds in passenger-vault (6.82 s), residential-gallery (5.79 s). The final runner flagged none. [Baseline Pyro](../../artifacts/nextgen/playtest/room33-pyro-base/report.json) · [Final Pyro](../../artifacts/nextgen/playtest/room33-final-pyro/report.json)

## ROOM34

Branch `t3/room34` starts at `019f4e51`. The previous and current images use the same desktop fixture and coordinates. On the room sheets the previous frame is on the left. The lower row, where present, is a 480 × 270 extraction at native pixel size.

1. Passenger's displaced berth runner leaves a straight bed with exposed mounting shoes. Checkpoint's bowed barrier track folds up in sections. Transmission exposes conductor between broken lengths of channel. Overload carries a jacketed feeder across the bank to the shelter. The crossing profiles use the existing clipped deck skin. Raised fragments stand along the service edges, and the original authored obstacles provide all collision.
2. The fixture head has a saturated lens with three guards. The reflected pattern has an outer cut, a shadow and a falloff toward the rim. Coolant's throw breaks behind its fitting and Swarm's throw contracts under the split pipe. The lead's exposure setting is .62. Comparing the first current images revealed an overly broad projection in Residential and a hidden thaw head in Awakening. The final pass narrowed the reflector and let the cutaway handle the open lid independently.
3. During the first fork capture the projectile warning hid the whole plate. The refuge now cuts away for an overlapping actor and stays visible for the volley. A renderer readback confirmed the named mesh and all three parents visible in the fork. The existing reactor feeder ends in a taller plate with an ochre return, a closed end and dark standing room. The outside corner of `inc13-reactor-feeder-refuge` is at ship-plan coordinates (833.71, 349.82). The spark projects from that corner at a height of 1.62 m, triggered by the preview round's existing impact time.
4. The recovery grille has a separate moving lattice and fixed backlit frame. On the branch-cut game the open grille is staged at the Manual console. The renderer can consume PLAY39's waiting, closed and entered states as they become available. The frame stays up during the slam. Relay's broken shutter keeps one lit jamb. Warm bands mark Coolant's return bend.
5. Combat inspection exposed whole-machine cutaways on the Residential trolley, Relay rack and Safety switch. Their new fittings now stay within the original low profile. The shaft drum has its own cutaway ranges so the rope and sheave stay in view. The twenty-room review is recorded below.
6. The centre inserts use the room's existing hatch, drain, track or trench dimensions. Flush grate fingers expose bands of insulation, hatch sections carry hard index marks, and the breach, split pipe and gate now have centre inserts. Ten service props carry identification plates and contrasting marks in their existing geometry batches.

### Room comparisons

The first three columns give incident-floor / marine-floor peak luminance in the final High frame. The last two give the largest draw count observed across those three staged views, previous → current. These are screenshot diagnostics. The detailed file contains both builds’ means, 95th percentiles, peaks and sample counts.

| Room and native crop | Incident | Centre | Kiting | High draws | Low draws | Review change |
|---|---:|---:|---:|---:|---:|---|
| [awakening-bay](../../artifacts/nextgen/room34/sheets/awakening-bay/incident-facing.jpg) | 0.145 / 0.224 | 0.374 / 0.557 | 0.372 / 0.493 | 136 → 136 | 124 → 124 | The open thaw lid presents its warm liner to the hose and leaves the other berth lids shut. |
| [passenger-vault](../../artifacts/nextgen/room34/sheets/passenger-vault/incident-facing.jpg) | 0.165 / 0.429 | 0.514 / 0.698 | 0.599 / 0.371 | 119 → 119 | 107 → 107 | The wheel bed stays straight while the loose runner crosses it. Rectangular mounting shoes repeat along the empty bed. |
| [residential-gallery](../../artifacts/nextgen/room34/sheets/residential-gallery/incident-facing.jpg) | 0.215 / 0.424 | 0.483 / 0.676 | 0.791 / 0.569 | 112 → 112 | 102 → 102 | The tray now carries a larger handled cup and a separate plate. The table frame still dominates from across the lane. |
| [communal-atrium](../../artifacts/nextgen/room34/sheets/communal-atrium/incident-facing.jpg) | 0.206 / 0.302 | 0.426 / 0.673 | 0.486 / 0.273 | 131 → 131 | 121 → 121 | Wider green leaves spread past the end of the ochre planter and separate it from the furniture. |
| [crew-checkpoint](../../artifacts/nextgen/room34/sheets/crew-checkpoint/incident-facing.jpg) | 0.224 / 0.445 | 0.390 / 0.664 | 0.413 / 0.556 | 108 → 108 | 98 → 98 | A heavier broken arm and the angular folds in the track tie the change in lane direction to the barrier. |
| [armory](../../artifacts/nextgen/room34/sheets/armory/incident-facing.jpg) | 0.317 / 0.255 | 0.280 / 0.573 | 0.288 / 0.576 | 165 → 165 | 156 → 156 | Dark links interrupt the brass cases and the cartridges turn at different angles on the belt. |
| [freight-hold](../../artifacts/nextgen/room34/sheets/freight-hold/incident-facing.jpg) | 0.164 / 0.368 | 0.598 / 0.587 | 0.599 / 0.586 | 117 → 117 | 106 → 106 | The open pallet exposes two upright cargo pieces and a torn diagonal tie-down. |
| [breached-loading-bay](../../artifacts/nextgen/room34/sheets/breached-loading-bay/incident-facing.jpg) | 0.399 / 0.433 | 0.399 / 0.691 | 0.451 / 0.626 | 122 → 123 | 111 → 112 | Short steel braces descend below the broken deck edge into the breach. |
| [relay-racks](../../artifacts/nextgen/room34/sheets/relay-racks/incident-facing.jpg) | 0.266 / 0.466 | 0.390 / 0.598 | 0.386 / 0.439 | 136 → 136 | 125 → 125 | Taller, angled copper teeth lift off the rack slats. One jamb remains lit when the shutter breaks. |
| [transmission-chamber](../../artifacts/nextgen/room34/sheets/transmission-chamber/incident-facing.jpg) | 0.288 / 0.370 | 0.444 / 0.631 | 0.853 / 0.643 | 121 → 121 | 111 → 111 | The conductor follows the channel to the orange terminal, with an interruption between exposed contacts. |
| [diagnostic-gallery](../../artifacts/nextgen/room34/sheets/diagnostic-gallery/incident-facing.jpg) | 0.372 / 0.431 | 0.395 / 0.593 | 0.791 / 0.379 | 116 → 116 | 103 → 103 | A circular instrument with a needle sits beside the probe head over the patient cradle. |
| [safety-interlock-station](../../artifacts/nextgen/room34/sheets/safety-interlock-station/incident-facing.jpg) | 0.456 / 0.243 | 0.402 / 0.524 | 0.386 / 0.493 | 162 → 162 | 149 → 149 | A steel lever and ochre cross-handle rise above the toothed sliding interlock. |
| [coolant-plant](../../artifacts/nextgen/room34/sheets/coolant-plant/incident-facing.jpg) | 0.434 / 0.534 | 0.401 / 0.663 | 0.856 / 0.594 | 118 → 118 | 106 → 106 | The footing interrupts the spill, and the darker ice and two amber bands pick out the return bend. |
| [service-shaft-landing](../../artifacts/nextgen/room34/sheets/service-shaft-landing/incident-facing.jpg) | 0.201 / 0.386 | 0.603 / 0.713 | 0.791 / 0.508 | 111 → 111 | 100 → 100 | The standing rope ends at a flanged winch drum whose width gives the sheave scale. |
| [infested-workshop](../../artifacts/nextgen/room34/sheets/infested-workshop/incident-facing.jpg) | 0.320 / 0.432 | 0.412 / 0.612 | 0.461 / 0.361 | 154 → 154 | 144 → 144 | Two full-height jaws and a transverse screw handle hold the split impeller on the buried bench. |
| [swarm-junction](../../artifacts/nextgen/room34/sheets/swarm-junction/incident-facing.jpg) | 0.168 / 0.372 | 0.169 / 0.531 | 0.168 / 0.471 | 99 → 100 | 88 → 89 | The green throw occupies a shorter, narrower patch beneath the split header. |
| [shielding-gate](../../artifacts/nextgen/room34/sheets/shielding-gate/incident-facing.jpg) | 0.192 / 0.355 | 0.311 / 0.622 | 0.794 / 0.469 | 255 → 256 | 244 → 245 | A banded post projects above the loose gate teeth on the far side. |
| [containment-annulus](../../artifacts/nextgen/room34/sheets/containment-annulus/incident-facing.jpg) | 0.296 / 0.384 | 0.453 / 0.622 | 0.791 / 0.578 | 129 → 129 | 118 → 118 | Crosswise flanges clasp the curved feeder between adjacent sections. |
| [manual-control-chamber](../../artifacts/nextgen/room34/sheets/manual-control-chamber/incident-facing.jpg) | 0.188 / 0.381 | 0.173 / 0.368 | 0.791 / 0.545 | 146 → 148 | 133 → 135 | The charcoal operating face separates the arm from the console. The backlit grille marks the waiting position. |
| [overload-floor](../../artifacts/nextgen/room34/sheets/overload-floor/incident-facing.jpg) | 0.239 / 0.404 | 0.346 / 0.442 | 0.373 / 0.514 | 135 → 135 | 122 → 122 | The feeder returns from the far bank to the tall, capped refuge plate. A dark rectangle marks the sheltered side. |

Measurements use Rec. 709 on linearised sRGB. The 320 × 224 source rectangle follows the same projected throw in both images. The marine sample is a floor ellipse about the boots with radii of 115 and 88 native pixels. Both use the current opaque floor classification eroded by one mask pixel and exclude the HUD. Deck highlights can set either maximum. An em dash denotes an empty or unavailable sample.

[All comparison sheets](../../artifacts/nextgen/room34/sheets/) · [Unrounded measurements](../../artifacts/nextgen/room34/numbers.json) · [Original capture receipts and retries](../../artifacts/nextgen/room34/capture-ledger.json)

The marine-floor peak leads in 37 of 40 calm and incident views. The exceptions are Armory and Safety incident-facing, and Freight centre. All twenty centre views place the marine ahead at the 95th percentile. In kiting, 12 of 20 source boxes exceed the marine peak and six exceed the marine mean. The fixed source box samples the displayed frame, including world-space overlays drawn over classified deck pixels. The marked pixels land on enemy status bars in Residential, Diagnostic, Coolant, Service Shaft, Annulus and Manual, a floating damage numeral in Transmission, and a red combat cue at Shielding. Freight's maximum lies on illuminated deck. The measurements do not establish a universal marine-first ordering. [Peak pixels in the final kiting frames](../../artifacts/nextgen/room34/sheets/kiting-peak-pixels.png)

The strongest lane cue is Transmission’s copper run with a missing section. Passenger’s torn rail and mounting shoes are visible side by side. Checkpoint’s bends are shallow, and Overload still loses the far end of its feeder in the darkest fight crop. The three weakest room compositions are Communal Atrium, where the planter and overturned furniture still overlap, Diagnostic Gallery, where the lettering carries more information than the instrument dial, and Service Shaft Landing, where the rope, drum and sheave still read separately from the combat position. [Passenger](../../artifacts/nextgen/room34/sheets/passenger-vault-lanes.jpg) · [Checkpoint](../../artifacts/nextgen/room34/sheets/crew-checkpoint-lanes.jpg) · [Transmission](../../artifacts/nextgen/room34/sheets/transmission-chamber-lanes.jpg) · [Overload](../../artifacts/nextgen/room34/sheets/overload-floor-lanes.jpg)

The outside corner of the feeder plate in Three.js world coordinates is (26.05352, 1.61875, 10.93182) metres. [Previous and current fork preview](../../artifacts/nextgen/room34/sheets/play26-final-fork-native.jpg) · [Native impact pair](../../artifacts/nextgen/room34/sheets/room34-impact-native.jpg)

Both quality tiers cover 20 rooms in three views on each build, for 240 selected frames with empty error lists. The main capture used the corrected footprint build at `bc620d98`. The selected Overload frames include the refuge correction at `808d9ab5`. Residential, Relay, Safety and Shaft were recaptured on `61a33101` after their local cutaway fixes. High and Low recorded zero combat shader compiles during the instrumented staged combat windows. Peak staged draws rose by one at Breach, Swarm and Shielding, and two at Manual. Safety stayed at 162 High and 149 Low. Capture startup or loading timeouts were retried. Earlier native campaign attempts also hit the runner’s screenshot timeout. [Evidence gallery](../../artifacts/nextgen/room34/index.html) · [Selected frame manifest](../../artifacts/nextgen/room34/selected-frames.json)

The default production build passed. The unmodified native Arc campaign on seed 2718 reached room 17, Shielding Gate, after clearing 16 rooms. The marine died there after 39 minutes of wall time. The final report has zero runtime errors and two loading defects, Passenger Vault and Residential Gallery. Total entry holds over five seconds were Passenger 12.28 s, Residential 11.37 s and Checkpoint 6.44 s. The runner returned exit 1, and the final three rooms have staged capture coverage only. [Build log](../../artifacts/nextgen/room34/build-final.log) · [Native campaign report](../../artifacts/nextgen/playtest/room34/report.json) · [Terminal frame](../../artifacts/nextgen/playtest/room34/terminal-dead.png)

At the start, `df -h /Users/chernodub` reported 926 GiB total, 870 GiB used, 26 GiB available and 98% capacity. At the end it reported 926 GiB total, 809 GiB used, 89 GiB available and 91% capacity. This worktree’s `artifacts/nextgen/` occupied 2.8 GiB at handoff.

## ROOM35 — bank tracks, reactor shelter and fight-centre wear

Passenger's paired berth runners cross the near and far banks at the gauge of the displaced beds. Checkpoint's pivot track breaks into curved shoes with an open centre groove. Transmission's bare conductor crosses ribbed insulators. Overload's wide bus passes under transverse steel clamps. These details share the existing clipped deck texture.

The reactor sill has a wedge-shaped stopping face, an upward-facing steel cap and a continuous ochre edge down the end plate to the sheltered standing space. The fork preview projects that return and the tracer endpoint at the cap. The native blocked-shot event supplies the impact timing and position. The geometry, preview and paint changes use the existing collision surface.

Eighteen arena centres carry a local drag mark, scorch, spill or chevron and a broken identification plate with a folded seam. The sheet sits at 0.0214 m and clips against the hull, voids and solids. Existing layered contact grime darkens the walls and hardware feet. The unlit deck received a 10% dark paint wash outside the two fixture masks. Communal Atrium and Manual Control Chamber retain their existing dressing pending PLAY41. Coolant's reflected throw is narrower and shorter, with a dark gap at the footing. Shielding's bar terminates at a hard transverse edge. Both retain the source lens.

The first native impact comparison exposed a cutaway defect. A creature crossing the extended foot rail could remove the whole shelter. The revised sill uses four contiguous panels with separate actor-only cutaway ranges in its existing draw. The native fork fixture reports the first safe standing point at (778.35, 319.06) and the shot stop at (833.71, 349.82), both in ship units. These positions bracket the return edge. The impact flash projects at the cap, 1.62 m above the shot stop.

Across the eighteen dressed rooms, the matched High calm and kiting frames contributed 15,471 visible deck samples outside practical pools. Their mean linear Rec. 709 luma fell from 0.05659 to 0.05179 (8.5%). Inside the practicals, 1,670 samples averaged 0.10210 before and 0.09528 after. The photographed deck includes the marine's own light, deck coatings and effects over opaque geometry. These are image measurements on the capture positions. White shin panels and black boot outlines remain distinguishable in the High review strip. The pale sole still meets pale equipment in Coolant and the shaft landing. The dark register of the right reactor bank also hides clamp detail between highlights.

The comparison projects the capture renderer's visible-floor samples onto the ground plane using its camera matrices. Each point is classified against the tapered practical footprint using the visible fixtures' recorded angles, widths and depths (four High, two Low). This approximates the practical pool mask. Per-room values combine the calm and kiting samples by pixel count; draw counts take the maximum across calm, incident-facing and kiting. The High reference is final25. Its Low gallery covers a subset of rooms, so the previous Low peaks below come from the twenty-room ROOM34 sweep.

The integrated build with HEAVY45 also ran one ten-second Arc benchmark per tier at Safety Interlock. The 25-enemy scenario peaked at 179 draws on High and 165 on Low, with zero combat shader compiles, runtime errors or budget failures. This separate workload differs from the three screenshot fixtures. [Benchmark receipt](../../artifacts/nextgen/room35-safety/benchmark.json)

The original native Arc command on seed 2718 hit its one-hour wall limit in Service Shaft Landing. It cleared 13 rooms and recorded zero runtime errors. The continuation starts at the earned Coolant Plant reward checkpoint with the recorded health, resources and build. A separate final25 room-19 continuation on the completed shooter-bank build reached the ending, recorded the native choice and three impacts, and logged zero runtime errors. It returned exit 1 for a loading defect. The successful final-room retry loaded Overload in 20.20 seconds. Earlier attempts on the segmented sill and shooter-bank versions timed out at the 120-second room-loading limit while GPU shader preparation was pending. [Original command](../../artifacts/nextgen/playtest/room35/report.json) · [Continuation](../../artifacts/nextgen/playtest/room35-continued/report.json) · [Final-room replay](../../artifacts/nextgen/final25/.work/playtest/room35-bank-final-retry/report.json)

All twenty rooms have a selected calm, incident-facing and kiting frame on both quality tiers. All 120 selected frames have clean capture manifests. The 60 High frames individually match or improve on their final25 draw count. Peak staged draws were 257 High and 246 Low at Shielding Gate, within the 330-draw budget. Safety Interlock reached 162 High and 149 Low. Smaller capture batches replaced startup or room-loading timeouts on both tiers. [Paired native and 480×270 gallery](../../artifacts/nextgen/room35/index.html) · [Per-frame measurements and source manifests](../../artifacts/nextgen/room35/measurements.json) · [High boot review](../../artifacts/nextgen/room35/boot-review-high.png) · [Low boot review](../../artifacts/nextgen/room35/boot-review-low.png)

| Room | In pool, final25 → ROOM35 | Outside pool, final25 → ROOM35 | Low luma, in / out | High draws, final25 → ROOM35 | Low draws, ROOM34 → ROOM35 |
|---|---:|---:|---:|---:|---:|
| awakening-bay | 0.058 → 0.054 | 0.050 → 0.046 | 0.050 / 0.042 | 137 → 137 | 124 → 125 |
| passenger-vault | 0.079 → 0.078 | 0.061 → 0.059 | 0.074 / 0.055 | 120 → 119 | 107 → 108 |
| residential-gallery | 0.112 → 0.108 | 0.058 → 0.053 | 0.109 / 0.043 | 113 → 113 | 102 → 103 |
| communal-atrium | 0.065 → 0.066 | 0.060 → 0.059 | 0.065 / 0.057 | 132 → 132 | 121 → 122 |
| crew-checkpoint | 0.103 → 0.094 | 0.044 → 0.041 | 0.099 / 0.038 | 109 → 108 | 98 → 98 |
| armory | 0.095 → 0.103 | 0.058 → 0.056 | 0.108 / 0.054 | 166 → 166 | 156 → 157 |
| freight-hold | 0.160 → 0.170 | 0.067 → 0.059 | 0.205 / 0.055 | 118 → 118 | 106 → 107 |
| breached-loading-bay | 0.106 → 0.098 | 0.065 → 0.060 | 0.100 / 0.053 | 124 → 124 | 112 → 113 |
| relay-racks | 0.080 → 0.078 | 0.040 → 0.035 | 0.086 / 0.035 | 137 → 136 | 125 → 125 |
| transmission-chamber | 0.077 → 0.073 | 0.034 → 0.032 | 0.083 / 0.032 | 122 → 121 | 111 → 111 |
| diagnostic-gallery | 0.099 → 0.093 | 0.070 → 0.063 | 0.112 / 0.061 | 117 → 116 | 103 → 104 |
| safety-interlock-station | 0.095 → 0.089 | 0.077 → 0.071 | 0.086 / 0.070 | 163 → 162 | 149 → 149 |
| coolant-plant | 0.122 → 0.087 | 0.074 → 0.065 | 0.097 / 0.061 | 119 → 118 | 106 → 106 |
| service-shaft-landing | 0.161 → 0.152 | 0.065 → 0.060 | 0.139 / 0.047 | 112 → 112 | 100 → 101 |
| infested-workshop | 0.036 → 0.032 | 0.031 → 0.026 | 0.032 / 0.027 | 155 → 155 | 144 → 145 |
| swarm-junction | 0.112 → 0.110 | 0.032 → 0.026 | 0.138 / 0.026 | 101 → 101 | 89 → 89 |
| shielding-gate | 0.130 → 0.118 | 0.049 → 0.045 | 0.137 / 0.042 | 257 → 257 | 245 → 246 |
| containment-annulus | 0.098 → 0.087 | 0.095 → 0.089 | 0.084 / 0.087 | 130 → 129 | 118 → 119 |
| manual-control-chamber | 0.056 → 0.056 | 0.038 → 0.038 | 0.049 / 0.037 | 147 → 147 | 135 → 134 |
| overload-floor | 0.137 → 0.133 | 0.070 → 0.067 | 0.146 / 0.073 | 136 → 135 | 122 → 123 |

Four 480×270 crop pairs per lane show the decks with the main landmark outside the crop. They include native combat, entry and clear frames at fighting positions. Camera and actor positions vary between runs. Passenger and Transmission carry the clearest shapes. On the darkest Overload bank, the clamps are easier to follow near a highlight. The cap and near return remain visible at the native impact, although intervening actors cut away middle panels. On approach the HUD and crowd can still conceal part of the shelter. [Passenger](../../artifacts/nextgen/room35/native/passenger-vault-banks.png) · [Checkpoint](../../artifacts/nextgen/room35/native/crew-checkpoint-banks.png) · [Transmission](../../artifacts/nextgen/room35/native/transmission-chamber-banks.png) · [Overload](../../artifacts/nextgen/room35/native/overload-floor-banks.png) · [Approach](../../artifacts/nextgen/room35/approach-480.png) · [Choice](../../artifacts/nextgen/room35/bank-choice-480.png) · [Impact](../../artifacts/nextgen/room35/cover-lip-impact-1-480.png)

The earned-checkpoint continuation finished the campaign with all twenty rooms cleared, zero runtime errors and seven recorded room-loading holds over five seconds in the cumulative report. The runner returned exit 1. Elapsed wall time across both invocations was 5,064 seconds, including 1,463 seconds on the continuation. HEAVY45 was present in the continuation build. BROOD43 landed during that run. After merging it locally, the conflict-marker scan was clear, the default production build passed and the re-captured reactor fork had empty errors and failures. [Final production build](../../artifacts/nextgen/room35/build-delivery.log) · [Integrated fork capture](../../artifacts/nextgen/room35-delivery-brood/manifest.json)

At the start the data volume had 926 GiB total, 826 GiB used, 74 GiB available and 92% capacity. At handoff it had 926 GiB total, 835 GiB used, 61 GiB available and 94% capacity. This worktree's artifacts/nextgen occupied 1.6 GiB.

## ROOM35b — the two recovery grilles

In Communal Atrium the two waiting escorts now occupy separate bays against a warm, self-lit aisle lining. Manual Control scales the same lining to the held group. The bright strip sits behind the bodies. The shutter has short returns that show its travel from the nearly edge-on game camera. The existing recovery-grille-closed event supplies a short camera impulse. Encounter staging, collision and withdrawal timing stay with PLAY41.

Atrium has paired drag marks and a seamed MESS 4 plate. Manual has worn control chevrons and a CTRL plate. Both use the ROOM35 clipped deck layer and its outside-pool darkening. The grille parts remain in the two existing mesh batches.

| Room | High draws, before → now | Low draws, before → now |
|---|---:|---:|
| Communal Atrium | 133 → 133 | 123 → 123 |
| Manual Control Chamber | 182 → 182 | 169 → 169 |

All three phases recorded the same count within each room and tier, below the 330-draw budget. The default production build passed. The four selected manifests cover 24 captures with empty errors and failures. The comparisons restage recorded Pyro positions with the production game camera. Atrium uses the PLAY41b waiting receipt. Manual uses a prior Pyro waiting receipt and the PLAY41b aisle-placement function. The hit frame exercises the native grille closure at 50 ms and the down frame shows it at 360 ms. These are matched presentation captures. The Atrium pair separates at 480×270. The near-edge-on shutter still looks thin there, especially in a still frame. In Manual the right edge crops the backlight at the sampled player position.

[Native and 480×270 pairs](../../artifacts/nextgen/room35b/index.html) · [Per-frame draw calls](../../artifacts/nextgen/room35b/draws.json) · [Final High manifest](../../artifacts/nextgen/room35b-final-high/manifest.json) · [Final Low manifest](../../artifacts/nextgen/room35b-final-low/manifest.json) · [Production build](../../artifacts/nextgen/room35b/build.log)

## ROOM36 — the covered return and arena lighting

The Overload Floor tread follows the surveyed covered route from (1140, 520), through (944, 496) and (880, 336), to the first protected step at (778.35, 319.06). Two lowered sill panels reveal the bay behind the intact end cap. The preview round meets the outside corner at (833.71, 349.82). Both the deck paint and the light use the same path and the existing hull, void and obstacle clip. The world assets add no colliders or dynamic lights. At 480×270 the continuous tread survives between the red pools. The final turn is easier to see than the individual boot space. The native replay from the final26 room-19 reward recorded the bank choice and three impacts, then cleared with empty errors and defects. [Preview, choice and impact pairs](../../artifacts/nextgen/room36/shelter.png)

The twenty arena centres use a bevelled pool around the authored fighting position. The existing receiver replaces the earlier overlapping incident throws. The deck retains plate seams under the pool and a trimmed grate crosses the fighting lane. The suit lamp falls off at the boots. Coolant Plant has an absorptive receiver with a contact strip under the broken pipe. The wet metal and pale leg still compete in the closest view. Safety Interlock bakes its receiver into the deck’s existing emissive map. Its kiting frame had exceeded the baseline by one draw on both tiers before this change.

Crew Checkpoint has a two-bay buckled truss and repeated rack teeth with two missing teeth per shoe. Overload has displaced clamp jaws across its copper return. The original Passenger runners and Transmission conductor provide the other two lane comparisons. The shaded reactor clamps remain subtler than the Checkpoint teeth. These are native campaign crops at four fighting positions per lane, with camera and combat differences between runs. Room recognition by a new player has not been measured. [Checkpoint](../../artifacts/nextgen/room36/crew-checkpoint.png) · [Overload](../../artifacts/nextgen/room36/overload-floor.png) · [Passenger](../../artifacts/nextgen/room36/passenger-vault.png) · [Transmission](../../artifacts/nextgen/room36/transmission-chamber.png)

### Draw calls and floor luminance

Each draw count is the peak of three named views on that tier (arena calm, incident-facing and kiting). The before column uses ROOM35’s saved measurements. The luminance columns use linear Rec.709 luminance of visible floor samples from the new PNGs, pooled by sample count across the three views. Samples are projected onto the deck and classified by the arena receiver’s bevel. The transition band is excluded. Armory kiting rose by 11 draws on each tier. Shielding Gate’s High incident view rose from 95 to 170, while its kiting peak held at 257. All room peaks remain below 330. Safety Interlock’s calm, incident and kiting counts are now 125, 114 and 162 High and 112, 101 and 149 Low. Its ROOM35 counts were 126, 115 and 162 High and 113, 102 and 149 Low. [All 120 pairs at 480 and native size](../../artifacts/nextgen/room36/index.html) · [Per-view draws](../../artifacts/nextgen/room36/draws.json) · [Floor sample counts](../../artifacts/nextgen/room36/samples.json)

| Room | High draws before → after | High luma inside / outside | Low draws before → after | Low luma inside / outside |
|---|---:|---:|---:|---:|
| armory | 166 → 177 | 0.141 / 0.028 | 157 → 168 | 0.130 / 0.025 |
| awakening-bay | 137 → 137 | 0.092 / 0.027 | 125 → 125 | 0.091 / 0.023 |
| breached-loading-bay | 124 → 124 | 0.123 / 0.026 | 113 → 113 | 0.112 / 0.018 |
| communal-atrium | 132 → 132 | 0.073 / 0.026 | 122 → 122 | 0.072 / 0.022 |
| containment-annulus | 129 → 128 | 0.119 / 0.030 | 119 → 117 | 0.121 / 0.025 |
| coolant-plant | 118 → 119 | 0.130 / 0.009 | 106 → 107 | 0.132 / 0.004 |
| crew-checkpoint | 108 → 108 | 0.128 / 0.028 | 98 → 99 | 0.135 / 0.024 |
| diagnostic-gallery | 116 → 117 | 0.117 / 0.030 | 104 → 104 | 0.117 / 0.027 |
| freight-hold | 118 → 120 | 0.128 / 0.025 | 107 → 109 | 0.131 / 0.020 |
| infested-workshop | 155 → 155 | 0.062 / 0.010 | 145 → 145 | 0.067 / 0.009 |
| manual-control-chamber | 147 → 147 | 0.099 / 0.015 | 134 → 134 | 0.100 / 0.014 |
| overload-floor | 135 → 136 | 0.101 / 0.033 | 123 → 123 | 0.110 / 0.035 |
| passenger-vault | 119 → 120 | 0.102 / 0.034 | 108 → 108 | 0.099 / 0.030 |
| relay-racks | 136 → 137 | 0.079 / 0.018 | 125 → 126 | 0.077 / 0.018 |
| residential-gallery | 113 → 113 | 0.105 / 0.024 | 103 → 103 | 0.091 / 0.019 |
| safety-interlock-station | 162 → 162 | 0.087 / 0.019 | 149 → 149 | 0.086 / 0.016 |
| service-shaft-landing | 112 → 112 | 0.155 / 0.018 | 101 → 101 | 0.113 / 0.014 |
| shielding-gate | 257 → 257 | 0.088 / 0.019 | 246 → 246 | 0.091 / 0.014 |
| swarm-junction | 101 → 101 | 0.059 / 0.012 | 89 → 90 | 0.061 / 0.012 |
| transmission-chamber | 121 → 122 | 0.082 / 0.015 | 111 → 112 | 0.082 / 0.015 |

### Verification and remaining issues

The selected 120 views cover twenty rooms, three views and two tiers with empty capture errors and failures. The two main surveys use the same immutable production build. The selected Coolant and Interlock frames come from the two subsequent room-specific passes. The first High attempt hit a 120-second loading timeout when a rebuild replaced a lazy-loaded chunk. The retry used a frozen distribution. The final Interlock Pyro benchmark recorded 211 maximum draws High and 184 Low, zero new programs during combat and empty errors and budget failures. The live fight varied between trials. The table above compares the matched staged views. [High](../../artifacts/nextgen/room36-final-high/manifest.json) · [Low](../../artifacts/nextgen/room36-final-low/manifest.json) · [Selected views](../../artifacts/nextgen/room36/draws.json) · [Benchmark](../../artifacts/nextgen/room36-interlock-bench/benchmark.json)

The requested Arc 2718 command on the first implementation cleared sixteen rooms and died in Shielding Gate with zero runtime errors. Continuing from its earned Swarm Junction reward also ended in Shielding Gate. A fresh integrated Arc 2718 campaign cleared all twenty rooms in 1,237 wall seconds with zero runtime errors. The runner returned exit 1 for a 5.071-second Manual Control Chamber loading hold. This full campaign used the Coolant build immediately before the Interlock receiver moved into the deck pass. The Interlock change has six final staged frames and a live benchmark. [Initial campaign](../../artifacts/nextgen/playtest/room36/report.json) · [Earned continuation](../../artifacts/nextgen/playtest/room36-continued/report.json) · [Full clear](../../artifacts/nextgen/playtest/room36-final/report.json) · [Final-room replay](../../artifacts/nextgen/final26/.work/playtest/room36-merged-bank/report.json)

The final branch contains local nextgen at 12f48b02. The conflict-marker scan was clear, the production build passed, and the post-merge fork capture has empty errors and failures. Free space reported by df went from 32 GiB to 29 GiB. Worktree artifacts occupied 1.2 GiB at handoff. [Final build](../../artifacts/nextgen/room36/build-delivery.log) · [Handoff fork](../../artifacts/nextgen/room36-handoff/manifest.json)

## ROOM37 — arena sources and retreat lanes

The floor shader and the painted receiver share half-width, throw length, taper and louvre spacing per room. Freight has a long crosswise tube, Loading Bay a narrow lengthwise throw, Checkpoint a broad inspection panel, Swarm four louvre openings, and Overload a widening throw. A housing, two mounting feet and a diffuser sit at the source edge. Wall status lenses use the existing hull-cap vertex batch and each room's practical colour. The existing character rim shader supplies the cool silhouette light.

The outer service aisles carry Passenger berth sockets, Transmission cable bundles, Overload split clamp jaws and Freight rail runners. Their paint uses the existing clipping for the playable deck. Armory retains the original low carousel base and rotary bearing when the upper weapon rack cuts away. The matching kiting frame shows metal behind the Brute where final27 exposed a dark disc. Coolant's receiver absorbs spill directly below the boots. Two cool-capped raised jambs mark the protected foot position behind the reactor sill.

At 480×270 the Swarm grille shadows and Freight tube distinguish those floors. The marine's pale boot and wet metal still come close in Coolant. The squat fixture in Awakening can read as a bench, and Checkpoint's housing overlaps the machinery behind the marine.

### Staged draw calls

All twenty rooms have a selected 1920×1080 arena centre and kiting frame on each tier. The 80 selected frames have empty browser error lists. The largest High increase is one draw. Annulus High and Interlock Low needed fresh capture processes during room preparation. The successful standalone High Annulus capture took 378 seconds on the shared machine. The interrupted batches retain their failures separately.

| Room | Final27 High | ROOM37 High | ROOM36 Low¹ | ROOM37 Low |
|---|---:|---:|---:|---:|
| armory | 177 | 177 | 168 | 168 |
| awakening-bay | 137 | 137 | 125 | 125 |
| breached-loading-bay | 124 | 125 | 113 | 114 |
| communal-atrium | 131 | 132 | 122 | 121 |
| containment-annulus | 128 | 127 | 117 | 116 |
| coolant-plant | 119 | 118 | 107 | 106 |
| crew-checkpoint | 109 | 109 | 99 | 99 |
| diagnostic-gallery | 117 | 118 | 104 | 105 |
| freight-hold | 120 | 120 | 109 | 109 |
| infested-workshop | 155 | 155 | 145 | 145 |
| manual-control-chamber | 147 | 147 | 134 | 134 |
| overload-floor | 136 | 137 | 123 | 124 |
| passenger-vault | 120 | 119 | 108 | 108 |
| relay-racks | 137 | 137 | 126 | 126 |
| residential-gallery | 113 | 112 | 103 | 103 |
| safety-interlock-station | 162 | 161 | 149 | 148 |
| service-shaft-landing | 112 | 112 | 101 | 101 |
| shielding-gate | 257 | 258 | 246 | 247 |
| swarm-junction | 101 | 102 | 90 | 91 |
| transmission-chamber | 122 | 122 | 112 | 112 |

¹ The archived ROOM36 Low peaks include incident-facing. The matched High columns and current Low column take the peak of arena calm and kiting frame 1.

[High centre pairs](../../artifacts/nextgen/room37/twenty-arena-calm-high.jpg) · [High kiting pairs](../../artifacts/nextgen/room37/twenty-kiting-high.jpg) · [Low centres beside final27 High](../../artifacts/nextgen/room37/twenty-arena-calm-low.jpg) · [Low kiting beside final27 High](../../artifacts/nextgen/room37/twenty-kiting-low.jpg) · [Armory bearing](../../artifacts/nextgen/room37/armory-mount.jpg) · [Outer service aisles](../../artifacts/nextgen/room37/working-aisles.jpg) · [Refuge under Napalm](../../artifacts/nextgen/room37-details/room37-fire-overload-floor.png)

The lane captures use native movement geometry and staged enemies. The bundles remain subtle in Transmission, and some retreat positions still include part of the landmark. In the staged Napalm view the cool caps remain visible, while the fire obscures much of the rear edge of the standing spot.

### Realtime and campaign verification

Three 1920×1080 Safety Interlock High trials used the Pyro rig and ran for 15 seconds each. Frames over 20 ms were 2.30%, 3.16% and 4.11%, compared with final27’s 2.8%, 2.4% and 2.6%. Frame p95 was 18.0, 18.2 and 18.2 ms. Peak draws were 201, 210 and 204 with zero combat shader compilations. All three trials met the 5% budget. Earlier trials coincided with other campaigns and benchmarks. One stopped on insufficient sustained population, and another recorded 91.37% over 20 ms. A separate pre-change build measured 19.66% under contention. The three final trials began after the other game runners cleared. [Three-trial benchmark](../../artifacts/nextgen/room37-isolated/benchmark.json) · [Contended two-room High and Low data](../../artifacts/nextgen/room37-bench-retry/benchmark.json)

The prescribed Breacher run reached its one-hour wall limit after 15 clears with no runtime errors. Its first continuation cleared room 20 with one original-kit loading timeout. Replaying the earned room-15 reward completed all 20 with zero runtime errors and eight recorded loading defects, including inherited holds from the first 15 rooms. The runner returned 1 for those holds. [First segment](../../artifacts/nextgen/playtest/room37/report.json) · [First continuation](../../artifacts/nextgen/playtest/room37-continue/report.json) · [Zero-error continuation](../../artifacts/nextgen/playtest/room37-continue-retry/report.json)

The final uninterrupted Breacher campaign on seed 1729 cleared all 20 rooms and returned exit 0 with zero errors and zero defects. It used the same fast native runner and 180-second startup allowance, with a fresh evidence label. [Uninterrupted campaign report](../../artifacts/nextgen/playtest/room37-uninterrupted/report.json)

The production build passed. All 40 arena-centre captures recorded zero new shader programs during their presentation settles. Disk space at the start was 28 GiB free of 926 GiB (870 GiB used, 97%). At handoff it was 79 GiB free (820 GiB used, 92%). The worktree evidence occupied 1.8 GiB. The ROOM37 measurements apply to the branch based on local nextgen at 392366cd.

## ROOM37b

The arena sources now attach to bulkheads. Awakening has a jointed theatre boom with three recessed lamp wells. Residential hangs a caged sodium hood from a cable. Crew's inspection channel sits over the left scanner jamb, Freight carries its strip on a braced gantry and Loading uses a shorter jib with a hood. Swarm shows slanted vent blades and Overload a copper-flanged reactor port. Each of the twenty rooms has its own head. A baked cable or housing shadow crosses the existing pool edge even when the camera crops the head. The supports and fixtures use vertex colours and baked face shading.

Transmission's two outer aisles carry a copper feed between two grey returns. The jackets bend around their glands, with shoulder highlights interrupted at each clamp. In the matched outer-aisle frame the three conductors stay legible across the dark floor behind the marine and enemy. [480×270 comparison](../../artifacts/nextgen/room37b/transmission-aisle-480.jpg) · [Native comparison](../../artifacts/nextgen/room37b/transmission-aisle-1920.jpg)

At 480×270 the three wells and their elbow distinguish Awakening from the prior bench-like lamp. Freight's side truss and Swarm's louvers also read at that size. The small cage bars on the Residential pendant largely disappear into the hood, and the top of the Passenger and Relay fixtures is cropped in the centre views.

The production build passed. The uninterrupted native Breacher campaign on seed 1729 cleared all ten rooms and exited 0 with zero errors and zero defects. [Native campaign](../../artifacts/nextgen/playtest/room37b-final/report.json) · [Post-sync Awakening recapture](../../artifacts/nextgen/room37b-integrated/manifest.json)

All 80 final frames finished on their first capture attempt. Each tier has a 1920×1080 centre and kiting frame for every room. All 16 batch manifests have empty error and failure lists. The table reports the larger draw count of those two frames for each room. The largest High increase over final27 is one draw against an allowance of ten. Frame timing is reserved for the lead's wave-end benchmark.

[High centres at 480](../../artifacts/nextgen/room37b/twenty-arena-high-480.png) · [High centres at native size](../../artifacts/nextgen/room37b/twenty-arena-high-native.jpg) · [Low centres at 480](../../artifacts/nextgen/room37b/twenty-arena-low-480.png) · [Low centres at native size](../../artifacts/nextgen/room37b/twenty-arena-low-native.jpg) · [High kiting](../../artifacts/nextgen/room37b/twenty-kiting-high-480.png) · [Low kiting](../../artifacts/nextgen/room37b/twenty-kiting-low-480.png) · [Source manifests](../../artifacts/nextgen/room37b/selected-manifests.json)

| Room | final27 High | ROOM37 High | ROOM37b High | ROOM37 Low | ROOM37b Low |
|---|---:|---:|---:|---:|---:|
| awakening-bay | 137 | 137 | 137 | 125 | 125 |
| passenger-vault | 120 | 119 | 120 | 108 | 108 |
| residential-gallery | 113 | 112 | 113 | 103 | 103 |
| communal-atrium | 131 | 132 | 132 | 121 | 122 |
| crew-checkpoint | 109 | 109 | 110 | 99 | 100 |
| armory | 177 | 177 | 177 | 168 | 168 |
| freight-hold | 120 | 120 | 121 | 109 | 110 |
| breached-loading-bay | 124 | 125 | 121 | 114 | 110 |
| relay-racks | 137 | 137 | 137 | 126 | 126 |
| transmission-chamber | 122 | 122 | 122 | 112 | 112 |
| diagnostic-gallery | 117 | 118 | 117 | 105 | 104 |
| safety-interlock-station | 162 | 161 | 162 | 148 | 149 |
| coolant-plant | 119 | 118 | 119 | 106 | 107 |
| service-shaft-landing | 112 | 112 | 112 | 101 | 101 |
| infested-workshop | 155 | 155 | 155 | 145 | 145 |
| swarm-junction | 101 | 102 | 102 | 91 | 91 |
| shielding-gate | 257 | 258 | 258 | 247 | 247 |
| containment-annulus | 128 | 127 | 128 | 116 | 117 |
| manual-control-chamber | 147 | 147 | 147 | 134 | 134 |
| overload-floor | 136 | 137 | 137 | 124 | 124 |

The local nextgen sync at 7250ab0e was already up to date. The source conflict-marker scan was clean, the production build passed and the post-sync Awakening capture had empty error and failure lists. At start the 926 GiB volume showed 821 GiB used, 78 GiB available and 92% capacity. At handoff it showed 820 GiB used, 77 GiB available and 92% capacity. Worktree evidence occupied 2.2 GiB.
