# PLAY16 encounter and onboarding

## What the player sees

| Decision | Consequence |
| --- | --- |
| Break the pincer | The assigned flank breaches show amber countdown rings and bodies behind grilles. The objective gives the seconds remaining. Breaking the screen before 14 seconds drops the grilles with a heavy impact, withdraws the silhouettes, lights the exit approach and displays **PINCER BROKEN — flank sealed**. When the clock expires the grille rises and the scheduled flank moves through the breach. |
| Kill the leader | Escorts pause, turn and start running toward an open breach with cyan direction markers. Carrier children inherit their parent's beat. Runner occupancy and unused child reservations stop holding up the encounter. A runner kill pays half the ordinary credits, rounded down, and an escaping runner pays zero. |
| Interrupt brood | The Matron's sac collapses into a cyan body marker for the native stun window. Existing pods from that beat wither and pending pods and reserve reinforcements are canceled. |
| Read a boss opening | The Warden holds the impact direction and slumps into the obstruction for the native wall stun. Opening pods face the Matron and gain a bright, widening seam during their last 500 ms. |
| Cross a Spitter lane | A Spitter can stage on the far side of an incident blocker with an armor pickup in its lee. The line-of-sight hint clears on a blocked projectile with the marine behind that blocker. The first isolated flank in Transmission and the Service Shaft finishes before its associated screen enters. |
| Learn the rig | Pyro shows **Q · Detonate N** and marks burning targets. Arc draws from the projected dash endpoint or the selected chain target to the next endpoint. Breacher shows **Crush 68**. Cryo keeps the existing Shatter prompt. Hints can recur in later rooms, with learning tied to a native ability receipt. |
| Try an augment | The first transformative augment queues a skippable 12-second setup at the next entry. The prompt and success receipt follow the installed augment, with 15 credits on success. A pending drill survives a route checkpoint. |
| Choose a route | The first junction offers 45 credits or an immediate health patch and a grenade. Both cards show resulting inventory. Requisition trades 70 credits for supplies and slower later arrivals. The infirmary preserves credits and repairs health while the workshop charges 180 credits for a named installed-augment upgrade and selects the alternate encounter. The Warden and capacitor detours retain distinct additional fights and clear rewards. |
| Start or equip | **Quick start · Cryo** names the one-action loadout. Deliberately choosing another rig puts **Equip** first in both the rendered actions and tab order. |

The ordinary completed-beat tail switches from an extended rush and retreat to a shorter pursuit and withdrawal. This changes encounter completion and the length of an already won beat. The Warden and Matron use their existing native combat clocks. The new presentation reads deterministic state and never adjudicates a hit.

## Verification and limitations

The baseline game is `c6a09a649f1f1ace1e3b7cc2dacca226a37dc7b5`. Dependency install, type checking and the production build passed. Vite reported its existing large-chunk advisory.

Two early matched Story novice Breacher simulations were available during tuning. These are a partial comparison from the preceding implementation pass. The cleanup mean uses shared room observations for each seed.

| Seed | Shared rooms | Baseline cleanup per room | Early PLAY16 cleanup per room | Baseline → early PLAY16 |
| --- | ---: | ---: | ---: | --- |
| 2718 | 19 | 9.86 s | 8.08 s | 19 clears → 20 clears |
| 31415 | 20 | 8.28 s | 7.63 s | 20 clears → 20 clears |
| Combined | 39 | 9.05 s | 7.85 s | 13.2% less cleanup |

The full four-rig, ten-seed acceptance comparison is pending. The early pairs do not establish the 25% cleanup target or the completion tolerance. The final tail shortens the rush and withdrawal further. Local simulation receipts live under `artifacts/nextgen/playtest/play16-*`.

The staged and sealed flank, rig screen in both action orders, the three junctions, all four mastery prompts, an opening pod, and the Breacher and Cryo drill setups were inspected at native resolution and 480×270. The initial late-flank capture reported a WebGL error. Three other initial captures lost title assets while the shared distribution was rebuilding. A follow-up pass captured the four mastery prompts and the opening pod. Several consequence fixtures still needed correction. The revised fixtures use the opt-in simulation clock and a separate production distribution. Staged frames are evidence of presentation and do not measure learning or difficulty.

The visible pincer tradeoff depends on whether the breach is in frame. The HUD supplies the clock when it is offscreen. The staged bodies are simplified. The Warden pose follows the impact angle, but the crown has no dedicated marine-overlap cutaway and its wall placement still needs scene review. Spitter placement depends on a walkable lee and the room's available ranged arrivals. The later junction can still feel more or less dangerous according to its seed, condition and the player's build.
