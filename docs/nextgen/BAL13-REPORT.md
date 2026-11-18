# BAL13 — converged balance and observer repair

Branch: `t3/native-run-balance-gap`. Gameplay/policy validation distribution: `95c3da6618fbbda8eac17606bfa4bb90f1e9c8c9`. Integration merge: `0f792e0047498739ef4390cf2e9ac5f1f80ec813`, incorporating `nextgen` at `d53b892c51430e055fbcc33097504307ae8f8e50`.

**Converged per the lead decision; full balance and observer acceptance is not established.** Final simulations completed Story 50/80 (62.5%), Standard 45/80 (56.25%), Veteran 10/80 (12.5%). All 240 reached room 6. Standard is one completion above its pooled target ceiling. Story Pyro and three Veteran rigs miss the half-of-best floor. All four final native attempts completed, while their paired simulations completed only one of four: the remaining outcome gap is substantial.

## Cause and source fixes

Different camera/HUD/aim observers generated different bot inputs, while excessive incoming damage and late healing made native mistakes lethal. This identifies concrete mechanisms, not a measured allocation of the gap among causes or proof that every remaining discrepancy is observational.

The R12-B designer review (§5) correctly separates the five historical review attempts from ENC12's larger simulation samples. Its Standard Pyro example received 44 + 44 + 41.84 damage while carrying two medkits: the old below-40 heal rule ignored 41.84 health. Standard's former 2× incoming multiplier and Story's 1.3× multiplier amplified those mistakes. Our controlled baseline also found same-seed differences, including Standard Cryo seed42 completing in sim but dying after three native clears.

The repairs are committed, including the `fx.spawn` harness repair in `5ccf64e3`:

- Final typed combat damage is capped after elite/depth/difficulty and build modifiers. Actual heavy damage starts an anti-chain timer. First-four-room counts are protected from difficulty scaling, with a revealed Stalker lesson and guaranteed Story recovery.
- Shared human policy heals at ≤55 when safe or facing a visible lethal threat, admits smaller grenade/Overdrive emergencies, and gives novice consumables seeded notice/hesitation. Veteran lethal estimation uses the public difficulty factor; no hidden attack cooldown is read.
- `src/game/observation/combatVisibility.ts` owns normalized HUD viewport conversion and point visibility for both observers. CPU framing now uses the production camera/HUD/room controllers, fitted actor metadata, screen-space aim error and returned screen cursor. It retains camera spring/trauma/framing state across rooms, starting from the native title focus.
- `combatPresentationClock.ts` shares presentation-hold requests. The CPU observer advances the same pure PresentationHold clock; GameFeel supplies the authoritative step in both drivers. Camera/pose holds never scale the authoritative game clock.
- The renderer visibility callback was removed from DepthGame's optional auto-aim. InputController resolves native visible aim assist before supplying an explicit angle; core auto-aim uses deterministic geometry.
- PickupSystem previously promoted every positive efficiency below 1 back to1. Fractional recovery multipliers now work. This affected both runners; it was not a native-only geometry fork.

### Coupling audit

| Boundary | Finding / state feedback |
|---|---|
| DepthGame GameEffect / CombatSystem callbacks | Synchronous output callbacks; return values do not determine hits. A throwing observer can abort a harness step. The crash was the CPU harness invoking production ability presentation with an incomplete effect-kit stub; writable inert `fx.spawn` slots repair that contract. It was not a gameplay read of an effect object. |
| Optional auto-aim | A real injected `aimVisible` renderer callback existed; removed. Native input now converts visible camera information to explicit GameInput outside core. |
| Native pointer / visibility / torso projection | Camera, HUD reservations and fitted model heights affect observations and supplied inputs. Shared math/controllers reduce this mismatch; static CPU marine bounds versus animated native bounds remain. Model metrics are observer inputs, not authoritative collision radii. |
| GameFeel and presentation feedback | Explicit supplied-delta boundary. Ability feedback, camera trauma, presentation holds and room-reset history affect later observations. The CPU harness models these; no wall clock enters DepthGame. |
| Room geometry / footprints | Source inspection found shared pure room/furnishing geometry and catalog radii, with no native-only collider insertion or model-file radius feeding core. The merged I13 guardian radii/shapes are authored in shared bossDefinitions data. This is an inspection finding, not a scripted native/core hash proof. |
| Bullet visualMuzzle / corpse queries | Output metadata and pure movement queries for visual corpses; authoritative live movement/projectile collision uses game geometry. |
| Saves / audio | Validated injected checkpoint/storage input at boundaries; audio is the explicit Web Audio presentation boundary. No DOM, Three.js, wall clock or Math.random dependency was found in DepthGame's gameplay path. |

A same-script, per-second native/core state-hash comparison was **not completed**. Its unused draft was removed during convergence. Exact core replay equality and the first remaining divergent input/state are therefore unproven. The final four-run table below prevents the shared-module work being mistaken for completed observer calibration.

## Non-negotiable rules — final merged source

- **Standard hit bounds confirmed:** Crawler12, Stalker26, Spitter12, Carrier22, Brute42; incoming difficulty multiplier 1.0; CombatSystem clamps after the build multiplier.
- **Story/Veteran hit bounds confirmed:** Story 8.4/18.2/8.4/15.4/29.4; Veteran 15.6/33.8/15.6/28.6/45, in the same family order; no typed combat hit above 45% of base100 health.
- **Anti-chain grace confirmed:** actual armor+health damage above 20 starts two simulation seconds of 75% reduction to subsequent Crawler/Stalker/Spitter contact hits; reset on room entry.
- **Teaching confirmed:** rooms 1–4 ignore difficulty count scaling; room 3 first presents one nonelite, permanently revealed Stalker with 1.65× lesson wind-up, clear-gated before the first Stalker pair in room 4.
- **Story recovery confirmed:** clearing room 3 restores 35 health, capped normally, before the first supply stop.
- **Bot rules confirmed:** heal≤55 when safe/visible-lethal; grenade threshold 4 normally/2 in emergencies; Overdrive admits two-enemy emergencies; novice adds200 ms notice and20% chance of 400 ms extra hesitation; decisions use perceived visible state.
- **Shared visibility confirmed:** both native and CPU observers import combatPointVisible and share writeCombatViewport through HudCombatFraming; no separate analytic visibility-bound implementation remains.

Direct unattributed debug-fixture hurt and staged ending/debrief damage remain available; they are not ordinary combat attacks. All native combat callers carry typed origins. Grace reduces the specified small-family chain; it is not a proof of a universal two-second minimum time-to-death against every heavy/ranged combination.

## Chosen configuration and rig work

The freeze is `354dc2b5`; `95c3da66` adds only the Veteran lethal-hit policy correction. The temporary Nova13 s experiment was reverted to the measured12 s value before confirmation. No further balance iteration followed the convergence decision.

| Mode | Incoming | Base waves | Pickups | Late waves | Late rest | Late melee admissions |
|---|---:|---:|---:|---:|---:|---:|
| Story | .7 | 1.25 | .8 | 2.1 | .75 | 4 |
| Standard | 1 | 1.5 | .55 | 2 | .65 | 4 |
| Veteran | 1.3 | 1.5 | .45 | 2.5 | .6 | 3 |

Late applies from depth 10 (room 11). Story/Standard keep one additional Spitter in each late authored Spitter group. Veteran trades the final Crawler in each late pack for a Spitter, preserving the original arrival index/time. The `windups`/`lateWindups` levers bound melee admissions; they do **not** shorten warning duration. Guardian health, speed and timers were not tuned by BAL13.

Rig diagnosis found Pyro's shorter escape protection and fragile Meltdown Core payoff, and Arc's Live Wire terminating immediately when its focus target died. Retained changes: Afterburn400 ms protection (distance/recharge unchanged), Flashfire5 s, Meltdown Core600 ms escape immunity at its unchanged-damage burst; Live Wire retargets a nearby living LOS foe for its remaining lifetime, with stable ID tie-break and existing range/wall breaks; Overload7 s. Bulwark20 s and Nova12 s open protective recovery gaps. No enemy damage spikes or player attack-damage increases were used. These changes improved some cohorts but did not solve final Veteran/Pyro parity.

## Final simulation confirmation

One fresh cohort per mode, unassisted,20 seeds ×4 rigs, maximum3 workers, modes serially. All runs ended naturally in death or completion. Median death room below excludes completions; early-death share uses all 20 runs per rig. Rooms are one-based.

| Mode / profile | Rig | Completion | Median death room | Dead before room 6 |
|---|---|---:|---:|---:|
| story / novice | breacher | 16/20 (80%) | 14.5 | 0% |
| story / novice | cryo | 15/20 (75%) | 12 | 0% |
| story / novice | pyro | 7/20 (35%) | 14 | 0% |
| story / novice | arc | 12/20 (60%) | 15 | 0% |
| standard / competent | breacher | 13/20 (65%) | 12 | 0% |
| standard / competent | cryo | 13/20 (65%) | 12 | 0% |
| standard / competent | pyro | 7/20 (35%) | 14 | 0% |
| standard / competent | arc | 12/20 (60%) | 15 | 0% |
| veteran / competent | breacher | 2/20 (10%) | 11 | 0% |
| veteran / competent | cryo | 6/20 (30%) | 10.5 | 0% |
| veteran / competent | pyro | 1/20 (5%) | 11 | 0% |
| veteran / competent | arc | 1/20 (5%) | 12 | 0% |

Pooled: Story 62.5%, median death14; Standard 56.25%, median death12; Veteran 12.5%, median death11. All have 0/80 deaths before room 6. Story's ≥90% early-survival requirement passes at 100%; Standard's median≥9 passes. Standard's completion ceiling misses by 1/80. Rig floor: Story 7<8 (best 16), Standard 7≥6.5 (best 13), Veteran 2/1/1<3 (best Cryo 6). Per-rig spread remains wide even where the pooled band passes.

Seeds: `1729,2718,31415,42,137,8675309,2026,9001,65537,123456,17,23,101,256,512,1024,4096,8192,16384,32768`.

All three frozen bundles have gameplay hash `e1dc71bd4d42a802baa5b78029f460d573067df6b69ebbe12d27b158d999ff9b`. Story began on `354dc2b5`; Standard/Veteran on `95c3da66`. The intervening public-difficulty/lethal-estimate change only changes Veteran behavior: Story/Standard retain the same conservative Standard hit estimate and RNG draws. Exact policy/backend hashes and source snapshots are retained per cohort.

## Four final native confirmations

Seed1729, unassisted, serial foreground campaigns, one browser at a time, frozen distribution `95c3da66`. `--fast` retains 60 Hz game and scene/camera stepping plus 100 ms policy observations; only intermediate GPU submissions are omitted. This is not realtime performance/FPS evidence. Native reports confirm selected difficulty/profile, authored tuning enabled and incoming assistance scale 1.

Damage columns sum authoritative receipt-based damage by family, rounded to one decimal; sim on-hurt counters reconcile to total damageTaken, native receipts are deduplicated across the complete trace and final stats. Legacy proximity-inferred damage is excluded. A dash death room means completion.

| Mode / profile | Rig | Sim clears / death room | Native clears / death room | Sim top damage | Native top damage | Errors / defects |
|---|---|---:|---:|---|---|---:|
| story / novice | cryo | 20 / — | 20 / — | crawler 803.9; stalker 504.4; spitter 211.1 | crawler 831.2; stalker 517.4; spitter 127.0 | 0 / 1 |
| story / novice | pyro | 13 / 14 | 20 / — | stalker 337.4; crawler 229.2; spitter 25.8 | stalker 541.3; crawler 514.2; spitter 111.1 | 0 / 0 |
| standard / competent | cryo | 11 / 12 | 20 / — | crawler 436.9; stalker 110.0; spitter 41.3 | crawler 586.5; stalker 367.4; spitter 223.1 | 0 / 0 |
| standard / competent | pyro | 11 / 12 | 20 / — | stalker 254.1; crawler 117.0; spitter 95.7 | crawler 513.0; stalker 300.3; spitter 95.5 | 0 / 0 |

**The final native campaigns do not agree closely with the paired sim outcomes.** Native 4/4 versus paired sim 1/4 is a descriptive single-seed sample, not a completion-rate estimate. Three native campaigns outlived their paired sim by 7–9 clears. Do not use the sim percentages as calibrated native or human win-rate predictions.

Story Cryo returned exit1 solely for a medium `room-loading>5s` diagnostic: Manual Control Chamber6597 ms, evidence `loading-10026.png`. It naturally completed with zero runtime errors. The other three returned exit0 with zero errors/defects. No outcome was retried to obtain a better result. Native family maxima stayed within mode caps, and all four receipt sums reconcile to recorded totals (largest floating residual <1e-9).

## Controlled baseline gap

Before these fixes: Standard/competent14/32 (Breacher 4,Cryo 3,Pyro 3,Arc 4); Story/novice17/32 (6,4,4,3), eight seeds per rig. Native baseline coverage was Cryo: eight Standard seeds and four Story seeds. The table below contains all 12 actual native pairs; the complete64-row simulation table, including explicit unrun-native cells, is retained as `baseline-gap.tsv`. The lead's final convergence scope replaced the unfinished earlier native matrix.

| Mode | Rig | Seed | Sim clears / death room | Native clears / death room | Sim top damage | Native top damage |
|---|---|---:|---:|---:|---|---|
| standard | cryo | 137 | 3 / 4 | 5 / 6 | stalker 130.0; crawler 100.0 | crawler 320.0; stalker 94.6; spitter 40.5 |
| standard | cryo | 1729 | 7 / 8 | 5 / 6 | crawler 223.0; stalker 175.5; spitter 82.0 | crawler 280.0; stalker 138.6; spitter 16.0 |
| standard | cryo | 2026 | 6 / 7 | 3 / 4 | stalker 174.9; crawler 160.0; spitter 61.5 | crawler 220.0; stalker 68.0; spitter 20.2 |
| standard | cryo | 2718 | 3 / 4 | 3 / 4 | brute 65.7; stalker 44.0; spitter 20.3 | stalker 90.0; crawler 60.0 |
| standard | cryo | 31415 | 20 / — | 6 / 7 | crawler 663.0; stalker 585.2; spitter 294.6 | crawler 418.9; stalker 176.0; spitter 65.1 |
| standard | cryo | 42 | 20 / — | 3 / 4 | crawler 489.0; stalker 308.0; spitter 133.8 | stalker 176.0; crawler 108.7; spitter 40.3 |
| standard | cryo | 8675309 | 20 / — | 10 / 11 | stalker 842.6; crawler 795.0; spitter 252.8 | crawler 909.0; stalker 182.0; spitter 154.0 |
| standard | cryo | 9001 | 5 / 6 | 3 / 4 | crawler 168.2; stalker 88.0; spitter 82.9 | crawler 160.0; stalker 43.0; spitter 20.0 |
| story | cryo | 1729 | 7 / 8 | 3 / 4 | crawler 266.7; stalker 85.8; spitter 13.1 | crawler 170.8; stalker 85.8; spitter 52.6 |
| story | cryo | 2718 | 7 / 8 | 11 / 12 | stalker 267.1; crawler 65.0; brute 45.5 | stalker 327.5; crawler 215.6; spitter 163.8 |
| story | cryo | 31415 | 20 / — | 20 / — | crawler 865.8; stalker 200.2; spitter 163.9 | crawler 1332.5; stalker 400.4; spitter 317.0 |
| story | cryo | 42 | 20 / — | 20 / — | crawler 577.9; stalker 343.2; spitter 188.2 | crawler 483.0; stalker 466.2; spitter 170.4 |

Standard Cryo baseline completed 3/8 in sim versus0/8 natively. The four paired Story seeds completed 2/4 in both runners but differed in early clears. All 12 native baseline reports had zero runtime errors; Story 31415 had one loading diagnostic. Receipt totals reconcile. The five historical review attempts at `581c325e` are retained separately in `review-native-historical.json`; their Standard clears11/6/2/7 and Story Cryo 3 are not pooled with this controlled baseline.

## Integration, verification and remaining concerns

`npm ci` passed at task setup. Pre-merge build and the post-merge `npm run build` passed (TypeScript noEmit + Vite; existing large-chunk warning only). No automated tests or test infrastructure were added or run. Native lesson evidence was inspected at 1920×1080 and a480×270 downsample; this was desktop evidence, not mobile testing.

`git merge nextgen` retained incoming lighting, UI, markers, elemental feedback and I13 boss data. Three conflicts were resolved: DepthGame kept the35 HP heal alongside encounter cues/podOrigin; EnemySpawnOptions kept both Stalker lessons and podOrigin; DepthRenderer kept the shared-observer and SiegeBoundary imports. Reserved boss promotion radii/melee/charge selectors, Matron hatch-ring placement, guardian occupancy and bossDefinitions are preserved. No BAL13 tuning changed their health/speed/timers.

The requested order put integration **after** the cohorts/native campaigns. Thus `0f792e00` has a passing integrated build but was not recampaigned: the tables validate the frozen95c3da66 balance/runtime, not the merged boss-footprint/UI/lighting changes. The gameplay ceilings, grace, teaching/heal, bot policy and shared visibility were retained in merged source. No new tuning followed this report.

Minimal BAL13 presentation-boundary exceptions: DepthRenderer delegates visibility and existing hold requests to shared pure functions; HudCombatFraming delegates viewport conversion; InputController/UI application move visible Space aim assist out of core; the staged debrief fixture uses typed legal Brute hits. BAL13 did not author lighting, model, motion, UI art or effects. Those incoming changes belong to their respective merged streams.

Remaining concerns are material: incomplete observer parity and no scripted state-hash proof; static CPU marine bounds/fixed1920×1080 HUD reservations versus animated/live-DOM native framing; only one final native seed per mode/rig; Story/Veteran rig-floor misses and Standard's one-win-high pooled result; a native loading defect; and the unrecampaigned integration. Early survival now has strong bot evidence, but this is not a guarantee for first-time human players.

Evidence is under `artifacts/nextgen/bal13-final/`: `final-sim-results.json/.tsv`, all 240 reports plus frozen sources in `sim/final-*`, four full native reports/traces/screenshots in `native/`, `final-native-comparison.json`, `native-commands.json`, frozen `runtime/` with SOURCE_SHA/asset manifest, baseline reports/receipts/sources,64-row gap table, aggregate tuning history and observer-reset comparison. Retired raw cohorts, stale progress documents and unused probes were deleted. No push or PR.
