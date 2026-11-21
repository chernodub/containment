# PLAY23 play pass

The reviewed baseline is `1d943a1f`. The R19 reference recorded 37 Standard competent clears out of 48. Breacher cleared 8, Cryo 10, Pyro 10 and Arc 9 of 12.

## Combat and decisions

Story permits one melee token and one ranged token. Standard permits two and one. Veteran permits three and two. Each Crawler uses half a melee token. An ordinary melee attacker keeps its token through recovery. A ranged wind-up occupies its own budget. A guardian's charge reserves one unit of melee capacity. Eligible enemies are considered by distance, then by stable ID. Wind-up starts are spaced by 250 simulation milliseconds.

Ordinary melee recovery is 16 percent shorter and strike damage is 12 percent higher before incoming damage caps. Non-Spitter family caps receive a 10 percent allowance. These changes aim to retain the cost of a missed dodge while making the next attacker easier to identify.

When a Spitter's body is outside the usable fighting view, its ranged warning projects a closing jaw toward the locked lane. Ordinary edge arrows are smaller and use half opacity. The cover lesson appears by its shooter. An active hold suppresses that lesson so the player can follow the relay objective.

The interlock places pads ahead of the marine when the pincer starts staging and closes the selected flank after a 950 millisecond hold. The competent policy seeks the pad that blocks more arrivals. Overload searches for a closer bank with a clear line from the failed bank and a farther one occluded by geometry. Backup markers appear before failure. The plate shader opens a wider section at each third of armour lost.

## Balance

The final pad-hold policy cleared 41 of 48 on Standard competent, compared with the reviewed baseline of 37 of 48. Arc cleared 9 of 12, Breacher 9, Cryo 11 and Pyro 12. Every rig reached the six-clear minimum. The total exceeded the 40-clear ceiling by one. Story novice cleared 24 of 24, with Cryo and Breacher each clearing 12 of 12.

The twelve seeds were `7,11,23,99,256,512,1024,2025,4096,6561,9001,65537`. Results are under `artifacts/nextgen/playtest/play23-verified-{arc,breacher,cryo,pyro,story}/summary.json`. The two baseline damage samples pin the simulation and policy to `1d943a1f` under `artifacts/nextgen/playtest/play23-pinned-room-damage/`.

### Suit damage by room

Each entry gives before → after suit points lost. A dash marks a sector the campaign did not enter.

#### Seed 7

| Sector | Arc | Breacher | Cryo | Pyro |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 10.0 → 10.0 | 10.0 → 10.0 | 10.0 → 10.0 | 0.0 → 0.0 |
| 2 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 3 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 4 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 5 | 0.0 → 35.8 | 20.3 → 0.0 | 52.0 → 35.0 | 20.0 → 0.0 |
| 6 | 20.0 → 0.0 | 0.0 → 21.7 | 90.8 → 21.7 | 20.5 → 0.0 |
| 7 | 0.0 → 0.0 | 10.0 → 11.2 | 20.0 → 0.0 | 46.5 → 0.0 |
| 8 | 22.0 → 17.3 | 72.5 → 27.6 | 55.5 → 65.1 | 39.2 → 28.6 |
| 9 | 25.3 → 90.6 | 25.3 → 23.2 | 40.0 → 0.0 | 0.0 → 37.1 |
| 10 | 56.3 → 84.0 | 64.7 → 22.8 | 20.0 → 33.9 | 67.2 → 86.4 |
| 11 | 18.6 → 19.0 | 18.6 → 28.4 | 70.6 → 67.1 | 22.3 → 34.8 |
| 12 | 76.7 → 61.7 | 49.8 → 46.9 | 67.9 → 61.7 | 102.0 → 0.0 |
| 13 | 58.9 → 67.1 | 66.1 → 67.2 | 168.4 → 95.8 | 70.7 → 50.3 |
| 14 | 29.6 → 40.6 | 61.1 → 42.7 | 113.7 → 73.7 | 105.4 → 55.0 |
| 15 | 0.0 → 22.4 | 32.0 → 36.8 | 0.0 → 0.0 | 0.0 → 39.6 |
| 16 | 40.0 → 30.6 | 64.4 → 117.2 | 147.9 → 192.3 | 49.7 → 13.2 |
| 17 | 9.9 → 21.1 | 47.3 → 90.5 | 87.6 → 0.0 | 0.0 → 13.2 |
| 18 | 50.1 → 0.0 | 12.0 → 16.3 | 24.0 → 39.6 | 48.0 → 65.9 |
| 19 | 10.0 → 96.3 | 59.2 → — | 99.0 → 48.0 | 0.0 → 8.6 |
| 20 | 12.0 → 83.7 | — → — | 163.5 → 88.6 | 50.0 → 52.6 |

#### Seed 2025

| Sector | Arc | Breacher | Cryo | Pyro |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0.0 → 0.0 | 10.0 → 10.0 | 10.0 → 10.0 | 10.0 → 10.0 |
| 2 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 3 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 | 0.0 → 0.0 |
| 4 | 0.0 → 0.0 | 0.0 → 0.0 | 13.0 → 14.2 | 0.0 → 0.0 |
| 5 | 20.0 → 0.0 | 23.5 → 45.7 | 96.3 → 85.7 | 22.3 → 2.3 |
| 6 | 20.0 → 71.0 | 0.0 → 22.4 | 20.0 → 84.4 | 56.8 → 24.2 |
| 7 | 0.0 → 24.6 | 0.0 → 0.0 | 20.0 → 44.8 | 10.0 → 46.5 |
| 8 | 20.0 → 53.9 | 53.9 → 33.6 | 105.5 → 100.0 | 69.5 → 24.6 |
| 9 | 28.0 → 39.2 | 38.0 → 40.2 | 22.0 → 28.3 | 0.0 → 14.7 |
| 10 | 33.2 → 33.6 | 86.3 → 55.5 | 41.1 → 66.6 | 22.2 → 58.0 |
| 11 | 8.6 → 78.1 | 30.6 → 0.0 | 10.0 → 108.3 | 49.2 → 29.8 |
| 12 | 92.8 → 71.1 | 0.0 → 37.5 | 36.3 → 101.7 | 22.8 → 14.0 |
| 13 | 31.4 → 87.1 | 119.8 → 96.3 | 28.9 → 132.0 | 26.0 → 11.2 |
| 14 | 10.0 → 118.3 | 86.4 → 91.3 | 95.5 → 82.4 | 88.8 → 129.7 |
| 15 | 52.8 → 17.6 | 22.0 → 0.0 | 0.0 → 24.6 | 22.0 → 55.4 |
| 16 | 100.3 → — | 72.0 → 96.5 | 190.2 → 51.3 | 10.0 → 45.0 |
| 17 | 85.8 → — | 40.0 → 51.5 | 112.2 → 83.8 | 112.1 → 68.9 |
| 18 | 74.1 → — | 34.1 → 10.1 | 56.9 → 44.5 | 20.1 → 20.1 |
| 19 | 21.7 → — | 52.5 → 66.1 | 71.2 → 59.7 | 40.7 → 28.0 |
| 20 | 129.1 → — | 60.5 → 98.8 | 61.3 → 128.6 | 109.8 → 80.5 |

## Desktop evidence

The production build passed. The native runner used fixed-step desktop mouse and keyboard input with `--fast` and the requested 180000 ms startup timeout.

- Token-limited crowd at `artifacts/nextgen/play23-final-captures/play23-crowd-swarm-junction.png`.
- Corrected edge jaw at `artifacts/nextgen/play23-edge-final/play23-edge-safety-interlock-station.png`.
- Interlock approach pads at `artifacts/nextgen/play23-interlock/play23-interlock-safety-interlock-station.png`.
- Near and far backup banks at `artifacts/nextgen/play23-final-captures/play23-bank-0-overload-floor.png` and `artifacts/nextgen/play23-final-captures/play23-bank-1-overload-floor.png`.

An earlier Pyro pass exposed a Relay Racks warning that the fighting-view classifier excluded and the HUD did not mark. The final edge marker checks that same boundary and falls back to the visible lip of the dock. An earlier Arc trace reached the selected interlock pad and paced in and out. The final policy holds its position after reaching the selected pad, unless a melee escape plan takes priority.

### Final native traces

Both seed-1729 campaigns cleared all 20 sectors with zero errors or runner diagnostics. The trace and report for each rig are in `artifacts/nextgen/playtest/play23-native-verified-{arc,pyro}/`.

| Rig | Peak simultaneous ordinary melee / ranged wind-ups | Off-screen ranged hit warnings without a tell | Interlock activations | Final bank |
| --- | --- | ---: | ---: | --- |
| Arc | 2 / 1 | 0 of 8 | 1 | Near exposed |
| Pyro | 2 / 1 | 0 of 8 | 1 | Near exposed |

The native runner samples combat at 100 ms intervals. The sampled melee count includes strikes, and peak weighted melee occupancy remained at two even when counting recovery. Projectile warnings were matched to hits by shooter and release origin. Arc matched all 14 recorded projectile hits and Pyro matched all 12. Each run closed breach 1 in Safety-interlock Station.

## What remains weak

Standard exceeded its requested clear ceiling by one. Both native rigs chose the near exposed bank, so the far covered route has staged capture evidence and still lacks a native choice in these two campaigns. The ranged slot releases when the shot fires and the shooter starts repositioning. The measurable wind-up limits and coverage come from two competent bot runs on one seed. Human recognition of the cue during sustained fire remains unmeasured.

## Overload Floor stall investigation

The traced reproduction at `ef4e8333` stalled with 19 clears after 45.1 simulated seconds without combat progress. The marine ended at approximately (702, 289), in the reaction-feed threshold. For 447 of 450 sampled inputs in the last 45 seconds the bot stood still, and for the other three it tried moving left. It never fired. The bot's waypoint was (496, 272), but its westward movement probe collided with the deck geometry.

Five enemies were live. A Carrier at (375, 305), Brutes at (420, 496) and (374, 434), and Crawlers at (464, 457) and (471, 492) were all in approach with blocked shots. None held an attack token. The HUD said “Remove the brood leader before reinforcements” throughout the final 450 sampled decisions. The remaining count of 31 comprised the five live enemies, three child slots reserved by the Carrier, and 23 undispatched enemies in later beats. There were zero pending spawn slots and zero undispatched enemies in the active priority beat. No siege or bank was active. The remaining live enemies had to be reached before the relay beat. The pinned trace with these fields is `artifacts/nextgen/playtest/play23-stall-detail/breacher-512.json`.

The three older result files have final snapshots and recent decisions. They lack full traces. Breacher 7 had two live enemies out of 28 remaining, Arc 11 had 12 out of 40, and Breacher 137 had 12 out of 46. Each marine stopped beside the same threshold, chose zero movement with no firing target, and had a blocked westward probe toward the reported waypoint. All three had no active siege and their live enemies were in approach.


The marine could leave the threshold by rounding the reactor. A person remaining in the same blind pocket could see the same standstill, and the old objective gave little guidance about where to go. This was a bot navigation stall. There was no attack-token holder or relay activation blocking progress.

The shared bot navigator now checks that it can walk directly to a long waypoint before using it. If that segment is blocked, it uses its finer navigation grid and shorter movement probes near corners. Simulation and native play use the same recovery. Overload Floor now says “Sweep around the reactor to reach the remaining attackers” when active enemies are all out of the firing lane outside a siege. Attack and relay rules are unchanged.

Breacher 512, Arc 11, and Breacher 137 each cleared 20 sectors. Breacher 7 died in sector 16. The four twelve-seed Standard competent cohorts completed with zero stalls and 37 of 48 clears. Breacher cleared 6 of 12, Cryo 11, Pyro 9, and Arc 11. The measured results are under `artifacts/nextgen/playtest/play23-unstuck-{breacher,cryo,pyro,arc}/`. The separate 512 and 137 results are under `play23-unstuck-512` and `play23-unstuck-extra` in the same parent directory.

The production build passed. Native Breacher 1729 cleared all 20 sectors with zero errors and zero runner diagnostics. Its report and trace are in `artifacts/nextgen/playtest/play23-unstuck-native/`.

## PLAY24

### Enemies seek a visible ready position

An ordinary enemy that loses its attack lane or cannot commit searches for a clear point at its preferred distance from the marine. Melee starts at engage range plus body clearance. Spitters use their firing distance and Carriers use a larger stand-off. An enemy already close to the ring offsets its next point tangentially so it can circle while waiting. If that point is blocked, it searches nearby ring positions for the nearest reachable firing lane. An occluded enemy can also follow the marine's navigation route while a clear position is unavailable. The Overload sweep hint requires ten seconds with live enemies and no clear line of sight. Token budgets and commitment rules retain the PLAY23 values.

### Breacher receipts and balance response

The merged baseline replay reproduced all six deaths. The last incoming damage receipt identifies the lethal hit.

| Seed | Clears | Fatal sector | Lethal hit |
| ---: | ---: | --- | --- |
| 7 | 15 | Swarm Junction | Brute contact |
| 11 | 10 | Diagnostic Gallery | Crawler contact |
| 23 | 18 | Manual Control Chamber | Crawler contact |
| 99 | 18 | Manual Control Chamber | Spitter projectile |
| 2025 | 11 | Safety-interlock Station | Spitter projectile |
| 4096 | 10 | Diagnostic Gallery | Stalker contact |

These replays used the same twelve seeds, bot policy and installed actor models. A simulation-only observer counted applied ability damage inside Ram and separated Bulwark crushes. Final run receipts retain the lethal source. The actor-model file manifest content digest was `6c5430fdc045e81ea4eb605852003b367c434c49ada35ae61a3129f1f1a9a7e0`.

| Game revision | Clears | Ram targets hit | Crushes | Ram damage including crushes | Damage on crush hits |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before tokens, `1d943a1f` | 7 | 85 | 9 | 1,866.8 | 548.0 |
| Merged PLAY23, `feb27ac0` | 6 | 106 | 8 | 2,124.7 | 451.6 |
| Ready ring, `cff8bf3b` | 10 | 112 | 8 | 2,267.4 | 440.8 |

The controlled pre-token replay produced seven clears with the current models and policy. The historical eight-clear figure came from a different build and policy setup. Applied crush damage declined after tokens, but total Ram damage rose. Four of the six lethal hits were melee and two were Spitter projectiles. Both unadjusted totals and death-room evidence leave room for the higher strike pressure and differences in fight access to matter. The ready stance draws waiting targets into actionable lanes. That change alone brought Breacher back to the requested 8–10 clears, so this pass kept Ram and Bulwark at their existing values.

The receipts are in `artifacts/nextgen/playtest/play24-ram-{1d943a1f,feb27ac0,cff8bf3b}/`.

### PLAY24 verification

Standard competent cleared 38 of 48 with zero stalls, up from 37 of 48 with zero stalls on `feb27ac0`. Breacher went from 6 to 10 of 12, Cryo from 11 to 10, Pyro from 9 to 8, and Arc from 11 to 10. Story novice cleared 23 of 24, with Breacher at 12 of 12 and Cryo at 11 of 12. All cohorts used the prescribed twelve seeds, two workers, and the same model files. The final Standard results are in `artifacts/nextgen/playtest/play24-ring-{arc,cryo,pyro}/` and `artifacts/nextgen/playtest/play24-ram-cff8bf3b/`. Story results are in `artifacts/nextgen/playtest/play24-story/`.

The production build passed. Native Breacher 1729 started at a one-minute host load of 4.60 and cleared 20 sectors with zero errors or runner diagnostics. Of 647.5 simulated seconds with at least one live enemy, 165.1 seconds had no enemy inside the trace's conservative fighting view. The longest continuous gap was 5.3 seconds. Requiring both framing and a clear firing lane yielded 181.2 seconds without a target. These are interval totals from adjacent native trace samples, with room transitions and periods without live enemies excluded. Service Shaft Landing had the largest cumulative out-of-view total at 23.1 seconds. The ready-position search samples candidate points and does not guarantee continuous visibility from every legal player position.

The native report and trace are in `artifacts/nextgen/playtest/play24-native-breacher/`.
