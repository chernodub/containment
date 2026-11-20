# BAL15 · Combined campaign balance

**Selected pass 2.** Its completed Standard cohort tied pass 1 in total distance from the per-rig bands, narrowed the clear spread from four to three, and eliminated the observed Standard Freight Hold stall. Pass 1 had the stronger Story results. Pass 3 had already exceeded the Standard cap on Breacher and Cryo when the lead stopped the remaining long batches. The retained pass keeps Standard’s added pressure from room 11 onward and preserves the teaching rooms, damage ceilings, weapon catalogue, rig rules and save format.

## Completion before and after each pass

Base `6d6919f9` merges ROOM14, RUN15 and WEAPONS15. Each cohort uses the I14 seeds with Novice on Story, Competent on Standard and Expert on Veteran. Entries are clears / completed attempts in Breacher, Cryo, Pyro, Arc order. A dash means zero attempts finished.

| Phase | Story | Standard | Veteran | Stalls in primary cohorts |
| --- | --- | --- | --- | --- |
| Merged | 18/20, 14/20, 15/20, 19/20 | 18/20, 16/20, 19/20, 16/20 | 20/20, 20/20, 19/20, 20/20 | 0 |
| Pass 1 | 19/20, 18/20, 18/20, 17/20 | 15/20, 14/20, 18/20, 17/20 | 19/20, 20/20, 20/20, 19/20 | 1 Standard, Cryo 8675309, Freight Hold |
| Pass 2 | 16/20, 15/20, 19/20, 16/20 | 17/20, 15/20, 18/20, 15/20 | 19/20, 19/20, 14/14, — | 1 Veteran, Breacher 42, Armory |
| Pass 3 | 17/20, 18/20, 7/8, — | 19/20, 16/20, 1/1, — | 15/20, 5/5, —, — | 0 observed in partial cohorts |

| Phase | Story largest share of deaths | Story damage, rooms 11–12 → 13–14 | Standard spread | Standard rockets / entered room |
| --- | --- | --- | --- | --- |
| Merged | 35.7%, Manual-Control | 42.4 → 60.8 (+43.6%) | 3 | 0.69 |
| Pass 1 | 25.0%, Shielding Gate | 40.2 → 61.7 (+53.5%) | 4 | 1.32 |
| Pass 2 | 35.7%, Manual-Control | 42.7 → 62.4 (+46.2%) | 3 | 1.30 |
| Pass 3, partial | 50.0%, Manual-Control | 48.2 → 70.5 (+46.3%) | Unmeasured | 1.33 |

Detailed local tables contain death counts by room, damage by room and incoming source, weapon shots, direct damage, kills and equipped time, and per-room condition and opening comparisons. Variant comparisons use the other openings in the same room and can reflect route or condition differences. Damage means include entered rooms and time means use clears. [Merged](../../artifacts/nextgen/bal15/before-details.md) · [Pass 1](../../artifacts/nextgen/bal15/pass1-details.md) · [Pass 2](../../artifacts/nextgen/bal15/pass2-details.md) · [Pass 3](../../artifacts/nextgen/bal15/pass3-details.md)

## Changes and reasons

### Stall fix and pass 1

- Award the firing-lane movement bonus only while the bot has an engageable target, so waiting in a lane no longer overrides moving toward an off-screen contact.
- Raise Standard’s late melee admissions from four to five to sustain pressure against competent kiting.
- Raise Veteran’s late melee admissions from three to five and lower its late rest multiplier from 0.60 to 0.50 to increase pressure against Expert.
- Shorten Veteran’s regular late arrivals to 70% of normal spacing to overlap threats that Expert previously cleared in sequence.
- Trim the Story Manual-Control Warden opener from five to three authored Crawler escort slots because that opener accounted for five of 14 baseline Story deaths.
- Allow safe rockets against any pair of clear contacts within 110 units, in addition to pods and active brood, because flanker-only pairing left rockets underused.

### Pass 2

- Use the rifle’s projectile radius for bot firing lanes so a clear center ray around cover cannot keep the bot shooting into a wall.
- Shorten movement probes near a waypoint while pursuing a contact without a clear shot, so a long probe cannot rule out a legal approach around a corner.
- Lower Standard’s late rest multiplier from 0.65 to 0.60 after Pyro and Arc remained above band in pass 1.
- Raise Veteran’s late concurrent cap by three, tighten regular arrivals to 58% spacing, and interleave a Spitter every sixth Crawler slot to overlap ranged and melee pressure.

### Pass 3, measured in part and reverted

- Restrict projectile-radius checks to stationary blocked-lane recovery after the broad observer change altered Story results.
- Ignore blocked contacts in pursuit spacing when there is no firing target, allowing movement toward the waypoint around Armory cover.
- Restore Standard’s 0.65 late rest multiplier and tighten regular arrivals only from room 15 onward to move added pressure away from earlier Cryo deaths.
- Raise Veteran’s late cap by two more, use 45% regular spacing and replace every fourth Crawler slot with a Spitter because Expert still cleared too often.
- Reduce Veteran pickup efficiency from 0.45 to 0.30 so accumulated damage is harder to recover.

## Stalls and remaining misses

The historical I14 Crew Checkpoint and Freight Hold stalls reproduced with off-screen clear targets. Their exact seeds cleared those rooms on merged head. A merged condition-off run reproduced the Crew failure, and the target-gated bonus cleared both historical probes and that merged probe. Pass 1 uncovered a projectile clipping a cover edge and a separate movement probe overshooting a near corner in Freight. Both focused probes cleared with the pass 2 changes. Pass 2 still stalled in Veteran Armory when a visible blocked contact overrode waypoint pursuit. A focused pass 3 spacing probe cleared Armory, but pass 3’s full cohorts are incomplete. [Stall evidence](../../artifacts/nextgen/bal15/stall-reproduction.md)

- **Story:** Cryo is one clear below target. Manual-Control accounts for five of 14 deaths, above the 25% limit. The room 13–14 damage step meets the 60% limit.
- **Standard:** Breacher and Pyro exceed the band by two and three clears. Cryo, Arc, the three-clear spread, zero stalls in the 80-attempt cohort and the 1.30 rocket rate meet target.
- **Veteran:** The selected sample already exceeds the upper target on Breacher, Cryo and Pyro. Six Pyro and all 20 Arc attempts remain unmeasured on pass 2. The Armory stall remains open on the selected configuration.
- **Conditions:** All six pooled paired damage and time comparisons meet ±20% in the complete Story and Standard cohorts. Individual room-condition cells still exceed the band. Partial Veteran Overcharged Conduits averaged 31.5% more damage than its matched controls. Comparisons pair seed, rig and room against condition-off runs. Damage excludes stalled pairs, time requires both runs to clear, and route choices can diverge. [Condition tables for every pass](../../artifacts/nextgen/bal15/conditions.md)
- **Variants:** The ±20% damage/time and 2× death-rate targets were not met across all openings. For example, pass 2 Story’s Infested Workshop rush opener had one death in 30 entries, 2.53× the room death rate, and several low-damage opening samples had wide relative swings. The detailed tables include sample sizes and room-relative variant death rates.
- **Native campaigns:** The four seed-1729 desktop campaigns and storyboard review were not run under the lead’s stop decision. Native runtime errors and cover or condition exploitation remain unverified.

Setup and final production builds passed with Vite’s large-chunk warning. The first pass 2 launch hit a simulation adapter import error and yielded zero receipts. The corrected adapter cleared the focused Freight probe and the cohorts were restarted from the corrected snapshot. The remaining long runs were stopped at the lead’s direction. No automated tests were added.
