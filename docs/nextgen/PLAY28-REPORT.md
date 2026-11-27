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
- Swarm Junction places its first marked brood pair together in front of the marine and holds escorts on whichever beat the seed assigns to the Matron. Escorts wait for the pair plus a 0.4-second margin, with a four-second ceiling after dispatch.
- A short world-projected arrow carries the bearing from the defeated reserve target toward the persistent sealed-entry crest. The first queued silhouette advances to the grille while it waits.
- Overload's preview stops on the cover lip and keeps the impact marked for 1.3 seconds. Crossing route arrows were removed.

### Residential receipt

The Story novice Cryo checkpoint replay fired three plasma shots in Residential, compared with zero in R26. Plasma broke the staged plate at 40.183 seconds. The replay cleared the room with zero suit loss and zero runtime errors. The side-on lock and banked-wound frames precede the plate break. [Native replay](../../artifacts/nextgen/playtest/play34-residential-tip/report.json) · [Side-on lock frame](../../artifacts/nextgen/playtest/play34-residential-tip/r3-residential-gallery-side-on-lock.png) · [Trace](../../artifacts/nextgen/playtest/play34-residential-tip/trace.ndjson)

### Late-room receipts

Breacher killed Workshop's Carrier at 554.017 seconds. The next flank used the far entry at (1180, 720), announced at 572.200. The room cleared for 27.7 suit compared with 133.6 in R26. The exposed hit at 581.317 was in the flank beat. [Workshop trace](../../artifacts/nextgen/playtest/play34-native-breacher/trace.ndjson) · [Workshop frame](../../artifacts/nextgen/playtest/play34-native-breacher/r15-infested-workshop-reserve-cut.png)

Breacher's Coolant reserve cut chose a sealed entry at 448.383 seconds. The bearing frame is at 448.533 and the later grille frame at 461.383. [Sealed entry](../../artifacts/nextgen/playtest/play34-native-breacher/r13-coolant-plant-sealed-entry.png) · [Gathering hatch](../../artifacts/nextgen/playtest/play34-native-breacher/r13-coolant-plant-hatch-in-view.png)

The first marked Swarm Junction pods are both in the Breacher frame at 611.367 seconds, with the supply pod near the lower edge. The Cryo finale checkpoint replay recorded the preview stop at (833.7, 349.8). The impact is on screen at 800.917 seconds and the snapshot retains it until 802.200. [Pod frame](../../artifacts/nextgen/playtest/play34-native-breacher/r16-swarm-junction-pod-destinations.png) · [Cover impact frame](../../artifacts/nextgen/playtest/play34-cover-impact/r20-overload-floor-shelter-impact.png)

### Balance

Standard's first cohort cleared 41 of 48. Standard paid health repair went from 25 to 22 and armor repair from 20 to 17. The retuned usual cohort cleared 40 of 48 before the final Matron timing adjustment. The final cohorts below include that adjustment. No enemy counts or damage values changed in the retune.

| Cohort | R26 clears | PLAY34 clears |
|---|---:|---:|
| Standard usual · Breacher / Cryo / Pyro / Arc | 7 / 9 / 10 / 9 | 9 / 10 / 11 / 9 |
| Standard usual total | 35/48 | 39/48 |
| Standard fresh 101–124 · Breacher / Arc | — | 23/24 / 21/24 |
| Standard fresh total | — | 44/48 |
| Story usual · Cryo / Breacher | 12 / 11 | 11 / 11 |
| Story usual total | 23/24 | 22/24 |

Zero stalls across all 120 cohort runs. The matched usual Standard cohort spent 0 → 0 suit in Passenger Vault, 54.1 → 54.1 in Residential Gallery, and 203.2 → 260.9 in Communal Atrium. [Usual Standard](../../artifacts/nextgen/playtest/play34-marked-usual/summary.json) · [Fresh Standard](../../artifacts/nextgen/playtest/play34-marked-fresh/summary.json) · [Story](../../artifacts/nextgen/playtest/play34-marked-story/summary.json)

### Protected rig hit

In the Breacher Residential trace, Seismic Slam hit the protected Stalker at 41.083 seconds and banked 90 health damage. Rifle and shotgun contacts banked separately. The Stalker completed its strike, and recovery at 41.483 released the 224.4-point combined bank. The trace does not establish the elemental status payout on a protected Brute. [Banked wound frame](../../artifacts/nextgen/playtest/play34-native-breacher/r3-residential-gallery-banked-wound.png) · [Breacher trace](../../artifacts/nextgen/playtest/play34-native-breacher/trace.ndjson)

### Full native campaigns

Breacher seed 1729 finished all 20 rooms at 837.667 seconds, and the fresh Cryo retry finished all 20 at 906.600. Both recorded zero runtime errors and zero stalls. Their harnesses reported five and two loading holds over five wall seconds respectively. The earlier fresh Cryo attempt died in Transmission at 263.400. A separate Cryo continuation from an earned R26 sector-10 boundary cleared through the end at 866.983 with zero errors or loading findings. The full campaigns preceded the final repair and escort timing changes. The repaired build supplied the finale impact replay, and the seeded escort timing was exercised in Swarm Junction checkpoint replays. [Breacher campaign](../../artifacts/nextgen/playtest/play34-native-breacher/report.json) · [Cryo campaign](../../artifacts/nextgen/playtest/play34-cryo-final-title/report.json) · [Cryo continuation](../../artifacts/nextgen/playtest/play34-cryo-diagnostic-continuation/report.json)

| Native room | Breacher exposed hits · suit loss, R26 → PLAY34 | Cryo exposed hits · suit loss, R26 → PLAY34 |
|---|---:|---:|
| Diagnostic Gallery | 3 · 83.0 → 1 · 45.0 | 1 · 120.8 → 3 · 38.4 |
| Infested Workshop | 2 · 133.6 → 1 · 27.7 | 3 · 18.2 → 1 · 104.0 |
| Manual Control Chamber | 1 · 90.8 → 2 · 136.5 | 1 · 98.6 → 0 · 129.3 |

The Cryo checkpoint continuation recorded five exposed hits and 137.2 suit lost in Diagnostic, one and zero in Workshop, and zero and 76.3 in Manual Control. None of these three sampled campaigns landed an exposed hit during the new second beat itself. Breacher's pair in Manual Control registered at 753.433 seconds in beat zero, and Cryo's last Gallery punish came at 377.483 in beat two. The frames provide room context. [Gallery frame](../../artifacts/nextgen/playtest/play34-cryo-final-title/r11-diagnostic-gallery-mid.png) · [Manual Control frame](../../artifacts/nextgen/playtest/play34-native-breacher/r19-manual-control-chamber-mid.png)

Across the matched full Breacher and Cryo traces, the share of weapon contacts on exposed actors moved from 30/4,246 (0.707%) to 32/4,823 (0.663%). R26's wider five-run sample was 84/12,460 (0.674%). Native suit costs in sectors 2–4 were 0 / 0 / 0 → 0 / 0 / 0 for Breacher and 0 / 0 / 4.8 → 0 / 0 / 0 for Cryo.

The corrected Swarm replays exercised the bounded escort hold. Cryo’s matched checkpoint replay moved the first escorts from 648.200 to 654.400 seconds; the Matron was killed before a marked pair appeared. The earlier pod frame verifies placement, while the corrected trace verifies the wait and fallback. The final production build passed. [Corrected Swarm trace](../../artifacts/nextgen/playtest/play34-marked-native/trace.ndjson)

## PLAY35

1. Manual Control's second beat commits a Brute at the console end, marks the bait and step, and draws the return lane. The other arrivals wait outside the exchange and release in a paced sequence. The hold expires after 4.8 seconds, and the authored recovery keeps its 1.5-second opening even if the Brute loses its melee berth.
2. Residential's optional armor is directly behind the shell's starting footprint. The follow-up Stalker shares the approach, and an obstructed corner falls back to a nearby legal plate lane. The full R27 Story Cryo trace entered with 20 plasma in the magazine and 37 in reserve. Its plated Brute appeared over 690 units away and offscreen, with only three armored samples. The policy had required the explicit lesson target and a clear line for the equipped gun. It now uses plasma clearance and can recognize a nearby visible shell if the lesson prompt is late.
3. Passenger Vault's lesson Brute commits within reach. The Residential and Atrium lessons retain their protected warnings. These three lesson strikes use partial damage, further scaled by Story's existing multiplier. The R27 matched traces identify Crew Checkpoint crossfire, Armory priority, Freight Hold pincer and Loading Bay interception as their largest ordinary damage beats. One ordinary arrival in each receives a 950ms delay on Standard.
4. Destroying a marked pod visibly pushes and briefly staggers the nearest small screen group. The supply pod sits beside its actual armor pickup and the relay pod is staged along the bearing to the relay.
5. Coolant seals the nearest eligible pincer entry to the leader's death position. The choice uses game geometry and keeps the persistent crest and visible staged body.
6. The first ordinary post-supply fight uses two existing Transmission actors. One is beyond the receiver corner and the other occupies the approach. The setup recognizes both exclusives for each rig. The staged capture uses native room setup with the chosen augment and an illustrative cast.
7. The Overload preview sends three zero-damage projectiles to the same cover face, spaced 220ms apart. Each impact renews the held lip mark.

### Manual Control native checkpoint replays

The replays resume earned R27 sector-18 boundaries. Breacher, Pyro and Arc 1729 used the first build that authored the console window. Cryo used the follow-up that preserved recovery after melee berth release. Pyro and Arc 2718 were replayed once more with spaced releases and are recorded at their latest timings below. The runs retain independent bot movement and target selection.

| Rig and seed | R27 beat-one exposed shot | PLAY35 beat-one exposed shot | R27 suit loss | PLAY35 suit loss |
|---|---:|---:|---:|---:|
| Breacher 1729 | No | 718.033s | 79.3 | 58.3 |
| Cryo 1729 | No | No | 119.2 | 91.6 |
| Pyro 1729 | No | 685.467s | 0.0 | 44.9 |
| Arc 1729 | No | 845.500s | 40.3 | 27.7 |
| Arc 2718 | No | 773.117s | 25.8 | 94.8 |

Four replays landed the shot. The suit-loss ceiling failed on Pyro and Arc 2718. Cryo's 775.517s frame contains only the visible recovering Brute and the marine with a clear line. Cryo cast Q while moving and its plasma shot struck cover. Breacher had one renderer kit preparation error under host contention. The spaced Pyro and Arc 2718 replays each cleared with zero runtime errors. [Cryo window](../../artifacts/nextgen/playtest/play35-window-cryo/r19-manual-control-chamber-console-window.png) · [Breacher return](../../artifacts/nextgen/playtest/play35-manual-breacher/r19-manual-control-chamber-console-return.png) · [Pyro return](../../artifacts/nextgen/playtest/play35-spaced-pyro/r19-manual-control-chamber-console-return.png) · [Arc 1729 return](../../artifacts/nextgen/playtest/play35-manual-arc/r19-manual-control-chamber-console-return.png) · [Arc 2718 return](../../artifacts/nextgen/playtest/play35-spaced-arc-2718/r19-manual-control-chamber-console-return.png)

### Residential and Overload receipts

The corrected Story Cryo checkpoint replay fired three plasma shots in Residential and broke the plate at 34.867 seconds. It then cleared sector 3 with zero runtime errors. [Residential frame](../../artifacts/nextgen/playtest/play35-novice-residential/r3-residential-gallery-side-on-lock.png) · [Residential trace](../../artifacts/nextgen/playtest/play35-novice-residential/trace.ndjson)

The Arc finale replay recorded three impacts at 912.633, 913.417 and 914.133 seconds on the same cover point at (833.7, 349.8). [Cover impact frame](../../artifacts/nextgen/playtest/play35-finale-arc/r20-overload-floor-shelter-impact.png)

### Early pacing and exclusive captures

In five matched deterministic simulations (Breacher, Cryo, Pyro and Arc 1729, plus Arc 2718), sectors 2–4 cost 27.7 → 0.0 suit and sectors 5–8 cost 729.3 → 686.7. These compare simulator checkpoints on R27 and PLAY35, separately from R27's rendered total of 0.0 and 620.5. The native attack receipts establish that the lessons commit. This simulator sample did not show the intended increase in early errors. [R27 simulator cases](../../artifacts/nextgen/playtest/play35-early-before-1729/summary.json) · [PLAY35 simulator cases](../../artifacts/nextgen/playtest/play35-early-tip-1729/summary.json)

The Transmission staged gallery contains eight frames and zero capture errors. It shows Pilgrim Pylon and Live Wire, Shard Harvest and Ice Road, Siege Plow and Fault Line, Ember Relay and Meltdown Core. These are staged casts in the post-supply room. They do not establish campaign success with each augment. [Exclusive frames](../../artifacts/nextgen/play35-exclusives/index.html)

Arc's Swarm replay showed the separate pod destinations at 684.767 seconds. Destroying the supply pod emitted the saved-lane pulse at 686.567, captured at 686.633. [Pod positions](../../artifacts/nextgen/playtest/play35-stake-arc/r16-swarm-junction-pod-destinations.png) · [Saved supply pulse](../../artifacts/nextgen/playtest/play35-stake-arc/r16-swarm-junction-saved-stake.png)

### Balance cohorts

| Cohort | R27 | PLAY35 |
|---|---:|---:|
| Standard usual · Breacher / Cryo / Pyro / Arc | 7 / 9 / 9 / 9 | 9 / 11 / 11 / 9 |
| Standard usual total | 34/48 | 40/48 |
| Standard fresh · Cryo 101–124 | 17/24 | 16/24 |
| Story usual · Cryo / Breacher | — | 10 / 12 |
| Story usual total | 23/24 | 22/24 |

All 96 final simulator runs had zero stalls. Usual Standard is inside the band and above the repair restoration threshold, so Standard's paid repair remains 22 health and 17 armor. [Usual Standard](../../artifacts/nextgen/playtest/play35-release-usual/summary.json) · [Fresh Cryo](../../artifacts/nextgen/playtest/play35-release-fresh/summary.json) · [Story](../../artifacts/nextgen/playtest/play35-release-story/summary.json)

### Coolant and verification

Arc selected Coolant breach 3 on its 494.600-second reserve cut. The marked-entry frame is at 494.767; this verifies the nearer entry was selected. The replay did not verify a waiting body at that closed grille. [Coolant seal frame](../../artifacts/nextgen/playtest/play35-full-arc/r13-coolant-plant-sealed-entry.png)

The final production build passed. I stopped the full native campaigns at their one-hour wall budget. Arc had cleared 13 rooms and Breacher 14, with zero runtime errors before shutdown. Shutdown itself was recorded as a closed-browser runner error. A separate Arc finale checkpoint replay cleared the final room after one renderer kit preparation error. Breacher's finale restarts hit loading timeouts. The requested two zero-error full native clears remain unverified. [Arc full attempt](../../artifacts/nextgen/playtest/play35-full-arc/report.json) · [Breacher full attempt](../../artifacts/nextgen/playtest/play35-full-breacher/report.json) · [Arc finale replay](../../artifacts/nextgen/playtest/play35-finale-arc/report.json)

## PLAY36

### Breacher diagnosis

The five lead-reported Standard losses end in different rooms. Two finish with Crawler contact, one with Stalker contact, one with a Brute hit and one with Spitter fire.

| Seed | Fatal room | Beat | Fatal family | Entry suit |
|---|---|---|---|---:|
| 7 | 11 · Diagnostic Gallery | 0 · Cut back around the recorder | Stalker | 7.7 |
| 23 | 17 · Shielding Gate | 1 · Silence the two firing lanes | Spitter | 28.3 |
| 512 | 20 · Overload Floor | 2 · Hold the relay and turn the final flank | Crawler | 120.3 |
| 4096 | 13 · Coolant Plant | 1 · Silence the two firing lanes | Crawler | 92.6 |
| 6561 | 12 · Safety Interlock | 1 · Hold a lane, then change position | Brute | 82.0 |

| Lead's 12 usual Standard seeds | Breacher | Cryo | Pyro | Arc |
|---|---:|---:|---:|---:|
| Clears | 7 | 11 | 12 | 10 |
| Dash / tactical / power / overdrive uses per run | 90.7 / 104.0 / 26.1 / 8.5 | 140.4 / 75.1 / 75.4 / 11.4 | 103.8 / 120.5 / 54.4 / 10.8 | 107.9 / 108.5 / 43.3 / 10.3 |
| Direct ability damage per use, all slots | 87.6 | 72.7 | 121.4 | 92.2 |
| Crawler suit loss per run | 230.4 | 419.2 | 181.5 | 161.9 |
| Projectile suit loss per run | 160.8 | 198.1 | 126.6 | 145.0 |

Seed 7 reached Diagnostic with 7.7 suit on Breacher compared with 83.4, 107.2 and 75.5 for Cryo, Pyro and Arc. Seed 23 reached Shielding Gate with 28.3 compared with 137.5 and 168.2 for Cryo and Pyro. Arc had already died. In seed 512's finale, the four rigs entered with 120–130 suit. Breacher dealt 1,377 direct ability damage there and died. Cryo, Pyro and Arc dealt 4,552, 3,767 and 1,590 and cleared. For seed 6561, Arc entered Interlock with 69.1 suit versus Breacher's 82.0 and cleared while dealing 1,744 direct ability damage compared with Breacher's 846. Breacher therefore has both carry-in losses and late exchanges it cannot survive from comparable suit. In the finale Arc also dealt 4,698 weapon damage against Breacher's 2,792. In Shielding Gate Cryo and Pyro dealt 3,957 and 2,815 weapon damage against Breacher's 1,411. Those are room totals that include the additional time the surviving rigs spent fighting, so they cannot isolate a weapon range disadvantage.

In the four R27 native seed-1729 traces, receipt damage per actual use and target contacts per use were as follows. Contacts count repeated effects on the same actor. The damage column only counts recorded direct ability receipts. It omits status damage, blocked projectiles and utility such as Arc's Overclock.

| Slot · damage / target contacts per use | Breacher | Cryo | Pyro | Arc |
|---|---:|---:|---:|---:|
| Tactical | 156.1 / 2.43 | 151.2 / 4.48 | 193.7 / 14.28 | 147.9 / 7.12 |
| Power | 0.0 / 5.12 | 119.7 / 2.01 | 174.5 / 30.57 | 212.8 / 9.54 |
| Overdrive | 256.0 / 4.50 | 393.9 / 61.83 | 265.0 / 22.91 | 0.0 / 0.00 |

The 169 Breacher power target receipts are Siege Plow contacts. The bot did use the augment. Bulwark's projectile interception changes barrier health without emitting a dedicated blocked-damage receipt, so these logs cannot rank its protection per use. Likewise Cryo's frequent dashes and freeze ticks describe how its toolkit is used but do not directly measure escaping a lethal lane.

| Fresh baseline · 24 Standard seeds per rig | Breacher | Cryo | Pyro | Arc |
|---|---:|---:|---:|---:|
| Clears | 22 | 15 | 24 | 20 |
| Dash / tactical / power / overdrive uses per run | 114.3 / 120.7 / 30.9 / 10.6 | 116.0 / 61.8 / 63.8 / 8.5 | 101.9 / 119.8 / 54.5 / 10.4 | 111.6 / 105.3 / 43.3 / 10.4 |
| Direct ability damage per use, all slots | 91.0 | 71.4 | 115.7 | 93.9 |

The fresh baseline's Breacher deaths were seed 117 to a Stalker in Manual Control's “Read the flank” beat and seed 123 to a Crawler in Swarm Junction's “Choose an exit before the arms close” beat. On seed 117, Breacher entered with 32.8 suit and lost 34.8. Cryo, Pyro and Arc entered with 175.4, 105.4 and 63.9 and lost 77.8, 51.0 and 12.0. On seed 123, Breacher entered with 71.8 and lost 75.8. Cryo and Pyro entered with 174.1 and 122.3 and lost 57.7 and 46.1. Arc died four sectors earlier. The usual seeds alone overstate Breacher's weakness relative to Cryo and Arc.

### Policy correction

The baseline aim scored Bulwark like an attack centered on an enemy, requiring a body inside the barrier's 18-unit footprint. Static Bulwark now looks for an enemy approach or visible firing lane beyond a legal barrier. Siege Plow scores a shorter forward corridor and checks that the wall can travel along it. The bot can also deploy against a single nearby threat or Spitter when the lane is useful. This is a playtest policy fault. The game kit, enemies and repair economy were left untouched.

### Matched beat and native check

A baseline-policy replay of seed 4096 separates Coolant's opening from the fatal crossfire. Breacher spent 68.2 suit in beat 0. In beat 1 it recorded three Crawler kills, seven dashes, one power use and 440.7 direct ability damage before the terminal sample. Cryo recorded 12 Crawler kills, 12 dashes, two power uses and 403.0 direct ability plus 53.1 status damage in the completed beat. Pyro killed eight Crawlers and dealt 537.8 direct plus 426.5 status damage with 8.9 suit spent. Arc killed seven Crawlers and spent zero suit, with a power use, two tacticals and Overclock. The beat-level totals cover different durations because Breacher died. The complete room ledger includes the fatal hit. [Matched Coolant simulations](../../artifacts/nextgen/playtest/play36-coolant-beats/summary.json)

The native Breacher 1729 Coolant checkpoint replay cleared at 479.6 seconds with zero runtime errors. It spent 37.8 suit, used Bulwark five times, and recorded 13 Siege Plow contacts, 16 tacticals and one Railbreaker. The replay used the Bulwark aim correction. [Native report](../../artifacts/nextgen/playtest/play36-native-coolant/report.json) · [Coolant frame](../../artifacts/nextgen/playtest/play36-native-coolant/r13-coolant-plant-mid.png)

Power uses per Breacher run rose from 26.1 to 37.5 on the usual seeds and from 30.9 to 39.9 on the fresh seeds. The Bulwark correction recovered usual seeds 7 and 6561. The other three usual Breacher losses all moved to Safety Interlock. On fresh seeds 104, 120 and 124 changed from clears to losses. Four of the five fresh losses ended with Crawler damage and one with Stalker damage. I also tried letting Railbreaker fire at a strong line of two targets. It still cleared 9 of 12 usual seeds and moved seed 512's death to sector 10, two sectors earlier than the Bulwark-only run, so I reverted it.

### Cohorts and verification

The production build passed. The native checkpoint replay above used the same Bulwark policy as the final cohorts. The final code has only formatting changes after that replay.

| Cohort | Previous | PLAY36 |
|---|---:|---:|
| Standard usual · Breacher / Cryo / Pyro / Arc | 7 / 11 / 12 / 10 | 9 / 11 / 12 / 10 |
| Standard usual total | 40/48 | 42/48 |
| Story novice usual · Breacher / Cryo | 11 / 11 | 12 / 11 |
| Story novice usual total | 22/24 | 23/24 |
| Standard fresh · Breacher | 22/24 | 19/24 |
| Standard fresh · Cryo | 15/24 | 15/24 |

The usual Standard cohort finished two clears above the band. Pyro led both samples with 12/12 usual and 24/24 fresh, and the two additional usual clears came from Breacher. The usual spread was three clears. On fresh seeds, the two rerun rigs were four clears apart, and the baseline spread across all four was nine. The within-two target remains unmet. There were zero stalls across all 120 final simulator runs. [Usual Standard](../../artifacts/nextgen/playtest/play36-aim-usual/summary.json) · [Story](../../artifacts/nextgen/playtest/play36-aim-story/summary.json) · [Fresh Standard](../../artifacts/nextgen/playtest/play36-aim-fresh/summary.json) · [Fresh baseline Breacher](../../artifacts/nextgen/playtest/play36-base-breacher/summary.json) · [Fresh baseline Cryo](../../artifacts/nextgen/playtest/play36-base-cryo/summary.json) · [Fresh baseline Pyro](../../artifacts/nextgen/playtest/play36-base-pyro/summary.json) · [Fresh baseline Arc](../../artifacts/nextgen/playtest/play36-base-arc/summary.json)

## PLAY37

### Encounter changes

- Manual Control searches both ends of the existing console for a legal Brute position. The bait and landing have clear sightlines. The center retreat line must intersect cover. The 1.5-second recovery floor and the ordinary bot policy are retained.
- Passenger Vault stages its opening Brute within the sweep's range on a clear lane and puts 12 armour at the furthest traversable trial step on the lateral dodge route. A melee-strike receipt records phase entry before the arc and line-of-sight tests. Suit damage additionally requires a vulnerable marine. The lesson keeps normal dodge invulnerability and its forgiving damage multiplier.
- Coolant releases the crossfire screen into withdrawal once the featured threats are gone and the beat has dispatched. Shaft adds 220 ms of spacing per following pincer arrival. The PLAY35 encounter diff does not contain a direct Shaft staging edit, so the earlier suit increase cannot be attributed to a specific PLAY35 Shaft change.
- Protected wounds retain their presentation glow until at least 160 ms of presentation time after the last bank effect. The release flinch uses the recovery receipt, including when the actor already entered corpse presentation. Simulation damage timing is unchanged.
- Coolant and the Relay Racks shutter request up to four world units of focus shift before the existing HUD and room constraints. The seal request lasts two seconds and shows one silhouette approach and recoil. The shutter request begins during charge commitment and clears on a shot crossing the opened frame or after two seconds.
- Transmission searches for a second nearby obstruction around the existing corner, with a fallback to the first corner if no legal setup is found. Saving the supply pod visibly lifts the retained armour pickup. The finale retains a short bright impact line on the cover face and requires a marine-clear foothold for its shelter mark.

### Verification

The production build passed, including a rebuild of the final Passenger adjustment. In a stationary deterministic replay from the earned Arc 1729 Awakening checkpoint, the opening Passenger Brute took 13.23 armour (46.00 to 32.77), left health at 100, and left the 12-armour pickup 148 units along the lateral step. The native Arc and Breacher runs from the preceding build both took zero suit in Passenger. The Arc banked-wound frame is at 14.883 seconds. The Breacher trace has bank and recovery events in the same input sample at 17.633 seconds. Those receipts show the triggering case. They do not time the rendered release. [Stationary simulation](../../artifacts/nextgen/play37-probe/passenger.json) · [Native Arc wound frame](../../artifacts/nextgen/playtest/play37-native-arc/r2-passenger-vault-banked-wound.png)

The Arc 1729 Manual Control checkpoint replay showed the Brute recovering at (390, 649.9) at 806.617 seconds. The marine was at (594.9, 293.8), outside the marked landing at (304, 677), with no clear shot. The window therefore shows the blocked retreat side but does not demonstrate a landing and return shot. The replay cleared Manual Control at 833.200 seconds with 82.0 suit lost versus 27.7 in Final23. It recorded zero exposed contacts and an original ship kit preparation timeout. The native landing and suit-loss targets remain unmet in this replay. [Recovery frame](../../artifacts/nextgen/playtest/play37-console-arc/r19-manual-control-chamber-console-window.png) · [Replay report](../../artifacts/nextgen/playtest/play37-console-arc/report.json)

Final23 Standard suit totals were 40.1 in sectors 1–4, 453.0 in sectors 5–8 and 1,035.7 in sectors 13–16. The full native campaigns and final-head simulator series were launched under concurrent gallery load. A separate native Arc checkpoint replay on the tip cleared Passenger at 26.950 seconds with zero suit loss and zero runtime errors. [Tip Passenger replay](../../artifacts/nextgen/playtest/play37-tip-passenger/report.json)

| Verification metric | Previous | PLAY37 status |
|---|---:|---|
| Standard usual clears | 42/48 with PLAY36 policy | 42/48 after Napalm (11 / 11 / 9 / 11) |
| Story novice usual clears | 23/24 | 24/24 |
| Standard fresh Breacher / Pyro clears | 19/24 / 24/24 | 24/24 / 23/24 |
| Standard native suit, sectors 1–4 / 5–8 / 13–16 | 40.1 / 453.0 / 1,035.7 | Matched aggregate pending |
| Manual Control landing then return hits | 0 across five Final23 Standard runs | No hit in the sampled Arc replay window |

Prior fresh Pyro is the PLAY36 baseline, and prior fresh Breacher is after the Bulwark policy correction. Standard reached 43/48 before the Pyro adjustment. The measured Pyro step brought it to 42/48, two above the requested band.

The Breacher, Cryo and Arc full-campaign attempts each cleared the first four sectors with zero runtime errors before I stopped them to prioritize the final cohorts and the focused late replay. Their matched sectors 1–4 spent 30.1 suit in Final23 and 20.0 in those PLAY37 attempts. Those attempts used the build before the final Passenger chip adjustment.

The tip's Breacher 1729 Shaft checkpoint replay cleared at 523.800 seconds with zero suit loss and zero runtime errors. Final23's full Breacher campaign spent 86.4 suit there. The pincer announcement frame is at 489.767 seconds. A separate Coolant-to-Shaft attempt hit its 750-second wall budget in Coolant at 466.800 simulation seconds with zero runtime errors. Its delayed hatch frame at 453.517 seconds had the hatch outside the viewport. That was a brood-delay frame and does not measure the reserve-cut camera adjustment. [Shaft pincer frame](../../artifacts/nextgen/playtest/play37-tip-shaft/r14-service-shaft-landing-shaft-pincer.png) · [Shaft report](../../artifacts/nextgen/playtest/play37-tip-shaft/report.json) · [Coolant hatch frame](../../artifacts/nextgen/playtest/play37-tip-coolant-shaft/r13-coolant-plant-delayed-hatch.png)

| Manual Control case | Final23 suit | PLAY37 suit | Landing followed by return hit |
|---|---:|---:|---|
| Breacher 1729 | 22.8 | — | No completed native room |
| Cryo 1729 | 57.5 | — | No completed native room |
| Pyro 1729 | 0.0 | — | No PLAY37 native run |
| Arc 1729 | 27.7 | 82.0, checkpoint | No |
| Arc 2718 | 0.0 | — | No PLAY37 native run |

Native Breacher saved the Swarm stakes at 597.900 seconds and cleared the room with zero runtime errors. Native Arc recorded the short cover-face impact at 856.267 seconds and completed from the finale checkpoint at 883.900 with zero runtime errors. [Saved stake](../../artifacts/nextgen/playtest/play37-tip-swarm/r16-swarm-junction-saved-stake.png) · [Cover impact](../../artifacts/nextgen/playtest/play37-tip-finale/r20-overload-floor-shelter-impact.png)

The pre-tuning Standard cohort cleared 43/48. Pyro was 10/12 on the usual seeds and 22/24 fresh, down from 12/12 and 24/24 in the PLAY36 comparison. The prior native Pyro power sample averaged 30.57 contact receipts per cast, with recurring contacts on overlapping targets in a persistent pool. The single tuning step shortened Napalm Charge pools from six seconds to five, or four fewer quarter-second pulse opportunities per pool. Damage per pulse, radius, charge count, cooldown, enemies, and repairs stayed at their prior values.

The matched Standard simulator suit ledger uses the same seed and rig pairs from PLAY36 and PLAY37, with the tuned Pyro runs substituted. Each block includes only pairs where both builds cleared the entire block. These values are separate from the Final23 native sample.

| Sector block | Matched pairs | PLAY36 suit | PLAY37 suit |
|---|---:|---:|---:|
| 1–4 | 48 | 358.7 | 316.6 |
| 5–8 | 48 | 5,000.1 | 5,185.9 |
| 13–16 | 43 | 7,170.9 | 8,822.7 |

Arc's Relay Racks replay broke the shutter at 208.583 seconds. The Warden was visible with the marine, the pair fit the HUD framing, and the room constraint reported zero outside area. The retained world-space offset after constraints was not sampled. [Shutter break](../../artifacts/nextgen/playtest/play37-tip-relay-transmission/r9-relay-racks-shutter-break.png)

The same Arc replay reached Transmission with Pilgrim Pylon. The mid-room frame at 249.383 seconds shows the Spitter behind cover at (990.4, 402.5). The room cleared at 321.983 with zero runtime errors. That sample does not verify both exclusive solutions. [Transmission frame](../../artifacts/nextgen/playtest/play37-tip-relay-transmission/r10-transmission-chamber-mid.png)

There were zero stalls in the 120 final cohort cases. The final ledger retains the 84 non-Pyro cases from the encounter revision and substitutes the 36 rerun Pyro cases from the Napalm revision. [Untuned Standard](../../artifacts/nextgen/playtest/play37-tip-standard/summary.json) · [Story](../../artifacts/nextgen/playtest/play37-tip-story/summary.json) · [Untuned fresh](../../artifacts/nextgen/playtest/play37-tip-fresh/summary.json) · [Tuned Pyro usual](../../artifacts/nextgen/playtest/play37-napalm-usual/summary.json) · [Tuned Pyro fresh](../../artifacts/nextgen/playtest/play37-napalm-fresh/summary.json)

## PLAY38

The native HUD and observer share a projection of the floor marks. The observer receives only drawn points and their current visibility, plus the existing floor path query and visible enemy poses. Both runners accept `--exchange-marks=on|off`. Only the competent policy acts on the marks. A first navigation sample showed that the grid could return no waypoint for a nearby mark, so the observer now recognizes a directly traversable route before consulting the grid.

The initial Breacher replay establishes that using the landing can produce a return hit. It reached the landing and hit the recovering Brute twice, but it skipped the bait and spent 150.5 suit against 30.7 with the policy OFF. It cleared in 64.87 seconds against 66.42. Cryo also spent more suit with the marks enabled (111.3 against 88.5). Pyro saved 6.1 suit without taking the exchange. [Breacher landing](../../artifacts/nextgen/playtest/play38-routed-on-breacher/r19-manual-control-chamber-exchange-landing.png) · [Breacher return](../../artifacts/nextgen/playtest/play38-routed-on-breacher/r19-manual-control-chamber-console-return.png)

### Baseline ON/OFF

The native checkpoint rows below use OFF → ON. A bait stand required a stationary observation within 22 units. A landing required an observation within 22 units. The hit column counts exposed contacts on the Brute by the drawn lane while it was in recovery. An OFF hit can therefore count even without visiting the landing. Suit in the beat comes from the campaign ledger at the first and last sampled states for beat one.

| Native case | Bait stand | Landing | Exposed contacts | Beat suit | Room suit | Room seconds |
|---|---|---|---:|---:|---:|---:|
| Breacher 1729 | No → No | No → Yes | 1 → 2 | 0.0 → 44.1 | 30.7 → 150.5 | 66.42 → 64.87 |
| Cryo 1729 | No → No | No → No | 0 → 0 | 0.0 → 12.6 | 88.5 → 111.3 | 67.08 → 67.38 |
| Pyro 1729 | No → No | No → No | 0 → 0 | 0.0 → 0.0 | 51.0 → 44.9 | 42.08 → 41.57 |
| Arc 1729 | No → No | No → Yes | 0 → 0 | 0.0 → 0.0 | 71.8 → 120.6 | 49.43 → 55.87 |
| Arc 2718 | No → No | No → Yes | 15 → 3 | 0.0 → 45.0 | 24.6 → 116.0 | 50.92 → 56.23, died |

| Usual Standard simulator | Room entries OFF → ON | Manual Control deaths OFF → ON | Median room suit OFF → ON |
|---|---:|---:|---:|
| Breacher | 11 → 11 | 0 → 0 | 25.2 → 69.0 |
| Cryo | 12 → 12 | 0 → 0 | 87.5 → 96.4 |
| Pyro | 10 → 10 | 1 → 1 | 54.5 → 54.9 |
| Arc | 11 → 11 | 0 → 0 | 28.6 → 67.0 |

Each arm completed 48 simulations with 42 campaign clears and zero stalls. Native OFF cleared 5/5, native ON 4/5, and all ten logged zero runtime errors. [Simulator OFF](../../artifacts/nextgen/playtest/play38-base-off/summary.json) · [Simulator ON](../../artifacts/nextgen/playtest/play38-routed-base-on/summary.json)

### Encounter revisions

The first option (b) revision held the lead's emergence for up to three seconds of approach time and let a recovery shot from the landing add the surviving plate value to its damage. The first two complete native pairs still favored OFF overall. ON vs OFF was 87.4 vs 45.7 suit and 71.58 vs 69.02 seconds for Breacher, and 134.1 vs 137.3 suit and 78.68 vs 68.93 seconds for Cryo. Neither ON run stood on the bait. The remaining native runs in those two arms were stopped under host contention so the second attempt could run.

The second revision requested constrained camera focus on the bait and canceled the last three held arrivals when an exposed recovery hit landed from the step. The first Breacher replay successfully waited at the bait, reached the landing and fired, but the bot lingered until a subsequent attack. The competent policy now resumes ordinary movement after a firing opportunity with a loaded weapon. This policy fix is part of the second encounter attempt.

### Second revision ON/OFF

| Native case | Bait stand | Landing | Exposed contacts | Beat suit | Room suit | Clear seconds |
|---|---|---|---:|---:|---:|---:|
| Breacher 1729 | No → Yes | No → Yes | 4 → 8 | 0.0 → 5.8 | 37.9 → 66.5 | 56.17 → 60.43 |
| Cryo 1729 | No → No | No → No | 0 → 0 | 0.0 → 0.0 | 86.1 → 111.3 | 73.65 → 74.60 |
| Pyro 1729 | No → No | No → No | 0 → 0 | 7.6 → 0.0 | 77.6 → 34.7 | 48.58 → 49.60 |
| Arc 1729 | No → No | No → No | 0 → 0 | 0.0 → 0.0 | 92.3 → 82.0 | 48.30 → 53.18 |
| Arc 2718 | No → Yes | No → Yes | 15 → 4 | 0.0 → 0.0 | 23.4 → 12.6 | 53.78 → 43.75 |

Both arms cleared all five native cases. The Breacher OFF replay logged one interior kit preparation timeout. All other cases in the table logged zero runtime errors. ON lowered total room suit by 10.3 across five cases and increased total clear time by 1.1 seconds. Only Breacher and Arc 2718 completed the full marked sequence. Their suit and time deltas went in opposite directions. Option (b) stopped after two encounter revisions. Mark reading ships OFF and remains available through the runner flag. The native results support removing the marks. The branch retains the second encounter revision so the compared scene and captures remain available.

Breacher's corrected ON sequence [bait at 744.133](../../artifacts/nextgen/playtest/play38-tail-release-on-breacher/r19-manual-control-chamber-exchange-bait.png) · [landing at 745.833](../../artifacts/nextgen/playtest/play38-tail-release-on-breacher/r19-manual-control-chamber-exchange-landing.png) · [exposed hit at 745.933](../../artifacts/nextgen/playtest/play38-tail-release-on-breacher/r19-manual-control-chamber-console-return.png).

| Second revision simulator | Room entries OFF → ON | Manual Control deaths OFF → ON | Median room suit OFF → ON |
|---|---:|---:|---:|
| Breacher | 11 → 11 | 0 → 0 | 55.1 → 36.6 |
| Cryo | 12 → 12 | 0 → 0 | 76.7 → 78.3 |
| Pyro | 10 → 10 | 0 → 0 | 32.6 → 28.6 |
| Arc | 11 → 11 | 0 → 0 | 38.4 → 35.4 |

The second revision's simulator ON cleared 44/48 campaigns and OFF cleared 42/48, with zero stalls in each arm. Breacher's simulation median improved, but the direct native evidence for taking the exchange remained split. The five-case room-time comparison did not show an overall saving. [Second revision OFF](../../artifacts/nextgen/playtest/play38-tail-base-off/summary.json) · [Second revision ON](../../artifacts/nextgen/playtest/play38-tail-release-base-on/summary.json)

### Shipped cohorts and suit loss

Standard's paid repair moved from 22 health and 17 armour to 19 and 14. The 21/16 and 20/15 trials both finished at 42/48. The 19/14 trial was the smallest measured reduction that reached 38–40. A larger exploratory run was stopped once the smaller passing step completed. The production build passed. Both final cohorts had zero stalls. Story uses its own repair amounts, and the measured Story cohort has the same gameplay and policy as the final branch.

| Usual cohort | PLAY37 | PLAY38, marks OFF |
|---|---:|---:|
| Standard Breacher | 11/12 | 10/12 |
| Standard Cryo | 11/12 | 11/12 |
| Standard Pyro | 9/12 | 9/12 |
| Standard Arc | 11/12 | 9/12 |
| Standard total | 42/48 | 39/48 |
| Story Cryo | 12/12 | 12/12 |
| Story Breacher | 12/12 | 12/12 |
| Story total | 24/24 | 24/24 |

The suit ledger matches each rig and seed pair and includes only pairs that cleared the entire sector block in both builds. PLAY37 uses its final tuned Pyro runs.

| Sectors | Matched pairs | PLAY37 suit | PLAY38 suit |
|---|---:|---:|---:|
| 1–4 | 48 | 316.6 | 316.6 |
| 5–8 | 48 | 5,185.9 | 5,185.9 |
| 9–12 | 48 | 9,270.7 | 9,162.9 |
| 13–16 | 45 | 9,262.1 | 9,309.4 |
| 17–20 | 38 | 7,301.3 | 7,908.6 |

[Final Standard](../../artifacts/nextgen/playtest/play38-ship-repair-three-off/summary.json) · [Final Story](../../artifacts/nextgen/playtest/play38-ship-story/summary.json) · [21/16 trial](../../artifacts/nextgen/playtest/play38-ship-repair-one-off/summary.json) · [20/15 trial](../../artifacts/nextgen/playtest/play38-ship-repair-two-off/summary.json)

## PLAY39

### Encounter implementation

- Communal Atrium and Manual Control stage a visible escort group at a common recovery grille. A weapon hit during the featured Brute's recovery closes it and cancels the held group. When recovery ends without the shot, the group enters. Both arms use the same mechanics. The ON policy prioritizes the visible recovering attacker when the adjacent group is also visible. An initial Atrium attempt hardcoded the wrong beat and never staged a grille on Breacher 1729. The revision locates the room's first unguarded Brute. A later framing pass requested focus on the grille and made the late escort selection include the available waiting priority arrivals.
- Standard stages an additional telegraphed Spitter lane in sectors 3–8 with a 13-armour recovery opportunity. Residential's plated lane moves the optional armour behind nearby cover when there is a legal authored shoulder. Story does not receive this Standard opening lane.
- Story's Interlock pad holds its partial charge for 2.5 seconds when the marine leaves during a strike aimed at the pad. The same uninterrupted strike cannot grant the respite again. The normal pad reset resumes after the grace expires.
- A Crawler preparing or committing a bite designates a contact line. Nearby Crawlers still in approach step tangentially until they clear 28.8 simulation units of arc where movement allows it.
- Coolant estimates an in-view set of entries around the simulated camera target and prefers the closest entry to the defeated leader from that set. A preview silhouette moves to a legal interior bend before the cut. Transmission's competent policy prioritizes a valid cast of its equipped exclusive at the existing two-sided opening. Relay Racks gives the released Spitter an opening volley through the center of the broken shutter.

### Presentation interfaces

- `DepthGame.recoveryGrille` exposes `x`, `y`, `angle`, `escorts`, `attackerId`, `state`, `changedAt`, and `expiresAt`. Its states are `waiting`, `closed`, and `entered`.
- `GameEffect` emits `recovery-grille-closed` and `recovery-escort-entered` with `x`, `y`, `angle`, and `grilleEscorts`.
- `DepthGame.storyHoldGrace` exposes pad `id`, `x`, `y`, retained charge `ms`, `remainingMs`, and `durationMs`. `GameEffect` emits `story-hold-grace` with pad coordinates, the striker's `id`, and `durationMs: 2500`.
- `DepthGame.coolantQueuedBend` exposes `x`, `y`, and `angle` for the waiting silhouette.

### Native ON/OFF evidence

These checkpoint samples held the earned room boundary constant. OFF can still close a grille through ordinary fire. A closure in both arms therefore verifies the gameplay consequence while providing no estimate of the benefit of forcing the return-shot policy.

| Native case | Recovery hits OFF → ON | Grilles closed OFF → ON | Escorts canceled OFF → ON | Room suit OFF → ON | Room seconds OFF → ON |
|---|---:|---:|---:|---:|---:|
| Breacher 1729, Atrium | 4 → 4 | 1 → 1 | 1 → 1 | 13.2 → 13.2 | 22.48 → 22.48 |
| Cryo 1729, Atrium | 0 → 0 | 0 → 0 | 0 → 0 | 13.2 → 13.2 | 17.05 → 17.05 |

Breacher's native Atrium closure was visible in both arms. Cryo's initial OFF sample had one interior preparation timeout and was restarted on the same seed. The Manual Control Breacher pair also hit interior preparation and screenshot timeouts on both attempts. Later replays allow up to 90 seconds for an evidence screenshot when the caller explicitly extends the startup budget. [Atrium waiting](../../artifacts/nextgen/playtest/play39-tip-on-breacher-4/r4-communal-atrium-grille-waiting.png) · [Atrium hit and close](../../artifacts/nextgen/playtest/play39-tip-on-breacher-4/r4-communal-atrium-grille-closed.png)

### Story hold probe

A controlled deterministic probe from the earned Story Cryo 1729 checkpoint charged 336 ms on the Interlock pad before stepping out of a staged Brute swing. Charge stayed at 336 ms while the grace interval counted down from 2,404 to 804 ms and expired after 2.5 seconds. The probe emitted one `story-hold-grace` effect. The original Final24 native loss was 110.8 suit. The first PLAY39 native replay hit its wall budget with an interior preparation timeout. Its same-seed retry hit a screenshot timeout. Neither produced a final room-loss total. [Probe receipt](../../artifacts/nextgen/play39-analysis/hold.json) · [First replay](../../artifacts/nextgen/playtest/play39-hold-story/report.json) · [Retry](../../artifacts/nextgen/playtest/play39-hold-story-retry/report.json)

### Candidate revisions and release decision

The second grille revision distinguished a Brute's initial approach from its return to approach after a committed strike. Until then an approaching Brute could release the escorts immediately after spawning. The hard seven-second timeout remains. The early pressure follow-up moved the additional Spitter's target lock to the start of its warning so the shot tests the marine's current approach. The tables below come from before those two revisions.

The three-rig benefit in both rooms has not been demonstrated. The grille therefore requires an explicit `--exchange-marks=off` or `--exchange-marks=on` in the playtest runners. Both flags stage the same grille and escorts. Only ON prioritizes the visible return shot. Regular campaigns use the prior console exchange and Atrium setup, with the other PLAY39 changes active.

| Additional native case | Recovery hits OFF → ON | Grilles closed OFF → ON | Escorts canceled OFF → ON | Room suit OFF → ON | Room seconds OFF → ON |
|---|---:|---:|---:|---:|---:|
| Pyro 1729, Atrium | 2 → 2 | 1 → 1 | 1 → 1 | 0 → 0 | 18.40 → 18.40 |
| Arc 1729, Atrium | 14 → — | 1 → — | 1 → — | 0 → — | 17.27 → — |
| Breacher 1729, Manual Control | — | — | — | — | — |
| Cryo 1729, Manual Control | — | — | — | — | — |
| Pyro 1729, Manual Control | — | — | — | — | — |
| Arc 2718, Manual Control | — | — | — | — | — |

Arc uses 2718 for the late checkpoint because the earned Final24 Arc 1729 campaign ended in Diagnostic Gallery. [Waiting bodies](../../artifacts/nextgen/playtest/play39-tip-on-pyro-4/r4-communal-atrium-grille-waiting.png) · [Recovery hit](../../artifacts/nextgen/playtest/play39-tip-on-pyro-4/r4-communal-atrium-grille-closed.png) · [Grille closing](../../artifacts/nextgen/playtest/play39-tip-on-pyro-4/r4-communal-atrium-grille-recoil.png)

### Simulator snapshot

Denominators below count finished simulator reports available at this snapshot. Empty cells indicate zero finished reports. Candidate results are provisional and do not establish the shipped balance or absence of stalls across the requested seeds.

| Profile / rig | Wave 33 | Candidate OFF | Candidate ON |
|---|---:|---:|---:|
| Standard Breacher | 11/12 | 8/11 | 10/11 |
| Standard Cryo | 10/12 | — | — |
| Standard Pyro | 10/12 | — | — |
| Standard Arc | 12/12 | — | — |
| **Standard all** | **43/48** | **8/11** | **10/11** |
| Story Cryo | 10/12 | 11/12 | — |
| Story Breacher | 12/12 | — | — |
| **Story all** | **22/24** | **11/12** | — |

Standard damage is mean suit per completed block. Each candidate is compared with the same rigs and seeds from Wave 33 that finished the block in both builds. The full Wave 33 block mean is also shown for reference.

| Sectors | Wave 33 all | OFF pairs | Wave 33 → OFF | ON pairs | Wave 33 → ON |
|---|---:|---:|---:|---:|---:|
| 1–4 | 7.21 | 11 | 5.51 → 8.08 | 11 | 5.51 → 8.63 |
| 5–8 | 97.55 | 11 | 72.72 → 101.22 | 11 | 72.72 → 118.19 |
| 9–12 | 176.12 | 10 | 151.80 → 192.63 | 11 | 151.05 → 147.26 |
| 13–16 | 198.38 | 10 | 171.56 → 146.60 | 11 | 172.07 → 177.29 |
| 17–20 | 195.72 | 8 | 165.36 → 186.60 | 9 | 174.13 → 182.62 |

| Standard Crawler share | Wave 33 all | Candidate OFF | Candidate ON |
|---|---:|---:|---:|
| Breacher | 39.32% | 35.93% (11) | 35.58% (11) |
| Cryo | 39.63% | — | — |
| Pyro | 41.25% | — | — |
| Arc | 37.55% | — | — |

[Candidate OFF summary](../../artifacts/nextgen/playtest/play39-tip-off/summary.json) · [Candidate ON summary](../../artifacts/nextgen/playtest/play39-tip-on/summary.json) · [Candidate Story summary](../../artifacts/nextgen/playtest/play39-tip-story/summary.json)

The three superseded candidate simulations were stopped after recording these samples to free capacity for final-build measurements. The pre-revision Breacher sample supports a direct ON/OFF comparison. Mean suit and time include only seeds that entered the room in both arms. Final-room deaths in this sample remain in those means.

| Encounter | Same-seed campaigns | Visitors OFF / ON | Paired visitors | Suit OFF → ON | Seconds OFF → ON | Deaths OFF → ON |
|---|---:|---:|---:|---:|---:|---:|
| Communal Atrium | 11 | 11 / 11 | 11 | 5.36 → 5.90 | 23.81 → 22.68 | 0 → 0 |
| Manual Control | 11 | 9 / 11 | 9 | 32.28 → 31.07 | 48.34 → 50.66 | 1 → 0 |

The production build passed on the opt-in revision. Standard and Story simulator cohorts for that build are separate from the experiments. The full native Breacher replay was restarted on the same seed after a screenshot timeout on its first attempt. The corrected Manual Control pair initially failed to bind its localhost port under the sandbox and was restarted using approved local access. The native 20-room runs, final simulator cohorts, and three adjacent Crawler queue frames had not graduated to verified evidence at this snapshot.

### Production-build opening sample

A separate eight-room Standard run used seed 1729 in all four rigs after the revised Spitter timing and with the grille experiment disabled. It is a diagnostic seed outside the twelve-seed cohort. Sectors 1–4 still averaged only 5.0 suit across these four runs, below the 20–40 target. Sectors 5–8 averaged 157.1. This sample does not establish either cohort target.

| Seed 1729 rig | Sectors 1–4 suit | Sectors 5–8 suit |
|---|---:|---:|
| Breacher | 0.0 | 179.1 |
| Cryo | 10.0 | 226.7 |
| Pyro | 0.0 | 142.2 |
| Arc | 10.0 | 80.4 |

[Production opening sample](../../artifacts/nextgen/playtest/play39-ship-early-sample/summary.json)

### Crawler contact-line probe

A deterministic open-floor probe started two Crawlers on the same line to the marine. The queued Crawler moved sideways and cleared 29.94 units of arc 167 ms into the first wind-up. At the strike it was 32.48 units away around the arc, past the 28.8-unit target. This staged receipt establishes movement in open space. [Probe receipt](../../artifacts/nextgen/play39-analysis/crawler.json)

### Manual Control sightline follow-up

The corrected-lifecycle Breacher ON trace put the grille and Brute in the viewport from 806.62 to 807.02 seconds. The weapon line to the Brute was blocked throughout those samples. At 807.08 seconds the grille opened to three escorts. Cryo's retry of the earlier candidate showed the same obstruction during its 753.27–753.57 second recovery samples. The console therefore blocked the exchange before the policy had a clear shot. A further experiment-only revision places the Brute on the marine's side of the console's short end, validates sightlines before staging, and limits the staging delay to 400 ms there. This preserves the default encounter.

A pre-revision Pyro OFF run cleared Manual Control in 39.62 seconds with 46.92 suit lost and no recovery closure. It logged one interior-preparation error and its same-seed retry timed out loading, so this solitary row is not a clean paired result. [Breacher trace](../../artifacts/nextgen/playtest/play39-revision-native-on-breacher-19/trace.ndjson) · [Cryo trace](../../artifacts/nextgen/playtest/play39-tip-on-cryo-19-retry/trace.ndjson) · [Pyro report](../../artifacts/nextgen/playtest/play39-tip-off-pyro-19/report.json)

### Production cohort snapshot

| Profile / rig | Wave 33 clears | Production clears in finished usual seeds |
|---|---:|---:|
| Standard Breacher | 11/12 | 7/8 |
| Standard Cryo | 10/12 | — |
| Standard Pyro | 10/12 | — |
| Standard Arc | 12/12 | — |
| **Standard all** | **43/48** | **7/8** |
| Story Cryo | 10/12 | 7/8 |
| Story Breacher | 12/12 | — |
| **Story all** | **22/24** | **7/8** |

No stall appeared in the finished production subset. The sample is too small to establish the balance, per-rig, or zero-stall targets. Story Cryo's sectors 1–4 averaged exactly 17.99 suit in both builds over the eight matched seeds. On the same 8 Standard Breacher seeds, Crawler share changed from 37.91% in Wave 33 to 35.28% in production.

| Standard sectors | Same-seed completed pairs | Mean suit Wave 33 → production |
|---|---:|---:|
| 1–4 | 8 | 4.07 → 7.00 |
| 5–8 | 8 | 70.66 → 90.64 |
| 9–12 | 7 | 159.67 → 154.17 |
| 13–16 | 7 | 165.07 → 170.26 |
| 17–20 | 6 | 189.22 → 184.63 |

The Freight Hold native frame shows the striking Crawler and two nearby Crawlers still in approach at 151.83 seconds. [Freight Hold queue](../../artifacts/nextgen/playtest/play39-campaign-breacher-retry/r7-freight-hold-crawler-queue.png) · [Standard simulator](../../artifacts/nextgen/playtest/play39-ship-standard/summary.json) · [Standard additional usual seeds](../../artifacts/nextgen/playtest/play39-ship-standard-usual-tail/summary.json) · [Story simulator](../../artifacts/nextgen/playtest/play39-ship-story/summary.json) · [Story additional usual seeds](../../artifacts/nextgen/playtest/play39-ship-story-usual-tail/summary.json)

The near-side experiment revision also passed the production build, using a separate output directory so ongoing native campaigns could continue serving their original bundles.

In the revised Breacher ON sample, waiting escorts were visible at 800.82 seconds. The return shot at 802.32 seconds closed the grille on all three. The sampled actor position came from the close-ingress fallback, so this demonstrates a working Manual Control return shot without establishing the short-side console placement. The run logged an interior-preparation error, and it does not supply a clean paired result. [Waiting](../../artifacts/nextgen/playtest/play39-near-on-breacher-19/r19-manual-control-chamber-grille-waiting.png) · [Hit and three-escort closure](../../artifacts/nextgen/playtest/play39-near-on-breacher-19/r19-manual-control-chamber-grille-closed.png)

### Continued measurement

Each simulator campaign uses the twelve usual seeds for each rig with two workers per arm. Arm A uses the same staging and mandatory escort entry when the Brute's recovery ends. Arm B allows closure on a qualifying hit. Arm C also gives the competent bot the grille policy. Room means include every visitor, including deaths. Clear denominators count the full campaigns.

### v0

| Arm | Rig | Room | Visits | Closures | Escorts canceled | Mean suit | Mean seconds | Deaths |
|---|---|---|---:|---:|---:|---:|---:|---:|
| A | Breacher | communal-atrium | 12 | 0 | 0 | 4.50 | 22.49 | 0 |
| A | Breacher | manual-control-chamber | 11 | 0 | 0 | 30.48 | 51.76 | 0 |
| A | Cryo | communal-atrium | 12 | 0 | 0 | 13.30 | 23.10 | 0 |
| A | Cryo | manual-control-chamber | 10 | 0 | 0 | 86.73 | 67.13 | 0 |
| A | Pyro | communal-atrium | 12 | 0 | 0 | 6.05 | 21.02 | 0 |
| A | Pyro | manual-control-chamber | 11 | 0 | 0 | 57.85 | 48.27 | 1 |
| A | Arc | communal-atrium | 12 | 0 | 0 | 3.10 | 23.02 | 0 |
| A | Arc | manual-control-chamber | 9 | 0 | 0 | 32.62 | 47.94 | 0 |
| B | Breacher | communal-atrium | 12 | 12 | 12 | 5.20 | 23.31 | 0 |
| B | Breacher | manual-control-chamber | 8 | 8 | 24 | 37.89 | 49.98 | 0 |
| B | Cryo | communal-atrium | 12 | 11 | 11 | 14.32 | 23.65 | 0 |
| B | Cryo | manual-control-chamber | 10 | 9 | 27 | 85.32 | 65.33 | 0 |
| B | Pyro | communal-atrium | 12 | 9 | 9 | 2.15 | 20.51 | 0 |
| B | Pyro | manual-control-chamber | 12 | 9 | 27 | 32.56 | 42.32 | 0 |
| B | Arc | communal-atrium | 12 | 11 | 11 | 0.60 | 21.55 | 0 |
| B | Arc | manual-control-chamber | 12 | 8 | 24 | 23.92 | 41.30 | 2 |
| C | Breacher | communal-atrium | 12 | 12 | 12 | 4.40 | 23.18 | 0 |
| C | Breacher | manual-control-chamber | 12 | 12 | 36 | 31.14 | 50.76 | 0 |
| C | Cryo | communal-atrium | 12 | 11 | 11 | 9.77 | 23.02 | 0 |
| C | Cryo | manual-control-chamber | 10 | 9 | 27 | 70.31 | 61.39 | 0 |
| C | Pyro | communal-atrium | 12 | 9 | 9 | 2.15 | 20.74 | 0 |
| C | Pyro | manual-control-chamber | 12 | 12 | 36 | 16.32 | 41.15 | 0 |
| C | Arc | communal-atrium | 12 | 11 | 11 | 0.35 | 22.57 | 0 |
| C | Arc | manual-control-chamber | 12 | 10 | 30 | 19.80 | 42.75 | 1 |

Clears and stalls: A 39/48 (0 stalls), B 36/48 (0 stalls), C 42/48 (0 stalls)

[Arm A](../../artifacts/nextgen/playtest/play39-three-v0-absent/summary.json) · [Arm B](../../artifacts/nextgen/playtest/play39-three-v0-off/summary.json) · [Arm C](../../artifacts/nextgen/playtest/play39-three-v0-on/summary.json)

The first revision requires the shot to originate within 55° of the line from the recovering Brute to the grille. The aware policy approaches the visible gate around active melee warnings and shoots from the eligible side. Arm A is reused because timing, staging, and mandatory escort entry are unchanged. B closed 30/48 (62.5%) in Atrium and 26/44 (59.1%) in Manual Control. C closed 47/48 (97.9%) and 40/44 (90.9%) respectively. C suit improved for three rigs per room, including Breacher and Pyro in both rooms. B still closed too often for the intended decision.

### v1

| Arm | Rig | Room | Visits | Closures | Escorts canceled | Mean suit | Mean seconds | Deaths |
|---|---|---|---:|---:|---:|---:|---:|---:|
| A | Breacher | communal-atrium | 12 | 0 | 0 | 4.50 | 22.49 | 0 |
| A | Breacher | manual-control-chamber | 11 | 0 | 0 | 30.48 | 51.76 | 0 |
| A | Cryo | communal-atrium | 12 | 0 | 0 | 13.30 | 23.10 | 0 |
| A | Cryo | manual-control-chamber | 10 | 0 | 0 | 86.73 | 67.13 | 0 |
| A | Pyro | communal-atrium | 12 | 0 | 0 | 6.05 | 21.02 | 0 |
| A | Pyro | manual-control-chamber | 11 | 0 | 0 | 57.85 | 48.27 | 1 |
| A | Arc | communal-atrium | 12 | 0 | 0 | 3.10 | 23.02 | 0 |
| A | Arc | manual-control-chamber | 9 | 0 | 0 | 32.62 | 47.94 | 0 |
| B | Breacher | communal-atrium | 12 | 8 | 8 | 3.90 | 22.83 | 0 |
| B | Breacher | manual-control-chamber | 11 | 7 | 21 | 32.51 | 48.86 | 0 |
| B | Cryo | communal-atrium | 12 | 7 | 7 | 10.62 | 23.42 | 0 |
| B | Cryo | manual-control-chamber | 10 | 6 | 18 | 74.49 | 65.54 | 0 |
| B | Pyro | communal-atrium | 12 | 6 | 6 | 4.75 | 20.67 | 0 |
| B | Pyro | manual-control-chamber | 12 | 7 | 21 | 35.70 | 43.21 | 0 |
| B | Arc | communal-atrium | 12 | 9 | 9 | 0.60 | 21.62 | 0 |
| B | Arc | manual-control-chamber | 11 | 6 | 18 | 25.43 | 43.74 | 1 |
| C | Breacher | communal-atrium | 12 | 11 | 11 | 4.25 | 21.46 | 0 |
| C | Breacher | manual-control-chamber | 12 | 11 | 33 | 29.95 | 52.51 | 0 |
| C | Cryo | communal-atrium | 12 | 12 | 12 | 8.77 | 24.93 | 0 |
| C | Cryo | manual-control-chamber | 11 | 10 | 30 | 87.33 | 69.05 | 0 |
| C | Pyro | communal-atrium | 12 | 12 | 12 | 2.40 | 21.13 | 0 |
| C | Pyro | manual-control-chamber | 11 | 10 | 30 | 22.11 | 43.25 | 0 |
| C | Arc | communal-atrium | 12 | 12 | 12 | 7.37 | 22.72 | 0 |
| C | Arc | manual-control-chamber | 10 | 9 | 27 | 21.80 | 45.77 | 0 |

Clears and stalls: A 39/48 (0 stalls), B 41/48 (0 stalls), C 44/48 (0 stalls)

[Revision 1 arm B](../../artifacts/nextgen/playtest/play39-three-v1-off/summary.json) · [Revision 1 arm C](../../artifacts/nextgen/playtest/play39-three-v1-on/summary.json)

The second revision narrowed the firing arc to ±40°. Its pre-merge campaign totals were A 39/48, B 42/48, and C 45/48, each with zero stalls. The table below repeats all three arms after merging RUN20 and using its route policy. The unaware arm still closed 28/48 Atrium grilles.

### v2-merged

| Arm | Rig | Room | Visits | Closures | Escorts canceled | Mean suit | Mean seconds | Deaths |
|---|---|---|---:|---:|---:|---:|---:|---:|
| A | Breacher | communal-atrium | 12 | 0 | 0 | 4.50 | 22.49 | 0 |
| A | Breacher | manual-control-chamber | 11 | 0 | 0 | 52.00 | 57.33 | 1 |
| A | Cryo | communal-atrium | 12 | 0 | 0 | 10.27 | 23.66 | 0 |
| A | Cryo | manual-control-chamber | 10 | 0 | 0 | 107.00 | 76.83 | 0 |
| A | Pyro | communal-atrium | 12 | 0 | 0 | 5.24 | 20.62 | 0 |
| A | Pyro | manual-control-chamber | 12 | 0 | 0 | 37.08 | 50.32 | 0 |
| A | Arc | communal-atrium | 12 | 0 | 0 | 3.10 | 22.93 | 0 |
| A | Arc | manual-control-chamber | 10 | 0 | 0 | 30.25 | 53.43 | 0 |
| B | Breacher | communal-atrium | 12 | 7 | 7 | 3.90 | 22.64 | 0 |
| B | Breacher | manual-control-chamber | 12 | 8 | 24 | 40.66 | 54.28 | 0 |
| B | Cryo | communal-atrium | 12 | 6 | 6 | 11.46 | 23.57 | 0 |
| B | Cryo | manual-control-chamber | 11 | 2 | 6 | 97.39 | 72.31 | 0 |
| B | Pyro | communal-atrium | 12 | 5 | 5 | 3.94 | 20.37 | 0 |
| B | Pyro | manual-control-chamber | 11 | 9 | 27 | 23.32 | 45.56 | 0 |
| B | Arc | communal-atrium | 12 | 10 | 10 | 0.60 | 21.33 | 0 |
| B | Arc | manual-control-chamber | 8 | 2 | 6 | 24.29 | 54.96 | 0 |
| C | Breacher | communal-atrium | 12 | 11 | 11 | 4.86 | 22.83 | 0 |
| C | Breacher | manual-control-chamber | 11 | 9 | 27 | 38.31 | 50.13 | 0 |
| C | Cryo | communal-atrium | 12 | 12 | 12 | 8.02 | 23.81 | 0 |
| C | Cryo | manual-control-chamber | 11 | 11 | 33 | 72.98 | 64.73 | 0 |
| C | Pyro | communal-atrium | 12 | 12 | 12 | 2.40 | 22.08 | 0 |
| C | Pyro | manual-control-chamber | 12 | 11 | 33 | 31.22 | 39.98 | 0 |
| C | Arc | communal-atrium | 12 | 12 | 12 | 7.35 | 22.09 | 0 |
| C | Arc | manual-control-chamber | 12 | 10 | 30 | 30.00 | 44.00 | 0 |

Clears and stalls: A 42/48 (0 stalls), B 41/48 (0 stalls), C 45/48 (0 stalls)

The third revision narrowed the arc to ±30° and moved one existing Atrium flanker from another beat so two escorts wait. B closed 20/48 (41.7%) in Atrium and 11/41 (26.8%) in Manual Control. C closed 44/48 (91.7%) and 35/41 (85.4%). Each of the four rigs lost less suit in both rooms with C than with A. This qualifies the grille to be on by default on Standard. Story retains its previous encounter staging.

### v3

| Arm | Rig | Room | Visits | Closures | Escorts canceled | Mean suit | Mean seconds | Deaths |
|---|---|---|---:|---:|---:|---:|---:|---:|
| A | Breacher | communal-atrium | 12 | 0 | 0 | 4.10 | 23.00 | 0 |
| A | Breacher | manual-control-chamber | 9 | 0 | 0 | 53.84 | 53.93 | 0 |
| A | Cryo | communal-atrium | 12 | 0 | 0 | 10.42 | 22.41 | 0 |
| A | Cryo | manual-control-chamber | 10 | 0 | 0 | 92.19 | 74.38 | 0 |
| A | Pyro | communal-atrium | 12 | 0 | 0 | 6.34 | 20.29 | 0 |
| A | Pyro | manual-control-chamber | 12 | 0 | 0 | 39.29 | 44.86 | 0 |
| A | Arc | communal-atrium | 12 | 0 | 0 | 9.77 | 20.96 | 0 |
| A | Arc | manual-control-chamber | 9 | 0 | 0 | 36.49 | 54.93 | 0 |
| B | Breacher | communal-atrium | 12 | 7 | 14 | 3.64 | 23.27 | 0 |
| B | Breacher | manual-control-chamber | 10 | 4 | 12 | 25.05 | 48.55 | 0 |
| B | Cryo | communal-atrium | 12 | 5 | 10 | 9.91 | 21.80 | 0 |
| B | Cryo | manual-control-chamber | 9 | 4 | 12 | 94.11 | 71.21 | 0 |
| B | Pyro | communal-atrium | 12 | 2 | 4 | 5.84 | 20.28 | 0 |
| B | Pyro | manual-control-chamber | 12 | 1 | 3 | 35.75 | 45.02 | 0 |
| B | Arc | communal-atrium | 12 | 6 | 12 | 3.86 | 20.22 | 0 |
| B | Arc | manual-control-chamber | 10 | 2 | 6 | 28.67 | 52.29 | 0 |
| C | Breacher | communal-atrium | 12 | 12 | 24 | 0.50 | 20.56 | 0 |
| C | Breacher | manual-control-chamber | 10 | 9 | 27 | 33.84 | 50.21 | 0 |
| C | Cryo | communal-atrium | 12 | 11 | 22 | 8.11 | 22.88 | 0 |
| C | Cryo | manual-control-chamber | 11 | 9 | 27 | 70.92 | 64.84 | 0 |
| C | Pyro | communal-atrium | 12 | 11 | 22 | 2.40 | 19.50 | 0 |
| C | Pyro | manual-control-chamber | 12 | 10 | 30 | 30.32 | 48.38 | 0 |
| C | Arc | communal-atrium | 12 | 10 | 20 | 6.60 | 20.35 | 0 |
| C | Arc | manual-control-chamber | 8 | 7 | 21 | 21.36 | 47.96 | 0 |

Clears and stalls: A 40/48 (0 stalls), B 41/48 (0 stalls), C 41/48 (0 stalls)

### Merged native checkpoint replays

Both requested cases completed on their first attempt with zero errors, including no interior-preparation errors. The replays used the same earned Final24 boundaries and a 7,200-second wall limit.

| Checkpoint | Result | Suit lost | Seconds | Retries |
|---|---:|---:|---:|---:|
| Manual Control Breacher 1729, C | Cleared, shut the grille on three escorts | 0.00 | 49.62 | 0 |
| Safety Interlock Story Cryo 1729 | Cleared. Final24 died with 110.81 suit lost | 45.67 | 47.05 | 0 |

The native Story policy did not trigger hold grace in that clear. The 65.14 suit difference cannot be attributed to grace. A separate staged capture used the actual Story pad, charged it, and stepped out during a committed Brute wind-up. It captured UI34's hold ring driven by the resulting game snapshot. The Manual Control replay captured ROOM34's grille moving in response to closure while the retained escort silhouettes recoiled.

[Waiting escorts at 800.82 s](../../artifacts/nextgen/playtest/play39-merged-native-grille-1/r19-manual-control-chamber-grille-waiting.png) · [Hit and closure at 802.52 s](../../artifacts/nextgen/playtest/play39-merged-native-grille-1/r19-manual-control-chamber-grille-closed.png) · [Closed ROOM34 grille at 802.72 s](../../artifacts/nextgen/playtest/play39-merged-native-grille-1/r19-manual-control-chamber-grille-recoil.png) · [Safety Interlock replay](../../artifacts/nextgen/playtest/play39-merged-native-hold-1/report.json) · [Staged UI34 ring](../../artifacts/nextgen/play39-merged-hold-ring/play39-live-hold-ring-safety-interlock-station.png)

### Early pressure trials on merged RUN20

The first version fired down the entry position after the bot had already moved. The native Pyro start moved from (436, 440) to about (261, 214) before the projectile left, Cryo stepped diagonally off the line, and Breacher and Arc had a warning without a recorded shot. Delaying the shot into an active fight, leading the marine, and widening the fire improved the timing but still left the competent cohort below the early target.

| Trial | Standard campaigns measured | Mean sectors 1–4 suit | Mean sectors 5–8 suit | Full clears |
|---|---:|---:|---:|---:|
| Delayed leading shot | 48 | 9.33 | 131.38 | 41 |
| Warned first fan | 48 | 10.76 | 134.05 | 44 |
| Timed Stalker follow-up, sectors 1–8 only | 48 | 14.03 | 127.99 | — |
| Early overlap before splash timing change, sectors 1–8 only | 48 | 15.18 | 130.78 | — |

The selected encounter fires a leading fan in sectors 3 and 4 with a separately warned, cover-blocked impact at discharge. If the Spitter is still winding up after 300 ms, a Brute enters from the opposite side and tracks until its 180 ms lock. The displayed opening sweep reaches 110 units and ordinary sweeps retain their usual reach. The Spitter lane pays a 24-armour patch and the conditional Brute pays a 40-armour patch in the same room. Sectors 5–8 retain the delayed leading single shot and its 24-armour patch. Story receives none of these attacks.

The first Standard balance step reduced RUN20's between-room repair from 20 to 10 HP. An intercept cohort at that setting produced a 12/12 Cryo result. The next step removes the Standard HP repair and puts a 10-armour pickup at the second room entrance. The route text describes the actual reward. Story retains its 20-HP repair. RUN20's order decisions and bot policy remain intact.

A separate Pyro 99 replay reproduced the final-crossing stall in the 10-HP intercept trial. A low-health Stalker was visible but screened by the lip. The policy stayed put despite a legal step that opened a shot because it penalized moving farther from the relay in straight-line distance. The shared policy now favors the legal firing angle when the existing 30-second recovery observer fires. The same game revision and seed cleared after that policy change. [Reproduced stall](../../artifacts/nextgen/playtest/play39-standard-repair10/pyro-99.json) · [Fixed replay](../../artifacts/nextgen/playtest/play39-pyro99-crossing-fix/pyro-99.json)

### Selected production balance and full cohorts

Standard ships with the 10-armour pickup at the second paired-room entrance and no HP refill at the preceding exit. Scheduled non-guardian enemies in those second rooms receive 25% more health. The two earlier comparisons below used earlier pressure versions. The three paired-health trials all used the same final pressure sequence and junction reward. Story keeps the existing 20-HP refill and 10% paired-second-room health bonus.

| Standard trial | Breacher | Cryo | Pyro | Arc | Total | Stalls |
|---|---:|---:|---:|---:|---:|---:|
| RUN20 as reported by lead | 12/12 | 12/12 | 9/12 | 11/12 | 44/48 | — |
| 10 HP, intercept pressure | 11/12 | 12/12 | 9/12 | 8/12 | 40/48 | 1 |
| 0 HP plus 10 armour, earlier sweep timing | 12/12 | 11/12 | 9/12 | 9/12 | 41/48 | 0 |
| Final pressure, paired second rooms +20% | 11/12 | 11/12 | 11/12 | 11/12 | 44/48 | 0 |
| Final pressure, paired second rooms +22.5% | 10/12 | 11/12 | 11/12 | 10/12 | 42/48 | 0 |
| **Selected, paired second rooms +25%** | **8/12** | **8/12** | **9/12** | **11/12** | **36/48** | **0** |

| Story novice | Merged RUN20 baseline | Selected PLAY39 | PLAY39 stalls |
|---|---:|---:|---:|
| Cryo | 9/12 | 10/12 | 0 |
| Breacher | 12/12 | 12/12 | 0 |
| **Total** | **21/24** | **22/24** | **0** |

The final Standard releases closed 47/48 Atrium grilles and 37/39 Manual Control grilles. Story sectors 1–4 averaged 15.10 suit in both matched full cohorts on the merged base. The eight-seed Cryo comparison that previously read 17.99 reads 21.87 in both merged builds. The difference from the previous number was already present in RUN20's merged base.

| Standard sectors | Matched completed blocks | Mean suit, Wave 33 → PLAY39 |
|---|---:|---:|
| 1–4 | 48 | 7.21 → 23.40 |
| 5–8 | 48 | 97.55 → 132.58 |
| 9–12 | 42 | 175.22 → 199.86 |
| 13–16 | 41 | 196.66 → 188.20 |
| 17–20 | 33 | 185.63 → 164.12 |

| Standard Crawler suit share | Wave 33 | PLAY39 |
|---|---:|---:|
| Breacher | 39.32% | 34.57% |
| Cryo | 39.63% | 39.21% |
| Pyro | 41.25% | 36.01% |
| Arc | 37.55% | 36.82% |

Crawler share uses the damage ledger across all twelve matching runs per rig, including deaths. The comparison spans all branch changes and does not isolate the queue adjustment's individual contribution.

Production build passed. The selected cohort sources match the final gameplay and playtest files. Full native campaigns remain with the lead. [Standard final](../../artifacts/nextgen/playtest/play39-release-paired25-standard/summary.json) · [Story final](../../artifacts/nextgen/playtest/play39-release-paired25-story/summary.json) · [Merged Story baseline](../../artifacts/nextgen/playtest/play39-run20-story-baseline/summary.json) · [+20%](../../artifacts/nextgen/playtest/play39-release-paired20-standard/summary.json) · [+22.5%](../../artifacts/nextgen/playtest/play39-release-paired225-standard/summary.json) · [Revision 3 A](../../artifacts/nextgen/playtest/play39-three-v3-absent/summary.json) · [Revision 3 B](../../artifacts/nextgen/playtest/play39-three-v3-off/summary.json) · [Revision 3 C](../../artifacts/nextgen/playtest/play39-three-v3-on/summary.json)

## PLAY40

### Final25 diagnosis

1. Story Cryo 1729 entered Safety Interlock with 91.18 HP and zero armour.
2. It died after 48.60 seconds with 118.18 gross suit loss. Gross loss includes damage absorbed by recovery picked up in the room.
3. A Spitter projectile took 6.14 at 6.8 s.
4. Crawlers accounted for 81.17. Recorded contacts were at 7.9, 14.1, 15.1, 25.2, 29.3, 41.4, 43.7, 44.8 and 45.4 s.
5. A Brute took 30.87 at 16.6 s. The death frame's Stalker warning does not identify the largest damage source.
6. The opening was a 12-second siege charge. The marine was inside its footprint in 136 of 204 siege samples, with charge complete near 20 s.
7. The old grace watched the later pincer pads. It had no eligible charge during the opening siege.
8. The marine left the later pads at 23.8 and 27.8 s. Neither observed departure had a wind-up or strike. No grace event fired.
9. The trace sampled up to three living heavies and two simultaneous melee wind-ups. It ended near (524, 142), against the upper-left terrain.
10. The last recorded dash inputs were around 41.9 and 42.3 s. Both charges had recovered by 45 s and there was no later dash input. The terminal HUD marks abilities unavailable after death, so the corner was not caused by a long recharge.

### Story lesson

Safety Interlock now limits Story admission to six occupied slots, suppresses elites until the opening charge has advanced by four seconds, and admits one committed heavy at a time. The first pad-threatening wind-up is extended by 650 ms and shows “Step off — the charge holds” in the existing objective prompt. Siege progress was already retained off-pad. The grace snapshot now covers that actual objective from the warning through the return window, and its renderer uses the siege footprint and charge duration. The novice follows visible escape and return cues. A cornered marine can recover one spent dash charge once in this room if both charges are on cooldown. Enemy damage, Standard, and Veteran tuning are unchanged.

### Final native checkpoint replays

| Story Cryo 1729, room 12 | Suit lost | Result | Native errors | Grace fired |
|---|---:|---|---:|---|
| [Run 1](../../artifacts/nextgen/playtest/play40-final-hold-1/report.json) | 29.92 | Clear | 0 | Yes |
| [Run 2](../../artifacts/nextgen/playtest/play40-final-hold-2/report.json) | 71.08 | Clear | 0 | Yes |
| [Run 3](../../artifacts/nextgen/playtest/play40-final-hold-3/report.json) | 71.08 | Clear | 0 | Yes |
| [Run 4](../../artifacts/nextgen/playtest/play40-final-hold-4/report.json) | 71.08 | Clear | 0 | Yes |
| [Run 5](../../artifacts/nextgen/playtest/play40-final-hold-5/report.json) | 47.56 | Clear | 0 | Yes |

The same checkpoint averaged 58.15 gross suit loss across the five runs. The full Final25 campaign died with 118.18. The three frames below show the same 7.90 seconds of retained charge off the pad and on return in replay 2. [Teaching prompt and ring](../../artifacts/nextgen/playtest/play40-final-hold-2/r12-safety-interlock-station-story-hold-teaching.png) · [Off the pad](../../artifacts/nextgen/playtest/play40-final-hold-2/r12-safety-interlock-station-story-hold-off-pad.png) · [Return](../../artifacts/nextgen/playtest/play40-final-hold-2/r12-safety-interlock-station-story-hold-return.png)

### Simulator cohorts

| Profile | Rig | Usual seed clears | Seed 1729 | Stalls |
|---|---|---:|---|---:|
| Story novice | Cryo | 11/12 | Clear | 0 |
| Story novice | Breacher | 12/12 | Clear | 0 |
| Standard competent | Arc | 11/12 | Outside cohort | 0 |
| Standard competent | Cryo | 10/12 | Outside cohort | 0 |

Story finished 23/24 on the usual seeds and 25/26 with the extra cases. Cryo 1729 lost 75.76 in room 12. Breacher 1729 lost 30.71. All 24 paired Standard cases matched the merged head exactly in outcome, death room, and the serialized room results. [Story](../../artifacts/nextgen/playtest/play40-final-story/summary.json) · [Standard](../../artifacts/nextgen/playtest/play40-final-standard/summary.json) · [Merged Standard baseline](../../artifacts/nextgen/playtest/play40-standard-base/summary.json)

### Full native campaign

Story novice Cryo 1729 cleared all 20 rooms with zero native errors. Safety Interlock cost 72.29 gross suit and fired grace. Every final Interlock trace, including all five checkpoint replays, sampled at most one committed heavy at a time. These runs did not isolate the emergency dash refill from natural recharge. Veteran was not replayed. Production build passed.

[Campaign report](../../artifacts/nextgen/playtest/play40-final-full/report.json) · [Teaching strike](../../artifacts/nextgen/playtest/play40-final-full/r12-safety-interlock-station-story-hold-teaching.png) · [Off the pad](../../artifacts/nextgen/playtest/play40-final-full/r12-safety-interlock-station-story-hold-off-pad.png) · [Return](../../artifacts/nextgen/playtest/play40-final-full/r12-safety-interlock-station-story-hold-return.png)

## PLAY41

- The opt-in grille candidate stages the escorts beyond the Brute along the approach sightline in Communal Atrium and Manual Control. A recovery hit qualifies within 5.5 m of the Brute and up to 2 m to either side of the return lane's centerline. The shot must originate on the marine's side of the Brute. Escorts push against the dropped grille for 1.5 seconds before withdrawing. The default game keeps the PLAY39 closure rule pending the three-arm gate.
- The Standard opening uses a hard-cover staging point where available and places the armour on its sheltered side. The first fan winds up for 850 ms. The opposite hatch starts opening with the warning. Interrupting within 640 ms cancels the arrival.
- Coolant Plant and Infested Workshop show a queued body probing the bend ahead of a live reserve leader. A cut reuses the bend pose for the recoil and keeps the reserve count.
- A queued Crawler probes 10 simulation units (about 0.31 m) of lateral clearance before it moves around the striker. When both sides are blocked, it backs out as space allows.

### Opening comparison

Matched Standard competent simulation on seed 1729. Each cell shows fan warnings, follow-up warnings, and suit lost, respectively.

| Rig | Sector 3 before | Sector 3 after | Sector 4 before | Sector 4 after |
|---|---:|---:|---:|---:|
| Breacher | 1 / 0 / 0.0 | 1 / 0 / 0.0 | 1 / 1 / 0.0 | 1 / 0 / 0.0 |
| Cryo | 1 / 0 / 0.0 | 1 / 0 / 0.0 | 1 / 1 / 57.5 | 1 / 0 / 0.0 |
| Pyro | 1 / 0 / 0.0 | 1 / 0 / 0.0 | 1 / 1 / 0.0 | 1 / 0 / 0.0 |
| Arc | 1 / 0 / 0.0 | 1 / 0 / 0.0 | 1 / 0 / 15.3 | 1 / 0 / 0.0 |

[Baseline simulation](../../artifacts/nextgen/playtest/play41-opening-before/summary.json) · [PLAY41 simulation](../../artifacts/nextgen/playtest/play41-opening-after/summary.json)

### Standard cohort

Twelve seeds per rig, with the default PLAY39 grille rule and all other PLAY41 changes. Completed blocks include only runs that cleared all four sectors in the block.

| Standard competent | R30 baseline | PLAY41 |
|---|---:|---:|
| Breacher | 8/12 | 9/12 |
| Cryo | 10/12 | 9/12 |
| Pyro | 10/12 | 10/12 |
| Arc | 11/12 | 11/12 |
| Total | 39/48 | 39/48 |
| Stalls | 0 | 0 |

| Sectors | R30 mean suit | PLAY41 mean suit | PLAY41 completed blocks |
|---|---:|---:|---:|
| 1–4 | 23.4 | 23.22 | 48 |
| 5–8 | 132.6 | 125.95 | 48 |
| 9–12 | 199.9 | 191.26 | 41 |
| 13–16 | 188.2 | 186.26 | 41 |
| 17–20 | 164.1 | 176.43 | 39 |

Sectors 9–12 moved toward the 175–190 target and finished 1.26 suit above it. The cohort used the opening and Crawler queue changes. [Standard cohort](../../artifacts/nextgen/playtest/play41-standard-final/summary.json)

### Crawler suit loss

The native reference is Final25. The two simulation columns use matched seed 1729 and default play policies before and after PLAY41. Each column counts all combat incurred through that run's endpoint, so deaths can change the rooms contributing to the total.

| Rig | Final25 native share | Baseline sim Crawler suit / share | PLAY41 sim Crawler suit / share |
|---|---:|---:|---:|
| Breacher | 46.7% | 330.0 / 42.7% | 253.2 / 39.1% |
| Cryo | 30.2% | 194.6 / 39.1% | 254.4 / 60.0% |
| Pyro | 43.2% | 147.4 / 23.6% | 125.3 / 27.3% |
| Arc | 43.7% | 374.7 / 43.2% | 231.8 / 40.4% |
| Story novice Cryo | 54.1% | 420.3 / 45.9% | 422.9 / 46.9% |

Both Story Cryo simulations cleared. Each of their first four sectors cost zero suit. The Standard Cryo simulations both ended in death. Arc finished only in the revised simulation. [Baseline Standard](../../artifacts/nextgen/playtest/play41-crawler-before/summary.json) · [PLAY41 Standard](../../artifacts/nextgen/playtest/play41-crawler-after/summary.json) · [Baseline Story](../../artifacts/nextgen/playtest/play41-crawler-story-before/summary.json) · [PLAY41 Story](../../artifacts/nextgen/playtest/play41-crawler-story-after/summary.json)

### Story novice cohort

| Rig | PLAY41 clears |
|---|---:|
| Breacher | 12/12 |
| Cryo | 10/12 |
| Total | 22/24 |

Both losses were deaths. Sector-by-sector suit loss matched the baseline in sectors 1–4 for all 24 rig and seed pairs, with a mean of 12.15 suit per block. [Story cohort](../../artifacts/nextgen/playtest/play41-story-final/summary.json) · [Opening baseline](../../artifacts/nextgen/playtest/play41-story-opening-baseline/summary.json)

### Camera evidence

- Breacher's earned Atrium checkpoint produced a dodge, a waiting grille, a closure hit and a recoil frame. The event log records two escorts cancelled. A live enemy and the garden wreckage obscure the escorts in this angle, especially at 480×270. [Dodge](../../artifacts/nextgen/playtest/play41-atrium-final-frames/r4-communal-atrium-grille-dodge.png) · [Waiting](../../artifacts/nextgen/playtest/play41-atrium-final-frames/r4-communal-atrium-grille-waiting.png) · [Hit](../../artifacts/nextgen/playtest/play41-atrium-final-frames/r4-communal-atrium-grille-closed.png) · [Bars down](../../artifacts/nextgen/playtest/play41-atrium-final-frames/r4-communal-atrium-grille-recoil.png)
- The Freight wall sequence uses a controlled setup in the production game camera. Cryo starts at (278, 101) and the two Crawlers start at (336, 101) and (373, 101) along the upper wall. The existing simulation advances from the first warning in 50 ms steps. The queued Crawler yields toward the floor while the first contacts the marine. The Story Cryo campaign replay separately captured a queue around the cargo bank. [Windup](../../artifacts/nextgen/play41-wall-capture/play41-wall-queue-freight-hold-06.png) · [Strike](../../artifacts/nextgen/play41-wall-capture/play41-wall-queue-freight-hold-08.png) · [Recovery](../../artifacts/nextgen/play41-wall-capture/play41-wall-queue-freight-hold-11.png) · [Capture manifest](../../artifacts/nextgen/play41-wall-capture/manifest.json)

### Three-arm simulation

Each cell reports closures / visits, escorts cancelled, and mean suit loss on the twelve-seed cohort. Each arm uses the candidate geometry. The absent arm always releases the escorts. Visits include any run that reached the room.

| Room | Rig | Unaware | Aware | Rule absent |
|---|---|---:|---:|---:|
| Communal Atrium | Breacher | 3/12, 6, 16.94 | 8/12, 16, 20.68 | 0/12, 0, 16.94 |
| Communal Atrium | Cryo | 3/12, 6, 38.41 | 6/12, 12, 27.29 | 0/12, 0, 37.49 |
| Communal Atrium | Pyro | 1/12, 2, 5.89 | 7/12, 14, 13.52 | 0/12, 0, 6.14 |
| Communal Atrium | Arc | 1/12, 2, 15.63 | 8/12, 16, 11.78 | 0/12, 0, 15.63 |
| Manual Control Chamber | Breacher | 0/10, 0, 44.41 | 7/11, 21, 39.58 | 0/10, 0, 44.71 |
| Manual Control Chamber | Cryo | 0/8, 0, 84.01 | 6/9, 18, 58.58 | 0/7, 0, 93.43 |
| Manual Control Chamber | Pyro | 0/12, 0, 40.00 | 2/12, 6, 39.94 | 0/12, 0, 38.25 |
| Manual Control Chamber | Arc | 1/10, 3, 36.57 | 4/8, 12, 37.56 | 0/10, 0, 36.10 |

Cryo alone lost less suit in both rooms with awareness. The aware arm closed 29/48 in Atrium and 19/40 in Manual Control. The unaware arm closed 8/48 and 1/40, below the PLAY39 reference rates of 42% and 27%. The candidate stays opt-in. Restricting Manual Control to seeds that reached it in all three arms yields the same gate decision. [Unaware](../../artifacts/nextgen/playtest/play41-aisle-off/summary.json) · [Aware](../../artifacts/nextgen/playtest/play41-aisle-on/summary.json) · [Rule absent](../../artifacts/nextgen/playtest/play41-aisle-absent/summary.json)

The Standard balance rerun after merging local nextgen at `ca7c4738` repeated the 39/48 result with nine deaths and zero stalls. The production build passed and the source scan found no merge markers. [Post-merge Standard cohort](../../artifacts/nextgen/playtest/play41-integrated-standard/summary.json)

### Native checkpoint replay

Each cell reports closures, escorts cancelled, and gross suit lost. These are the same earned boundary for each rig's three arms. The Cryo Manual Control boundary comes from Final24 because Final25 Standard Cryo died before that room. Every replay cleared its target room with zero runner errors.

| Room | Rig | Unaware | Aware | Rule absent |
|---|---|---:|---:|---:|
| Atrium | Breacher | 0, 0, 0.00 | 1, 2, 0.00 | 0, 0, 0.00 |
| Atrium | Cryo | 0, 0, 0.00 | 1, 2, 0.00 | 0, 0, 0.00 |
| Atrium | Pyro | 0, 0, 0.00 | 1, 2, 0.00 | 0, 0, 0.00 |
| Atrium | Arc | 0, 0, 0.00 | 0, 0, 0.00 | 0, 0, 0.00 |
| Manual Control | Breacher | 0, 0, 22.23 | 0, 0, 40.90 | 0, 0, 22.23 |
| Manual Control | Cryo | 0, 0, 43.28 | 0, 0, 43.28 | 0, 0, 43.28 |
| Manual Control | Pyro | 0, 0, 55.44 | 0, 0, 81.51 | 0, 0, 55.44 |
| Manual Control | Arc | 0, 0, 27.72 | 0, 0, 27.72 | 0, 0, 27.72 |

The native replays reinforce the opt-in decision. Awareness made three Atrium closures possible while all arms spent zero suit. All twelve Manual Control replays released their escorts. [Atrium replay example](../../artifacts/nextgen/playtest/play41-replay-atrium-breacher-on/report.json) · [Manual Control replay example](../../artifacts/nextgen/playtest/play41-replay-manual-pyro-on/report.json)

### Native seed-1729 campaigns

| Rig and profile | Outcome | Clears | Gross suit lost | Runner errors | Loading holds over 5 s |
|---|---|---:|---:|---:|---:|
| Standard competent Breacher | Died in Safety Interlock | 11/20 | 432.27 | 0 | 4 |
| Standard competent Arc | Complete after earned checkpoint continuation | 20/20 | 662.64 | 0 | 3 |
| Story novice Cryo | Complete | 20/20 | 1,023.70 | 0 | 5 |

The ordinary competent policy closed 0/2 Atrium and 0/1 Manual Control candidate grilles. Breacher reached Atrium and died before Manual Control. Arc reached both. The initial Breacher launch hit a loopback permission error and the approved retry reached the recorded death. Arc reached the one-hour runner limit during sector 20 and completed after resuming the earned sector-19 clear. The runner flagged the loading holds listed above. [Breacher](../../artifacts/nextgen/playtest/play41-breacher-final/report.json) · [Arc first segment](../../artifacts/nextgen/playtest/play41-arc-final/report.json) · [Arc finale](../../artifacts/nextgen/playtest/play41-arc-finale/report.json) · [Story Cryo](../../artifacts/nextgen/playtest/play41-story-cryo-final/report.json)

The first candidate placed the grille before the Brute entered. A native dash moved the marine across that placement before recovery, so the prototype was replaced with a lane drawn at the live spawn. The earlier reserve and grille silhouettes also read as props in downsampled frames. The final captures use bodies with legs and claws. Crowding can still obscure them during the Atrium dodge.

### Final integration

Merged local nextgen through `a65d7fb5` into `t3/play41`. The production build and conflict-marker scan passed. The final Standard rerun repeated 39/48 with zero stalls and the same per-rig split. [Final integrated Standard cohort](../../artifacts/nextgen/playtest/play41-post-title35-standard/summary.json)

| Disk check | Size | Used | Available | Capacity |
|---|---:|---:|---:|---:|
| Start | 926 GiB | 824 GiB | 74 GiB | 92% |
| End | 926 GiB | 843 GiB | 56 GiB | 94% |

The assigned worktree's `artifacts/nextgen` occupied 2.4 GiB at handoff.
