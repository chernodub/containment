# PLAY16 encounter and onboarding

## What the player sees

| Decision | Consequence |
| --- | --- |
| Break the pincer | The assigned flank breaches show amber countdown rings and bodies behind grilles. The objective gives the seconds remaining. Breaking the screen before 14 seconds drops the grilles with a heavy impact, withdraws the silhouettes, lights the exit approach and displays **PINCER BROKEN — flank sealed**. When the clock expires the grille rises and the scheduled flank moves through the breach. |
| Kill the leader | Escorts pause, turn and start running toward an open breach with cyan direction markers. Carrier children inherit their parent's beat. Runner occupancy and unused child reservations stop holding up the encounter. A runner kill pays half the ordinary credits, rounded down, and an escaping runner pays zero. |
| Interrupt brood | The Matron's sac collapses into a cyan body marker for the native stun window. Existing pods from that beat wither and pending pods and reserve reinforcements are canceled. |
| Read a boss opening | The Warden holds the impact direction and slumps into the obstruction for the native wall stun. Opening pods face the Matron and gain a bright, widening seam during their last 500 ms. |
| Cross a Spitter lane | A Spitter can stage on the far side of an incident blocker with an armor pickup in its lee. The line-of-sight hint clears on a blocked projectile with the marine behind that blocker. The first isolated flank in Transmission and the Service Shaft either falls or withdraws after its first committed lunge. Its screen then enters. |
| Learn the rig | Pyro shows **Q · Detonate N** and marks burning targets. Arc draws from the projected dash endpoint or the selected chain target to the next endpoint. Breacher shows **Crush 68**. Cryo keeps the existing Shatter prompt. Hints can recur in later rooms, with learning tied to a native ability receipt. |
| Try an augment | The first transformative augment queues a skippable 12-second setup at the next entry. The prompt and success receipt follow the installed augment, with 15 credits on success. A pending drill survives a route checkpoint. |
| Choose a route | The first junction offers 45 credits or an immediate health patch and a grenade. Both cards show resulting inventory. Requisition trades 70 credits for supplies and slower later arrivals. The infirmary preserves credits and repairs health while the workshop charges 180 credits for a named installed-augment upgrade and selects the alternate encounter. The protected passage preserves the standard Manual Control encounter and reward. Its alternate route adds a relay defense and names the current rig’s Overdrive as a fully charged reward on clear. The Warden cache trades an extra guardian fight for credits. |
| Start or equip | **Quick start · Cryo** names the one-action loadout. Deliberately choosing another rig puts **Equip** first in both the rendered actions and tab order. |

The ordinary completed-beat tail switches from an extended rush and retreat to a shorter pursuit and withdrawal. This changes encounter completion and the length of an already won beat. The Warden and Matron use their existing native combat clocks. The new presentation reads deterministic state.

## Verification and limitations

The baseline game is `c6a09a649f1f1ace1e3b7cc2dacca226a37dc7b5`. Dependency install, type checking and the production build passed. Vite reported its existing large-chunk advisory.

The paired comparison below uses the same bot policy and seeds with game revision `c6a09a64` as control and `4250c1d1` as PLAY16. Each mean weights the matched room observations equally. The Story control was still running at report time. This comparison precedes the final cover-placement follow-up.

| Profile | Rig | Matched runs | Shared rooms | Completions before → after | Cleanup seconds per room before → after |
| --- | --- | ---: | ---: | ---: | ---: |
| Story novice | Breacher | 10 | 199 | 9 → 10 | 8.78 → 6.94 |
| Story novice | Cryo | 10 | 159 | 6 → 7 | 9.95 → 7.62 |
| Story novice | Pyro | 10 | 191 | 6 → 8 | 8.33 → 6.79 |
| Story novice | Arc | 2 | 40 | 2 → 2 | 10.86 → 8.39 |
| Story novice | Combined | 32 | 589 | 23 → 27 | 9.09 → 7.17 (−21.1%) |
| Standard competent | Breacher | 10 | 200 | 10 → 10 | 9.22 → 7.68 |
| Standard competent | Cryo | 10 | 152 | 6 → 8 | 9.02 → 7.54 |
| Standard competent | Pyro | 10 | 193 | 9 → 9 | 7.91 → 6.17 |
| Standard competent | Arc | 10 | 184 | 8 → 9 | 9.23 → 7.87 |
| Standard competent | Combined | 40 | 729 | 33 → 36 | 8.83 → 7.30 (−17.4%) |

The complete Standard comparison stayed within two completions per rig and fell short of the 25% cleanup target. Exact after cohorts for the cover follow-up are under `artifacts/nextgen/playtest/play16-cover-{story,standard}`. The validated source and per-seed reports are retained with each cohort.

Native and 480×270 frames reviewed include the three pincer states, leader break, brood interruption, Warden opening, pod opening, all mastery hints and rig drills, the first three junctions, the protected passage, and both rig-select action orders. The first Passenger Vault lesson fixture failed to find an isolated lane through the incident. In that room the stock bay and incident overlap. The revised sampler can use their shared shoulder and found legal endpoints for Passenger Vault and Service Shaft Landing in the production geometry. The subsequent capture pass was pending at report time. Captures are staged presentation evidence. [Native and reduced frames](../../artifacts/nextgen/play16/)

The pincer silhouettes are simplified. The HUD supplies the clock and a breach direction when the gate is offscreen. The first Warden frame showed the marine under overlapping geometry. The follow-up widened the crown cutaway and stages the marine stepping out of the committed lane. The reduction shows the Arc line and first route’s supply trade, though smaller route terms and HUD objectives are easiest to read at native resolution.

The Pyro Standard campaign at seed 1729 cleared Awakening Bay and then logged one original ship interior preparation error and a loading timeout while entering Passenger Vault. The Cryo Story campaign at seed 1729 cleared fifteen rooms with zero runtime errors and reached the runner’s wall-clock limit in Swarm Junction. The Pyro retry was still progressing at report time. [Pyro receipt](../../artifacts/nextgen/playtest/play16-pyro-standard/report.json) · [Cryo receipt](../../artifacts/nextgen/playtest/play16-cryo-story/report.json)
