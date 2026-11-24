# PLAY26 · Recovery, pack pressure, and route consequences

## Rules

A weapon hit during melee recovery deals 15% extra damage. A gold floor mark shows the recovery window, and a gold pulse confirms a rewarded hit.

Crawlers waiting on attack capacity vary their approach radius and skitter in short arcs. Stalkers pace across the approach, Brutes step and brace, and Spitters shift their firing position between shots. A waiting Brute within reach can push a stationary marine by one player radius after 1.1 seconds, subject to floor collision. The shove deals zero damage. The pack can start a 250 ms feint at most once every 3.6 seconds. Its floor cue uses the outline pass, and the regular attack token and melee strike sequencing logic still owns real attacks.

At Relay Racks, the rehearsal wave keeps its flankers in reserve through the heavy's first recovery. Killing the heavy also releases them. The first Stalker uses a clear side arrival with the usual spawn warning, and later rooms retain their mixed waves. In Transmission Chamber, the opening Spitter establishes the receiver's cover lane before the rest of the wave arrives.

When the final hold begins on Overload Floor, a harmless acid bolt follows the covered approach into the deck geometry. The impact point is labelled Cover for four seconds. At the crossing, the objective names the short exposed and long covered routes. Both policies target the covered bank when the marine is below half health.

An off-view Spitter's locked lane appears from the start of its wind-up. The lane ends at the projected contact with the first solid blocker, including deployed rig walls, and uses a short crossbar there.

The debrief places the fatal attack's dodge beside the fatal receipt. The illustrated card names the largest source of damage taken in that room. Lesson plaques anchor to their subjects on first appearance and then use the status HUD. Route cards show the booked guardian's portrait and sector through the approach to Coolant Plant.

## Evidence

The captures use desktop staging fixtures. The exposure fixture stops during a real melee recovery, the crowd fixture waits for a live feint, and the fork fixture enters the final hold. The death fixture gives the Brute the largest damage total and the Spitter the fatal hit so both can be read on the same card.

The [recovery, feint, and death-card capture gallery](../../artifacts/nextgen/play26-review-live/index.html) and the [final fork preview](../../artifacts/nextgen/play26-cover-final/index.html) were inspected at 1920×1080 and 480×270. The crowd capture shows why the feint is easiest to read in motion. Its outline can merge with real telegraphs over the same floor at the smaller size.

## Balance

Each rig uses seeds 7, 11, 23, 99, 256, 512, 1024, 2025, 4096, 6561, 9001 and 65537. Every command ran one rig with two workers. The merged baseline uses the tree at `f2e501d5`, including the new motion assets and the recovery bonus. The historical pre-recovery figures were 39 of 48 on Standard competent and 21 of 24 on Story novice. The archived merged Standard baseline finished 38 of 48 with zero stalls. Breacher finished 8, Cryo 10, Pyro 11, and Arc 9.

Standard competent finished 36 of 48 with zero stalls. Breacher finished 7, Cryo 11, Pyro 9, and Arc 9. The 15% recovery reward and half-body shove stayed at their original settings. The first verification run found Pyro seed 6561 stuck in an Infested Workshop corner that rejected the bot's padded path. The bot now takes a legal step out after six seconds in a tight corner. That seed cleared all 20 rooms on replay and during the full rerun.

Story novice finished 22 of 24 with zero stalls. Breacher and Cryo each finished 11 of 12 after the rehearsal correction.

## Native campaigns

Both campaigns used seed 1729 and real desktop input in accelerated mode. They used the corrected rehearsal and preceded the final bot-only corner recovery. The weapon-hit shares count positive-damage weapon receipts in the input trace. The room feint counts are the maximum authoritative counter sampled in each room. Input traces sample before the next input and can omit events from the terminal step.

Cryo cleared 11 rooms and died in Safety-interlock Station with zero runner errors. The trace recorded 9 exposed hits out of 931 weapon hits, or 1.0%. Freight Hold, Loading Bay and Relay Racks consumed 53, 123 and 0 suit points respectively. The historical values were 54, 67 and 153. The rehearsal heavy began its attack and was killed before a recovery appeared in the trace. The first Stalker arrived in view with a clear lane, and the other flankers appeared about 900 ms later. Cryo died before the final fork. [Cryo campaign and trace](../../artifacts/nextgen/playtest/play26-native-cryo-rehearsal/index.html)

Cryo recorded one feint each in Freight Hold, Diagnostic Gallery and Safety-interlock Station, and two in Loading Bay. The other visited rooms recorded zero.

Pyro cleared all 20 rooms with zero runner errors. The trace recorded 5 exposed hits out of 2,096 weapon hits, or 0.24%. Pyro took the short exposed bank at about 92 health. [Pyro campaign and trace](../../artifacts/nextgen/playtest/play26-native-pyro-rehearsal/index.html)

Pyro recorded one feint each in Diagnostic Gallery, Safety-interlock Station and Overload Floor, and two in Shielding Gate. The other visited rooms recorded zero.

## Remaining weaknesses

Recovery hits were rare in both traces, and most rooms had no feints. The staged crowd makes the new animation easy to find, but even there the thin outline competes with other melee warnings at 480×270. Loading Bay remains a large damage spike on Cryo in this run. The native inputs exercise one final route on the corrected rehearsal and show how much a single run can vary.

The production build passed with Vite's large-chunk warning.
