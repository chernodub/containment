# Next-gen visual review

Capture the **real production application**, including its DOM HUD, at High graphics quality. These are staged visual fixtures, not evidence of organic encounter balance or performance certification. Desktop keyboard/mouse remains the supported target.

```sh
npm run capture -- --label=baseline --scenarios=all
npm run capture -- --label=armory-review --scenarios=combat-calm:armory,combat-heavy:armory
npm run capture -- --label=ui --scenarios=title,title-settings,starting-boon,reward,route,pause,dead,shop
npm run capture -- --label=vfx --scenarios=status-vfx,boss --burst=8 --headed
```

The runner automatically builds missing/stale `dist/`, then serves it under `/containment/`, like the production smoke. It never serves Vite development modules. Fonts are self-hosted under `public/fonts/` with OFL licenses. Requests to a font CDN fail the capture gate; the manifest records loaded font faces.

## Options

Use `--name=value` for valued flags.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--label` | `baseline` | Output directory under `artifacts/nextgen/` |
| `--scenarios` | `all` | Comma-separated scenario names; room scenarios also accept `name:templateId` |
| `--rooms` | Ten rooms below | Overrides rooms expanded by `all` or an unqualified combat scenario |
| `--burst` | `4` | Frames per burst scenario; every burst also produces a sprite-sheet PNG |
| `--step-ms` | `150` | Fixed simulation milliseconds between burst frames (1–1000) |
| `--sprite-width` | `960` | Maximum sprite-sheet cell width; full-resolution individual frames are retained |
| `--compare` | Off | Two existing labels, comma separated; produces standalone side-by-side HTML without launching a browser |
| `--width`, `--height` | `1920`, `1080` | Desktop viewport in CSS pixels |
| `--dpr` | `1` | Browser device scale factor; the game's existing High-quality DPR cap still applies to its canvas |
| `--timestamp` | Current ISO time | Timestamp written to the manifest/contact sheet; does not drive simulation |
| `--seed` | `1729` | Unsigned 32-bit simulation/visual fixture seed |
| `--build` | Off | Forces a production build |
| `--headed` | Off | Uses visible full Chromium, useful if the headless GPU path is unavailable |
| `--keep-going` | Off | Continues after scenario failures; still exits non-zero and records failures |
| `--help` | Off | Prints a short command summary |

The default rooms are `awakening-bay`, `communal-atrium`, `armory`, `breached-loading-bay`, `relay-racks`, `safety-interlock-station`, `service-shaft-landing`, `infested-workshop`, `containment-annulus`, and `overload-floor`.

The runner launches **full Chromium** (`channel: 'chromium'`), first with ANGLE Metal on macOS and GPU/blocklist flags, then with the default hardware backend. It probes WebGL2's `UNMASKED_RENDERER_WEBGL` and rejects software renderers during hardware attempts. If needed it installs the cached Playwright Chromium. The final automatic fallback explicitly enables SwiftShader. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` overrides the executable. The manifest records each attempt, the selected renderer, and whether hardware acceleration was verified.

## Scenarios and output

- `title`, `title-settings`: menu with/without settings.
- `starting-boon`: deterministic new-run boon draft.
- `combat-calm:<templateId>`: just-loaded room, native gameplay camera and HUD, before combat advances.
- `combat-heavy:<templateId>`: legal local fixture with at least 12 visible enemies on **every** frame, real weapon firing and a timed grenade blast; projectiles and muzzle flash are required somewhere in the burst.
- `status-vfx`: rifle fight with actual burn, chill, freeze and poison mutation states. Reactor arcs provide shock visuals; caustic poison supplies the acid-like status effect. Statuses are checked across the burst.
- `boss`: legacy v2 Queen encounter in `reactor-vault`, boss and boss HUD required. The current story campaign does not contain the Queen, so this intentionally uses the supported legacy run graph.
- `reward`, `route`, `pause`, `dead`, `shop`: the real game panels. Shop uses the Communal Atrium's Infirmary reward with purchasable services.

Outputs are PNGs named `<scenario>[-<room>][-<frame>].png`, burst sheets named `<scenario>[-<room>]-sprite.png`, `manifest.json`, `pngs.txt` (absolute PNG paths), and `index.html`. The contact sheet embeds all PNG data and works as a single standalone HTML file; click a shot for its full-size image. The manifest contains commit, timestamp, viewport, renderer, launch options, font fallbacks, per-shot performance snapshot (`frameMs.average`, draws, triangles), simulation state, visible enemy count, status evidence, screenshot pixel samples, and console/page errors. Timings include capture overhead and should not be read as gameplay benchmarks.

Scenarios fail on the wrong state/room, page or console errors, absent WebGL pixels, blank screenshot samples, missing gameplay HUD/player, blocking overlays, or insufficient heavy combat. Failures produce diagnostic PNGs and manifest entries. A failed run returns non-zero even with `--keep-going`. Run labels replace matching filenames and regenerate the gallery; unrelated older PNGs in a reused label are not included in its manifest.

## Debug API

`window.__containmentDebug` is installed **only** with `?debug=1`. The normal application does not import its module or change its update/input behavior. The hook freezes automatic simulation/VFX and pooled UI effect advancement, while the existing RAF still handles graphics recovery, HUD synchronization, rendering and diagnostics. Call `step()` to advance the fixture and its combat text, threat warnings, damage lag and reticle feedback on the same clock.

- `await prepare()`: synchronizes room revision and awaits assets after a direct game transition such as choosing the starting boon.
- `game`, `renderer`: actual `DepthGame` and `DepthRenderer` instances.
- `await startRun(seed = currentSeed, options = {})`: resets a run at its starting boon draft and waits for room assets/shaders. Pass `{rigSelect:true}` to exercise rig selection. The initial seed is 1729 (or the capture URL’s `seed` query parameter).
- `await gotoRoom(templateId, { version = 3, phase = 'combat', rig }  = {})`: regenerates a legal ancestor path, serializes/parses/restores a validated prior-room checkpoint, then uses normal route/overload authorization methods. `version` may be 1, 2 or 3. `phase` can be `combat`, `reward`, or `route`; boundary fixtures use the expedition completion/reward APIs. Optional `rig` first selects that live kit and carries it through the validated checkpoint path.
- `grantBoons(ids)`: adds catalog mutations with their normal prerequisite checks, then applies the build to combat.
- `spawn(type, x, y, elite = false)`: uses real enemy spawning after legal occupancy/player-distance checks; returns enemy id or `false`. Callers handle spacing between enemies.
- `setInput({ x, y, fire, angle, autoAim })`: merges a fixed input override. `angle: null, autoAim: true` uses normal aim assist.
- `step(ms)`: advances simulation and rendering in steps of at most 1/60 second, then refreshes the actual HUD; accepts 0–60000 ms and rejects loading rooms.
- `invulnerable(bool)`: ignores incoming player hurt calls while enabled.
- `canStand(x, y, radius = 16)`, `clearShot(x, y)`: real geometry queries for legal fixture placement.
- `events`: bounded recent real renderer effect events, with simulation timestamps, for VFX evidence.
- `refresh()`: renders a frozen frame and synchronizes the real screen/HUD after direct API actions.

Room rewards/routes are validated boundary fixtures; they do not imply the room was fought through. Overload staging explicitly calls the game's existing destruction authorization method. Full application reloads between scenarios isolate graphics clocks, random state and transient effects. All motion within a burst uses fixed simulation time rather than wall-clock delays. Exact PNG equality across GPU/OS/font versions is not promised.

## Add a scenario

Add a small declarative entry to `SCENARIOS` in `scenarios.mjs`:

```js
{
 id: 'ability:cryo', state: 'playing', room: 'armory', burst: true,
 setup: async () => {
  const d = window.__containmentDebug;
  await d.gotoRoom('armory');
  d.grantBoons(['cryogenic']);
  d.setInput({fire: true, angle: null, autoAim: true});
  d.step(300);
 },
}
```

Exact IDs may include a colon (for example `ability:cryo`); select them with `--scenarios=ability:cryo`. Their filename uses a hyphen.

`setup` executes inside the page, so it must be self-contained and reference browser globals only. `rooms: true` expands a scenario over `--rooms` and permits `scenario:room` selection; `combat: true` invokes the shared legal busy-fight fixture and its stronger checks. `burst: true` captures `--burst` frames. Set `state` to the expected real game state, `phase` when a specific run boundary matters, and `required` to selectors that must be visible (for example service-shop controls). Extend the array and the runner's explicit validation for new mechanics requiring additional evidence.

## Combat Rig scenarios

`ability:<id>` is registered for every one of the sixteen catalog abilities. `node scripts/nextgen/ability-driver.mjs --label=A1-abilities` captures two frames of each plus a native Shift/Q/F/V fixture and validates actual rig selection, accepted slot use, zones/deployables and hostile time scale. These fixtures use a legal Awakening Bay lane, normal public game actions and no boons; snapshots and run statistics are included in each manifest shot. All four live HUD slots are checked against the authoritative catalog IDs and current cast/active/cooldown readiness on every captured frame. Ability world VFX remain the renderer stream’s responsibility.
## U1 presentation fixtures

`ability-ready`, `ability-cryo`, `ability-pyro`, `ability-arc`, `ability-cooling`, `ability-casting`, `ability-denied` and `ability-overdrive` inject the frozen shared contract through `debug.uiFixture()` / `debug.abilityFixture()`. They do not install fake simulation actions. `combat-kiting-fixture` retains the original legal, spaced enemy placement, real movement/fire and debug-only 1.75× camera zoom to stress close-camera readability. Its optional damage/status callouts are explicit presentation events. The original `combat-heavy` remains unchanged. `pause-loadout`, `pause-settings`, `pause-controls`, `destroy-confirm` and `results-fixture` cover the complete screen set and optional stats.

Additional debug methods: `uiFixture(fixture|null)` overrides phase/snapshots/preferences only; `abilityFixture(rig,state,preferences?)` supplies ready/cooling/casting/active/denied/overdrive states; `uiEvent(event)` feeds only pooled UI effects; `cameraZoom(1..3)` changes only the staged camera. Reload clears all UI fixtures, while validated player preferences remain persisted normally.

## I1a integrated live evidence

`rig-select` and its four preview variants now begin a real rig-select run. `results` selects Arc, chooses a starting boon, records real ability/weapon combat receipts, fires Overclock and dies through the normal hurt action. `augment-draft` finds a real seeded post-room reward with a Cryo augment; `pause-loadout-augments` scrolls the live loadout to owned augment cards. `results-fixture` and `complete-fixture` retain explicit typed nested-stat fixtures for presentation stress coverage. `debug.fillOverdrive()` fills the real runtime meter and refreshes its HUD; it never injects a snapshot.

```sh
npm run capture -- --label=integration-1a --width=1920 --height=1080 --scenarios=rig-select,rig-select-cryo,rig-select-pyro,rig-select-arc,starting-boon,augment-draft,ability:ram,ability:seismic-slam,ability:bulwark,ability:railbreaker,ability:frost-trail,ability:cryo-nova,ability:glacier,ability:whiteout,ability:afterburn,ability:flashfire,ability:napalm-charge,ability:meltdown,ability:static-step,ability:overload,ability:tesla-pylon,ability:overclock,ability:desktop-input,results,pause-loadout,pause-loadout-augments
```

## I2 graphics integration evidence

`g1-*` keeps the graphics stream's camera, lighting, preparation and recovery scenarios runnable. `i2-kiting-high:<room>` / `i2-kiting-low:<room>` share its legal twelve-threat kiting lane, select live Arc, deploy a pylon and activate Overclock, then run three seconds on the actual simulation clock with real RAF updates before capturing (enough to fill the 120-sample diagnostics window on high-refresh monitors). `evidence.kitingProof.performance` records the settled normal-loop diagnostics, initial/final enemy counts and movement. This is a scripted live encounter on the recorded GPU, not a worst-case certification. `i2-low-calm:<room>` adds quiet forward-path evidence. Every playing shot asserts HUD chrome stays clear of the actual projected marine bounds.

`debug.realtime(true|false)` is opt-in capture instrumentation: it lets the production RAF call original update/render with the existing debug controls, aging pooled UI on the same clock. Default debug captures remain fixed-step. Capture metadata retains both UI/ability receipts and G1 lighting/preparation diagnostics.

The default room list now covers all ten distinct environments (including maintenance at Service Shaft Landing). Passenger Vault remains selectable explicitly, as do all twenty authored rooms.


## U2 motion and comparison review

The canonical `combat-kiting` now expands over **all ten default rooms**. It uses the native camera, a live Cryo rig,
legal spread targets, actual rifle fire and movement, Cryo Nova / Frost Trail before the first frame, Glacier on frame two,
and Whiteout on frame three. The fixture rejects an illegal movement lane, fewer than twelve visible live enemies,
missing accepted ability receipts, absent actual firing feedback, or a stationary marine. It marks invulnerability and the
script in each shot's staging evidence; these are repeatable presentation fixtures, not encounter-balance evidence.
The old close-camera presentation stress case remains as `combat-kiting-fixture`; `combat-heavy` stays unchanged.

```sh
npm run capture -- --label=u2-motion --scenarios=combat-kiting --burst=8 --step-ms=150
npm run capture -- --label=u2-motion-720 --scenarios=combat-kiting --burst=8 --width=1280 --height=720
npm run capture -- --label=u2-compare --compare=u2-before,u2-final
```

Every burst writes a row-major sprite sheet (left to right, then top to bottom). The manifest's `sprites` list records
columns, rows, cell dimensions, fixed spacing and each frame's actual simulation timestamp. The sheet uses at most
960 px wide cells by default; use `--sprite-width=1920` for larger sheets. Full-resolution individual PNGs stay alongside.
There is no wall-clock video timing or GIF encoder dependency.

`--compare=<labelA>,<labelB>` reads existing manifests and emits `compare.html` and `index.html` under `--label` (or a
derived comparison label). It embeds both galleries' image bytes and aligns actual scenario / room / frame identities.
Views missing in either gallery say so explicitly. Each side retains its viewport and simulation timestamp. Comparison
runs do not build, bind localhost or launch Chromium.

`beat-room-enter-fixture`, `beat-room-clear-fixture`, `beat-boss-intro-fixture`, `beat-boss-defeated-fixture`,
`beat-overdrive-ready-fixture` and `beat-death-fixture` opt into the presentation clock and inject explicitly named UI beat
fixtures. These do not claim simulated room-clear/death receipts. Ordinary capture/debug stepping bypasses hit-stop and
slow motion; `debug.presentation(true)` explicitly enables that timing layer, and `debug.presentationEvent(record)`
feeds the presentation director. `debug.presentation(false)` restores the ordinary fixed-step path.


`onboarding` clears only the onboarding seen-record and reloads before a real rig / first-boon selection; the observer
rereads actual empty preferences. `route-legacy-branch` captures a validated version-two twelve-sector graph with branches.
Results/completion fixtures use a real Cryo build plus explicitly injected summary statistics.

`feel-impact-fixture` injects a presentation-only wall-slam and uses **25 ms** burst spacing. Its manifest records
both `presentationMs` and real simulation timestamps: early frames remain frozen, then the fixed-step simulation resumes.
The runner asserts that hold/resume behavior. Other scenarios use `--step-ms` (150 ms by default).
Primary screen captures record layout extents and reject panels, title drawers, pause content, rig previews and deck maps
that scroll or leave the desktop viewport; absolutely positioned rules tooltips do not count as primary content overflow.

I3 keeps the canonical kiting thresholds unchanged with the native closer camera. It settles the follow spring after
the real dash, chooses a reserved firing lane from actual visible legal floor, and tries bounded alternate legal
starting lanes if the footprint cannot fit eighteen spread targets. Retries begin a fresh real room through the validated route helper;
no zoom, cooldown, target-health or collision override is applied. `staging.laneAttempt` records the selected attempt.

The Atrium stages at least fifteen initially visible targets and adds legal offscreen threats to preserve at least
eighteen total enemies. Other default rooms retain eighteen initially visible targets; the margin absorbs camera
follow and movement during the burst. `initialVisible` and `offscreenStaged` make that split explicit.
The original twelve-visible assertion still runs on every frame, with actual movement, travelling rounds and abilities.

## V2 ability presentation review

`v2-<ability-id>` captures seven explicit simulation phases: press, half-cast,
impact +30ms, +150ms, +600ms, lingering midpoint and expiry. Choose `--burst=7`.
Point powers use ranged targets to expose growth and expiry; the separate stress
fixture uses25 legal actors. Suffix `-containment-annulus` or `-infested-workshop`
for individual bright/dark ability review.

`v2-full-<rig>-<room>` captures native power → dash → tactical → Overdrive overlap
through a seven-frame burst (25 staged enemies in Armory,12 elsewhere). All ten
moods are selectable. `v2-kit-<rig>-<high|low>-armory` runs three real RAF seconds
with25 staged enemies, all four accepted slots, both dash charges cooling at the
snapshot, and zero combat GPU-program creation. `evidence.kitingProof` stores
120-sample diagnostics, observed peak instance/light counts and accepted cooldowns.
These are staged encounters; deaths are retained and survivors are reported.

`v2-sheets.py <gallery>` assembles per-ability and per-rig PNG timelines with
simulation timestamps (Pillow in an external temporary Python environment).
`v2-before-stress.py` temporarily reproduces the original interim renderer only
inside this worktree and restores source bytes in `finally`; run it only when no
other V2 build/capture is active. `v2-performance.py` compares matched manifests
and creates a JSON table and PNG CPU chart. Render timing is CPU submission, not
GPU time. Concurrent machine load and P95 must be retained in the report.

## R4 organic player (desktop production gate)

```sh
npm ci
npm run build
npm run playtest -- --rig=cryo --seed=1729
npm run playtest -- --rig=arc --seed=2718 --assisted
npm run playtest -- --rig=breacher --seed=31415 --rooms=6 --headed
npm run playtest -- --rig=arc --seed=1729 --legacy --assisted --checkpoints
npm run playtest:smoke
```

The player serves **dist**, clicks Start → rig inspection → Equip → starting boon, then uses Playwright keyboard and mouse actions through the actual InputController. `--rig` accepts `breacher`, `cryo`, `pyro`, `arc`. `--seed` is an unsigned integer; diagnostic native Start honors `?debug=1&seed=…` while ordinary production Start retains its normal sequence. Rebuild after application changes. `--label` selects a safe output directory name, `--rooms=1..20` stops after that many real clears, and `--max-room-seconds=240` bounds a fight. Explicit room-limited runs fail if the marine dies before their target; full campaign deaths are valid recorded outcomes.

Policy: focus visible spitters/champions, kite along collision-probed lanes, use the navigation helper to approach occluded threats, aim through the native world-pointer projection, switch between shotgun/rifle/plasma/pistol as range/ammo warrants, reload in breathing space, heal below 40%, dash away from close threats/telegraphs/acid, use Q/F at useful ranges, and spend V at six enemies or a champion/boss. Drafts prefer the chosen rig's path/augments, then universal ability support/survival. Routes prefer ordinary encounters over elites, medical below 75 health, then supplies. Healing is purchased below 70 health when available. These are heuristics, not balance certification or perfect play.

Debug access reads game state, collision/navigation, camera matrices and diagnostics. The main-run clock controls are `nativeInput(true)`, the existing `presentation(true)` clock, and the existing fixed 60 Hz `step()` accelerator, which now reads **real held native input on every tick**. It neither calls `setInput` nor grants health/charge/boons, spawns enemies, skips rooms or overrides damage. Every fixed tick renders. `--realtime` uses `?debug=1&playtest-live=1`: passive observation preserves the actual update/render/effect/hurt function identities and normal presentation pipeline, disables the audio spy, and forbids reduced-damage assistance; do not compare accelerated wall time with a human run. Full `GameEffect` receipts are retained in the bounded debug event feed. `__containmentPerformance.debugFixedStep` reports CPU update+render submission average/p50/p95/max, with a latest-2048-tick percentile window and mean/max since the last diagnostic reset (the player resets at room entry); ordinary RAF diagnostics remain separately present. Neither measures GPU completion.

`--assisted` is explicitly separate: **15% incoming damage**, with all other progression/combat rules intact, to reach late content. Never combine assisted outcomes with organic clear rates. `--legacy` performs native Start and rig selection, then invokes the guarded **initial** v2 campaign factory because the title has no legacy-campaign entry. This is an explicit initialization exception to the main story runs' read-only debug policy: canonical first node, zero completed rooms/boons, and ordinary first-room resources. It fights every encounter normally, including the Queen. Legacy has no initial boon draft and cannot save until its first earned boundary. Checkpoint validators remain unchanged; the factory never stages late content.

`--checkpoints` closes/recreates the actual page at rig selection, starting boon, first combat, reward, route and terminal states, then clicks Continue. The comparison is against the last persisted boundary: rollback during combat is intentional. Probe evidence includes before/after screenshots and JSON. A replacement page has native input/assistance reapplied; no save contents are changed by probes. Run probes separately from campaign balance measurements because interruption restarts a fight.

Reports live under `artifacts/nextgen/playtest/<label>/`: `report.json`, `index.html`, `trace.ndjson` (read snapshots + native action receipts), per-room start/mid/clear screenshots and state dumps, terminal/stall evidence, and `hardest-sprite.png`. The hardest sheet is four consecutive samples separated by 66.7 simulated ms while normal held input continues. Audio instrumentation observes real Web Audio starts/stops/ended/context clocks, including live loops; it never modifies scheduling or gain. Damage-dealt sources/use counters come from authoritative run stats; incoming source labels are explicitly **inferred** from nearby contacts/hazards. Heap and renderer geometry/texture counts are sampled per room; asset caches and GC must be considered before alleging a leak.

`playtest:smoke` requires Arc seed 1729 to clear the first three rooms, with no recorded errors/defects, targeting under four minutes on this desktop. `node scripts/nextgen/playtest/campaign.mjs` runs the twelve R4 campaigns (three seeds × four rigs) with **at most two browsers**. Do not overlap it with browser gates. Aggregate only explicit labels so old development reports never enter results:

```sh
node scripts/nextgen/playtest/aggregate.mjs --labels=r4-arc-1729,r4-cryo-1729 --out=artifacts/nextgen/playtest/campaign-summary
```

The pure policy, lifecycle comparison, diagnostics and aggregation tests run in Vitest. Native clock regression tests prove held movement/firing, default fixture compatibility, loading freeze, diagnostic seed validation, assistance validation and truthful timing receipts. The bot cannot judge feel, sound quality, visual beauty, or human onboarding comprehension.

Interrupted organic campaigns can continue from a **proven earned boundary**, preserving their real resources/boons/stats/charge:

```sh
npm run playtest -- --resume-boundary=artifacts/nextgen/playtest/r4-breacher-1729/r18-containment-annulus-clear.json --label=r4-breacher-1729-continued --checkpoints
```

The resume helper requires a reward/route state dump registered in its sibling report, matching seed/rig, and a clear receipt plus recorded room time for every completed node. It creates the same validated checkpoint payload as that earned boundary, reloads, and clicks Continue. It cannot advance unfought rooms. The continuation report keeps parent rooms/defects and links its provenance; select the continuation label **instead of** its parent in campaign aggregation. Checkpoint probes may deliberately replay the last earned boundary. `--rooms` remains an absolute campaign clear target when resuming. R4 pilot reports without `presentation:true` used the original diagnostic presentation-off clock; subsequent campaigns enable the production presentation/feel clock explicitly.

The readiness query `debug.canStepNative` uses the application's actual loading/recovery/revision gate. The player checks it and advances time in one browser JavaScript turn; fixed batches stop if preparation starts between ticks. `--checkpoint-screens=menu,menu-settings,menu-controls,menu-credits,rig-select,starting-boon,combat,pause,pause-loadout,pause-settings,pause-controls,reward,route,shop,destroy-confirm,dead,complete` selects a subset of `--checkpoints`. The separate `--death-probe --checkpoints --checkpoint-screens=dead` fixture intentionally idles in the opening fight to verify natural death/reload without injecting damage; its report is `lifecycleOnly` and must not enter balance cohorts.

`__containmentPerformance.nativeUpdateRenderMs` samples actual visible RAF CPU update/render submission with a 240-frame ring. Window percentiles and lifetime mean/max are labeled. `--realtime` with native input and presentation uses the production feel clock, unscaled UI wall time, and the normal RAF. The R4 serial late-content sample records rolling windows after four seconds of live combat with no competing browser. Neither CPU diagnostic measures GPU completion. Black-world sampling excludes actual HUD and passive overlay bounds; loading snapshots are excluded from live HUD-overlap assertions.

Reviewed collector false positives can be annotated in a sibling `triage.json` (`defects:[{evidence,status:"dismissed",reason,source}]`). Aggregation matches exact evidence names, retains dismissed receipts/reasons and all raw reports, and never suppresses console/page errors. The twelve-job queue must be drained before `supplement.mjs`; its default workflow uses two browsers maximum, while `--recovery-only --serial` allows one earned continuation at a time alongside a separately managed legacy run. Do not run a third browser or browser gate concurrently.

The title Credits control is `#menu-credits`; `#credits` remains the stable HUD currency value. Route policy reads both map-inspection destinations and the selected departure, inspects the chosen destination with a native click, then departs. The first legacy coverage run predates this correction and took the initially inspected branch; it is content coverage, not a controlled balance sample.

## I5 native browser fast mode

Render-free seeded sweeps use the installed game and shared player policy:

```sh
npm run playtest:sim -- --label=my-cohort --workers=2
npm run playtest:sim -- --label=my-baseline --game-revision=<commit> --workers=2
npm run playtest:sim -- --game-revision=b85ac3e --tuning --label=my-historical-tuning --workers=2
node scripts/nextgen/playtest/balance-summary.mjs artifacts/nextgen/playtest/my-cohort --out=artifacts/nextgen/my-summary.json
node scripts/nextgen/playtest/native-batch.mjs --label=my-native --seeds=1729,2718 --workers=2 --fast --dist-dir=artifacts/nextgen/my-dist
```

The simulation defaults to ten fixed seeds for each of the four rigs. Use a new
label for every batch; existing simulation directories are never overwritten. It records
immutable bundles, policy/source hashes, deaths, censors and per-room results;
`--seeds` and `--rigs` select an explicit cohort. It is approximate native-policy
evidence, so validate the selected numbers in browser campaigns. See
[`I5-SIM.md`](../../docs/nextgen/I5-SIM.md) for calibration and limitations.
Native batch workers are limited to one or two; do not overlap browser gates.
Batch exit zero accepts natural deaths: use each report's `outcome`, not its
process status, when calculating completion.

The I5 story encounter profile is enabled by
`src/game/roguelike/i5Tuning.ts`. Current production uses that profile; legacy
encounter parameters remain unchanged. `--game-revision=c3bd53b` reproduces the
corrected-policy production baseline before encounter tuning. `--tuning` remains
available to explicitly enable the profile in a historical source snapshot; it
changes only the copied bundle, never the working tree, and hashes actual source.
Historical revisions without the flag reject the switch. See
[`I5-REPORT.md`](../../docs/nextgen/I5-REPORT.md) for the selected profile and
current acceptance status. The linked v3 cohort archives retain rejected
iterations and raw source identities; `I5-AIM-EXPERIMENTS.md` is historical v1
evidence whose selection was withdrawn.

Reports retain `tuningEnabled` as a build-time provenance field, not an acceptance
claim. Enabled/disabled and mixed-profile continuations remain separated. Valid
old checkpoints are unaffected. Both aggregation commands retain these flags;
only explicitly selected frozen cohorts may support balance acceptance.

`npm run playtest -- --rig=arc --seed=1729 --fast --label=i5-fast-arc-1729`
keeps native keyboard/mouse actions, the presentation clock, 60 Hz simulation,
and the real scene/camera/actor update on every tick. It omits only intermediate
WebGL draw submissions inside each explicit decision batch. The last tick,
refresh/evidence frames, run boundaries and room-preparation draws remain fully
rendered. `debug.fastNativeRendering(true)` requires native input; passive
`--realtime` observation cannot use it. Default playtests, captures and
`playtest:smoke` continue drawing every tick.

Reports mark `fastRendering:true` and describe the altered draw schedule. Use this
mode for native policy/campaign validation, never for production CPU/GPU timing,
draw-call budgets or intermediate visual inspection. Loading holds, browser
errors and final-frame checks are still recorded without filtering.

`--dist-dir=artifacts/nextgen/i5/candidate-dist` serves an explicit immutable
build directory instead of `dist`; the resolved directory is retained in the
report. Native UI/assets and the same `/containment/` path-traversal guard apply.
Use separate build directories when comparing candidates while another campaign
is still serving its original build.

## I5 policy version: marine navigation observer v3

New browser and simulation cohorts record `policyVersion:"i5-navigation-observer-v3"`. The movement scorer, target priority, native input,
weapon/ability decisions and progression choices are unchanged. When approaching
an occluded or off-screen target, the bot first reads the game's existing navigation waypoint.
If that waypoint stays within 45 units of the marine, the shared read-only
`bot-navigation.ts` observer uses a separate marine-clearance path query. The
observer never replaces `game.navigation`, moves actors, edits resources, changes
collisions or alters enemy decisions; the browser still traverses the result via
ordinary held native keys and the existing legal-candidate checks.

This is a narrow **bot policy correction**, not an encounter fix. It addresses
navigation censors caused by querying the enemy-clearance grid for a marine who
can stand in narrower legal lanes. Old policy outcomes remain retained; use fresh
matched before/after cohorts with this same version for balance comparisons.
The browser report's source hashes include `bot-navigation.ts`. Default diagnostic
fixtures and native controls are unchanged.

The v3 observer also recovers short waypoints when an enemy has clear line of
fire but is outside the visible camera area. It preserves useful ordinary
waypoints; existing scoring still selects among the same legal movement
candidates. A single `BOT_NAVIGATION_VERSION` constant identifies the helper,
built debug API and runner. The runner rejects a stale build before gathering
cohort evidence, and hashes both the helper and version module. Earlier v2
cohorts remain historical; never combine them with v3 balance outcomes.
## G2 world review

`g2-calm-high`, `g2-calm-low`, `g2-kiting-high`, `g2-kiting-low` expand over `--rooms` (supply all20storyIDs). Kiting uses the same legal short G1 backpedal/grenade fixture on both tiers. `g2-title-low` and `g2-boss-low` complement title/boss. `g2-champions`, `g2-pickups` and `g2-queen-exposed` exercise actual promotion, pickup and boss-phase APIs. `g2-legacy-high/low` use legal version2checkpoint paths with recorded deterministic seeds.

`node scripts/nextgen/g2-review.mjs artifacts/nextgen/<label>` decodes actual PNGs, writes masked/unmasked ROI histograms and marine-local3m samples to luminance.json, and creates native PNG review sheets without another browser. `g2-comparison.mjs` creates all20 baseline/before/after sheets with explicit missing-baseline labels and provenance. `g2-surfaces.mjs` regenerates the three original128² floor finishes.

`--dist=/absolute/preserved/build --dist-source-sha=<renderer-sha>` bypasses rebuilding only for an explicit preserved production snapshot. The manifest records that provenance separately from the currently checked-out harness SHA. This permits before/after benchmarking in one worktree without reverting source or touching another checkout.

`g2-overlay.mjs <final-dir> <focused-correction-dir>` assembles a final gallery after an isolated correction. It requires a clean overlay capture and exact existing fixture keys, preserves the original round manifest/PNGs, records the overlay renderer SHA per replaced shot, and regenerates the standalone gallery. It does not change captured evidence or hide failed scenarios. Rerun g2-review and g2-comparison afterward.

## V3 finishing evidence

`v3-capture.mjs --label=<label> --dist=<immutable-build> --dist-source-sha=<renderer-sha>` serializes one rig per browser batch, then consolidates all sixteen seven-phase abilities and four Armory kits. Add `--mode=environments` for every rig's bright Containment Annulus, dark Infested Workshop and Low Armory kit. Native PNGs/manifests are retained. The bounded file-linked gallery avoids the embedded-HTML size limit for large galleries.

`v3-gallery.mjs <capture-directory>` creates area-reduced exact 480×270 frames, phase sheets and an overview. `v3-finalize.mjs <core-label> <environment-label> <recovery-label>` assembles validated final sources, matched seven-phase before/after comparisons and single-phase impact+30ms thumbnail pairs. It preserves baseline evidence and fails on missing fixture phases, duplicate keys or capture errors.

`v3-recovery` is additive to the original V2 recovery scenario: it retains the same resource-cycle proof and acknowledges the restored-graphics and pause controls after preparation/lazy controls settle. Capture it with `npm run capture -- --label=<recovery-label> --dist=<immutable-build> --dist-source-sha=<renderer-sha> --scenarios=v3-recovery`.

After matched sustained `npm run bench` runs, `v3-metrics.mjs <before-label> <after-label>` writes `v3-final/bench.md`, JSON and an HTML comparison chart. CPU is best p95 of N repeats; counts are worst peaks of all repeats. Host load is shown beside timings. Raw trials and absolute budget misses stay visible.

`v3-recheck.mjs` reads that comparison and runs three alternating preserved-before/preserved-after pairs for every original delta miss. It writes separate `recheck.md` / JSON receipts and leaves the original matrix unchanged. It does not establish quiet-hardware certification.

## I4 sequential realtime benchmark

`npm run bench` builds production code, scans all twenty story rooms with 25 legal actors and a native full Arc kit by peak High draw calls,
then runs each rig on High and Low in the highest-draw room and the median room. Each trial uses the real Start button and verifies a running native WebAudio context, then starts
with 25 legally placed enemies, replenishes losses via legal native spawns (target25), retains corpses, kites with normal collision, fires the rifle and
attempts native abilities whenever ready. Only the initial Overdrive charge and marine invulnerability
are fixture overrides. The default is **three 20-second wall-clock trials**, one browser at a time.

```sh
npm run bench -- --label=integration-4-bench
npm run bench -- --label=integration-4-profile --rooms=relay-racks,diagnostic-gallery --repeat=1 --profile
npm run bench -- --label=integration-4-repeat --rooms=relay-racks,diagnostic-gallery --rigs=arc --tiers=high --repeat=3
```

Use the selected `rooms` in `benchmark.json` for matched reruns; the examples are not a replacement
for the current room ranking. `--dist=<preserved-production-dist> --no-build` serves a before build
without modifying source. `--baseline` records a known over-budget before build without treating its draw miss as a final regression; all final runs enforce350. A resource miss is retained, the complete matrix still prints, and the command exits2; page/GL/receipt errors still abort immediately. `--seconds`, `--repeat`, `--rigs`, and `--tiers` narrow diagnostic runs.
`--scan-only` records inventories without running timing trials; `--scan-calm` keeps a quick world-only diagnostic scan. Every trial records start/end host load averages and core count, per-frame frame/update/render-JS/HUD/
audio-sync p50/p95/max, draw/triangle/shared-pool light/ability-instance counts, total visible scene+HUD instances and active scene lights, prepared light/instance-mesh inventories (checked unchanged after combat), program inventory, actual new
program creation, live enemy min/average/percentiles, replenishments, survivors, accepted slot counts, CDP metrics and optional GPU timer queries.
`--profile` additionally saves Chrome CPU profiles, sampled allocations (including collected objects),
V8 GC traces, and native WebAudio graph-capacity/callback-interval telemetry. These are profiling runs and must be identified separately from timing trials.
Audio sync is main-thread routing cost; individual Web Audio rendering callback CPU duration is not exposed; graph capacity and running callback-interval means are retained in profiling JSON. GPU timers include scheduling contention on a shared GPU. No software renderer is accepted.
Update/CPU figures include measured fixture-driver CPU (native ability actions/refill work); CPU also includes the post-render HUD synchronization cost (the updateRender field retains update+render alone); this prevents hiding action costs outside RAF. The population guard requires median≥24 and average≥22, preserving transient burst deaths and natural reinforcements.
The debug performance observer reuses one sample object; capture arrays are deliberately retained only
by the opt-in benchmark. Ordinary gameplay never installs the observer.

The deterministic `AbilityBudgets.test.ts`, `InstanceBatch.test.ts`, `ActorHotPaths.test.ts` and
`DeathRagdolls.test.ts` checks bound inventories, scratch/buffer reuse and hierarchy work. Timing
budgets are hardware acceptance criteria, not flaky wall-clock unit tests. Do not certify quiet-host
60fps from a contested-host table or from frozen gallery timings.

## Opt-in operation cost audit

`--audit-costs` adds operation counts to the existing benchmark. Run this separately from quiet timing measurements:

```sh
npm run bench -- --label=p1-costs --rooms=relay-racks,diagnostic-gallery --rigs=arc --tiers=high,low --repeat=1 --audit-costs
node scripts/nextgen/bench.mjs --self-test
```

The audit wraps WebGL methods only for the measured trial. `benchmark.json` retains per-frame typed-array samples and p50/p95/max summaries for all GL driver API calls, `useProgram` calls and changed program handles, state setter calls, uniform uploads, all matrix compositions, local Object3D compositions, and writes that recompute Object3D world matrices. State setter counts describe actual driver calls; they do not claim that every call changed its previous value. Program switches compare against the current bound program when the probe starts.

Shadow counts come from actual shadow-map target bindings and draws inside `shadowMap.render`, including zero when cached shadows skip rendering. Post counts include the scene color pass and each fullscreen pass; each pass retains the actual target width/height, calls per frame, and aggregate pixel count. Low therefore records its forward scene pass with zero fullscreen post passes. Attack particle counts measure entries visited by `drawParticles`; ability counts measure live particles advanced by `ElementKit.begin`, with its full slot scan count retained separately. GPU atmosphere particles are excluded from CPU particle simulation counts.

All wrappers are restored after the trial. Audit timings include intentional JavaScript probe overhead and must not be presented as quiet frame-budget certification. Gameplay, population, draw, program-creation and resource assertions remain active. `--profile` can additionally retain the existing CPU/heap/GC profiles, with both kinds of instrumentation explicitly flagged in the report.

## P1 room preparation audit

`npm run bench:rooms` visits all twenty story rooms and the legacy Queen arena, first on a fresh page for each room, then through one retained renderer session. It prints a per-room phase table and retains host load, program inventory, new combat programs, resource counts, and bounded renderer preparation diagnostics in `rooms.json`. The retained traversal tests program accumulation and is explicitly not an organic campaign. Input must remain held through owner readiness and shader preparation.

```sh
npm run bench:rooms -- --label=p1-rooms-after
npm run bench:rooms -- --label=p1-rooms-before --dist=artifacts/nextgen/p1/before-dist --no-build --baseline
```

The production manifest now includes preparation phases, texture uploads, shader-family counts and compile passes. The audit guards room holds at 3 seconds, retained programs at 400, material families at 160 and compile passes at 12; timing misses remain visible on noisy hosts. Existing zero-combat-compilation assertions remain. The combat benchmark additionally records and enforces the P1 330-draw headroom target alongside its original 350-draw budget.

`node scripts/nextgen/restart-stress.mjs --label=p1-restarts --cycles=20` uses native Start/title/Continue actions under CDP CPU/network throttling. It records blob lifetimes, actual decode errors and bitmap closure; it rejects console/page errors, missing room owners and closed images still referenced by live materials.


## I5 corrected ability-aim epoch

`i5-catalog-ability-aim-v3` retains marine-navigation v3 and the existing weapon,
movement, boon, healing and opportunity heuristics. Shared `ability-aim.ts`
searches current visible, vulnerable targets using catalog cone/line/chain/
point-circle/wall shapes, native LOS and legal placement; it also accounts for
Scorched Fan and the native multi-placement/fanout augments. It scores actual
pointer picking before choosing each Q/F/V cursor and suppresses targeted casts
with no eligible target. It restores weapon aim between presses. Evasive dash
remains governed by movement intent; self-targeted opportunities are unchanged.
The search is finite and deterministic; it does not predict enemy AI or promise
perfect future damage. Source hashes include the helper. Browser readiness
rejects stale policy builds. Never pool this epoch with earlier cohorts.

Native reports record start/latest host load averages and logical core count.
Fresh room metadata distinguishes node kind, holdouts and planned champions.
Balance summaries reject mixed known source/backend identities within one named
cohort; multiple explicit input directories become separate named cohorts.
Strict ordinary-room cap evidence includes death attempts; unknown historical
classifications cannot certify it. Broad non-holdout pacing is reported apart.


## X3 UI review

`x3-hud-compact` advances the actual first room and UI clock by4.5s to show the compact combat dock/objective. `x3-denial-reticle` and `x3-status-priority` are explicitly presentation-only event fixtures. `x3-failure-analysis` stages three real `hurt` calls with explicit provenance to verify the actual incoming-damage ledger and fatal room; it is not an organic death. The debug hurt proxy preserves optional source metadata. `x3-results-statistics` and `x3-completion-statistics` open the native result disclosure while retaining the original counters/build and screen-fit assertions.

`node scripts/nextgen/x3-review.mjs artifacts/nextgen/<label>` area-reduces every accepted capture to exact480×270 PNGs in `review480/`, without opening another browser or altering the capture manifest. Source PNGs, failed attempts and their metadata remain intact.

## G3 per-pass GPU audit

`npm run bench -- --gpu-passes` records asynchronous
`EXT_disjoint_timer_query_webgl2` timings for scene color (including shadow
updates and HDR resolve), enabled dirty shadow updates separately, contact/GTAO,
denoise, bloom extraction and both blur
directions, distortion, composite, final AA and HUD. It rotates one selected stage every third frame, avoiding multiple timer
queries within the same ANGLE Metal command buffer, and retains raw milliseconds and actual target dimensions, discards pending queries
on a GPU disjoint interval and retires unresolved queries without blocking.
No `readPixels`, `finish` or query-result busy wait is used. Unsupported timers
are reported explicitly. The total-frame timer and runtime adaptive GPU timer
are suspended while per-pass queries own the query target; frame-driven
adaptive fallback remains available. These opt-in timings include shared-GPU
scheduling contention.

```sh
npm run bench -- --label=g3-gpu --rooms=manual-control-chamber --rigs=arc --tiers=high,low --repeat=3 --gpu-passes
VITEST_MAX_WORKERS=2 npx vitest run scripts/nextgen/gpu-pass-audit.test.mjs
```

The same option supports `--dist=<preserved-build> --no-build` before/after
comparisons. Every trial retains host load and per-frame adaptive scale.
`gpuBestOfN` selects the trial with the lowest scene-color GPU p50 and reports
that same trial's frame distribution, scale and load; every raw trial remains
in `benchmark.json`. This is distinct from choosing the best CPU trial. Stage
percentiles cannot be added to claim a frame percentile. Query lifecycle
counters make discarded, busy-skipped and unresolved observations visible.

The original 350-draw limit, P1 330-draw headroom, zero combat programs and
population/native-kit assertions remain. The combat audit additionally enforces
the existing 400-program inventory budget and adaptive scale range 0.7–1.0.
High frame p50 ≤16.7 ms / p95 ≤20 ms and Low p50 ≤16.7 ms are recorded as
hardware acceptance flags alongside the historical strict frame-p95 flag;
shared-host timing flags remain observations, not wall-clock unit assertions.

`--gpu-passes --gpu-flush` additionally calls `gl.flush()` before each selected
query and after its end, requesting command-buffer submission boundaries for
ANGLE Metal stage attribution. This is an **intrusive pass-profile mode**:
frame/CPU values are retained but marked `timingAcceptanceEligible:false` and
must not certify production FPS. It never uses `finish`, `readPixels` or a
completion wait. Compare ordinary non-flush trials separately. If isolated
scopes still report queue-scale durations for tiny stages, retain them as
unsupported stage attribution rather than adding their timings.

The separate `shadows` scope runs only when shadow rendering is enabled and
`autoUpdate || needsUpdate`. Its dimensions come from actual bindings to a
light-owned shadow map during the measured update; no screen-sized proxy or
unallocated expected shadow size is reported. `sceneColor` still includes its
shadow work, so those two distributions overlap and must never be added.

If the zero-combat-program guard fails, `combatProgramKeys` retains the names
and complete Three cache keys of newly created programs still in the renderer
inventory. The guard remains fatal; the diagnostic identifies the missed
preparation topology without accepting a compile hitch.

G3's final AA scope (`finalAA`) samples the graded ink presentation target and
renders to the screen before the HUD. Cost and GPU probes recognize it only
when present; preserved pre-AA builds keep their original stage list. Default
Low now draws scene → compact composite → final AA while keeping AO/bloom/
distortion targets at1×1 and skipping those passes. Explicit Low ink-off retains
the original single forward render. The original draw/program guards remain.
High retains the bounded Three FXAA implementation; Low final AA uses five fixed
color taps, no edge-search loop and at most .32 neighborhood blend. Main scene
color is positive packed HDR RGB11/11/10 (32 bits); its alpha was unused by the
composite. Geometry remains RGBA8 and AO remains RGBA16F. Packed precision and
the .70 adaptive endpoint have separate native A/B receipts in the G3 report;
the latter is visibly softer and must not be described as a free quality win.

### G3 strength review and integration

`npm run capture -- --label=<new-label> --graphics='{"inkOutlines":"full","stylizedShading":true,"adaptiveResolution":false}' --style=bold --scenarios=<list>`
records the validated graphics overrides and uniform-only style strength. Strength
is `subtle`, `medium` or `bold`; shipping defaults to bold. For OFF use
`{"inkOutlines":"off","stylizedShading":false,"adaptiveResolution":false}`.
Use the same immutable `--dist` and `--dist-source-sha`, seed, scenarios and clocks
for every column. Do not compare a live rebuilding dist against preserved PNGs.

`node scripts/nextgen/g3-strength-gallery.mjs <OFF-label> <subtle-label> <medium-label> <bold-label> <new-gallery>`
builds the four-strength review without launching a browser. It rejects mismatched
provenance/clocks/assets, missing required bursts and failed capture manifests.
The output links native PNGs, 480×270 area reductions, exact 600×400 native crops
and four-frame sheets. It refuses to overwrite an existing gallery. The accepted wave-4 review is
`artifacts/nextgen/g3-final-bold-ab/index.html`.

The opaque HDR draw carries an RGBA8 oct-normal/identity/class attachment shared
by AO and ink. Standard surfaces are registered before material warmup. Physical
marine/alien identity shaders have a narrowly recognized adapter; other custom
shaders and transparent/effect layers remain excluded. Keep actor submeshes under
their registered root, never use per-actor shader defines, and preserve color-only
effect writes. The actual Low HDR target must be prepared before readiness;
Low ink-off/on transitions hold room preparation. `g3-ink-switches` exercises
those transitions and rejects any post-prepare combat program creation.

Adaptive scale and GPU lifecycle appear under the existing performance pipeline
snapshot. Per-pass profiling suspends the total GPU probe and uses frame-driven
adaptive fallback to avoid nested queries. The raw ANGLE Metal scopes in this
shared-host run did not establish reliable additive pass attribution; consult
`docs/nextgen/G3-GPU-NOTES.md` before quoting them as shader costs.

## Opt-in amplified post throughput diagnostic

`--gpu-micro` runs a separate synthetic diagnostic **after** each normal live
trial's samples, wrapper disposal and unchanged kit/population/resource assertions.
The ordinary20-second observations and their draw budgets remain separate and
retain their existing timing-eligibility flags. Synthetic rows live under
`run.gpuMicro` and always have `timingAcceptanceEligible:false`.

```sh
npm run bench -- --label=g3-packed-micro --dist=artifacts/nextgen/g3/packed-hdr-dist --dist-source-sha=4939853 --no-build --rooms=manual-control-chamber --rigs=arc --tiers=high,low --repeat=1 --seconds=20 --gpu-micro --gpu-micro-samples=2
```

Default micro scopes are `gtao,aoDenoise,bloomExtract,bloomBlurHorizontal,
bloomBlurVertical,composite,finalAA`. `--gpu-micro-stages=composite,finalAA`
narrows them; `--gpu-micro-samples=2..4` selects raw attempts per repeat count.
Scene, shadows and HUD are explicitly unsupported micro scopes. Stages absent
or disabled in the selected prepared tier are recorded as unsupported, not
compiled or silently substituted. Existing prepared High/Low programs are used;
no materials, textures or targets are allocated for this diagnostic.

The harness pauses through the existing game API, temporarily suppresses the
ordinary renderer update and suspends the runtime GPU timer. Every sampled RAF
executes the existing post pipeline with `dt0`, fixed simulation/camera/inputs,
and normal pass order. Only the selected draw repeats **1,8,32** times inside one
elapsed query. Alternate sample sequences reverse the count order to reduce
simple time-drift bias. Depth/color clears, uniforms, target sizes and the other
post passes retain their regular order. Shadow updates are held at their cached
state; scene geometry is not an amplified measured scope. Query availability is
polled asynchronously on RAFs; there is no `readPixels`, `finish`, fence wait or
busy loop. At most4 queries are pending, each retires after120 frames or3000ms,
and the whole micro stops at600 RAFs or30s. Context loss/disjoint observations
are rejected. Renderer state, wrappers, ordinary draw counters, public pause
state and timer enablement restore in `finally`; the original frozen normal
frame restores HUD/output. Suspended GPU feedback retires and resumes fresh.

Every raw repeat count, CPU submission time, elapsed GPU value/status, timestamp,
target size and query lifecycle count is retained, with host load before/after
the micro interval. The fit selects the **minimum valid GPU sample at each
count**, retaining its paired CPU observation. It requires at least2 valid
samples/count, positive slope, R²≥.98, within-count relative spread≤.50,
an amplified delta above both.2ms and2% of the count1 reading, a plausible
intercept, and GPU slope separated from CPU submission slope. Flat/coarse equal,
negative, nonlinear, noisy, insufficient or submission-dominated observations
produce `supported:false` with reasons and no estimate. Thresholds and rejected
raw values remain in JSON.

Even a supported slope is an **amplified same-target throughput estimate**, not
isolated normal-pass latency, ordinary frame cost or FPS. Reusing the same
render target and resident inputs changes caching/submission behavior; scene and
shadow timing scopes can overlap outside this post-only experiment. Never add
these slopes or stage percentiles into a claimed game frame time. Micro program
creation remains a fatal zero-program guard; its synthetic draws never enter
the already captured normal draw/resource budget.

GPU-free fit/lifecycle coverage is in `gpu-micro.test.mjs`. Run it only when the
serialized browser timing lease is free:

```sh
VITEST_MAX_WORKERS=2 npx vitest run scripts/nextgen/gpu-micro.test.mjs scripts/nextgen/gpu-pass-audit.test.mjs
node scripts/nextgen/bench.mjs --self-test
```
