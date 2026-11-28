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

The cargo decision moves the Field Requisition junction forward one stop, to the Armory exit. The second decision is at the Service Shaft Landing exit. A new run earns up to 20 HP when it clears the first room of either pair. Non-guardian enemies in the second room receive 10% more health. Swarm Junction's optional Matron stays with that room. The first card gets the initial highlight, and seed parity alternates which card is first. Number shortcuts and the existing route buttons select either order.

The room position still controls encounter scaling and the supply schedule. The cargo pair still ends with the sector-eight supplies and exclusive rig augment. The workshop pair still has a supply stop after sector 15. Legacy saves keep their original junctions, room sequence and repair rules.

Both bot profiles use the same order rule. Arc takes the Freight Hold rush first on the rocket booking and Loading Bay crossfire first on the plasma booking. Breacher takes the ranged threat first with its shield. Cryo and Pyro take each rush first. The cohort override forces Freight Hold and Infested Workshop first with `--room-order=direct`, or Breached Loading Bay and Swarm Junction first with `--room-order=salvage`.

### Arc route comparison

Both historical campaigns entered the same first eleven rooms. The staged RUN20 comparison applies the live policy and route method to the two earned Armory exits. The native desktop retries confirmed the entire eleven-sector sequence below. Seed 1729 faced the Crawler rush at sector 7 and seed 2718 faced Spitter crossfire there. Both runs entered their second cargo room at sector 8 and rejoined the main sequence at Relay Racks. [Staged receipt](../../artifacts/nextgen/run20-checkpoint/staged-itinerary.json) · [1729 native arrival](../../artifacts/nextgen/playtest/run20-arc-1729-retry/r7-freight-hold-start.json) · [2718 native arrival](../../artifacts/nextgen/playtest/run20-arc-2718-frozen/r7-breached-loading-bay-start.json)

| Sector | Arc 1729 · rocket booking | Arc 2718 · plasma booking |
| ---: | --- | --- |
| 1 | Awakening Bay | Awakening Bay |
| 2 | Passenger Vault | Passenger Vault |
| 3 | Residential Gallery | Residential Gallery |
| 4 | Communal Atrium | Communal Atrium |
| 5 | Crew Checkpoint | Crew Checkpoint |
| 6 | Armory | Armory |
| 7 | **Freight Hold** | **Breached Loading Bay** |
| 8 | **Breached Loading Bay** | **Freight Hold** |
| 9 | Relay Racks | Relay Racks |
| 10 | Transmission Chamber | Transmission Chamber |
| 11 | Diagnostic Gallery | Diagnostic Gallery |

### Verification

The baseline install and build passed. The production build passed again with the junctions and evidence fixtures. The old-format checkpoint reconstructed from the pre-change earned Freight Hold exit loads through the game's Continue method and enters Breached Loading Bay in slot 8 with the original junction system. [Continuation receipt](../../artifacts/nextgen/run20-checkpoint/continuation.json)

| Route panel | 1920×1080 | 1280×720 |
| --- | --- | --- |
| Cargo | [Freight Hold first highlighted](../../artifacts/nextgen/run20-1080/run20-cargo.png) | [Loading Bay first highlighted](../../artifacts/nextgen/run20-720/run20-cargo.png) |
| Infestation | [Workshop first highlighted](../../artifacts/nextgen/run20-1080/run20-infestation.png) | [Swarm Junction first highlighted](../../artifacts/nextgen/run20-720/run20-infestation.png) |

I inspected all four route images at their native sizes and at 480×270. The names and the before/after terms fit on their own lines. At 480×270, the names remain easy to distinguish and the smaller terms are best read at the native sizes.

The swapped arrival shows Breached Loading Bay at sector 7 with the crossfire order. Its first capture hit the original ship kit preparation timeout. The retry used seed 1729 again and completed with zero capture errors. I inspected both sizes. [Arrival](../../artifacts/nextgen/run20-arrival-retry/run20-swapped-arrival-breached-loading-bay.png) · [480×270](../../artifacts/nextgen/run20-arrival-retry/run20-swapped-arrival-breached-loading-bay-480.png)

The desktop Continue flow reached and cleared Breached Loading Bay at sector 8 with zero runtime errors. The runner recorded a loading hold just over five seconds. Native screenshots timed out at 20 seconds in the first full campaign attempts. The retries retain seeds 1729 and 2718, use the same production assets in a frozen distribution, and allow up to 120 seconds for evidence screenshots. [Native continuation](../../artifacts/nextgen/playtest/run20-old-save-frozen/report.json) · [1729 retry](../../artifacts/nextgen/playtest/run20-arc-1729-retry/report.json) · [2718 retry](../../artifacts/nextgen/playtest/run20-arc-2718-frozen/report.json)

The 1729 retry reached the wall-clock limit in sector 8 with seven clears and zero runtime errors. Its continuation resumed from the earned Freight Hold clear and died in Diagnostic Gallery after ten clears with zero runtime errors. An earlier 2718 attempt logged a ship kit preparation timeout. The fresh replay used seed 2718 again, took Workshop before Swarm Junction at sectors 15 and 16, and reached the wall-clock limit with 18 clears and zero runtime errors. The continuation from the earned Containment Annulus clear died in Manual-control Chamber with zero runtime errors. [1729 continuation](../../artifacts/nextgen/playtest/run20-arc-1729-continued/report.json) · [2718 replay](../../artifacts/nextgen/playtest/run20-arc-2718-retry/report.json) · [2718 continuation](../../artifacts/nextgen/playtest/run20-arc-2718-continued/report.json)

The simulation commands use the twelve prescribed seeds independently in each Standard competent mode. All 144 trials finished. The three batches report matching gameplay and policy hashes. The forced Freight Hold / Workshop order finished 41/48, the forced Loading Bay / Swarm order finished 43/48, and the bot policy finished 44/48. The starting reference totals 43/48.

| Rig | Starting reference | Freight / Workshop first | Loading / Swarm first | Policy |
| --- | ---: | ---: | ---: | ---: |
| Breacher | 11/12 | 9/12 | 12/12 | 12/12 |
| Cryo | 10/12 | 12/12 | 10/12 | 12/12 |
| Pyro | 10/12 | 9/12 | 11/12 | 9/12 |
| Arc | 12/12 | 11/12 | 10/12 | 11/12 |

[Forced Freight / Workshop receipts](../../artifacts/nextgen/playtest/run20-std-direct/summary.json) · [Forced Loading / Swarm receipts](../../artifacts/nextgen/playtest/run20-std-salvage-parallel/summary.json) · [Policy receipts](../../artifacts/nextgen/playtest/run20-std-policy-parallel/summary.json)

## RUN21 · Consequences after the reunion

- Freight Hold first sends a reduced-health Brute loader through the Relay Racks approach aisle in the opening Warden exchange. Loading Bay first fields the Spitter on the shutter perch. The loader crosses open floor, while the perched gunner can be exposed by baiting the ram. The cargo cards show both positions.
- Workshop first sends Shielding Gate's opening flank through the inspection side. Swarm first sends it through the sterilization side. The encounter redirects an existing arrival and uses the room's native approach warning. The infestation cards show the two directions.
- The Field infirmary compares current HP with entry HP after its existing 35 HP repair, capped at 100. The interlock sketch shows the recorder and battery approaches. The workshop still spends 180 credits on an eligible augment and commits the player to its alternate approach.
- A depleted arrival is **65 or less combined HP and armor** when the fatal room begins. The line below the exchange diagram names the previously cleared room with the largest gross suit loss and its largest recorded source. This is a damage total across that room, so it can exceed the suit carried at entry.

### Checkpoint and visual verification

Version 1 checkpoints may omit the new loss receipt. The default is no prior-room attribution until a completed room supplies one. A save that predates order junctions retains the canonical itinerary and the original Relay and Shielding Gate encounters. An order-enabled pre-junction save retains its unchosen order and acquires the consequence when the player chooses. The desktop Continue action on a reconstructed pre-junction Armory checkpoint entered canonical Freight Hold. [Continue arrival](../../artifacts/nextgen/run21-final-1080/run21-old-checkpoint-freight-hold.png)

The staged Interlock death enters at 52 suit, after 48 suit lost to Spitter projectiles in Diagnostic Gallery. A fatal Crawler swipe triggers the results card. [Death card](../../artifacts/nextgen/run21-final-1080/run21-depleted-death.png)

The production build passed and conflict-marker search was clean after merging local `nextgen` at `0c9feb39`.

| Evidence | Desktop capture |
| --- | --- |
| Cargo cards | [Freight and Loading Bay](../../artifacts/nextgen/run21-final-1080/run20-cargo.png) |
| Infestation cards | [Workshop and Swarm](../../artifacts/nextgen/run21-final-1080/run20-infestation.png) |
| Relay Racks | [Freight loader](../../artifacts/nextgen/run21-evidence-1080/run21-relay-racks-direct-relay-racks.png) · [Loading Bay gunner](../../artifacts/nextgen/run21-evidence-1080/run21-relay-racks-salvage-relay-racks.png) |
| Shielding Gate | [Inspection flank](../../artifacts/nextgen/run21-hatches/run21-shielding-gate-direct-shielding-gate.png) · [Sterilization flank](../../artifacts/nextgen/run21-hatches/run21-shielding-gate-salvage-shielding-gate.png) |
| Infirmary with focus and an eligible upgrade | [1920×1080](../../artifacts/nextgen/run21-evidence-1080/run21-forecast.png) · [1366×768](../../artifacts/nextgen/run21-evidence-768/run21-forecast.png) |

The first native launch required loopback permission. The first authorized retry collided with a production rebuild and the runner exited with `ERR_HTTP_HEADERS_SENT`. The subsequent runs use a frozen distribution. I retired an early simulator comparison that used the generic simulator seed list and restarted with the historical 12-seed cohort.

### Campaign measurements

The cohort uses seeds 7, 11, 23, 99, 256, 512, 1024, 2025, 4096, 6561, 9001 and 65537. Standard competent samples all four rigs. Story novice samples Breacher and Cryo. Room comparisons pair visits by rig and seed and include deaths in the measured room. Gross suit loss counts health and armor spent through any repairs taken during the fight.

Story novice cleared **24/24** with zero stalls. Breacher cleared 12/12 on Loading Bay and Swarm first. Cryo cleared 12/12 on Freight Hold and Workshop first. [Story cohort](../../artifacts/nextgen/playtest/run21-cohort-story/summary.json)
