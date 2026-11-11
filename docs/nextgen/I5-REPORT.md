# I5 — integration and balance report

## 1. What shipped and source identity

**V33 is selected on the complete corrected fixed-seed cohort. All seven final-source gates pass; fresh eight-run native confirmation and cleanup are complete, with native target misses and model limits reported below.**

Branch **`t3/integrate-playtest-balance-tuning`**. Final documentation HEAD is supplied in the handoff; no push or PR.

| Identity | Frozen value |
|---|---|
| Game source (V33) | `7ec850683be78692c758e2888e177ccdc11d3cc0` |
| Shared player policy | `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d` / `i5-catalog-ability-aim-v3` |
| Policy SHA256 | `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502` |
| Corrected Node backend | `b6cac5f788451b162c61240896d3a846749e0de5` / `sim-policy-v8` |
| Backend SHA256 | `63b80de0fedf804ff871b6ba1f2c75ea9afcb6b1be9ffcf338a2efe19affcde0` |
| Game SHA256 | `5c22135ab8d0cfc2dc436822ed9a3a81328d8cdacae80be7735947e03de2b696` |
| Node runtime bundle SHA256 | `fd8a195bcf60066174c6c22ea757d8c93b859890e0b91e07bc0f65b80817d17d` |
| Production application SHA256 | `bae6151eda06baa4bebda53cbdd05e910672800ad3aa377d4e6575b3d2761054` |

Application fingerprint covers sorted paths/raw bytes of index.html and top-level JS/CSS; the complete distribution, including static assets, is preserved separately. It is not a full static-asset hash.

- Merged R4 `730af13` into F2 `e97fe10` at `76e744ddae0d3dfc045614efb4b6efd6509ba9e7`, then merged `nextgen` world/performance integration `93adf6d` at `30d268e0455d30a58dfa15264e43e2485d5c33d5`.
- Preserved the reusable Playwright player, `playtest`/`playtest:smoke`, paid no-benefit recovery refusal, Credits action, native diagnostic clock/loading readiness and clean reporting of errors/preparation holds.
- Fixed shared directional/point Q/F/V catalog-shape aiming: choose expected hits within the actual augmented shape, legal range/placement and target LOS; no aimed activation without a valid target. Native audit also corrected Bulwark's70-unit deployment origin and empty-tip versus actual-target LOS. Directional/point abilities receive their own cursor; weapon cursor is restored. Movement-owned evasive dash and all other policy decisions are unchanged.
- Added source-frozen render-free campaign batches using real deterministic DepthGame. Corrected native input/observation sequencing before accepting cohort evidence; per-run copied sources, policy/game/backend/bundle hashes expose every epoch. No50× speed or exact native-outcome parity claim.
- Tuned encounter composition/tempo and rig outliers under unchanged full-kit, TTK and dash guards. Ordinary story rooms accept one Overdrive; earned full charge carries to the next room with truthful `NEXT ROOM` readiness. No checkpoint schema/version change.

Six conflicts preserved both sides: `scripts/nextgen/README.md`, `scripts/nextgen/debug.ts`, `src/ui/application.ts`, `src/ui/screens/ScreenManager.ts`, `src/ui/screens/templates.ts`, `tests/SafeRoomLoading.test.ts`. Combined workflows/clock-readiness retain F2 staged loading and held input; Credits remains reachable; recovery/focus/loading assertions survive. F2 preservation includes deferred hit-stop accumulation, application-wide graphics loss, focused UI/gameplay key separation, repeated-Tab traps/inert background, zoom-scrollable drawers/Escape, stale-Continue refresh, hurt bearings and staged/lazy bundle splitting. Original receipts: [F2](F2-REPORT.md), [R4](R4-REPORT.md).

The later `nextgen` merge resolved `package.json`, README, debug/application and SafeRoomLoading conflicts again. It retains both benchmark and playtest scripts; native-frame samples coexist with I4's performance observer, appended after the original live-observation adapter without changing its argument order. The cinematic title contract, cached viewport hooks and I4/6a lazy-loading fixes remain alongside F2 graphics/input holds. Loading harnesses retain both adapters; the PlaytestNativeInput signature pin was updated for the added observer, with its readiness/input assertions unchanged. [I4](I4-REPORT.md) and [6a](INTEGRATION-6A-REPORT.md) identify the imported world/performance work.

### Every active numerical delta

Baseline is c3bd53b unless the inherited original-R4 change is explicitly named. The [exhaustive audit](I5-NUMBER-AUDIT.md) adds all20 room counts/caps/tails/multiplier arithmetic and unchanged defaults; no rejected trial value is substituted.

| Parameter | Before → final V33 | Rationale |
|---|---|---|
| Charge, original R4 → inherited baseline | `/6000+kills×.025` →`/12000+kills×.0125`; Dynamo×1.3 preserved; selected retains baseline arithmetic in all graphs | Halve inherited earning rate to make V a per-fight spike; Dynamo remains truthful. |
| Dead experimental kill term | Disabled.015 branch →removed; actual baseline/selected.0125 unchanged | Remove a dead experimental path so the audited arithmetic is unambiguous. |
| Ordinary graph-v3 V allowance | Unlimited →1 accepted activation; full meter retained for next room; legacy/special encounters unlimited | Guarantee no second ordinary-room activation while retaining earned charge. |
| Transmission, original R4 → inherited baseline | 40@900 →32@750ms; selected remains32@750, first650/last23900ms | Shorten spawn tail and waiting while retaining rising holdout pressure/climax. |
| Breacher Railbreaker cast | 600 →250ms; damage420/line900×44/launch unchanged | Reduce long exposed commitment for the low-completion close-range rig without adding damage. |
| Cryo Glacier cooldown | 15000 →18000ms | Reduce the high-control outlier within the approved F cooldown range. |
| Cryo Nova freeze | 1800 →1500ms;30 damage/210 radius/Q9s unchanged; catalog description and Freeze stat1.8→1.5s | Trim the remaining strong Cryo control window after fixed N40 failed strict spread; preserve damage. |
| Pyro dash distance | 150 →220; all rigs retain220ms immunity/2600ms recharge/140ms travel/2 charges; other distances150 | Give area-denial Pyro enough evasive travel without increasing immunity or its uptime budget. |
| Pyro Flashfire | Damage40→25; cast80→0ms; cooldown8000→6000ms | Move damage toward placed area control; instant, frequent Q supports movement within the vision. |
| Pyro Napalm | Damage4.5→6.5 per250ms; cast350→150ms; cooldown14000→12000ms; duration6000/radius120/triplet80 unchanged | Strengthen placed pressure and shorten exposed cast while retaining weapon/full-kit share guards. |
| Pyro Meltdown speed | ×1.25 →×1.4;8s/aura/bursts unchanged | Support momentum during the unchanged short Overdrive window. |
| Arc Q/F cooldown | 7000/16000 →8000/18000ms | Trim the strong chain/deployable rig using approved cooldown ranges. |
| Story pressure | Extra damage×1→×`(1+.18p)`; speed×1→×`(1+.05p)`; `p=max(0,d−4)/15`, except Transmission0 | Raise depth pressure through existing progression rather than basic health. |
| Late damage factors | ×1→×.72 at zero-based depths10–18; finale×1→×1.0 on top of pressure (effective1.18×base) | Offset dense late elite mixes to avoid lethal contact spikes; retain a dangerous finale. |
| Elite HP/damage | HP1.65→1.08 from depth5; elite damage1.2→1.05 at depths5–9, later1.2; basic HP unchanged | Allow frequent elite behaviors without elite health sponges; moderate act2 contact. |
| Guardian roster | Wardens room6→6/9/13/19; Matron16 unchanged; all first requests visibly elite/correct family | Introduce clear pressure peaks earlier and spread them across later acts. |
| Late ordinary elite-Brute charge | Initial1500→5000 /warning850→1150 /repeat4600→6500ms from depth10; Warden1500/850/4600 unchanged | Keep denser elite mixes reactable; preserve named Warden identity/timing. |
| Champion effective multipliers | Defaults1/1→explicit1/1 late; Warden760HP/120armor/28contact and Matron1150/0/24 unchanged | Make unchanged champion stats explicit; do not inflate their health. |
| Added scheduled parents | +0→+2 ordinary non-guardian depths2–8; +8 every late non-holdout; act totals67/104/102/148→73/108/142/180 (421→503) | Sustain pressure and ordinary-room duration through more threats rather than health. |
| Concurrency | Ceiling18→20 early/15 late; ordinary act bonus0→0/1/2/2; Transmission14 unchanged | Increase early variety slightly; bound late crowding while dispatching denser packets. |
| Spawn packets | Six-request packets1100→950/850/750ms in acts2/3/4; within100→90ms; first650 unchanged | Raise act2–4 tempo and overlapping threat windows. |
| Mid pool | Crawler2/Spitter1/Stalker1/Carrier1 (depth8 previously late pool)→Crawler2/Spitter2/Stalker1/Carrier1 | Add ranged pressure during the midgame transition. |
| Late pool | Crawler2/Brute1/Spitter2/Stalker1/Carrier1→Crawler3/Brute1/Spitter4/Stalker2; Matron first carrier exception | Favor spitters/stalkers over carrier cleanup tails while retaining some melee anchors. |
| Ordinary elite chance | 0→`.14+.018(d−5)` at depths5–8; late`.60+.01(d−10)` including elite16/finale; Transmission0 | Expose specialist elite behaviors regularly as depth rises. |
| Finale | 48@900ms retained, cap18→15; last42950ms; named late Warden rooms are mixed28/33 requests, not disabled9-body duels | Preserve the authored climax and bound crowding; maintain mixed waves around late champions. |

Basic enemy health/weapons and first-five progression are exact. First-two plans are exact; rooms3–5 preserve every original request prefix and append2 bodies. Global rig changes affect legacy too: only legacy encounter/progression/director records are byte-identical, not all legacy gameplay. Seismic90/220ms, Bulwark16s and Ram150 are restored; no Ram200, V29 Q110/120, V31 cooldown7/13 or V32 Pyro240 travel remains active.

### Evidence method and disposition

The fixed policy was re-baselined on every rig before further tuning. Baseline game `c3bd53b` already includes the original R4 meter/Transmission proposals; therefore its before/after table does not imply those two inherited changes were newly measured here. The original R4 report remains the pre-proposal reference (12 campaigns,10 completions, fast Overdrives and90s Transmission).

Corrected mode-v8 N40 uses the original20 seeds and one predeclared validation20 for every rig/profile. All160 baseline and160 candidate attempts, natural deaths and censors count. [Declaration](plans/I5-V8-VALIDATION.md) was committed at `70a48d6` before validation results. Combined V30 failed the exact15-point rig-distance check:81/160 complete (50.625%), B45/C67.5/P35/A55%, Cryo+16.875/Pyro−15.625pp. No rounding waiver or further seed extension was used. V33 changes only Cryo Nova's hard-freeze duration1800→1500ms, preserving its damage and legal cooldowns; all40 seeds/rig are rerun. [Failed V30 N40 archive](I5-EMULATION-V8-N40.md), [corrected initial N20](I5-EMULATION-V8.md), [V33 controlled comparison](I5-EMULATION-V8-V33.md).

The exact40 seeds are:1729,2718,31415,42,137,8675309,2026,9001,65537,123456,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,2646007777,2400273476,1420519048,926231573,3293539470,302625857,3031516705,315632507,3763819556,1353316589,2570684887,2825160470,676147701,1074335564,1576486972,719510212,1190535481,3640216177,3344254954,2595108862.

Completion and rig spread use campaign attempts; rooms/Overdrive is the per-campaign distribution of clears/accepted activations. Time uses cleared rooms; damage includes every attempted room, including deaths. Strict ordinary excludes authored elites, guardians and holdouts; broad nonholdout medians remain visible. Pacing targets are evaluated as pooled cross-rig medians, with every rig's diagnostic values exposed. The full-kit30–45% attribution guard is separate from campaign ability/status/boon buckets.

Earlier navigation/policy-v1/v2 and mode-v7 cohorts are historical, never pooled with corrected v8. All trials and rejected numeric directions remain in [original trials](I5-EXPERIMENTS.md), [late trials](I5-LATE-EXPERIMENTS.md), [aim experiments/withdrawals](I5-AIM-EXPERIMENTS.md), [numeric audit](I5-NUMBER-AUDIT.md) and V29–V32 archives. V26's500ms immunity failed the unchanged35% guard and was withdrawn; V29's Q110/120ms, V31's Pyro7/13s and V32's8/16s/240 travel are all reverted. No rejected value is active.

### Final distributions: forty fixed seeds per rig

The complete corrected comparison is **137/160 (85.625%) baseline →81/160 (50.625%) V30 →78/160 (48.75%) V33**. V30 failed rig spread; V33 passes the declared fixed-cohort checks. All480 raw-report hashes were independently rechecked, and all120 non-Cryo authoritative records match V30. Archive SHA256 `6893bedb8401fc69d8a5a767c241548e26a87bc9dc3a9ef8bb14f6c70516d894`; [full distributions, all matched triples and provenance](I5-EMULATION-V8-V33.md).

| Profile | Rig | Complete | Mean distance | Rooms/OD [p10–p90] | Strict ordinary s | Broad nonholdout s | Transmission s |
|---|---|---:|---:|---:|---:|---:|---:|
| Before | Breacher | 33/40 (82.5%) | -3.12pp | 1.4286 [1.176–1.538] | 33.72 | 34.93 | 66.63 |
| Before | Cryo | 38/40 (95%) | +9.38pp | 1.3333 [1.250–1.429] | 36.32 | 37.57 | 75.87 |
| Before | Pyro | 28/40 (70%) | -15.62pp | 1.3571 [1.111–1.462] | 30.62 | 32.06 | 57.53 |
| Before | Arc | 38/40 (95%) | +9.38pp | 1.3333 [1.250–1.429] | 30.88 | 31.75 | 62.55 |
| V30 | Breacher | 18/40 (45%) | -5.62pp | 1.4286 [1.267–1.667] | 33.05 | 35.00 | 68.93 |
| V30 | Cryo | 27/40 (67.5%) | +16.88pp | 1.3869 [1.333–1.538] | 36.60 | 38.85 | 78.04 |
| V30 | Pyro | 14/40 (35%) | -15.62pp | 1.4167 [1.308–1.545] | 29.03 | 30.50 | 58.20 |
| V30 | Arc | 22/40 (55%) | +4.38pp | 1.4286 [1.333–1.625] | 30.33 | 32.30 | 60.20 |
| Final V33 | Breacher | 18/40 (45%) | -3.75pp | 1.4286 [1.267–1.667] | 33.05 | 35.00 | 68.93 |
| Final V33 | Cryo | 24/40 (60%) | +11.25pp | 1.4226 [1.267–1.545] | 36.72 | 38.93 | 75.33 |
| Final V33 | Pyro | 14/40 (35%) | -13.75pp | 1.4167 [1.308–1.545] | 29.03 | 30.50 | 58.20 |
| Final V33 | Arc | 22/40 (55%) | +6.25pp | 1.4286 [1.333–1.625] | 30.33 | 32.30 | 60.20 |

V33 pooled strict ordinary **31.9667s**, broad nonholdout **34.0833s**, Transmission **64.8833s**; every-rig cadence is1.4167–1.4286. Ordinary double-use observations fall from **20/2516 baseline attempts →0/1984 final attempts**, including death attempts; unknown categories0. Different denominators reflect the retained campaign endpoints, not dropped rooms. All **800/800 first-five room attempts** clear; censors0. Maximum rig distance **13.75pp**. Individual timing misses remain explicit: Pyro29.03s strict ordinary/58.20s Transmission, Cryo75.33s Transmission. All per-rig broad medians pass30–45s. These are pooled-pacing passes, not a claim that every rig or room meets both timing bands.

Act cells are median cleared-room seconds /median incoming damage per attempted room; death attempts count in damage.

| Profile | Rig | Act1 | Act2 | Act3 | Act4 |
|---|---|---:|---:|---:|---:|
| Before | Breacher | 27.64 / 0.00 | 38.64 / 12.49 | 38.19 / 13.94 | 48.98 / 41.06 |
| Before | Cryo | 28.91 / 0.00 | 42.50 / 11.08 | 39.06 / 16.89 | 48.74 / 41.52 |
| Before | Pyro | 24.18 / 0.00 | 34.63 / 12.49 | 34.35 / 14.20 | 43.37 / 49.26 |
| Before | Arc | 24.07 / 0.00 | 33.99 / 0.00 | 35.77 / 0.00 | 43.97 / 12.08 |
| Before | Pooled | 26.13 / 0.00 | 37.42 / 10.41 | 36.69 / 13.49 | 46.02 / 31.56 |
| Final V33 | Breacher | 29.38 / 0.00 | 37.66 / 23.39 | 38.42 / 41.96 | 43.35 / 57.39 |
| Final V33 | Cryo | 33.23 / 0.00 | 41.72 / 18.95 | 40.30 / 61.98 | 46.22 / 78.94 |
| Final V33 | Pyro | 24.77 / 0.00 | 32.38 / 13.83 | 33.68 / 45.21 | 39.72 / 62.33 |
| Final V33 | Arc | 27.33 / 0.00 | 33.71 / 10.53 | 34.73 / 28.59 | 40.83 / 38.60 |
| Final V33 | Pooled | 28.31 / 0.00 | 36.62 / 13.57 | 36.67 / 41.69 | 43.35 / 61.13 |

Every final rig has strictly rising act damage medians; pooled **0→13.5725→41.6924→61.1306**. Individual rooms fluctuate; pressure is not asserted monotonic room by room.

Per-depth cells are clears/attempts; median clear seconds; median incoming damage. Full per-rig p10/p90/ranges and V30 intermediate rows remain in the linked archive.

| Room | Before | Final V33 |
|---|---|---|
| 1 | 160/160; 19.61; 0.00 | 160/160; 19.93; 0.00 |
| 2 | 160/160; 28.27; 0.00 | 160/160; 28.68; 0.00 |
| 3 | 160/160; 28.66; 0.00 | 160/160; 32.42; 0.00 |
| 4 | 159/160; 23.28; 0.00 | 160/160; 26.28; 12.29 |
| 5 | 159/159; 30.60; 0.00 | 160/160; 33.13; 0.00 |
| 6 | 159/159; 38.42; 12.49 | 160/160; 36.54; 12.64 |
| 7 | 159/159; 30.28; 0.00 | 160/160; 32.23; 10.74 |
| 8 | 159/159; 28.10; 0.00 | 160/160; 28.77; 13.57 |
| 9 | 159/159; 38.18; 13.20 | 160/160; 35.78; 18.67 |
| 10 | 159/159; 64.47; 24.37 | 160/160; 64.88; 23.27 |
| 11 | 159/159; 35.52; 13.39 | 159/160; 34.62; 31.36 |
| 12 | 159/159; 37.65; 11.24 | 156/159; 34.67; 36.85 |
| 13 | 159/159; 37.52; 13.59 | 156/156; 37.86; 51.11 |
| 14 | 159/159; 34.78; 13.68 | 150/156; 34.97; 46.03 |
| 15 | 158/159; 37.91; 26.04 | 140/150; 39.44; 48.10 |
| 16 | 153/158; 57.35; 56.00 | 122/140; 51.70; 57.35 |
| 17 | 147/153; 39.50; 14.40 | 117/122; 37.05; 41.50 |
| 18 | 145/147; 37.02; 26.57 | 106/117; 33.78; 73.79 |
| 19 | 145/145; 41.15; 14.59 | 105/106; 40.87; 42.95 |
| 20 | 137/145; 68.15; 56.30 | 78/105; 58.33; 115.00 |

| Profile | Rig | Natural death rooms |
|---|---|---|
| Before | Breacher | 16×2, 17×5 |
| Before | Cryo | 20×2 |
| Before | Pyro | 4×1, 15×1, 16×2, 18×2, 20×6 |
| Before | Arc | 16×1, 17×1 |
| Before | Pooled | 4×1, 15×1, 16×5, 17×6, 18×2, 20×8 |
| Final V33 | Breacher | 12×3, 14×1, 15×5, 16×4, 18×3, 20×6 |
| Final V33 | Cryo | 11×1, 14×2, 15×1, 16×1, 17×1, 18×2, 20×8 |
| Final V33 | Pyro | 15×4, 16×8, 17×1, 18×5, 20×8 |
| Final V33 | Arc | 14×3, 16×5, 17×3, 18×1, 19×1, 20×5 |
| Final V33 | Pooled | 11×1, 12×3, 14×6, 15×10, 16×18, 17×5, 18×11, 19×1, 20×27 |

Final deaths span **rooms11–20**, within the requested9–20 range; none occur in acts1–2. The finale accounts for27/82 deaths, with the remaining55 spread across eight other late rooms. This exposes the remaining late emphasis rather than claiming equal risk at every depth.

Campaign outgoing shares retain their real source buckets; direct ability or combined nonweapon is not isolated causal rig attribution.

| Profile | Rig | Weapon % | Direct ability % | Status % | Boon % | Nonweapon % |
|---|---|---:|---:|---:|---:|---:|
| Before | Breacher | 58.88 | 20.25 | 3.87 | 17.00 | 41.12 |
| Before | Cryo | 48.02 | 20.15 | 6.19 | 25.64 | 51.98 |
| Before | Pyro | 46.41 | 18.98 | 17.72 | 16.89 | 53.59 |
| Before | Arc | 61.10 | 27.46 | 3.29 | 8.15 | 38.90 |
| Final V33 | Breacher | 62.46 | 22.90 | 3.54 | 11.09 | 37.54 |
| Final V33 | Cryo | 49.26 | 19.51 | 7.25 | 23.98 | 50.74 |
| Final V33 | Pyro | 44.83 | 22.28 | 19.09 | 13.80 | 55.17 |
| Final V33 | Arc | 62.19 | 28.25 | 3.03 | 6.53 | 37.81 |


### Unchanged full-kit and crawler guards

The original full-kit assertions remain30–45% for every rig and maximum1.25× clear-time spread, all four slots used, at least one earned V, equal composition/kills/total damage and a finite clear. The V33 source-matched probe yields:

| Rig | Attributable ability share | Clear seconds |
|---|---:|---:|
| Breacher | 30.3797913% | 93.45 |
| Cryo | 31.3477442% | 94.65 |
| Pyro | 43.8683875% | 77.75 |
| Arc | 31.7658108% | 90.80 |

Spread **1.217363344×**; weapons-only and complete Breacher/Pyro/Arc result objects are unchanged from V30. Basic crawler starting shotgun/rifle TTK is **1.000× old in every act**, below the unchanged1.15× ceiling; basic health and starting weapon values are exact. Catalog cooldowns remain Q6–9s/F12–18s. Native/augmented dash uptime guards remain>.16/<.19 and>.24/≤.35 respectively. Physical threat/TTK envelopes and legacy digests remain independent of campaign success estimates. [Exhaustive test/numeric audit](I5-NUMBER-AUDIT.md).

## 2. Capture labels and first images to inspect

Final Cryo capture label **`i5-v33-cryo-7ec8506`** uses immutable `approved-dist-7ec8506`, application fingerprint `bae6151eda06baa4bebda53cbdd05e910672800ad3aa377d4e6575b3d2761054`. The registered rig/Nova capture passes5PNGs/27.79s/exit0; the separate public-action native Shift→Q fixture passes with exactly1dash/1Q, actual pre-chilled target frozen at0/750/1499ms and thawed at1500ms, errors empty. No status/snapshot was injected. Unequal boundary intervals are deliberate, not an even-time motion sample. Both staged fixtures are separate from organic balance campaigns.

1. [Final Cryo1.5s tooltip and stats](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-v33-cryo-7ec8506/cryo-nova-catalog-tooltip.png)
2. [Final native Shift→Q freeze boundary](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-v33-cryo-7ec8506/native-q-freeze-sprite.png)
3. [Final Cryo rig screen](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-v33-cryo-7ec8506/rig-select-cryo.png)
4. [Final-build three-room smoke early fight](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-continuation/v33-gates/playtest-final-attempt1/hardest-sprite.png)
5. [Earlier unchanged Railbreaker anticipation/impact](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-selected-railbreaker/anticipation-sprite.png)
6. [Earlier held-meter fixture, unchanged Arc path](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final-f496476/held-overdrive.png)
7. [Earlier cinematic title](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-v3-final/title.png)
8. [Final-build organic Breacher pressure](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-v33-native-a-7ec8506-breacher-1729/hardest-sprite.png)

I opened the actual V33 tooltip, rig card and native boundary sheet. The selected focus ring,1.5s/9s/18s text and full tooltip are readable without clipping. Ice remains visible through1499ms and disappears at1500ms while CHILLED correctly remains. The stacked brute/marine fixture and pale Nova flashes can hide the marine; the boundary receipt proves runtime duration, not organic combat readability. Prior critique/fix rounds and Railbreaker250ms/420damage, held NEXT ROOM, Pyro6/12s, recovery and earned low-health swarm reviews remain in [the source-scoped calibration report](I5-AIM-NATIVE-FINAL.md). These earlier images retain their real V30/f496 identities; the changed V33 client is not called byte-identical. No renderer correction or frame-budget claim is made. I also opened the final Breacher1729 earned Safety-interlock sheet:19HP, empty ammo, dense specialist/elite threats, green projectile lanes and orange charge circles make the pressure visible, while body overlap near the left wall can hide the marine. This is a real low-health moment from a completed campaign, not an injected swarm or a frame-budget measurement. All fresh full-campaign receipts are complete below.

## 3. Gate results

All seven requested gates pass on7ec8506, with desktop assertions and existing time bounds unchanged. Browser gates ran serially on their first attempts. Logs: `artifacts/nextgen/i5-continuation/v33-gates/`; [root receipt](../../artifacts/nextgen/i5-continuation/v33-gates/root-gates.json).

```text
Vitest: Test Files  238 passed | 1 skipped (239)
        Tests       2835 passed | 1 skipped (2836)
Node Cryo-preview geometry: tests 2; pass 2; fail 0
Build: tsc --noEmit passed; ✓ built in 522ms
Room evidence: tests 28; pass 28; fail 0
               {"passed":true,"cpuOnly":true,"checks":33}
Smoke: Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
Authored: passenger-vault, breached-loading-bay, overload-floor passed; errors:[]
Playtest smoke: room-limit; 3 rooms cleared; 0 errors; errors:[]; defects:[]
All seven command exits: 0

```

Browser receipts: [desktop smoke](../../artifacts/nextgen/i5-continuation/v33-gates/smoke-attempt1.receipt.json), [authored rooms](../../artifacts/nextgen/i5-continuation/v33-gates/authored-attempt1.receipt.json), [playtest smoke](../../artifacts/nextgen/i5-continuation/v33-gates/playtest-attempt1.receipt.json). Wrapper durations154.64/30.35/118.32s; playtest's actual report wall117.4103s. The explicit Vitest gate took362.67s. Playtest smoke’s235s wall bound is unchanged. Authored log retains an occupied Vite WebSocket port24678 message; all three actual room assertions pass with page errors empty, and no unrelated process was touched.

The required `VITEST_MAX_WORKERS=1 npm run verify` also ran on final source. Its full suite passed238files/2835tests plus1existing opt-in performance-profile skip in315.55s; Node Cryo-preview geometry checks passed2/2. It then stops at the documented pre-existing Python asset prerequisite, `FileNotFoundError: 'blender'`, overall **exit1**. Blender was not installed and those tests/assets were not altered. Standalone required gates run independently. No gameplay, accessibility or persistence assertion or timeout was weakened; the one opt-in skip is unchanged and not a desktop assertion.

## 4. Tests rewritten or added, and why

[The exhaustive numeric/test audit](I5-NUMBER-AUDIT.md#assertion-audit-and-guarantees) and [all physical-budget range migrations](I5-AIM-EXPERIMENTS.md#deterministic-test-assertion-migration-for-the-shared-v24v26-encounters) list each pin/reason. No gameplay, persistence, determinism, accessibility or safety threshold was relaxed.

- `I5AbilityAim`:27 real-catalog/native geometry regressions (cones/ScorchedFan, finite beam, clamped points, augments, Bulwark70 origin, empty-tip target LOS, chain/picking/read-only state). Frozen v3 focused selection:3 files/41 tests plus TypeScript.
- `I5OverdriveRoomLimit`:17 tests cover all rigs/strict ordinary rooms, direct use paths, accepted-use counts, held meter, truthful readiness/events/cache, pause/reload/active expiry, exceptions and old/new checkpoint continuation. `HudSystems` pins100% held meter and matching`NEXT ROOM` aria status.
- `I5Balance`/`I5ProductionProfile`:obsolete disabled-V21 pins become independent active-profile budgets/digests; legacy digests, original first-five prefixes/progression, real guardians/resistance and final48-request ramp/no early clear remain. All authorized counts, pools, damage/speed/elite/timing/champion numbers are explicit in the linked audit.
- Basic crawler HP equality and actual starting shotgun/rifle TTK≤1.15× old remain (frozen comparison1.000×). Physical EHP/contact/weighted budgets do not prove win rates.
- `A1AbilitySystem`/`A1AugmentGeometryReview`/`A1TimingGeometryReview`:Pyro220 travel,25 damage/instantQ,6.5 Napalm/150ms cast/400ms first pulse, Meltdown1.4 and Arc8/18 cooldown pins reflect selected values. Retain exact LOS/shape/augment/lifetime/status/partition assertions. New cooldown test:Q5999+1ms/F11999+1ms, not rejected6999/12999. Railbreaker has no impact through249ms, then420-damage original-shape impact after1ms. Capture fixtures now call the existing `fillOverdrive()` helper in both staged/native-input paths, replacing stale6000-damage grants; all4 capture-contract tests pass and actual Railbreaker/native-input fixtures are rechecked.
- Dash uptime bounds remain augmented>.24/≤.35 and native>.16/<.19. Full-kit30–45% share/≤1.25× clear spread remain untouched; no500ms immunity API remains. V29 Seismic110/120 and its extra100ms cache-fixture setup were reverted; original90/220 and2600ms observation/3540ms Q remainder are restored.
- `A1GameIntegration`:only repeated-cast stress fixture moves to canonical Transmission, preserving>2 Overdrives and every bounded/finite/collision assertion. `StoryRoute` maximum nonholdout requests31→36 reflects late mixed waves; final48/holdout timing/climax remain.
- `I5Cadence`:earned seed1729 per rig checks first-five clears, death no earlier than9 if any, representative1.2–1.8 cadence with terminal quantization and≤1 ordinary V. Cohort median target remains1.2–1.7.


- `scripts/nextgen/playtest/sim-native-emulation.test.mjs`:12 backend cases (7 actual InputController/EventTarget sequences and5 observation/deadline contracts) pin immediate-key facing, grenade intent, cross-route300-event FIFO, sync-corpse filtering, living Queen/nest pressure and censor-before-burst order. These fix the Node emulator, not the frozen native policy.
- `A1AbilitySystem` Nova freeze receipt1800→1500ms and `HudSystems` tooltip1.8→1.5s match the approved control window. Exact recipients,30 damage,210 radius,LOS/status ordering and generic requested-duration/resistance invariants remain unchanged.
## 5. Integration requests and ownership

No edits under `src/render/**` after the `nextgen` merge. Manual-control preparation holds, transient restart GLTF texture-blob errors and CPU headroom remain with the graphics owners; raw playtest receipts retain errors, full holds, threshold defects, host load, bounded waits and real terminal outcomes. No performance certification.

No new files require integration changes outside this branch. Checkpoint version1 is unchanged. Omitted old abilities/stats load and continue, meter round-trips, corrupt records stay rejected; the per-room activation counter is transient and reset at room/run boundaries (including clear, death and rig selection). Legacy graph-v1/v2 encounter plans and progression records remain identical, while global rig changes also affect legacy kits. Actual policy-v3 assisted Arc1729 on f496 cleared12/12, Queen139.70s,536kills,13Overdrives,40.2528 incoming,350.3134s wall, errors/defects empty. Its assisted15% incoming and historical360s Queen bound are explicit; it is excluded from organic story totals. Arc/legacy parameters are unchanged by the Nova-only V33 delta.

### Final native confirmation and calibration limits

**Eight actual unassisted browser campaigns reached natural terminals:6 complete and2 dead;0 played censors.** One additional zero-room startup error is retained. Thus completion is **6/8 played (75%)**, or **6/9 across all retained process attempts (66.67%)**. No native or Node sample is pooled with the other. Seeds1729/2718 for every rig; all runs use frozen7ec8506/immutable V33 distribution and policyv3, `--fast`, at most2owned browsers. No old campaign is reused. [Complete final native report](I5-NATIVE-FINAL-V33.md), [tracked raw hashes, tables and cleanup evidence](evidence/I5/I5-NATIVE-FINAL-V33.json), archive SHA256 `60238c5f0320d5fba28ac8aa6ffe942a4ff98c8b82982bcd62f288330077b05c`.

| Rig / seed | Actual native ending | Matched Node ending | Incoming damage | Accepted V | Process exit |
|---|---|---|---:|---:|---:|
| Breacher /1729 | complete20/20 | dead room12, 11clears | 767.87 | 16 | 1 |
| Breacher /2718 | complete20/20 | complete20/20 | 547.41 | 16 | 0 |
| Cryo /1729 | complete20/20 | complete20/20 | 750.61 | 14 | 0 |
| Cryo /2718 | complete20/20 | dead room14, 13clears | 1186.25 | 14 | 1 |
| Pyro /1729 | complete20/20 | dead room20, 19clears | 441.31 | 14 | 0 |
| Pyro /2718 | dead room20, 19clears | dead room20, 19clears | 581.04 | 16 | 0 |
| Arc /1729 | complete20/20 | dead room17, 16clears | 527.45 | 17 | 0 |
| Arc /2718 | dead room14, 13clears | dead room14, 13clears | 245.74 | 8 | 0 |

The original Breacher2718 attempt timed out waiting for the initial debug-ready hook (runner193,20000ms), played0rooms and exited1. Its complete error report remains; the single authorized same-seed retry ran only after shardB closed and completed20/20 with unchanged source, policy and deadlines. The repeat does not replace the original error in the all-attempt denominator. All8 played campaigns have errors empty. Breacher1729 and Cryo2718 exit1 solely because their retained preparation defects remain failures at process level; actual campaign endings are not inferred from exit code.

| Rig (N2) | Native complete | Distance from75% native mean | Median rooms/V | Strict ordinary s | Transmission s | Act1/2/3/4 incoming medians | Direct ability share |
|---|---:|---:|---:|---:|---:|---|---:|
| Breacher | 100% | +25pp | 1.2500 | 30.39 | 60.53 | 0.00 / 16.94 / 29.46 / 72.83 | 25.49% |
| Cryo | 100% | +25pp | 1.4286 | 37.70 | 77.52 | 0.00 / 13.10 / 34.31 / 71.88 | 20.06% |
| Pyro | 50% | -25pp | 1.3080 | 27.56 | 57.60 | 0.00 / 6.32 / 23.16 / 39.52 | 22.35% |
| Arc | 50% | -25pp | 1.4007 | 28.50 | 63.12 | 0.00 / 0.00 / 52.72 / 53.99 | 30.10% |

Pooled native strict ordinary **29.6417s** (below30), broad nonholdout **32.1917s**, Transmission **66.325s**, cap **0/101 ordinary attempts**, opening40/40 clears; incoming act medians **0.00→10.63→34.93→60.24**. Natural deaths are room14×1 and room20×1. The native point estimates **miss completion40–60%, rig distance≤15pp and strict ordinary30–45s**; individual Cryo77.525s/Pyro57.60s Transmission also miss their bands. N2/rig is descriptive, not certification; the played overall Wilson95 interval is40.93–92.85%. This is a visible limitation, not a rounded pass or a reason to tune from two seeds.

Matched Node runs complete2/8 versus6/8 native; exact outcome/clear-count/death-room agreement is4/8. All131common-cleared-room boon lists match; median absolute time/damage deltas are0, but time-delta p90/max7.47/22.57s and damage p90/max47.78/95.33 show material later divergence. Unequal endpoint totals compare different exposure; common rooms and every per-room delta remain in the archive. These observations validate shared early behavior and expose approximate projection/picking limits; they do not validate exact native death predictions or prove native population targets.

Eight medium preparation-threshold defects are retained, with the maximum full hold **44.025s in Cryo2718 Manual-control chamber**. Full elapsed holds and first threshold timestamps are separate; none is filtered or converted to a gameplay death. No texture-blob console error was recorded in these eight played campaigns. Initial host loads were34.40/89.95/183.29 and33.01/88.74/182.32 on10logical cores; all intermediate/end observations are archived. Game-clock timing and diagnostic GPU decimation are not a performance certificate. All3queue/retry sessions were reaped, every tracked owned browser/server closed, remaining owned processes empty, and no signals sent to unrelated processes. Final source receipt still matches all21application files and4policy files at7ec8506.

## 6. Known gaps and human playtest

Node/native agreement is approximate: native projection/picking, RAF/resource synchronization, GPU/audio/DOM and shared-host load can materially change trajectories. The v8 fixes address confirmed sequencing defects but do not establish exact endpoint parity. The final native sample exposes its completion/pacing misses and differences; N2/rig cannot establish precise population win rates. A larger paired native cohort and closer projection/picking calibration are needed before claiming the native population difficulty band. Statistical and per-rig timing variations are not concealed by pooled target flags.

Human review should check Railbreaker's250ms anticipation versus420-damage impact, Q/F/V target agreement and warnings, held-meter clarity and elite/holdout availability, welcoming first-five rooms versus varied late pressure, Transmission's climax, Cryo's1.5s freeze and melee Breacher versus area-denial Pyro. Exercise real focus/resize/zoom/graphics recovery, Continue/persistence and assisted legacy Queen pacing. Dense Afterburn bodies/pale flashes and elite swarms can hide the marine; that readability concern remains with the graphics owners. Simulation and staged captures do not certify fun, frame budgets, sound/world-art quality or an AAA feel.
