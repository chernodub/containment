# C10 — melee readability

Branch: `t3/melee-attack-readability`. Runtime implementation: `fe7735c4cbcf735460c3fb311515dfa84fa37057`; subsequent tooling/report commit records final evidence. Gallery: [C10 review](../../artifacts/nextgen/c10-final/review.html). No push or PR.

## Changes

The live hostile path is `AttackEffects`, rather than the public `TelegraphBatch` demo or contact/supply `GroundIndicatorMaterial`. Its melee shader now draws a derivative-sized danger edge nested inside a dark keyline, with both clipped inside the exact simulation sector/capsule. Edge contrast no longer inherits the old Crawler opacity of .12. A thin timing front travels through a quiet fill; family weight remains in the interior, so Brute/Carrier marks carry more mass without turning swarms into red floor paint. The existing torso mask and after-post priority pass remain. Native strike snapshots retain the exact mark for a brief decaying flash, scaled by `flashIntensity` and the existing reduced-motion setting. The old common pale slash/Spitter spray is skipped for melee; ranged presentation remains on its existing path. No warning geometry or hit rule grows.

Blender regenerated all five animation-only family GLBs. Strike contact is now the first authored strike pose, rather than a later fraction of the clip; native strike entry has no crossfade delay. Wind-up continues to sample and hold on the actual normalized simulation phase. Crawler and Stalker body travel is range minus the retained body radius, along the locked native attack direction; the obsolete Stalker 2.2-world-unit cap and additional baked forward displacement are removed. Translation is presentation-only beneath the unchanged actor root. The return follows the full native recovery, including elite durations, and the authored asymmetric recovery stays loaded until the final settle. Recovery pose evaluation takes priority over a long hit clip. `DepthRenderer.ts` has one delimited culling-margin adjustment for the larger Crawler/Stalker presentation travel. Simulation, colliders, damage, attack values, saves, UI, rooms, lighting and bot policy are unchanged.

The motion strip runner had stale pre-B10 hardcoded durations/ranges. It now imports `MELEE_ATTACKS` and the two elite phase scales from the native catalog, passes them into its presentation replay, and records them in its manifest. This is capture-tool correction, not a new test or assertion gate.

Enemy warning/attack events now select original synthesized signatures: dry rising chitter/ticks and snap for Crawlers; rising breath/hiss and crack for Stalkers; low inhaling growl and sub thump for Brutes; fast wet throat/bite for Spitters; slower pulsing cavity/gurgle for Carriers. Warning playback can follow the event's actual duration. Crawler ordinary/elite calls share warning/attack rate limits and at most three simultaneous melee voices. Death cues retain their previous layer; the common recorded impact no longer masks melee family identity. Existing enemy bus, distance attenuation, positional pan, hostile-time-scale treatment, volume, mute, pause and global voice admission own playback. No audio assets, dependencies or license changes were added. Retained rig/model and animation CC BY-SA notices remain intact.

## Visual verification

`npm ci --no-audit --no-fund` completed. `npm run build` passed (`tsc --noEmit` and Vite production build; ordinary chunk-size advisory only). No tests were added or run. Production capture, motion and audio browsers were serialized; no computer-use tools were used.

The final main pass contains **240 native 1920×1080 PNGs**, 30 per scenario, zero capture failures and zero browser errors. Each of the five native-family bursts contains actual wind-up, strike and recovery snapshots. Main manifests retain exact shapes, phase clocks, camera/HUD diagnostics and application asset hashes. The main capture started before the runtime commit, using the final built runtime; the asset inventory identifies its exact bundle. Superseded successful intermediate PNGs were overwritten by the corrected final pass.

| Family | Native frame numbers: wind-up / strike / recovery |
|---|---|
| Crawler | `m10-melee-crawler-awakening-bay-04 / 08 / 12.png` |
| Stalker | `m10-melee-stalker-awakening-bay-06 / 11 / 18.png` |
| Brute | `m10-melee-brute-awakening-bay-08 / 17 / 23.png` |
| Spitter | `m10-melee-spitter-awakening-bay-04 / 08 / 13.png` |
| Carrier | `m10-melee-carrier-awakening-bay-08 / 16 / 22.png` |

Paths are relative to `artifacts/nextgen/c10-final/`. All five family native strips in `motion/*-attack.png` were opened, as were native family frames and native-pixel three-phase crops. Exact 480×270 frames in `review480/` and their phase sheets were opened and inspected. `review-selection.json` retains the crop coordinates and selected source frames; native crops preserve pixels but can trim surrounding anatomy, so full native frames remain authoritative. Motion strips are frozen-simulation presentation replays, not gameplay or timing benchmarks.

The supplemental **90-frame** pass in `contrast-swarm/` has zero failures/errors. It adds twenty actual Crawlers on legal visible floor (all twenty visible throughout the burst), and Crew Checkpoint / Relay Racks with a production corpse and white/violet Overload presentation replay. Native `*-03.png` frames and all three 480 phase/sample sheets were opened. Corpses and friendly effects are explicitly presentation fixtures; hostile attack timing remains native. The main mixed twenty-enemy crowd remains alongside this all-Crawler check. Supplemental manifests retain their original `c10-extras` label after relocation under the final directory.

Observed: the pale floor retains a dark perimeter around the small edge; the dark floor retains its bright rim; white/violet feedback remains separate from that rim. The swarm leaves most floor unpainted, with separated active wedges rather than twenty opaque stamps. Stalker travel reaches through its long capsule and then returns visibly; Brute/Carrier raised poses and larger arcs announce the heavier event. Captures are staged art evidence and do not establish human dodge success.

## Audio measurement

`node scripts/nextgen/audio-evidence.mjs --out=artifacts/nextgen/c10-final/audio --melee-only` rendered 38 WAV/PNG pairs, including all twenty ordinary/elite family warning/strike recipes, existing layered examples, the swarm stress mix and dense director bus stems. Zero measurement failures or browser errors. Metrics below are actual stereo production-mixer output at 24 kHz, full master/effects for individual cues, including internal .85 headroom and limiting. RMS includes the tool's rendered tail.

| Ordinary family | Warning peak / RMS | Strike peak / RMS | Warning / strike centroid Hz |
|---|---:|---:|---:|
| Crawler | .2047 / .0331 | .0873 / .0104 | 6758 / 1454 |
| Stalker | .2386 / .0568 | .0813 / .0092 | 5223 / 3072 |
| Brute | .2435 / .0782 | .1620 / .0441 | 194 / 74 |
| Spitter | .1510 / .0534 | .0864 / .0208 | 375 / 585 |
| Carrier | .1745 / .0585 | .1616 / .0330 | 154 / 583 |

The twenty-event swarm/heavy replay peaked at **.5821**, RMS **.0649**, total voice high-water **5**, maximum retained Crawler voices **3**. A pause rejected the attempted cue (admitted count stayed 18; retiring voices retain their click-free fade); a muted heavy event admitted **0** new voices. The ordinary dense director fight peaked at **.6559**, RMS **.1212**, high-water **39**, global mixer rejections **0**; enemy stem peak **.3056**, RMS **.0359**. These are unquantized output measurements; files are 16-bit PCM. Full ordinary/elite numbers, spectra, source boundaries and lifecycle samples are in `audio/inventory.json`; `audio/index.html` supplies auditions. No acoustic listening or eyes-closed human identification success is claimed.

## Campaign and benchmark

`npm run playtest -- --rig=breacher --seed=1729 --label=c10-breacher-1729` finished normally with **0 errors and 0 defects**, unassisted, ordinary competent policy, every fixed tick rendered. It cleared **10 rooms** and died naturally in room 11, **Diagnostic Gallery**, at 373.93 simulation seconds / 561.18 wall seconds. This is one completed attempt, not a twenty-room victory or a completion-rate estimate. Raw report, input trace, screenshots and source archive are preserved in [campaign/](../../artifacts/nextgen/c10-final/campaign/index.html); no retry or bot change was used. Its recorded runtime head is `fe7735c4cbcf735460c3fb311515dfa84fa37057`.

A final `npm run build` passed after verification tooling edits; all 28 generated application assets remain byte-identical to the captured runtime. The ordinary benchmark ran `npm run bench -- --label=c10-bench --rooms=awakening-bay --rigs=breacher --tiers=high,low --repeat=1 --seconds=10 --no-build --dist-source-sha=fe7735c`. Both ten-second trials had zero errors, zero new combat shader programs and passing draw/program/adaptive-scale resource budgets. Raw [benchmark.json](../../artifacts/nextgen/c10-final/bench/benchmark.json) preserves all observations.

| Tier | CPU submission p50 / p95 ms | Frame interval p50 / p95 ms | Peak draws | Adaptive scale min / max | New combat programs |
|---|---:|---:|---:|---:|---:|
| High | 12.20 / 33.90 | 16.70 / 41.60 | 266 | .825 / 1 | 0 |
| Low | 9.00 / 36.30 | 16.70 / 33.30 | 155 | 1 / 1 | 0 |

Nominal CPU/frame timing flags miss their budgets, despite the runner's empty resource `budgetFailures` list. High also includes a 907.7 ms maximum interval; nothing is discarded. These shared-host, adaptive-scale, single-trial measurements have no before cohort and do not establish a C10 speedup or hardware-FPS certification. Campaign fixed-step timings are separate CPU submission evidence.

## Remaining weaknesses

Spitter melee remains the least legible: its small footprint falls largely beneath the marine and enemy, so torso protection removes much of its timing front. The exposed rim reads better, but enlarging the footprint would misrepresent its attack. Crawler/Stalker contact is deliberately abrupt at the authoritative hit instant; the first strike can look like a fast body snap rather than a smoothly observed flight in a 50 ms capture. Recovery reads best from the asymmetric limbs; Carrier's large shell makes its late recovery subtler than the Brute's. Bodies intentionally hide some ground-mark segments. Short transient strikes can be masked by sustained weapon fire; headphone listening and actual human reaction review remain useful acceptance work. No balance, hardware-FPS or novice-success claim follows from these fixtures.
