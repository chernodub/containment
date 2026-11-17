# DRESS13 review

## Swarm Junction
Round 1: opened native tour 02/04 and their 480×270 reductions. Creep and nests read as connected edge masses; the web presented as a dark bar, so tilted both membranes .65 radians and removed the former plenum decoration.
Round 2: opened revised native tour 03/04. Marine remains exposed in the crossing and airway; web retains a heavy silhouette at distance. Heart is relegated to the deep south recess to keep the fight circle open; landmark visibility remains weaker than the modelling reference.

## Infested Workshop
Round 1: opened native south/gantry tour04 and exact-size reductions of tour02/04. South-only growth missed the tool-gallery story; moved the duct, medium nest, pods and connected wall creep to the north workbay.
Round 2 is captured in dress13-edge-final; two machines retain consumed shells, and the fight floor remains free of tall pieces. Calm retry required after concurrent dist rewrite broke a lazy import in the earlier capture.

## Overload Floor
Round 1: opened native fight02 and exhaust04, plus 480 reductions. Growth stays dark and peripheral, with substantially dimmer lanterns; the reactor and marine dominate.
Fix: flattened the long overhead membrane's vertical sag and kept the central holdout floor free of all raised growth. Final source capture follows the common build.

## Breached Loading Bay first trace
Round 1: opened native entry01 and 480 entry01. A burst duct and connected creep sit by the port tear, well clear of the marine and freight turn floor; warm room lighting makes the flesh brighter than intended.
Fix: baked trace albedo gain reduced to .65, keeping the early contamination quiet. Complete five-position tour/calm in dress13-edge-final; final source recapture follows.

## Freight Hold first trace
Round 1: opened five-position tour's north-court reduction03; the added trace stays at the distant dispatch ventilation edge rather than becoming an early room landmark. Native calm and five-position tour completed without capture guards.
Fix: same .65 trace albedo gain as Loading Bay; no extra masses, no new collision or route obstruction. Final source recapture follows.

## Growth final source corrections
Inspection of the south recess showed the heart was too far from the toured airway; moved it from z950 to z825, still 305 units from the arena centre with the near edge outside the fight circle. Darkened living creep to .6 albedo gain so actor silhouettes retain priority. Legacy ConstructionLanguage/EnvironmentalStory ribbons are retired in the two takeover rooms, in addition to L8 seams.

## Rooms 17–19 reviewed rounds

## Round 1 opened review and fixes

Shielding Gate: opened native spawn/fight and exact-area 480 spawn. The nested shield reads immediately at entry, and the fight floor/marine stay clear; the pale resin spill competes with the marine's value. Fixed creep to 0.55 baked albedo gain and webs to 0.7; flattened web vertical scale to 22% so the long web's measured 1.299m sag remains above head height.
Containment Annulus: opened native spawn/north-ring and exact-area 480 north-ring. The continuous outer strip communicates consumption while leaving the arena untouched, but identical crest spacing looked manufactured. Fixed the strip with alternating three creep shapes, small yaw/offset variation and dimmed crust; the wall climbs retain their attached outer-housing support.
Manual Control: opened native spawn/booth and exact-area 480 booth. Cabinet mantles and violet organs frame a clean decision floor; resin around their bases was too pale. Applied the same dim crust and high-web sag correction, keeping the manual dais and story sign fully readable.

## Round 2 opened review

Shielding Gate: reopened final native spawn plus 480 spawn; the web now clears the machinery face, the violet nest organ remains a peripheral landmark, and the marine is the clearest figure. Native fight view stays deliberately open; the nest's own attached spill is still lighter than the standalone crust, but stays outside the fight circle.
Containment Annulus: reopened final native/480 north-ring. The irregular overlapping edge now reads as a continuous colony rather than tiled scallops; the marine is clean against the quiet inner ring. The outer wall's repeated growth caps remain this room's weakest detail.
Manual Control: reopened final native/480 booth. Mantles visibly consume cabinet sections and the clean central authorisation floor/sign remain clear; the colony stays peripheral at spawn. The extreme left nest is partially cropped by the ordinary camera and is secondary to the swallowed cabinets.

Both rounds captured complete five-position tours and one calm frame per room. Final retained evidence is `artifacts/nextgen/dress13-final/gates/`, including exact-area 480 reductions; exact final6 source views are in `dress13-final/before/` and `before-480/`. No camera, simulation, actor, encounter, UI, or collision changes were made by this room group.

| Room | final6 tour max draws / triangles | Final tour+calm max draws / triangles | Final textures (count) | Max room preparation ms | Prepared tour compiles |
|---|---:|---:|---:|---:|---:|
| Shielding Gate | 192 / 371,693 | 183 / 182,472 | 125 | 1,628.4 | 0 |
| Containment Annulus | 72 / 374,899 | 90 / 270,537 | 127 | 2,346.0 | 0 |
| Manual Control Chamber | 91 / 298,856 | 120 / 164,902 | 124 | 1,838.9 | 0 |

These are staged whole-frame submission counts, not hardware FPS or an isolated DRESS13 performance delta; final6 and the merged branch include other renderer/actor changes. Texture counts are not texture-memory measurements. The three rooms reuse the Brood pack atlas and finish batches. Both capture manifests contain zero failures/errors. Combat kiting and full native campaign are owned by the integration pass.

## Compressed-atlas integration
The first KTX2 capture caught GL_INVALID_ENUM in preparation: retained warmup samplers copied a compressed ASTC format onto a plain DataTexture. Corrected the placeholder to RGBA8 while preserving shader sampler shape; the one-room Freight retry passed with the shipping compressed atlas. Final growth tours use that corrected immutable build. No warmup ownership or disposal path was removed.

Swarm final tour04 exposed a poor heart location: the marine's south-airway inspection mark entered its cutaway region, hiding the landmark. Moved the heart to the starboard plenum shoulder at (970,400), scale .8, where its back overlaps existing machinery and the southern exit route retains over 140 units. It stays outside the fight circle and requires a fresh final Swarm tour.

Final compressed-atlas Workshop03 and Overload04 opened at native size and 480×270. The swallowed workbay reads beside the marine without covering the body; Overload's charred edge masses stay subordinate to the reactor. Both complete tours/calm passed; final preparation was 1.17s Workshop and 2.68s Overload, below the 3s target. The earlier Overload 4.00s cold preparation remains a recorded outlier, not erased performance evidence.

## Rooms 1–6 incident reviews

# DRESS13 early incidents

## Residential Gallery
Placement pass: seven aftermath pieces extend the existing fallen-chair/drawings nook into an interrupted evacuation, with opened luggage and a skew cabin barricade; the central fight floor stays empty.
Build passed. Native/480 capture review and the subsequent visual correction are pending the shared browser slot; this is not yet visual acceptance.

## Awakening Bay
Placement pass: existing forced-open berths now connect to a dropped recovery kit and six dark, flush wet tread marks; pieces remain under the north bank, away from the observation fight floor.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Passenger Vault
Placement pass: six small personal effects and an identification plaque sit below the existing empty extended drawer, isolated from the west entry fight lane.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Communal Atrium
Placement pass: two overturned desks and a fallen bench form one failed barricade at the conservatory's east foot; dropped contents and dark trample panels gather beneath it, clear of the west fight floor.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Crew Checkpoint
Placement pass: baggage remains on and below the north inspection conveyor, beside a severed tray and restrained dark fan mark with four spent-case glints; the scanner fight floor is untouched.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Armory
Placement pass: half-closed magazine shutters and a dropped, open issue case gather north of the existing emptied carousel; no objects are added to the southern fight circle.
Build pending shared-dist release. Native/480 capture review and visual correction await the shared browser slot.

Loader review correction: moved the dropped Awakening/Passenger/Armory case origins outside the authored hero AABBs; the loader retires `p11-service` supports inside hero bounds. This avoids silently omitting the incident cases. Type-check passed; visual acceptance still pending.

Detail correction before capture: replaced panel-shaped footprints/soot/casings with shaped flat wet soles and heels, an irregular dark scorch fan and seven small metallic cases. Added a barricaded hatch with four claw cuts and drag wear, paper spill, trample streaks and armory scuffs. Geometry stays presentation-only under the prepared room owner, with explicit material disposal. Production build passed.

### Round 1 actual image review — Residential Gallery
Opened native tour02 and exact480 tour01/03 against final6 calm native/480: luggage and the skew barricade now register at the nook; the marine remains unobscured and the fight floor retains quiet values. The cases still read too closed, so the correction adds a dark opening and a folded pale garment on the large case rather than more scattered props.

### Round 1 actual image review — Awakening Bay
Opened native tour02 and exact480 tour01/03 against final6: forced-open canopy reads, but the dropped kit is hidden by the bank console and the tread is too far behind it. Correction moves kit and wet trail to the exposed west foot of the bank and adds a restrained pale medical cross; the observation fight floor remains clear.

### Round 1 actual image review — Passenger Vault
Opened native tour02 and exact480 tour01/03 against final6: the empty pulled drawer is now the dominant personal story, with belongings at its foot and no marine obstruction. The paper spill disappears first at 480; correction enlarges the three sheets slightly and adds one subdued drawer-to-case drag streak instead of more high-contrast detail.

### Round 1 actual image review — Communal Atrium
Opened native tour02 and exact480 tour01/03 against final6: the damaged conservatory is clearer, but the table barricade is swallowed by foliage and the generic-furnishing retirement filter. Correction exempts explicitly authored DRESS13 furniture from that filter and moves the toppled tables to the garden's front foot, leaving at least 140 units of the south route visually open.

### Round 1 actual image review — Crew Checkpoint
Opened native tour02 and exact480 tour01/03 against final6: the central scanner remains exceptionally readable, but the baggage was placed on the wrong north bank and is absent from the intended composition. Correction seats the bags on the actual authored conveyor at (950,98), with the dropped case and soot/casing fan at its foot; this is a north-bypass incident, strongest in tour03 rather than the fight view.

### Round 1 actual image review — Armory
Opened native tour02 and exact480 tour01/03 against final6: the pale counter no longer dominates the darker carousel; the dropped case is visible beside it and never covers the marine. The case still reads shut, so correction adds a dark foam opening and two muted empty cutouts; north magazine shutters remain a peripheral tour detail rather than a fight-floor feature.

### Round 2 — Residential Gallery
Opened corrected native tour02 and exact480 tour01/03. The case now has an open dark compartment and folded garment; drawings, fallen chair and skew barricade remain a single peripheral composition. Marine silhouette and quiet fight-floor values are preserved; claw cuts remain small tertiary evidence at 480.

### Round 2 — Awakening Bay
Opened corrected native tour03 and exact480 tour01/02. The dropped medical case is now exposed beside the console and the forced-open canopy reads above it; wet soles stay subdued and are difficult to pick out at 480. No added mass overlaps the marine or the observation fight floor.

### Round 2 — Passenger Vault
Opened corrected native tour02 and exact480 tour01/03. The empty extended drawer and its two fallen cases make a clear interruption; paper and drag wear remain supporting details. The marine, ring and aisle stay unobstructed, with the original cyan/blue room hierarchy intact.

### Round 2 — Communal Atrium
Opened corrected native tour02 and exact480 tour01/03. The two toppled desks and fallen bench now read as a failed barricade at the damaged planter's foot; the former intact garden presentation has a visible consequence. The west fight floor is unchanged and the marine is fully clear; the tables remain secondary to actors.

### Round 2 — Crew Checkpoint
Opened corrected native tour03 and exact480 tour01/02. Bags now sit on the real conveyor, with a fallen case, broken tray and spent cases at its foot; no piece covers the marine. This remains the weakest early-room incident because it is peripheral to spawn/fight framing; the central pale scanner floor is intentionally kept quiet.

### Round 2 — Armory
Opened corrected native tour02 and exact480 tour01/03. The issue case now reads open and empty beside the carousel, and the southern fight court stays unobstructed. The carousel remains the room landmark; the north lockdown shutters are less visible than the case in normal fight framing.

Both six-room runs completed their requested five-position tours and calm frames without a capture failure. These are staged presentation reviews, not a campaign or hardware performance result. Round2 frozen build includes the working-tree shared details hook and loader exemption, recorded via app-asset hashes; HEAD label alone does not describe that complete source tree.

Crew final fight02 opened natively by integration: the north-conveyor incident is entirely absent from the fight view. Added a small dropped load/cable-tray jam against the departure gate's south foot and moved soot/casings there, outside the fight circle. Conveyor baggage remains; the failed inspection now has evidence visible from the central combat camera. A fresh Crew tour/calm is required before acceptance.
Swarm starboard-shoulder fight02 showed the core just outside the right camera edge. Shifted the .8-scale heart to (820,640): its nearest footprint corner remains beyond the 144-unit fight radius, the full south airway is clear below z720, and the upper exit approach stays broad. Final Swarm recapture is queued with the Crew visibility correction.

## Service-room incident reviews

# DRESS13 service incidents

All eight rooms completed two guarded five-position tour + spawn-calm batches. In each round I opened native fight-tour02 and exact480 tour02/03; Shaft also received native spawn-calm inspection. The final five-room arena-calm recheck was opened at native and exact480 size. Final6 named-view comparison sheets were also opened. These are quiet art inspections, not campaign or hardware-performance claims.

- Freight Hold: crushed container stack with spilled cases/parts stays on the existing gantry bed, above the southern tow floor. No gameplay colliders added.
- Breached Loading Bay: diagonal cargo and drag scars point into the torn shoulder; a restrained pale suppression-foam fringe follows that shoulder.
- Relay Racks: detached rack panel, tool cases/cards, and visibly cut parallel fibre ends sit on the existing central rack footprint.
- Transmission Chamber: abandoned operator station holds “DO NOT OPEN THE DOCK / WE ARE STILL INSIDE”; disconnected repair leads and tools surround it.
- Diagnostic Gallery: torn restraints, detached panels, cold shards and restrained dark ichor articulate the empty specimen cradle.
- Safety Interlock: weld beads and short stress gouges occupy the rear frame, with abandoned welding/service tools below, preserving both native doors.
- Coolant Plant: separated pipe ends, a muted frozen spill and buff/charcoal safety tape compose the rupture on the central machine bed.
- Service Shaft Landing: a tilted three-sided lift cage hangs below the balcony, one intact cable and one frayed cable attached to existing winch machinery.

Resource intent: each room reuses six to eight static service-kit instances in the existing finish batches plus one vertex-colour detail mesh. Transmission alone adds one 512×256 canvas screen (0.667 MiB RGBA8 with full mip upper bound). Material and screen texture disposal belong to the existing room lifecycle. Quiet resource observations are recorded below; combat budgets/readiness and the twenty-room campaign belong to the root verification pass.

First runtime attempt (`dress13-services-r1`, frozen source67f4007) stopped before any accepted PNG: Freight Hold tour returned GL_INVALID_ENUM1280 with no page errors. Investigation isolated the new compressed Brood normal map's retained warmup sampler: an ordinary DataTexture inherited a compressed ASTC pixel-format enum. Root is correcting that placeholder; this failed parent is diagnostic history and is not visual acceptance.

## Freight Hold — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. The shifted gantry reads clearly and the marine remains unobstructed, but most added cases were buried behind its load.
Moved the crushed three-crate stack onto the front-left machinery bed and enlarged it 20–25%; the spill remains north of the fight circle. Final tour/calm recheck pending the shared second batch.

## Breached Loading Bay — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. Foam and bent hull read, but the dragged cargo was entirely inside the wound and did not connect to the dock floor.
Pulled the first three cases back along the port shoulder and exposed two low dark drag scars on the apron, preserving the central turning circle and broad port route. Final tour/calm recheck pending the shared second batch.

## Relay Racks — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. The rack spine remains dominant and the actor is clear, but tools and cut fibres on its interior bed disappear behind the rack bodies.
Moved the opened panel and repair spill to the west face below the visible patch gap, with five dangling cut fibres terminating short of their deck-side ends. No route or collider changed; final tour/calm recheck pending the shared second batch.

## Transmission Chamber — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. The dish reads well, but it completely hides the frozen operator screen and most repair debris.
Moved the station and its connected spill to the dish's starboard side, with a slightly broader dim screen facing the gameplay camera; the holdout circle and exit approach remain clear. Final tour/calm recheck pending the shared second batch.

## Diagnostic Gallery — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. The empty cradle reads, but the restraint damage and debris are too captive inside its base to replace the sign-led storytelling.
Brought a torn cover, opened case and cold shards over the front lip, with severed restraint tongues falling toward a small dark stain outside the combat circle. Final tour/calm recheck pending the shared second batch.

## Safety Interlock Station — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. The rear weld was hidden behind the interlock's cylinder bank, so the room still looked undamaged despite the added tools.
Transferred the sealed access leaves, weld beads and gouges to the camera-facing frame, keeping the native side doorways and 140-unit cross-cage passage clear. Final tour/calm recheck pending the shared second batch.

## Coolant Plant — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. The pump and frozen runoff now distinguish this room, but the cut pipe ends are buried in the machine and the safety tape reduces to a line.
Brought the separated coupling to the front outlet, extended the subdued frozen tail and widened the buff/charcoal tape into a physical ribbon. The pale ice stays peripheral; final tour/calm recheck pending the shared second batch.

## Service Shaft Landing — round1 → correction

Opened native fight-tour02, native spawn calm and exact480 tour02/03 against final6. The repair winch is strong, but the new hanging cage merges into its gear/beam silhouette and reads as ordinary railing.
Lowered and offset the tilted cage into the open shaft below the winch, with a broader floor and a long surviving cable opposed by a visibly frayed free end. The entire cage remains over the void; final tour/calm recheck pending the shared second batch.

## Round2 and final exposed-floor check

- Freight Hold: the crushed front-left stack now reads at480 beside the tilted load. The fight floor remains empty and the full marine is clear; tiny under-load scuffs stay subordinate.
- Breached Loading Bay: cases now lead from the apron into the wound; lifting the flush strokes above the deck skin made the paired drag tracks visible in the final native arena view. Foam stays at the hull shoulder.
- Relay Racks: the opened rack face and hanging cut trunk read, but small cases still merged with the base. A final20–40-unit westward shift exposes the dropped repair kit beside the panel; the actor remains separate.
- Transmission Chamber: the station is now visible beside the dish with the held message and disconnected service spill. Native text is readable; at480 the abandoned station shape carries the cue rather than the words.
- Diagnostic Gallery: the torn cover and hanging restraints now lie over the front lip with shards and a restrained floor stain. The physical escape evidence reads at480, though the existing sign remains a strong narrative element.
- Safety Interlock: initial front-face weld detail still looked like loose tools. The final native/480 recheck shows two buckled access leaves closed by a vertical weld seam and scored from within; the native side passages remain clear.
- Coolant Plant: separated outlet ends connect the machine to an extended frozen tail; the quiet fight view keeps all pale material at the periphery. The buff tape remains a secondary detail at480.
- Service Shaft Landing: native spawn calm shows the cage dropped below the winch on one remaining cable, with the frayed free end hanging separately. The whole incident stays over the shaft void and the marine stays unobstructed.

The common flat-mark helper was corrected from y.012 (below the deck skin) to y.024–.0264, below friendly .027 and hostile .030 layers. Freight/Breach/Relay/Diagnostic and the final Safety leaves were rechecked with `l8-arena-calm` on frozen sourceeba4f46d; this is explicitly staged quiet fight-circle evidence.

Capture results: first complete batch48/48 at420.45s; second complete batch48/48 at500.86s; final floor/access check5/5 at79.55s. All three completed batches recorded zero errors and zero failures. The earlier compressed-format warmup failure is retained as a failed diagnostic parent; root corrected it before these successful batches. Each room correction received a separate commit with the requested coauthor.

Final files: `artifacts/nextgen/dress13-final/after/<room>/` (native + exact480 tours/calm), `floor-final/` (five final checks and manifest), `services-compare-1.png`, `services-compare-2.png` (opened final6 named-view comparisons), and `services-quiet-resources.json`. Final6 comparisons include older P11/actor/layout changes already on nextgen and do not isolate this dressing pass.

| Room | Quiet draw max | Quiet triangle max |
|---|---:|---:|
| Freight Hold |72|155,583|
| Breached Loading Bay |88|168,503|
| Relay Racks |92|143,413|
| Transmission Chamber |83|201,319|
| Diagnostic Gallery |76|165,218|
| Safety Interlock |270|195,111|
| Coolant Plant |75|138,724|
| Service Shaft Landing |78|136,586|

These are staged tour/calm resource maxima, not before/after combat benchmarks. Full GPU texture bytes are not inferred from texture counts. Brood KTX2 shipping has a1.333MiB8bpp block upper bound versus5.333MiB RGBA8+mips for its shared1024 normal atlas; the Transmission512×256 screen has a0.667MiB RGBA8+mip upper bound. Runtime format and full session memory are device-dependent.

Weakest of this set: Relay Racks (the cut-fibre repair remains a small detail), Safety Interlock (the welded access reads as a machinery hatch rather than a full hull door), Diagnostic Gallery (the sign remains more emphatic than the torn cradle). No source changes are pending from this substream; root owns final crowd/readiness/budget/campaign acceptance.
Final southeast-heart fight02 still cropped the core below the viewport. Shifted it up along the east crossing shoulder to (815,470), keeping its actual near x bound at about750 (>144 units from the arena centre) and its south edge below556, leaving the lower160-unit exit opening clear. Recheck Swarm alone after the crowd batch; no camera adjustment.

The final Swarm combat frame identified the last old green strands as WorldDressing's breach-grate roots (not the industrial kit). Retired that branch in Swarm, Workshop and Loading Bay, while preserving the grates and legacy Queen dressing. This is render-only, with no native geometry/collider change; the ongoing campaign retains the immediately preceding immutable visual build. Final affected-room captures and the resource benchmark use the cleaned source.

## Twenty-contact combat review
Opened one native frame for every room, then both exact480 contact boards and the four corrected twenty-contact reductions. Passenger Vault, Atrium and Freight needed legal interior spawn candidates because the ordinary forward fan was occluded; final receipts record twenty accepted contacts in all twenty rooms. These are staged native movement/fire frames, not organic encounters or hardware timing evidence.
The marine remains fully exposed in every inspected frame. New luggage, repairs, frost, cage fragments and growth stay peripheral to the fight floor; projectile discs and active warning footprints retain their danger palette. Existing edge/HUD crowd cropping remains visible in some rooms and was not changed by this stream. Relay repair detail, the Safety machinery-hatch reading, and Annulus cap repetition remain the weakest room-art details.
Swarm final native tour02 shows the whole violet hive core beside the marine; its combat cutaway yields to overlapping actor silhouettes, preserving combat readability. Crew final fight02 shows the dropped load at the gate foot rather than an empty clean checkpoint. Both were reopened natively and at480 after the integration corrections.

## Twenty-contact combat inspection
Opened native frame01 for all20 rooms, plus exact480 contact boards and the four corrected-room reductions. All selected receipts contain20 accepted native contact spawns; these are staged native movement/fire observations, not organic balance or hardware-FPS evidence. Foreground marine bodies stay clear; projectiles and active warning shapes remain stronger than the new low edge dressing.
Awakening/Passenger: dropped recovery/personal items remain at berth edges; dark tread/paper detail is deliberately subtle at480. Residential/Atrium/Crew/Armory: evacuation cases, barricade, gate jam and issue-case debris remain away from the moving marine; Atrium's dense close Crawlers still leave the warning arc readable.
Freight/Loading: spilled load and drag trail stay on the existing machinery/wound shoulders. Relay/Transmission/Diagnostic/Interlock/Coolant/Shaft: repair evidence, frozen message, torn cradle, welded machinery hatch, frozen spill and hanging cage stay peripheral; no newly placed piece crosses the marine silhouette.
Workshop/Swarm/Gate/Annulus/Manual/Overload: low crust remains subordinate to actor bodies; large edge growth cuts away for actors through the existing owner. Swarm's heart is fully visible in quiet fight02, while its cutaway retires it when combatants overlap its projected bounds. Gate organs remain the brightest peripheral growth; Annulus wall repetition and Manual's extreme-left crop remain weaker details.
Swarm's active registered north banks end at z340, deeper than the original Act4 plan. Moved four small crust fans out from beneath those banks, and added16 broad, low-relief (.3 vertical scale), dim (.38 albedo) patches across exposed approach/south floor and the north throat. This supplies a continuous infestation field on actual visible non-fight deck without adding a material draw, texture, collision, or raised obstruction. Final shipping Swarm tour/kiting recheck follows.
