# SCALE17 · Creature size and attack readability

## Actor measurements

The Crew Checkpoint rank fixtures project visible skinned vertices through the gameplay camera at 1920×1080. Heights are pose- and camera-dependent. Regular and elite values appear in that order. Speed is the observed Crew Checkpoint base speed in simulation units per second, with the catalog speed in parentheses. Each family uses the same speed at both ranks and on both builds. Strike dimensions are native units, measured from the strike origin.

| Family | Height before → after (px) | Marine before → after (px) | Radius before → after | Strike shape | Reach before → after | Speed |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| Crawler | 71 / 92 → 89 / 135 | 147 → 147 | 14 / 14 → 17.50 / 22.75 | Arc, 50° half-angle | 78 / 78 → 97.50 / 126.75 | 152.8 (150) |
| Stalker | 90 / 110 → 108 / 154 | 145 → 145 | 17 / 17 → 20.40 / 26.52 | Line, width 24 / 24 → 28.80 / 37.44 | 130 / 130 → 156 / 202.80 | 127.3 (125) |
| Spitter | 106 / 146 → 134 / 215 | 146 → 146 | 18 / 18 → 22.50 / 29.25 | Cone, 45° half-angle | 46 / 46 → 57.50 / 74.75 | 79.4 (78) |
| Carrier | 153 / 183 → 169 / 237 | 145 → 145 | 24 / 24 → 26.40 / 34.32 | Cone, 50° half-angle | 70 / 70 → 77 / 100.10 | 71.3 (70) |
| Brute | 224 / 240 → 217 / 295 | 142 → 138 | 33 / 33 → 33 / 42.90 | Arc, 65° half-angle | 92 / 92 → 92 / 119.60 | 61.1 (60) |

The ordinary Brute retains its RIG16 scale. Its different projected height comes from the settled fixture camera. Spitter and Carrier rows give their close strikes. The pooled rank shapes keep their authored geometry. Each elite draws a pulsing pale-gold ring at deck level. The existing creature shader dims pale-atlas regions in calm poses and restores eligible strike surfaces using native phase progress.

Radius feeds body separation, navigation clearance, spawn clearance and contact. Enlarged bodies advance the shared melee-warning and strike origin by their added radius. Regular Brutes retain the existing five-unit advance. Checkpoint serialization is unchanged.

[Baseline measurements](../../artifacts/nextgen/scale17-measure-before/manifest.json) · [SCALE17 measurements](../../artifacts/nextgen/scale17-after/manifest.json)

## Encounter counts and placement

Groups of at least four scale their scheduled count by inverse squared family scale, rounded to the nearest whole contact. Each surviving slot receives the ratio of original count to revised count as a health multiplier. This preserves nominal group health before elite and Veteran replacement variation. Paired firing lanes and isolated lessons retain their slots. The table counts planned contacts on the seed-1729 route without optional branch reinforcements.

| Room | Standard before → after | Story before → after |
| --- | ---: | ---: |
| awakening-bay | 4 → 4 | 4 → 4 |
| passenger-vault | 6 → 6 | 6 → 6 |
| residential-gallery | 7 → 7 | 7 → 7 |
| communal-atrium | 9 → 9 | 9 → 9 |
| crew-checkpoint | 23 → 19 | 19 → 15 |
| armory | 26 → 19 | 22 → 16 |
| freight-hold | 31 → 22 | 25 → 18 |
| breached-loading-bay | 30 → 22 | 25 → 19 |
| relay-racks | 27 → 20 | 21 → 16 |
| transmission-chamber | 51 → 39 | 41 → 31 |
| diagnostic-gallery | 56 → 39 | 33 → 23 |
| safety-interlock-station | 56 → 39 | 40 → 28 |
| coolant-plant | 71 → 47 | 42 → 28 |
| service-shaft-landing | 67 → 46 | 44 → 30 |
| infested-workshop | 64 → 44 | 58 → 40 |
| swarm-junction | 74 → 50 | 65 → 44 |
| shielding-gate | 62 → 43 | 43 → 31 |
| containment-annulus | 65 → 43 | 57 → 38 |
| manual-control-chamber | 59 → 41 | 50 → 35 |
| overload-floor | 63 → 43 | 55 → 37 |

The Diagnostic Gallery gurney, supporting solid, meal and worklight move together. The affected opening rose from 96 to 140 simulation units. The wider-radius ROOM14 sweep checks authored openings and native role-specific destinations, including legal offsets inward of breach markers.

[Placement audit](../../artifacts/nextgen/scale17/placements-final.log)

## Navigation and ability feel

The native Breacher Standard storyboard run uses seed 1729 and records Residential Gallery, Communal Atrium and Crew Checkpoint. It cleared all five requested rooms with zero errors. In the reviewed samples, armored bodies skirt the Residential debris, the Carrier crosses the Atrium lanes, and mixed ranks emerge through Crew Checkpoint and move around deployed cover. These samples cover those encounters and do not establish a campaign-wide absence of stalls.

The first launch hit the runner's 20-second listener default before the debug hook loaded. The retry applies the requested startup timeout after registering the listeners and resumes the ordinary 20-second action timeout after startup.

A controlled simulation comparison used the same unobstructed Awakening Bay target positions. Seismic Slam hit the Stalker, Carrier and Spitter for 270 total damage in each build, with identical sampled launch endpoints. Ram passed through one Stalker in each build, moved the marine 150 units, dealt 18 damage and displaced the target 40.7 units at the 200 ms sample. These are same-position comparisons apart from authored encounter counts.

[Native receipt](../../artifacts/nextgen/playtest/scale17-navigation-retry/report.json) · [Residential Gallery](../../artifacts/nextgen/scale17/storyboard-residential-gallery.png) · [Communal Atrium](../../artifacts/nextgen/scale17/storyboard-communal-atrium.png) · [Crew Checkpoint](../../artifacts/nextgen/scale17/storyboard-crew-checkpoint.png) · [Ability observations](../../artifacts/nextgen/scale17/ability-observations.ndjson)


## Balance

Each cohort uses the same workspace head and policy with the first six BAL16 seeds (1729, 2718, 31415, 42, 137 and 8675309). The baseline reads game sources at `9bf77b89`. The first SCALE17 pass rounded area-adjusted counts to the nearest integer. The corrective trial rounded up, retaining a few smaller contacts and spreading the same nominal health over more bodies. No difficulty or ability settings changed.

| Difficulty and profile | Build | Breacher | Cryo | Pyro | Arc |
| --- | --- | ---: | ---: | ---: | ---: |
| Standard competent | Baseline | 4/6 | 3/6 | 5/6 | 6/6 |
| Standard competent | Initial SCALE17 | 3/6 | 0/6 | 4/6 | 2/6 |
| Standard competent | Round-up trial | 2/6 | 1/6 | 3/6 | 1/6 |
| Story novice | Baseline | 6/6 | 4/6 | 6/6 | 6/6 |
| Story novice | Initial SCALE17 | 3/6 | 2/6 | 6/6 | 3/6 |
| Story novice | Round-up trial | 5/6 | 1/6 | 4/6 | 3/6 |

The initial split remains in the shipped change. Both splits made the six-seed sample harder. The round-up trial improved some results, but total completions fell from 23 to 20 across both modes, and the largest per-rig loss increased from four to five. The initial split misses the ±2 target for Standard Cryo and Arc and Story Breacher and Arc. The six cohorts recorded natural deaths and completions without simulation stalls. The stream stops tuning after this one trial.

[Standard baseline](../../artifacts/nextgen/playtest/scale17-six-before-standard/summary.json) · [Standard initial](../../artifacts/nextgen/playtest/scale17-six-after-standard/summary.json) · [Standard trial](../../artifacts/nextgen/playtest/scale17-six-tuned-standard/summary.json) · [Story baseline](../../artifacts/nextgen/playtest/scale17-six-before-story/summary.json) · [Story initial](../../artifacts/nextgen/playtest/scale17-six-after-story/summary.json) · [Story trial](../../artifacts/nextgen/playtest/scale17-six-tuned-story/summary.json)
