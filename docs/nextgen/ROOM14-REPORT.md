# ROOM14 incident recomposition

Twenty desktop story rooms, from Awakening Bay to Overload Floor. The source baseline was `d4a9207b`. The matched views use the original incident inspection marks and the native campaign camera.

## Room readings

| Room | Before | Trail before | After |
|---|---|---|---|
| Awakening Bay | Someone left an open berth on wet feet. | Yes, fluid and prints | The bank has one open recovery berth and wet footprints leave the empty slot. |
| Passenger Vault | A striped blanket winds away from an open locker beneath identical pod lids. | Yes | Someone left a small boot and coat in the open effects drawer of a sealed sleeper, beside a fallen queue barrier. |
| Residential Gallery | Cases sit along a curling runner while the broken cabin door is cropped. | Yes | The last cabin was emptied in a hurry, leaving cases, a toppled chair and family drawings on the damaged door. |
| Communal Atrium | A cloth extends from overturned furniture beneath the planter. | Yes | A roof cassette buckled a bench beside the planter and scattered the table settings. |
| Crew Checkpoint | Long wheel marks reach a jammed conveyor. | Trail, dark | Baggage caught the folding inspection leaves and jammed the conveyor. |
| Armory | A strip of issue foam points to loose arms beside the counter. | Yes | Someone emptied the issue tray and left the armory counter open. |
| Freight Hold | A spill-shaped stripe points at a small stack of dislodged cargo. | Yes | A shifted freight stack has lost its chock and struck the deck on one corner. |
| Breached Loading Bay | Parallel scratches lead away from peeled hull plates. | Yes | An impact peeled hull plating back over the exposed transverse ribs. |
| Relay Racks | A neatly tied loom forms a loop beside live cabinets. | Yes | A relay blade cage has been hauled out on its runners with several cards still projecting. |
| Transmission Chamber | A recorder has fed a long paper strip across the floor. | Yes | The operator left the recorder holding its last transmission beside a fallen chair. |
| Diagnostic Gallery | An opened restraint cradle has spilled a broad tongue of fluid. | Yes | The restraint cradle was forced open and a twisted gurney came to rest beside the glazing. |
| Safety Interlock Station | A welding blanket lies beneath the jammed lock. | Yes | The damaged interlock remains dogged shut beneath a fallen ceiling cassette. |
| Coolant Plant | A ruptured header has frozen the approach. | Yes | A ruptured coolant header froze the floor in front of the pump. |
| Service Shaft Landing | Loose hoist lines spill out from the damaged landing. | Yes | A torn landing comb and a suspended cage mark the failed hoist. |
| Infested Workshop | A long sheet of veined tissue extends from the broken duct. | Yes | Living tissue has grown through a workshop duct and onto its service bed. |
| Swarm Junction | Lilac pods dot the deck around a lumpy casing and web. | Yes | Growth has pried the plenum open and displaced the pipe bundle along the wall. |
| Shielding Gate | Scratches record the sweep of jammed gate leaves. | Two swept arcs | A jammed carriage left the shielding leaves partly closed. |
| Containment Annulus | A loaded retaining ring has fractured the floor. | No | A retaining band gave way and the loaded ring fractured the surrounding deck. |
| Manual Control Chamber | A soot fan from the damaged dais runs under a gantry. | Trail, dark | The master station burned through its supply and someone cabled a portable bypass to the surviving bus. |
| Overload Floor | Deck plates have parted beside a reactor emitting a narrow flare. | No | The reactor split the surrounding deck and now vents through the exposed plates. |

## Kit and placement

The original MIT Blender kit contains a sealed sleeper with an open effects drawer, a toppled divider, crushed bench, dropped ceiling panel with suspension cables, shifted freight stack, extracted relay sled, split plenum, field bypass, damaged gurney and fractured glazing. The pack has 4,616 high-detail triangles across its ten assemblies. Run the following from the repository root with KTX-Software's `toktx` on PATH or set `TOKTX` to its executable.

```sh
blender -b --factory-startup -t 4 --python-exit-code 1 -P tools/assets/room14-incidents/kit.py
node tools/assets/room14-incidents/pack.mjs
```

Add a tuple to `src/render/world/Room14Debris.ts` giving the Blender root name, room x and z in native units, yaw in radians, uniform scale and optional height in metres. The loader borrows the pack during room preparation, merges finishes, registers cutaway ranges and hands the completed branch to the existing warmup owner. Geometry carries vertex AO, bevels, geometric normals and one baked tangent normal atlas. The static packer uses meshoptimizer, index-only LODs and T12's UASTC normal-map settings. The named I11/T12 CLI scripts assume specific actor assets and, for LODs, skin weights. The kit uses a scoped static adaptation of those steps. The PNG-atlas fallback lives under `public/assets/room14/plain/`. The runtime picks it when compressed texture support is unavailable.

Floor marks use a Standard material and tangent normals derived from the deposited mark. Fluid, ice and resin have a smoother finish than scorch, skid and drag marks. Marks occupy a room-owned transparent plane at 20–21 mm. Each mid-floor receives an assembly with a metal bed, side sections and separate slats, rails or removable covers. The shallow inserts sit inside the clear arena disc. Existing E10 deep service openings still supply below-floor pipework where authored.

The work lights follow the existing room landmark coordinates and reuse the High preset's reserved practical slot. Low retains the visible diffuser. The shaft front truss and checkpoint feet have local cool returns. Cutaway projections share pickup and native warning positions between the gantry and original interior owners. Hull caps facing the camera and the new debris have individual cutaway ranges.

## Visual review

The native and 480×270 evidence is under `artifacts/nextgen/room14/`. The initial G6 run captured one guarded Diagnostic Gallery frame before a later frame crossed the HUD. Manual Control failed the full-warning HUD guard in G6 and G2. Its before/after kiting comparison uses the DRESS13 scenario on both sides.

In round one the new sleeper and plenum were mostly cropped by the top edge. The Manual Control assembly also exposed a mesh merge failure where compressed normals and legacy normals met in the screen finish. Round two moved the sleeper to the south bank, pulled the split casing toward the front of its duct and isolated the packed finish. All three incident-facing views then loaded without console errors.

Round two still showed the drawer overlapping the next sleeper, little separation between pipes and growth, and a bypass nearly cut off at the top. The final pass turned the drawer out toward the end of the row, connected the plenum to its wall with tensioned tissue, and shifted the control face and bypass forward.

The final berth inspection caught a second obstruction where the raised drawer met the near pod row. The drawer now projects into the gap behind the row, and the dropped case occupies its left shoulder. The Workshop resin also contracts around the broken duct foot. A separate calm entrance frame shows the Manual Control operator's station and portable bypass across the approach. The final heavy and kiting captures retained their native firing and visibility checks.

## Remaining weaknesses

- **Passenger Vault.** The individual lit sleeper is visible from the inspection mark. The neighboring lids hide part of the drawer from this angle, and the boot and coat need a closer look to resolve.
- **Swarm Junction.** The split case and bent bundle are legible at native size. The upper edge of the inspection view crops the crown, and the tissue can read as bundled conduit at 480 pixels.
- **Manual Control and Diagnostic Gallery.** The overhead structures still divide the composition when they clear the actors. From the Manual entrance the station is visible to the right of the gantry, but the torn panel is much easier to identify at native size.
- **Freight Hold and Relay Racks.** The shifted load has real height, though its forward face could use a clearer impact corner. The extracted sled reads best from the side. The middle of the Relay approach is still quiet.
- **Coolant Plant and Awakening Bay.** These retain the two broad pale spill silhouettes. The moving reflection is visible in the berth fluid. Coolant's strongest white patch still reduces local actor contrast.
- **Heavy encounters.** The native warnings and marine remain distinct in the five sampled frames. Some dark hostiles overlap each other, especially in Atrium and Freight. A still frame cannot certify every actor or every warning over the encounter.

The original assets use the repository MIT license. No third-party asset or runtime dependency was added.

## Measured budgets

Production WebGL2, Apple M1 Pro via ANGLE Metal, High preset, Breacher, one 20-second real-time trial per room. Draws are the maximum reported in the trial. Preparation is the last completed preparation record for that room. Frame p95 is the measured RAF interval. Targets were 330 draws, 20 ms p95, 3,000 ms preparation and zero mid-combat programs.

| Room | Max draws | High p95 (ms) | Preparation (ms) | Combat compiles | Missed targets |
|---|---:|---:|---:|---:|---|
| awakening-bay | 169 | 108.6 | 1681 | 0 | frame |
| passenger-vault | 139 | 166.1 | 1322 | 0 | frame |
| residential-gallery | 141 | 116.6 | 645 | 0 | frame |
| communal-atrium | 159 | 133.1 | 1092 | 0 | frame |
| crew-checkpoint | 139 | 83.7 | 578 | 0 | frame |
| armory | 193 | 158.9 | 785 | 0 | frame |
| freight-hold | 134 | 141.7 | 972 | 0 | frame |
| breached-loading-bay | 145 | 108.4 | 1018 | 0 | frame |
| relay-racks | 161 | 109.2 | 803 | 0 | frame |
| transmission-chamber | 136 | 125.2 | 1138 | 0 | frame |
| diagnostic-gallery | 145 | 148.8 | 814 | 0 | frame |
| safety-interlock-station | 330 | 108.7 | 1308 | 0 | frame |
| coolant-plant | 137 | 118.0 | 593 | 0 | frame |
| service-shaft-landing | 141 | 91.5 | 692 | 0 | frame |
| infested-workshop | 214 | 74.9 | 759 | 0 | frame |
| swarm-junction | 120 | 100.3 | 615 | 0 | frame |
| shielding-gate | 192 | 124.5 | 1486 | 0 | frame |
| containment-annulus | 156 | 150.9 | 1491 | 0 | frame |
| manual-control-chamber | 214 | 76.3 | 943 | 0 | frame |
| overload-floor | 147 | 101.3 | 1086 | 0 | frame |

The recorded one-minute host load ranged from 11.9 to 963.8 on 10 logical cores. These timings establish what happened on this shared host. They do not isolate the GPU cost of the new art. Raw trial data is in `artifacts/nextgen/room14-bench/benchmark.json`.

## Desktop campaign

The production build passed TypeScript and Vite. The native, unassisted Breacher campaign on seed 1729 cleared eight rooms and exited successfully with zero errors. Its longest wall-clock loading hold was 3.050 seconds in passenger-vault. This exceeded three seconds even though that room's renderer preparation in the separate benchmark trial was below target. The campaign receipt is in `artifacts/nextgen/playtest/breacher-1729/report.json`.

The local comparison gallery opens at `artifacts/nextgen/room14/index.html`. It links 40 baseline and 45 revised native frames from their 480×270 counterparts. The five heavy encounters are after-only. Original capture manifests remain in the sibling `room14-before*`, `room14-after`, `room14-corrections` and `room14-berth` directories.
