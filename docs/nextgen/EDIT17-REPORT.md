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
3. Timed pincer staging, relay and newly open escort exit.
4. Attempted-action denial at the cursor.
5. Contextual specialist weapon offer.
6. Rig mastery callout.
7. Contextual onboarding, including Brute recovery, Brute evasion and priority target coaching.
8. Remaining native objective, encounter cue, room opener or authored fallback. Only one of these supplies copy.

The condition name and timer are status. Extra condition advice is absent from combat. Ability bindings, reload state, stocks, warnings and checkpoint feedback remain HUD information. Explicit ability inspection remains available.

## Verification

The production build passed. The initial heavy capture's projected body bounds, within 5.5 m and against the HUD reservation, were 0 of 11 below the clearance line in Crew Checkpoint, 0 of 14 in Overload Floor and 1 of 13 in Relay Racks. The Relay Racks body extended 38 CSS px below the line. This was measured before the last camera contact-priority adjustment. Final kiting clearance at both resolutions, per-item matched pairs, later junction word counts and both complete bot campaigns still need verification. The first Cryo run hit the runner's 20-second screenshot timeout before combat. The first Pyro run was interrupted by the host restart.
