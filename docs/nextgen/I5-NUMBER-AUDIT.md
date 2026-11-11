# I5 numerical audit of the frozen aiming-v3 candidate

This is a source and assertion audit of **`e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`**, compared with corrected-aim baseline **`c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`** and earlier checkpoint **`b85ac3e`**. The catalog, AbilitySystem, EnemySystem, progression and director have no source differences between b85ac3e and c3bd53b; their baseline numerical values below are the same. Aiming policy and world integration have separate provenance.

**The selected profile is V33**, source **`7ec8506`**. Corrected mode-v8 evaluation of restored V30 with40seeds per rig failed strict completion spread: Cryo+16.875 and Pyro−15.625 percentage points from the50.625% mean. V33 changes only Cryo Nova's requested freeze1800→1500ms and matching catalog/stat copy; its fresh160-run cohort finished78/160 (48.75%), with strict maximum rig distance13.75pp and all120 non-Cryo authoritative reports equal to V30. All seven final-source gates passed; fresh native confirmation is complete, with native point misses and calibration limits explicitly recorded. The complete80-run mode-v7 comparisons and all seven gates/source/held-meter/Railbreaker receipts for earlier restored V30 remain historical evidence with their original source scope; they are not final corrected-backend/V33 receipts. This documentation audit ran no simulations, browser jobs, tests or builds.

The main tables describe frozen e97cf06. V30's **only additional Breacher change versus the original V27b-v3 profile is Railbreaker cast600→250ms**, retained in V33. Separate addenda preserve rejected V29/V31, restored V30 and selected V33. Current Pyro cooldowns are **Q6000/F12000ms** (original baseline8000/14000), dash distance220. No V29 Seismic110/120, Ram200, V31 cooldown7000/13000 or V32 cooldown8000/16000/dash240 is active. Cryo Nova now requests1500ms freeze; all other current V33 numbers match restored V30.

## Rig and meter changes

| Parameter | b85ac3e / c3bd53b production → frozen candidate | Scope / reason |
|---|---|---|
| Accepted Overdrives per ordinary story room | Unlimited → 1 | Graph v3, `kind=combat`, no planned guardian, excluding depths9/19. Count accepted activations only. |
| Meter after allowance is exhausted | Could activate again → still earns to1, held for the next room | Slot ready and Overdrive ready become false; optional `roomLimited:true`; no second charge consumption. |
| Ready event after allowance is exhausted | Emitted on filling → suppressed | Prevent an unavailable activation being announced. Reset restores eligibility; no new boundary event is required. |
| Damage charge divisor | 12000 →12000 | Unchanged in every graph. |
| Kill charge coefficient | Production .0125 →.0125 | Unchanged in every graph; the formerly disabled experimental .015 branch is removed. |
| Drive Dynamo | ×1.3 →×1.3 | Unchanged for both damage and kills. |
| Cryo Glacier cooldown | 15000 →18000ms | Less frequent control/deployable damage. |
| Pyro Afterburn travel | 150 →220 world units | Evasive distance; the runtime now reads the catalog dash shape. |
| Pyro Flashfire damage | 40 →25 per target | Shift sustained power toward placed Napalm while retaining weapon primacy. |
| Pyro Flashfire cast | 80 →0ms | Remove commitment before an evasive follow-up. |
| Pyro Flashfire cooldown | 8000 →6000ms | More frequent opportunities within the vision's Q range. |
| Pyro Napalm damage | 4.5 →6.5 per250ms | Placed area pressure. Its24 full-duration pulses total108 →156 base damage per victim, before burn or reactions. |
| Pyro Napalm cast | 350 →150ms | First pulse600 →400ms after press;250ms tick spacing remains. |
| Pyro Napalm cooldown | 14000 →12000ms | More frequent placed pressure within the vision's F range. |
| Pyro Meltdown speed | ×1.25 →×1.4 | +25% →+40% during its existing8s window. |
| Arc Overload cooldown | 7000 →8000ms | Less frequent chain damage/control. |
| Arc Tesla Pylon cooldown | 16000 →18000ms | Less frequent deployable pressure. |

These catalog/runtime rig changes apply to **all graph versions**. Legacy encounter and progression records are unchanged; legacy rig behavior is not byte-identical. Legacy validation must identify its actual compiled catalog and policy.

Breacher parameters are unchanged. Universal dash immunity **220ms**, travel duration **140ms**, recharge **2600ms**, charges **2**, and strip width **44** remain unchanged. Other rigs' travel remains150. Optional per-rig `invulnerableMs` is absent. Rejected320/500ms Pyro immunity and2500ms Pyro recharge are historical trials, not active values. Native rig burn remains2 per250ms for1.5s; refreshing preserves cadence. Napalm duration6000ms, ordinary radius120, triplet radius80, range480, and augment offsets are unchanged. Meltdown aura radius130, damage4 per250ms, duration8000ms, and kill burst20 within85 remain unchanged.

## Story progression: activation of formerly disabled parameters

`I5_ENCOUNTER_TUNING_ENABLED` changes **false →true**. Its branch was previously present but inactive. The following table compares actual production behavior, rather than treating dead branch literals as old gameplay.

Let `d` be zero-based story depth, `scaledDepth=d×11/19`, `act=min(2,floor(scaledDepth/4))`, and `p=0` in Transmission (`d=9`), otherwise `max(0,d−4)/15`.

| Parameter | Production → active candidate |
|---|---|
| Basic health multiplier | `1+scaledDepth×.045+act×.10` unchanged in every room |
| Base damage multiplier | `1+scaledDepth×.014+act×.035` unchanged |
| Extra damage | ×1 →×`(1+.18p)`; additionally×.72 for depths10–18; finale factor1.0 |
| Base speed multiplier | `min(1.14,1+scaledDepth×.008+act×.018)` unchanged |
| Extra speed | ×1 →×`(1+.05p)` |
| Elite health | 1.65 →1.08 from depth5; first five remain1.65 |
| Elite damage | 1.2 →1.05 at depths5–9;1.2 retained before and after that interval |
| Warden rooms, one-based | 6 →6/9/13/19 |
| Matron room, one-based | 16 →16 |
| Ordinary elite Brute first charge delay | 1500 →5000ms from depth10 |
| Ordinary elite Brute charge warning | 850 →1150ms from depth10 |
| Ordinary elite Brute repeat cooldown | 4600 →6500ms from depth10 |
| Warden charge timing | 1500 initial /850 warning /4600 repeat unchanged, including immediate promotion |
| Champion health/damage factors | Defaults1/1 →explicit1/1 after depth10; effective stats unchanged |

Transmission's ordinary health/damage/speed are unchanged. It receives the lighter elite-health configuration1.08 instead of1.65, but schedules no elites. The new charge/champion fields are absent before depth10 and in every legacy progression record. Ordinary non-elite Brutes still do not charge. Charge speed330, active charge650ms, target locking, ordinary enemy AI, attack damage mechanics and resistance conventions are unchanged.

Warden health760, armor120, contact28, speed88, radius28 and reward100 remain unchanged. Matron health1150, armor0, contact24, speed76, radius24 and reward150 remain unchanged. The earlier disabled V21 branch's Warden factors1.5/1.8 health and1.1/1.25 damage are removed; they are not reductions from old production champion stats.

## Director changes

| Parameter | Production → active candidate |
|---|---|
| Normal story count | `12+round(.7d)+5 if authored elite` →same plus2 in ordinary non-guardian depths2–8, plus8 in every non-holdout depth10–18 |
| Transmission | 32 requests at750ms unchanged from both audited baselines |
| Finale | 48 requests at900ms unchanged |
| Concurrency ceiling | 18 →20 before depth10;15 from depth10 |
| Ordinary concurrency bonus | 0 →`min(2,floor(d/5))`, excluding holdouts |
| Packet size / initial warning | 6 /650ms unchanged |
| Packet spacing | 1100ms →950/850/750ms in story acts2/3/4 |
| Within-packet spacing | 100ms →90ms after act1 |
| Ordinary elite probability | 0 →`.14+(d−5)×.018` at depths5–8; no elites in Transmission |
| Late elite probability | Ordinary0; authored elite `.10+.008d` →`.60+.01(d−10)` from depth10, including room16 and finale |
| Guardian marker | Added guardians have their first request forced elite, while preserving the branch's random call consumption |
| Mid pool, depths5–8 | Crawler2/Spitter1/Stalker1/Carrier1 (depth8 previously used the late pool) →Crawler2/Spitter2/Stalker1/Carrier1 |
| Late pool, depths10–19 | Crawler2/Brute1/Spitter2/Stalker1/Carrier1 →Crawler3/Brute1/Spitter4/Stalker2 |
| Named first request | Correct champion family retained; added Warden rooms begin with elite Brute |

The old pools remain in rooms1–5 and Transmission. Authored elite room6 still uses its existing elite probability `.10+.008d` after its guaranteed first elite. Added normal guardians at depths8/12/18 consume the same elite-probability roll as other normal requests before forcing the first marker. Late random Carriers are removed; the authored Matron first request is the exception. Carrier child reservations, Matron runtime broods and director occupancy accounting remain authoritative; scheduled-parent count is not the final kill count.

The story profile already contained disabled nine-request Warden duels at depths12/18; those are removed, restoring mixed waves of28/33 requests. Compared with the actual production baseline these rooms had20/25 requests, so their active count increase is8 each.

The table below is arithmetic from the source formulas, not a new simulation. Schedule tails are nominal request times; occupancy can delay actual dispatch. Damage/speed ratios compare ordinary base multipliers before applying family, elite or champion promotion behavior.

| Room | Scheduled parents old→new | Concurrency old→new | Last request ms old→new | Damage/base ratio | Speed/base ratio |
|---|---|---|---|---|---|
| 1 | 12 →12 | 7 →7 | 2250 →2250 | 1.000000 | 1.000000 |
| 2 | 13 →13 | 7 →7 | 2850 →2850 | 1.000000 | 1.000000 |
| 3 | 13 →15 | 8 →8 | 2850 →3050 | 1.000000 | 1.000000 |
| 4 | 14 →16 | 9 →9 | 2950 →3150 | 1.000000 | 1.000000 |
| 5 | 15 →17 | 10 →10 | 3050 →3250 | 1.000000 | 1.000000 |
| 6 | 21 →21 | 13 →14 | 4150 →3680 | 1.012000 | 1.003333 |
| 7 | 16 →18 | 11 →12 | 3150 →3000 | 1.024000 | 1.006667 |
| 8 | 17 →19 | 12 →13 | 3250 →3500 | 1.036000 | 1.010000 |
| 9 | 18 →18 | 13 →14 | 3350 →3000 | 1.048000 | 1.013333 |
| 10 | 32 →32 | 14 →14 | 23900 →23900 | 1.000000 | 1.000000 |
| 11 | 19 →27 | 15 →15 | 3950 →4230 | .771840 | 1.020000 |
| 12 | 20 →28 | 15 →15 | 4050 →4320 | .780480 | 1.023333 |
| 13 | 20 →28 | 16 →15 | 4050 →4320 | .789120 | 1.026667 |
| 14 | 21 →29 | 17 →15 | 4150 →4410 | .797760 | 1.030000 |
| 15 | 22 →30 | 18 →15 | 4250 →4500 | .806400 | 1.033333 |
| 16 | 28 →36 | 18 →15 | 5350 →4850 | .815040 | 1.036667 |
| 17 | 23 →31 | 18 →15 | 4350 →4400 | .823680 | 1.040000 |
| 18 | 24 →32 | 18 →15 | 4450 →4490 | .832320 | 1.043333 |
| 19 | 25 →33 | 18 →15 | 5050 →4580 | .840960 | 1.046667 |
| 20 | 48 →48 | 18 →15 | 42950 →42950 | 1.180000 | 1.050000 |

Scheduled parent totals by five-room act are **67/104/102/148 →73/108/142/180**; total421 →503. The first two plans are exact. First-five progression is exact and all original first-five request prefixes are protected; rooms3–5 append two requests each. Claiming all first-five plans are unchanged would be incorrect.

Legacy graph-v1/v2 director counts, pools, elite probabilities, concurrency, cadence, progression and champion timing remain unchanged. The original pre-I5 Transmission40@900 →32@750 change predates both audited baselines and must not be counted again in this continuation's delta.

## Assertion audit and guarantees

The unchanged full-kit harness requires **30–45%** damage share for each rig and a maximum clear-time spread **1.25×**, all four slots used, at least one earned Overdrive, equal enemy composition, equal kills and total damage, and a completed finite encounter. Its32-request Transmission fixture and53 actual kills remain. Campaign `ability+status+boon` is not a causal full-kit rig-damage estimate.

The existing60-second dash-budget test still requires augmented uptime **>.24 and≤.35**, native uptime **>.16 and<.19**, and runs every rig with all relevant augments and repeated cooldown-refund kills. The V26 failure was not resolved by relaxing these bounds. The final travel/immunity/recharge regression pins Pyro220 units /220ms /2600ms.

Every-room basic-crawler starting shotgun/rifle TTK still must be≤**1.15×** old production tuning. Basic health is additionally pinned equal to the old value over ten seeds. The current per-act physical TTK envelopes are±1ms around these immutable-reference bounds:

| Weapon | Act1 ms min–max | Act2 | Act3 | Act4 |
|---|---|---|---|---|
| Shotgun | 94.813–94.813 | 94.813–95.397 | 95.397–95.397 | 96.619–96.619 |
| Rifle | 444.901–444.901 | 444.901–561.430 | 561.430–678.561 | 678.561–678.561 |

These unchanged basic-HP/weapon trials have old→new ratio1.000; the table quotes the preserved frozen physical references, not a new execution in this audit.

The exhaustive old-disabled-V21→current test-budget migration is already recorded in [the assertion appendix](I5-AIM-EXPERIMENTS.md#deterministic-test-assertion-migration-for-the-shared-v24v26-encounters). That appendix includes every changed per-act count, weighted threat, EHP, contact DPS, reservation, elite/specialist share and schedule-tail range. Current source retains those shared V24/V25 encounter values. Those envelopes measure physical budgets and do not prove campaign completion rates.

Additional assertion changes and their reasons:

- `A1AbilitySystem`: Pyro trail endpoint150→220; add exact220ms immunity/2600ms recharge test; Flashfire40/80ms→25/instant while preserving wrap/edge/LOS/burn assertions; Napalm placement350→150ms and4.5→6.5 damage while retaining24 pulses; Meltdown1.25→1.4; Arc elapsed cooldown6000→7000 and salvage6650→7650 /fresh7000→8000.
- `A1TimingGeometryReview`: Napalm first pulse600→400ms, now explicitly0 hits at399 and1 at400 under every partition. Final-pulse status/death ordering and dash-budget bounds remain.
- `A1AugmentGeometryReview`: triplet pulse damage4.5→6.5; offsets, radii, inside/outside victim boundary and target assertions remain.
- `A1GameIntegration`: repeated-cast stress fixture moves from ordinary room1 to canonical Transmission room10. Assertions for more than2 Overdrives and every other slot, bounded entities/bullets, legal player position, finite damage and two-minute duration remain.
- `StoryRoute`: non-holdout maximum requests31→36 for the larger late mixed waves; holdout maximum48 and timing/climax assertions remain.
- `I5OverdriveRoomLimit`:17 tests cover actual accepted-use caps, held meter, direct call paths, cache invalidation, no denied-use counting, special/legacy exceptions, pause/reload/active expiry and old/new boundary checkpoints. No new checkpoint field or version.
- `HudSystems`: held full meter displays`NEXT ROOM`, remains100% visible and matches the accessible status, then returns to`READY` when the fixture clears the allowance.
- `I5Cadence`: one representative seed1729 per rig must clear all first5 rooms, die no earlier than9 if it dies, earn a V, have cadence1.2–1.8 allowing terminal quantization, and never use more than1 V in a strict ordinary room. The cohort target remains median1.2–1.7; this single-seed tolerance is not that cohort claim.
- `I5ProductionProfile`: legacy full-plan/progression digests remain unchanged; enabled story profile gets separate frozen digests. Champion type/presentation/HP/armor/contact/speed and resistance are retained. New story hashes are plan`361a22737451637dc770c1992e1603c52893f0fadca9789258a3a30c88ce11ce`, progression`99d09e9484dd593c34320ded447f0b4ee8d6503368c8c838c432d6a38b56acf0`.

The seed set for deterministic encounter envelopes remains **1729,2718,31415,42,137,8675309,2026,9001,65537,123456**. Checkpoint schema version1, optional meter field`overdriveCharge`, legacy omission compatibility, authored route/story, desktop accessibility, collision/LOS and persistence feedback assertions are unchanged. No test skip or weakened gameplay/accessibility/persistence threshold is part of these numerical migrations.

## Copy and provenance cautions

Current catalog copy agrees with the changed damage, cooldowns, dash travel/immunity and Meltdown speed; all four Overdrive descriptions explain the ordinary-story-room cap. HUD`NEXT ROOM` and its aria label agree with a held full meter. No active500ms-immunity,2500ms-Pyro-recharge,40-damage Flashfire,350ms-Napalm-cast or25%-Meltdown-speed copy was found in these current product surfaces.

The [main I5 report](I5-REPORT.md) contains the final corrected-model and native evidence, including explicit native point misses. The older [production checkpoint](I5-PRODUCTION-CHECKPOINT.md), [policy limits](I5-POLICY-LIMITS.md) and report history contain default-off/original-policy claims and must remain identified as superseded evidence. Their statements that all story plans are pinned to merged76, flag=false, no aim correction, cap still absent, and lead policy choice pending are not current source behavior.

[Aim experiments](I5-AIM-EXPERIMENTS.md) correctly preserves older V22 counts/damage and rejected V25/V26 immunity values under named historical cohorts; do not substitute those rows for the present candidate. Its policy-v1 and v2 campaign results remain provisional historical evidence after the material aiming-origin/LOS fixes. [Visual evidence](I5-FINAL-VISUALS.md) uses an explicit immutable78c7a10 build and staged fixtures: its label`approved-build`/`i5-final` is not acceptance of current v3 policy or proof of eight current native campaign outcomes.

The code's remaining director comment calls the pool“Experimental”; that is harmless wording but differs from the enabled flag. No source or existing report was edited by this audit. Final success/failure, native parity limitations, current eight-campaign confirmation and all gate summary lines belong in the eventual report after the matched v3 evidence and final gates finish.

## V29 addendum: rejected Breacher response trial

After the matched aiming-v3 evaluation exposed Breacher as the low-completion outlier, the lead implemented the following trial on top of the audited e97cf06 profile. **V29 completed Breacher5/20 (25%), the same aggregate completion as the first v3 trial, and was rejected. Both Seismic changes were fully reverted.** Aiming policy, encounter damage/health/budgets, ordinary-room Overdrive cap and meter arithmetic were unchanged.

| Additional parameter | e97cf06 →V29 | Purpose |
|---|---|---|
| Seismic Slam damage | 90 →110 per target | Improve close-range burst against larger or already damaged targets while retaining the existing230-radius shape, launch and wall-slam interactions. |
| Seismic Slam cast | 220 →120ms | Keep a short anticipation while allowing the next evasive action100ms sooner. |

Seismic Slam's6000ms cooldown and230 radius remain unchanged. Bulwark's16000ms cooldown, Railbreaker's600ms deliberate charge and every dash charge/recharge/immunity value remain unchanged. Catalog damage text/stats and runtime damage were updated together.

The lead updated the real ability test to require no hit through119ms, the existing shape/LOS-selected hits after the next1ms, and exactly110 damage. The synchronous snapshot-cache regression's **post-cast advance setup2240 →2340ms** compensates for the100ms shorter cast. It preserves the **same2600ms dash-ready observation boundary**, dash charge assertion and **3540ms tactical-cooldown-remaining assertion**; no invariant or assertion threshold was relaxed.

The unchanged full-kit share/spread harness passed the V29 probe. The first run's cache-regression setup failure was corrected as described above; the final focused rerun passed217 tests. Those are historical V29 receipts, not a reason to accept its unchanged25% Breacher campaign result. The119+1ms/110-damage pins and100ms cache-fixture compensation describe that rejected trial, not current Seismic tuning.

## V30 addendum: shorter Railbreaker commitment, restored working selection

V30 frozen source is **`1cac390797678b9dfe8c716e39d61c730e979dfd`**, restored at implementation **`f49647668a116b9659dbdc151ac772a2bed33c75`**. Relative to the original V27b-v3 profile, **the only Breacher numerical change is Railbreaker's cast600→250ms**. Its real acceptance test requires no impact through249ms and the impact after the next1ms; damage420, beam length900, width44, target LOS, piercing and sideways launch remain unchanged. Seismic is back to90 damage /220ms cast /6000ms cooldown, Bulwark remains16000ms, Ram remains150 units, and all dash immunity/recharge budgets are unchanged. All other V30 values match the original active V27b profile in the main tables.

Ram200 was explored only in unit probes. The original-Q plus Ram200 variant failed full-kit share **28.52%** and spread **1.266×**. V29-Q plus Ram200 passed that unit harness but was not selected for a campaign profile. Neither is present in V30, and neither supplies a campaign-completion result.

The lead's current unchanged full-kit harness observations are:

| Rig | Ability share | Clear seconds |
|---|---:|---:|
| Breacher | 30.37979% | 93.45 |
| Cryo | 30.45805% | 95.15 |
| Pyro | 43.86839% | 77.75 |
| Arc | 31.76581% | 90.80 |

Clear-time spread is **1.223794×**. All shares satisfy the unchanged30–45% limits and the spread satisfies≤1.25×; these harness results do not replace cohort or native acceptance.

The completed V30 cohort is **38/80 (47.5%)**, B/C/P/A **35/60/40/55%**, maximum mean distance **12.5 percentage points**,0 censors and **0 ordinary cap violations**. Every rig's median earned cadence is1.2–1.7 rooms/Overdrive; all first-five attempts clear and all per-rig act incoming-damage medians rise. Deaths span rooms10–20. The Breacher slice is7/20, cadence1.491453, ordinary31.9167s, Transmission67.3167s, and act damage0/13.702/36.324/57.392.

Pooled strict ordinary median is **31.8333s** and Transmission **63.2333s**, satisfying the selected **pooled30–45s /60–75s** reading of the original cross-rig pacing request. Pyro's individual **28.65s /57.3917s** remain below those bands. V30 was initially held while testing a stricter every-rig interpretation; after V31/V32 failed, the lead restored V30 and explicitly selected pooled pacing. This is a stated interpretation, not a claim that Pyro now passes per-rig timing or a new external clarification was received. At that earlier V30 milestone, full gates, native confirmation and fixture/source proof were pending; the later V33 section and final report supersede that status. [The complete V30 archive](I5-AIM-V30.md) retains all distributions and its earlier strict-per-rig assessment.

## V31 addendum: rejected Pyro pacing adjustment

V31 is frozen at **`e4381e8c9f6e1d651b87b522c326a17571032a07`** and retains V30's Railbreaker250ms cast. Its complete80-run cohort finishes **34/80 (42.5%)**, with Pyro4/20 (20%),22.5 points below the mean and strict ordinary29.77s/Transmission57.83s. It is rejected and the following cooldown changes are fully reverted. [Full V31 evidence](I5-AIM-V31.md) retains every outcome/source identity.

| Parameter | V30 →V31 | Original c3bd53b baseline →V31 |
|---|---|---|
| Pyro Flashfire cooldown | 6000 →7000ms | 8000 →7000ms |
| Pyro Napalm Charge cooldown | 12000 →13000ms | 14000 →13000ms |

This rejected trial explored a stricter per-rig reading of the ordinary and Transmission pacing bands while retaining the passing overall completion/spread and full-kit guarantees. Flashfire25 damage/instant cast, Napalm6.5 per250ms/150ms cast, Pyro travel220, Meltdown speed1.4, shared220ms immunity/2600ms recharge, encounters, meter, room cap and frozen aiming-v3 policy are unchanged. Catalog cooldown stat lines follow7000/13000ms.

The new real `A1AbilitySystem` cooldown test asserts no recovered Q charge at **6999ms**, then recovery after **1ms**; F similarly remains unavailable through **12999ms**, then recovers after **1ms**. No other assertion changes were made for this adjustment. The lead reports **218 focused tests passed and TypeScript passed**; this is a focused result, not the final full gate.

The V31 full-kit artifact reports Pyro **39.2304% /83.05s** and clear-time spread **1.145695×**. Breacher **30.37979% /93.45s**, Cryo **30.45805% /95.15s**, and Arc **31.76581% /90.80s** are unchanged in that probe. Passing original30–45%/≤1.25× unit guards did not rescue the failed campaign rig-distance/pacing result. Its historical full-unit receipt is2823 passed/1 skipped plus2 cryo tests passed, followed by the known missing-Blender asset failure; this is not a final restored-V30 gate receipt.

## V32 rejection and final restoration

V32 froze **`6d1fa3e1242caaef01c8d5c7dea70b289b73b1a9`**: versus V31, Pyro Q7000→8000ms, F13000→16000ms and dash220→240 units, with Railbreaker250 retained. Its complete80-run cohort also finishes34/80, Pyro4/20; earliest Pyro death7, strict ordinary28.9167s and Transmission57.9333s. It is rejected for rig-distance/pacing and earlier pressure; [all V32 evidence](I5-AIM-V32.md) is separate.

The restoration at **f49647668a116b9659dbdc151ac772a2bed33c75** returns every gameplay/policy/UI/render file to the frozen V30 selection. The only new runtime-cooldown test pins the restored Pyro cooldowns: no Q recovery through **5999ms**, then recovery after **1ms**; no F recovery through **11999ms**, then recovery after **1ms**. These replace the rejected V31's6999/12999 setup values, retaining exact-boundary assertions. The lead reports218 focused tests and TypeScript passed. Historical V30 full-kit values are **B30.3798/C30.4580/P43.8684/A31.7658%**, spread **1.22379×**. Its seven selected-production gates and source/held-meter/Railbreaker receipts passed. Those receipts retain V30/mode-v7 scope; the subsequent corrected evaluation and V33 change below supersede its candidate assessment without changing the archived numbers.

## V33 addendum: measured Cryo control-duration selection

Frozen source **`7ec8506`** changes one gameplay number from restored V30: **Cryo Nova's freeze1800→1500ms** for targets already chilled before the cast. The corrected mode-v8 V30 evaluation found Cryo67.5% and Pyro35% completion around the50.625% mean, deviations **+16.875/−15.625pp**, outside the strict15-point allowance. This is the reason for a smaller Cryo control window; it is not permission to relax the completion-spread invariant. The fresh V33 cohort is **160 attempts,40seeds per rig**; its complete result and final-source gates are recorded in the follow-up below.

| Item | Restored V30 →V33 | Preserved guarantee |
|---|---|---|
| Runtime Nova freeze request | 1800 →1500ms | Only already-chilled targets freeze; ordinary/elite/boss resistance semantics unchanged |
| Catalog description | “1.8 seconds” →“1.5 seconds” | Player-facing rules match runtime |
| Catalog Freeze stat | `seconds(1800)` →`seconds(1500)` | Tooltip/stat value remains derived and truthful |
| `A1AbilitySystem` numeric assertion | Freeze receipt1800 →1500 | Exact recipient,30damage,210radius, LOS and status-before-damage checks retained |
| `HudSystems` numeric assertion | “frozen solid for 1.8 seconds” →“frozen solid for 1.5 seconds” | Real ability tooltip still exposes the catalog rule |

Cryo Nova damage **30**, radius **210**, instant cast, Q cooldown **9000ms** and Glacier F cooldown **18000ms** are unchanged. Spreading Nova's radius rules and Whiteout's1000ms freeze pulses are unchanged. This kit duration change also applies to legacy Cryo; legacy encounter/progression parameters remain untouched.

The existing explicit1800ms inputs in `A1StatusCombat`, `A1ReviewRegressions` and `I5Balance` remain unchanged: they test generic requested-duration handling and resistant/immovable controls, not the Nova tuning value. Neither the generic duration API nor its expiry/resistance assertions was weakened.

The lead's unchanged full-kit precheck reports Cryo **31.3477441797%** ability share /**94.65s** clear, overall spread **1.21736×**; the other three result objects are deep-identical to V30. All remain within the original30–45% and≤1.25× guardrails. Current focused receipt: **4 files /110 tests passed**, TypeScript exit**0**. These are reported focused/precheck receipts, not a final full gate or campaign result. The complete160-run evaluation subsequently selected V33; final native confirmation is complete, with native point misses and calibration limits recorded separately.


### Completed V33 fixed-cohort and gate follow-up

Source7ec8506, corrected backendv8 and frozen native policyv3:78/160 complete (B18/C24/P14/A22 out of40 each), maximum mean distance13.75pp; all120 non-Cryo records deep-equal V30. Pooled strict ordinary31.9667s/Transmission64.8833s, every-rig OD1.4167–1.4286, cap0/1984, opening800/800 and0censors. [Full before/V30/V33 tables](I5-EMULATION-V8-V33.md) retain individual timing misses. The earlier110-focused receipt remains historical; final full Vitest238files/2835tests plus1unchanged opt-in skip and all seven gates passed. Required verify repeats the full pass then exits1 at documented missing Blender. Native final-build eight-run confirmation is complete and remains separate; these cohort/gate observations do not prove exact native endpoint predictions.
