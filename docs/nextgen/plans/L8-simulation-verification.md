# L8 final simulation verification — in progress

Scope: CPU-only verification of all twenty story rooms, immutable cohort diagnostics, the reviewed V1.1/ingress layout activation, and four explicitly authorized finite encounter appends after failed layout-first pacing trials. No policy, actor, ability or progression edits. Root owns native/browser evidence and hardware budgets. Final release evidence uses the declared fixed160 attempts per profile.

Frozen reference: `artifacts/nextgen/playtest/l8-before/summary.json` has40 runs, ten seeds per rig,21 completions (52.5%), and policy hash `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`. The directory is `l8-before`, not `l8-before40`. The runner also freezes backend/game hashes and exact policy sources; those identities must match as applicable before comparison.

The strengthened tests are independent of rendering:

- `L8AllRoomCrowdSoak`: every named sub-space, entrance, exit and declared crowd arena; native mixed five-family cohort from every breach; native placement; every accepted movement leg and body clearance checked; exposed blockers resolved through ordinary health+armor damage as in A3. Carrier child requests are not dispatched in this finite-fight fixture.
- `L8AllRoomEnemyLiveness`: each family independently from each breach to every target. Crawler/Brute/Stalker require actual native contact attacks; Spitter requires a completed native hazard attack with projectile-radius9 sightline; Carrier must reach its intended visible holding range within260 units. Native Engagement deliberately holds carriers around170 units, so reporting carrier melee contact would misrepresent its behavior.
- `L8AllRoomDenseNavigation`: an80-unit dense grid of every legal radius16 marine goal; actual family radii14/28/18/17/24; every breach; continuous sweeps; geometric contact bound; Spitter requires legal body/firing access with projectile-radius9 sightline. Each path is bounded by900 eight-unit steps. This is a geometric bound, not native combat pacing.
- `L8AllRoomReplay`: identical fixed public-input traces twice for every rig in every activated room, with native enemies, abilities and damage. Each frame hashes player/combat/ability/enemy/bullet/pool/pickup/stats/effect state. It checks player/actor clearance and accepted swept legs. These are independent room fixtures, not forced-clear campaign victories.

## First failure packet

`artifacts/nextgen/l8-sim/first-failure/` preserves the raw first all20 crowd run:165 target scenarios,3300 actors,161 scenarios passed and4 failed at60 seconds. Failures:

| Room/target | Native unresolved actors |
|---|---|
| Awakening / Pod aisle640,440 | Stalker14 at479.484805,784, target688,784 |
| Residential / Cabin S3 984,740 | Brute2 at515.150077,167.787456, target self |
| Checkpoint / Guard gallery1000,440 | Stalker14 at726.432274,644.648536, target688,656 |
| Safety / Battery return640,730 | Stalkers4/9 at622.794282,287.884903 and657.229929,288.106881 |

The stronger isolated native attack sweep initially passed3297/3300 trials. Its raw report is `artifacts/nextgen/l8-sim/attack-access/native-family-opportunities.json`. It found Awakening Recovery bay80,720 Spitter breach2; Transmission South service chapel700,800 Carrier breach1; and Safety Recorder/AI booths640,200 Stalker breach2. No assertion or horizon was relaxed. Root is correcting the exact rounded-corner navigation predicate consistently with native continuous collision and will request reruns.

Safety received an authorized layout-only correction: upper interlock header north face320→332, height24→12, south face344 retained. The two legs, both cage door openings and machinery stayed fixed. Its solid union244416→241056, hull-connected area225600 unchanged, connected share92.3016%→93.5882%, walkable933184→936544 (95.3322% of frozen982400), free groups2. All ten Safety mixed-crowd targets pass after the change. Strict Act3 checker all five errors arrays remain empty.

Shaft's declared radius144 crowd arena moved170,440→170,170, the actual upper-left L elbow. No hull, shaft cutout, machinery, source material, floor grain or walkable-area number changed. The integrated all-room framing test now passes its >=60% actual playable viewport floor bound in both1080/720 and ordinary/reduced modes; the former arena sampled52.14%. This keeps the accepted C core while placing the encounter's broad fighting circle on real floor.

Final checker/crowd/attack/dense/replay results, matched-cohort tables and target comparisons will be appended after the source freeze. No final balance or completion acceptance is claimed yet.

## Navigation and asymmetry investigation

Root corrected Navigation's square-expanded-rectangle approximation to the exact native rounded swept-disc predicate, then retained a per-body swept-clear committed leg while nearby moving goals shift less than64 units. This resolves the Residential Brute/Checkpoint/Awakening corner regressions without weakening collision. The first post-fix all20 rerun is preserved in `artifacts/nextgen/l8-sim/nav-corrected/`: mixed crowds exposed a perfectly opposed same-row Stalker pair in Relay Console bay and Safety Battery return; isolated native attacks retained the Awakening Spitter and Transmission Carrier failures. All four replay rigs still passed.

Authorized layout asymmetry: Relay spine590→606 (+16x), Port outline width390→406, Starboard x690→706 and width390→374; north/south opening edges follow the spine. Safety upper U+16x, lower U fixed; north Starboard opening start780→812 and inspection fixture512→528. Areas, actor rules and named anchors are unchanged. All19 affected crowd targets/380 independent native family trials pass;89 source-fit, fatal-lettering, projectile-gap, camera and lifecycle assertions pass. The strict all20 plan checker now reports20 errors arrays empty.

The shaft camera fix and Safety header clearance correction remain as above. Root additionally extends Awakening's lower Recovery working bay to y1040 with height1080 (+52800 walkable units); the fixed Recovery target80,720 stays unchanged. Root/Act2 own the final Transmission baffle correction. Dense5-family/firing access and final mixed/native/replay runs remain in progress; cohort launch is still gated by root's frozen SHA.

## Fixed matched-cohort declaration

After source freeze and all final prerequisites, run exactly ten seeds per rig:1729,2718,31415,42,137,8675309,2026,9001,65537,123456; rigs Breacher/Cryo/Pyro/Arc;40 unassisted current-story attempts. Use `npm run playtest:sim`, explicit frozen `--game-revision`, a new immutable label, at most two workers, unchanged240s per-room diagnostic bound and unchanged30000-decision campaign bound. No policy changes, assistance, legacy runs, dropped deaths/censors or seed extensions. Compare each rig/seed pair to `l8-before` and preserve every raw attempt plus backend/policy/game/bundle identities. Rendering/capture evidence remains separate.

Use original `balance-summary.mjs` definitions: all-attempt completion; per-campaign clears/accepted Overdrives; strict ordinary combat clears exclude guardians/elites/holdouts; broad nonholdout medians remain visible; incoming damage includes failed attempts. Report all20 room medians and death counts, every rig's metrics, pooled40–60% completion, maximum rig distance from the pooled mean (established≤15pp method) and the max–min range explicitly. Baseline's52.5% completion is B60/C70/P30/A50, already22.5pp maximum distance and40pp max–min range; this inherited miss must not be hidden. Pyro baseline Transmission57.425s also misses60s.

The30–45% ability-share/≤1.25× clear-time-spread guard is the unchanged source-matched `A1Balance` full-kit probe, separate from campaign direct ability/status/boon buckets. The campaign pooled direct ability bucket is22.4531% before; reporting a different sum as isolated causal ability attribution would be false. Both bucket tables and the actual full-kit guard will be retained.

The initial dense firing probe incorrectly restricted Spitters to optional240–360 holding rings and asked melee Navigation to approach a marine's center. The corrected geometric test requires actual native180–420 firing access and legal actual-body contact berths, with unchanged contact distance,900×8 path bound and continuous collision. It searches for any valid contact/firing berth rather than demanding the closest berth specifically. The raw superseded reports remain in `dense-firing/` and `dense-berths/`. Native named-space attack checks remain independent. An additional real native fringe regression at Awakening marine128,688 confirms Brute breach1 stalls at144,624 for60s with an engaged44.25-radius attack slot; two other breach controls pass. Root is investigating before any cohort launch; this actual failure is not waived by the corrected geometric test.

## Frozen825 verification and failed balance acceptance

First all20 simulation freeze: `82541a0601dcc98e5ccd8cceb5734e5c4e21b0b1`. The final short-leg navigation correction keeps every legal leg longer than8 units, with the existing8-unit arrival threshold. It fixes the native Brute fringe regression without geometry changes. Root owns the exact rectangle/leg implementation and its focused regressions.

```text
Final all20 CPU verification:
Test Files5 passed (5)
Tests358 passed (358)
165 mixed-crowd targets /3300 actors; unresolved0; worst22350ms
3300 native family/breach attack or holding trials; failures0; worst29600ms
2263 dense legal marine goals /45260 five-family routes; failures0
2263/2263 goals have reachable legal native180–420 Spitter firing access
3/3 native Brute cabinet-corner controls pass
4 rigs ×20 geometries ×120 steps ×2 replays: all frame/effect hashes identical
```

Every suite's exact template/metadata packet hashes to `57d53214a6f673c5980c24f42ba973f3751458f21acf2daffa55def2282ee217`; reports are in `artifacts/nextgen/l8-sim/final-short-legs/`. The strict integrated all20 checker also reports all errors arrays empty. Native movement legality and actual attack criteria were never relaxed.

Matched40 source825 is **not accepted for balance**. Raw immutable reports: `artifacts/nextgen/playtest/l8-after40/`. All40 terminate naturally (23 complete,17 dead), no censor. Policy hash matches frozen before exactly; backend hash also matches. Game SHA256 is `cad9a2dcab68f136ce3c760a9faaf4686ad80f18edb0f28182383d6ef41d4c68`; bundle SHA256 is `e54b8c49dfcbf615d54133e749171006b525bcd6ca0f0930a028d9661f072d95`.

| Metric | Frozen before |825 after | Target/status |
|---|---:|---:|---|
| Pooled completion |21/40,52.5%|23/40,57.5%|40–60%, pass|
| B/C/P/A completion |60/70/30/50%|20/100/40/70%|visible rig distributions|
| Maximum rig distance from pooled mean |22.5pp|42.5pp|≤15pp, fail/regressed|
| Maximum–minimum rig range |40pp|80pp|reported separately|
| Strict ordinary median |32.2583s|28.4167s|30–45s, fail|
| Broad nonholdout median |34.2833s|30.1000s|descriptive broad pacing|
| Transmission median |68.6583s|59.6167s|60–75s, fail|
| Median rooms/OD |1.400641|1.428571|1.2–1.7, pass every rig|
| First-five clear receipts |200/200|200/200|welcoming, pass|
| Natural death range |12–20|14–20|9–20, pass|
| Ordinary multiple-OD violations |0|0|unchanged cap, pass|

Complete per-rig timing/damage buckets, all20 room tables and every matched seed pair are in `artifacts/nextgen/l8-sim/cohort-comparison.{json,md}`. Campaign direct ability share22.4531→24.1838% is not the isolated full-kit invariant. Exact frozen-source `A1Balance` runs use unchanged test/input bytes at before7ceefa5 and after82541a0: Breacher31.5620→32.4789%, Cryo30.7628→32.0741%, Pyro40.5936→41.2864%, Arc33.1878→31.6366%; clear-time spread1.1711165→1.1707768. Both full-kit30–45%/≤1.25× guards pass. Every rig uses every slot and earns an Overdrive; same53 kills/composition/total damage. Full before/after source manifests and logs are under `artifacts/nextgen/l8-sim/*full-kit*`.

## Causal counterfactual and observer validation

`l8-diagnostic-sim.mjs` is a diagnostic-only wrapper around the unchanged runner. It freezes game/Nav825, overlays only the StoryRoomTemplates module with a deep-frozen full geometry packet at Vite SSR load, records actual game/backend/policy hashes and exact generated source/transform receipts, and labels every report `diagnostic:true,acceptance:false`. It never writes live templates or changes policy decisions, actors, abilities or encounters. Existing labels are immutable.

The optional observer collects public state only: ready/aim opportunities, actual key attempts and accepted/denied `useAbility` results, visible/clear enemy samples, and actual ability impact target occurrences. A missing projected aim is a mixed shape/range/geometry/projection opportunity proxy, not automatically a collision-placement rejection. Impact occurrences are not isolated control-value attribution. Exact parity controls at seed1729 for all four rigs match accepted825 outcomes, every room record (excluding the added observer field), stats, final state, game hash and policy hash. Receipts: `artifacts/nextgen/l8-sim/observation-parity.json`.

The counterfactual current-Nav825 + frozen baseline geometry runs all40 same rig/seed attempts under `artifacts/nextgen/playtest/l8-nav825-baseline-geometry40/`. It finishes19/40 (47.5%), B50/C80/P30/A30%, strict ordinary31.4667s, Transmission64.425s. It is never pooled into acceptance. Comparing this controlled geometry axis to the825 authored plans isolates the primary geometry skew: B50→20%, C80→100%, P30→40%, A30→70%. Corrected navigation alone does not explain the large authored-layout skew. `hybrid-geometry-comparison.{json,md}` preserves every row and source identity.

The clearest opposite-rig room is Infested15: same corrected Nav, identical paired boons for B9/9 and C10/10 overlaps; B incoming50.96→89.33 with entry vitality121.33→121.63, C incoming91.24→12.60 with entry179.56→173.65. Coolant13 B incoming42.89→72.61 with entry138.08→143.84, C48.85→47.95. Overload20 hybrid B5/7 clears versus authored2/5 despite higher entry vitality150.24→200; C8/10→10/10. Entry HP debt uses the fixed100-health cap; armor is reported as observed rather than guessing upgraded caps. Final-room exit zero health is the authored destruction ending, not a natural-death receipt. Full late-room health/armor, source damage and accepted ability-count tables: `late-room-rig-analysis.json`.

## Dormant two-room candidateV1

Root selected a prospective geometry-only experiment, exported from `shipArchitectureAct3CandidateV1.ts`; it is not registered live. Coolant's160×360 return spine becomes two160×100 banks (y300–400 and560–660) with an actual160-unit cross-service opening. Areas932800→958400 (100.251% frozen baseline),89.19% connected solids,2 free groups. Workshop widens its port hull inset160→40, northeast hull1120→1200, and spreads four real hull vents/doors to100,100 /1100,100 /80,730 /1180,720. Areas921600→995200 (104.935% baseline),100% connected,0 free groups; all machines retain their original live footprints. No encounter number changes.

Forty prospective tests plus36 stronger overlay tests pass: both strict checker errors arrays empty, exact native R38 breach/spawn/exit margins, all named mixed crowds and actual family attacks, full five-family dense/firing fields, bounded source ownership and C6/E7 full-body/scale/outside/≥60% actual floor in both desktop/reduced modes. Inspected labeled sketches live in `artifacts/nextgen/l8-act3-candidate-v1/`; its DTO audit changes only these two rooms from825. No lower-bank offset was needed because opposed-Stalker tests pass.

V1 diagnostic40 at `artifacts/nextgen/playtest/l8-act3-candidate-v1-40/` finishes25/40 (62.5%), B50/C60/P80/A60%. Maximum rig distance17.5pp, range30pp; strict ordinary28.95s, Transmission59.6167s, OD1.428571. It strongly improves the Breacher/Cryo skew but still fails pooled completion, strict rig distance and pacing. No rounding waiver or live activation. Coolant B incoming72.61→52.36; Workshop B89.33→45.05 and C12.60→60.70; B now survives Shaft10/10 and Swarm9/9. Full tables: `candidate-v1-comparison.{json,md}`.

Review risk: widened southwest hull leaves a120×200 one-ended strip behind the unchanged bench. Before adoption, fill that strip with wall-built machinery or restore the local hull inset, then repeat proofs/cohorts. Source gates and named anchors do not justify silently accepting that physical pocket. Root review and the remaining targets still gate live activation.


V1.1 remains prospective and changes only the Workshop bench from160,800,300,200 to40,800,420,200, filling the one-ended strip with its actual source machinery. Workshop walkable995200→971200 (102.4040% baseline), connected solid235200/235200, free groups0. All other V1 parameters remain fixed; Coolant stays958400/2 free groups. Both strict checker errors arrays are empty. Eighty-three combined candidate tests pass, including exact removed-strip rejection, independent R32 north/east escapes from the playable front100,768, actual native contacts/crowds at that front, source fitting, full-body C6/E7 scale/outside/60% playable floor and35% maximum landmark shares. V1 source/reports are retained separately. Its fresh fixed40 diagnostic finishes27/40 (67.5%), B60/C70/P60/A80%. Maximum rig distance12.5pp passes, but pooled completion exceeds60%; strict ordinary28.9083s and Transmission59.6167s both remain below their targets. OD medians B1.40659/C1.39286/P1.39048/A1.39286 remain in range. Every terminal is a natural death or completion, with deaths16–20 and no censors. This failure is retained; V1.1 is not accepted or registered. Full tables: `artifacts/nextgen/l8-sim/candidate-v11-comparison.{json,md}`.


## Fixed forty-seed release validation

Root declared and committed `docs/nextgen/plans/L8-N40-VALIDATION.md` at395ad09 before reading V1.1 outcomes or supplemental-seed results. It fixes the original I5 forty seeds per rig,160 attempts per profile, with no extension merely until a threshold passes. Supplemental baseline120 runs use committed7ceefa5a52cc74a6b95712f29653d9bf523906be and the original vanilla backend. Exact game2803f6d9…, bundlefd3232e5…, backendf7c6d801…, policy976eb173… and all five backend/metrics file hashes match the original40, so those original reports can be reused. Receipt: `artifacts/nextgen/l8-sim/baseline-reuse-identity.json`. The release summary rejects duplicate/missing pairs, mixed sources/bundles/backend metrics, diagnostic overrides, assistance or policy edits; errors/censors remain in the attempt denominator. Per-rig cadence and all20 per-rig room results remain explicit. Supplemental baseline120 has finished and all160 receipts pass exact source identity. Combined baseline88/160 (55%), B19/40 (47.5%), C30/40 (75%), P14/40 (35%), A25/40 (62.5%). Maximum rig distance20pp remains an inherited miss, range40pp. Strict ordinary32.175s, Transmission67.4417s, median rooms/OD1.428571; per-rig medians B1.428571/C1.428571/P1.363636/A1.428571. Every terminal is natural, all firstfive clear, ordinary OD cap violations0. Complete combined/primary/additional and per-rig/all20 room results: `artifacts/nextgen/l8-sim/baseline160-summary.json`. Final-source160 remains pending; candidate overrides are never acceptance.

## Separate Transmission entrance-spacing proof

`shipArchitectureTransmissionCandidate.ts` is dormant. Raw doors280,160 /1080,160 /100,560 /940,780 become260,120 /1120,120 /100,600 /960,800; actual inward points316,120 /1064,120 /156,600 /904,800 and real feature mounts200,120 /1200,120 /0,600 /1040,800. All defensive walls, floor, spaces, source assets and encounter timings/counts stay exact. Strict checker errors are empty: walk812672 unchanged, connected93.7308%,2 free groups. Sixteen overlay tests pass across actual native family attacks, dense five-family/firing fields, mixed crowds and both desktop/reduced-motion camera modes. The inspected labeled plan is `artifacts/nextgen/l8-tx-candidate/transmission-chamber.png`. No combined candidate cohort or live adoption yet.

The ordinary-room timing miss requires broader layout work: V1.1 clears514 ordinary samples,287 below30 seconds, median28.9083. Baseline clears502 with220 below30. Lost long approaches primarily affect Residential (below30 samples16→26), Checkpoint14→23, Diagnostic10→22, Safety6→21 and Shielding10→24. Workshop improves from live17 below30 samples to9. More late cleared samples do not by themselves explain the miss. No global entry delay or timer padding was added.


## Reviewed combined live source9a44e60

Root authorized the bounded release candidate source at `9a44e604bf644b6cf0ab8b2637913e19ca3e4740`, after Act2 ingress dependency0e6a325. Registry precedence is base20 plans, then V1.1 Coolant/Workshop, then the proven five ingress overrides. Transmission keeps its original280,160 /1080,160 /100,560 /940,780 doors: the isolated replacement-door40 diagnostic made pooled Transmission faster59.6167→58.6000s and was rejected. That failed raw packet remains `artifacts/nextgen/playtest/l8-tx-candidate-40/`; comparison `artifacts/nextgen/l8-sim/tx-candidate-comparison.{json,md}`. Root/Act2's ingress report owns each of the five new feature mounts and native margins.

After V1, V1.1 and the failed Transmission layout attempt, root explicitly authorized two additional real enemy requests in each of four measured fast rooms. No initial delay, elapsed-clear timer, family/power multiplier, actor AI, policy or ability change was added. All original request prefixes, seeded RNG order, spawn-time formulas and caps remain exact.

|Room|Requests before→after|Cap|Last request ms before→after|
|---|---:|---:|---:|
|Transmission|32→34|14|23900→25400|
|Diagnostic|27→29|15|4230→4410|
|Safety|28→30|15|4320→4500|
|Shielding|31→33|15|4400→4580|

First request remains650ms. Transmission retains750ms cadence and other rooms retain the original6-request grouping and90ms within-burst spacing; no spawn formula changed. Eight real requests are added per complete campaign. Act request totals73/108/142/180 become73/110/146/182. Late reservation pins142/183 become146/185. All original non-count threat/stat envelopes remain unchanged and pass. `L8EncounterAppend` validates all40 release seeds, native pending-request completion and exact schedules; both it and `I5ProductionProfile` preserve the original200-plan historical SHA after removing exactly the two authorized tails from each named room. Legacy graph-v1/v2 digests, all progression records, champion stats, save formats and firstfive request counts remain unchanged.

Honest expectation migrations: `I5ProductionProfile` normalizes only the new tails before its historical digest and separately pins34/tail25400; `I5Balance` pins changed act counts/reservations while retaining all stat/threat/cap/family envelopes; `StoryRoute` pins34/tail25400; `A1Balance` pins34 and seed137 composition8crawler/6brute/10spitter/3stalker/7carrier instead of7/6/9/3/7. Its complete input function is byte-identical to baseline; every ability-share/clear-spread/native kill/finite-completion assertion is retained. Seed137 gets one additional crawler and one additional spitter, so all rigs kill55 instead of53.

Combined hardproof:13 files539 tests pass; strict20 rooms errors[].165 mixed named-space scenarios/3300 actors have0 unresolved, worst22.35s.3300 native family trials all reach their native criterion, worst29.6s. Dense2275 marine positions yield45500 five-family breach routes and2275 firing fields, failures0. Four rigs each replay all20 rooms identically; three actual native edge regressions pass. All five suite packets share geometry SHA `9a1a8d88ad7781d19ae09c25f47c39d530008d248677675c377a462c0b03be9c`; working game source matches9a44 exactly. Packet and receipt: `artifacts/nextgen/l8-sim/final-combined/`. Frozen source-matched fullkit/cadence passes2 files5 tests, including all four seed1729 earned-cadence guards without relaxing thresholds. Fullkit input SHA76d6d2a54af55b4618162a83f86d8d57a22ce63d80840751feac30b759c9a60d matches baseline. Final shares B33.1691%/C32.6012%/P42.3396%/A32.6459%, clear93.25/97.15/80.70/89.05s, spread1.203841×; all slots used and each rig earns native Overdrive. Fullkit packet: `artifacts/nextgen/l8-sim/final-full-kit-comparison.json`. All52 checked actor/observer source/assets are byte-identical to baseline (`final-observer-actor-identity.json`, changes[]). Final-source160 cohorts are running as primary40 plus remaining120, both vanilla backendf7c6d801…/policy976eb173… on the same9a44 commit, with no outcome-dependent stopping. Candidate gameHashd8601138d86e028b5b252a14ab797339fb6ffff131717d754e3abf8611a1e22f, bundled27b30d69162bf9512b8d1d0903d110203a3dad88a243a6490059d8ae4becb564; both batches must retain these exact identities.


Every numeric template change from frozen baseline to adopted9a44 is also recorded directly from the actual loaded simulation DTOs in `artifacts/nextgen/l8-sim/final-combined/all20-numeric-layout-changes.json`. It contains before/after field arrays, area/connectivity/free-component statistics and complete new plan annotations for all20 rooms. An explicit audit rejects changes to any template field outside width/height/spawn/exit/obstacles/breaches/boundary/voids. This complements the initial per-act sketches; it is the authoritative all20 final numeric layout diff.


## Primary subset and Pyro paired diagnosis

The unchanged9a44 primary40 finishes26/40 (65%), B70/C70/P40/A80%, maximum rig distance25pp/range40pp. Strict ordinary29.6333s still misses30; Transmission63.725s now passes. Median rooms/OD1.35714; all terminals natural, firstfive all clear, ordinary cap0. These primary figures are not release acceptance: the declared remaining120 continue on the identical source regardless of this subset's outcome. Full subset table: `artifacts/nextgen/l8-sim/final-primary-comparison.{json,md}`.

Root requested a cheap read-only paired Pyro comparison against V1.1, without new simulation jobs. Same-policy/same-boon rows identify Safety as the strongest local ingress suspect:9 common pairs, mean incoming+38.42 (other rigs B+16.0/C+6.7/A+10.1), median direct ability share25.79→20.61%, despite power casts2.5→3 and tactical4→5. Shield adds mean12.80 incoming across7 pairs but ability share rises24.02→26.41% and accepted casts stay stable. Crew incoming improves1.61; Diagnostic improves8.41 overall despite seed65537's earlier death. Residential adds4.78 mean incoming across10 pairs and has some early carry divergences. These are paired descriptive results, not proof that rear doors alone cause each death: the four count appends are also changed in9a44.

V1.1 Pyro completions lost in the primary subset are seed137 (complete→death20) and2026 (complete→death16). Seed65537 was already a noncompletion at20 and now dies11. Unchanged Swarm has the largest downstream incoming jump, mean+47.50 across9 paired entries despite mean entry vitality+14.88; its direct ability share stays23.33→23.36%. Seed2026 takes172 additional damage in Swarm after Diagnostic/Safety actually improve its prior condition, so a single local-ingress attribution would be false. Full room/seed/entry-vitality/damage/cast data: `artifacts/nextgen/l8-sim/pyro-v11-final-primary-analysis.{json,md}`.

Final vanilla reports do not contain ready/denied/LOS observation counters; none are inferred. V1.1's retained observer shows power ready-with-visible-but-no-aim0 in all five changed rooms; API denials mix same-frame cast timing and are not pure geometry failures. If the complete fixed160 fails, Safety's original four doors are the first layout-only revert hypothesis, retaining its reviewed architecture and two real appended requests. No revert or extra cohort is selected while fixed validation runs.


## Independent plan qualification withheld

`L8-final-plan-review.md` atcf6708d finds genuine semantic blockers in the9a44 architecture: Diagnostic and Workshop declare open floor spans as openings without real separating partitions; Safety calls an open equipment gallery two booths. Root agrees and has assigned dormant real-partition proposals to Act2, with all existing source/clearance/area/arena guarantees retained. My earlier Act3 semantic critique overstated the separation. Strict geometry/navigation passes remain valid evidence of their stated invariants, but they do not establish a physically authored ship plan. The current fixed160 continues and remains a complete retained packet regardless of these issues. No live change is permitted during it, no final art/balance acceptance is implied, and further geometry waits for root review.


## Complete retained9a44 N160 result — failed acceptance

All320 paired before/after reports validate the exact declared40 seeds per rig, committed game source, vanilla backend/metrics, frozen policy, unassisted/current-story flags and single bundle per profile. Both source batches have fully exited; no worker remains. Final packet: `artifacts/nextgen/l8-sim/final160-comparison.{json,md}` with per-report SHA receipts, primary/additional/combined tables and every rig/all20 room debt/cast/timing records. All raw runs remain in their original directories.

|Rig|Before complete|After complete|Before ordinary / Tx seconds|After ordinary / Tx seconds|Before→after rooms/OD|
|---|---|---|---|---|---|
|breacher|19/40|22/40|33.533 / 73.983|31.917 / 65.200|1.429→1.429|
|cryo|30/40|32/40|36.400 / 78.867|33.133 / 73.342|1.429→1.357|
|pyro|14/40|22/40|28.733 / 59.650|27.533 / 55.700|1.364→1.387|
|arc|25/40|30/40|29.917 / 60.650|27.783 / 58.925|1.429→1.429|

Pooled completion88/160 (55%)→106/160 (66.25%), **fails** the40–60% target. Maximum rig distance20→13.75pp now **passes**15pp; max–min range40→25pp remains explicitly visible. The complete sample supersedes the primary subset's misleading Pyro spread. Pooled strict ordinary32.175→29.8833s still **fails**30–45s; Transmission67.4417→61.5167s passes60–75. All four rig cadence medians pass1.2–1.7; pooled1.428571 both profiles. Ordinary OD-cap violations0; every firstfive room160/160 clears. Terminals after106 complete/54 dead, with no errors/censors; deaths10:1,11:1,12:1,14:3,15:4,16:6,17:10,18:9,19:1,20:18. All frozen full-kit guards pass separately (ability32.60–42.34%, spread1.203841×). Campaign direct ability22.4107→23.9213% and ability+status30.6282→32.6636% remain separate labeled buckets.

In the complete sample, Diagnostic30.7167s, Safety34.7167s and Workshop35.8833s meet the ordinary target locally. The pooled median includes fast early rooms: Residential28.15s, Checkpoint29.2333s, Freight29.0917s, Loading28.65s and welcoming rooms1/2/4. A Safety-only easing revert is **not selected**; it would respond to a primary-subset imbalance that the complete sample does not establish. Root retains the current eight appended requests and has selected no further composition/count changes.

Ship-wide semantic acceptance is independently withheld by cf6708d. The next work is Act2's dormant real-bay partition proposal and root's plan review, with no source changes during the completed measurement. For the next reviewed committed geometry, root explicitly authorizes one vanilla fixed160 queue with four simulation workers (Vitest remains MAX_WORKERS2), identical frozen reference files and the same40 seeds. No further seed extension, outcome-dependent stopping or FPS certification while workers remain active is allowed. No next cohort has launched yet.


## Predeclared next fixed160 dispatch — source pending review

The unchanged vanilla runner permits only1 or2 workers. Root therefore selects two balanced80-attempt queues, each with two workers, instead of changing any frozen backend file. Split the original ordered40-seed declaration by index parity, preserving exactly40 matched seeds per rig overall. This split is committed before outcomes from the new semantic proposal; no new source/cohort launches until Act2 proof and root review/freeze.

QueueA (even indexes0,2,…38): 1729,31415,137,2026,65537,1000,1002,1004,1006,1008,2646007777,1420519048,3293539470,3031516705,3763819556,2570684887,676147701,1576486972,1190535481,3344254954.

QueueB (odd indexes1,3,…39): 2718,42,8675309,9001,123456,1001,1003,1005,1007,1009,2400273476,926231573,302625857,315632507,1353316589,2825160470,1074335564,719510212,3640216177,2595108862.

Each queue runs all four rigs,20 seeds each,80 attempts. Both run simultaneously: four CPU workers total, unchanged vanilla backendf7c6d801…/policy976eb173…, same observers/actors; Vitest remains MAX_WORKERS2. Combined outcomes from all160 attempts are mandatory, without early outcome-dependent stopping. No FPS certification while either queue is active. The exact dispatch manifest is `artifacts/nextgen/l8-sim/next-fixed160-dispatch.json`. Root has selected no further encounter/count change; the next candidate must first resolve actual physical subspace/threshold semantics.


## Reviewed real-bay source659 — fixed validation failed

Root accepted the labeled physical-bay revision and froze `659ac9ddf167b9d0b24ec65001ebd2912aaf79e2`. Diagnostic now has actual recorder/instrument and port/return workbays, with real140-unit side doors and supported broad front mouths. Workshop has connected loading cheeks, a lathe side door and real tool/gantry/return separators, preserving V11's filled bench. Safety honestly names its open instrumentation gallery; its collision is unchanged. Swarm's340-depth banks and600,400 encounter circle bring the real northern throat into the combat viewport. Exact plan/number records are in `L8-final-partitions.md`, `L8-swarm-bay-proposal.md`, and `artifacts/nextgen/l8-sim/revised659-hardproof/all20-numeric-layout-changes.json`. No additional encounter changes were made: the existing eight real request appends remain.

The pure world radar helper `voidParity.ts` preserves original native solids and appends exact analytic intersection parity compensation; no UI code changed. Current Armory3→4 and Loading2→3 paths remove fake walkable overlap from SVG evenodd floor/clip, with disjoint arrays unchanged. Native occupancy/sweep/tangency/navigation controls prove unchanged physical behavior. See `L8-radar-void-projection.md`.

Frozen integrated hard proof:34 files840 tests pass, all20 strict errors arrays empty and TypeScript green. This includes shared real-aperture/negative-floor-line tests, complete A3/native movement, AbilitySpaces60, EscapeLanes20, radar parity29 and actual four-rig I5Cadence. All20 now have168 named targets,3360 native crowd actors with0 unresolved (worst22.35s), and3360 native family trials with0 missing (worst29.6s). Dense2256 marine goals produce45120 native-radius family routes and2256 Spitter firing fields, failures0. The separate partition packet covers31 targets/620 crowd actors,620 single-family trials and7680 dense routes without failures, including extra rear pockets. Four rigs replay all20 rooms identically; three actual Brute edge regressions pass.

All five all20 geometry packets share SHA `e18ff45ab40c0dde0222e1aba76d6e67338d77e756730f641ca31f66cd885d44`. Working game source matched659 exactly. Proof/receipt: `artifacts/nextgen/l8-sim/revised659-hardproof/`. The frozen full-kit numeric extraction also passes and retains the baseline's exact input-function SHA: shares B33.1691/C32.6012/P42.3396/A32.6459%, clear93.25/97.15/80.70/89.05s, spread1.203841×,55 native kills/rig, all slots and earned Overdrive. Packet: `revised659-full-kit-comparison.json`. All52 observer/actor files remain byte-identical to baseline (`revised659-observer-actor-identity.json`, changes[]).

Both predeclared alternating-seed80 queues have launched on exact659: `artifacts/nextgen/playtest/l8-revised659-even80/` and `artifacts/nextgen/playtest/l8-revised659-odd80/`, two workers each. They use the unchanged vanilla npm runner/backendf7c6d801… and policy976eb173…, same40 seeds/rig as baseline and no outcome-dependent stopping. Orchestration waits for both child processes to close; every raw report is retained. Dispatch receipt: `artifacts/nextgen/l8-sim/revised659-dispatch.json`. FPS certification remains held until every worker exits.

Both queues compiled the same gameHash `5d88a05eb2f1b8ccfe9bb8bea8d30d946995e6a1b7418fcfdf3773dea6550df2` and bundleHash `b723abecd7574ca648fdbc749d4abfe4308665add6db5349b7e7d40b8d1bb9e6`. All160 finish:98 complete (61.25%), B42.5/C82.5/P52.5/A67.5%, maximum rig distance21.25pp, ordinary29.916667s. Completion, rig distance and strict ordinary pacing fail; Transmission61.516667s and every-rig OD cadence pass. All attempts remain natural, firstfive all clear, ordinary cap violations0. The packet `revised659-N160-comparison.json` retains the full failed results; no hard proof is substituted for balance acceptance.

## Mandatory c7 navigation repair and complete fixed160 audit

Extra actual opening-midpoint crowd coverage exposes six real native jams on
659 across Awakening, Atrium, Diagnostic(two), Workshop and Annulus. The
world-only fix `c7c75b985a30eb297596680cff9735e2ca86d6de` expires a retained
navigation leg after eight distinct existing native decision versions without
one unit of best-distance improvement. Plain geometry callers use distinct
positions; repeated speculative queries in one decision do not count. No
actors, abilities, policy, colliders, encounters or clocks change. All157 real
opening points/3140 native actors now pass the unchanged60s horizon and body
sweeps. All20 hard proof31 files1041 tests, candidate-overlay75 tests and six
untouched legacy91 tests pass; original failed states/traces remain. See
`L8-navigation-progress-repair.md` and `l8-sim/navfix-c7-hardproof/`.

A dormant three-ingress approach candidate passes structural/native proofs but
fails its single declared primary40 diagnostic. Actual source includes the
required c7 repair, with geometry override only and no observation counters.
The later vanilla c7 control40 isolates it: control B40/C50/P40/A70% versus
candidate B60/C80/P20/A70%, identical first-ten histories all40 pairs. Candidate
distance37.5pp and ordinary29.533333s fail; root rejects activation. Every
collider/aperture/arena/count remains current659 in live runtime. The failed
packet and exact three proposed coordinates remain in
`L8-service-approach-candidate.md` and `artifacts/nextgen/l8-service-approach/`.

Eight separately declared dispatch/OD observer replays on c7 pass exhaustive
native gameplay-field parity8/8 against the vanilla control before timelines
are interpreted. Seven complete, Cryo2718 dies room15 and its five unearned
late rooms stay absent. Actual room11–19 request tails span9.183–34.917s
(median16.392s), rather than nominal4.320–4.850s: a small nominal stagger is
not established pressure. The tool's core has a separate diagnostic hash;
none of these eight enters release metrics. Six Vitest contracts preserve
read-only/exactly-once/parity guarantees. `L8-c7-dispatch-observations.md`
retains counts, intervals, limitations and no selected pressure change.

Root then predeclares completing the original40-seeds-per-rig audit on c7:
reuse the40 genuine vanilla controls after exact identity proof and run the
remaining120 as two balanced60 queues with two workers each. Both finish60/60
exit0, with all owned workers reaped. All160 source/seed/game/bundle/backend/
metrics/policy checks pass, including52 frozen actor/model/observer/backend
paths identical baseline=c7=current. No override, assistance, new seed,
optional stopping, error or censor is present. No gameplay edit occurs during
the audit. `L8-c7-N160-audit.md` is the prospective declaration plus full result.

|Fixed160|Baseline7cee|Required c7 audit|
|---|---:|---:|
|Completion|88/160 (55%)|94/160 (58.75%)|
|B/C/P/A|47.5/75/35/62.5%|42.5/70/52.5/70%|
|Max rig distance / full range|20 /40pp|16.25 /27.5pp — fail|
|Strict ordinary median|32.175000s|29.916667s — fail|
|Transmission median|67.441667s|61.433333s|
|Rooms/OD B/C/P/A|1.428571/1.428571/1.363636/1.428571|1.428571/1.392857/1.422619/1.428571|

Firstfive clear160/160 each; ordinary OD cap violations0. Death rooms
10×1,12×5,14×2,15×6,16×17,17×10,18×6,19×2,20×17. The exact ordinary median
is below30 and is never rounded into acceptance. Breacher's maximum rig
distance remains16.25pp by the declared I5 method; inherited baseline skew
does not waive it. All320 matched before/after raw hashes and complete
primary/additional/combined/per-rig/per-room entry-debt, cast, damage and death
tables are in `artifacts/nextgen/l8-sim/c7-N160-comparison.json` and `.md`.
The +8 previously approved real requests remain unchanged. No new elite,
stagger, count or layout source is selected; native browser/hardware and
isolated full-kit evidence remain separate from this failed balance audit.
