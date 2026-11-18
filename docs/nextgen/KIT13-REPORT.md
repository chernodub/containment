# KIT13 — Pyro and the dull buttons

## Pyro diagnosis and mechanics

BAL13 reported 7/20 Pyro completions on both Story and Standard. The fresh baseline on `f56576b8` moved Story Pyro to 12/20 and Standard to 8/20. Story's best rig cleared 13/20 and Standard's best cleared 14/20. Contact accounted for 92% of recorded damage in Pyro's fatal rooms on Story and 89% on Standard. Stalkers led fatal-room damage on Story, and Crawlers led on Standard. Its median death room was 12 on Story and 15 on Standard. These observations favor a way to interrupt and disengage from melee. Ability-level causation remains unmeasured.

- **Afterburn** leaves the existing fire line. Contact on a fire pulse applies a 45% movement slow for 650 ms, alongside ignition. Base dash travel and invulnerability are the existing 240 units and 400 ms.
- **Flashfire** consumes burning targets’ active burn in its cone for 95 immediate damage and 600 ms of stagger against ordinary enemies. Unburnt enemies take 18 damage and are shoved away. Resistant enemies use the existing shake-off rule. The bot prefers an angle with burning targets and preserves Q for cash-outs or close threats.
- **Meltdown** reduces damage taken by 40% while active. Meltdown Core retains this protection during its two-second fuse and its existing 600 ms of escape immunity after detonation. Ember Relay still supplies new ignition for follow-up cash-outs. Scorched Fan still leaves its separate ignition pool.

## Cryo, Arc and Breacher

- **Glacier** shatters on a second F press, breaking every live ice wall for 100 damage each and chill. Expiration and destruction still shatter for 45 damage. The cooldown begins at placement and continues through the recast. Twin Glacier shatters both live walls. Ice Road retains its traversal tradeoff and has no walls to shatter. The bot recasts when it sees at least two enemies around a wall.
- **Static Step** stuns the nearest visible enemy within 160 units of the arrival point, then jumps up to twice more at the same range. Each ordinary target is stunned for 750 ms. The larger window sets up Overload. Existing per-hop arc visuals follow the chain. Pilgrim Pylon and Live Wire keep their own deployment and tether rules.
- **Bulwark and Ram** reward positioning across the barricade. If Ram's sideways shove would reach a standing Bulwark within 90 units, the target takes 68 damage and a 450 ms stagger at the crush point. This also works with Siege Plow's moving Bulwark. Fault Line retains its separate Slam lane.

The catalog supplies the revised summaries, explanations and stats to rig inspection and loadout. Flashfire and Ram use the existing pooled fire and kinetic bursts. Glacier uses the existing shard burst.

## Overdrive

Combat receipts in rooms 1–4 charge Overdrive at 2.4× their previous rate. Room 5 onward retains the existing gain, and activation keeps its existing per-room limit. The competent bot can now spend a charged Overdrive on a nearby cluster of three visible enemies in the opening rooms. Its champion and emergency rules remain in effect. Across all 80 Standard simulations, the first activation moved from rooms 5–6 to room 4 for every rig.

A game built from the baseline revision wrote a modern starting-boon checkpoint and a v2 reward checkpoint. Current `continueRun()` restored both, including the v2 reward's 12.5% stored Overdrive charge. A copy of the modern checkpoint without the optional ability extension loaded with zero charge.

## Paired simulation cohorts

The baseline is `f56576b8` with its own policy. The final gameplay build is `ceeec001`. Each mode uses the same 20 BAL13 seeds per rig and a maximum of three workers. Story uses the novice policy. Standard and Veteran use the competent policy. Runs are unassisted. Results include both gameplay and bot policy changes.

Pyro cleared 17/20 on Story and 11/20 on Standard, respectively 94% and 73% of the leading rig's completions. It finished behind Breacher on Story and Arc on Standard. Arc's Story cohort fell from 13 to 9 completions. Its Standard cohort increased from 14 to 15.

Through room 9 on Story, Arc's average ability damage went from 6,938 to 6,402, dash uses from 19.9 to 18.5, damage taken from 169.35 to 165.56, and Overdrive uses from 2.15 to 3.00. Losing the old arrival damage is a plausible contributor. The dash trigger still responds to escape needs and hazards in both revisions. The paired runs also change Overdrive timing, and total ability damage provides no breakdown by individual ability. The review found no clear causal regression to fix, so the chain stun and bot policy were retained.

The interrupted Veteran cohort yielded 78 complete result files. Arc seeds 16384 and 32768 were replayed using the same bundle, gameplay and policy hashes to fill the remaining two rows.

| Mode | Rig | Completion | Median death room | Overdrives per run | Runs with ≥5 uses (Shift / Q / F / V) | First V by room 4 |
|---|---|---:|---:|---:|---|---:|
| Story | Breacher | 12/20 → 18/20 | 12 → 12 | 9.85 → 12.55 | 100%/100%/100%/90% → 100%/100%/100%/100% | 0/20 → 20/20 |
| Story | Cryo | 12/20 → 13/20 | 11 → 11 | 10.25 → 11.55 | 100%/100%/100%/75% → 100%/100%/100%/85% | 0/20 → 19/20 |
| Story | Pyro | 12/20 → 17/20 | 12 → 17 | 9.85 → 12.85 | 100%/100%/100%/70% → 100%/100%/100%/100% | 0/20 → 18/20 |
| Story | Arc | 13/20 → 9/20 | 15 → 16 | 11.25 → 11.50 | 100%/100%/100%/95% → 100%/100%/100%/100% | 0/20 → 18/20 |
| Standard | Breacher | 8/20 → 7/20 | 12 → 12 | 9.00 → 10.10 | 100%/100%/100%/80% → 100%/100%/100%/95% | 0/20 → 20/20 |
| Standard | Cryo | 13/20 → 13/20 | 11 → 11 | 11.85 → 12.45 | 100%/100%/100%/80% → 100%/100%/100%/80% | 0/20 → 20/20 |
| Standard | Pyro | 8/20 → 11/20 | 15 → 14 | 10.60 → 11.95 | 100%/100%/100%/90% → 100%/100%/100%/100% | 0/20 → 20/20 |
| Standard | Arc | 14/20 → 15/20 | 13 → 12 | 12.80 → 14.25 | 100%/100%/100%/95% → 100%/100%/100%/100% | 0/20 → 20/20 |
| Veteran | Breacher | 2/20 → 2/20 | 11 → 11 | 5.35 → 6.00 | 100%/100%/100%/45% → 100%/100%/100%/75% | 0/20 → 19/20 |
| Veteran | Cryo | 5/20 → 4/20 | 11 → 10 | 7.70 → 7.35 | 100%/100%/100%/65% → 100%/100%/100%/60% | 0/20 → 20/20 |
| Veteran | Pyro | 2/20 → 2/20 | 12 → 12 | 5.80 → 7.55 | 95%/100%/100%/70% → 100%/100%/100%/90% | 0/20 → 19/20 |
| Veteran | Arc | 0/20 → 0/20 | 12 → 12 | 5.65 → 6.25 | 100%/100%/100%/75% → 100%/100%/100%/95% | 0/20 → 20/20 |

Median death room excludes completions and stalls. The ability-use percentages use all 20 runs. Glacier's manual shatter counts as a separate F use. First V is the first recorded activation. The stalled runs reached the existing 45-second no-progress cutoff and count as non-completions.

## Production verification

`npm ci` and `npm run build` passed. The build emitted Vite's large-chunk warning.

One foreground native campaign per rig ran serially on Standard at seed 1729. Every run first used Overdrive in room 4 and recorded zero runtime errors.

| Rig | Outcome | Rooms cleared | Runner diagnostic |
|---|---|---:|---|
| Breacher | Complete | 20 | — |
| Cryo | Died in room 12 | 11 | — |
| Pyro | Complete | 20 | Manual Control Chamber load took 5.09 s |
| Arc | Complete | 20 | — |

Pyro's loading diagnostic made the runner exit 1. The run reached the normal campaign ending. Captures contain 12 frames covering cast and effect for Afterburn, Flashfire, Meltdown, Glacier, Static Step and Ram against Bulwark. All were inspected at 1920×1080 and downsampled to 480×270. Flashfire's damage registers on the first frame of its instant cast, with the later frame showing the full burst.

Merged `nextgen` at `e73703cb` and rebuilt successfully at merge commit `c96b2461`. Campaigns and captures use the pre-merge KIT13 production build at `ceeec001`. Incoming production changes were in the room art and capture tooling. Raw campaign receipts, captures, paired simulation results, checkpoint observations and build logs are under `artifacts/nextgen/kit13-final/`.

The merged build's Pyro benchmark completed four trials across Safety Interlock Station and Coolant Plant on High and Low. All four recorded zero combat shader compilations. Peak draws ranged from 131 to 280. Frame timings fluctuated sharply under host load, with a 2.45-second maximum in Coolant Plant on High.

## Integration requests

Use the existing Glacier HUD slot to surface the second F press while an ice wall is active. This would let players discover the cash-out during a fight as well as in the catalog.
