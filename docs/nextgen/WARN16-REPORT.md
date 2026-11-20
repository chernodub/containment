# WARN16 combat warnings

WARN16 starts from the fast-forward to `nextgen` at `4d200481`. The warning renderer consumes the existing live attack shapes and clocks. The camera, effect masking and combat text use presentation-only observations.

## What changed

- The warning union draws a pale red core with dark ink on either side in its existing depth-tested draw. Circles and fans keep a readable outer leading edge for their full warning. Similar, overlapping lanes from the same enemy family share one traveling front. Their perimeter is the union of the native capsules. Intersecting lanes retain their hit shapes and the renderer avoids inking internal overlap seams. The earliest strike whose footprint can reach the marine gets the strongest edge and the final 200 ms brightness pulse.
- The red fill rises from zero at its origin to a maximum of 18% at the far edge, with an additional coverage limit for crowded frames. Its depth test stays behind the marine and visible enemy surfaces. The existing opaque-geometry ink composite restores a thin light contour on the marine and committed attackers through bright effects. The marine's existing borrowed-skin outline also comes through classified solid occluders. Both use the existing scene and composite draws. A 256-byte lookup selects committed opaque actor IDs.
- The FX14 128×72 texture keeps its actor and hostile channels and adds a 1.5 m ground footprint around the marine. Friendly opacity caps at 16% there and takes a further 92% reduction over hostile ground. Ground-sheet emission also yields over actor cores. Pyro's warm footprint breaks into embers, and stacked frost gives up coverage around occupied floor.
- A victim can have one running periodic receipt. Status and ability ticks reuse it while the effects continue, and frostbite uses the visible chill state to hold it alive. The placement margin extends past the warning's projected footprint, and text searches a smaller neighborhood before dropping a label. Native screenshot receipts include target ID, accumulated tick count and warning overlap.
- Nearby actors and sampled warning extrema under the lower HUD reservation bias the camera toward the threat by up to 1.45 m before the existing room and full-body constraints. Those constraints still arbitrate the final pose. The local panel fade remains available where the camera cannot clear the strip.

## Visual rounds

The review reference in Manual Control has a visible dark fan beside the target, with the outer edge blending into fire and the deck. The first valid renderer pass separates the pale leading arc from the deck. Atrium still has a conspicuous continuous amber perimeter at the edge of the isolated fuel effect. Freight Hold's Brute lanes read as one outline, though several bodies cover the traveling edge. The first native run cleared four rooms. Its Atrium checkpoint shows the marine beside solid cover and bright environmental haze, and has no live hostile warning at that instant.

The next pass breaks the warm boundary into embers, makes committed ink independent of the dark ink color and checks lane separation before merging. It also uses warning extrema alongside attacker centers for bottom-HUD look-ahead. The original and updated late-game native pressure images use a campaign continuation and can differ in actor pose, combat position and elapsed time.

## Evidence

[Capture pairs](../../artifacts/nextgen/warn16/index.html) · [First capture round](../../artifacts/nextgen/warn16-review1/index.html) · [First native review](../../artifacts/nextgen/playtest/warn16-review1-native/index.html)

### Native periodic damage

Passenger Vault's mid-fight receipt shows five periodic hits accumulated into 20 on a living burning target. Crew Checkpoint records two living burning targets at once. Their consolidated labels hold three ticks for 12 and two ticks for 8 respectively. The visible labels in both receipts clear the warning margin. Separate direct-hit totals remain individually readable.

- [Passenger Vault receipt](../../artifacts/nextgen/playtest/warn16-pyro-final/r2-passenger-vault-mid.json)
- [Crew Checkpoint receipt](../../artifacts/nextgen/playtest/warn16-pyro-final/r5-crew-checkpoint-mid.json)

### Late native review

Manual Control continued from the recorded Containment Annulus clear on seed 1729. Both continuations cleared room 19 with zero errors. In the first continuation, the fan at about 27.5 seconds holds its bright edge even next to the fuel field. The charge at about 11.5 seconds still has a dark far cap, so locating the route requires following its fill beyond the marine. The subsequent pass adds a muted stroke around the capsule union. In the same 11.5-second phase it closes the cap against the dark deck while the brighter moving front remains distinct. Body and solid-world occlusion still clip the stroke.

The historical pressure frame is paired with the later fan at 27.5 seconds from the same campaign context. The secondary pair compares the 11.5-second charge before and after the capsule stroke. [First continuation](../../artifacts/nextgen/playtest/warn16-pyro-pressure/index.html) · [Final continuation](../../artifacts/nextgen/playtest/warn16-pyro-pressure-final/index.html)

The requested fast Pyro run on seed 1729 cleared Awakening Bay, Passenger Vault, Residential Gallery, Communal Atrium, Crew Checkpoint and Armory with zero errors and zero runner defects. The same six-room run passed again after the final stroke-color adjustment. The final production build passed. [Final fast playtest](../../artifacts/nextgen/playtest/warn16-final-six/index.html)

### Room and crowd review

Freight Hold's original crossing outlines read as separate tangled loops. The new wide band has a single outside perimeter through the overlapping charge lanes. A turning or disconnected attacker can still retain its own front. The separate Freight Hold diagnostic staged 20 Brutes, and its selected after frame has 20 visible contacts.

The staged Atrium fan remains legible against white frost and flame. In the Armory Whiteout frame, the marine contour and suit are visible at source resolution. The stacked weather remains busy at 480×270, especially around the counter and the lower group. The foreground and bodies still hide parts of the ground edge where they physically overlap it.

Crew Checkpoint, Relay Racks and Service Shaft Landing completed all four focused kiting phases. The lower-center visible contact bounds stayed inside their recorded HUD reservation. Their closest clearance across the four after phases was approximately 7 px, 6 px and 1 px, respectively. This burst provides little before/after difference in clearance. The wide Armory scene shows the panel fade carrying the dense lower contacts where framing alone leaves them close to the action bar.

### Render verification

The final Freight Hold benchmark completed eight 20-second trials, covering all four rigs in High and Low. Each recorded zero mid-combat shader program creations. The earlier eight-second probe also recorded zero creations, and its Cryo High trial ended before it registered all four native slot receipts. The longer final matrix satisfied those existing guards on every trial. The large changes in host load limit time comparisons.

The warning uses the original FX14 union draw, friendly effects use the original priority lookup, and the actor outlines reuse the existing composite and marine overlay. WARN16 adds zero render passes. The priority texture now holds 36 KiB instead of 18 KiB. [Final benchmark receipt](../../artifacts/nextgen/warn16-final-programs/benchmark.json)

The gallery contains 15 paired views, including both 20-room sheets and the matched late native charge. It retains native color and greyscale PNGs and 480×270 reductions. The individual source frames for both room sheets are alongside the composites. Chromium closed partway through the combined room sweep after the 20 heavy frames and first four kiting frames. The focused captures and two smaller retries supply the remaining kiting cells, with all 20 present in each final sheet.
