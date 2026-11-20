# BAL16 · Campaign pressure

Baseline was merged head `04dce41b`. Each cohort ran 10 seeds per rig through the render-free campaign with Standard competent or Story novice policy. Seeds were 1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, and 123456. I14 points to ENC14 and KIT13, which use the BAL13 list. Natural deaths and stalls count in the clear-rate denominator. Damage is the sum of armor and health loss recorded by the simulation's typed hit observer, including hits in failed rooms. The observer's `unknown` bucket is reported as recorded.

## Changes

### Pass 1

- Standard late recovery multiplier went from 0.60 to 0.54 to reduce breathing room from room 11 onward.
- Standard regular arrivals in rooms 15–20 went to 75% of their original spacing to overlap more threats after the maintenance rooms where several baseline runs already died.
- Story Shielding Gate and Manual-control Chamber flank beats went from four authored Stalker slots to three because each room accounted for two of five baseline Story deaths, with Stalker damage in all four.

### Pass 2

- Standard regular arrivals in rooms 15–20 went from 75% to 52% of original spacing because three rigs still exceeded the clear band after pass 1.
- Standard gained three concurrent slots in rooms 15–20 so the tighter schedule could admit overlapping threats when the original cap filled.
- Story Shielding Gate crossfire and leader beats went from six authored Crawler slots to four each because its two remaining deaths took both Crawler and Stalker damage.

The BAL13 hit ceilings and anti-chain grace, weapon catalogue, rig and ability rules, intrinsic enemy attack timings, and PLAY16 presentation and completion logic were preserved. All tuning uses deterministic encounter data and existing difficulty hooks. The checkpoint schema is unchanged.

## Campaign completions and stalls

| Phase | Mode | Breacher | Cryo | Pyro | Arc | Clear spread | Deaths | Largest room share | Stalls |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| before | standard | 8/10 | 7/10 | 9/10 | 10/10 | 3 | 6 | 33% | 0 |
| before | story | 10/10 | 8/10 | 8/10 | 9/10 | 2 | 5 | 40% | 0 |
| pass1 | standard | 9/10 | 8/10 | 9/10 | 10/10 | 2 | 4 | 25% | 0 |
| pass1 | story | 10/10 | 8/10 | 9/10 | 9/10 | 2 | 4 | 50% | 0 |
| pass2 | standard | 8/10 | 7/10 | 10/10 | 9/10 | 3 | 5 | 20% | cryo 9001 (infested-workshop) |
| pass2 | story | 9/10 | 8/10 | 9/10 | 9/10 | 1 | 5 | 40% | 0 |

## Deaths by room

| Source | before standard | before story | pass1 standard | pass1 story | pass2 standard | pass2 story |
| --- | --- | --- | --- | --- | --- | --- |
| containment-annulus | 0 | 0 | 0 | 0 | 1 | 1 |
| coolant-plant | 1 | 0 | 0 | 0 | 0 | 0 |
| diagnostic-gallery | 0 | 1 | 0 | 1 | 0 | 1 |
| infested-workshop | 0 | 0 | 0 | 0 | 1 | 0 |
| manual-control-chamber | 1 | 2 | 1 | 1 | 1 | 2 |
| safety-interlock-station | 1 | 0 | 1 | 0 | 1 | 0 |
| service-shaft-landing | 2 | 0 | 0 | 0 | 0 | 0 |
| shielding-gate | 0 | 2 | 1 | 2 | 0 | 1 |
| transmission-chamber | 1 | 0 | 1 | 0 | 1 | 0 |

## Incoming damage by source

| Source | before standard | before story | pass1 standard | pass1 story | pass2 standard | pass2 story |
| --- | --- | --- | --- | --- | --- | --- |
| brute | 2,457.4 | 3,129.4 | 2,735.9 | 3,146.7 | 2,772.5 | 2,950.0 |
| carrier | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| crawler | 12,121.3 | 13,836.6 | 11,994.4 | 13,797.3 | 11,144.6 | 13,205.9 |
| spitter | 8,640.6 | 6,199.8 | 9,485.9 | 6,065.3 | 9,193.0 | 5,912.8 |
| stalker | 7,349.9 | 8,026.3 | 7,267.5 | 7,531.6 | 6,800.0 | 7,264.9 |
| unknown | 768.0 | 144.1 | 599.6 | 169.3 | 589.0 | 143.2 |

## Stall follow-up

The baseline and pass 1 had zero stalls. Pass 2 Standard Cryo seed 9001 stopped in Infested Workshop after 45 seconds without combat progress. The terminal receipt shows three visible contacts behind cover, no clear target and one legal diagonal toward the waypoint. Blocked visible contacts could make the bot prefer standing still for spacing. The bot now uses clear visible contacts for spacing during waypoint pursuit, while retaining its existing warning and hazard scoring.

The focused replay cleared all 20 rooms. Substituting that one receipt gives Standard 8/8/10/9 clears, a spread of two and zero observed stalls. The tables retain the original full cohorts. Only the affected seed was rerun with the policy fix, so the corrected result is a focused follow-up rather than a fresh full-cohort measurement.

## Remaining misses

- Standard Pyro and Arc exceeded the upper limit of eight by two and one clears, respectively. Breacher and Cryo landed in range. Arc dropped by one clear from pass 1, while Pyro gained one.
- Every Story rig cleared at least eight runs. Shielding Gate dropped from two deaths to one, but Manual-control Chamber accounted for two of five deaths (40%), above the 30% ceiling.
- Tuning stopped after pass 2.

## Native verification

`npm ci` and both production builds passed with Vite's large-chunk advisory. The first native launch hit sandbox `listen EPERM` before starting a campaign. The foreground retry used the same requested Breacher, seed 1729, fast mode and 180-second startup timeout with localhost access and a separate receipt label. It completed all 20 rooms with zero runner errors. The runner returned status 1 for a Manual-control Chamber load over five seconds (5.022 s in the defect receipt). No automated tests were added.

[Native receipt](../../artifacts/nextgen/playtest/bal16-native-breacher/report.json) · [Focused replay](../../artifacts/nextgen/playtest/bal16-stall-recheck/cryo-9001.json)
