# D11 — difficulty and first-room onboarding

Branch: `t3/difficulty-onboarding-modes`. **Acceptance incomplete: Veteran targets did not converge.** Stopped after three bounded candidates. No push or PR. This is implementation for review, not a completed balance release. Veteran selection is disabled behind `VETERAN_DIFFICULTY_ENABLED` until accepted; bot flags retain experimental access.

## Implementation

One deterministic descriptor scales incoming damage, enemy recovery/rest and ranged/special cooldown clocks, light simultaneous attack admission, scheduled waves, ordinary elite rolls, pickup values, and Overdrive gain. Ability rules remain unchanged. Standard multipliers are unchanged. The first room removes two opening enemies, spaces its first four arrivals at 1600ms, and lengthens only their wind-ups by 1.5; subsequent arrivals retain native spacing.

| Mode | Damage | Rest/recovery | Light wind-ups | Waves | Elites | Pickup values | Overdrive |
|---|---:|---:|---:|---:|---:|---:|---:|
| Story | .75 | 1.15 | 2 | .9 | .7 | 1.15 | 1.15 |
| Standard | 1 | 1 | 2 | 1 | 1 | 1 | 1 |
| Veteran experimental | 1.15 | 1.5 | 1 | .8 | 1.2 | .4 | .9 |

Run-start cards are keyboard reachable, remember selection separately from saves, and preserve existing DOM hooks. Pause shows difficulty and offers confirmed easier changes only. Live damage, attack clocks, pickup and charge modifiers change immediately; scheduled wave sizes change next room. The mode is checkpointed. An actual pre-D11 HEAD checkpoint continued as Standard; missing/corrupt mode values also continued as Standard. Retained fixture: `artifacts/nextgen/d11-final/old-checkpoint.json`.

Hints: WASD movement; mouse aim; LMB/Space fire; R reload; 1–5 weapon switch; Shift “Step out or dash” at first wind-up; Q tactical; F power; V when charged; E medkit when hurt; G grenade against a group. First-use completion persists. Hints run in the first three rooms for up to fifteen minutes, with charged Overdrive eligible later. Hints off and completed-run preference suppress them. One-line prompts use HUD-safe placements and projected actor/warning exclusion. A brief static SVG outline follows the authoritative first melee footprint, with actor masking; it clears on cancellation/strike/death and has no hit authority. No renderer code changed.

Death debrief names the fatal family/attack and the room's top three damage sources, using an accumulated room ledger rather than the bounded recent-hit history. Both native and simulation bots accept `--difficulty=story|standard|veteran`; batch/grouping/comparison tooling preserves mode identity. Simulation workers cap at three.

## Results

Unassisted seeded human profiles, four rigs. Quick seeds match B10. No automated tests or assertion gates added. Raw retained source snapshots and outcomes are in `artifacts/nextgen/d11-final/balance/`; `cohorts.json` summarizes rejected pilots.

| Candidate | Profile | Clears / completed attempts | Result |
|---|---|---:|---|
| Story initial | novice | 37/40 (92.5%) | Too easy; discarded |
| Standard broad opener | competent | 25/40 (62.5%) | Opener narrowed; discarded |
| Veteran 1 | competent / expert | 1/40 (2.5%) / 37/40 (92.5%) | Both targets missed |
| Veteran 2 | competent | 0/40 (0%) | Rejected; expert skipped |
| Final Story quick | novice | 23/40 (57.5%) | Within pilot target; unconfirmed |
| Final Standard quick | competent | 17/40 (42.5%) | Matches historical pooled baseline; unconfirmed |
| Veteran 3 interrupted | competent | 14/20 (70%) | Censored; even 14/40 =35% exceeds target |

**No requested 20-seed × four-rig confirmations were run.** Veteran 3 expert was skipped after the competent bound excluded acceptance. All queues were stopped. Partial Veteran results are not a completed-cohort rate estimate. There is no claim that all difficulty targets hold.

`npm ci` completed. Final `npm run build` passes (TypeScript and Vite; existing chunk-size advisory). Final Standard native Arc seed1729 completed normally with ten rooms cleared, then natural death, zero errors. Story native was interrupted under the stop decision; it is censored, not a completed campaign. Veteran native was not run. Old checkpoint compatibility was exercised with the production simulation. No hardware-performance claim is made.

## Visual review

Gallery: `artifacts/nextgen/d11-final/ui/index.html`. Thirty-four final native PNGs cover all eleven prompts, selector, settings on/off, pause indicator, downward confirmation and death at 1920×1080 and 1280×720. All were opened and inspected natively and through 480×270 derivatives; final capture reported zero page errors. Capture fixtures disclose forced eligibility/readiness and the staged native Crawler encounter. Two critique/fix rounds corrected selector alignment, animation settling, dash fixture initialization, actor masking and confirmation styling. The final disabled Veteran card is a safety restriction applied after these captures; the gallery shows the review candidate before that restriction.

Start with `ui/selector-1920.png`, `ui/hint-dash-1920.png`, `ui/hint-overdrive-1280.png`, `ui/settings-1280.png`, and `ui/death-1280.png`. Campaign evidence is under `campaigns/`.

## What still feels wrong

Veteran remains unbalanced and its experimental descriptor is not an accepted harder-mode design. Story and Standard only have pilot evidence; the required confirmations remain undone. Story and Veteran native campaign requirements are incomplete. Hints explain keys more than tactical judgment, and conservative rectangular actor masks leave gaps in the teaching outline. Staged captures do not establish human learning, fairness or completion rates. No integration changes to renderer, worlds, assets or shared model files are requested. Reopening Veteran balancing and running the omitted confirmations is required before release.
