# R4 organic playtest engineering report

## What shipped

Branch `t3/automated-playtest-bot`. Implementation HEAD `dfb0467492de5065811e5f7ba2f79fef1f643191`; final documentation commit SHA is recorded in the handoff. No push, PR, other-worktree changes, renderer implementation changes, audio implementation changes or balance changes.

- Reusable production Playwright player: native Start/rig/equip/draft/shop/route/destruction UI; native keyboard/mouse movement, aiming/firing, weapon switches, reload/grenades/medkits and Shift/Q/F/V. Pure tested policy, snapshot diagnostics, bounded effect receipts, audio source observation, earned-boundary recovery and JSON/HTML campaign aggregation.
- A diagnostic native-input clock fixes the capture hook's input replacement. Diagnostic URL seeds reach real UI Start; ordinary starts keep their normal deterministic sequence. Fixed 60 Hz stepping reads InputController each tick and renders each tick. Production presentation/feel is explicitly enabled in subsequent runs; pilot reports without `presentation:true` used the presentation-off fixture clock. The twelve story campaigns use no invulnerability, spawning, charge grants, direct combat actions, skipped rooms or injected movement/fire intent. The legacy graph requires the explicitly recorded initial-campaign factory after native rig selection because production has no legacy menu entry; it starts room one with zero boons/clears and ordinary room-entry resources. Legacy checkpoint validation remains unchanged.
- `npm run playtest -- --rig=<id> --seed=<n> [--assisted] [--rooms=N] [--headed]`; `playtest:smoke` requires three actual Arc clears and a 235-second wall limit. Reports and per-room evidence live under `artifacts/nextgen/playtest/<label>/`.
- Shop correctness fix `cceb004`: refuse paid recovery that provides no marginal health/armor after the standard allocation. Disabled native cards explain the reason. A detached real CombatSystem previews the result, preserving Field Medic armor conversion and all prices/amounts. Free collection and ammo services retain their existing behavior.

## Campaigns

Final campaign table and explicit selected labels are supplied by `artifacts/nextgen/playtest/campaign-summary/campaign-summary.json` and `.html`. Deaths are valid campaign outcomes; incomplete load interruptions are not presented as endings. Earned continuations keep their original parent evidence, seed, rig, boons, resources, charge and statistics and use real Continue. The resume helper requires registered screenshot/state evidence and a clear receipt for every completed node; it cannot advance an unfought encounter. Assisted evidence is separated from organic clear rates.

| Rig | Runs | Deepest | Ending clear rate | Median cleared-room time | Deaths | Overdrives | Clears / Overdrive |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| arc | 3 | 20 | 3/3 (100.0%) | 34.4 s | — | 95 | 0.63 |
| breacher | 3 | 20 | 2/3 (66.7%) | 36.3 s | 17: shielding-gate ×1 | 82 | 0.68 |
| cryo | 3 | 20 | 3/3 (100.0%) | 36.7 s | — | 85 | 0.71 |
| pyro | 3 | 20 | 2/3 (66.7%) | 32.1 s | 18: containment-annulus ×1 | 84 | 0.68 |

Seeds **1729, 2718, 31415** for every rig: **10/12 endings**, two natural deaths, **233 cleared rooms**. Five initially censored attempts were completed through earned-boundary Continue: Breacher1729/31415, Cryo1729, Pyro31415, Arc1729. Pyro31415 subsequently died in room18; its earlier loading-guard failure was tooling, not a death. Breacher2718 died in room17 with nearby crawler/carriers; Pyro31415 was surrounded by stalker/brutes/carrier after late attrition. Those causes are inferred, not authoritative attacker IDs. All twelve story runs recorded **zero console/page errors**; two retained runner-only loading-guard errors in their parent provenance.

Separate **assisted legacy Arc1729**: canonical room1 → Queen → completion, **12/12 rooms**, **680 kills**, Queen fight **218.75 s**, **32 Overdrives**, zero errors/defects. Incoming damage was15% throughout; no extra health, ammo, boons, spawns, charge or skipped encounters. Three legacy service rooms auto-clear on entry and are truthfully recorded as zero-second noncombat rooms. The legacy player initially followed only the selected map departure; this was corrected and a native branch probe proved selection of the safe combat alternative.

**18 page-close/Continue probes passed**, spanning 17 distinct screen types: title, rig, starting boon, combat, pause, reward, route, shop, settings/controls/credits drawers, pause loadout/settings/controls, destroy confirmation, death and completion. The extra route probe passed too. `lifecycle-jobs.json` and each fixture `checkpoints/*.json` contain receipts. No unexplained soft-lock, persistent live HUD desync, stuck movement, blank world or undismissed blocking onboarding was confirmed in these runs.

This is an observational coverage campaign, not a controlled rig-ranking experiment: the player evolved during collection; pilots without `presentation:true` used the fixture presentation clock, later runs used production feel, and live/continued segments retain separate provenance. Incoming damage attribution and ability-control value remain limited as described below.

## Defects and evidence

### R4-001 — medium — sim/UI — paid recovery with no marginal benefit — FIXED `cceb004`

Organic seed **2718**, Breacher, clear the first four rooms. In the Communal Atrium reward, health is **100**, armor **72.7568**, credits **785**, and build is Breacher/Afterquake/Chain Reaction/Seismic Impact (no Field Medic). The 100-credit “30 health” card is enabled although health is full. Seed **31415** similarly has **94.3789** health, which the pending free 35-health allocation already fills. Before the fix, `claimResources('heal')` applied free recovery, charged the service and applied a capped heal with no benefit, then advanced to route.

Before screenshots/state:
- `artifacts/nextgen/playtest/r4-breacher-2718/r4-communal-atrium-clear.png` / `.json`
- `artifacts/nextgen/playtest/r4-breacher-31415/r4-communal-atrium-clear.png` / `.json`

Regression: `tests/ShopServices.test.ts` checks full resources, allocation-filled resources, unchanged credits/resources/phase/storage on denial, ordinary beneficial prices/amounts, Field Medic full-health armor conversion, supplies rooms, affordability and accessible native disabled cards. No balance values changed.

### R4-002 — medium — render preparation — reactor room load exceeds five seconds — OPEN

Breacher seeds **1729**, **31415**, and Cryo seed **1729** organically cleared 18 rooms and encountered a >5-second hold entering **Manual-control chamber**, room 19. The pilot runner originally stopped at that detection threshold; the reusable runner now records it and continues waiting up to a separate 120-second timeout. Earned-boundary continuations finish those interrupted campaigns without replaying or advancing unfought content.

Evidence: `artifacts/nextgen/playtest/r4-breacher-1729/loading-*.png` / corresponding `.json`, plus each parent `report.json`. Cryo31415 later measured the full Manual-control preparation hold at **14.03seconds**; Cryo2718 measured **5.82seconds**, both recovering to the ending. Steps: start the given seed/rig, fight and collect all 18 room rewards normally, take the route into Manual-control chamber. No exceptions were reported at the hold. Render owners should profile room surface/model readiness, reflection capture and shader warmup before moving any preparation off the input-blocked path. Do not simply release input before preparation is actually safe.

### R4-005 — medium — UI — Credits action bound to hidden HUD label — FIXED `12c285a`

The full production DOM contained HUD `<span id="credits">` before the title `<button id="credits">`. Global lookup attached the Credits click listener to the hidden HUD value; the title action and return focus failed. Evidence: `artifacts/nextgen/playtest/credits-duplicate-evidence/failure.png`, `failure.json`, `report.json` (strict locator reports both nodes). Repro: fresh title, click Credits; no drawer. The title control is now `#menu-credits`, retaining the stable HUD `#credits`. `UiScreens` now mounts the real HUD span and verifies opening, unique ID, unchanged currency, and both close-focus returns. Native `r4-checkpoint-tabs/checkpoints/menu-credits-before.png` confirms the fixed drawer and successful reload.

### R4-006 — medium — sim/UI/render profiling — CPU headroom — OPEN finding

Serial passive native-RAF Cryo1729 replayed the earned last two rooms at 1920×1080 High with no competing R4 browser. Core update/render/effect/hurt functions and audio remain unwrapped. Final rolling CPU p50/p95 were **4.4/6.7ms**; live rolling p95 reached **10.2ms** in Manual-control and **12.0ms** in Overload; observed live-window maxima reached **17.0/20.3ms**. This does **not** certify the 8 ms CPU budget. Snapshot/pathfinding queries still add observation/scheduling overhead; profile a normal user run before assigning cause or changing simulation/render quality.

Evidence: `r4-serial-late/report.json` → room `nativeFrameWindows`, `r20-overload-floor-mid.png` / `.json`, `hardest-sprite.png`. Steps: `npm run playtest -- --resume-boundary=artifacts/nextgen/playtest/r4-cryo-1729/r18-containment-annulus-clear.json --realtime --label=r4-serial-late`. No safe single-owner optimization was established; no quality or gameplay assertion was reduced.

### R4-003 — high (tooling only) — UI/debug clock blocker — native input discarded by diagnostic clock — FIXED `5f0d737`

The original `?debug=1` hook replaced `game.update` and used a private synthetic `controls` record in both realtime and fixed stepping. Native held WASD/mouse fire could not advance through it. Opt-in `nativeInput(true)` now reads the real controller; default capture fixtures remain unchanged. `tests/PlaytestNativeInput.test.ts` proves native movement/fire, release, realtime forwarding, loading freeze, diagnostic seed validation, unchanged ordinary hurt, constrained assisted scaling and timing/effect receipts.

### R4-004 — medium (tooling only) — UI/debug clock — snapshot/clock readiness race — FIXED `7d6d010` plus atomic runner advancement

Pyro31415 stopped after11 clears and Arc1729 after18 when room preparation began between a state read and a later `step()` call. The original guard correctly threw `Room is still loading`; there was no application page exception. Native readiness now uses the exact application graphics/loading/recovery/revision predicate, checked atomically with advancement. Fixed batches recheck it before every tick and discard the remainder if preparation starts. The original initial-loading rejection remains. Pure regressions cover initial recovery, a load beginning after the first tick, default fixture behavior, realtime feel, zero-scale hit-stop and unscaled UI clock consumption. Both campaigns continue from proven prior earned boundaries; raw tooling errors remain in their provenance.

### Transient native restart lead — render — OPEN investigation

The first final desktop smoke passed graphics/audio/native input/assets then logged nine `THREE.GLTFLoader: Couldn't load texture blob:` errors in restart, failing the unchanged zero-error assertion. `gates/smoke-first.log` retains the complete failure. A serial rerun of the same checks passed with zero errors; no errors were filtered and no timeout/assertion changed. Failure-only screenshot/state capture was added to `scripts/smoke.mjs` for recurrence; no screenshot of this nonreproduced first occurrence is available. This is a gate-only transient, not an organic-campaign exception. Render owners should inspect image-decode/blob ownership across reload/restart.

### Dismissed diagnostic lead — HUD overlap during preparation

`r4-cryo-2718/defect-0.png` / `.json` recorded projected actor bounds while `loading:true`; the screenshot shows the room-preparation overlay and the marine clear of the opaque status HUD. Actor/camera state was between room revisions. The detector now requires consecutive settled same-room playing snapshots before alleging HUD overlap, with a regression retaining the actual settled-overlap assertion. The original evidence is retained and marked dismissed in final triage; it is not a game defect. The superseded instrumented realtime trial also sampled changing ammunition at the80ms HUD cadence; stable-authority/shots-counter regressions now prevent that alias from being called a persistent desync.

## Tuning proposal (no values changed)

Proposed experiment, not a balance patch: change Overdrive charging from `damage / 6000 + kills * .025` to **`damage / 12000 + kills * .0125`**, preserving Drive Dynamo's ×1.3. Cryo seed31415 (without Dynamo) generated 107,020 damage and604 kills:32.94 potential base meters, spent29 over20 rooms (0.69 rooms/use), with four uses in the77.1-second final fight. Halving both contributions yields16.47 potential meters before saturation, a plausible1.3–1.6rooms/use. Re-run the same policy/seeds before adopting; do not infer Arc's value from direct ability damage alone.

Transmission (room10) is deliberately a holdout: across the final twelve runs its median was **90.4s**, versus pooled adjacent-room median **38.3s** (2.36×). Trial **32 spawns at 750 ms** in room10 only, replacing 40 at 900 ms; last scheduled request falls from35.75s to23.9s plus pending warning delay. Target 60–75 s median while preserving the 48-spawn final climax. Keep global enemy health/damage and rig damage unchanged until the full cross-rig sample and human playtest; the one initial death at room 17 followed heavy room 15–16 attrition, while Cryo completed the campaign.

Aggregate source shares (weapon / direct ability / status / boon): **Breacher56.0/21.8/3.5/18.7%**, **Cryo49.4/21.6/5.5/23.5%**, **Pyro51.1/19.4/16.1/13.4%**, **Arc63.0/24.2/7.1/5.7%**. Weapons remain the largest source. No evidence warrants declaring a zero-damage wall useless or buffing direct ability damage: control, protection, proc damage and Overclock weapon amplification are not isolated by those columns. The bot used all slots; per-slot uses and bounded per-ability receipts are in each room report. No per-augment damage/survival causal claim is justified from three seeds and one policy.

Do not interpret direct `damageDealt.ability` as the complete value of a rig. Ability-applied burn/shatter/procs appear in status/boon sources; Arc Overclock boosts weapon damage; Bulwark/control are useful without direct damage. Bounded per-ability effect receipts are supplemental, while run-stat source totals/use counts are authoritative. Incoming damage source labels are explicitly inferred from nearby contacts/hazards and are not authoritative attacker attribution.

## Performance and memory

High, 1920×1080, DPR 1, ANGLE Metal. Campaigns use at most two concurrent browsers. Fixed-step CPU update+render submission timing is exposed through `__containmentPerformance.debugFixedStep`; it is not GPU frame completion or a realtime FPS certificate. Percentiles retain the latest 2048 fixed ticks; mean/max cover the period since diagnostic reset (room entry in later runs, page lifetime in pilots). Room metadata states that scope. Ordinary RAF diagnostics are retained separately and are mostly idle overhead in accelerated mode. Per-room heap/geometries/textures and shader-program/peak-draw samples are recorded; page recreation, asset caches, GC and machine contention must be considered before claiming a leak or frame-budget regression.

The serial result and rolling windows are reported above. The two-browser organic cohort is a stress/coverage sample, not a hardware certificate. Sampled combat draw peak was **167**, below the350-call target. New cohorts' shader-program counts stayed constant within observed rooms (roughly917–980+ variants across environments), providing no proof that the observed fixed-step stalls were mid-fight shader compilation. Main-run sampled heap peaks were **180.7–217.8MB** by run; geometry maxima160–162 and texture maxima109–110. End resources dropped to115–129 geometries and94–108 textures across different rooms. Heap was nonmonotonic, and page recreation resets caches: no leak was demonstrated.

Audio spies recorded source starts/stops, bounded recent receipts and context clocks throughout main/lifecycle runs. Nonplaying checkpoint evidence and the full audio-wiring gate showed cleanup; legitimate scheduled fades are not treated as leaks. Passive timing deliberately disables the spy to avoid adding its hot-path cost. No sound-quality judgment is made.

## First eight evidence files

1. Fixed paid-heal availability: [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-shop-proof/checkpoints/shop-before.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-shop-proof/checkpoints/shop-before.png)
2. Fixed Credits drawer: [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-checkpoint-tabs/checkpoints/menu-credits-before.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-checkpoint-tabs/checkpoints/menu-credits-before.png)
3. Organic Cryo ending: [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-cryo-31415/terminal-complete.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-cryo-31415/terminal-complete.png)
4. Natural Breacher death/debrief: [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-breacher-2718/r17-shielding-gate-dead.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-breacher-2718/r17-shielding-gate-dead.png)
5. Pyro hardest-moment burst: [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-pyro-2718/hardest-sprite.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-pyro-2718/hardest-sprite.png)
6. Arc hardest-moment burst: [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-arc-31415/hardest-sprite.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-arc-31415/hardest-sprite.png)
7. Real legacy Queen fight (assisted): [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-legacy-arc-assisted/r12-reactor-vault-mid.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-legacy-arc-assisted/r12-reactor-vault-mid.png)
8. Reactor preparation hold: [/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-cryo-31415/loading-2961.png](/Users/chernodub/.t3/worktrees/containment-game/t3-07aaff4e/artifacts/nextgen/playtest/r4-cryo-31415/loading-2961.png)

## Gates

Logs: `artifacts/nextgen/playtest/` and final gate log directory.

- `npm ci`: 61 packages installed; no dependency changes.
- Initial `npm run build`: TypeScript + Vite passed; existing large-chunk warning.
- Targeted playtest/native/shop/game/ammo tests: 10 files / 82 tests passed before final gates.
- Initial native pilot smoke: three actual clears, 89.02 seconds, zero errors.
- Full Vitest via `npm run verify`: **195 files passed / 1 skipped; 2457 tests passed / 1 skipped**,130.67s. Exact required `vitest run --exclude scripts/cryo-model-preview.test.mjs` command executed by npm test.
- Node Cryo checks: **2 passed / 0 failed**.
- `npm run verify`: reaches the documented pre-existing `FileNotFoundError: blender` in `test_monitor_artifacts.py`; no Blender installation or asset-test change.
- `npm run build`: TypeScript +Vite passed; existing chunk-size warning.
- `npm run test:room-evidence`: **28 passed**, ragdoll CPU33 checks passed.
- `npm run test:smoke`: final serial rerun passed all original desktop, checkpoint, rig, audio and error assertions. Initial restart texture failure retained separately above.
- `npm run test:authored-smoke:all`: Passenger Vault, Breached Loading Bay, Overload Floor passed native desktop movement/fire; errors:[] in all3.
- `npm run playtest:smoke`: **3 actual rooms cleared in72.27s**,0 errors,0 defects, under235s wall guard.
- `npm run capture -- --label=r4-ui-720-final --scenarios=shop,destroy-confirm,title --width=1280 --height=720`: **3 verified PNGs**, no capture errors. Opened the fixed shop at720p and earned-shop proof at1080p: copy fits, collection remains prominent, no clipping. Native organic final/Queen/burst images were also opened; the Queen crown can sit behind her boss bar and interim pylon meshes still need the concurrent render/VFX polish. No renderer file changed.

## Tests rewritten/removed

No existing assertion was weakened or removed. `UiScreens` changes the native Credits selector to `#menu-credits`, adds the real HUD value to its fixture, and adds stronger opening/focus/uniqueness coverage; the existing action assertions remain. The extracted RAF fixture in `SafeRoomLoading.test.ts` receives a stub for the new diagnostic observer; its gameplay/loading assertions are unchanged. New playtest diagnostics tests were corrected to require settled room state for HUD projection comparisons, preserving actual opaque-HUD overlap detection. All phone/touch testing remains out of scope per AGENTS.md.

## Integration requests and limits

Render owners: investigate R4-002, the transient texture lifetime lead, CPU headroom attribution, and the legacy Queen crown/boss-bar overlap in organic boss evidence. Keep readiness/input guards; do not hide failures by weakening them. No renderer file was edited. Audio lifecycle observations can establish scheduling/source-stop behavior, not listening quality. The bot cannot judge feel, sound, beauty, onboarding comprehension, or whether telegraphs read naturally to a human. Organic outcomes are evidence about this stated policy and these seeds, not an exhaustive proof of balance or correctness.

Artifacts remain gitignored. Campaign JSON/HTML has explicit source selection, raw state/seed/input traces, parent provenance, per-room start/mid/clear captures and hardest sheets. Continued runs retain parent galleries rather than flattening all shots into one folder. Pilot hardest sheets can be pressure montages; later sheets are four consecutive clock samples. Authoritative incoming-attacker attribution, per-augment/control causality, human feel/sound/beauty, and a clean unobserved GPU performance certificate remain outside what this bot establishes. Outgoing source totals and slot-use counts are authoritative.

The corrected route inspection was verified by `r4-legacy-route-proof`: Continue from the earned room9 boundary, inspect the alternative and enter `1729:v2-r9-combat` rather than the initially selected elite; all route/checkpoint assertions passed. This supplemental branch replay and lifecycle/serial fixtures are excluded from the12-run balance table.
