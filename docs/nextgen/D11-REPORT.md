# D11 — difficulty modes and contextual onboarding

Branch: `t3/difficulty-onboarding-modes`. Completion pass merged `nextgen` at `2672ffa3`, including the corrected lockfile and K11/K12 creature/marine assets. Veteran ships enabled; the temporary disable flag is removed. No push or PR.

## Behaviour

A single deterministic descriptor owns difficulty tuning. Incoming damage, enemy attack rest/recovery, simultaneous attack admission, wave size/elites, pickup values and Overdrive gain scale independently of player ability rules. Late-depth overrides begin at depth ten. Story and Standard use neutral late overrides. Simulation stays render-free and seeded.

The first room removes two opening enemies, spaces its first four arrivals at 1600 ms and lengthens only those four wind-ups by 1.5. Later arrivals retain native spacing. This replaced an overly generous whole-room reduction; Standard's narrowed-opener pilot returned to 42.5%.

The three keyboard-reachable run-start cards remember a UI preference, with Standard as default. Pause shows the active mode and offers confirmed easier changes only. Live modifiers change immediately; scheduled wave size applies next room. Difficulty is stored in the checkpoint. An actual pre-D11 checkpoint without the field continued through rig/boon selection into a fully prepared Standard room and re-saved as Standard. Missing and corrupt mode values default to Standard. Native pause Standard→Story persisted Story; paused and active upgrade attempts were rejected. These actions were exercised at both desktop viewport sizes, with zero page errors (`ui/verification.log`). UI preferences remain separate from run saves.

One-line hints teach WASD movement, mouse aim, LMB/Space fire, R reload, 1–5 weapon switch, Shift “Step out or dash” at the first warning, Q tactical, F power, V when charged, E medkit when hurt and G grenade against a group. First use retires each hint. Eligibility covers the first three rooms for up to fifteen minutes, with charged Overdrive eligible later. Hints off and completed-run preferences suppress prompts. HUD-safe placement excludes projected marine/enemy/warning bounds. A brief static SVG outline follows the actual first melee footprint, masks actor regions and retires on cancellation/strike/death; it has no hit authority and no animated flash under reduced motion.

The death debrief names the fatal family and attack and shows the room's three largest damage sources. It uses actual damage receipts and a full-room ledger rather than inferring a nearby attacker. Catalog family names remain authoritative; K11 anatomy supplies scythe swipe/lunge, cleaver sweep, mortar-mouth bite and brood-claw slam labels.

Both native and simulation playtest CLIs accept `--difficulty=story|standard|veteran`. Batch reports, aggregation and comparisons preserve mode identity. Human controller profiles were not altered. Simulation workers stay at three or fewer; browsers are serialized. No tests, runners, assertion gates or dependencies were added.

## Balance

Veteran is enabled under the requested fallback rule. Six resumed iterations did not meet both completion bands. Selected candidate 8 was closest to competent 20% while retaining expert ≥50%: its pilots were 8/40 competent (20%) and 38/40 expert (95%). **The expert 50–80% target was not achieved.**

Mode levers (multipliers relative to Standard):

- Story: damage .75, rest/recovery 1.15, two light attack slots, waves .9, elite frequency .7, pickup values 1.15 and Overdrive gain 1.15.
- Standard: all base multipliers 1, two light slots, original 200 ms melee start stagger and three total engagement berths.
- Veteran: damage 1.3, rest/recovery 1.4, two light slots, waves .8, elite frequency 1.2, pickup values 1.15 and Overdrive gain 1. At depth 10+, rest multiplies by .6 (effective .84), light capacity doubles to 4, total berths rise to 4 and melee start spacing halves to 100 ms. Other late overrides are neutral. The gentler pacing before this late ramp is intentional in the selected candidate.

Paired pilot competent/expert percentages for candidates 4–9 were 17.5/100, 12.5/97.5, 7.5/95, 5/92.5, 20/95 and 10/92.5, respectively. Each percentage represents a completed 40-attempt cohort. These pilots are not pooled with confirmations.

| Mode / profile | Clears | Completion | B / C / P / A clears (each /20) | Result |
|---|---:|---:|---|---|
| Story / novice | 38/80 | 47.5% | 9 / 16 / 4 / 9 | 35–60% met |
| Standard / competent | 35/80 | 43.75% | 6 / 12 / 4 / 13 | B10 +1 clear (+1.25 pp) |
| Veteran / competent | 20/80 | 25% | 7 / 5 / 2 / 6 | 10–25% met |
| Veteran / expert | 77/80 | 96.25% | 19 / 19 / 19 / 20 | 50–80% missed; authorized fallback |

All 320 confirmation attempts finished normally, with no simulation errors or censored attempts. Standard differs from the prior 34/80 by one clear on the same published seeds. Veteran expert finished 77/80: the upper band remains unmet, while the authorized fallback expert ≥50% condition holds. No workers or queues remain active.

Six resumed candidate iterations were allowed. Complete paired quick cohorts use ten B10 seeds across all four rigs. The sequence tested base tuning, late wave attrition, late elite/charge pressure, actual late attack concurrency, shorter late start staggering and late enemy movement. `balance/` retains the measured outcomes and source snapshots; rejected intermediate payloads are removed after summarizing the sequence. Candidate numbers 4–9 continue the initial pass's numbering.

Confirmations use all four rigs and the exact B10 twenty-seed set: 1729,2718,31415,42,137,8675309,2026,9001,65537,123456,17,23,101,256,512,1024,4096,8192,16384,32768. Natural deaths remain in denominators. Simulation evidence omits DOM/GPU/audio and is not a human learning or hardware performance measurement. Shared-host CPU contention greatly increased wall time; other rendering jobs were left untouched.

## Native campaigns and visual review

All native campaigns use ordinary rendered Arc seed 1729 inputs, without assistance or fixed-step fast rendering. New-model Standard finished exit 0 after 13 room clears and natural death, zero errors. Story finished all 20 rooms, exit 0, zero errors. Veteran finished exit 0 after 10 room clears and natural death, zero errors. Supported 7200-second wall ceilings permit natural completion on the loaded shared host; no successful final attempt was interrupted. Final retained campaigns are under `artifacts/nextgen/d11-final/campaigns/`.

`npm ci && npm run build` passed after the merge. The final production build after descriptor freeze also passed (TypeScript and Vite; existing chunk-size advisory only). No hardware-FPS or performance improvement is claimed.

Gallery: `artifacts/nextgen/d11-final/ui/index.html`. All 35 new-model native PNGs were opened and inspected at 1920×1080 and 1280×720, with all 480×270 derivatives inspected. Both capture passes had zero page errors. Coverage includes enabled Veteran selector, all eleven contextual hints, settings on/off, pause mode and confirmation, death debrief and fully loaded old-save continuation. Fixtures disclose forced hint eligibility/readiness and the native staged Crawler encounter; current equipped-rig content is used. Repeated critique/fix passes corrected selector centering, entry-opacity timing, warning initialization, actor masking and loading-overlay settling.

Start with `ui/selector-1920.png`, `ui/hint-dash-1920.png`, `ui/hint-overdrive-1280.png`, `ui/settings-1280.png`, `ui/death-1280.png` and `ui/old-checkpoint-continue.png`. A supplemental pause-1920 image caught its asynchronous portrait before decode, while its mode indicator was readable; other pause/confirmation captures show the portrait. Capture browser/server cleanup was confirmed.

## Remaining weaknesses

Veteran expert completion remains above the requested upper bound; the enabled configuration follows the explicitly authorized fallback rather than claiming both bands passed. Rig completion spread remains wide, particularly Pyro in the quick cohorts. Hints explain controls more than tactical judgement. Conservative actor masks can leave gaps in the teaching outline. Staged captures establish readability, not human learning or fairness. No renderer, world, asset or modelling source was edited by D11 beyond the requested merge. Per AGENTS.md’s startup-hook compatibility requirement, the existing bench, restart-stress and i10-loading entrypoints now choose Standard and confirm after #start; measurement logic is unchanged. Their node syntax checks pass; these three auxiliary campaigns were not rerun. No further integration requests.
