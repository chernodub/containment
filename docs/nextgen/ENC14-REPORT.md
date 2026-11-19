# ENC14 — encounter consequences and supply decisions

## Story pressure

| Room | Story late body factor | Story light melee admissions | Standard late body factor | Standard light melee admissions |
| --- | ---: | ---: | ---: | ---: |
| 10 | 1.00 | 2 | 1.00 | 2 |
| 11 | 1.37 | 3 | 2.00 | 4 |
| 12 | 1.73 | 3 | 2.00 | 4 |
| 13 onward | 2.10 | 4 | 2.00 | 4 |

The late factor multiplies Story's 1.25 or Standard's 1.50 base factor before group counts are rounded. The integer Story admission cap rounds the interpolated 2.67 and 3.33 to three. Standard keeps its original ramp. Story players arriving below 50 health in Safety-interlock Station get an entrance health pickup worth 28 after the Story pickup factor. An actual damage total of at least 30 within a rolling 1.5 seconds grants the existing two seconds of 75% light-contact mitigation on Story and Standard. A hit above 20 still triggers that grace, and hits during grace do not extend the accumulated-damage trigger. Veteran keeps its original ramp and single-hit trigger.

## Encounter scripts

| Rule | Decision and consequence | Rooms |
| --- | --- | --- |
| Leader | Kill the marked Carrier to stop pending arrivals and send the escorts back toward their nearest breach. Shooting a retreating escort pays the full kill reward. Escaping escorts pay half, rounded down. The cancellation cue reads **ESCORT BROKEN**. | Communal Atrium, Crew Checkpoint, Freight Hold, Diagnostic Gallery, Safety-interlock Station, Infested Workshop, Shielding Gate, Containment Annulus, Overload Floor |
| Pincer | Wipe out the crawler screen within 14 seconds, before the Stalker arm dispatches. The screen break satisfies the beat and the next beat can start after the lull. | Safety-interlock Station, Containment Annulus, Overload Floor |
| Brood | Interrupt a Matron brood or destroy both pods from one brood to stagger the Matron for 1.8 seconds and suppress the still-undispatched crawler reinforcement group. | Swarm Junction |
| Warden | The four scheduled Wardens use different authored offsets around the available breaches in Armory, Relay Racks, Coolant Plant and Manual-control Chamber. The native charge collision owns the wall stun. | Rooms 6, 9, 13 and 19 |

Once the objective is ready and the last three non-priority enemies remain, siege and priority beats withdraw survivors immediately. Other authored beats rush at 160% movement for up to 2.2 seconds, then withdraw. A retreat lasts up to two seconds. Overload Floor now opens with the pincer, moves into a priority beat and ends on a single relay hold.

## Supply decisions

A medkit costs 35 credits and a grenade pair costs 20 at the first stop. Each eligible installed augment gets its own priced upgrade button, sharing one stock unit per stop. At the last stop, 650 credits buy a one-use resuscitation that restores 45 health after a fatal hit on Overload Floor. The save treats the missing revive field as an unused purchase slot and validates the flag and its room range.

| Junction after room | Offer | Terms |
| --- | --- | --- |
| 3 | Early salvage | Take 45 credits with no extra enemies. |
| 7 | Field requisition | Pay 70 credits for 25 armor and up to two grenades. |
| 11 | Field medicine or field workshop | Restore 35 health immediately for free, or pay 180 credits to upgrade the eligible installed augment named on the card. |
| 15 | Warden cache | Fight a Warden and escort in Swarm Junction for 160 credits on clear. |
| 18 | Secure the capacitor | Charge an extra relay in Manual-control Chamber for a full Overdrive charge on clear. |

A depleted player can take medicine before the room-12 pincer, while a healthy player has a reason to invest in a specific power. Priority fire can end a fight while it still has visible bodies, and the finale asks the player to break through and hold once.

## Evidence

All four 80-run cohorts finished using the 20 KIT13 seeds per rig. Baseline gameplay and policy were frozen before edits, and the original and revised cohorts ran concurrently as execution time increased. The before/after comparison includes both gameplay and bot-policy changes. The baseline Standard cohort reported two stalls. The two post-change cohorts ended in a clear or death on every seed. Death-room distributions count deaths only.

Story improved from 57 to 67 clears out of 80 and every rig reached 14/20. Room 14 caused seven of 13 deaths, above the 25% target. Standard improved from 46 to 57 clears. Cryo and Arc reached 16/20, one above the upper bound, while Breacher and Pyro landed in range. Mean cleanup fell 43.4% on Story and 42.2% on Standard. Pyro's per-rig reduction was 39.7% on Story and 38.2% on Standard. Every winning post-change Arc finale was under 80 seconds in simulation. The longest were 61.5 seconds on Story and 57.6 seconds on Standard. Median winning credits fell from 627 to 149 on Story and from 738 to 155 on Standard. One tuning pass was measured.

The cleanup observer samples active simulation time per beat after a relay is charged or priority reinforcements are observed canceled, or once the schedule is exhausted and one to three beat-tagged enemies remain. Legacy carrier offspring without a beat tag limit the accuracy of this measure.

| Cohort | Rig | Runs | Completions | Deaths | Median death room | Largest death-room share | Mean seconds per room | Mean cleanup seconds per room | Median winning credits |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| before story | breacher | 20 | 18 | 2 | 12.0 | 2/2 (room 12) | 53.8 | 16.8 | 483.0 |
| before story | cryo | 20 | 13 | 7 | 11.0 | 2/7 (room 10) | 58.4 | 19.1 | 889.0 |
| before story | pyro | 20 | 17 | 3 | 17.0 | 1/3 (room 15) | 49.0 | 13.5 | 614.0 |
| before story | arc | 20 | 9 | 11 | 16.0 | 3/11 (room 17) | 51.6 | 15.2 | 533.0 |
| before standard | breacher | 20 | 7 | 12 | 12.0 | 4/12 (room 12) | 51.5 | 16.4 | 665.0 |
| before standard | cryo | 20 | 13 | 6 | 11.0 | 3/6 (room 11) | 60.4 | 18.1 | 917.0 |
| before standard | pyro | 20 | 11 | 9 | 14.0 | 4/9 (room 12) | 48.2 | 12.8 | 818.0 |
| before standard | arc | 20 | 15 | 5 | 12.0 | 2/5 (room 12) | 56.0 | 15.9 | 628.0 |
| after story | breacher | 20 | 19 | 1 | 17.0 | 1/1 (room 17) | 43.0 | 9.1 | 142.0 |
| after story | cryo | 20 | 16 | 4 | 12.5 | 2/4 (room 14) | 48.0 | 10.4 | 151.5 |
| after story | pyro | 20 | 17 | 3 | 14.0 | 2/3 (room 14) | 40.2 | 8.2 | 149.0 |
| after story | arc | 20 | 15 | 5 | 14.0 | 3/5 (room 14) | 43.2 | 8.9 | 142.0 |
| after standard | breacher | 20 | 11 | 9 | 12.0 | 2/9 (room 10) | 43.3 | 8.9 | 178.0 |
| after standard | cryo | 20 | 16 | 4 | 10.5 | 2/4 (room 11) | 50.6 | 10.2 | 132.5 |
| after standard | pyro | 20 | 14 | 6 | 14.5 | 2/6 (room 14) | 42.0 | 7.9 | 161.0 |
| after standard | arc | 20 | 16 | 4 | 13.0 | 2/4 (room 12) | 46.8 | 9.4 | 158.0 |

| Cohort | Room | Entered | Mean damage | Mean seconds | Mean cleanup |
| --- | ---: | ---: | ---: | ---: | ---: |
| before story | 9 | 79 | 39.7 | 50.9 | 18.8 |
| before story | 10 | 79 | 74.8 | 70.5 | 23.2 |
| before story | 11 | 77 | 73.1 | 66.5 | 16.4 |
| before story | 12 | 74 | 87.4 | 70.4 | 23.0 |
| before story | 13 | 69 | 85.4 | 65.3 | 15.7 |
| before story | 14 | 69 | 111.7 | 69.9 | 12.7 |
| before standard | 9 | 77 | 45.4 | 56.6 | 18.8 |
| before standard | 10 | 77 | 79.3 | 74.1 | 22.9 |
| before standard | 11 | 75 | 73.5 | 66.3 | 15.5 |
| before standard | 12 | 69 | 99.4 | 72.5 | 22.3 |
| before standard | 13 | 59 | 98.2 | 69.0 | 15.7 |
| before standard | 14 | 59 | 111.6 | 72.6 | 11.2 |
| after story | 9 | 80 | 34.6 | 42.8 | 10.8 |
| after story | 10 | 80 | 78.3 | 62.0 | 13.5 |
| after story | 11 | 79 | 42.9 | 46.0 | 7.7 |
| after story | 12 | 78 | 42.3 | 47.4 | 7.9 |
| after story | 13 | 78 | 100.8 | 60.6 | 9.7 |
| after story | 14 | 78 | 105.7 | 63.3 | 7.1 |
| after standard | 9 | 79 | 59.0 | 50.1 | 11.2 |
| after standard | 10 | 79 | 75.2 | 66.0 | 14.3 |
| after standard | 11 | 76 | 59.3 | 56.0 | 6.0 |
| after standard | 12 | 72 | 55.5 | 52.0 | 12.8 |
| after standard | 13 | 68 | 101.2 | 65.0 | 8.3 |
| after standard | 14 | 67 | 101.3 | 67.9 | 7.3 |

**Before Story** used 80 reports. Arc averaged 92.7 seconds in the finale across 9 clears. Mean cleanup was 16.1 seconds per room.

**Before Standard** used 80 reports. Arc averaged 101.3 seconds in the finale across 15 clears. Mean cleanup was 15.7 seconds per room.

**After Story** used 80 reports. Arc averaged 46.7 seconds in the finale across 15 clears. Mean cleanup was 9.1 seconds per room.
First-stop credits had a minimum of 81.0 and a median of 88.0 across 80 arrivals.

**After Standard** used 80 reports. Arc averaged 46.1 seconds in the finale across 16 clears. Mean cleanup was 9.1 seconds per room.
First-stop credits had a minimum of 81.0 and a median of 90.0 across 80 arrivals.

| Native rig | Difficulty | Rendering | Outcome | Rooms cleared | Errors | Finale seconds | Final credits |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| arc | standard | Fast | complete | 20 | 0 | 57.8 | 228 |
| breacher | standard | Fast | complete | 20 | 0 | 58.0 | 190 |
| cryo | story | Ordinary | wall-timeout | 16 | 0 | — | 428 |
| cryo | story | Fast | complete | 20 | 0 | 38.7 | 133 |
| pyro | standard | Fast | complete | 20 | 0 | 34.0 | 192 |

| Mode | Rig | Matched seeds | Mean cleanup before | Mean cleanup after | Change |
| --- | --- | ---: | ---: | ---: | ---: |
| story | breacher | 20 | 16.8 | 9.1 | -46.0% |
| story | cryo | 20 | 19.1 | 10.4 | -45.8% |
| story | pyro | 20 | 13.5 | 8.2 | -39.7% |
| story | arc | 20 | 15.2 | 8.9 | -41.6% |
| standard | breacher | 20 | 16.4 | 8.9 | -45.6% |
| standard | cryo | 20 | 18.1 | 10.2 | -43.4% |
| standard | pyro | 20 | 12.8 | 7.9 | -38.2% |
| standard | arc | 20 | 15.9 | 9.4 | -41.0% |

Mean cleanup seconds by observed beat, with beat order left to right. A dash indicates no room samples.

| Room | Before Story | After Story | Before Standard | After Standard |
| ---: | --- | --- | --- | --- |
| 1 | 0.5, 2.7 | 0.5, 2.7 | 0.4, 2.3 | 0.4, 2.3 |
| 2 | 4.2, 7.6, 2.5 | 3.5, 4.6, 2.3 | 4.1, 7.3, 2.3 | 3.6, 4.6, 2.3 |
| 3 | 2.9, 3.0, 9.4 | 2.1, 2.8, 4.4 | 2.3, 3.3, 8.7 | 1.9, 2.9, 4.2 |
| 4 | 6.1, 4.6, 7.8, 3.6 | 3.4, 3.4, 3.4 | 5.8, 4.4, 7.4, 2.9 | 3.3, 3.4, 3.4 |
| 5 | 4.5, 8.3, 4.8 | 3.2, 4.4, 2.0 | 3.6, 7.7, 6.4 | 3.0, 3.9, 1.9 |
| 6 | 5.4, 5.1, 2.4 | 3.7, 3.3, 1.7 | 8.0, 4.9, 2.1 | 3.3, 3.2, 1.8 |
| 7 | 1.8, 5.0, 5.0 | 1.6, 3.1, 1.7 | 1.9, 4.7, 6.5 | 1.8, 3.2, 1.5 |
| 8 | 8.0, 3.5, 4.6, 1.2 | 3.8, 2.2, 2.9 | 6.3, 3.2, 4.7, 0.6 | 3.5, 2.3, 2.8 |
| 9 | 4.8, 6.5, 7.5 | 2.6, 4.9, 3.3 | 3.4, 8.2, 7.3 | 2.3, 6.0, 3.0 |
| 10 | 7.9, 5.2, 4.1, 6.1 | 4.0, 2.9, 2.8, 3.8 | 8.0, 4.5, 3.8, 6.7 | 4.7, 3.0, 2.6, 4.1 |
| 11 | 9.5, 4.6, 2.2 | 1.8, 3.6, 2.4 | 9.5, 4.3, 1.7 | 1.6, 3.0, 1.4 |
| 12 | 4.5, 11.3, 7.2 | 0.0, 6.3, 1.6 | 3.6, 12.4, 6.3 | 0.0, 11.4, 1.4 |
| 13 | 2.8, 8.3, 4.6 | 1.6, 5.5, 2.6 | 2.0, 10.0, 3.7 | 1.7, 4.3, 2.4 |
| 14 | 5.2, 4.8, 2.6 | 2.9, 2.4, 1.8 | 4.8, 4.1, 2.3 | 2.8, 2.7, 1.8 |
| 15 | 1.3, 7.1, 3.9 | 1.4, 1.6, 3.2 | 1.7, 7.6, 3.5 | 1.4, 1.6, 3.0 |
| 16 | 5.5, 3.7, 9.9, 3.4 | 14.8, 2.4, 7.6, 1.7 | 5.3, 2.8, 10.9, 3.4 | 13.6, 1.9, 7.9, 1.9 |
| 17 | 2.0, 7.3, 4.1 | 1.6, 1.1, 2.9 | 1.4, 7.5, 3.3 | 1.4, 1.2, 2.7 |
| 18 | 4.0, 2.1, 6.0 | 0.0, 1.6, 1.1 | 3.8, 1.7, 6.1 | 0.0, 1.5, 1.2 |
| 19 | 4.6, 8.7, 1.8 | 2.7, 4.0, 1.8, 2.3 | 4.2, 8.2, 1.9 | 2.7, 4.4, 1.3, 2.2 |
| 20 | 5.6, 3.6, 5.3, 8.6 | 0.0, 1.2, 6.0 | 6.4, 3.8, 5.5, 9.7 | 0.0, 1.1, 7.6 |

The clean setup build and production build passed. The first native launch received localhost EPERM. After escalation the ordinary Cryo run reached the one-hour runner limit after 16 clears with zero runtime errors. The four serial fast-render campaigns use the same fixed simulation and native input cadence. All four cleared 20 rooms with zero runtime errors. Arc cleared Overload Floor in 57.8 active seconds. I inspected the native Story Cryo Communal Atrium combat and clear frames and the openings of Safety-interlock Station and Arc’s Overload Floor at 1920×1080 and 480×270. Its first supply-stop arrival had 89 credits. The Veteran Cryo seed-1729 first-stop probe arrived with 83 credits. The Standard Arc seed-1729 simulation spot run arrived with 96, cleared the finale in 57.6 seconds including 8.6 cleanup seconds, and finished with 369 credits.

The final build emits the escort-break cue once per beat and describes a broken pincer as a canceled flank. The Story Cryo and Standard Breacher native captures use the preceding presentation build. Standard Pyro and Arc load the final build. A Story Breacher seed-1729 replay after the presentation correction and historical-runner compatibility edit produced identical room receipts to the paired cohort.

## Remaining limitations

The pincer resolves the beat through the existing progression path. A separate exit opening is missing. A retreat blocked by geometry can expire before the escort reaches its breach. The Warden offsets change the available charge lanes, and dedicated lane-by-lane play is still needed to establish how clearly each obstacle invites the bait. The capacitor's value depends on the marine's charge at the end of Manual-control Chamber. Story now concentrates too many deaths in Service Shaft Landing. Standard Cryo and Arc are slightly above the target completion band.
