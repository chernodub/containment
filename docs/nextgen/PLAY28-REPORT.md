# PLAY28 · Escapes and return shots

The comparison starts at `6c9cfb05`. The supplied Standard competent cohort cleared 36 of 48 campaigns, with Breacher 6, Cryo 9, Pyro 11 and Arc 10. Story novice cleared 24 of 24. Both baselines had zero stalls.

1. The recovery brackets use the posed body’s world position. The Stalker lunge translates the body under the actor root, which left the old mark where the lunge started. The Crew Checkpoint capture now advances from the locked strike into the recovery.
2. Service Shaft Landing biases the first Stalker toward the wall side when there is room to turn inward. The second Stalker can emerge on the far side before the first lock. It can approach but cannot lock until its original arrival time and initial approach allowance have elapsed. When the authored plan places the two Stalkers in separate beats, the far-side arrival is signaled before the first lock. In a stationary Standard 2718 simulation the two Stalkers arrived at 1.33 and 1.43 seconds, then began their first locks at 1.67 and 4.97 seconds.
3. In the first mixed Brute beat in Communal Atrium, light attackers wait through the first surviving Brute’s recovery on Story and Standard. Killing the Brute releases them. Later beats use their ordinary attack rules.
4. Coolant Plant reserves about a third of the selected Crawler screen behind a marked Spitter. Infested Workshop reserves about a third of the selected Stalker flank behind its Brute. The HUD counts down to a marked existing breach. Killing the leader before dispatch cancels the reserve. Both policies give a reachable, visible leader priority after their immediate recovery shot.
5. The covered bank is around the opposite side of the reactor core from the short crossing. The authored path is about 907 world units, compared with a clear, dashable 292-unit near lane. The core blocks direct fire and pursuit from the near bank to the covered bank. The route from the near bank to the previous covered pad was about 689 units. To the new pad it is about 1,145 units. Both opening Spitter origins lose direct sight of the path from its north bend onward. Both policies consider melee enemies within one approach of the short lane alongside suit condition and dash readiness. A bot that commits to the covered bend keeps that plan as the pack moves.
6. One Relay Racks Warden escort becomes a Spitter behind a marked rack shutter. Its slot passes its own fire, while the shutter stops incoming weapon fire. A Warden collision breaks the panel and triggers its normal wall stun. The Spitter can leave its post if the Warden dies first. Both policies can move to a bait position beyond the panel. A staged simulation recorded the blocked shot, panel break, 1,500 ms wall stun and immediate end of the Spitter’s protection. Neither native campaign trace recorded a shutter break.
7. The first successful Story plasma strip grants 15 credits and gives a surviving enemy a 1.6-second rifle opening. The nearest arc of the hold boundary changes color immediately when the marine steps out. At the first supply stop in Breached Loading Bay, a player who passed on both exclusive augments can install either one for free.

## Desktop evidence

The production build passed with Vite’s chunk-size warning. The Crew Checkpoint capture produced 14 frames. Frames 6–13 cover recovery, with the brackets following the body back from the lunge. I reviewed the sequence and checked the first recovery frame at 1920×1080 and 480×270. [Crew Checkpoint lunge capture](../../artifacts/nextgen/play28-lunge/index.html)

Native Arc 2718 cleared all 20 rooms with zero errors. It recorded 50.4 suit points in Service Shaft Landing, 34.7 in Coolant Plant and 37.8 in Infested Workshop. It took the covered bank with 100 health, 30 armour and a reachable melee intercept near the short lane. It lost 25.2 suit points between the first available choice and committing to that bank, and 52.9 across all of Overload Floor. The cited Shaft loss for Arc 2718 was 139.4. The reviewer’s other reference runs lost 162.7 in Coolant Plant, 131.3 in Infested Workshop and 67.2 on Pyro’s crossing. [Arc 2718 campaign](../../artifacts/nextgen/playtest/play28-final-native-arc/index.html)

Native Cryo 1729 cleared all 20 rooms with zero errors. It recorded 140.9 suit points in Service Shaft Landing, 84.5 in Coolant Plant and 27.7 in Infested Workshop. The Plant and Workshop totals are down from the cited 162.7 and 131.3. Crawler contact accounted for 75.6 in the Plant, and Stalker contact accounted for all 27.7 in the Workshop. The Shaft remains costly on Cryo. It took 56.3 from Stalkers and 44.1 from Brutes, and the earlier PLAY27 Cryo run lost 66.1 suit points there.

Cryo took the covered bank with 100 health, 86.8 armour, an unavailable dash at the initial decision, and melee pressure near the short lane. It lost 44.1 suit points during the crossing and 128.0 across all of Overload Floor. [Cryo 1729 campaign](../../artifacts/nextgen/playtest/play28-final-native-cryo/index.html)

The short High-tier desktop benchmark completed on Service Shaft Landing and Overload Floor with zero shader compiles during either sampled run. [Benchmark record](../../artifacts/nextgen/play28-desktop-bench/benchmark.json)

## Standard and Story cohorts

The first full Standard pass cleared 40 of 48 without a stall. Breacher cleared 8, Cryo 12, Pyro 10 and Arc 10. All 40 crossings used the near bank. I widened the melee intercept check, raised the suit-loss threshold for taking cover and made the bots stay with the covered route once chosen. Ordinary enemy idle times stayed the same.

The first Story pass cleared 19 of 24, with Breacher 11 and Cryo 8, zero stalls, and a median loss of 29.6 suit points across 452 rooms. Three Cryo runs died in Infested Workshop after entering with 20–60 health. Story now places a 25-health pickup at the Workshop entrance when the marine arrives with 60 health or less. The encounter schedule and Standard health economy stay the same.

The final Story novice pass cleared 20 of 24 with zero stalls. Breacher cleared 12 of 12 and Cryo cleared 8 of 12. Median suit loss was 31.2 points per room across 460 visited rooms, including fatal rooms. The marine took damage in 369 of those rooms. Breacher seed 7 survived after the new pickup. [Story Breacher results](../../artifacts/nextgen/playtest/play28-final-story-breacher/summary.json) · [Story Cryo results](../../artifacts/nextgen/playtest/play28-final-story-cryo/summary.json)

The final Standard competent pass cleared 40 of 48 with zero stalls. Breacher cleared 8 of 12, Cryo 12 of 12, Pyro 10 of 12 and Arc 10 of 12. There were 13 near crossings and 27 covered crossings. Eight seeds died before choosing a bank. Among the 27 runs that switched to cover from the first pass, seven took less crossing damage, eight took the same and twelve took more. The median change was zero suit points.

- Breacher took the covered bank on 11, 99, 256, 1024, 2025, 6561, 9001 and 65537. Seeds 7, 23, 512 and 4096 died before choosing. [Breacher results](../../artifacts/nextgen/playtest/play28-final-standard-breacher/summary.json)
- Cryo took the near bank on 23, 99, 512, 4096 and 65537. It took the covered bank on 7, 11, 256, 1024, 2025, 6561 and 9001. [Cryo results](../../artifacts/nextgen/playtest/play28-final-standard-cryo/summary.json)
- Pyro took the near bank on 7, 99, 512, 6561 and 65537. It took the covered bank on 23, 256, 1024, 4096 and 9001. Seeds 11 and 2025 died before choosing. [Pyro results](../../artifacts/nextgen/playtest/play28-final-standard-pyro/summary.json)
- Arc took the near bank on 7, 99 and 6561. It took the covered bank on 11, 23, 256, 512, 1024, 2025 and 65537. Seeds 4096 and 9001 died before choosing. [Arc results](../../artifacts/nextgen/playtest/play28-final-standard-arc/summary.json)

## PLAY29

The merged baseline was `fcb90090`. Story novice Cryo cleared 20 of 24 fresh seeds. Seeds 106, 118 and 124 died in Diagnostic Gallery, and seed 121 died in Manual-control Chamber. The three Gallery deaths were contact attacks. None of the fatal samples had a move rejected by Glacier.

- Seed 106 arrived with 3.5 health and no armour. Its first hit was a Crawler strike at about (561, 352), north of the recorder. The floor provided a north escape, but the Crawler had about 20 ms left before impact. Dash had a charge. Nova had 7.4 seconds left, Glacier 17.1 seconds, and Whiteout had no charge.
- Seed 118 arrived with 1.0 health and 3.0 armour. Its first hit was a Crawler strike at about (1097, 343), in the east threshold. The floor provided a south escape. The bot was moving west as the Crawler locked from the north. Dash had a charge. Nova had 9.0 seconds left, Glacier 16.9 seconds, and Whiteout had no charge.
- Seed 124 arrived with 42.6 health and no armour. Four Crawler hits near the east wall accounted for 35.3 loss. The final 7.4 came from a Stalker on the service return at about (433, 847), where west and north were open. Dash was ready, with a second charge 1.5 seconds away. Nova had 2.3 seconds left, Glacier 15.7 seconds, and Whiteout had no charge.

The earlier Standard death cluster did not reproduce in the Gallery. Cryo 7 cleared it with 12.6 Crawler damage. Cryo 99 cleared it with 55.3 loss, including 34.7 Stalker and 20.7 Spitter damage, then died in the Shaft. Cryo 65537 cleared it with 64.5 loss, including 34.7 Stalker, 17.2 Spitter and 12.6 Crawler damage. Seeds 7 and 65537 finished their campaigns. [Fresh baseline](../../artifacts/nextgen/playtest/play29-base-fresh/summary.json) · [Fatal traces](../../artifacts/nextgen/playtest/play29-base-fatal/summary.json) · [Standard replays](../../artifacts/nextgen/playtest/play29-base-standard/summary.json)

Diagnostic Gallery opens with its existing Brute and Stalker exchange. The Brute comes in north of the recorder, and the Stalker is signalled across its south side. The west end of the recorder connects the two lanes. On Story and Standard, the Stalker can approach while the Brute commits, and its lock waits through that Brute’s first recovery. The remaining attackers arrive later and the scheduled count stays the same. Story players entering with at most 70 combined suit points can take a health pickup on the inside turn. It provides 25 health, or 65 for an arrival with 12 combined suit points or less. Glacier and the bot's inputs retain their existing behavior.

In PLAY28 native Cryo 1729 took no Shaft damage until 25.3 seconds in. The first two costly contacts were a Stalker at about (481, 707) and a Brute at about (603, 792), on the south balcony beyond the landing. They cost 28.6 and 44.1 respectively. Glacier was still recharging in both exchanges, and Nova had 10.8 seconds left at the Brute hit. A later south-balcony Stalker hit cost 27.7, and three late Spitter hits added 27.3. The merged Standard replay of seed 99 also died on the south side after taking 186.0 Shaft damage. The later beats could reintroduce attackers on the escape side while Cryo was committed to a balcony.

The Shaft keeps its first staged pair. The remaining requests in each beat share an approach from the side away from the western landing turn, with additional space between their arrivals. Up to three scheduled Crawlers can be active or in the breach warning at once. The attack intervals, enemy counts and Cryo kit values stay the same.

With the three-Crawler approach limit, the four Standard rehearsals all cleared the Shaft for less than 90 suit points. Cryo lost 18.2 on seed 1729 and 70.0 on 2718. Arc lost 51.0 on 1729 and 66.7 on 2718. The limit keeps reinforcements queued and preserves the roster. [Shaft rehearsals](../../artifacts/nextgen/playtest/play29-packet-shaft/summary.json)


### PLAY29 measurements

The production build passed with Vite’s chunk-size warning. Native Cryo 1729 cleared all 20 rooms with zero runner errors. It took 37.8 damage in Diagnostic Gallery, all from Crawlers. PLAY28’s native run took 43.0 there. Cryo took 80.7 in the Shaft, including 51.6 Crawler contact and 29.1 Spitter projectile damage, down from 140.9 in PLAY28. The Gallery capture shows the second approach across the recorder and the cutback prompt. I inspected it at native size and at 480×270. [Native campaign](../../artifacts/nextgen/playtest/play29-native-cryo/index.html) · [Native Gallery frame](../../artifacts/nextgen/playtest/play29-native-cryo/r11-diagnostic-gallery-mid.png)

The first full Story pass cleared 20 of 24 fresh seeds. The original Gallery deaths moved out of the room, but seed 113 entered after a 154.8-point Transmission hold and died with 65.2 suit loss in the Gallery. The pickup was then extended to battered Story players. On the usual seeds that first pass cleared 11 of 12.

The first Standard pass cleared 41 of 48. Cryo cleared 11, Arc 10, Breacher 8 and Pyro 12. Cryo seed 9001 cleared the finale’s enemies, then stopped on the covered bend because its 73.5-unit movement probe rejected the legal 48-unit turn. Both bot backends now accept a shorter probe that moves toward the waypoint when the crossing is empty. A 14-percent reduction in ordinary melee and ranged idle time in Standard rooms after the Shaft still produced 42 clears. The next pass used a 28-percent reduction in the same rooms. Attack warnings, commitment gaps and the recovery reward stayed fixed.

The final Story novice result was 21 of 24 fresh clears and 10 of 12 usual clears, with zero stalls. The three fresh deaths were seed 106 in Safety-interlock Station, seed 118 in Manual-control Chamber and seed 119 in Infested Workshop. Every fresh run cleared Diagnostic Gallery. The last pickup adjustment affected only seeds 113 and 124 in the fresh cohort and seed 99 in the usual cohort. All three completed their targeted replays. The other seeds entered outside the adjusted pickup band, so their full-cohort results carry forward. The two usual deaths were seeds 256 and 65537 in Containment Annulus. [Fresh cohort](../../artifacts/nextgen/playtest/play29-release-story-fresh/summary.json) · [Fresh pickup replays](../../artifacts/nextgen/playtest/play29-story-pickup-fresh/summary.json) · [Usual cohort](../../artifacts/nextgen/playtest/play29-release-story-usual/summary.json) · [Usual pickup replay](../../artifacts/nextgen/playtest/play29-story-pickup-usual/summary.json)

The final Standard competent cohort cleared 39 of 48 with zero stalls. Cryo cleared 12 of 12, Arc 8 of 12, Breacher 9 of 12 and Pyro 10 of 12. The revised Cryo 9001 cleared the covered crossing, and Cryo 99 finished the campaign after taking 53.6 Shaft damage versus 186.0 in the merged replay. [Cryo cohort](../../artifacts/nextgen/playtest/play29-release-standard-cryo/summary.json) · [Arc cohort](../../artifacts/nextgen/playtest/play29-release-standard-arc/summary.json) · [Breacher cohort](../../artifacts/nextgen/playtest/play29-release-standard-breacher/summary.json) · [Pyro cohort](../../artifacts/nextgen/playtest/play29-release-standard-pyro/summary.json)

I replayed the final six native rooms on the tuned build from the earned Shaft reward checkpoint. Cryo 1729 finished the continuation with 20 credited rooms, zero errors and zero defects. [Native continuation](../../artifacts/nextgen/playtest/play29-release-native-continuation/index.html)

The focused High-tier desktop benchmark finished both rooms without errors. [Benchmark record](../../artifacts/nextgen/play29-desktop-bench/benchmark.json)

## PLAY30

Baseline on `ebf21186`. Medians use all visited rooms, including fatal rooms. The share divides pooled suit loss from sectors 1–10 by pooled suit loss across the campaign.

| Sector | Breacher | Cryo | Pyro | Arc |
|---|---:|---:|---:|---:|
| 1 | 5.0 | 0.0 | 0.0 | 0.0 |
| 2 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3 | 0.0 | 0.0 | 0.0 | 0.0 |
| 4 | 0.0 | 0.0 | 0.0 | 0.0 |
| 5 | 0.0 | 31.6 | 24.3 | 8.4 |
| 6 | 38.3 | 39.4 | 18.1 | 11.6 |
| 7 | 6.3 | 36.0 | 12.6 | 26.5 |
| 8 | 33.8 | 48.7 | 27.7 | 38.7 |
| 9 | 37.7 | 39.0 | 41.1 | 36.4 |
| 10 | 71.0 | 68.5 | 47.7 | 46.6 |
| 11 | 17.2 | 27.8 | 18.4 | 17.2 |
| 12 | 44.8 | 55.0 | 28.2 | 34.3 |
| 13 | 49.0 | 79.7 | 64.8 | 39.1 |
| 14 | 35.6 | 58.7 | 47.3 | 29.3 |
| 15 | 6.3 | 27.7 | 25.2 | 13.9 |
| 16 | 54.8 | 81.2 | 58.8 | 39.9 |
| 17 | 28.4 | 31.6 | 44.2 | 36.6 |
| 18 | 45.0 | 25.2 | 15.9 | 11.0 |
| 19 | 37.1 | 79.0 | 53.7 | 43.6 |
| 20 | 83.2 | 92.3 | 90.5 | 55.8 |
| Sectors 1–10 share | 37.9% | 33.4% | 27.9% | 32.4% |

Standard cleared 43 of 48, with Breacher 9, Cryo 11, Pyro 11 and Arc 12. No stall or death before sector 6 occurred.

The pooled baseline was already near the requested 25–35% band. The 9% figure in R23-B was from one native Cryo campaign. Sectors 3 and 4 had a zero median across all four rigs, while Transmission Chamber exceeded 46 suit points on every rig.

On Standard, sectors 3–10 use an existing Stalker, Brute, Stalker, Brute, split pincer, Stalker, Brute and Spitter exchange, respectively. Residential Gallery's lesson target has more time to reach its first attack, the Atrium has an elite anchor and close arrivals are signalled where the enemy will enter. A paired flanker gets a later approach and lock. Spitters use the existing machinery-cover placement. Neither the tutorial sectors nor the authored body count change. Story skips this tuning.

From sector 11 on Standard, up to three ordinary Crawlers or Stalkers can withdraw once the featured group has been defeated and the last scheduled arrivals have entered. Siege beats keep their charge requirement. Withdrawal uses the existing retreat animation and reduced cleanup credit. The change removes the last contact opportunities in mixed beats and preserves active pressure during the featured fight.

Relay Racks books its Warden and shutter at the start. The Warden enters from the east side of the rack, and the bot approaches from the west aisle. Coolant Plant keeps its earlier route contract. The Armory booking accounts for the contract, and the Brood route seeds its final Matron in Swarm Junction or Manual-control Chamber. Extra guardian slots become ordinary brood leaders.

| Arc seed | Previous | Now |
|---:|---|---|
| 1729 | 6 Warden, 9 Warden, 13 Matron, 16 Matron, 19 Warden | 6 Warden, 9 Warden, 13 Matron, 16 Matron |
| 2718 | 6 Warden, 9 Warden, 13 Warden, 16 Matron, 19 Warden | 6 Matron, 9 Warden, 13 Warden |
| 7 | 6 Warden, 9 Warden, 13 Matron, 16 Matron, 19 Warden | 6 Warden, 9 Warden, 13 Matron, 16 Matron |
| 11 | 6 Warden, 9 Warden, 13 Matron, 16 Matron, 19 Warden | 6 Warden, 9 Warden, 13 Matron, 16 Matron |
| 23 | 6 Warden, 9 Warden, 13 Matron, 16 Matron, 19 Warden | 6 Warden, 9 Warden, 13 Matron, 19 Matron |

### Standard competent suit loss

Each cell is previous → now.

| Sector | Breacher | Cryo | Pyro | Arc |
|---|---:|---:|---:|---:|
| 1 | 5.0 → 5.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 2 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 3 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 4 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 5 | 0.0 → 32.1 | 31.6 → 29.5 | 24.3 → 7.6 | 8.4 → 15.6 |
| 6 | 38.3 → 25.2 | 39.4 → 23.1 | 18.1 → 10.8 | 11.6 → 11.6 |
| 7 | 6.3 → 12.6 | 36.0 → 51.7 | 12.6 → 12.9 | 26.5 → 14.0 |
| 8 | 33.8 → 14.1 | 48.7 → 40.3 | 27.7 → 25.8 | 38.7 → 33.4 |
| 9 | 37.7 → 26.8 | 39.0 → 64.7 | 41.1 → 28.9 | 36.4 → 11.8 |
| 10 | 71.0 → 58.9 | 68.5 → 65.5 | 47.7 → 48.1 | 46.6 → 43.1 |
| 11 | 17.2 → 12.6 | 27.8 → 37.5 | 18.4 → 23.5 | 17.2 → 21.2 |
| 12 | 44.8 → 37.0 | 55.0 → 62.5 | 28.2 → 32.3 | 34.3 → 35.7 |
| 13 | 49.0 → 59.2 | 79.7 → 100.8 | 64.8 → 38.0 | 39.1 → 38.4 |
| 14 | 35.6 → 55.8 | 58.7 → 78.8 | 47.3 → 38.6 | 29.3 → 25.8 |
| 15 | 6.3 → 27.7 | 27.7 → 63.2 | 25.2 → 36.3 | 13.9 → 28.6 |
| 16 | 54.8 → 54.9 | 81.2 → 68.0 | 58.8 → 42.2 | 39.9 → 62.1 |
| 17 | 28.4 → 37.6 | 31.6 → 41.2 | 44.2 → 41.1 | 36.6 → 51.8 |
| 18 | 45.0 → 20.1 | 25.2 → 26.4 | 15.9 → 12.3 | 11.0 → 12.6 |
| 19 | 37.1 → 40.3 | 79.0 → 104.2 | 53.7 → 28.6 | 43.6 → 27.7 |
| 20 | 83.2 → 82.1 | 92.3 → 76.4 | 90.5 → 61.2 | 55.8 → 63.7 |
| Sectors 1–10 share | 37.9% → 33.4% | 33.4% → 32.3% | 27.9% → 29.7% | 32.4% → 30.1% |

The revised cohort cleared 41 of 48. Breacher cleared 8, Cryo 11, Pyro 11 and Arc 11. The earliest death was in sector 10. Cryo 23 and Pyro 512 originally stalled at the covered reactor bend. Both cleared their targeted replays after the bot was allowed to shorten its probe toward the waypoint during stalled pursuit. The table and clear counts include those replays.

The first half accounted for 32.9% → 31.6% of pooled suit loss. All four rigs finished inside the 25–35% band, and Standard finished one clear over the 34–40 target. Sectors 3 and 4 still had zero median loss on each rig. Among the 39 runs that cleared on both revisions, mean suit loss per run moved from 214.3 to 202.2 in sectors 1–10 and from 472.3 to 487.2 in sectors 11–20. Late Crawler and Stalker contact across entire rooms rose from 302.0 to 327.8 per matched clear. These room ledgers do not isolate post-featured cleanup, so the withdrawal rule does not establish the intended damage transfer.

Story novice cleared 22 of 24 with zero stalls. Cryo and Breacher each cleared 11 of 12.

[Standard Breacher](../../artifacts/nextgen/playtest/play30-now-breacher/summary.json) · [Standard Cryo](../../artifacts/nextgen/playtest/play30-now-cryo/summary.json) · [Standard Pyro](../../artifacts/nextgen/playtest/play30-now-pyro/summary.json) · [Standard Arc](../../artifacts/nextgen/playtest/play30-now-arc/summary.json) · [Cryo replay](../../artifacts/nextgen/playtest/play30-finale-narrow/summary.json) · [Pyro replay](../../artifacts/nextgen/playtest/play30-finale-pyro/summary.json) · [Story](../../artifacts/nextgen/playtest/play30-now-story/summary.json)

On fresh Standard seeds 101–124, Breacher cleared 23 of 24 and Arc cleared 22 of 24. Both cohorts recorded zero stalls. Breacher had the fewest clears in the usual cohort. Arc represented the three-way tie at the top because it had led the baseline. The fresh result gives no basis for weakening Arc or strengthening Breacher on the usual seeds alone. [Fresh Breacher](../../artifacts/nextgen/playtest/play30-now-fresh/summary.json) · [Fresh Arc](../../artifacts/nextgen/playtest/play30-fresh-arc/summary.json)

### Native shutter

Arc 2718's first Relay Racks charge locked at 224.53 seconds and broke the panel at 228.12 seconds, about nine seconds into the sector. The native capture shows 1.45 seconds of wall stun remaining. I reviewed it at 1920×1080 and 480×270. The Warden is partly clipped at the top of the impact frame. [Before the charge](../../artifacts/nextgen/playtest/play30-native-retry/r9-relay-racks-mid.png) · [Shutter impact frame](../../artifacts/nextgen/playtest/play30-native-retry/r9-relay-racks-shutter-break.png)

The native Standard Arc 2718 campaign cleared all 20 sectors with zero runner errors. The production build passed with the Vite chunk-size warning. [Complete native campaign](../../artifacts/nextgen/playtest/play30-native-retry/index.html)

The next pacing pass should focus on the first committed attack in Residential Gallery and Communal Atrium, then shorten late melee cleanup closer to the featured kill. A repeat guardian still needs a concrete room-specific objective on routes where the Relay Racks shutter is the first Warden's feature.

## PLAY31

1. The first Brute in Communal Atrium and Diagnostic Gallery uses a nearby legal ingress with a clear sightline. Its warning uses that position. The existing heavy-recovery hold still governs the accompanying light enemies, and the Brute can die during its approach or wind-up.
2. The first Residential Gallery Stalker favors a side angle with a traversable 65-unit sidestep. Passenger Vault's first staged Spitter opens with a volley across the cover lesson's pickup lane. The Atrium uses the Brute exchange.
3. Residential Gallery pairs the Stalker with a plated Brute. A plasma strip pays 15 credits and holds a surviving target for 1.6 seconds. The novice weapon policy is unchanged.
4. A reserve cancellation emits the missing arrival count and family. The HUD replaces the countdown for three seconds and the renderer lowers a grille. Coolant Plant schedules its two-entry pincer after the crossfire. Canceling the crossfire reserve removes the arrivals assigned to one pincer entry and leaves that grille closed.
5. The Relay Racks shutter, Warden and Spitter share the relocated aisle. Broken panel pieces remain at the edges, and the unshielded Spitter holds its post for three seconds if it survives.
6. Swarm Junction's first Matron brood cycle places one pod toward the relay and another beside a 35-armour pickup. The supply pod consumes any remaining pickup on hatch. The original brood rules govern later cycles.
7. Standard and Story check sixteen possible walking sidesteps of 65 units before admitting an overlapping melee warning. Each candidate must be traversable and outside the active strike footprints. The report counts a denied attack once until that enemy can attempt another attack.

The production build passed with Vite's chunk-size warning. The first Cryo trace sampled the Residential Gallery Stalker in wind-up at 32.950 seconds and the Atrium Brute in wind-up at 57.750 seconds. Both enemies died before their first sampled strike. That campaign started before the last ingress and counter adjustments.

The three requested twelve-seed cohorts finished with zero stalls. Standard competent Cryo and Breacher each cleared 12 of 12. Story novice Cryo cleared 11 of 12, with seed 65537 dying in sector 18. The Standard samples cover two rigs and the Story sample covers one rig, so they do not establish either full-cohort target. No balance changes were made in response to those counts. Cryo sampled `4b4bfc5a`. Breacher and Story sampled `b42b75b7`.

| Standard median suit loss | Cryo previous / PLAY31 | Breacher previous / PLAY31 |
|---|---:|---:|
| 1 · Awakening Bay | 0.0 / 0.0 | 5.0 / 5.0 |
| 2 · Passenger Vault | 0.0 / 0.0 | 0.0 / 0.0 |
| 3 · Residential Gallery | 0.0 / 0.0 | 0.0 / 0.0 |
| 4 · Communal Atrium | 0.0 / 0.0 | 0.0 / 0.0 |

The Cryo novice transfer trace on seed 1729 recorded three plasma shots in Passenger Vault and zero in Residential Gallery. The novice used rifle and shotgun in Residential. [Transfer trace](../../artifacts/nextgen/playtest/play31-novice-transfer/cryo-1729.json)

Native Cryo 1729 sampled the first Diagnostic Gallery Brute in wind-up at 311.767 seconds. Arc 2718 sampled the first Atrium Brute in wind-up at 58.450 seconds. The residential Brute became visible with clear fire at 32.750 seconds in the later Cryo replay. The earlier Passenger Vault trace recorded the first Spitter shot at 23.050 seconds. [Cryo trace](../../artifacts/nextgen/playtest/cryo-1729/trace.ndjson) · [Arc trace](../../artifacts/nextgen/playtest/arc-2718/trace.ndjson) · [Later Cryo trace](../../artifacts/nextgen/playtest/play31-final-native-cryo/trace.ndjson)

The first Relay Racks Cryo impact at 212.750 seconds contained the Warden, broken frame and live Spitter. I inspected the image at 1920×1080 and 480×270. A later Arc replay exposed an ability bypass that killed the protected Spitter before impact. The shutter now intercepts all incoming damage while it protects the gunner. The gunner's post moved north after the next replay showed that its body occupied the Warden's approach. [Cryo impact](../../artifacts/nextgen/playtest/cryo-1729/relay-racks-shutter-impact.png)

On the final shutter layout, the Arc 2718 continuation broke the shutter at 222.033 seconds. The 1920×1080 impact frame contains the Warden, shutter pieces and the living Spitter. The snapshot records a clear shot to the Spitter at impact. Its first recorded movement from the post was at 225.083 seconds. I inspected the frame at 1920×1080 and 480×270. [Impact frame](../../artifacts/nextgen/playtest/play31-shutter-clearance/relay-racks-shutter-impact.png) · [Impact trace](../../artifacts/nextgen/playtest/play31-shutter-clearance/trace.ndjson)

The later twelve-seed runs recorded 11 of 12 for Standard competent Cryo, 11 of 12 for Standard competent Breacher, and 9 of 12 for Story novice Cryo. All had zero stalls. Story's deaths were seeds 23 and 1024 in Infested Workshop and seed 65537 in Containment Annulus. Its sector 1–4 medians were 0.0, 0.0, 0.0 and 7.6. The Standard medians stayed as shown above. These runs sampled `40d35ff7`, `1a7f3baa` and `1e094f5c`, respectively.

| Delayed lock attempts by seed | 7 | 11 | 23 | 99 | 256 | 512 | 1024 | 2025 | 4096 | 6561 | 9001 | 65537 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Standard Cryo | 4 | 0 | 0 | 1 | 4 | 0 | 2 | 3 | 2 | 1 | 3 | 4 |
| Standard Breacher | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 1 | 0 | 0 |
| Story Cryo | 1 | 1 | 0 | 2 | 1 | 1 | 2 | 0 | 2 | 2 | 3 | 5 |

[Standard Cryo summary](../../artifacts/nextgen/playtest/play31-final-standard-cryo/summary.json) · [Standard Breacher summary](../../artifacts/nextgen/playtest/play31-final-standard-breacher/summary.json) · [Story Cryo summary](../../artifacts/nextgen/playtest/play31-final-story-cryo/summary.json)

The Breacher 1729 continuation reached the Coolant crossfire with its reserve counting down at 446.783 seconds and reached the later pincer at 468.367 seconds. Its leader survived until the reserve shipped. This playthrough did not exercise the closed entry. [Coolant trace](../../artifacts/nextgen/playtest/play31-coolant-reserve/trace.ndjson)

Native Cryo 1729 recorded both Swarm Junction pods at 624.033 seconds. The supply pod was at (600, 680) and the route pod at (600, 520), with the marine at approximately (235, 748). The supply destruction effect fired at 626.417 seconds. The room's saved mid frame precedes the brood cycle. [Swarm Junction trace](../../artifacts/nextgen/playtest/cryo-1729/trace.ndjson) · [Room frame](../../artifacts/nextgen/playtest/cryo-1729/r16-swarm-junction-mid.png)

A native Cryo novice continuation from the earned Transmission reward recorded the first Diagnostic Gallery Brute's strike at 311.783 seconds and sampled recovery at 312.017 seconds. Its next swing missed at 317.033 seconds. One of five Diagnostic Gallery observations recorded both a first strike and recovery. I inspected the strike and recovery frames at 1920×1080 and 480×270. [Strike frame](../../artifacts/nextgen/playtest/play31-gallery-exchange/hardest-28-0.png) · [Recovery frame](../../artifacts/nextgen/playtest/play31-gallery-exchange/hardest-28-3.png)

Communal Atrium recorded zero first-strike-and-recovery exchanges across five native observations. The first Brute reached wind-up in three of them. The focused Arc novice attempt reached wind-up at 57.650 seconds. The closer ingress therefore exposes a wind-up more often than the full first exchange shown in Diagnostic Gallery. [Atrium replay trace](../../artifacts/nextgen/playtest/play31-atrium-arc-exchange/trace.ndjson)

The prescribed full native commands each hit the runner's one-hour wall limit after 18 clears and zero runner errors. Cryo 1729 finished the last two rooms from its earned Containment Annulus checkpoint with zero errors. Those 20 clears span the earlier full-run build and the later continuation build. [Cryo full run](../../artifacts/nextgen/playtest/cryo-1729/report.json) · [Cryo continuation](../../artifacts/nextgen/playtest/play31-cryo-finale/report.json)

The later Cryo run cut off four Crawlers in Coolant Plant at 501.533 seconds. The receipt identifies reserve breach 0 and closed pincer entry 1. The crossfire counter rose to four at 501.567 and the following pincer canceled nine assigned arrivals by 512.300. This run predates the cutoff screenshot hook, so the trace establishes the consequence and the HUD and grille still lack a captured frame. [Cutoff trace](../../artifacts/nextgen/playtest/play31-final-native-cryo/trace.ndjson)

Arc 2718 finished the last two rooms from its earned Containment Annulus checkpoint with zero errors. Both requested seeds reached the ending across their split sessions. Arc recorded two delayed attempts across its full run and continuation. The initial Cryo runner counted approach checks as well as lock attempts. The later Cryo run used the corrected counter and recorded three delays in the 16 rooms it cleared before the supplemental run was stopped. The first recorded delay was in Freight Hold at 138.250 seconds. [Arc full run](../../artifacts/nextgen/playtest/arc-2718/report.json) · [Arc continuation](../../artifacts/nextgen/playtest/play31-arc-finale/report.json) · [Later Cryo trace](../../artifacts/nextgen/playtest/play31-final-native-cryo/trace.ndjson)

| Native suit loss | Cryo 1729 previous / first PLAY31 / later replay | Arc 2718 previous / PLAY31 |
|---|---:|---:|
| 1 · Awakening Bay | 10.0 / 10.0 / 10.0 | 0.0 / 0.0 |
| 2 · Passenger Vault | 0.0 / 0.0 / 0.0 | 0.0 / 0.0 |
| 3 · Residential Gallery | 0.0 / 0.0 / 0.0 | 0.0 / 0.0 |
| 4 · Communal Atrium | 0.0 / 2.3 / 0.0 | 0.0 / 0.0 |

## PLAY32

### Workshop stall

The prescribed Standard competent Pyro 99 replay reproduced `no-combat-progress-45s` in Infested Workshop. The two Brute-radius routes from the gantry returned the Brutes' own positions. Neither anchor was in attack range, and the director recorded zero delayed melee locks. The visible Brute had a rifle-clear lane but no plasma-clear lane. The input trace held Fire on plasma while the movement scorer rewarded the incorrectly clear position. This was a projectile-clearance mismatch in both bot backends. The bot did attempt to fire.

The lower gantry mouth is 96 units longer, and ordinary Brutes now get the same connected-ingress screening as elites, with separate body clearances. The navigation grid keeps its planning margin, and an enemy tangent to a solid can leave it on a physical-radius sweep. At the two original stopped poses, the corrected routes return (976, 688) and (1104, 656). Coordination holds and rehearsal admission have three-second ceilings. The bot uses the equipped weapon's projectile radius for line of fire and checks plasma separately before choosing it for plates. Pyro 99 cleared Workshop and finished the campaign after the first fix. [Reproduction](../../artifacts/nextgen/playtest/play32-stall/pyro-99.json) · [First fixed replay](../../artifacts/nextgen/playtest/play32-stall-fixed/pyro-99.json)

### Arrival swings

The first Brute in Communal Atrium and Diagnostic Gallery appears in a committed swing after the breach warning. The native melee state machine uses the same wind-up, strike shape, damage and recovery for the Brute's rank. The opening locks aim at emergence. Damage, knockback and stagger cannot interrupt that one arrival swing. The Brute becomes vulnerable on entering recovery and the light-enemy hold continues through the return-shot window.

| Native rig and seed | Atrium strike / recovery, seconds | Atrium suit loss | Gallery strike / recovery, seconds | Gallery suit loss |
|---|---:|---:|---:|---:|
| Breacher 1729 | 62.467 / 62.600 | 0 | 309.600 / 309.800 | 0 |
| Cryo 1729 | 52.400 / 52.533 | 0 | 296.433 / 296.567 | 0 |
| Pyro 1729 | 54.733 / 54.933 | 0 | 282.550 / 282.767 | 45 |
| Arc 1729 | 61.900 / 62.083 | 0 | 323.317 / 323.450 | 0 |
| Arc 2718 | 57.850 / 58.050 | 0 | 327.467 / 327.583 | 0 |

Recovery values use the native phase-transition receipt when available and the first sampled recovery otherwise. Suit loss uses the damage ledger at the strike. Pyro uses the full native campaign. The other observations replay the rooms from earned, compatible checkpoints. [Pyro campaign trace](../../artifacts/nextgen/playtest/pyro-1729/trace.ndjson) · [Breacher Atrium trace](../../artifacts/nextgen/playtest/play32-atrium-breacher-receipts/trace.ndjson) · [Breacher Gallery trace](../../artifacts/nextgen/playtest/play32-gallery-breacher/trace.ndjson) · [Cryo Atrium trace](../../artifacts/nextgen/playtest/play32-atrium-cryo-receipts/trace.ndjson) · [Cryo Gallery trace](../../artifacts/nextgen/playtest/play32-gallery-cryo/trace.ndjson) · [Arc 1729 Atrium trace](../../artifacts/nextgen/playtest/play32-atrium-arc/trace.ndjson) · [Arc 1729 Gallery trace](../../artifacts/nextgen/playtest/play32-gallery-arc/trace.ndjson) · [Arc 2718 Atrium trace](../../artifacts/nextgen/playtest/play32-atrium-arc-2718/trace.ndjson) · [Arc 2718 Gallery trace](../../artifacts/nextgen/playtest/play32-gallery-arc-2718/trace.ndjson)

### Standard repairs

Standard supply-stop purchases now restore up to 25 health or 20 armor, down from 35 and 30 at the existing prices. Story and Veteran retain their previous amounts. The shop displays the actual amount on the card. In the lead's Pyro 11 report, suit rose by 80 between Safety Interlock and Coolant Plant and by 65 between Manual Control and Overload Floor. The latter matches a full paid health repair plus an armor patch. The ten-point reduction per purchase targets that recovery. [Lead Pyro 11](/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/playtest/lead-w29-standard-pyro/pyro-11.json)

### Verification

The production build passed with Vite's chunk-size warning. The exact Pyro 1729 native command cleared all 20 rooms with zero errors or defects. It ran before the tangent-body navigation follow-up. The final-code Pyro 99 simulator replay also cleared Workshop and finished with no stall. [Pyro native campaign](../../artifacts/nextgen/playtest/pyro-1729/report.json) · [Pyro 99 final-code replay](../../artifacts/nextgen/playtest/play32-stall-tip/pyro-99.json)

The first cohort at `e31d4923` cleared 35 of 48 usual Standard campaigns, 41 of 48 fresh Standard campaigns and 22 of 24 usual Story campaigns, with zero stalls. The complete Story replay after the navigation follow-up cleared 23 of 24, with Cryo 11 of 12 and Breacher 12 of 12. [Story summary](../../artifacts/nextgen/playtest/play32-tip-story/summary.json)

| Cohort | Rig | Previous clears | PLAY32 clears |
|---|---|---:|---:|
| Standard competent, usual | Breacher | 11/12 | 9/12 |
| Standard competent, usual | Cryo | 11/12 | 8/12 |
| Standard competent, usual | Pyro | 11/12 | 10/12 |
| Standard competent, usual | Arc | 11/12 | 10/12 |
| Standard competent, usual | All four | 44/48 | **37/48** |
| Standard competent, fresh 101–124 | Breacher | 22/24 | 20/24 |
| Standard competent, fresh 101–124 | Pyro | 24/24 | 24/24 |
| Standard competent, fresh 101–124 | Both | 46/48 | **44/48** |
| Story novice, usual | Cryo | 12/12 | 11/12 |
| Story novice, usual | Breacher | 12/12 | 12/12 |
| Story novice, usual | Both | 24/24 | **23/24** |

The usual Standard cohort lands inside the 34–40 band, and the Story cohort exceeds the 20-clear floor. No stalls occurred in the 120 final-code cohort campaigns. The usual baselines are the lead's wave-29 results. The fresh comparison replay uses the `a5a2c59d` game and policy under the current simulator observer. The current game and policy also differ in pursuit, projectile clearance and the opening Brute attack, so the change in completions measures the release together with the repair step. [Usual Standard](../../artifacts/nextgen/playtest/play32-tip-usual/summary.json) · [Fresh Standard baseline](../../artifacts/nextgen/playtest/play32-fresh-baseline/summary.json) · [Fresh Standard PLAY32](../../artifacts/nextgen/playtest/play32-tip-fresh/summary.json)

The final-code Pyro 1729 native replay also cleared all 20 rooms with zero errors or defects. Its Atrium arrival struck at 54.733 and recovered at 54.867 seconds. Its Gallery arrival struck at 273.850 and recovered at 273.983 seconds. Both missed. [Final-code Pyro report](../../artifacts/nextgen/playtest/play32-tip-native-pyro/report.json) · [Final-code Pyro trace](../../artifacts/nextgen/playtest/play32-tip-native-pyro/trace.ndjson)

## PLAY33

1. The Shaft pincer stages its arrivals along the outer edge of the existing shaft machinery and leaves a 1.2-second break after the first approach. The clearance check includes projectile lines and nearby live or announced approaches as well as committed strikes. The existing commitment deadline still releases waiting enemies.
2. An arrival Brute loses armor normally to shots. Health damage accumulates as a banked wound, with a body glow and a separate damage number. The ordinary damage path applies the stored health damage when recovery begins and preserves the full committed swing.
3. Residential Gallery's opening pair uses an optional armor pickup. The Stalker covers the pickup approach and the plated Brute guards the adjacent lane. Atrium samples a full circle of short openings and checks that the chosen position shares the marine's unobstructed side.
4. Successfully interrupting Coolant Plant's Matron delays one open arm of the later pincer by 3.5 seconds. The hatch warning starts on dispatch, and the queued attackers gather behind its shutter.
5. The reserve cutoff moves the priority crest to the closed entry and keeps its bearing on the HUD until the affected pincer has arrived. The Relay Racks gunner uses the bare-floor side of the shutter. Swarm Junction's marked pods carry the power and armor icons for their relay and supply stakes until they hatch or die. The same icon appears at the viewport edge if its pod is outside the view.
6. The covered route's mark moved to its first protected foothold. Its preview line stops at the clipped cover lip. The cyan route arrows and secondary cover label were removed. The old Pyro near crossing landed at 731.467 seconds, followed by a fatal Stalker hit at 735.500 seconds. Arc 2718 reached the near bank at 813.100 seconds and took a fatal Crawler bite at 818.700 seconds. Both deaths followed several seconds of live pressure, so the arrival rules remain unchanged. [Pyro reference trace](/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final20/play/pyro/trace.ndjson) · [Arc 2718 reference trace](/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final20/play/arc-2718/trace.ndjson)
7. Shaft, Coolant and Overload admit up to two simultaneous Crawler bites. The first eligible featured Spitter gets an early, telegraphed volley and the normal post-shot reposition. The roster and incoming damage values stay fixed.

### Native receipts

Pyro locked the Residential lunge at 33.350 seconds, struck at 34.033 and entered recovery at 34.117. Arc locked at 42.233, struck at 42.917 and entered recovery at 43.000. The lesson contact multiplier is 0.65. Pyro banked 88 health damage on the lesson Stalker before its strike. [Pyro lock frame](../../artifacts/nextgen/playtest/play33-release-pyro/r3-residential-gallery-side-on-lock.png) · [Arc lock frame](../../artifacts/nextgen/playtest/play33-release-arc/r3-residential-gallery-side-on-lock.png)

Arc's first Atrium Brute was visible and had a clear line at the first wind-up sample, 63.633 seconds. Its armor fell from 412.72 to 332.72 before the 64.300-second strike and to 252.72 by the end of the strike. Pyro's first Atrium Brute was visible and clear at 53.433 and lost 80 armor before striking at 54.067. In Diagnostic Gallery, Arc stripped 160 armor before the 330.733 strike, and Pyro stripped 80 before the 284.700 strike. Neither Brute ran out of plate while the swing was protected. The targeted HUD replay showed “16 banked” over the protected Residential Stalker at 33.750. I inspected that frame at 1920×1080 and 480×270. [Arc trace](../../artifacts/nextgen/playtest/play33-release-arc/trace.ndjson) · [Pyro trace](../../artifacts/nextgen/playtest/play33-release-pyro/trace.ndjson) · [Banked label frame](../../artifacts/nextgen/playtest/play33-banked-pyro/r3-residential-gallery-banked-wound.png)

| Sector | Arc 1729 previous / PLAY33 | Pyro 1729 previous / PLAY33 |
|---|---:|---:|
| 2 · Passenger Vault | 0.0 / 0.0 | 0.0 / 0.0 |
| 3 · Residential Gallery | 0.0 / 0.0 | 0.0 / 0.0 |
| 4 · Communal Atrium | 0.0 / 0.0 | 0.0 / 0.0 |

Arc's Relay Racks checkpoint replay broke the corrected shutter at 213.333 seconds. The Spitter is separated from the Warden against bare deck. Pyro's Overload checkpoint replay showed the protected foothold at (778.4, 319.1) and the preview stopping at the cover lip at (833.7, 349.8) at 710.200 seconds. The preview waits until the marine approaches the relay, so the floor cue and lip are in the fight view. Both frames were inspected at 1920×1080 and 480×270. Pyro reached the far bank at 724.367 and finished at 730.317 without further suit loss after landing. [Shutter frame](../../artifacts/nextgen/playtest/play33-racks-arc/relay-racks-shutter-impact.png) · [Crossing frame](../../artifacts/nextgen/playtest/play33-cover-tip-pyro/r20-overload-floor-shelter-preview.png)

Pyro's Shaft pincer first announced at 436.117 seconds in the checkpoint replay. The first pincer warning is on the outer side of the winch path. Arc cleared the Shaft with 40.9 suit lost after dying there with 116.7 lost in R25. Pyro's Shaft loss fell from 57.5 to 26.4, and its trace sampled at most one simultaneous Crawler bite there. The Coolant replay cut off four Crawlers at 403.500 seconds and sealed breach 1, removing one arm of the next pincer. The crest remained active through 425.017 seconds, when the pincer queue emptied. At 421.067, the camera showed the gathering hatch with five attackers still queued. [Shaft announcement](../../artifacts/nextgen/playtest/play33-shaft-tip-pyro/r14-service-shaft-landing-shaft-pincer.png) · [Coolant crest](../../artifacts/nextgen/playtest/play33-coolant-final-pyro/r13-coolant-plant-sealed-entry.png) · [Gathering hatch](../../artifacts/nextgen/playtest/play33-coolant-final-pyro/r13-coolant-plant-hatch-in-view.png) · [Delayed queue trace](../../artifacts/nextgen/playtest/play33-coolant-final-pyro/trace.ndjson)

In Swarm Junction, both marked clutches were on screen at 531.517 seconds in the current Pyro checkpoint replay. The relay pod carried the power icon and the supply pod carried the armor icon. Arc's full Coolant loss fell from 135.3 to 49.3, while Pyro's increased from 8.9 to 103.4. The full Pyro trace sampled two simultaneous Crawler wind-ups or strikes at most in Coolant and recorded a 500 ms Spitter warning at 392.783. [Swarm Junction pod frame](../../artifacts/nextgen/playtest/play33-pods-tip-pyro/r16-swarm-junction-pod-destinations.png) · [Pyro incoming damage](../../artifacts/nextgen/playtest/play33-release-pyro/report.json) · [Arc incoming damage](../../artifacts/nextgen/playtest/play33-release-arc/report.json)

### Deterministic cohorts

| Cohort | Rig | PLAY32 clears | PLAY33 clears |
|---|---|---:|---:|
| Standard competent, usual | Breacher | 9/12 | 9/12 |
| Standard competent, usual | Cryo | 8/12 | 9/12 |
| Standard competent, usual | Pyro | 10/12 | 11/12 |
| Standard competent, usual | Arc | 10/12 | 8/12 |
| Standard competent, usual | All four | 37/48 | **37/48** |
| Standard competent, fresh 101–124 | Breacher | 20/24 | 18/24 |
| Standard competent, fresh 101–124 | Arc | 20/24 | 21/24 |
| Standard competent, fresh 101–124 | Both | 40/48 | **39/48** |
| Story novice, usual | Cryo | 11/12 | 12/12 |
| Story novice, usual | Breacher | 12/12 | 10/12 |
| Story novice, usual | Both | 23/24 | **22/24** |

Across the 120 simulations, no run stalled. Standard was inside the 34–40 clear band and Story exceeded the 20-clear floor, so the PLAY32 repair amounts remain in force. [Usual Standard](../../artifacts/nextgen/playtest/play33-tip-usual/summary.json) · [Fresh Standard](../../artifacts/nextgen/playtest/play33-tip-fresh-101-124/summary.json) · [Story](../../artifacts/nextgen/playtest/play33-tip-story/summary.json)

| Sector | PLAY32 suit loss across usual Standard | PLAY33 suit loss across usual Standard |
|---|---:|---:|
| 2 · Passenger Vault | 0.0 | 0.0 |
| 3 · Residential Gallery | 0.0 | 54.1 |
| 4 · Communal Atrium | 341.4 | 193.8 |

Crawler and Stalker contact accounted for 58.7% of total suit loss in the matched PLAY32 simulator cohort and 64.7% in PLAY33. In the three modified rooms, the share went from 75.5% to 79.0% in the Shaft, 63.8% to 70.2% in Coolant and 55.4% to 56.5% in Overload. These simulator figures use the same seed and rig set on both builds. R25's 70.8% came from five native campaigns.

### Verification

The production build passed. Arc and Pyro 1729 each cleared all 20 rooms with zero runtime or runner errors and zero stalls. Arc finished at 928.233 seconds and Pyro at 720.933. The harness returned exit 1 due to five Arc and seven Pyro room-loading holds over five wall seconds. Pyro took the near bank at 714.133 and cleared without further suit loss. The complete campaigns used the earlier PLAY33 build. Focused native checkpoint replays verified the later banked label, Relay Racks placement, marked pods, delayed hatch, reserve lifetime and clipped shelter preview. The final sealed-crest contrast and separation adjustments were build-verified. [Arc campaign](../../artifacts/nextgen/playtest/play33-release-arc/report.json) · [Pyro campaign](../../artifacts/nextgen/playtest/play33-release-pyro/report.json)

| Native Standard sample | R25 small-family contact share | PLAY33 small-family contact share |
|---|---:|---:|
| Arc and Pyro, seed 1729 | 79.1% | 59.7% |
| All five R25 Standard campaigns | 70.8% | — |

The matched native share divides 631.3 Crawler and Stalker contact damage by 1057.8 total suit damage. R25's matched sample ended earlier because Arc died in the Shaft. The deterministic cohort provides a second comparison with the same 48 starting configurations and a different result.

## PLAY34

- The later Diagnostic Gallery, Infested Workshop and Manual Control exchanges stage an existing melee attacker across the room's incident cover. The next request leaves about one second before it arrives.
- Workshop's clean brood-leader kill redirects the next flank to the entry farthest from the kill and cuts one arrival there. The changed entry uses the existing flank warning.
- Protected arrivals accept rig damage and show the same banked wound as weapon damage. Armor strips immediately. Queued health damage retains its source, and queued freeze, burn, shock and chill apply after the committed strike if the target survives.
- Residential's plated lesson opens the optional armor lane with a lateral shove and stagger when plasma breaks the plate. The novice policy had explicitly excluded Residential from lesson targeting even when the target was visible and in range.
- Swarm Junction places its first marked brood pair together in front of the marine and gives the Matron a head start on the escort arrivals.
- A short world-projected arrow carries the bearing from the defeated reserve target toward the persistent sealed-entry crest. The first queued silhouette advances to the grille while it waits.
- Overload's preview stops on the cover lip and keeps the impact marked for 1.3 seconds. Crossing route arrows were removed.

### Residential receipt

The Story novice Cryo checkpoint replay fired three plasma shots in Residential, compared with zero in R26. Plasma broke the staged plate at 40.183 seconds. The replay cleared the room with zero suit loss and zero runtime errors. The side-on lock and banked-wound frames precede the plate break. [Native replay](../../artifacts/nextgen/playtest/play34-residential-tip/report.json) · [Side-on lock frame](../../artifacts/nextgen/playtest/play34-residential-tip/r3-residential-gallery-side-on-lock.png) · [Trace](../../artifacts/nextgen/playtest/play34-residential-tip/trace.ndjson)
