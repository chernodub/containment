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
