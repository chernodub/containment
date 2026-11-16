# B10 — balance for humans

Branch: `t3/human-balance-tuning`. Frozen implementation: `5a8919e430527761da6621025ce4c3468874f608` (report-only completion commit follows). Build and final measurements are recorded below. No render, UI, world, motion, player-stat, ability-number or checkpoint-schema changes. No tests, dependencies, push or PR.

**Acceptance: incomplete.** Competent confirmation meets every requested target. Novice confirmation is 2/80 (2.5%), below the requested 5–20%. Numerical tuning stops at this bounded candidate; no full-target pass is claimed.

## Attack design

Damage is authored directly by family, independent of the old depth/contact-damage multiplier. The scaled 90-damage ceiling is removed. Existing ranged Spitter damage is unchanged. Ordinary melee peaks at 35/100 base health; an elite/champion Brute peaks at 40.25. Existing incoming-damage boons still apply normally.

| Family | Wind-up ms | Strike ms | Recovery ms | Rest after recovery ms | Damage ordinary / elite | Engage distance before marine radius | Exact footprint (simulation units) |
|---|---:|---:|---:|---:|---:|---:|---|
| Crawler | 320 | 70 | 280 | 350 | 10 / 11.5 | 54 | 78 reach, 100° arc |
| Stalker | 460 | 90 | 650 | 1000 | 22 / 25.3 | 84 | 130 long capsule, 24 wide |
| Brute | 700 | 120 | 550 | 1100 | 35 / 40.25 | 62 | 92 reach, 130° arc |
| Spitter melee | 400 | 90 | 420 | 1500 | 10 / 11.5 | 28 | 46 reach, 90° cone |
| Carrier | 660 | 120 | 500 | 1100 | 18 / 20.7 | 46 | 70 reach, 100° cone |

Elites use ×0.95 wind-up (1.05× faster), ×0.85 recovery (1.18× faster), and ×1.15 damage. Rest is unchanged. These factors stay below 1.35×. Facing locks with 170 ms remaining for small families and 250 ms for heavy families. Footprints remain shared simulation/presentation data; control cancels attacks, recovery/rest ownership and native immunity remain intact.

Attack starts are globally staggered by 200 ms. Existing limits remain two small and one heavy active attack, with three berths total. A 120° forward sector leaves attack slots at separated angles around the marine. Crawlers initiate a real lunge before physical touching; Stalkers have a longer line and punishable recovery; a Brute announces a broad event.

The first five story rooms use 28 / 17 / 23 / 20 / 21 scheduled enemies before any room-specific architecture additions, with a higher early live-body cap. Awakening Bay has at most two Brutes; excess Brute rolls become Crawlers. Early six-body groups arrive every 3 s with 300 ms internal spacing. Later ordinary four-body groups arrive every 4 s with 350 ms internal spacing, with sixteen additional scheduled enemies above the base depth count. The later mix is seven Crawler, one Brute, three Spitter, two Stalker and one Carrier entries; late elite frequency is 60–69%, with the small attack bonuses stated above. Transmission arrivals are 1500 ms apart. Native spawn/collision/child-reservation rules still decide actual admission. Healing is the last adjustment: random drop weights shift credits 45→15 and health 20→50 out of 100; health values, drop chances, initial resources and medkit numbers stay unchanged.

## Human policy

Both `npm run playtest:sim -- --profile=<profile>` and `npm run playtest -- --profile=<profile>` use the same seeded controller. `competent` is the default. The native batch wrapper also forwards `--profile` and `--storyboard-room`. The policy epoch is `b10-human-limits-v1`.

| Parameter | Novice | Competent | Expert |
|---|---:|---:|---:|
| Reaction latency ± uniform seeded jitter, ms | 300 ±90 | 260 ±70 | 180 ±40 |
| Per-telegraph miss probability | 20% | 10% | 2.5% |
| Additional miss probability per extra visible active threat | 9 pp | 7 pp | 2.5 pp |
| Aim angular error ±degrees | 7 | 4 | 1.5 |
| Target tracking lag, ms | 200 | 170 | 80 |
| Minimum interval between discrete keys / weapon changes, ms | 200 | 160 | 120 |
| Movement commitment, ms (×0.8–1.2 jitter) | 500 | 400 | 200 |
| Stand-off distance error ±simulation units | 80 | 55 | 25 |
| Brief firing fixation probability | 20% | 12% | 2.5% |
| Nearby visible targets needed for proactive retreat dash | 4 | 3 | 2 |

Observations are every 100 ms. Reaction deadlines start at first observed visibility and inputs wait for the next observation tick, adding up to 100 ms to the configured delay; tracking lag also quantizes on that clock. Aim bias, stand-off variation and fixation refresh every seeded 600–1200 ms. Base stand-off preferences are 140 units with shotgun and 240 otherwise; the old exact Crawler reach-boundary avoidance is disabled for human profiles. A fixed seed drives a separate bot RNG; simulation RNG and saves are untouched.

A newly visible telegraph gets one latency draw and one attention decision, retained for that warning. Miss probability rises with simultaneous on-screen warnings, projectiles and pools, capped at 80%. Melee warnings are unavailable to evasion until noticed. Ranged warnings/pools have the same attention delay; moving hazards and weapon targets have tracking lag. Current visible attack footprints can suggest a step or dash, but every melee dash must commit with at least 120 ms remaining, or is suppressed. A retreating bot can also dash proactively when a visible pack closes; it reads current positions, not future attacks. Healing retains priority over this dash. Only one discrete action is admitted at once.

The policy uses visible target positions and warnings for combat, with radar/navigation waypoints for exploration. No enemy future decisions, cooldowns, damage receipts or observer metrics feed its decisions. Native inputs still go through the actual keyboard/mouse controller. Probe radius now matches the native marine's 16-unit radius: the old 19-unit probes could falsely report every exit blocked after a dash.

## Cohorts

Quick seeds: 1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456. Full confirmation adds 17, 23, 101, 256, 512, 1024, 4096, 8192, 16384, 32768. All four rigs, unassisted, twenty-room story; natural deaths and any censors stay in the denominator. At most four simulation workers and one native browser. Frozen raw reports/bundles are under `artifacts/nextgen/playtest/b10-*`.

Simulation uses the production game and the shared policy with an approximate camera/pointer observer; it omits GPU, DOM, audio and loading. Its outcomes are simulation evidence. Native campaigns below exercise the real input and presentation boundary. Fixed-step wall/submission times are not hardware FPS or human completion measurements.

| Quick cohort (40 attempts each) | Profile | Change | Completion | B / C / P / A % | Median hits rooms 1–5 | Lost-room first-hit→death s | Transmission clear median s |
|---|---|---|---:|---|---|---:|---:|
| 1 | competent | Human controller; authored family damage/timing and longer footprints | 30% | 30 / 70 / 10 / 10 | 0 / 1 / 1 / 1 / 1 | 11.6 | 58.7 |
| 2 | competent | Delayed ranged attention, input/probe fixes, shorter rest and flanking | 10% | 10 / 20 / 10 / 0 | 0 / 1 / 1 / 1 / 2 | 10.3 | 56.3 |
| 3 | competent | Crawler lunge initiation, sustained packs, fewer later ranged elites | 17.5% | 30 / 20 / 0 / 20 | 2 / 6 / 2 / 4 / 3.5 | 9 | 54.8 |
| 4 | competent | Crawler 10; smaller room-2 pack; health-drop weight 35 | 50% | 60 / 60 / 10 / 70 | 2 / 4 / 1 / 3.5 / 5 | 14.6 | 60.9 |
| 5 | competent | Proactive crowd retreat dash; four more room-3 enemies | 60% | 70 / 60 / 20 / 90 | 1 / 3 / 2 / 4.5 / 3 | 18.1 | 58.3 |
| 6 | competent | Two-Brute opening, health-drop weight 50, later elite frequency 35% | 67.5% | 70 / 80 / 40 / 80 | 2 / 3 / 2 / 5 / 3 | 20.9 | 61.1 |
| 7 | competent | Later elite frequency 60%; elite damage 1.15× and wind-up 0.95× | 60% | 70 / 60 / 40 / 70 | 2 / 3 / 2 / 5 / 3 | 19.8 | 73.9 |
| 8 | competent | Two more later waves; Transmission arrivals 1500 ms apart | 47.5% | 50 / 70 / 30 / 40 | 2 / 3 / 2 / 5 / 3 | 26.3 | 66.5 |
| 8-a | novice | Initial novice: 360±100 ms reaction, 300 ms tracking, 650 ms commitment | 2.5% | 10 / 0 / 0 / 0 | 6 / 6 / 5 / 5 / 7 | 13.1 | 70.7 |
| 8-b | novice | 320±90 ms reaction, 550 ms commitment | 2.5% | 10 / 0 / 0 / 0 | 7 / 6 / 4.5 / 6 / 8 | 17.7 | 66.5 |
| 8-c | novice | Firing fixation 20% | 2.5% | 10 / 0 / 0 / 0 | 6 / 5.5 / 5 / 5 / 6.5 | 14.9 | 74.5 |
| 8-d | novice | Tracking lag 200 ms | 2.5% | 10 / 0 / 0 / 0 | 5 / 5.5 / 4 / 5.5 / 6 | 20.9 | 69.4 |
| 8-e | novice | Final novice defaults: 300 ms reaction, 7° aim, 200 ms input, 500 ms commitment | 2.5% | 10 / 0 / 0 / 0 | 4.5 / 6 / 3 / 5.5 / 5 | 21.2 | 68.7 |

The eight game iterations use the competent profile. The five novice checks use the same fixed seed/rig cases with successive explicit human assumptions; they are not pooled. Every novice quick cohort records one clear. Final defaults are the explicit table above. The first 11 attempts of a premature candidate-5 confirmation and its interrupted native Breacher campaign were stopped before completion and are excluded from final results; their raw `b10-confirm-competent` / `b10-native-final-*` evidence is retained.

## Full confirmation — 20 seeds × 4 rigs per profile

| Profile | Complete / attempts | Breacher | Cryo | Pyro | Arc | Completion target | Result |
|---|---:|---:|---:|---:|---:|---|---|
| novice | 2/80 (2.5%) | 1/20 (5%) | 0/20 (0%) | 0/20 (0%) | 1/20 (5%) | 5–20% | **unmet** |
| competent | 34/80 (42.5%) | 8/20 (40%) | 13/20 (65%) | 6/20 (30%) | 7/20 (35%) | 35–55%, each rig ≥25% | met |
| expert | 80/80 (100%) | 20/20 (100%) | 20/20 (100%) | 20/20 (100%) | 20/20 (100%) | ≥75% | met |

All 240 final attempts use frozen implementation `5a8919e` and the same game/policy bundle. No assistance, stalls or censored attempts enter these three final cohorts. Each profile has its own raw [novice](../../artifacts/nextgen/playtest/b10-final-novice/summary.json), [competent](../../artifacts/nextgen/playtest/b10-final-competent/summary.json) and [expert](../../artifacts/nextgen/playtest/b10-final-expert/summary.json) summary and per-run reports.

| Profile | Lost-room first-hit→death median s | Shortest observed full-health→death s | Transmission clear median s | Transmission clears |
|---|---:|---:|---:|---:|
| novice | 18.5 | 10.3 | 65.4 | 39 |
| competent | 25.9 | 10.6 | 65.8 | 77 |
| expert | — | — (no deaths) | 65 | 80 |

Competent acceptance: **42.5%** completion (target 35–55%), minimum rig **30%** (target ≥25%), median hits **2 / 3 / 2 / 4 / 3** in rooms 1–5 (target 2–6), lost-room time after the first accepted hit **25.9 s** (target ≥20), and Transmission **65.8 s** (target 60–75). No competent death occurred within 10.6 s of the last observed full-health state. The full-health clock is a passive per-tick observation; damage/first-hit counters observe actual positive armor/health loss. These measurements never feed policy decisions. Expert has no deaths from which to estimate time-to-death.

**The novice completion target remains unmet at 2.5%.** This report does not claim the full B10 acceptance set passed. Numerical tuning stops with the bounded attack table and explicit final profiles.

## Hits taken — rooms 1–5

Accepted positive-damage hits, including armor loss. Each row includes every entered attempt, including eventual room deaths; unreached rooms are not imputed as zero hits. `7+` is the sum of the remaining integer bins; raw JSON retains every exact count.

| Profile | Room | Entered | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7+ | Median |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| novice | 1 | 80 | 4 | 5 | 10 | 10 | 10 | 15 | 6 | 20 | 5 |
| novice | 2 | 80 | 3 | 2 | 9 | 9 | 7 | 12 | 15 | 23 | 5 |
| novice | 3 | 80 | 3 | 10 | 15 | 14 | 13 | 9 | 7 | 9 | 3 |
| novice | 4 | 78 | 1 | 2 | 8 | 6 | 10 | 17 | 4 | 30 | 5 |
| novice | 5 | 72 | 2 | 4 | 3 | 7 | 5 | 16 | 8 | 27 | 5 |
| competent | 1 | 80 | 8 | 24 | 17 | 8 | 9 | 4 | 6 | 4 | 2 |
| competent | 2 | 80 | 6 | 7 | 16 | 20 | 15 | 9 | 5 | 2 | 3 |
| competent | 3 | 80 | 7 | 16 | 24 | 14 | 8 | 3 | 5 | 3 | 2 |
| competent | 4 | 80 | 1 | 8 | 13 | 12 | 12 | 14 | 11 | 9 | 4 |
| competent | 5 | 80 | 3 | 16 | 14 | 16 | 14 | 10 | 6 | 1 | 3 |
| expert | 1 | 80 | 47 | 19 | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| expert | 2 | 80 | 14 | 23 | 25 | 9 | 4 | 2 | 1 | 2 | 2 |
| expert | 3 | 80 | 30 | 23 | 14 | 12 | 1 | 0 | 0 | 0 | 1 |
| expert | 4 | 80 | 13 | 16 | 12 | 15 | 14 | 6 | 2 | 2 | 2 |
| expert | 5 | 80 | 23 | 24 | 17 | 11 | 4 | 1 | 0 | 0 | 1 |

## Native play and visual critique

First critique: `artifacts/nextgen/b10/feel01/breacher-storyboard.png`, plus its native frame `breacher/05-play-r1-awakening-bay-011.png`. Actual room clear, 14.52 s; no errors/defects. Readable marine and ample firing space, but very little melee pressure and a Brute stuck behind Bulwark. This led to sustained packs and earlier engagement.

Second critique: `artifacts/nextgen/b10/feel02/arc-storyboard.png`, plus native `b10-feel02-native/play-r1-awakening-bay-032.png` (Crawler warnings with 103/320 ms remaining) and `play-r1-awakening-bay-066.png` (Brute warning with 500 ms remaining). Actual room clear, 37.73 s; no errors/defects. The Crawler warnings now overlap in a readable sequence and the wider Brute sweep has a distinct raised pose/ground arc. Native images and 480×270 storyboard cells were opened. Crawler warning edges are too quiet amid the shock effect and bodies; the Brute event reads better. Five slow Brutes chasing the marine can also leave a tedious cleanup tail.

Third critique: `artifacts/nextgen/b10/feel03/pyro-storyboard.png`. Actual first-room clear in 21.30 s with 60 damage taken (six small hits), no errors/defects. The two-Brute limit keeps the first fight focused on the Crawler rhythm and removes the observed heavy cleanup tail. The native storyboard was opened at 480×270 cell size.

The sandbox-only first native launch failed before play (`listen EPERM 127.0.0.1`); its raw report is retained as `b10-feel01`. Running the authorized loopback server and Chromium outside the sandbox resolved it. Dependency installation likewise required normal network/cache access; `npm ci --no-audit --no-fund` succeeded without dependency changes.

Final native campaign batch: `node scripts/nextgen/playtest/native-batch.mjs --label=b10-native-c08 --profile=competent --seeds=1729 --workers=1 --storyboard-room=awakening-bay --dist-dir=artifacts/nextgen/b10/candidate08-dist`. All four rigs used frozen implementation `5a8919e`, ordinary native keyboard/mouse inputs, every simulation tick rendered, no incoming-damage assistance and no fast-render mode. Each campaign ran until its natural death; these are four attempts, not a native completion-rate estimate.

| Rig | Outcome | Rooms cleared | Death room | Game elapsed s | Wall elapsed s | Errors / defects | Awakening Bay clear s |
|---|---|---:|---|---:|---:|---:|---:|
| Breacher | dead | 11 | 12, Safety Interlock Station | 448.03 | 933.32 | 0 / 0 | 26.08 |
| Cryo | dead | 3 | 4, Communal Atrium | 133.15 | 307.10 | 0 / 0 | 27.35 |
| Pyro | dead | 13 | 14, Service Shaft Landing | 469.33 | 1013.82 | 0 / 0 | 22.30 |
| Arc | dead | 11 | 12, Safety Interlock Station | 459.67 | 814.92 | 0 / 0 | 26.58 |

All four final twelve-frame storyboards were opened at their original 480×270 cell resolution; selected 1920×1080 native frames were also opened. The gallery contains entry, ten distinct fight frames and the actual clear, selected from 53 / 56 / 46 / 54 captured candidates. Review files:

- [Breacher storyboard](../../artifacts/nextgen/b10/native-storyboards/breacher-storyboard.png), [native frame](../../artifacts/nextgen/b10/native-storyboards/breacher/06-play-r1-awakening-bay-024.png).
- [Cryo storyboard](../../artifacts/nextgen/b10/native-storyboards/cryo-storyboard.png), [native frame](../../artifacts/nextgen/b10/native-storyboards/cryo/07-play-r1-awakening-bay-030.png).
- [Pyro storyboard](../../artifacts/nextgen/b10/native-storyboards/pyro-storyboard.png), [native frame](../../artifacts/nextgen/b10/native-storyboards/pyro/07-play-r1-awakening-bay-024.png).
- [Arc storyboard](../../artifacts/nextgen/b10/native-storyboards/arc-storyboard.png), [native frame](../../artifacts/nextgen/b10/native-storyboards/arc/07-play-r1-awakening-bay-029.png).

The packs form separated approaches and keep the marine moving through successive groups. Breacher's Bulwark and Cryo's ice split the pack; Pyro's flame clears groups sooner; Arc's chain effect makes the small warning rim particularly hard to separate from friendly feedback. Brutes remain distinct large bodies with broad warning sweeps. The two-Brute opening avoids the earlier five-heavy cleanup tail, though the last heavy can still leave a few seconds of pursuit. A storyboard samples the rhythm; it cannot establish a person's reaction success or fairness.

`npm run build` passed on the frozen implementation (`tsc --noEmit` and Vite production build). No tests or assertion gates were added or run. Final campaigns reported no errors or defects; benchmark timing limitations are retained below.

## Measured benchmark

One matched ordinary 10-second Awakening Bay / Breacher / High / 1920×1080 trial per frozen build, with 25 legal replenished enemies and the native full kit. Native campaigns and benchmark browsers were serialized; four simulation workers ran during these contested-host samples.

| Source | Start 1-minute load | CPU average / p50 / p95 ms | Frame p50 / p95 ms | Peak draws | New combat programs |
|---|---:|---:|---:|---:|---:|
| candidate 5, 7f9ee10 | 78.7 | 18.13 / 14.80 / 45.50 | 24.30 / 57.50 | 259 | 0 |
| final candidate, 5a8919e | 19.4 | 16.92 / 12.70 / 40.70 | 16.80 / 42.60 | 273 | 0 |

Both runs have zero errors, zero new combat programs and passing draw/program inventory budgets. Frame and CPU timing flags miss the nominal budgets. Host loads and adaptive scales differ substantially; this pair cannot attribute a timing improvement to B10 and is not hardware FPS certification. Raw data: [before](../../artifacts/nextgen/b10-before/benchmark.json), [after](../../artifacts/nextgen/b10-after/benchmark.json). No samples or failed timing flags were discarded.

## Integration requests

- Renderer/VFX owner: increase the local edge contrast of small-family danger footprints against lit steel, corpses and white/violet friendly effects, while retaining the low visual weight and the exact simulation footprint. The actual native Crawler frame `b10-feel02-native/play-r1-awakening-bay-032.png` shows the issue; do not enlarge the hit rule to make a warning visible.
- Motion owner: review the authored Crawler lunge and Stalker pounce against the new 78/130-unit footprints. No body/root/collision changes were made here.
- Audio owner: family-specific wind-up/strike cues on the existing `enemy-warning` / `enemy-attack` events would help a human distinguish swarm rhythm from the one heavy swing; keep concurrent swarm voices bounded.

## What still feels wrong

The novice profile still falls off before its build matures: only 2/80 campaigns finish. Five plausible quick-profile variants all produced one clear in the same forty cases; the chosen explicit defaults also miss the full-cohort target. This static policy does not model a person learning the tells during a run. Further calibration needs observations of actual novice play.

Simulation/native agreement is also limited: Cryo seed 1729 completes in the simulation but dies in room 4 through native input. Its native weapon hit rate was 90% and early weapon DPS was comparable to simulation, which leaves movement, visibility and trajectory differences as the unresolved calibration problem. Camera-dependent visibility, movement/placement choices and the approximate observer can change the trajectory. The simulation completion percentages must not be presented as native or human completion estimates.

The late 60–69% elite frequency relies heavily on control-resistant bodies and makes elites less exceptional. Small warning rims remain faint amid friendly effects and corpses. Both need real-player/readability review before calling the overhaul human-balanced.

The profiles are explicit, deterministic assumptions, not a study of human performance. They still use a heuristic target/boon/route planner and exact legal-path queries; continuous mouse motion, panic, learning and deliberate pickup retrieval are only approximated. Native bot storyboards do not establish whether a person finds the game fair or fun. The heavy cleanup tail and faint small warning rims remain visible presentation/encounter weaknesses. No hardware performance certification is inferred from these captures or fixed-step campaigns.
