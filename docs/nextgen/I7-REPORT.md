# I7 — final world/ability integration

Branch: `t3/integrate-world-rendering-fixes`. Application freeze: `ab1b7c45ef9f7fee4b8dd5c4201880162e887a73`. Final report commit is supplied in the handoff. Production snapshot: `artifacts/nextgen/i7/final-dist/`.

JavaScript/browser and render-resource guards pass. High timing targets are not met in the measured runs; full `verify` stops at the documented missing Blender dependency. This is an integration handoff, with vision §7 acceptance still open.

## What shipped

- Merged X2 `a63e6cc` into integrated X1/X3 HEAD `371cfa8`, merge commit `b9421c3`. The single `DepthRenderer.ts` hunk retains X1's hostile warning `renderOrder=20` and X2's marine aim/scale, creature stage light and cinematic muzzle-light configuration. Friendly boundary material, lightning batch and volumetric fire remain intact. The marine silhouette/health bars still composite through the HUD scene after world/post effects.
- Restored Overload Floor's motivated orange core key, long outward shadows and cool falloff. Lower probe wash prevents the grey-room regression; the white-hot heart and raised orange energy bands have separate structure. Manual-control keeps its existing authorization-console source, with a narrower orange key and readable control text. Existing red alarm fixtures, High heat haze/embers and Low simplifications remain. Overload alone receives stronger existing local suit fill.
- Flashfire fills its real cone with 96 High / 35 Low overlapping upright folds, hot muzzle and orange body, holding its dense phase for approximately 350 ms before thinning. Afterburn's wall and Meltdown's aura receive overlapping taller folds. Far soot renders after flames and before friendly boundaries/hostile warnings. All use existing pools, resources and shader families.
- Queen plates are angular, thick dark chitin; approximately 70° hinges rotate their normals and expose the magenta-white cavity. The aperture stays on the upper torso, preserving limb roots. The same prewarmed uniforms reverse the transition.
- Added real boss/deployable, champion/effect and pickup/zone capture fixtures. Added serial acceptance timing/load receipts and gallery/contact-sheet assembly. Large baseline comparisons use file links to avoid V8's embedded-string limit; original PNGs and metadata remain intact.

No gameplay, balance, save schema, UI redesign, dependency, third-party asset or license change. No computer-use/desktop-control tools, other-worktree writes, push or PR.

## Critique rounds

Merge capture `i7-merge` was inspected for title composition, actor/crown readability, pickup symbols and Queen exposure. Art round 1 rejected beige core illumination, thin pink Queen fins and horizontally streaked fire folds. Round 2 accepted stronger orange/cool value structure, thicker neutral hinged plates, and tall rolling fire. The final existing suit-fill and soot-order corrections are checked again in the final gallery. Native images and row-major phase sheets are retained under `i7-art-round1`, `i7-art-round2`, `i7-pyro-round1`, `i7-pyro-round2`.

## Art evidence

The final gallery contains **534 original 1920×1080 frames / 95 motion sheets**, including all twenty rooms, sixteen abilities, eight bright/dark full-kit fights, boss phases/deployables, all UI states and Low in three rooms. The 1280×720 desktop subset has **45 frames / 5 motion sheets**. All 579 frames were inspected through 75 PNG review pages, with native art/UI spot checks; `final/inspection.json` records coverage. Every capture has zero errors/failures and identical frozen production asset hashes. Renderer: ANGLE Metal, Apple M1 Pro; DPR 1.

| Batch | Frames / sheets | Coverage |
|---|---:|---|
| `final-ui` | 45 / 6 | Title, four rig selections, boon/draft, route, shop, three pause tabs, settings, controls, death/completion/statistics, onboarding, six presentation beats |
| `final-rooms` | 180 / 40 | All twenty calm singles plus calm-motion and kiting bursts |
| `final-combat`, `final-baseline-extra` | 40 / 10 | Heavy combat in the requested comparison rooms and every original baseline heavy view |
| `final-abilities` | 112 / 16 | Seven phases for each of sixteen abilities |
| `final-kits` | 56 / 8 | Four full rigs in bright Containment Annulus and dark Infested Workshop |
| `final-details` | 86 / 12 | Graphics recovery, Queen armored/exposed/opening/closing/nests, champion/status effects, pickups/zones, boss with Bulwark/Glacier/pylon |
| `final-low` | 15 / 3 | Calm and kiting in Awakening, Infested Workshop and Overload |
| `final-720` | 45 / 5 | Desktop UI subset, three kiting rooms, Flashfire and exposed Queen at 1280×720 |

| Fix | Before (absolute PNG path) | Final (absolute PNG path) |
|---|---|---|
| Reactor | `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7/before/reactor-x2.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/combat-calm-overload-floor.png` |
| Flashfire | `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7/before/flashfire-x1.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/v2-flashfire-awakening-bay-04.png` |
| Queen exposed | `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7/before/queen-x2.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/g2-queen-exposed-reactor-vault-04.png` |

Original before-image source paths and SHA-256 receipts are preserved in `artifacts/nextgen/i7/before/provenance.json`; the table links unchanged local copies.

Earlier lighting reference inspected: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7/before/reactor-g1.png`.

The final reactor 3 m legal-ground samples reach local median 72.2–72.4 (Overload) and 72.2–72.8 (Manual), versus G1's historical minimum 71.6. Overload central masked calm ROI P5/median/P95 is 21.3/60.3/172.1, retaining a darker overall room than G1 while keeping the marine's local footprint readable. Method: sRGB Rec.709 luminance, central x15–85% / y20–80% ROI, ground samples within 3 m; source `artifacts/nextgen/final-rooms/luminance.json`. These samples do not certify every camera/combat position.

The inspected overlaps preserve the marine silhouette through friendly effects, hostile warnings above friendly boundaries, backed health/status bars and champion crests. Pickup locators remain distinct over zones. Bulwark, Glacier and pylon coexist with boss warnings. The X3 title retains its dominant left-hand wordmark beside the staged confrontation.

Gallery paths:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/index.html`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final-720/index.html`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/compare-baseline.html`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/before-after.png`

The index also links all four organic campaign receipts, outside the staged capture count.

The harness comparison has 534 aligned views, 66 original counterparts and 468 new final-only views; no original view lacks a final counterpart. It references an unchanged local copy of the original baseline. The single contact sheet pairs the requested UI and calm/heavy rooms. Original exposed-phase evidence does not exist, so that row explicitly labels its armored fallback.

## Ten showcase images

1. Title confrontation: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/title.png`
2. Starting boon: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/starting-boon.png`
3. Descent map: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/route.png`
4. Overload climax: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/combat-calm-overload-floor.png`
5. Flashfire dense phase: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/v2-flashfire-awakening-bay-04.png`
6. Queen exposed: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/g2-queen-exposed-reactor-vault-04.png`
7. Breacher / bright: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/v2-full-breacher-containment-annulus-containment-annulus-03.png`
8. Cryo / dark: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/v2-full-cryo-infested-workshop-infested-workshop-03.png`
9. Pyro / dark: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/v2-full-pyro-infested-workshop-infested-workshop-04.png`
10. Arc / dark: `/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/final/v2-full-arc-infested-workshop-infested-workshop-03.png`

## Gates

`npm ci` passed (61 packages). Final frozen-application summary lines:

- Vitest: **254 files passed, 1 historical skip; 2984 tests passed, 1 skipped**, 146.92 s. `VITEST_MAX_WORKERS=2`, file parallelism disabled to serialize browser gates.
- Model preview: **2/2 passed**.
- Build: **passed**, TypeScript and Vite; existing large-chunk notice.
- Room evidence: **28/28 passed**, plus **33 ragdoll checks passed**.
- Desktop smoke: **passed** native input, resize/recovery, graphics tiers, audio and persistence feedback contracts.
- Authored desktop: **20/20 passed on unchanged full recheck**, zero browser errors.
- Playtest smoke: **3 rooms cleared, zero errors/defects**, default rendering; max preparation hold 262.2 ms.
- `npm run verify`: JavaScript/model stages pass, then unchanged Python monitor test stops with **`FileNotFoundError: blender`**. No Blender install, asset change or assertion bypass.

All timings below use a shared 10-core host; load is the 1-minute system load average, not utilization:

| Gate | Exit | Wall seconds | Load1m start→end |
|---|---:|---:|---:|
| final-vitest | 0 | 147.59 | 31.5→22.4 |
| final-model-preview | 0 | 0.50 | 22.4→22.4 |
| final-verify | 1 | 287.42 | 22.4→19.4 |
| final-build | 0 | 6.13 | 19.4→19.2 |
| final-room-evidence | 0 | 0.98 | 19.2→19.2 |
| final-smoke | 0 | 85.55 | 19.2→15.4 |
| final-authored | 1 | 126.68 | 15.4→96.0 |
| authored-awakening-isolated | 0 | 7.48 | 96.1→97.5 |
| final-authored-recheck | 0 | 82.15 | 102.7→84.5 |
| final-playtest-smoke | 0 | 192.93 | 96.0→81.1 |
| final-bench | 0 | 1450.52 | 93.0→44.1 |
| final-bench-rooms | 0 | 81.33 | 44.1→41.6 |
| final-bench-isolated | 0 | 161.07 | 40.3→25.6 |

The first authored attempt timed out on Awakening Bay's native-fire wait and ended in a natural death, `errors:[]`; load 15.4→96.0. An unchanged isolated repeat passed in 7.48 s at load 96.1→97.5, then the complete unchanged twenty-room repeat passed in 82.15 s at load 102.7→84.5 with zero errors and explicit fatal Overload authorization. The failure remains under `artifacts/authored-smoke/desktop/`; passing evidence is `artifacts/authored-smoke/i7-final-recheck/`. Load alone is not established as the cause, and no test was weakened or changed. The initial sandbox-blocked test/capture attempts are retained separately.

## Campaigns

All campaigns use seed 1729, the frozen production directory, full rendering on every fixed tick, native WASD/mouse and incoming damage scale 1. No fast mode, assisted damage or balance changes. All four rigs reached an ending or a natural death with zero browser errors and zero detected defects.

| Rig | Terminal | Clears | Deaths | Sim s | Total wall s | Overdrives | Mean interval [min–max] sim s | Max hold ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| breacher | dead | 10 | 1 | 414.75 | 2078.95 | 6 | 59.8 [49.5–77.3] | 856.2 |
| cryo | complete | 20 | 0 | 786.23 | 3731.91 | 14 | 49.5 [31.7–66.5] | 847.8 |
| pyro | complete | 20 | 0 | 673.05 | 5548.75 | 14 | 43.6 [33.4–55.8] | 1205.5 |
| arc | complete | 20 | 0 | 722.98 | 1655.24 | 16 | 40.5 [25.3–70.4] | 1136.9 |

| Rig | Worst room CPU-submission p95 / max ms | Load1m start→end, 10 cores | Errors / defects |
|---|---:|---|---:|
| breacher | 217.0 / 4063.9 | 128.4→28.2 | 0 / 0 |
| cryo | 234.9 / 2835.3 | 33.1→126.1 | 0 / 0 |
| pyro | 343.2 / 10737.1 | initial: 120.8→21.9; continued: 20.8→159.3 | 0 / 0 |
| arc | 74.6 / 2581.9 | 169.3→52.3 | 0 / 0 |

Derived receipts (full casts, per-room windows, all load averages, source reports and PNG paths):

- [breacher summary](/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7-logs/campaign-breacher-summary.json)
- [cryo summary](/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7-logs/campaign-cryo-summary.json)
- [pyro summary](/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7-logs/campaign-pyro-summary.json)
- [arc summary](/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7-logs/campaign-arc-summary.json)

Frame values are the worst retained per-room fixed-step update/render CPU-submission p95 and maximum; these can come from different rooms. Percentiles retain up to 2048 recent ticks per room, while maxima cover the room since reset. They are not pooled campaign percentiles or realtime FPS and exclude GPU completion. The raw outliers remain visible on this heavily loaded shared host; these runs do not isolate application cost from scheduling or driver contention. Cadence uses accepted casts from exact event receipts for Breacher/Cryo and policy-step observations for Pyro/Arc; observed timestamps may lag by one decision step.

Breacher died naturally in Diagnostic Gallery after ten clears. Its authoritative final hit is enemy-contact / brute, 28.1476 damage, displayed as Brute attack; the runner's proximity-inferred source remains separately labelled. Cryo, Pyro and Arc reached the actual ship-destroyed / New Earth warned ending. Terminal PNGs and hardest organic bursts were inspected.

Pyro's original attempt reached its default 3600 s wall cap after 14 clears / 474.483 simulated seconds (3601.320 wall seconds), with zero errors/defects and a maximum hold of 805.38 ms. The original command exited 1 for wall-timeout and remains archived. The validated Service Shaft Landing reward state contains 14 proven clears / 452.767 simulated seconds. The real Continue path under i7-final-pyro-1729-continued replays 21.717 simulated seconds of partial Infested Workshop exposure; one discarded partial-room Overdrive is excluded from canonical stats. Total wall time includes that exposure. Same HEAD, all harness hashes, policy/navigation versions and enabled encounter tuning match, with no profile transition. Provenance: artifacts/nextgen/i7-logs/campaign-pyro-continuation-provenance.json.

## Performance and room preparation

The default realtime benchmark scanned all twenty story rooms and selected heavy Relay Racks (241 scan draws) and median Manual-control Chamber (192). It ran **48 sustained trials: two rooms × four rigs × two tiers × three 20-second repeats**, at 1920×1080 with one browser. The live stress population and accepted full-kit slot guards pass.

**Resource guards pass; timing acceptance does not.** All 48 trials have zero mid-combat shader compiles, zero errors/context-loss failures and no resource-budget failures. Peak draws are **325**, within both 350 and the 330-call headroom guard. The CPU-p95 ≤8 ms flag passes in **20/48 trials** (all Low); frame-p95 ≤16.6 ms passes in **0/48**. Every High CPU/frame trial misses its timing target. Flags use unrounded values. These measured misses cannot establish quiet hardware performance or separate application cost from contention on this shared host.

The table selects the repeat with the lowest CPU p95 for each case, and uses that same repeat's frame distribution. Draw/program maxima and load ranges cover all three repeats; load ranges use recorded endpoints. All 48 raw distributions and flags remain in [benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7-bench/benchmark.json).

| Room / rig / tier | Best repeat CPU p50/p95 ms | Its frame p50/p95 ms | Peak draws (all 3) | Max inventory programs | Load1m range |
|---|---:|---:|---:|---:|---:|
| relay-racks / breacher / high | 7.4/10.5 | 26.3/34.3 | 291 | 105 | 43.8–55.0 |
| relay-racks / breacher / low | 4.9/8.0 | 16.7/25.2 | 181 | 155 | 38.6–46.1 |
| relay-racks / cryo / high | 8.4/12.4 | 32.0/34.5 | 315 | 105 | 31.5–40.2 |
| relay-racks / cryo / low | 4.9/6.7 | 16.7/18.0 | 198 | 155 | 22.7–32.0 |
| relay-racks / pyro / high | 9.3/13.1 | 32.2/34.6 | 325 | 105 | 17.6–23.4 |
| relay-racks / pyro / low | 5.3/7.4 | 16.7/25.2 | 188 | 155 | 17.6–23.9 |
| relay-racks / arc / high | 6.4/10.3 | 25.9/34.4 | 290 | 105 | 23.5–37.3 |
| relay-racks / arc / low | 4.6/6.5 | 16.7/25.2 | 171 | 155 | 31.0–37.3 |
| manual-control-chamber / breacher / high | 8.6/15.3 | 33.5/42.1 | 229 | 178 | 21.5–31.0 |
| manual-control-chamber / breacher / low | 4.7/7.6 | 16.7/25.2 | 155 | 229 | 15.8–24.1 |
| manual-control-chamber / cryo / high | 5.2/13.5 | 33.5/42.5 | 234 | 178 | 15.8–37.1 |
| manual-control-chamber / cryo / low | 4.9/7.3 | 16.7/25.3 | 156 | 229 | 37.1–47.6 |
| manual-control-chamber / pyro / high | 10.8/16.2 | 33.7/42.6 | 252 | 178 | 44.9–47.6 |
| manual-control-chamber / pyro / low | 5.2/7.7 | 16.7/25.2 | 156 | 229 | 36.8–47.6 |
| manual-control-chamber / arc / high | 5.3/9.4 | 33.4/41.9 | 206 | 178 | 32.5–44.9 |
| manual-control-chamber / arc / low | 4.1/6.2 | 16.7/25.2 | 136 | 229 | 38.0–44.1 |

### Fresh-browser timing recheck

The slowest original High frame-p95 case was Manual-control Chamber / Breacher (42.7 ms). After the main benchmark and room audit closed, a fresh browser repeated that exact rig/room in High and Low, three 20-second trials each, with the same frozen build and unchanged guards. All six resource/error guards pass; High CPU p95 remains **15.7–16.1 ms** and frame p95 **42.3–42.5 ms**. Only 1/6 CPU flags and 0/6 frame flags pass. The timing shortfall remains after this isolated repeat; no claim that host load alone caused it is made. Raw recheck: [benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7-bench-isolated/benchmark.json).

| Recheck tier | Best repeat CPU p50/p95 ms | Its frame p50/p95 ms | Peak draws (all 3) | Load1m range |
|---|---:|---:|---:|---:|
| high | 8.4/15.7 | 33.5/42.3 | 239 | 36.9–41.1 |
| low | 4.7/7.8 | 16.7/23.5 | 147 | 25.6–41.1 |

### Room preparation

**42/42 pass**: all twenty story rooms plus Reactor Vault, each on a fresh page and with the retained sequential renderer. Maximum complete readiness hold is **715.0 ms**, below 3000 ms. Maximum program inventory **196/400**, material profiles **54/160**, compile passes **10/12**. Combat and post-readiness shader compiles are **zero in every row**. Errors and guard failures are empty. Sequential staging is renderer-accumulation coverage, separate from the organic campaigns. Raw phases/diagnostics: [rooms.json](/Users/chernodub/.t3/worktrees/containment-game/t3-811dd6fa/artifacts/nextgen/i7-bench-rooms/rooms.json).

| Room | Fresh ms / programs / load1m | Retained ms / programs / load1m |
|---|---:|---:|
| awakening-bay | 487.8 / 110 / 44.1→44.1 | 485.0 / 110 / 43.9→43.9 |
| passenger-vault | 375.0 / 104 / 44.6→44.6 | 621.6 / 104 / 43.9→43.9 |
| residential-gallery | 387.9 / 103 / 45.2→45.2 | 696.4 / 104 / 43.9→43.9 |
| communal-atrium | 296.9 / 103 / 45.2→45.2 | 616.5 / 105 / 43.9→42.8 |
| crew-checkpoint | 310.5 / 103 / 45.0→45.0 | 456.4 / 105 / 42.8→42.8 |
| armory | 350.2 / 104 / 45.3→45.3 | 638.5 / 106 / 42.8→42.8 |
| freight-hold | 610.2 / 103 / 45.3→45.3 | 641.6 / 106 / 42.8→42.8 |
| breached-loading-bay | 288.9 / 103 / 45.3→45.3 | 570.2 / 108 / 42.8→42.8 |
| relay-racks | 155.3 / 102 / 45.3→45.3 | 562.8 / 107 / 42.8→42.8 |
| transmission-chamber | 381.6 / 103 / 45.1→45.1 | 582.5 / 106 / 42.8→42.8 |
| diagnostic-gallery | 400.4 / 104 / 45.1→45.5 | 586.3 / 107 / 42.8→42.8 |
| safety-interlock-station | 475.9 / 107 / 45.5→45.5 | 671.8 / 110 / 42.8→43.7 |
| coolant-plant | 366.2 / 103 / 44.6→44.6 | 715.0 / 107 / 43.7→43.7 |
| service-shaft-landing | 195.5 / 102 / 44.6→44.6 | 608.7 / 108 / 43.7→43.7 |
| infested-workshop | 350.6 / 104 / 44.0→44.0 | 313.0 / 109 / 43.7→43.7 |
| swarm-junction | 373.8 / 103 / 44.0→44.0 | 660.9 / 109 / 43.7→43.7 |
| shielding-gate | 419.2 / 103 / 43.0→43.0 | 630.0 / 109 / 43.7→43.7 |
| containment-annulus | 191.7 / 106 / 43.3→43.3 | 620.1 / 114 / 43.7→43.7 |
| manual-control-chamber | 446.1 / 175 / 43.3→43.3 | 674.6 / 194 / 43.7→43.7 |
| overload-floor | 414.2 / 174 / 42.0→42.0 | 704.4 / 195 / 43.7→41.6 |
| reactor-vault | 561.9 / 177 / 42.0→43.9 | 541.3 / 196 / 41.6→41.6 |

All load values above are one-minute system load averages on ten logical cores, not CPU-utilization percentages. Command wall times and all three load averages are retained in the timing JSONs. Fixed-step capture/campaign timings and screenshots are not hardware frame-rate evidence. Quiet-device profiling and performance work are still required before vision §7 acceptance.

## Tests rewritten or removed

Inherited X2 presentation changes remain documented in `docs/nextgen/X2-REPORT.md`. I7 rewrites:

- `G2SurfaceAssets.test.mjs`: compressed PNG byte equality becomes decoded pixel equality after encoding. Node 25/zlib produces different compressed bytes for the exact same original pixels; dimensions, file budget, pixel equality, reflectance, texture ownership and disposal assertions remain. No asset changed.
- `SpectaclePrimitives.test.ts`: exact 48 flame count becomes bounded ≥90 within the existing capacity; transient flame height bound permits the approved taller volume. Shape, radius, upright and inventory assertions remain.
- `PyroPresentation.test.ts`: transient cone height follows the tall volume (<3.1 m), while persistent pool height/head-clear bounds remain. New coverage checks angular/radial filling, 30/150/330 ms sustain, orange light and retirement.

Added Queen neutral-chitin, rotated-normal, rim-reset and reversible-phase tests; reactor source/key/local-fill/tier/topology guards. No gameplay, determinism, accessibility, persistence, keyboard/mouse, resize, recovery, navigation or authored-room safety assertion was removed.

## Integration requests

None outside this worktree. Lead acceptance still requires the vision review and human play; this report does not substitute captured fixtures for organic balance evidence.

## Known gaps against vision §7

- Procedural reactor structure and fixed phased wall alarm lights remain simpler than bespoke climax art; Manual-control contains its authored console rather than an added reactor well.
- Queen anatomy remains the retained model plus procedural crown/core; exposed light can wash the shell lavender and the white cavity can read as a slit from this angle.
- Pyro flipbook repetition remains recognizable. Dense fire deliberately obscures some surfaces; the marine overlay, hostile warnings and HUD remain the readability layer.
- Retained coarse infestation, repeated prop kits/passenger forms and some fine-floor shimmer do not consistently meet a premium authored-art bar. Title actors remain a fixed staged confrontation rather than a new locomotion approach.
- High timing targets are missed in the default realtime matrix and the fresh-browser repeat. The recorded host is heavily loaded, and these runs do not isolate application cost from contention. Quiet-device profiling and performance work are required; 60 fps / 8 ms acceptance is not achieved by this evidence.
- A natural campaign death satisfies I7's requested terminal condition, but does not prove that rig can finish the late campaign. Staged boss/full-kit fixtures establish presentation coverage only.
- Seed 1729 bot campaigns and staged captures do not establish human control comfort, broad balance, or perceived SFX/mix quality. Lead play and listening remain part of vision §7 acceptance.
- Blender is absent on this host. The unchanged Python asset chain remains a known verification limitation; tests/assets are not modified to bypass it.
