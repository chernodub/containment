# INC13 · Signature room incidents

The twenty story rooms now show a specific interruption at the point where the player enters or fights. Five rooms received original Blender set pieces. The other fifteen reuse their authored landmarks, with room-specific damaged or displaced pieces, a continuous floor mark and a practical light at the source. All new deck marks are walkable. The implementation adds no colliders.

## Five signature rooms

| Room | Incident and floor evidence | Blender triangles |
|---|---|---:|
| Awakening Bay | Four breached cryo berths discharge into a reflective sheet. Loose lines, a tipped trolley and wet tracks lead out of the bank. Overlapping vapour sheets move independently of the player. | 7,076 |
| Residential Gallery | Baggage and rumpled bedding lead to the broken barricade. A meal and a set of children's drawings place a family at the end of the trail. | 2,128 |
| Coolant Plant | Two torn pipe lips feed an opaque fractured ice sheet. Raised ice, icicles, fallen cordon and frost on the adjacent pump locate the source of the leak. | 4,984 |
| Infested Workshop | The split extractor opens over a machine bed wrapped in brood membrane. Violet light, exposed spindle ribs and long resin deposits connect it to the approach. | 5,082 |
| Manual Control Chamber | A bent dais and jammed lever sit at the narrow end of a soot fan. Conduit flashes beside the seat torn out of its mount, leaving a shadow on the deck. | 2,830 |

The triangle counts cover the exported hero geometry. Each pack has a generating script, a bake manifest, vertex AO and a shared tangent-normal atlas. The floor paint, vapour and lamp effects are separate runtime geometry. The practicals use the existing room value profiles.

The first-round sheets understated the incidents. The lead correction widened the fluid, ice, resin, bedding and soot silhouettes and moved them into the approach. The five final capture sets include spawn, an incident-facing position, five tour positions and a staged fight. The native frames and 480×270 reductions are in the gallery. Recognition and area were judged visually. There was no timed stranger study or pixel-area measurement. [Iteration notes](plans/INC13-review.md)

## Twenty-room review

The calm sheets show the largest change in Coolant and Awakening, where the floor now points back to the source before the marine reaches it. In the combat sheets, several sources leave the close camera while part of their trail remains visible. Workshop is still the weakest of the five. Its blistered membrane reads across the floor, but the outer resin strands still suggest cables at 480×270. Manual Control's hanging authorization sign crosses part of the blast shadow at spawn. The first Shielding Gate and Containment Annulus sheets looked too orderly. A fallen shield leaf and a crescent of spalled deck replace that regularity in the last revision. Shielding Gate remains the weakest shorter pass, with much of its damage at the upper edge of the frame. Freight's slipped load also leaves the camera in the tested fight position. The family pictures in Residential and shoes in Passenger Vault need the native frame to resolve individually.

| Room | Source and trail |
|---|---|
| Passenger Vault | An opened Voss drawer, a pair of adult and child shoes, and the embroidered wrap pulled out into the aisle. |
| Communal Atrium | An interrupted table setting, with cloth, broken dishes and crumbs swept around the planter. |
| Crew Checkpoint | A baggage load driven into a bent barrier, with skid marks back to the queue. |
| Armory | A weapon-sized gap in the issue tray, loose fittings and a dragged liner at the counter. |
| Freight Hold | Slipped sling, displaced cargo and torn wrapping down the skid path. |
| Breached Loading Bay | A peeled metal lip exposes hull ribs. Splinters and scoring continue along the deck. |
| Relay Racks | A pulled loom uncoils across the aisle from the rack. |
| Transmission Chamber | Loose message stock runs from the printer past the abandoned operator's seat toward the uplink. |
| Diagnostic Gallery | A ruptured restraint cradle spills fluid beneath the probe. |
| Safety Interlock | The jammed bolts and last weld sit above a pitted welding blanket. |
| Service Shaft Landing | A torn lift comb feeds a frayed cable into the approach. |
| Swarm Junction | Split louvers are caught in the same perforated membrane as the nest. |
| Shielding Gate | One shield leaf lies across the tracks swept by its failed carriage. |
| Containment Annulus | Peeled pressure clamps border a fractured crescent of concrete and separated flakes. |
| Overload Floor | Buckled deck plates expose a venting plasma seam, with two emergency repeaters beside the break. |

The original baseline is ae3a9624. Its Awakening combat capture was reconstructed from that revision. The baseline Manual tour stopped at a HUD warning-quad guard on the second combat burst frame. The first frame is valid and is used for the twenty-room comparison. The final Manual capture passed at the revised incident-facing position.

The local gallery includes both versions of the calm and combat sheets, the signature comparison, individual room captures and an HTML benchmark table. Each room's manifest includes its native frames and preparation evidence. [Gallery](../../artifacts/nextgen/inc13-final/index.html) · [Per-room metrics](../../artifacts/nextgen/inc13-final/room-metrics.json)

## Draw-call diagnosis

Freight Hold's first fight capture submitted 429 draws. An instrumented refresh attributed 156, 133 and 41 submissions to three cargo obstacles alone. The baseline live Cryo trial reached 589 draws in Freight and 1,801 in Transmission. Both rooms build repeated crate or rack fittings from shared materials. After another room installs the current graphic-surface hook on those materials, the rigid room batcher no longer recognises their hook version.

Freight and Transmission now give their repeated equipment room-owned stock finishes before normal preparation. The existing room batcher merges them and retains the original collision partitions. Freight's staged fight fell to 104 draws and Transmission's to 112. Both kept their authored crate and rack geometry.

## Verification

All twenty final High/Cryo trials stayed within 330 draws. Safety Interlock reached 325. The twenty trials recorded zero mid-combat program creations, GL errors or context losses. Current room preparation ranged from 562 ms in Coolant Plant to 2,305 ms in Containment Annulus. Freight and Transmission both submitted more triangles after consolidation while making substantially fewer calls.

Values below run from the original revision to the final art build `ac0d234e`. Fight draws are the first staged 20-contact capture, which can have 19 survivors at capture time. Benchmark draws and triangles are maxima from one ten-second live 25-enemy Cryo/High trial per room and revision. Preparation is the last matching room preparation record in that trial. Population, effects and host load vary. The 15.5-second Manual baseline preparation is an outlier. These single runs measure budgets and do not establish a stable frame rate.

| Room | Fight draws | Benchmark draws | Benchmark triangles | Preparation ms | Combat compiles |
|---|---:|---:|---:|---:|---:|
| awakening-bay | 137 → 131 | 174 → 167 | 753,847 → 741,659 | 1,929 → 1,744 | 0 → 0 |
| passenger-vault | 104 → 106 | 133 → 137 | 529,485 → 530,225 | 1,239 → 1,251 | 0 → 0 |
| residential-gallery | 92 → 97 | 127 → 132 | 497,127 → 477,913 | 611 → 624 | 0 → 0 |
| communal-atrium | 129 → 131 | 154 → 158 | 473,292 → 492,399 | 987 → 965 | 0 → 0 |
| crew-checkpoint | 103 → 105 | 134 → 134 | 499,658 → 498,092 | 639 → 658 | 0 → 0 |
| armory | 116 → 117 | 235 → 242 | 459,974 → 493,482 | 937 → 955 | 0 → 0 |
| freight-hold | 428 → 104 | 589 → 135 | 507,825 → 514,479 | 831 → 779 | 0 → 0 |
| breached-loading-bay | 110 → 112 | 143 → 147 | 524,756 → 528,767 | 1,057 → 1,056 | 0 → 0 |
| relay-racks | 119 → 121 | 143 → 143 | 502,748 → 489,136 | 667 → 690 | 0 → 0 |
| transmission-chamber | 268 → 112 | 1,801 → 140 | 517,664 → 563,164 | 1,310 → 1,127 | 0 → 0 |
| diagnostic-gallery | 100 → 102 | 136 → 133 | 532,214 → 515,460 | 703 → 710 | 0 → 0 |
| safety-interlock-station | 177 → 178 | 286 → 325 | 549,597 → 505,929 | 1,152 → 1,186 | 0 → 0 |
| coolant-plant | 105 → 112 | 132 → 141 | 437,592 → 475,079 | 552 → 562 | 0 → 0 |
| service-shaft-landing | 98 → 99 | 142 → 139 | 497,342 → 489,564 | 677 → 687 | 0 → 0 |
| infested-workshop | 129 → 136 | 198 → 207 | 485,964 → 515,131 | 816 → 849 | 0 → 0 |
| swarm-junction | 87 → 89 | 116 → 118 | 509,895 → 488,037 | 692 → 678 | 0 → 0 |
| shielding-gate | 208 → 210 | 185 → 192 | 477,755 → 501,125 | 1,316 → 1,275 | 0 → 0 |
| containment-annulus | 114 → 116 | 143 → 145 | 639,926 → 644,076 | 2,408 → 2,305 | 0 → 0 |
| manual-control-chamber | 136 → 137 | 219 → 212 | 506,340 → 517,731 | 15,514 → 858 | 0 → 0 |
| overload-floor | 107 → 113 | 141 → 150 | 555,362 → 544,272 | 1,228 → 1,238 | 0 → 0 |

The final gallery contains 70 accepted 1920×1080 frames, including 40 in the five signature rooms. No final capture command reported a browser error. A prior Shielding capture hit the kit preparation timeout during a period of high shared-host load. The later capture passed. The initial install and production build passed with `npm ci && npm run build`.

### Campaign

The default competent bot died in Relay Racks after eight clears in two runs on the final art revision. Both recorded zero errors and zero navigation defects. An earlier art revision reached room eleven before Playwright timed out taking an entry screenshot. The follow-up runs allowed 180 seconds for browser evidence operations. This was a process-local change to the Playwright timeout. The bot used native controls and normal incoming damage.

The unassisted **expert-input Story campaign** completed all twenty rooms with Cryo on seed 1729 in 2,270.1 wall seconds. Every tick was rendered. The runner recorded zero errors, zero defects and zero stuck rooms. Only the bot's input profile differed from the default gameplay command. The report identifies the tested art revision as `ac0d234e42bc06ecda60572916e05ac396788c22`. [Campaign gallery](../../artifacts/nextgen/inc13-final/campaign/index.html) · [Native campaign report](../../artifacts/nextgen/inc13-final/campaign/report.json) · [Earlier run receipts](../../artifacts/nextgen/inc13-final/diagnostics/campaign-retries/)

The final production rebuild passed. Its JavaScript and CSS hashes matched the distribution played by the successful campaign.
