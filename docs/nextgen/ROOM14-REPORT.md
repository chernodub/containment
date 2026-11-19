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

## Second pass on the merged ROOM14, HERO14 and ONB14 build

The revised scenes use the same incident-facing standing marks as the first pass. The gallery includes the native centre-kiting encounter, a separate heavy encounter and the Manual entrance at the actual spawn. Each thumbnail is a 480×270 reduction of its 1920×1080 frame. Manual uses the centre-start DRESS13 kiting fixture. [Second-pass gallery](../../artifacts/nextgen/room14b/index.html)

| Room | What happened | What the camera shows |
|---|---|---|
| Swarm Junction | A living root split the ventilation casing, forced the metal apart and ran under three neighboring plates. | The wet branches reuse the Workshop membrane painter. Where the plenum opens, raised magenta muscle and pulsing vein ridges cross the steel. Only the normal-mapped membrane extends toward the arena. |
| Manual Control Chamber | An operator opened a dead switch bay and cabled the surviving desk into a portable bypass. | Two blue-green monitors, a dead monitor and an open bus bay share one switch shelf. The floor loom terminates at the portable unit. The warning gantry includes the console in its projected cutaway bounds. |
| Passenger Vault | Someone left an open case, a sleeve and a toy rabbit beside the last sealed sleeper, knocking over a queue barrier on the way. | The open case and the rabbit's ears have different silhouettes at thumbnail size. The sleeper stands at the exposed end of the bank. |
| Armory | A weapons tray slipped off the carousel counter with the weapons still clipped into it. | The lit tray leans at the foot of the curved counter. |
| Breached Loading Bay | The impact peeled the loading deck back over its transverse ribs. | Bent silver leaves sit between the wedged hull and the open landing floor. |
| Transmission Chamber | A recording was interrupted hard enough to throw the operator's chair and tear the take-up reel off the deck. | One reel remains on the recorder. The other lies beside the chair, connected by its loose tape. |
| Service Shaft Landing | The lift tore out the landing comb, leaving the hoist cable attached at the far end. | The lit brackets tip down at the southern lip. The northern attachment and winch are visible from the arena. |
| Shielding Gate | One shield leaf broke away from the iris and landed across its swept carriage path. | The two standing fans and the fallen leaf sit in front of the damaged emitter. |

**Visual corrections.** The first Swarm capture recovered the infestation but clipped the housing and gave flesh and metal much the same pink value. Moving the rupture forward, reconnecting its crown to the bank and reducing the casing's coloured fill gave the wet muscle a distinct silhouette. A further pass tapered the outer membrane's opacity where small hostiles cross it. In Manual, the first monitor row was cropped and its faces merged with their dark bezels. Moving the faces forward and lighting them exposed a second problem in the kiting view, where four monitors seemed to stand on separate legs. The continuous switch shelf, bank of switches and retained damaged dais join the silhouette. The narrower station fits west of the fight circle. The final portable unit sits forward of the desk. The two inspection rounds are retained in [round one](../../artifacts/nextgen/room14b-r1/index.html) and [round two](../../artifacts/nextgen/room14b-r2/index.html).

**Remaining weaknesses.** Freight's leaning mass and Awakening's missing berth read in fewer shapes than the recorder, whose two reels are clearest at native size. The Shaft's original winch still dominates its centre view. The torn comb reads best at the incident mark. Swarm's highest pipe ends still leave the top of the incident frame, though the split and deck arms remain visible. In the heavy frames the marine, orange warning borders and projectiles remain distinct. Several dark enemies overlap one another around the Swarm roots and Transmission desk. Their individual silhouettes are harder to count at 480 px.

### Paired High / Arc performance

The baseline dist was built from the production sources, public assets, configuration and debug module at `7242a2b1`. The lockfile matches the merged head. The comparison used the same bench runner, one browser, one 20-second real-time High/Arc trial per build per room, and explicit `--dist` and `--no-build` for both sides. The baseline build remains in `artifacts/nextgen/room14b/base-src/dist`. The head includes HERO14 and ONB14 as well as ROOM14.

One-minute load stayed above 12 at every observation from 06:04 to 06:34 MSK. The comparison used the requested 30-minute fallback. A and B measured the art revision `bacf3c10` in opposite orders. Swarm's head p95 changed from 32.9 ms faster to 17.4 ms slower. Its full rectangular decal still submitted transparent fragments between the roots. Revision `e2c0c463` uses the relief mask to omit empty tiles within the same draw and drops shadow casting on the small vein ridges. The three Swarm views were captured again after that change.

The tables compare baseline (B) and optimized head (H). Draws, triangles and lights are per-trial maxima. Frame times are wall-clock RAF intervals. C ran baseline first in each room. D ran the rooms and builds in reverse order. The separate trials retain normal adaptive rendering and native enemy replenishment.

**C, baseline first**

| Room | Draws B / H | Triangles B / H | Lights B / H | Frame p50 B / H (ms) | Frame p95 B / H (ms) | Δ p95 (ms) | Starting load B / H |
|---|---:|---:|---:|---:|---:|---:|---:|
| swarm-junction | 134 / 141 | 505,352 / 483,202 | 9 / 9 | 24.8 / 25.0 | 40.6 / 41.8 | +1.2 | 28.0 / 36.2 |
| manual-control-chamber | 221 / 234 | 527,067 / 526,904 | 9 / 9 | 24.9 / 42.2 | 42.5 / 100.8 | +58.3 | 64.3 / 63.6 |
| freight-hold | 144 / 148 | 523,540 / 497,844 | 9 / 9 | 34.8 / 33.3 | 66.5 / 66.1 | -0.4 | 102.6 / 102.3 |

**D, head first**

| Room | Draws B / H | Triangles B / H | Lights B / H | Frame p50 B / H (ms) | Frame p95 B / H (ms) | Δ p95 (ms) | Starting load B / H |
|---|---:|---:|---:|---:|---:|---:|---:|
| swarm-junction | 133 / 133 | 510,596 / 454,574 | 9 / 9 | 50.0 / 41.5 | 116.6 / 91.5 | -25.1 | 55.3 / 51.4 |
| manual-control-chamber | 227 / 223 | 527,333 / 526,702 | 9 / 9 | 33.1 / 33.3 | 60.0 / 58.9 | -1.1 | 45.2 / 40.0 |
| freight-hold | 145 / 149 | 497,924 / 505,312 | 9 / 9 | 34.0 / 33.3 | 66.5 / 66.9 | +0.4 | 54.7 / 63.3 |

All six final head trials stayed within 234 draws and nine lights, with zero mid-combat shader compiles. Final head preparation took 0.617–2.285 s across the completed C/D records for these rooms. An earlier Manual A trial took 7.283 s, including 6.423 s in incident dressing. That preparation miss did not recur in either final order.

Every baseline and head trial missed 20 ms at p95. In C, Manual's load rose from 63.6 to 97.2 during its head trial, with 96.3 ms CPU p95. In D, its head p95 was 1.1 ms faster than baseline. Swarm measured +1.2 ms in C and −25.1 ms in D. Freight differed by 0.4 ms in each direction. No room repeated a p95 regression above 1 ms in both final orders. The shared-host measurements cannot resolve a 1 ms non-regression margin or certify the absolute frame budget.

Each trial retains its raw samples and preparation breakdown in `artifacts/nextgen/room14b-{A,B,C,D}-{room}-{base,head}/benchmark.json`. The final TypeScript and Vite build passed. This pass added no third-party assets.

## Third pass — walkable footprints

The placement tool builds the procedural meshes and reads the shipping kit manifests. It projects their translated, scaled and rotated bounds onto the deck in native room units. A raised part must fit entirely inside an existing obstacle, blocked furnishing, boundary wall or plan cutout. The check uses a conservative world-aligned rectangle and also checks polygon edges for concave notches. Surfaces at or below 0.022 m are walkable. Run `node tools/assets/room14-incidents/placements.mjs` from the worktree root. The tool reads the room plans without changing them.

The initial inventory had 72 violations, including 19 worklight housings. The revised inventory spans all twenty rooms and contains 73 raised placements, 36 flush surfaces and zero reported overlaps. The [placement ledger](../../artifacts/nextgen/room14c/before-placements.txt) lists every original violation and its footprint.

The suitcase, rabbit, open berth and queue barrier now share the southern pod plinth. The Residential cabin, pictures and loose luggage occupy the blocked common nook. Swarm's split casing, raised roots and vein ridges sit on its northern duct bank. Its normal-mapped floor membrane continues over the walkable plates at 0.021 m. Manual's damaged desk and bypass share the native console footprint, with the low floor cable still walkable. The other raised incident assemblies were fitted to existing blocked structures. Coolant and Infested Workshop only needed worklight moves. Awakening Bay already cleared the footprint check.

The Arc campaign (seed 1729, fast) cleared 20 rooms with zero errors on the first mounted build. Following shelf-placement refinements, a four-room run produced [storyboard frames](../../artifacts/nextgen/room14c/storyboard-review.jpg) for Passenger Vault, Residential Gallery and Communal Atrium. The marine and enemies stayed visually clear of the raised debris in the six inspected frames. The [capture gallery](../../artifacts/nextgen/room14c/index.html) includes incident-facing and kiting views for all 19 changed rooms, each at 1920×1080 and 480×270. Passenger's open case reads on its plinth. Swarm's raised machinery reads best from centre. Manual's desk still grazes the upper edge on approach, and Diagnostic's sign attracts the eye before the damaged furniture.

## Fourth pass — floor-standing incident cover

The twenty templates now supply 31 rectangles to the existing native blocker list. The renderer draws the incident itself. Passenger Vault uses one solid for the suitcase and rabbit and another for the berth and fallen queue barrier. Manual Control uses one for the console and one for the bypass. Freight’s leaning stack stands beside the container. Swarm’s split plenum retains its vertical silhouette with a shallower footprint beside the duct and a flush membrane extending onto the deck. Template IDs and the campaign route are unchanged. Both room entry and checkpoint restoration derive blockers from the template.

The placement inventory covers the ROOM14 meshes, the procedural INC13 and DRESS13 batches, the P11 room kits and worklight housings. The final sweep loads shipping triangles wherever a rotated or multi-part kit model spans open space in its bounding rectangle. This cleared the Atrium conservatory, Armory carousel and wedged loading pod. Crew’s redundant freestanding scanner was removed from the existing portal. The Transmission dish now fits the wall pedestal and the Overload crown fits the reactor island. Raised batches with mixed floor marks are inspected triangle by triangle. The inset around bevelled incident art is at most 1.6 native units. Unsupported loose fittings are seated, flattened to at most 0.021 m, or omitted. The final inventory contains 195 raised parts and 119 flush surfaces with zero raised overlaps.

Dimensions below are native ship units (32 per metre). “Largest” measures the indicated body from the marine spawn to the exit and breach entry positions, plus the fixed access pickup where present. “Markers” uses exact breach coordinates. “Native” uses the marine for exit and pickup access and the largest room body for travel between breach entry and arena. An arrow shows before and after. Straight charge lanes sampled are baseline wall-stun approaches.

| Room | Cover width × depth | Largest radius | Largest reached / total, before → after | Markers before → after | Native before → after | Minimum sampled lane before → after | Warden rays shortened / checked |
|---|---|---:|---|---|---|---|---|
| awakening-bay | 376 × 98, 74 × 49 | 16 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 46.9 → 46.9 | 0/0 |
| passenger-vault | 94 × 97, 109 × 56 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 37.2 → 37.2 | 0/0 |
| residential-gallery | 168 × 73 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 32.6 → 32.6 | 0/0 |
| communal-atrium | 107 × 57 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 119.5 → 119.5 | 0/0 |
| crew-checkpoint | 78 × 22, 51 × 17 | 28 | 5/5 → 5/5 | 2 → 2 | 5 → 5 | 32.8 → 32.8 | 0/0 |
| armory | 66 × 40 | 64 | 4/5 → 4/5 | 0 → 0 | 5 → 5 | 35.2 → 35.2 | 0/16 |
| freight-hold | 110 × 69 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 69.4 → 69.4 | 0/0 |
| breached-loading-bay | 129 × 90 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 135.2 → 135.2 | 0/0 |
| relay-racks | 66 × 103 | 64 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 35.2 → 35.2 | 0/13 |
| transmission-chamber | 34 × 45, 72 × 33 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 43.2 → 43.2 | 0/0 |
| diagnostic-gallery | 94 × 69 | 28 | 5/5 → 5/5 | 3 → 3 | 5 → 5 | 40.0 → 40.0 | 0/0 |
| safety-interlock-station | 53 × 35, 28 × 10 | 28 | 6/6 → 6/6 | 4 → 4 | 6 → 6 | 35.2 → 35.2 | 0/0 |
| coolant-plant | 143 × 29, 112 × 38 | 64 | 4/5 → 4/5 | 4 → 4 | 5 → 5 | 34.0 → 34.0 | 0/12 |
| service-shaft-landing | 26 × 68, 24 × 56 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 48.8 → 48.8 | 0/0 |
| infested-workshop | 96 × 81, 79 × 43 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 32.0 → 32.0 | 0/0 |
| swarm-junction | 160 × 63 | 64 | 5/5 → 5/5 | 2 → 2 | 5 → 5 | 103.2 → 103.2 | 0/8 |
| shielding-gate | 154 × 28, 61 × 56 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 48.0 → 48.0 | 0/0 |
| containment-annulus | 28 × 56, 28 × 20 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 75.2 → 75.2 | 0/0 |
| manual-control-chamber | 128 × 60, 51 × 41 | 64 | 0/5 → 0/5 | 0 → 0 | 5 → 5 | 35.2 → 35.2 | 0/12 |
| overload-floor | 181 × 84 | 28 | 5/5 → 5/5 | 4 → 4 | 5 → 5 | 65.1 → 65.1 | 0/0 |

All 101 role-specific targets remain reachable. Starting every largest body at the marine spawn instead reaches 94/101 targets on both layouts. The largest body reaches 67 of the 80 exact breach markers on each layout. The default audit reports inherited failures in six rooms when a large enemy must start at the marine spawn and stand exactly on each breach marker. In Manual Control the 64-unit Warden cannot occupy the marine spawn even with all incident cover removed. Armory and Coolant also have exits that cannot admit the Warden. Crew, Diagnostic and Swarm have breach markers too close to blocked geometry for their largest body. Native breach spawning tries an inward offset and alternate legal positions. The strict audit returns failure for those exceptions. Running with `--compare-baseline` checks for losses against the same template with the incident solids removed.

The width audit sweeps both deck axes in four-unit steps and on both sides of each rectangular edge, then measures the authored openings separately. No sampled minimum declined. All 61 sampled wall-stun approaches retained their baseline length. These samples do not exhaust every possible Warden charge angle.

The native rifle and enemy spit probe records both effect positions and surviving projectiles for all 31 rectangles. The upper part of Awakening’s berth shares an existing stock housing. Its perimeter intercepts the shot before it can reach the inner box. The mint outline in the collider captures uses the same rectangles passed to simulation. In Passenger Vault three southern berth sockets are empty so the legacy bank cannot obscure the suitcase and rabbit. The fourth sleeper remains sealed.


The Diagnostic gurney moved to the end of the partition, and the shaft assembly moved toward the void. The final loading pod and Relay sled use the positions from the successful native campaign. The Manual console wall and bypass retain their height and width with 16% less depth along the southern approach. All their parts, screens and the flush cable follow the same transform.

### Visual and native verification

The gallery contains incident-facing, centre-kiting and heavy-combat frames for every room at 1920×1080 and 480×270, collider-debug views for all twenty and two additional Freight cutaway views. The comparison uses the eight ROOM14b captures and the previous unchanged views for the other twelve. The camera-mark ledger identifies each retained frame. Breached Loading Bay and Relay Racks were the only rooms with new obstacle positions after the console capture. [Gallery](../../artifacts/nextgen/room14d/index.html) · [Four-wide incident sheet](../../artifacts/nextgen/room14d/incident-facing.jpg) · [Second-pass comparison](../../artifacts/nextgen/room14d/incident-comparison.jpg) · [Historical approach marks](../../artifacts/nextgen/room14d/historical-marks.jpg) · [Frame ledger](../../artifacts/nextgen/room14d/frames.json)

From the incident marks, all twenty projected cover footprints fit in frame using a two-metre prism. Every centre view includes part of its footprint. Service Shaft Landing has the least centre coverage at 18%, followed by Freight at 49%. Freight’s stack reads clearly from the approach, but the integrity HUD overlaps it from the centre. Manual’s screens and bypass read together. Swarm’s casing remains visible when the marine touches its front bevel. Crew’s broken arm is quiet at 480×270, and the Relay sled can blend into the rack. Hostile sectors remain visible in all twenty heavy frames. Infantry silhouettes at the right of Armory and Overload have the weakest separation at reduced size. [Projected bounds](../../artifacts/nextgen/room14d/projected-bounds.txt) · [Heavy frames](../../artifacts/nextgen/room14d/combat-heavy.jpg) · [Collider overlays](../../artifacts/nextgen/room14d/colliders.jpg)

On the four-room revision, native Breacher and Arc both cleared twenty rooms at seed 1729 with zero runtime errors. Their 9,931 and 10,307 sampled marine circles had zero penetrations. The five Breacher storyboards show movement around the Passenger, Freight, Relay, Swarm and Manual assemblies. Across 1,689 near-cover observations, zero actor centres entered a solid. On the subsequent compact-console revision, Breacher died in Diagnostic after ten clears with zero runtime errors. The upstream Loading and Relay positions were then restored. Final-head verification covers the placement, navigation, projectile, capture and simulation results. The native campaign receipts and storyboards describe the earlier full runs. [Campaign receipts](../../artifacts/nextgen/room14d/campaigns.json) · [Storyboard observations](../../artifacts/nextgen/room14d/storyboards/observations.txt) · [Projectile impacts](../../artifacts/nextgen/room14d/projectiles.txt)

### Balance comparison

The acceptance review used the compact-console results, with Story Arc rising from 13 to 18 completions, Standard Arc from 13 to 16 and Standard Breacher falling from 14 to 12. No room gained more than two deaths across both modes on that layout. The lead waived the ±2 completion requirement and stopped further tuning. The cohort already running at that decision uses the final gameplay revision `030cf458`.

The integrated control is I14 at `7c3e35a0`. A local control rerun of Breacher seed 1729 in both modes matched the archived gameplay, policy and backend hashes, every per-room duration and ending health. PROPS14 and TITLE15 subsequently changed presentation. Earlier complete comparisons are retained for the pre-I14 layout, the first footprint refit, the four-room adjustment, the pump-edge experiment and the compact console. [Pre-I14](../../artifacts/nextgen/room14d/balance-pre-i14.md) · [First I14 fit](../../artifacts/nextgen/room14d/balance-first-i14.md) · [Four-room adjustment](../../artifacts/nextgen/room14d/balance-edge-i14.md) · [Pump-edge experiment](../../artifacts/nextgen/room14d/balance-header-i14.md) · [Reviewed console layout](../../artifacts/nextgen/room14d/balance-console-i14.md)

**Final head.** The existing cohort finished all 160 runs at `030cf458`. Story cleared 67/80 against 62/80 on the control. Standard cleared 55/80 against 52/80. Standard Swarm Junction gained three deaths (0 → 3). Across both modes Manual Control gained three (2 → 5). These are the two room-death exceptions on the final layout. The production type-check and Vite build passed. [Final paired ledger](../../artifacts/nextgen/room14d/balance.json)

| Difficulty and profile | Rig | Paired seeds | Baseline clears | Cover clears | Difference |
|---|---|---:|---:|---:|---:|
| Story novice | Breacher | 20/20 | 17 | 18 | +1 |
| Story novice | Cryo | 20/20 | 14 | 15 | +1 |
| Story novice | Pyro | 20/20 | 18 | 16 | -2 |
| Story novice | Arc | 20/20 | 13 | 18 | +5 |
| Standard competent | Breacher | 20/20 | 14 | 10 | -4 |
| Standard competent | Cryo | 20/20 | 13 | 15 | +2 |
| Standard competent | Pyro | 20/20 | 12 | 15 | +3 |
| Standard competent | Arc | 20/20 | 13 | 15 | +2 |

| Death room | Story baseline → cover | Standard baseline → cover | Combined difference |
|---|---:|---:|---:|
| awakening-bay | 0 → 0 | 0 → 0 | +0 |
| passenger-vault | 0 → 0 | 0 → 0 | +0 |
| residential-gallery | 0 → 0 | 0 → 0 | +0 |
| communal-atrium | 0 → 0 | 0 → 0 | +0 |
| crew-checkpoint | 0 → 0 | 0 → 0 | +0 |
| armory | 0 → 0 | 0 → 0 | +0 |
| freight-hold | 0 → 0 | 0 → 0 | +0 |
| breached-loading-bay | 0 → 0 | 1 → 1 | +0 |
| relay-racks | 0 → 0 | 1 → 0 | -1 |
| transmission-chamber | 2 → 3 | 4 → 5 | +2 |
| diagnostic-gallery | 2 → 1 | 3 → 0 | -4 |
| safety-interlock-station | 0 → 0 | 1 → 2 | +1 |
| coolant-plant | 0 → 0 | 2 → 0 | -2 |
| service-shaft-landing | 3 → 0 | 6 → 5 | -4 |
| infested-workshop | 3 → 1 | 4 → 2 | -4 |
| swarm-junction | 1 → 0 | 0 → 3 | +2 |
| shielding-gate | 3 → 3 | 4 → 4 | +0 |
| containment-annulus | 1 → 2 | 1 → 1 | +1 |
| manual-control-chamber | 1 → 3 | 1 → 2 | +3 |
| overload-floor | 0 → 0 | 0 → 0 | +0 |
