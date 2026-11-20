# FRAME16 · Deck surfaces and incident framing

The comparison starts at `4d200481`. The same gameplay and bot revisions drive both simulation cohorts. The visual reference is the lead's final9 gallery, which combines images from `84dc049c` and `d89ed056`. Camera framing and HUD layout use the shipping game.

## Deck and materials

The base deck albedo is multiplied by 0.83 before room lighting. This is a material adjustment. Individual screenshot pixels also contain direct light, reflections and postprocessing. A single 16 mm-high relief sheet per room carries contact shadows from the hull, obstacle edges and furniture, plus abrasion on the route from the entrance to the arena. Empty sections are trimmed from the sheet. Checkpoint and Armory gain inspection lids, Residential gains inset domestic panels, Relay and Transmission gain service cable bends, and Annulus gains interrupted circular seams. The existing pooled diffusers nearest the arena separate a warm work area from a cooler equipment area.

In Freight, the lowest crate folds inward and down onto a dark steel pallet. A cooler worklight separates the load from the warm traffic deck and catches a taut strap above three loose cargo blocks. Passenger has warmer leather and light plush ears. Swarm's tension roots have a roughness of 0.23. Brighter plate edges and uneven vein values separate the casing from the tissue. The Manual record hangs beside the damaged instrument bridge. Residential has boots at the cabin, Diagnostic has an interrupted meal, and Annulus has a rail with three hanging name tags.

## Five approach incidents

| Room | Solid in native ship units (x, y, width, depth) | Physical change |
|---|---|---|
| Breached Loading Bay | 547, 451, 31, 56 | A folded twin rib projects from the broken apron. Its mounting follows the long scar. |
| Shielding Gate | 377, 330, 61, 56 | The ejected leaf lies across the failed carriage. A folded edge and broken rail expose its thickness. After the first cohort, its span was reduced to fit the original carriage solid. |
| Overload Floor | 447, 372, 38, 38 | A shroud plate with three ribs buckles away from the reactor. A pale inspection lamp picks out its lip. |
| Transmission Chamber | Existing paired solids at 832, 453, 34, 45 and 838, 453, 72, 33 | The antenna boom spans the receiver cover. Its raised crossbars clear the desk. Moving the solid farther into the arena consumed the required clearance. |
| Service Shaft Landing | 330, 418, 33, 85 | A collapsed hoist cage rests inside the expanded edge solid, with a sprung lifting eye and broken wire. |

The placement tool counted 206 raised parts, 139 flush surfaces and zero overlaps with walkable space. All 101 role-specific targets retained their routes. All 61 sampled Warden bait rays retained their lengths, and the minimum sampled lane width stayed unchanged in each room. The six largest-body exceptions inherited from the baseline are recorded in the table. [Per-room reachability](../../artifacts/nextgen/frame16/reachability.txt)

## Visual revisions

The first arena captures showed the shaft at the lower edge, the reactor shroud disappearing against the reactor, and both the gate and transmitter reading chiefly as banks of equipment. I moved the worklights onto the displaced members. I also shortened the loading-bay solid's projection and moved the reactor plate back to retain their approach widths.

In the second incident-facing captures, the bay break and marine shared the frame. The gate leaf still resembled a drawer, the antenna lay against its desk, and the cage blended into the shaft structure. I folded the leaf into a tapered face, raised the mast and its crossbars, and brought the cage toward its broken wire and inspection lamp. The shroud gained a raised, dark return edge, and the bay rib gained an exposed flange.

A further HUD review used the production camera matrices in the spawn and centre captures. I raised the Vault lamp onto the locker bank, lowered the Cryo and Checkpoint lamps out of the HUD corners, and lit the crushed side of the Freight pallet. In Manual the first board position triggered its actor cutaway at the incident mark. I moved the board north along the gantry. At native resolution the original meal looked like a box and the Annulus retaining bands hid the tags. I gave the mug a handle and dark coffee surface, crossed the boot laces, and laid punched tags on a plate above the bands. The final Freight native crop preserves the baked bevel normals on the crushed container.

The first native Breacher run cleared ten rooms. Its browser then remained on the same tick for ten minutes in Diagnostic Gallery. I closed that browser and retained its interrupted report separately from the retry.

In the final Manual frames the selected board has opacity 0.96 at entry and at the incident mark. It fades to 0.04 in the staged kiting and heavy compositions to clear actors. The three human traces remain small environmental details. At native size the crossed laces, coffee surface and stamped tags are visible. At 480 pixels their groups and placement carry more of the story than the individual details. [Native detail crops](../../artifacts/nextgen/frame16/revisions/native-details.jpg)

## Room review

The table uses the greyscale and colour sheets at 480 × 270. Floor Y is the median 8-bit Rec.709 code value of the visible sampled floor pixels in the native spawn frame. The two position columns locate the physical landmark lamp in the native image. A large structure can extend beyond a panel even when its lamp is clear.

| Room | What changed | Remaining weakness | Floor Y | Lamp at spawn | Lamp while kiting |
|---|---|---|---:|---|---|
| awakening-bay | The berth lamp sits lower at the deck fitting to rake the runout. | The pale spill can still rival a small attacker. | 49.5 | upper field | upper field |
| passenger-vault | Pale ears separate the rabbit from its leather case under the raised locker light. | The suitcase remains low in the entrance crop. | 46.7 | upper field | upper field |
| residential-gallery | Three laced boots sit beside the damaged cabinet above inset domestic floor panels. | The cabinet still reads before the boots. | 40.6 | upper field | upper field |
| communal-atrium | Contact shading separates the crushed bench and roof cassette from the garden deck. | Leaves and bent framing still merge in greyscale. | 43.7 | upper field | upper field |
| crew-checkpoint | Inspection lids cross the apron and the lowered scanner lamp clears the objective card. | The barrier is almost edge-on in the incident view. | 58.2 | upper field | upper field |
| armory | Inset access lids break up the inspection floor. The magazine practical rises above the counter. | The curved outer counter dominates the exposed weapons. | 39.9 | upper field | upper field |
| freight-hold | A crushed corner lands on a dark steel pallet beside displaced cargo. A low practical catches the torn strap. | The top crate remains broad and clean. The centre view loses much of the stack. | 42.3 | upper field | HUD corner |
| breached-loading-bay | Twin bent ribs connect the rupture to the apron in front of the marine. | The full torn hull extends beyond the upper edge. | 34.6 | upper field | upper field |
| relay-racks | A cable elbow crosses the approach under the extracted rack. | The ends of the damaged cables lose contrast against the bank. | 46.5 | upper field | upper field |
| transmission-chamber | The broken antenna mast crosses its receiver, with raised crossbars at the shared solid. | The boundary arc still competes with the equipment. | 38.0 | upper field | upper field |
| diagnostic-gallery | A sandwich and handled mug sit on a clinical tray beside the gurney. | The gantry crosses the apparatus, and the food needs a second look at fighting distance. | 30.7 | upper field | upper field |
| safety-interlock-station | The detector cabinet and fallen cassette ground the hanging warning through softer edge shadows. | The overhead board still resembles Diagnostic's. | 49.7 | upper field | upper field |
| coolant-plant | The practical sits lower beside the frozen line and the darker deck contains its pool. | The ice specular is still brighter than the marine in some views. | 52.2 | upper field | upper field |
| service-shaft-landing | A damaged cage hangs from a broken lifting eye beside the shaft machinery. | The arena is north of the shaft. Its low cage is the weakest centre composition. | 60.4 | upper field | low |
| infested-workshop | Contact shadows deepen the space between the infected machine and its flat wallward growth. | The entrance still crops the machine. | 14.9 | upper field | upper field |
| swarm-junction | The plenum's wet roots carry narrower highlights against pale folded plate edges. | The outermost tendrils flatten into one tone at 480 pixels. | 26.5 | upper field | upper field |
| shielding-gate | A tapered leaf with a broken rail sits in front of the gate carriage. | The approach reads more clearly than the full gate at arena distance. | 35.0 | upper field | upper field |
| containment-annulus | Interrupted annular joints meet the fracture. Three punched service tags rest on the outer clamp. | The full ring still extends beyond the entry frame. | 68.2 | upper field | upper field |
| manual-control-chamber | The board shares the operator's approach with the damaged screens and bypass. | The suspended gantry is still the longest horizontal line in the room. | 41.4 | upper field | upper field |
| overload-floor | A folded shroud and pale inspection light break away from the reactor base. | The reactor itself remains peripheral in the entrance view. | 64.2 | upper field | upper field |

[Colour incident sheet](../../artifacts/nextgen/frame16/incident-facing.jpg) · [Greyscale incident sheet](../../artifacts/nextgen/frame16/incident-facing-grey.jpg) · [Arena kiting](../../artifacts/nextgen/frame16/incident-kiting.jpg) · [Heavy combat](../../artifacts/nextgen/frame16/combat-heavy.jpg) · [Before and after pairs](../../artifacts/nextgen/frame16/pairs/)

With the solids and arena centres fixed, Freight’s stack reaches the health-panel corner while kiting. The Service Shaft cage sits well south of the fight. Moving its single worklight high enough for the arena pushes the top of the mast outside the incident-facing crop. A camera or layout change would be needed to show those complete structures from both marks. The coolant leak remains the clearest exception to actor-first value hierarchy.

## Combat budgets

The High Arc inventory stages 25 legal enemies in each room, uses all four native abilities, and counts draws and actual WebGL program creation. Preparation is the public room-entry hold in the separate sequential room benchmark. Host load is the one-minute value at entry.

| Room | Peak draws | Peak triangles | Combat compiles | Preparation (s) | Repeat (s) | Host load, first / repeat |
|---|---:|---:|---:|---:|---:|---:|
| awakening-bay | 172 | 704,761 | 0 | 2.30 | 2.13 | 37.8 / 589.8 |
| passenger-vault | 150 | 501,672 | 0 | 1.55 | 1.61 | 200.7 / 589.8 |
| residential-gallery | 132 | 461,466 | 0 | 0.98 | 1.54 | 200.7 / 589.8 |
| communal-atrium | 168 | 454,706 | 0 | 1.40 | 1.40 | 200.7 / 673.9 |
| crew-checkpoint | 143 | 465,649 | 0 | 1.09 | 1.13 | 349.4 / 673.9 |
| armory | 197 | 457,871 | 0 | 1.22 | 1.29 | 349.4 / 673.9 |
| freight-hold | 148 | 475,899 | 0 | 1.19 | 1.11 | 349.4 / 750.9 |
| breached-loading-bay | 155 | 488,620 | 0 | 1.41 | 1.55 | 349.4 / 750.9 |
| relay-racks | 156 | 471,877 | 0 | 1.07 | 1.44 | 486.8 / 750.9 |
| transmission-chamber | 143 | 524,227 | 0 | 1.57 | 2.03 | 486.8 / 825.5 |
| diagnostic-gallery | 137 | 481,770 | 0 | 1.15 | 1.35 | 486.8 / 825.5 |
| safety-interlock-station | 283 | 502,744 | 0 | 1.70 | 1.58 | 486.8 / 825.5 |
| coolant-plant | 147 | 462,037 | 0 | 1.13 | 1.65 | 611.0 / 892.5 |
| service-shaft-landing | 155 | 474,789 | 0 | 1.44 | 1.47 | 611.0 / 892.5 |
| infested-workshop | 172 | 482,177 | 0 | 1.17 | 1.13 | 611.0 / 892.5 |
| swarm-junction | 131 | 438,266 | 0 | 1.07 | 1.21 | 727.0 / 953.3 |
| shielding-gate | 205 | 473,719 | 0 | 1.72 | 1.68 | 727.0 / 953.3 |
| containment-annulus | 162 | 571,453 | 0 | 1.62 | 1.60 | 727.0 / 953.3 |
| manual-control-chamber | 170 | 455,032 | 0 | 1.97 | 2.33 | 833.3 / 953.3 |
| overload-floor | 152 | 490,446 | 0 | 4.34 | 2.60 | 833.3 / 1007.7 |

1 of twenty measured preparation holds exceeded 3 seconds. The slowest was overload-floor. The repeat exceeded 3 seconds in zero rooms. The initial Overload hold spent 3.21 seconds in reflection preparation and 17 ms in incident dressing. After the final Freight material correction, a separate High Arc run peaked at 157 draws, 504,491 triangles and nine active lights, with zero combat program creations. The per-room budget observations include the host load at the time of measurement. [Budget receipts](../../artifacts/nextgen/frame16/budgets.json)

## Balance and campaign

| Mode | Rig | Before completions / runs | After completions / runs | Change |
|---|---|---:|---:|---:|
| standard | breacher | 10/10 | 10/10 | +0 |
| standard | cryo | 6/10 | 8/10 | +2 |
| standard | pyro | 9/10 | 10/10 | +1 |
| standard | arc | 8/10 | 10/10 | +2 |
| story | breacher | 9/10 | 9/10 | +0 |
| story | cryo | 6/10 | 5/10 | -1 |
| story | pyro | 6/10 | 8/10 | +2 |
| story | arc | 9/10 | 9/10 | +0 |

| Room with a death | Standard before → after | Story before → after |
|---|---:|---:|
| breached-loading-bay | 0 → 0 | 1 → 1 |
| containment-annulus | 0 → 0 | 1 → 1 |
| diagnostic-gallery | 2 → 0 | 1 → 1 |
| infested-workshop | 0 → 0 | 1 → 0 |
| manual-control-chamber | 2 → 0 | 4 → 2 |
| relay-racks | 0 → 1 | 0 → 0 |
| safety-interlock-station | 1 → 0 | 0 → 0 |
| shielding-gate | 1 → 0 | 1 → 2 |
| transmission-chamber | 1 → 1 | 1 → 2 |

Every rig stayed within two completions of baseline. The largest room-level death increase was one. The first Story Pyro comparison was 6 → 9. The final comparison uses the narrower gate leaf. The cohorts use ten seeds per rig and difficulty, Story novice and Standard competent. [Per-seed outcomes and source hashes](../../artifacts/nextgen/frame16/balance.json)

The first completed native run used Standard Breacher, seed 1729, with a twenty-room target. It cleared nine rooms and died in Transmission Chamber with zero errors and zero recorded defects. The runner exits with status 1 on a gameplay death when a room target is supplied.

The final native Breacher run on seed 1729 ended **complete** with 20 rooms cleared, 0 errors and 0 recorded defects. [Native campaign receipt](../../artifacts/nextgen/frame16/campaign.json)

Native campaign room-entry waits also exceeded three seconds in passenger-vault (4.62 s), transmission-chamber (3.03 s), manual-control-chamber (3.77 s). These wall-clock waits are additional to the sequential benchmark above.
