# DRESS13 service incidents

Implementation notes below are placement intent, not completed visual review. Native and exact 480×270 tour/calm inspection, one correction and a room commit remain pending the shared browser slot.

- Freight Hold: crushed container stack with spilled cases/parts stays on the existing gantry bed, above the southern tow floor. No gameplay colliders added.
- Breached Loading Bay: diagonal cargo and drag scars point into the torn shoulder; a restrained pale suppression-foam fringe follows that shoulder.
- Relay Racks: detached rack panel, tool cases/cards, and visibly cut parallel fibre ends sit on the existing central rack footprint.
- Transmission Chamber: abandoned operator station holds “DO NOT OPEN THE DOCK / WE ARE STILL INSIDE”; disconnected repair leads and tools surround it.
- Diagnostic Gallery: torn restraints, detached panels, cold shards and restrained dark ichor articulate the empty specimen cradle.
- Safety Interlock: weld beads and short stress gouges occupy the rear frame, with abandoned welding/service tools below, preserving both native doors.
- Coolant Plant: separated pipe ends, a muted frozen spill and buff/charcoal safety tape compose the rupture on the central machine bed.
- Service Shaft Landing: a tilted three-sided lift cage hangs below the balcony, one intact cable and one frayed cable attached to existing winch machinery.

Resource intent: each room reuses six to eight static service-kit instances in the existing finish batches plus one vertex-colour detail mesh. Transmission alone adds one 512×256 canvas screen (0.667 MiB RGBA8 with full mip upper bound). Material and screen texture disposal belong to the existing room lifecycle. No measured draw/triangle/readiness result is claimed yet.

First runtime attempt (`dress13-services-r1`, frozen source67f4007) stopped before any accepted PNG: Freight Hold tour returned GL_INVALID_ENUM1280 with no page errors. Investigation isolated the new compressed Brood normal map's retained warmup sampler: an ordinary DataTexture inherited a compressed ASTC pixel-format enum. Root is correcting that placeholder; this failed parent is diagnostic history and is not visual acceptance.

## Freight Hold — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. The shifted gantry reads clearly and the marine remains unobstructed, but most added cases were buried behind its load.
Moved the crushed three-crate stack onto the front-left machinery bed and enlarged it 20–25%; the spill remains north of the fight circle. Final tour/calm recheck pending the shared second batch.

## Breached Loading Bay — round1 → correction

Opened native fight-tour02 and exact480 tour02/03 against final6. Foam and bent hull read, but the dragged cargo was entirely inside the wound and did not connect to the dock floor.
Pulled the first three cases back along the port shoulder and exposed two low dark drag scars on the apron, preserving the central turning circle and broad port route. Final tour/calm recheck pending the shared second batch.
