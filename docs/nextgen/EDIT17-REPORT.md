# EDIT17 editorial pass

The comparison uses the R15 final10 references and production captures under `artifacts/nextgen/edit17/`. I inspected the initial five new captures at 1920×1080 and 480×270. These were the heavy, route and scripted death fixtures.

| Item | Before | After | Retained |
| --- | --- | --- | --- |
| 1 | `final10/native-heavy/pyro-pressure-1.png` has four instructions: medkit, intercept the flank, read the flank and switch to pistol. | The three `combat-heavy-*-01.png` frames each show one coaching instruction. The priority order below also governs teaching moments outside those frames. These frames use different combat setups. | Drill opt-out until payout, control keys and checkpoint receipts. |
| 2 | The native-heavy frames place hit numbers and friendly residue in the area used to read incoming attacks. | Friendly numbers are suppressed within 1.5 m and on projected hostile priority shapes. The friendly ground opacity cap around the marine is lower and imminent bearings intersecting the dock are lifted above it. | Hit confirmation, warning geometry and distant damage numbers. |
| 3 | `final10/twenty-kiting.png` shows bodies behind the dock in Relay Racks and Crew Checkpoint. | The dock keeps the selected weapon and four numbered alternatives. A switch briefly reveals all jobs. Camera lead and contact selection give lower nearby threats more weight. | Full-body marine fit, resizing and authored room bounds. |
| 4 | `final10/encounters/play16-pincer-open-*.png` retains the staging instruction. The escort and brood frames show warning rings on runners and interruption copy in the corner. | Live gate state replaces the old line. Native warning synchronization drops escort warnings, the Matron owns the interruption caption and pod withering follows sac collapse. | Red attack shapes on committed hostiles and cyan retreat direction. |
| 5 | `final10/encounters/play16-escort.png` shows the fleeing tail after breaking the beat. | Fleeing escorts stop counting immediately for clear eligibility. An open exit signals and accepts approach, with automatic progression when the last runner leaves. | Early reward sweep and the option to shoot the runners for their existing payout. |
| 6 | The heavy Armory frame has a tray highlight with no specific tactical reason. | Rifle contact with live plate can offer Plasma at the contact. A clear pair of pods or flankers beyond native arming distance can offer Rocket. Empty ammunition can offer Pistol. Each offer has three visible exposures per browser profile. | Existing armor-contact presentation, reload state and weapon balance. |
| 7 | `final10/screen-extra/run15-junction-3-diagnostic-gallery.png` asks the player to combine separate cost, benefit, condition and consequence lines. | `route.png` shows the first junction with 13 and 10 words respectively, counting words and numbers and excluding separators and keyboard badges. It is a different junction from the cited reference. Outcome first, then encounter and concise condition terms, with delayed effects under Later. | Route illustrations, keyboard shortcuts and unaffordable choices with a short explanation. |
| 8 | `final10/screen-extra/rig-arc-{equip,quick}.png` shows the primary switching between the successor actions. | Equip follows the inspected rig and comes first in action order. The secondary uses the saved rig when present. | The first-launch Cryo recommendation and native rig shortcuts. |
| 9 | `final10/screen-extra/onb14-death-stalker.png` reads “1 damage” alongside 150 from the same source. | `dead.png` labels the final-hit amount as HP and armor lost and the adjacent values as room loss by source. The native ledger records actual resource loss on each hit, so a small fatal loss alongside a larger cumulative source is valid. | Source-specific retry advice and recorded room history. |

## Prompt order

1. Active awakening, augment and Spitter cover lessons, including their confirmation. A lesson suppresses idle placement previews.
2. Matron interruption receipt.
3. Live pincer state, active relay, escort break receipt and newly open escort exit.
4. Attempted-action denial at the cursor.
5. Contextual specialist weapon offer.
6. Rig mastery callout.
7. Contextual onboarding, including Brute recovery, Brute evasion and priority target coaching.
8. Remaining native objective, encounter cue, room opener or authored fallback. Only one of these supplies copy.

The condition name and timer are status. Extra condition advice is absent from combat. Ability bindings, reload state, stocks, warnings and checkpoint feedback remain HUD information. Explicit ability inspection remains available.

## Verification

The production build passed. The initial heavy capture's projected body bounds, within 5.5 m and against the HUD reservation, were 0 of 11 below the clearance line in Crew Checkpoint, 0 of 14 in Overload Floor and 1 of 13 in Relay Racks. The Relay Racks body extended 38 CSS px below the line. This was measured before the last camera contact-priority adjustment. The kiting recaptures and both complete bot campaigns are recorded below. The first Cryo run hit the runner's 20-second screenshot timeout before combat. The first Pyro run was interrupted by the host restart.

### 1080p kiting and junction recaptures

The 1920×1080 capture produced 18 frames. For the kiting samples, I compared the projected body bounds of every enemy within 5.5 m to the HUD reservation's upper edge. This is stricter than counting only intersections with the dock's horizontal span. Relay Racks had 0 overlaps across 10 body observations, with at least 186 CSS px of clearance. Crew Checkpoint had 0 across 24, with at least 74 px. Overload Floor had 0 across 18, with at least 44 px. These captures were made before the compact row was shortened.

Junction 1 now shows 19 and 16 words, junction 2 shows 16 and 18, and junction 3 shows 18 and 17. Counts use the visible title, outcome, fight and condition terms plus Later where present, excluding mathematical separators and number-key badges. The reference junction 3 screenshot contains 28 and 35 words respectively by the same method. Delayed text is folded. The illustrated cards and condition tradeoffs remain because the route needs both an immediate decision and a preview of the fight.

Matched 1080p pairs are in `final10/encounters/` → `edit17/final/` for the three pincer states and cover, `final10/onboarding/onb14-mastery-pyro-awakening-bay.png` → `edit17/final/onb14-mastery-pyro-awakening-bay.png` for mastery, and `final10/screen-extra/` → `edit17/final/` for the freight and workshop junctions, Arc selection and the Stalker death fixture. The matched Pyro mastery fixture goes from four instructions, including the duplicate Detonate text in the ability tray, to one. The matched Stalker fixture still records a final loss of 1 and a room total of 150, with separate labels and its retry lesson intact.

The Cryo Story retry at seed 1729 cleared all six requested rooms and recorded zero errors in `artifacts/nextgen/playtest/edit17-cryo-final/report.json`. It launched from the checkpoint production build. A subsequent production build passed after the encounter-presentation and compact-row follow-ups.

The Pyro Standard retry at seed 1729 cleared all six requested rooms and recorded zero errors in `artifacts/nextgen/playtest/edit17-pyro-final/report.json`. Both campaigns used the native bot with `--fast --startup-timeout-ms=180000`. Bot policy needed no change. At the second junction, the reference cards contained 18 and 40 words, compared with 16 and 18 in the recapture. The reference requisition was unaffordable in its staged inventory.

### 720p and final encounter frames

At 1280×720, Relay Racks had 0 overlaps across 10 nearby body observations with at least 34 CSS px to spare. Crew Checkpoint had 0 across 19 with at least 23 px. Overload Floor had 0 across 19 with at least 23 px. The 720p frames and their 480×270 reductions are under `artifacts/nextgen/edit17/final720/`. The clearance numbers cover the 5.5 m radius used by the camera's nearby-contact fit. Some distant enemies in the staged crowd still extend into the tray.

The matched Matron and escort recaptures are under `artifacts/nextgen/edit17/encounter-final/`. The Matron interruption receipt is adjacent to its sac. The retreating Brute keeps its cyan direction marker and loses the red ring at its feet. The upper red arrival ring in that frame remains at a separate spawn point.

Coverage gaps remain for a matched capture of each of the three specialist prompts, the previous-rig button state and a frame proving the optional exit while only runners remain. The escort frame shows an earlier beat in the room. The two campaign runs preceded the last HUD-priority change for the pincer and escort receipts. The production build passed after that change.
