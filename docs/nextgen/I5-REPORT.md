# I5 — integration and balance checkpoint

**I5 is incomplete. No difficulty profile has been accepted.** The branch is `t3/integrate-playtest-balance-tuning`; implementation checkpoint `4f6a79391e91b70fb6be13b16954dbbb03628671` (game-profile checkpoint `9abc6c2c75cc7ba453fd113a1ff4375541ba587a`). The final documentation-only HEAD is supplied in the handoff. Nothing was pushed; no PR, other-worktree modification or `src/render/**` edit was made.

The fixed-policy difficulty and rig-spread targets remain unmet, as does the ordinary-room Overdrive cap. The scope question is whether to correct the shared player's cone aiming and rerun matched baselines, or preserve its combat decisions exactly. The target, weapon, ability-opportunity and combat-spacing helpers remain unchanged; the navigation-observer correction has its own versioned baseline below. No cone-aim correction was applied. Per `01-ENGINEERING.md` (“If you cannot finish something, land it behind a clearly named constant/flag and say so”), unaccepted encounter changes are isolated behind **`I5_ENCOUNTER_TUNING_ENABLED = false`**. Production retains the requested charging/Transmission starting trial and the merged encounter profile. Passing checkpoint gates do not establish final balance acceptance; eight final native campaigns remain pending.

## 1. What shipped

- Merged R4 `730af13` into F2 base `e97fe10`, merge commit `76e744d`, preserving both behavior sets.
- Active starting values: earned Overdrive `damage / 12000 + kills × .0125`, Dynamo ×1.3; Transmission 32 requests at 750 ms. No rig damage/cooldown or basic enemy-health increase.
- Reusable render-free campaign player, immutable source snapshots/hashes, low-concurrency native batch runner, optional native draw decimation, explicit profile provenance and aggregation that keeps deaths, censoring, assistance, graph and profile transitions visible.
- Marine-only read-only navigation recovery for known bot stalls; no enemy navigation, collision, movement-speed, resource or room-clear bypass. Final observer policy is `i5-navigation-observer-v3`.
- Default-off V21 encounter experiment plus deterministic tests. Production plans/progression match frozen merged-game hashes over all nodes in ten seeds for graphs v1/v2/v3, normalizing only Transmission. Optional enemy timing/champion multipliers default to the old values. No checkpoint format change.

### Conflict resolutions

| File | Resolution |
|---|---|
| `scripts/nextgen/README.md` | Retained F2/V2 presentation instructions and all R4 player/clock/recovery documentation. Added explicit I5 modes without replacing either. |
| `scripts/nextgen/debug.ts` | Kept native input, clock/readiness and live observation alongside F2 presentation timing. Assisted hurt retains source bearings; absent origins retain the old one-argument call. Native readiness includes application-wide `screens.graphicsBlocked`. |
| `src/ui/application.ts` | Preserved hit-stop accumulator hold, focused UI/gameplay separation, every-screen graphics-loss blocking, stale Continue refresh, lazy renderer/audio/templates and deferred optional physics; added R4 diagnostic seeds and passive/native samples. |
| `ScreenManager.ts` | Preserved repeated-Tab traps, inert background, entry/return focus, Escape, zoom-scrollable drawers and graphics recovery. Applied unique title `menu-credits` ID on all launcher/return paths. |
| `templates.ts` | Preserved F2's lazy extraction; the title Credits change belongs in `initialTemplates.ts`, not a duplicated old title template. Retained R4 service availability/copy. |
| `SafeRoomLoading.test.ts` | Combined F2 graphics-block/optional-presentation state with R4 native-frame sample stubs. Original loading assertions remain. |

Integration verification before delegation: **16 files / 167 tests passed**, build passed, native Arc1729 three-room smoke **3 clears, 0 errors/defects, 72.84 s wall**. Later full checkpoint gates are below.

### Measured production checkpoint

The same ten seeds per rig are used in each matched tuning cohort: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. Both rows below use the frozen navigation-v3 decision code. The corrected baseline loads game revision `76e744d`; the checkpoint explicitly records the disabled flag. No assistance, granted boons/charge/health, spawned test enemies or skipped clears enter these campaign results.

| Rig | Baseline → checkpoint completion | Median rooms/Overdrive | Ordinary median seconds | Transmission median seconds |
|---|---:|---:|---:|---:|
| Breacher | 100% → 90% | .678 → 1.333 | 35.08 → 35.87 | 86.63 → 68.03 |
| Cryo | 100% → 100% | .702 → 1.429 | 34.93 → 38.09 | 93.30 → 72.84 |
| Pyro | 70% → 40% | .728 → 1.429 | 31.15 → 32.10 | 74.67 → 58.27 |
| Arc | 100% → 90% | .690 → 1.333 | 32.51 → 34.65 | 70.32 → 60.24 |

Pooled completion **37/40 (92.5%) → 32/40 (80%)**; Transmission **80.475 → 66.350 s**; ordinary room time **33.65 → 35.10 s**. Every rig's median cadence meets 1.2–1.7, but **ten ordinary-room attempts still use two Overdrives**: Breacher 3, Pyro 3, Arc 4, Cryo 0. Authored elites 6/16 and holdouts 10/20 are excluded from that count; disabled experimental guardians are not silently reclassified. Difficulty remains too easy overall; Pyro is 40 points below the mean and Cryo 20 above.

Both selections clear **200/200 first-five-room attempts**. Checkpoint pooled act damage medians rise **0 → 12.58 → 13.68 → 41.34**; Breacher has an act-3 dip and per-depth fluctuations remain visible. Death histogram is **15×1, 16×1, 17×4, 18×1, 20×1**. The requested broad depth pressure/distribution is not accepted.

Full per-act/per-depth times, damage, source shares, p10/p90 distributions, ten two-use exceptions, source hashes and comment-only source differences are in [I5-PRODUCTION-CHECKPOINT.md](I5-PRODUCTION-CHECKPOINT.md). Its source snapshots predate comment-only edits at `9abc6`; six meaningful TypeScript token sequences match, while both raw SHA sets are retained. No raw/game-hash identity is claimed.

### Experiments and calibration

[Original/corrected experiments](I5-EXPERIMENTS.md) and [V5–V21, reserved seeds and native probes](I5-LATE-EXPERIMENTS.md) preserve every completed controlled cohort, including failed directions. A separate V17 validation set used **1000–1009** per rig, declared before reading its outcomes. Combined V17 has **20 seeds per rig**, **33/80 endings (41.25%)**, but rig rates **25/65/15/60%** still fail spread. No candidate was selected by pooled completion alone. Early navigation-censored/interrupted pilots are separate; they are not gameplay deaths or accepted cohorts.

The simulator uses real `DepthGame`, 60 Hz GameFeel stepping, 250 ms shared policy, native movement scaling, held-pointer rays, real model metrics and shared camera/event helpers. It is render-free, not an exact native outcome predictor. Original-policy Arc1729 calibration matches 570 kills and total outgoing damage, with 14/20 exact room times, 32 versus 31 Overdrives and 136.69 versus 163.86 incoming damage. Later Breacher/Pyro probes include terminal disagreements. V18 Pyro1729 dies in native room18 where Node completes; 2718 agrees on death in room14. All raw receipts remain. See [I5-SIM.md](I5-SIM.md), [native probes](I5-NATIVE-PROBES.md) and the experiment archive for limitations.

Native `--fast` keeps every scene/camera/input/simulation tick and omits intermediate raw GPU submissions only. The first three Arc rooms had identical stats/resources/run state and discrete decisions, with aim deltas below 1e-9 px; wall time 90.13 → 47.49 s. The original full-campaign Node sample was about 24.3× faster than its native baseline. Neither result is a production CPU/GPU certificate or a claim of 50× throughput under shared load. Default smoke/capture draw every tick.

The [executed cone-policy proof](I5-POLICY-LIMITS.md) uses the real AbilitySystem: a nearby crawler triggers Q while a distant spitter remains the selected aim; the accepted base Flashfire hits neither and consumes its cooldown. Counterfactual close-threat aim hits for 40 damage. This proves a possible wasted cone, not the cause of every campaign death. It is shared by both backends. Correcting it would require a new policy epoch and fresh matched baseline, so the lead's scope choice remains pending.

### Every active numerical change

| Parameter | Merged game → production checkpoint | Reason / result |
|---|---|---|
| Damage contribution divisor | 6,000 → 12,000 | Requested starting trial; median cadence moves into target. |
| Charge per kill | .025 → .0125 | Halve the second contribution consistently; ordinary-room exceptions remain. |
| Dynamo | ×1.3 unchanged | Existing “30% more charge” copy remains true. |
| Transmission count / request interval | 40 / 900 ms → 32 / 750 ms | Pooled median 66.35 s; pressure still requires killing every queued request. |
| Transmission last request | 35,750 → 23,900 ms | Consequence of count/cadence; pending warning delay remains 650 ms. |
| Final holdout | 48 / 900 ms unchanged | Larger authored climax retained. |
| Basic health / rigs / recovery economy / saves | Unchanged | Starting-weapon TTK, rig identity, old checkpoints and service correctness retained. |

### Disabled V21 profile — review values, not shipped difficulty

All rows below are **off in production**. Earlier alternatives and every old→trial value are preserved in the experiment reports/JSONs.

| Parameter | Merged game → disabled V21 | Purpose tested |
|---|---|---|
| Pressure ramp | 0 → `max(0, depth−4)/15`, except Transmission | Preserve opening rooms; depth is zero-based. |
| Damage | Old × `(1 + pressure×.18)` × .60 in rooms11–19 / .90 in room20 | Calibrate individual hits against denser elite mixes. |
| Speed | Old × `(1 + pressure×.05)` | Pursuit pressure without basic HP inflation. |
| Elite HP | 1.65 → 1.08 from room6 | More frequent control-resistant elites remain quick to kill. |
| Elite damage | 1.20 → 1.05 in rooms6–10; 1.20 elsewhere | Keep act2 approachable. |
| Ordinary elite chance | 0 → `.14+(depth−5)×.018` in rooms6–9; `.60+(depth−10)×.01` from room11 | More control-resistant threats; Transmission unchanged. |
| Authored elite room16 chance | .22 → .65; first always elite | Late elite pressure. |
| Guardians | Warden6 / Matron16 → add Wardens9/13/19 | Spread champion checks; each first guardian is elite. |
| Warden13 HP / contact | 760 / 28 → 1,140 / 30.8 | Few-add single threat to test recovery-heavy builds. |
| Warden19 HP / contact | 760 / 28 → 1,368 / 35 | Late champion pressure; not normal enemy HP. |
| Other champions | Original HP/damage unchanged | Warden6/9 760/28; Matron16 1,150/24. Armor, radius, speed and rewards stay fixed. |
| Warden13/19 encounter count | 20 / 25 → 9 each | One Warden plus eight crawlers; fewer recovery/chain targets. |
| Other late nonholdout counts | Existing formula + 2 | Keep wave duration/tempo after reducing brood loops. |
| Rooms6–9 pool | Old depth pools → crawler2/spitter2/stalker1/carrier1 | Ranged/flanking mix after welcoming opening. |
| Other rooms11–20 pool | crawler2/brute1/spitter2/stalker1/carrier1 → crawler3/brute1/spitter4/stalker2 | No ordinary carrier recovery/charge loop; Matron's forced first carrier stays. |
| Story cap | Ceiling18 → 20 before room11 / 15 later | Normalize live bodies after removing brood reservations. |
| Ordinary cap addition | 0 → `min(2, floor(depth/5))` | More overlapping threats. |
| Six-request packet interval | 1,100 → 950 / 850 / 750 ms in acts2/3/4 | Tighter spawning instead of normal HP growth. |
| Within-packet interval | 100 → 90 ms after act1 | Slightly tighter wave pressure. |
| Ordinary late elite-brute initial / warning / repeat | 1,500 / 850 / 4,600 → 5,000 / 1,150 / 6,500 ms | Test a fair first response window alongside more elite brutes. |
| Named Warden timing | 1,500 / 850 / 4,600 unchanged | Authored attack identity preserved; 330 velocity / 650 charge duration unchanged. |
| Experimental kill charge | .025 merged → .015 (production .0125) | Lower-HP mixes otherwise charged too slowly; disabled too. |
| Basic crawler HP, starting weapons, rig damage/cooldowns | Unchanged | Maximum baseline→candidate starting-weapon TTK ratio 1.000× in every act. |

No V21 acceptance is claimed. Its deterministic pressure/physical-budget pins protect the reviewable experiment, while separate default-off tests protect actual production.

## 2. Captures

Capture labels: `i5-integration` and refreshed `i5-checkpoint`, desktop 1280×720. The checkpoint has **seven verified frames plus one burst sheet, 42.39 s, zero errors/failures/font fallbacks**. Shop, recovery and impact sheets from both rounds were opened and inspected: controls/text fit, recovery remains visibly on hold with keyboard focus, HUD stays off the marine, and the impact burst shows the hold then resumed motion. No visual defect requiring an I5 layout change was found; no renderer/art-quality claim is made.

First files to inspect (absolute paths):

1. [Title](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-checkpoint/title.png)
2. [Title settings](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-integration/title-settings.png)
3. [Shop](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-checkpoint/shop.png)
4. [Graphics recovery](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-checkpoint/f2-recovery.png)
5. [Impact burst](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-checkpoint/feel-impact-fixture-awakening-bay-sprite.png)
6. [Provisional Pyro burst](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-v18-native-pyro-pyro-1729/hardest-sprite.png)

The Pyro sheet is a provisional-policy diagnostic, not final accepted balance evidence.

## 3. Gates

Checkpoint reruns; no assertion/timeout was relaxed:

- Unit/browser unit: **215 passed | 1 skipped (216 files); 2638 passed | 1 skipped (2639 tests)**, single worker, 371.77 s. An earlier two-worker run timed out two audio synthesis tests under shared load; serial rerun passed their unchanged 5-second limits. A fresh `VITEST_MAX_WORKERS=1 npm run verify` repeated the passing unit summary.
- Cryo Node: **pass 2; fail 0**.
- Build: **built in 2.40 s**; TypeScript clean. Existing large-chunk warnings remain.
- Room evidence: **pass 28; fail 0**; ragdoll **`{"passed":true,"cpuOnly":true,"checks":33}`**.
- Production browser smoke: **“Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.”** Combat Rig, audio wiring and checkpoint-feedback subgates also passed unchanged.
- Authored desktop smoke: **exit 0**, Passenger Vault / Breached Loading Bay / Overload Floor, desktop 1280×900, low tier, real keyboard movement/fire, **`errors:[]`** for each; Overload retains explicit fatal authorization.
- `playtest:smoke`: **“smoke: room-limit; 3 rooms cleared; 0 errors”**; JSON additionally records **0 defects**, **`tuningEnabled:false`**, **66.16 s wall**, within the unchanged 235-second limit. This is three clears, not a campaign ending.
- Checkpoint capture: **“7 PNGs in 42.39s”**, plus the burst sheet; manifest **`errors:[]`, `failures:[]`, `fontFallbacks:[]`**.

`npm run verify` reaches the documented pre-existing Python failure: **`FileNotFoundError: [Errno 2] No such file or directory: 'blender'`** in monitor asset tests. Blender was not installed; tests/assets were not changed. Standalone remaining gates are run separately because the verify chain stops there. Logs and the machine-checked `checkpoint-summary.json` receipt are in `artifacts/nextgen/i5/gates/`.

Authored-smoke stdout receipts:

```json
{"id":"passenger-vault","file":"passenger-vault-desktop-hud.png","viewport":{"width":1280,"height":900},"quality":"low","state":"playing","room":"Passenger vault","input":"real keyboard move/fire","explicitFatalAuthorization":false,"errors":[],"sha256":"6a245c17df186f06dd74a0f90ae1601d3e06dc76711cf6507e62d65b75a31995"}
{"id":"breached-loading-bay","file":"breached-loading-bay-desktop-hud.png","viewport":{"width":1280,"height":900},"quality":"low","state":"playing","room":"Breached loading bay","input":"real keyboard move/fire","explicitFatalAuthorization":false,"errors":[],"sha256":"8e52cee30326354305660eac440eb10210502b41130f1b2781c9950912c2f93c"}
{"id":"overload-floor","file":"overload-floor-desktop-hud.png","viewport":{"width":1280,"height":900},"quality":"low","state":"playing","room":"Overload floor","input":"real keyboard move/fire","explicitFatalAuthorization":true,"errors":[],"sha256":"df512e32a05876cf57d32deb4e04a98bd126bee590dcf8f3fc5ee340a4884892"}
```

**Acceptance remains pending even if every listed checkpoint gate passes:** no accepted 40–60% / cross-rig profile exists, ten ordinary-room Overdrive exceptions remain, and the required two final native campaigns per rig have not been completed on accepted numbers.

## 4. Tests changed and why

No gameplay, persistence, accessibility, navigation or desktop assertion was removed.

- `A1AbilitySystem`: half-charge receipts `.25→.125`, `.75→.375`, Dynamo `.195→.0975`; added earned cadence/persistence coverage for all rigs. Temporary .015 trial expectations were restored to production .0125. Full-meter/spend/invalid-input assertions remain.
- Eighteen guaranteed-full fixtures `6000→12000` in A1 review/timing/launch/presentation/Overclock/integration, UI-audio and HUD suites. Assertions remain; `6000+40 kills` receipts that still fill are unchanged.
- `A1Balance`: Transmission count/composition pins only: 32 requests, crawler7/brute6/spitter9/stalker3/carrier7. The **30–45%** share, **≤1.25×** clear spread, every-slot use and earned-Overdrive assertions remain.
- `StoryRoute`: Transmission 32 / last request23,900; holdout differentiation, final48 and >30-second scheduled climax remain.
- `I5Balance`: real starting shotgun/rifle crawler TTK ≤1.15× old in every act (observed1.000×); first-five frozen plans; legacy/progression/save continuation; physical EHP/contact/density/threat budgets; real scheduled-elite resistance; no early clear while final requests remain. It explicitly mocks only the disabled experiment flag.
- `I5ProductionProfile`: six frozen digests over all nodes/ten seeds in v1/v2/v3; default-off production has no experimental fields, old guardian set/stats, exact old plans/progression except approved Transmission; charge arithmetic remains .0125.
- `I5ChargeTempo` / `I5ChampionProgression`: defaults replay identically; real timing, scope, locked target and fixed Warden cadence; optional champion multipliers never affect ordinary enemies. No new save fields.
- F2/R4 UI/loading/native-input tests retain all focus, inert, zoom, Escape, loading, stale Continue, graphics recovery and hurt-origin guarantees; Credits selectors use the unique ID.
- Fast-mode tests retain real scene ticks and guarantee draw restoration after errors. Navigation fixtures cover eight known terminal poses using legal collision-checked moves. Aggregation tests preserve deaths/censors and separate production/tuning/mixed continuation evidence.

Production full-kit observations: Breacher **32.064% / 91.50 s**, Cryo **32.363% / 91.35 s**, Pyro **41.158% / 81.60 s**, Arc **34.282% / 85.85 s**. Spread **1.1213×**; all slots used, one earned Overdrive each. Campaign `ability + status + boon` is not a causal rig-share measurement; full source tables remain separate in the checkpoint archive.

## 5. Integration requests

- **Lead:** resolve the combat-policy choice described in [I5-POLICY-LIMITS.md](I5-POLICY-LIMITS.md). If corrected, use a fresh policy epoch and matched baseline before further acceptance claims. If preserved, continue with the documented limitation; no cone-aim patch is silently applied here.
- **Graphics owner (Part C):** preparation holds, restart texture-blob errors and CPU headroom remain yours. No `src/render/**` changes were made. All loading holds, console/page/HTTP errors, timing windows and resource counts remain unfiltered in raw reports. Clean probes do not establish that historical issues are fixed.
- No dependency, license, checkpoint schema, push, PR or main-checkout integration request.

## 6. Known gaps and human checks

This is a safe integration/tooling checkpoint, not a completed difficulty overhaul. Node/native observation parity is approximate; the original R4 12-campaign sample and changed navigation epochs are not pooled. Ten-seed rates are noisy, but the additional V17 validation also fails spread. No production CPU/GPU headroom or world-art quality is certified. The vision’s per-fight power spike and balanced rig viability are not yet consistent: the ordinary two-use exceptions and rig-rate gap are concrete remaining feel problems, rather than accepted tuning.

Separate assisted legacy Arc1729 completes **12/12**, Queen **289.38 simulated seconds**, **18 Overdrives**, zero errors/defects, under the unchanged legacy encounter profile and .0125 charge. New default-field replays/digests retain that physical configuration. The longer Queen pacing than R4's 218.75 s deserves human review; this is not a final-story balance confirmation.

Next human checks: Overdrive anticipation before elites and the ten two-use ordinary cases; Transmission's rising pressure and climax; proper close-threat Pyro cone/Napalm use versus this player's ranged kiting; desktop resize/zoom and native keyboard focus; graphics-loss recovery and persistence feedback; late champion readability and legacy Queen pacing. The bot cannot judge fun, sound quality or AAA presentation. Do not enable the experimental flag for release until the open acceptance work is resolved.
