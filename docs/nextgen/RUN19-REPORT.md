# RUN19

## Baseline map

The current campaign uses the authored beats in `src/game/waves/authoredEncounters.ts`. `EncounterDirector` applies difficulty and seed opening selection, which can move the guardian beat without changing its room. `progressionFor` also supplies guardian metadata for the fallback schedule. Both Standard seeds 1729 and 2718 have Wardens in sectors 6, 9, 13 and 19 and a Matron in sector 16. Choosing Warden cache adds a Warden in sector 16.

The first three junctions also change the opening and ship condition of the next room.

| Junction destination | Baseline alternate consequence |
| --- | --- |
| Communal Atrium | Early salvage pays 45 credits up front and 35 after Breached Loading Bay. The locker grants health and a grenade. |
| Breached Loading Bay | Field requisition trades 70 credits for armor and grenades and spaces Transmission Chamber arrivals at 1.10× intervals. |
| Safety-interlock Station | The exposed workshop trades 180 credits for an augment upgrade and grants Overdrive charge equivalent to 3,000 damage in Swarm Junction. The infirmary heals immediately. |

## Player-facing changes

At the Communal Atrium junction, Plate-breaker supplies 24 plasma rounds and puts the armoured Warden escort first in Coolant Plant. Brood supplies up to two rockets within the existing carry limit and opens Coolant Plant with a Matron and her escort. The Matron uses the native brood windup and hatching pods. This substitutes for the third Warden slot. The route name and fight appear on the entry banner in sector 13 and in the expedition record for both death and completion. Both routes pay 45 credits immediately, 35 credits after Breached Loading Bay, and recover up to 35 health and 25 armor after Coolant Plant. The two later junction deals retain their existing consequences. Saves that have already crossed the first junction without a guardian route retain their original appointments.

Passenger Vault's opening Brute gets a clear firing lane outside its swing at spawn. A real rifle hit on surviving armour produces the existing armour spark and cues key 4. Plasma uses the existing armour damage multiplier. Later, a pair of nearby light enemies moving toward the marine within a clear armed-rocket lane cues key 5. An armed blast applies ordinary splash damage and knockback. The native knockback cancels melee attacks on both enemies when the blast hits the pair. The instructions yield to active danger and persist at the next saved boundary.

Rig select shows the repeat option only when a prior rig exists. The staged completion receipt now carries 20 sectors, 284 kills and roughly 13 minutes of combat.

## Cohorts

Standard competent used seeds 1729, 2718, 31415, 42, 137 and 8675309, with three workers and a separate command for each rig. The default bot selects Brood on odd seeds and Plate-breaker on even seeds. This seed set exercises Brood four times and Plate-breaker twice per rig.

The baseline rerun measured 17/24 on `4d3e6ab3`, one higher than the supplied 16/24. The first implementation pass measured 14/24. The adjustment retained 45 credits on entering Communal Atrium and 35 after Breached Loading Bay as shared payouts. The credit-only pass measured 13/24. Restoring suit resources after Coolant Plant and keeping the native rocket knockback rule brought the final build to 16/24. The cards keep the immediate ammunition and the Coolant Plant fight as the choice.

| Rig | Baseline | First pass | Final | Baseline evidence label | Final evidence label |
| --- | ---: | ---: | ---: | --- | --- |
| Breacher | 5/6 | 3/6 | 4/6 | `run19-before-breacher` | `run19-release-breacher` |
| Cryo | 2/6 | 3/6 | 4/6 | `run19-baseline-cryo` | `run19-release-cryo` |
| Pyro | 6/6 | 5/6 | 4/6 | `run19-baseline-pyro` | `run19-release-pyro` |
| Arc | 4/6 | 3/6 | 4/6 | `run19-baseline-arc` | `run19-release-arc` |

Arc 2718 and 137 both cleared in the final Standard simulations. Their room-13 receipts identify the Warden escort and Matron interception respectively. Story novice cleared 21/24 with the same seeds and three workers. The final cohort is recorded under `run19-release-story`.

## Visual evidence

The production capture batch `artifacts/nextgen/run19-release` contains the following frames. The PNGs were reviewed at 1920×1080 and 480×270.

- `run15-junction-1-residential-gallery.png` shows the two first-junction cards and the shared credit terms.
- `run19-brood-arrival-coolant-plant.png` shows the sector 13 opening banner.
- `run15-results.png` shows the staged completion receipt with Brood route in the run record.
- The three 480×270 PNGs share those names under `480/`.

## Native campaign

The unassisted Standard Arc campaign on seed 1729 cleared all 20 sectors with 426 kills in 15:18 of simulation time. The runner logged zero errors and one loading diagnostic. Manual-control Chamber exceeded the five-second threshold at 5.32 seconds, so the runner returned exit code 1 despite the completed expedition.

The native receipts under `artifacts/nextgen/playtest/run19-release-native` include `report.json`, `trace.ndjson`, `junction-r4.png`, `r13-coolant-plant-start.png` and `terminal-complete.png`. The three screens were reviewed at native size and 480×270. The Coolant Plant receipt records the Matron, the next sector records the recovery, and the expedition record names Brood route. Both lesson flags reached the saved run. The trace includes an armed rocket that hit two Crawlers in Breached Loading Bay.

## Build and benchmark

`npm run build` passed. The 20-second Coolant Plant benchmark recorded native ability receipts and zero first-combat shader compiles on both tiers. On this loaded host, the comparison peaked at 166 High draws and 154 Low draws. Raw samples are in `artifacts/nextgen/run19-coolant-bench-retry/benchmark.json`. The earlier three-second trial ended before it recorded all four ability uses.

## Remaining weaknesses

A player who opens Passenger Vault with a shotgun can skip the plasma lesson. The native Arc trace recorded two rifle impacts on the first plate, then the bot finished the Brute without firing plasma. The rocket prompt depends on two enemies approaching through a clear lane at arming distance, so a fast kill or a close engagement can pass the opportunity. The simulations measure campaign completion under a bot policy. They leave open how often a new player acts on either prompt.

The Standard total stayed within one clear of the reproduced baseline. Pyro moved from six clears to four, and Cryo moved from two to four. With the route selected by seed parity, the six-seed cohort gives a limited comparison of the two fights' difficulty.

## RUN20 · Threat order

- Awakening Bay / Passenger Vault stays fixed to preserve the wake-up and first heavy lesson.
- Passenger Vault / Residential Gallery stays fixed to teach the heavy before the lunge.
- Residential Gallery / Communal Atrium stays fixed to put isolated lessons before the first mixed fight.
- Crew Checkpoint / Armory stays fixed to keep the crew's defensive line ahead of equipment and the first guardian booking.
- Freight Hold / Breached Loading Bay is the first order choice. Both cargo rooms follow the armory and precede the communications deck.
- Relay Racks / Transmission Chamber stays fixed to restore the local relay before the uplink hold.
- Diagnostic Gallery / Safety-interlock Station stays fixed to reveal the cost of purge before the record that the AI knew.
- Coolant Plant / Service Shaft Landing stays fixed to keep the booked guardian and the loss of AI contact in sequence.
- Infested Workshop / Swarm Junction is the second order choice. Both rooms follow the descent and precede shielding. The optional guardian remains with Swarm Junction.
- Containment Annulus / Manual Control / Overload Floor stays fixed to confirm passenger survival, require authorization, then defend the overload.
