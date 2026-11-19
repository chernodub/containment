# RUN15 · seeded expedition structure

The same twenty ship sectors, story events and room layouts appear in the same order. A new run selects an opening from three authored approaches in each sector. The Atrium’s heavy flank can open as a relay hold, using the same bodies. From sector 4 onward, promoting an existing wave preserves the nominal spawn budget and the other waves’ relative order. Consecutive sectors cannot start with the same encounter grammar. The first three sectors retain their isolated Crawler, Brute and revealed Stalker lessons. Their subsequent waves use the selected hatch rotation. Wardens and the Matron stay in their authored packs, with the order and approach of those packs varying.

| Sector | A | B | C |
| --- | --- | --- | --- |
| 1 · Awakening bay | Main hatch rush | Port hatch rush | Far hatch rush |
| 2 · Passenger vault | Heavy at the hatch | Heavy on the flank | Heavy across the bay |
| 3 · Residential gallery | Lunge from the hatch | Lunge from the flank | Lunge across the deck |
| 4 · Communal atrium | Break the pincer | Cut off the brood | Hold the atrium relay |
| 5 · Crew checkpoint | Split the firing lanes | Turn the flank | Stop the brood |
| 6 · Armory | Bait the Warden | Cross the firing lanes | Stop the rush |
| 7 · Freight hold | Hold back the rush | Split the pincer | Cut out the leader |
| 8 · Breached loading bay | Intercept the flank | Silence the crossfire | Escape the pincer |
| 9 · Relay racks | Clear the firing lanes | Bait the Warden | Intercept the flank |
| 10 · Transmission chamber | Charge the relay | Break the pincer | Silence the crossfire |
| 11 · Diagnostic gallery | Stop the brood leader | Turn the flank | Split the crossfire |
| 12 · Safety-interlock station | Break the crawler arm | Hold the relay | Stop the brood leader |
| 13 · Coolant plant | Clear the firing lanes | Bait the Warden | Break the pincer |
| 14 · Service shaft landing | Intercept the flank | Break the pincer | Clear the firing lanes |
| 15 · Infested workshop | Stem the rush | Stop the brood | Turn the flank |
| 16 · Swarm junction | Interrupt the Matron | Escape the pincer | Charge the relay |
| 17 · Shielding gate | Split the crossfire | Prevent reinforcements | Turn the flank |
| 18 · Containment annulus | Break the crawler arm | Split the crossfire | Stop the brood |
| 19 · Manual-control chamber | Turn the flank | Bait the Warden | Clear the firing lanes |
| 20 · Overload floor | Break the crawler arm | Cut off the brood | Charge the final relay |


## Ship conditions

A run assigns six conditions from sector 4 onward. Three appear at junctions, one at Transmission Chamber, one in the service decks and one near the reactor approach. Guarded sectors and the finale are excluded. At least one clear sector separates assignments. The route card gives the reason and both terms, and the HUD names the active condition.

| Condition | Benefit | Cost | Presentation |
| --- | --- | --- | --- |
| Sealed bulkheads | Admission cap −2 | Regroup windows −500 ms | Reflection intensity ×0.96 |
| Breach alarms | Regroup windows +1,000 ms | Admission cap +2 | Reflection intensity ×1.08 |
| Auxiliary power | Entry charge equivalent to 3,000 damage, with ordinary charge scaling | Interval between regular arrivals ×0.90 | Reflection intensity ×1.12 |
| Emergency lighting | Interval between regular arrivals ×1.10 | Walking speed ×0.95 | Reflection intensity ×0.92 |
| Pressure purge | Interval between regular arrivals ×1.10 | Walking speed ×0.95 | Fog density ×1.16 |
| Salvage beacon | +25 credits on clear | Interval between regular arrivals ×0.90 | Reflection intensity ×1.05 |

Rounding, reinforcement timings and the native admission rules still apply. For example, changing the cap has little effect on a wave that never reaches it.

## Junctions and run record

The first three existing preparation stops double as junctions. Each alternate offer pairs a different opening and condition with the established ENC14 deal.

| Destination | Alternate deal | Later effect |
| --- | --- | --- |
| Communal Atrium | Early salvage grants 45 credits on entry | 35 additional credits after Breached Loading Bay |
| Breached Loading Bay | Requisition costs 70 credits for up to 25 armor and two grenades | Transmission Chamber regular arrivals use 1.10× intervals |
| Safety-interlock Station | Workshop costs 180 credits and upgrades an eligible augment. Field medicine restores up to 35 HP | Workshop also grants charge equivalent to 3,000 damage on entering Swarm Junction |

The Warden cache and capacitor offers retain their existing rewards and extra waves. The route and results screens use the seed and two scheduled conditions for the run header. The debrief lists the junction decisions actually taken. The novice bot weighs pressure more heavily when hurt, and the healthy competent bot favors available rewards. The policy reads the published card terms.

## Optional return contracts

After a terminal campaign, a separate local profile flag unlocks a seeded optional contract at the next run’s first junction. The accepted objective and its progress travel with that run. The three payout points are after sectors 7, 14 and 19, leaving the last payout usable for Overload Floor. The first objective window begins in sector 4. Each window is independent.

| Contract | Objective in each window | Payout |
| --- | --- | --- |
| Field discipline | Use zero medkits | One free boon reroll, capped at three stored |
| Suit integrity | Take at most 60 total armor and health damage | Restore up to 25 armor |
| Rapid response | Clear every room within 90 seconds per room | Charge equivalent to 6,000 damage |

## Second-run experience

The marine can reach the same cover and relays as before, but the first pressure can come from a pincer, a firing lane or a leader arriving early. Comparing the two junction terms gives a hurt player a reason to take medicine, while a healthy player might preserve the same boon for the workshop. The downstream payout makes early decisions visible again several rooms later.

## Evidence

### Simulation cohorts

Story uses the novice policy and Standard uses the competent policy. Both use the 20 I14 seeds for each of the four rigs. The initial exposure table revealed that the isolated Stalker lesson excluded the third Atrium opening. The relay fix changes the two published route cards for six seeds. I replayed those six with all four rigs and both policies, and retained the original receipts for the other 14 seeds because their routes and schedules have the same inputs. All 160 results are counted, including deaths. [Initial Story](../../artifacts/nextgen/playtest/run15-story/summary.json), [initial Standard](../../artifacts/nextgen/playtest/run15-standard/summary.json), [Story replays](../../artifacts/nextgen/playtest/run15-replay-story/summary.json), [Standard replays](../../artifacts/nextgen/playtest/run15-replay-standard/summary.json), [I14](I14-REPORT.md)

| Mode | Rig | Finished attempts | Completion | I14 completion | Δ | Other outcomes |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Story | Breacher | 20/20 | 18 | 17 | +1 | 2 dead |
| Story | Cryo | 20/20 | 17 | 14 | +3 | 3 dead |
| Story | Pyro | 20/20 | 15 | 18 | -3 | 5 dead |
| Story | Arc | 20/20 | 16 | 13 | +3 | 4 dead |
| Standard | Breacher | 20/20 | 11 | 14 | -3 | 9 dead |
| Standard | Cryo | 20/20 | 13 | 13 | +0 | 7 dead |
| Standard | Pyro | 20/20 | 13 | 12 | +1 | 7 dead |
| Standard | Arc | 20/20 | 12 | 13 | -1 | 8 dead |

### Matched act pressure

The full baseline rerun uses I14 gameplay and policy at `998af2ab` with the same seeds. For each act, the comparison includes rig-and-seed pairs that cleared every room in that act in both revisions. The scheduled room rosters retain the original counts. Incoming damage in the opening act exceeds the ±10% pressure band in Story and Standard. Clear time stays within the band in both modes. [Story baseline](../../artifacts/nextgen/playtest/run15-baseline-story/summary.json), [Standard baseline](../../artifacts/nextgen/playtest/run15-baseline-standard/summary.json)

| Mode | Rooms in act | Matched full-act clears | Mean damage | I14 | Damage change | Mean time (s) | I14 (s) | Time change |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Story | 1–7 | 78 | 107.0 | 94.7 | +13.0% | 185.6 | 182.9 | +1.5% |
| Story | 8–14 | 69 | 353.6 | 363.0 | -2.6% | 341.8 | 341.3 | +0.1% |
| Story | 15–20 | 56 | 449.8 | 425.0 | +5.8% | 344.0 | 340.1 | +1.2% |
| Standard | 1–7 | 78 | 124.7 | 105.7 | +18.0% | 196.7 | 192.9 | +2.0% |
| Standard | 8–14 | 55 | 503.3 | 496.7 | +1.3% | 410.7 | 406.7 | +1.0% |
| Standard | 15–20 | 40 | 441.2 | 450.2 | -2.0% | 371.6 | 359.1 | +3.5% |

### Per-room exposure

Seen counts include every entry. Mean damage includes deaths. Mean clear time includes cleared rooms. Paired changes match the same rig, seed and room in the I14 replay. Time changes use pairs that cleared the room in both runs. A dash marks an absent sample or a zero reference mean.

<details>
<summary>Story opening exposure</summary>

| Room | Entry label | Seen | Mean damage | Mean clear time (s) | Paired baseline n | Paired damage Δ | Paired clear time Δ |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | Far hatch rush | 28 | 4.6 | 12.4 | 28 | — | +3.1% |
| 1 | Main hatch rush | 24 | 3.1 | 13.4 | 24 | +0.0% | +2.0% |
| 1 | Port hatch rush | 28 | 4.6 | 12.9 | 28 | +825.0% | +10.9% |
| 2 | Heavy across the bay | 36 | 4.3 | 19.7 | 36 | +37.7% | -1.2% |
| 2 | Heavy at the hatch | 24 | 3.2 | 19.8 | 24 | -15.4% | +0.8% |
| 2 | Heavy on the flank | 20 | 3.2 | 19.4 | 20 | -10.3% | -5.0% |
| 3 | Lunge across the deck | 24 | 5.5 | 19.4 | 24 | +31.9% | +0.8% |
| 3 | Lunge from the flank | 32 | 5.0 | 19.3 | 32 | +15.3% | +3.0% |
| 3 | Lunge from the hatch | 24 | 2.1 | 18.6 | 24 | +2.1% | +0.0% |
| 4 | Break the pincer | 28 | 8.7 | 24.7 | 28 | -27.0% | +4.3% |
| 4 | Cut off the brood | 40 | 10.2 | 23.8 | 40 | +25.8% | -3.2% |
| 4 | Hold the atrium relay | 12 | 10.8 | 35.0 | 12 | -7.7% | +45.2% |
| 5 | Split the firing lanes | 36 | 27.2 | 36.4 | 36 | +13.9% | +0.9% |
| 5 | Stop the brood | 16 | 28.7 | 36.6 | 16 | -10.9% | -3.5% |
| 5 | Turn the flank | 28 | 30.6 | 35.3 | 28 | +10.4% | -0.2% |
| 6 | Bait the Warden | 24 | 29.5 | 37.3 | 24 | +32.8% | +2.9% |
| 6 | Cross the firing lanes | 8 | 23.0 | 38.1 | 8 | +6.4% | +4.2% |
| 6 | Stop the rush | 48 | 28.2 | 38.7 | 47 | +12.1% | +4.6% |
| 7 | Cut out the leader | 20 | 27.2 | 35.8 | 19 | -5.1% | -3.9% |
| 7 | Hold back the rush | 16 | 20.8 | 33.7 | 16 | -27.2% | -1.5% |
| 7 | Split the pincer | 44 | 32.8 | 33.9 | 44 | +34.3% | -3.0% |
| 8 | Escape the pincer | 12 | 42.3 | 37.5 | 11 | -22.8% | -4.4% |
| 8 | Intercept the flank | 35 | 38.9 | 38.2 | 34 | -7.5% | -0.8% |
| 8 | Silence the crossfire | 33 | 55.8 | 39.9 | 33 | +54.2% | +7.2% |
| 9 | Bait the Warden | 31 | 40.1 | 41.2 | 31 | -5.8% | -2.1% |
| 9 | Clear the firing lanes | 26 | 32.7 | 41.6 | 25 | -20.4% | -2.6% |
| 9 | Intercept the flank | 23 | 42.1 | 44.0 | 22 | -0.2% | +1.1% |
| 10 | Break the pincer | 40 | 72.5 | 64.1 | 38 | +3.4% | -0.1% |
| 10 | Charge the relay | 25 | 78.9 | 64.2 | 25 | +10.7% | +2.7% |
| 10 | Silence the crossfire | 14 | 72.5 | 65.7 | 14 | -8.0% | +5.9% |
| 11 | Stop the brood leader | 52 | 43.5 | 45.4 | 49 | -2.7% | -2.1% |
| 11 | Turn the flank | 27 | 37.1 | 44.1 | 26 | -8.2% | -3.3% |
| 12 | Break the crawler arm | 24 | 31.0 | 47.1 | 24 | -25.8% | +0.0% |
| 12 | Hold the relay | 43 | 43.0 | 48.3 | 40 | +4.1% | -1.4% |
| 12 | Stop the brood leader | 11 | 26.4 | 47.6 | 10 | -23.9% | +1.1% |
| 13 | Bait the Warden | 21 | 65.3 | 55.5 | 19 | +8.2% | +6.3% |
| 13 | Break the pincer | 12 | 56.4 | 48.8 | 11 | -15.7% | -6.1% |
| 13 | Clear the firing lanes | 45 | 55.6 | 51.8 | 44 | -10.3% | +2.8% |
| 14 | Break the pincer | 18 | 78.5 | 56.5 | 17 | -14.0% | +5.6% |
| 14 | Clear the firing lanes | 17 | 72.5 | 54.9 | 16 | +18.0% | -2.0% |
| 14 | Intercept the flank | 43 | 67.8 | 53.4 | 41 | -6.7% | -5.6% |
| 15 | Stem the rush | 30 | 71.9 | 55.9 | 30 | +15.2% | -1.5% |
| 15 | Stop the brood | 31 | 76.0 | 55.7 | 25 | +17.2% | -4.3% |
| 15 | Turn the flank | 15 | 68.3 | 58.7 | 14 | +8.2% | +4.9% |
| 16 | Charge the relay | 21 | 101.5 | 80.0 | 18 | -8.1% | -2.0% |
| 16 | Escape the pincer | 38 | 110.9 | 77.0 | 34 | +19.6% | +1.7% |
| 16 | Interrupt the Matron | 15 | 136.8 | 82.5 | 13 | +31.2% | -4.5% |
| 17 | Prevent reinforcements | 33 | 73.9 | 48.9 | 30 | +2.6% | -7.0% |
| 17 | Split the crossfire | 25 | 77.7 | 56.4 | 22 | +25.0% | +7.2% |
| 17 | Turn the flank | 14 | 60.7 | 50.3 | 11 | -5.0% | -5.4% |
| 18 | Break the crawler arm | 34 | 41.6 | 45.5 | 29 | +20.2% | +4.5% |
| 18 | Split the crossfire | 24 | 37.4 | 43.9 | 21 | -1.3% | +2.6% |
| 18 | Stop the brood | 9 | 49.9 | 42.2 | 7 | -9.3% | -7.9% |
| 19 | Bait the Warden | 32 | 102.1 | 69.0 | 28 | -0.4% | +4.8% |
| 19 | Clear the firing lanes | 13 | 106.7 | 71.8 | 11 | +11.2% | +3.2% |
| 19 | Turn the flank | 22 | 95.5 | 64.1 | 18 | +13.9% | -6.2% |
| 20 | Break the crawler arm | 19 | 57.9 | 50.1 | 15 | +12.7% | +11.6% |
| 20 | Charge the final relay | 37 | 37.8 | 49.7 | 32 | -32.7% | +12.0% |
| 20 | Cut off the brood | 10 | 45.2 | 44.5 | 9 | +10.0% | +3.2% |

</details>

<details>
<summary>Story condition exposure</summary>

| Room | Entry label | Seen | Mean damage | Mean clear time (s) | Paired baseline n | Paired damage Δ | Paired clear time Δ |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | Auxiliary power | 4 | 12.4 | 22.9 | 4 | +62.5% | -12.4% |
| 4 | Breach alarms | 16 | 13.2 | 29.0 | 16 | -9.9% | +24.0% |
| 4 | Emergency lighting | 8 | 13.3 | 32.4 | 8 | +97.3% | +39.9% |
| 4 | Pressure purge | 20 | 9.5 | 23.2 | 20 | -8.0% | -7.2% |
| 4 | Salvage beacon | 16 | 5.2 | 24.0 | 16 | -37.4% | -0.7% |
| 4 | Sealed bulkheads | 16 | 8.8 | 25.1 | 16 | -0.5% | +4.1% |
| 8 | Auxiliary power | 17 | 33.5 | 37.1 | 16 | -31.1% | -4.8% |
| 8 | Breach alarms | 14 | 49.9 | 40.3 | 14 | +16.5% | +7.6% |
| 8 | Emergency lighting | 17 | 48.8 | 40.0 | 17 | +7.6% | +2.0% |
| 8 | Pressure purge | 7 | 42.8 | 40.2 | 7 | +9.0% | +7.2% |
| 8 | Salvage beacon | 9 | 39.3 | 37.0 | 9 | -1.5% | -2.8% |
| 8 | Sealed bulkheads | 16 | 60.0 | 38.4 | 15 | +102.7% | +4.5% |
| 10 | Auxiliary power | 8 | 67.3 | 62.0 | 8 | +31.8% | -3.7% |
| 10 | Breach alarms | 15 | 74.1 | 66.5 | 14 | +5.0% | +6.0% |
| 10 | Emergency lighting | 8 | 72.0 | 64.4 | 8 | -16.3% | +2.3% |
| 10 | Pressure purge | 12 | 76.0 | 65.2 | 11 | +10.2% | +4.0% |
| 10 | Salvage beacon | 20 | 74.3 | 63.4 | 20 | -7.9% | -0.5% |
| 10 | Sealed bulkheads | 16 | 78.9 | 64.4 | 16 | +16.8% | +2.4% |
| 12 | Auxiliary power | 12 | 25.2 | 46.6 | 11 | -29.0% | -6.2% |
| 12 | Breach alarms | 12 | 29.1 | 45.3 | 11 | -37.9% | -0.6% |
| 12 | Emergency lighting | 7 | 46.6 | 49.8 | 7 | +62.9% | +4.1% |
| 12 | Pressure purge | 10 | 32.6 | 46.3 | 9 | -36.5% | +4.3% |
| 12 | Salvage beacon | 17 | 41.5 | 51.0 | 16 | +0.4% | +0.2% |
| 12 | Sealed bulkheads | 20 | 43.6 | 47.4 | 20 | +2.9% | -1.8% |
| 14 | Auxiliary power | 12 | 75.1 | 54.0 | 11 | -11.1% | -6.1% |
| 14 | Breach alarms | 8 | 76.1 | 51.6 | 6 | -11.5% | -13.0% |
| 14 | Emergency lighting | 11 | 63.5 | 54.7 | 11 | -18.2% | +1.3% |
| 14 | Pressure purge | 8 | 78.0 | 51.3 | 8 | +18.0% | -3.8% |
| 14 | Salvage beacon | 12 | 74.2 | 54.7 | 12 | +0.6% | -7.6% |
| 14 | Sealed bulkheads | 8 | 57.3 | 56.7 | 8 | -19.5% | +9.1% |
| 15 | Auxiliary power | 4 | 57.7 | 53.6 | 4 | -32.3% | -11.0% |
| 15 | Pressure purge | 3 | 60.5 | 56.7 | 3 | -24.3% | -2.8% |
| 15 | Salvage beacon | 8 | 70.6 | 59.7 | 7 | +28.9% | +6.5% |
| 15 | Sealed bulkheads | 4 | 69.7 | 58.1 | 4 | +10.6% | +8.3% |
| 17 | Auxiliary power | 4 | 91.5 | 55.8 | 4 | +49.3% | +3.0% |
| 17 | Breach alarms | 4 | 70.2 | 54.9 | 4 | +11.8% | +14.2% |
| 17 | Emergency lighting | 10 | 77.3 | 48.4 | 10 | +8.5% | +0.6% |
| 17 | Pressure purge | 3 | 56.3 | 53.0 | 2 | -22.5% | +6.2% |
| 17 | Salvage beacon | 8 | 91.3 | 57.1 | 7 | +31.6% | +7.9% |
| 17 | Sealed bulkheads | 3 | 55.5 | 60.3 | 3 | -9.0% | +13.0% |
| 18 | Auxiliary power | 4 | 33.2 | 44.2 | 4 | -13.2% | +0.3% |
| 18 | Breach alarms | 4 | 35.1 | 44.1 | 3 | +1.2% | -0.1% |
| 18 | Emergency lighting | 8 | 38.1 | 44.6 | 6 | +84.9% | +2.3% |
| 18 | Pressure purge | 4 | 49.9 | 49.3 | 3 | +184.4% | +20.1% |
| 18 | Salvage beacon | 8 | 47.6 | 43.3 | 6 | +28.1% | +4.1% |
| 18 | Sealed bulkheads | 10 | 44.7 | 42.9 | 10 | +24.5% | -3.2% |

</details>

<details>
<summary>Standard opening exposure</summary>

| Room | Entry label | Seen | Mean damage | Mean clear time (s) | Paired baseline n | Paired damage Δ | Paired clear time Δ |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | Far hatch rush | 28 | 0.0 | 11.9 | 28 | -100.0% | -4.6% |
| 1 | Main hatch rush | 24 | 4.4 | 11.7 | 24 | +0.0% | -4.1% |
| 1 | Port hatch rush | 28 | 5.0 | 12.8 | 28 | — | +7.3% |
| 2 | Heavy across the bay | 36 | 3.3 | 19.9 | 36 | -14.2% | +2.0% |
| 2 | Heavy at the hatch | 24 | 3.4 | 19.5 | 24 | -11.2% | -1.0% |
| 2 | Heavy on the flank | 20 | 2.0 | 19.4 | 20 | -33.6% | -2.5% |
| 3 | Lunge across the deck | 24 | 3.0 | 18.8 | 24 | -41.2% | -0.1% |
| 3 | Lunge from the flank | 32 | 2.6 | 19.0 | 32 | -51.2% | +1.4% |
| 3 | Lunge from the hatch | 24 | 2.6 | 18.4 | 24 | -0.8% | -2.5% |
| 4 | Break the pincer | 28 | 11.7 | 24.1 | 28 | -5.8% | -2.9% |
| 4 | Cut off the brood | 41 | 11.1 | 23.6 | 41 | +24.6% | +0.3% |
| 4 | Hold the atrium relay | 11 | 13.8 | 35.4 | 11 | +145.2% | +55.8% |
| 5 | Split the firing lanes | 36 | 29.2 | 43.0 | 36 | +8.9% | +4.1% |
| 5 | Stop the brood | 16 | 28.7 | 41.2 | 16 | +33.8% | +1.8% |
| 5 | Turn the flank | 28 | 32.5 | 40.0 | 28 | +33.4% | +3.0% |
| 6 | Bait the Warden | 24 | 39.7 | 40.0 | 24 | +17.8% | -0.8% |
| 6 | Cross the firing lanes | 8 | 39.6 | 42.0 | 8 | +91.2% | +11.5% |
| 6 | Stop the rush | 48 | 40.6 | 41.4 | 48 | +46.1% | +6.4% |
| 7 | Cut out the leader | 19 | 43.8 | 37.4 | 19 | +14.7% | -8.0% |
| 7 | Hold back the rush | 16 | 39.0 | 38.6 | 16 | +28.8% | +2.7% |
| 7 | Split the pincer | 44 | 35.9 | 39.0 | 44 | +17.2% | -1.4% |
| 8 | Escape the pincer | 11 | 51.7 | 44.1 | 11 | +26.8% | -0.9% |
| 8 | Intercept the flank | 31 | 48.1 | 43.7 | 31 | +14.3% | +0.8% |
| 8 | Silence the crossfire | 36 | 45.2 | 42.8 | 36 | +5.1% | -2.4% |
| 9 | Bait the Warden | 32 | 48.6 | 46.3 | 31 | +44.5% | -7.0% |
| 9 | Clear the firing lanes | 22 | 45.3 | 48.0 | 22 | -13.0% | -0.7% |
| 9 | Intercept the flank | 23 | 47.0 | 49.5 | 23 | -21.0% | -2.7% |
| 10 | Break the pincer | 37 | 78.6 | 67.4 | 36 | +1.8% | +3.2% |
| 10 | Charge the relay | 24 | 84.4 | 68.3 | 24 | -7.2% | +4.3% |
| 10 | Silence the crossfire | 16 | 83.0 | 68.7 | 16 | -7.7% | +3.9% |
| 11 | Stop the brood leader | 49 | 62.4 | 57.3 | 46 | +9.4% | -1.6% |
| 11 | Turn the flank | 26 | 58.8 | 59.6 | 26 | -12.1% | +7.2% |
| 12 | Break the crawler arm | 22 | 51.4 | 57.0 | 22 | +8.3% | +11.0% |
| 12 | Hold the relay | 39 | 62.7 | 56.2 | 35 | +12.4% | +0.2% |
| 12 | Stop the brood leader | 10 | 36.7 | 51.4 | 10 | -35.0% | -6.7% |
| 13 | Bait the Warden | 17 | 98.7 | 67.5 | 16 | -16.1% | +0.2% |
| 13 | Break the pincer | 10 | 81.3 | 64.6 | 7 | -44.5% | -3.3% |
| 13 | Clear the firing lanes | 43 | 108.6 | 66.0 | 42 | +20.4% | -0.8% |
| 14 | Break the pincer | 18 | 110.9 | 72.2 | 17 | -6.0% | +1.3% |
| 14 | Clear the firing lanes | 12 | 110.8 | 72.1 | 12 | -10.5% | +3.7% |
| 14 | Intercept the flank | 39 | 95.2 | 69.1 | 35 | -5.1% | +1.3% |
| 15 | Stem the rush | 28 | 58.7 | 60.1 | 25 | +25.4% | +2.2% |
| 15 | Stop the brood | 25 | 44.6 | 56.6 | 19 | -17.9% | -0.2% |
| 15 | Turn the flank | 11 | 52.8 | 59.5 | 11 | -10.9% | -7.0% |
| 16 | Charge the relay | 17 | 100.8 | 89.5 | 11 | -14.7% | +9.6% |
| 16 | Escape the pincer | 31 | 122.3 | 80.9 | 26 | +4.1% | +7.9% |
| 16 | Interrupt the Matron | 11 | 147.8 | 82.7 | 10 | +12.3% | +4.6% |
| 17 | Prevent reinforcements | 25 | 59.9 | 52.2 | 21 | -27.7% | -9.6% |
| 17 | Split the crossfire | 18 | 67.1 | 57.1 | 15 | -5.0% | +5.1% |
| 17 | Turn the flank | 11 | 62.3 | 53.4 | 9 | -20.0% | -1.9% |
| 18 | Break the crawler arm | 24 | 46.8 | 46.6 | 22 | +4.3% | -0.7% |
| 18 | Split the crossfire | 20 | 31.7 | 46.8 | 17 | -20.5% | +2.6% |
| 18 | Stop the brood | 8 | 50.1 | 43.8 | 4 | +44.3% | -9.3% |
| 19 | Bait the Warden | 24 | 121.7 | 73.1 | 20 | +60.7% | +7.5% |
| 19 | Clear the firing lanes | 11 | 97.0 | 71.6 | 8 | +46.9% | +3.1% |
| 19 | Turn the flank | 16 | 72.2 | 62.6 | 14 | -12.6% | +0.4% |
| 20 | Break the crawler arm | 15 | 57.1 | 49.8 | 11 | +17.7% | +2.1% |
| 20 | Charge the final relay | 26 | 51.4 | 53.0 | 21 | -36.7% | +17.2% |
| 20 | Cut off the brood | 8 | 44.5 | 46.0 | 8 | -19.4% | +1.2% |

</details>

<details>
<summary>Standard condition exposure</summary>

| Room | Entry label | Seen | Mean damage | Mean clear time (s) | Paired baseline n | Paired damage Δ | Paired clear time Δ |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | Auxiliary power | 4 | 6.7 | 21.8 | 4 | +133.0% | -18.1% |
| 4 | Breach alarms | 15 | 8.0 | 27.5 | 15 | -37.0% | +17.5% |
| 4 | Emergency lighting | 8 | 10.9 | 31.5 | 8 | +191.7% | +33.7% |
| 4 | Pressure purge | 20 | 16.2 | 24.3 | 20 | +23.3% | +1.1% |
| 4 | Salvage beacon | 16 | 11.9 | 23.9 | 16 | +22.4% | +1.3% |
| 4 | Sealed bulkheads | 17 | 11.0 | 24.3 | 17 | +49.0% | +1.6% |
| 8 | Auxiliary power | 15 | 41.6 | 42.9 | 15 | -4.3% | -2.2% |
| 8 | Breach alarms | 16 | 45.5 | 43.7 | 16 | -16.0% | +1.1% |
| 8 | Emergency lighting | 20 | 57.3 | 43.3 | 20 | +69.3% | -2.7% |
| 8 | Pressure purge | 4 | 42.1 | 47.1 | 4 | +15.5% | +8.9% |
| 8 | Salvage beacon | 12 | 42.3 | 42.2 | 12 | -8.4% | -3.2% |
| 8 | Sealed bulkheads | 11 | 46.5 | 43.2 | 11 | +27.0% | +0.3% |
| 10 | Auxiliary power | 8 | 75.0 | 66.1 | 7 | -4.8% | +0.3% |
| 10 | Breach alarms | 15 | 77.4 | 69.0 | 15 | -13.7% | +4.8% |
| 10 | Emergency lighting | 8 | 104.1 | 67.3 | 8 | +17.0% | +2.0% |
| 10 | Pressure purge | 11 | 70.9 | 69.1 | 11 | -13.7% | +6.3% |
| 10 | Salvage beacon | 20 | 83.7 | 66.5 | 20 | -9.7% | +2.1% |
| 10 | Sealed bulkheads | 15 | 81.0 | 69.2 | 15 | +17.1% | +5.0% |
| 12 | Auxiliary power | 10 | 50.0 | 56.0 | 10 | -14.7% | -2.7% |
| 12 | Breach alarms | 10 | 47.9 | 53.3 | 10 | -26.4% | -0.1% |
| 12 | Emergency lighting | 7 | 68.3 | 56.9 | 7 | +62.1% | +8.8% |
| 12 | Pressure purge | 9 | 42.4 | 51.0 | 9 | -9.8% | -8.0% |
| 12 | Salvage beacon | 16 | 66.0 | 58.6 | 14 | +41.7% | +7.4% |
| 12 | Sealed bulkheads | 19 | 55.1 | 56.2 | 17 | -1.7% | +5.5% |
| 14 | Auxiliary power | 11 | 95.4 | 67.2 | 11 | -10.8% | -2.5% |
| 14 | Breach alarms | 5 | 97.6 | 67.1 | 3 | +17.5% | -1.4% |
| 14 | Emergency lighting | 11 | 100.8 | 68.9 | 11 | -11.2% | +0.3% |
| 14 | Pressure purge | 8 | 97.1 | 69.7 | 8 | +7.7% | +6.4% |
| 14 | Salvage beacon | 9 | 73.3 | 68.7 | 8 | -39.6% | -1.5% |
| 14 | Sealed bulkheads | 8 | 130.1 | 78.5 | 6 | +3.6% | +15.5% |
| 15 | Auxiliary power | 3 | 97.6 | 63.2 | 3 | +20.0% | -14.0% |
| 15 | Pressure purge | 3 | 18.7 | 57.9 | 3 | -68.6% | +2.9% |
| 15 | Salvage beacon | 5 | 72.4 | 64.7 | 5 | +47.7% | -7.3% |
| 15 | Sealed bulkheads | 3 | 54.2 | 48.8 | 3 | -28.8% | -19.8% |
| 17 | Auxiliary power | 2 | 74.3 | 58.0 | 2 | -9.0% | -9.3% |
| 17 | Breach alarms | 3 | 74.7 | 54.2 | 2 | +44.7% | +19.3% |
| 17 | Emergency lighting | 8 | 58.2 | 52.0 | 8 | -31.1% | -9.7% |
| 17 | Pressure purge | 2 | 80.2 | 45.4 | 1 | -16.7% | +0.9% |
| 17 | Salvage beacon | 7 | 82.2 | 62.9 | 7 | -4.8% | +1.3% |
| 17 | Sealed bulkheads | 2 | 82.5 | 65.9 | 2 | +28.6% | +20.4% |
| 18 | Auxiliary power | 4 | 52.1 | 44.4 | 4 | +25.1% | -12.1% |
| 18 | Breach alarms | 3 | 30.6 | 51.6 | 2 | -40.0% | -15.9% |
| 18 | Emergency lighting | 6 | 32.2 | 45.3 | 5 | -4.0% | +5.2% |
| 18 | Pressure purge | 1 | 41.5 | 49.1 | 1 | +80.4% | +27.2% |
| 18 | Salvage beacon | 7 | 43.3 | 44.1 | 5 | +4.8% | -1.0% |
| 18 | Sealed bulkheads | 8 | 36.6 | 45.7 | 6 | -8.0% | +1.8% |

</details>

Each cohort saw 59 of 60 openings and all six conditions. Diagnostic Gallery's crossfire was absent from the prescribed seeds. A separate Story Arc probe on seed 3 reached it and cleared in 49.6 seconds while taking 42.4 damage. That probe is outside the completion table. [Probe receipt](../../artifacts/nextgen/playtest/run15-crossfire-probe/arc-3.json)

I14 publishes pooled room damage for rooms 11–14. All eight room-and-mode means are within 7% of those means. Individual variant and condition groups exceed the ±15% band. For example, Standard Safety-interlock's relay opening averaged 62.7 damage across 39 entries, roughly 20% above the published room mean, and Standard Coolant Plant's pincer averaged 81.3 across 10, about 19% below its published room mean.

| Mode | Room | RUN15 entrants | RUN15 mean damage | I14 mean damage | Change |
| --- | ---: | ---: | ---: | ---: | ---: |
| Story | 11 | 79 | 41.3 | 43.6 | −5.3% |
| Story | 12 | 78 | 36.9 | 38.9 | −5.0% |
| Story | 13 | 78 | 58.3 | 61.5 | −5.1% |
| Story | 14 | 78 | 71.3 | 71.7 | −0.5% |
| Standard | 11 | 75 | 61.2 | 61.0 | +0.3% |
| Standard | 12 | 71 | 55.5 | 52.1 | +6.6% |
| Standard | 13 | 70 | 102.3 | 100.5 | +1.8% |
| Standard | 14 | 69 | 102.0 | 106.6 | −4.3% |

### Played Story comparison on Arc

The two completed native Arc campaigns used seeds outside the Atrium-fix replay set. Their actual openings differed in 12 of 20 sectors. Including the active condition, 15 sectors differed.

| Sector | Seed 1729 opening and condition | Seed 3141 opening and condition |
| ---: | --- | --- |
| 1 | Port hatch rush | Far hatch rush |
| 2 | Heavy across the bay | Heavy on the flank |
| 3 | Lunge across the deck | Lunge across the deck |
| 4 | Break the pincer · Breach alarms | Cut off the brood · Pressure purge |
| 5 | Turn the flank | Turn the flank |
| 6 | Bait the Warden | Bait the Warden |
| 7 | Split the pincer | Split the pincer |
| 8 | Intercept the flank · Sealed bulkheads | Silence the crossfire · Emergency lighting |
| 9 | Clear the firing lanes | Bait the Warden |
| 10 | Break the pincer · Emergency lighting | Silence the crossfire · Pressure purge |
| 11 | Stop the brood leader | Turn the flank |
| 12 | Hold the relay · Salvage beacon | Hold the relay · Sealed bulkheads |
| 13 | Clear the firing lanes | Bait the Warden |
| 14 | Intercept the flank · Salvage beacon | Intercept the flank |
| 15 | Stop the brood | Stop the brood · Emergency lighting |
| 16 | Escape the pincer | Escape the pincer |
| 17 | Prevent reinforcements | Split the crossfire |
| 18 | Break the crawler arm · Pressure purge | Stop the brood · Salvage beacon |
| 19 | Turn the flank | Clear the firing lanes |
| 20 | Charge the final relay | Break the crawler arm |

### Native junction frames

| Destination | Seed | Native | 480×270 |
| --- | ---: | --- | --- |
| Communal Atrium | 2718 | [PNG](../../artifacts/nextgen/run15/junction-r4.png) | [PNG](../../artifacts/nextgen/run15/junction-r4-480.png) |
| Breached Loading Bay | 3141 | [PNG](../../artifacts/nextgen/run15/junction-r8.png) | [PNG](../../artifacts/nextgen/run15/junction-r8-480.png) |
| Safety-interlock Station | 2718 | [PNG](../../artifacts/nextgen/run15/junction-r12.png) | [PNG](../../artifacts/nextgen/run15/junction-r12-480.png) |

I inspected the three panels at both sizes. Both cards retain the destination's name, encounter, condition terms and keyboard shortcuts. The Atrium image shows the corrected relay option. The workshop displays a named installed augment and its price. At 480×270, the choice hierarchy remains visible and the small-print terms are best read at native size.

### Condition frames

| Native Arc campaign, seed 1729 | Native | 480×270 |
| --- | --- | --- |
| Communal Atrium · Breach alarms | [PNG](../../artifacts/nextgen/run15/condition-1.png) | [PNG](../../artifacts/nextgen/run15/condition-1-480.png) |
| Breached Loading Bay · Sealed bulkheads | [PNG](../../artifacts/nextgen/run15/condition-2.png) | [PNG](../../artifacts/nextgen/run15/condition-2-480.png) |
| Transmission Chamber · Emergency lighting | [PNG](../../artifacts/nextgen/run15/condition-3.png) | [PNG](../../artifacts/nextgen/run15/condition-3-480.png) |

I inspected the frames at both sizes. The room and condition names wrap within the existing right-hand HUD panel. Floor detail is subdued in Transmission Chamber, while the committed melee footprint and character remain visible. These frames show presentation and native combat. They cannot establish the balance impact of a condition.

### Native campaigns

| Seed | Rig and mode | Outcome | Runtime errors | Runner defects | Receipt |
| ---: | --- | --- | ---: | ---: | --- |
| 1729 | Arc, Story, fast native | Complete, 20/20 | 0 | 0 | [Campaign](../../artifacts/nextgen/playtest/run15-native-1729/report.json) |
| 2718 | Arc, Story, fast native | Complete, 20/20 | 0 | 0 | [Campaign](../../artifacts/nextgen/playtest/run15-native-2718/report.json) |
| 3141 | Arc, Story, fast native | Complete, 20/20 | 0 | 0 | [Campaign](../../artifacts/nextgen/playtest/run15-native-3141/report.json) |
| 2718 | Corrected Atrium replay from the earned room-three boundary | Complete, 20/20 | 0 | 0 | [Replay](../../artifacts/nextgen/playtest/run15-native-2718-final/report.json) |
| 1729 | Continue from pre-change room-eight boundary | Complete, 20/20 | 0 | 0 | [Continuation](../../artifacts/nextgen/playtest/run15-legacy-resume/report.json) |

The corrected replay took early salvage, field requisition and the field workshop. Its Atrium relay cleared in 33.2 combat seconds with zero damage. The debrief shows all three recorded decisions and the replay controls in the same viewport. [Native results](../../artifacts/nextgen/run15/results.png), [480×270](../../artifacts/nextgen/run15/results-480.png)

The unchanged gameplay on the pre-RUN15 revision cleared eight rooms with zero errors. The worktree's starting revision and the local `nextgen` revision differed only in roadmap prose. The [pre-change boundary](../../artifacts/nextgen/run15/pre-change-checkpoint.json) was serialized from the earned room-eight reward snapshot and the matching campaign receipt. It loaded through Continue and reached the original ending under the fixed encounter order.

The final production capture batch covers the three junction panels, three conditioned rooms and the compact results panel as staged fixtures. The campaign receipts above retain native input evidence. [Capture gallery](../../artifacts/nextgen/run15/index.html), [manifest](../../artifacts/nextgen/run15/manifest.json)

## Remaining weaknesses

- The teaching variants change follow-up ingress. The isolated lesson still uses its close-range placement rule. Guardian variants move the same guardian and escort packs through different approaches and beat orders. Their escort rosters are fixed.
- Most conditions are communicated through the HUD and changes in the arrival or regroup clocks. Existing reflection and fog intensities offer a subtle renderer cue. Emergency lighting and pressure purge share the same walking-speed and arrival-interval modifiers.
- Contracts change what the player tracks. They pay through existing economy and charge mechanics, and the final payout happens before Overload Floor so it can be spent.
- Route choices change both the opening and condition. Raw per-group damage and time also reflect entry resources, rig, earlier choices and player behavior. They cannot isolate the effect of a single modifier.
