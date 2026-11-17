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
