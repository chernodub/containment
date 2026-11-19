# MOTION14 combat animation

The largest improvement is the Brute's warning. Its blade previously reached its final height before the native warning was halfway through. It now opens the shoulder, lifts the leading blade over the rear leg, drives through the hit, and leaves the head down while the blade settles. On the Crawler, an ordinary rifle shot now removes support from the near feet. The second contact changes which foot catches it. The killing shot inherits that pose.

## Gameplay-scale review

These are my scores after watching the matched strips, including the 480×270 room view. A score of 7 means I can distinguish the action repeatedly in the room and still see an avoidable weakness. Each filename identifies the corresponding native PNG in both capture directories. The `camera/` directory has the matching room view as WebP. The final `review/native/` and `review/quarter/` layouts put each group of ten before cells immediately above the same ten after cells. Frame numbers start at one. [Baseline gallery](../../artifacts/nextgen/motion14/before/index.html) · [Final gallery](../../artifacts/nextgen/motion14/after/final/index.html) · [Frame-by-frame notebook](plans/MOTION14-review.md)

| Action | Before → after / 10 | Matched strip | What carries at fighting scale |
|---|---|---|---|
| Marine forward run | 4.5 → 7.0 | `marine-run-0.png` | The pack banks over the supporting knee. The shorter swing leaves room for the pelvis to shift. |
| Marine strafe | 4.0 → 7.0 | `marine-run-90.png` | The trailing shoe crosses while the leading knee opens. The gun keeps its aim line. |
| Marine backpedal | 4.0 → 6.5 | `marine-run-180.png` | A short rear reach and a pitched toe distinguish this step from forward travel. |
| Push-off and braking | 4.5 → 6.5 | `marine-stop-start.png` | The hips sink on the last plant, rebound, then lean into the next push. |
| Rifle burst | 4.0 → 6.5 | `marine-fire-rifle.png` | The stock seats against the shoulder, the muzzle climbs over five shots and brass clears the helmet. |
| Shotgun action | 5.5 → 7.0 | `marine-fire-shotgun.png` | The longer fore-end pull opens the elbow, followed by a short push home. |
| Crawler hit, hit, kill | 3.5 → 7.0 | `crawler-weapon-sequence-rifle.png` | The shell banks, the next shot rakes the catching claw out, and the skid continues into the fold. |
| Spitter light contact | 4.5 → 6.0 | `spitter-light-hit.png` | The thorax checks over the loaded side. The far feet remain available for support. |
| Brute shotgun hit | 5.0 → 6.5 | `brute-weapon-hit-shotgun.png` | The near shoulder gives while the outside leg carries the chest. |
| Brute shotgun kill | 5.0 → 6.5 | `brute-weapon-kill-shotgun.png` | A single fatal contact gets a shoulder check before the heavy side-down collapse. |
| Stalker lunge | 4.0 → 7.5 | `stalker-attack.png` | Staggered claw heights open the guard, the body stretches on strike and the trailing foot catches behind buried scythes. |
| Brute cleaver | 3.5 → 7.5 | `brute-attack.png` | The blade traces an arc over the back leg. Its low tip and dropped head mark the recovery. |
| Carrier brace under load | 4.5 → 6.5 | `carrier-attack.png` | The feet widen in sequence. The sac follows the rising and turning thorax. |
| Carrier heavy hit | 4.5 → 6.5 | `carrier-heavy-hit.png` | The first check flattens the brood mass across the feet and it takes weight again from below. |
| Carrier stagger | 4.0 → 7.5 | `carrier-stagger.png` | The second check drops one side. The sac remains lateral while the single-hit version is upright. |
| Kinetic victim | 5.0 → 6.5 | `crawler-death-high-impulse.png` | The feet trail and the shell folds along the beam. The native launch dominates the wide view. |
| Cryo victim | 4.5 → 6.0 | `crawler-death-frost.png` | A held outline, a brittle asymmetric break, then separated pieces. |
| Fire victim | 4.0 → 7.0 | `crawler-death-burn.png` | Recoil changes into an alternating raised-leg flail and a compact curl. |
| Arc victim | 4.0 → 6.5 | `crawler-death-arc.png` | A wide rigid brace holds twice, then support cuts out from one side. |

## What drives the poses

- The eight directional run cycles are 18 ticks at 60 Hz. Foot travel during stance uses the measured source-to-world scale at 220 simulation units/s. The pelvis drops and turns toward the planted foot. Ribs and shoulders turn back, the head compensates, and the arm targets follow with a delayed lift. `m10-run-*`, `m10-start-*`, `m10-stop-*` and `m10-reversal-*` retain the existing velocity-driven selection. Braking keeps the existing bounded foot correction until the transition has passed.
- `m10-fire-rifle` travels from wrist to elbow to shoulder over six ticks. The receiver briefly pitches above aim, with a capped, damped addition across a burst. Existing accepted-shot recoil starts the clip. `m10-fire-shotgun` has a longer stock kick and fore-end pull, push and re-seat. Moving fire uses the prepared upper-body action and the existing grip. Brass and directional impact streaks reuse the existing debris and liquid particle pools.
- All five current hostile families have four light and four heavy directional takes. Light contact lasts about 183 ms. A distinct contact within 200 ms selects the heavy take. Same-tick pellets share one reaction. A rapid killing shot holds the last living pose for the first 48 ms of the ordinary 400 ms fall. A lone heavy killing contact samples the directional shoulder check first. The drawn body's slide interpolates from the hit offset inside the existing bound. The native actor, accepted impulse and physics handoff retain their existing ownership.
- Stalker, Brute and Carrier sample `m10-windup`, `m10-strike` and `m10-recovery` over the native phase progress from zero through one. Their ordinary wind-up/strike/recovery durations are respectively 460/90/650, 700/120/550 and 660/120/500 ms. The stretched strike begins at accepted contact. A short smear and the overshoot land inside that strike phase. Rotation-only hit or elemental deltas blend over an ongoing warning. Carrier uses `m10-stagger` on repeated contact, and the tail chain is baked two 30 Hz drawings behind its thorax across the pack.
- Each hostile pack adds `m10-overdrive-kinetic`, `m10-overdrive-fire`, `m10-overdrive-arc` and `m10-death-kinetic`. The existing frost, burn and arc terminal takes were reauthored. Cryo holds the currently sampled living pose. The short pre-shatter take supplies the brittle break. The renderer sends accepted ability target IDs, or accepted weapon contacts during Overclock, to living actors and recently retired corpses. That last lookup matters because a lethal contact and its target receipt can arrive in either order within a tick.

All six animation-only files retain the complete original node records, hierarchy and rest transforms. Every original clip name remains present. The marine pack contains 69 clips and each hostile pack contains 27. Net motion-pack growth across all six is 495,392 bytes. The generator commands and the names used by the loader are documented alongside the sources. [Blender sources](../../tools/assets/m10-motion/README.md)

## What the evidence measures

The 25 isolated rows share the production gameplay camera. Each samples 30 cells at 50 ms intervals. The paired weapon row prescribes its target and killing impulse. In the Crew Checkpoint pack the player fired 11 times with combat text disabled. The same moving Crawler received three native projectile contacts at 1.083, 1.200 and 1.300 simulation seconds in both builds. The third killed it. The translated lanes use native movement and an actual floor. The four additional live casts have per-target receipts next to their sheets. The controlled elemental-death row supplies the terminal read for survivors in the live elemental lanes. [Rifle pack](../../artifacts/nextgen/motion14/after/final/pack/contact-480.webp) · [Translated strafe](../../artifacts/nextgen/motion14/after/final/travel/run-90.webp) · [Native Overdrives](../../artifacts/nextgen/motion14/after/final/overdrives)

| Registered silhouette comparison | Before | After |
|---|---|---|
| Stalker adjacent anticipation drawings, F1→4 / 4→7 / 7→9 | .694 / .971 / .982 | .451 / .372 / .682 |
| Brute adjacent anticipation drawings, F1→5 / 5→9 / 9→13 | .825 / 1.000 / 1.000 | .687 / .698 / .777 |
| Carrier heavy versus stagger, F14 / F16 / F18 | .674 / .878 / .925 | .458 / .492 / .577 |

IoU uses the existing native masks registered in the 1920×1080 viewport. An IoU of 1 means the two occupied pixel sets coincide. The Carrier studies share the initial contact. Their late separation supplies more information than either row's minimum overlap with idle. The Stalker's strike has zero overlap with idle in both builds because the body travels down its native strike lane. [Baseline IoU](../../artifacts/nextgen/motion14/before/iou.json) · [Final IoU](../../artifacts/nextgen/motion14/after/final/iou.json)

Translated runs sampled both shoes every 60 Hz tick. During ticks 20–53, an interval counted as low when both endpoints were within 4.5 cm of that shoe's minimum height over the steady stride. Median horizontal travel rounded to zero in all six cases. Maximum one-tick travel in these low intervals changed from 4.4 to 1.9 cm forward, 4.9 to 1.3 cm sideways, and 10.1 to 0.5 cm backward. This includes entry and exit from a plant. It measures these recorded lanes only.

## Weakest reads

The rifle wrist and receiver still overlap the helmet at some aim angles. At quarter resolution the barrel angle and the brass are clearer than the order in which the arm joints take the load. The frozen Crawler's crack lasts briefly and its feet are small against the Whiteout floor. In the full Meltdown lane the near Crawler's flail is also easier to see in motion than in a single 480-pixel cell. The wider Brute was outside the early fire ticks and correctly kept its own pose. Brute's dark blade tip can disappear against its own armor during extraction. On a native Railbreaker hit the simulation can launch a victim sideways almost immediately. The authored fold follows the beam line locally and the native launch determines its path across the room.

## Cost and verification

The untouched checkout and final checkout both passed `npm run build`. The benchmark used 25 replenished legal hostiles, all four rigs, High and Low, three 20-second realtime trials per case, in the same two heavy rooms selected by the baseline scan. Each table cell is the median of twelve trial percentiles. Values are CPU phase-wall milliseconds measured by the existing tool.

| Room and tier | CPU p50 before → after | CPU p95 before → after |
|---|---:|---:|
| Safety Interlock, High | 19.7 → 16.0 | 39.2 → 32.5 |
| Safety Interlock, Low | 13.6 → 12.4 | 31.0 → 28.7 |
| Coolant Plant, High | 17.5 → 12.3 | 34.1 → 26.2 |
| Coolant Plant, Low | 12.5 → 9.0 | 27.2 → 18.3 |

The matched runs showed no measurable heavy-combat CPU regression. The shared ten-core host was heavily loaded, and the amount of simulation completed in 20 wall seconds varied. These figures cannot attribute a speedup to the clips or establish hardware FPS.

Both 48-trial sweeps recorded zero runtime errors, zero measured combat program creations, zero GL errors and zero context losses. Peak retained program inventory was 301 in both. Both commands exited 2 on the draw budget. Three baseline trials and six final trials exceeded the tool's 330-draw headroom. Peak draws went from 341 to 353. The two final Pyro cases above 350 progressed through 14.4 and 15.1 simulation seconds, compared with 9.2 and 6.7 seconds in the corresponding baseline trials. [Before benchmark](../../artifacts/nextgen/motion14-before/benchmark.json) · [After benchmark](../../artifacts/nextgen/motion14/bench-after/benchmark.json)

A second Pyro/High comparison in Safety Interlock ran through 15 simulation seconds per trial. Peak draws were 337, 334 and 345 before, and 339, 359 and 345 after. All six exceeded the 330-draw headroom. This repeated the resource miss, including one final trial above 350. The realtime fixture drives its controls by elapsed wall time. Equal simulation duration still permits different inputs and encounter populations.

The final diagnostic replayed identical controls for 900 fully rendered native ticks, replenishing 17 enemies in each build. Draw counts matched at the median (272), p95 (336) and peak (349). Both still exceeded 330. Single-replay CPU p50/p95 was 8.3/11.8 ms before and 9.0/11.6 ms after. In the three equal-duration realtime Pyro trials the median CPU p50 was 25.5 ms before and 22.0 ms after. The fixed-tick replay isolates the draw comparison. One such timing pair cannot isolate a CPU cost change.

The native desktop playtest used the Arc rig, seed 1729 and the requested six-room limit. It cleared Awakening Bay, Passenger Vault, Residential Gallery, Communal Atrium, Crew Checkpoint and Armory. It reached `room-limit` with zero errors and zero recorded defects. [Campaign report](../../artifacts/nextgen/playtest/motion14-arc-six/report.json)

The branch includes the baseline and final native strips, gameplay-camera sheets, masks, quarter-size comparisons from the critique rounds, world-shoe receipts and the live encounter sheets. The worktree also retains the individual pack screenshots, intermediate native strips and full benchmark traces. [Per-trial measurements](../../artifacts/nextgen/motion14/benchmark-summary.json)
