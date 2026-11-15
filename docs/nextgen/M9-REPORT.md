# M9 — motion and game feel

Branch: `t3/m9-motion-feel`. Final implementation commit is the commit containing this report (HEAD is supplied in the handoff). No push or PR.

## What shipped

- Native-scale, fixed 60Hz motion-strip studies for the marine, five story families, every family elite, Brute Warden and Carrier Matron, plus six-actor crowd. 205 before/after action pairs and 24 explicitly unpaired directional/high-impulse diagnostics. Original meshes and skinning stay intact.
- Marine travel calibration, bounded stance correction, split70°/20° torso aim, neutral stop plant, breathing/acceleration response, class recoil, receiver-relative reload reach, weapon switch, accepted-event ability punctuation and eased death.
- Enemy held native warnings, locked warning direction, fast release/recovery, native-speed family gait and id-based cycle phase. Native contact-only attackers do not gain an invented pre-hit warning.
- Directional family pain/flinch, compression and bounded follow-through; local heavy-hit holds, family killing momentum, corpse-local holds and frost/burn/arc/acid finishes using retained pools/materials. Strong native killing impulses produce a few more downstream fragments.

The result improves a prototype motion vocabulary. It does not meet a premium reference 9/10 bar, and no zero-foot-slide or hardware certification is claimed.

## Evidence and actual review

Gallery: [m9-final/index.html](../../artifacts/nextgen/m9-final/index.html). The baseline audit was written before production animation edits: [M9-motion-audit.md](plans/M9-motion-audit.md). It includes the three written critique→fix rounds. The lead actually opened all 30 baseline contact pages, all 10 standard round1 pages, named individual round2/3 strips, then all 43 final pages. After the ankle correction the lead opened all six refreshed marine contact pages plus full strafe, backpedal and stop strips. All 193 enemy/crowd strips remain byte-identical to the family review; clocks are unchanged. Intermediate PNGs were retired only after this review; immutable manifests and hash/byte inventories remain in `m9-final/receipts/`.

The exhaustive studies freeze simulation and replay production model/pool APIs at fixed presentation ticks. Original pixels are cropped without resizing. Their clocks, bundle hashes, status/impulse payloads and original geometry-bound receipts remain in manifests. These studies judge body motion; they are not native accepted-input, balance, physical hit or timing evidence. Death uses the real retained Rapier body, with a prescribed native-shaped impulse. Baseline elemental death rows isolate body physics; final rows also show added corpse particles. Fire rows include actual pooled muzzle/brass/vent feedback, but no bullet collision or full-mag pressure claim.

The original production capture gates remain the source for native actor/action/phase/priority guarantees. Native-capture and gate results are recorded below. Queen remains legacy-save coverage and is excluded from the story gallery.

Start with these eight final strips (absolute path prefix `/Users/chernodub/.t3/worktrees/containment-game/t3-324eda82/artifacts/nextgen/m9-final/after/`):

- [marine-run-90.png](../../artifacts/nextgen/m9-final/after/marine-run-90.png)
- [marine-stop-start.png](../../artifacts/nextgen/m9-final/after/marine-stop-start.png)
- [marine-reload.png](../../artifacts/nextgen/m9-final/after/marine-reload.png)
- [crawler-heavy-hit.png](../../artifacts/nextgen/m9-final/after/crawler-heavy-hit.png)
- [spitter-attack.png](../../artifacts/nextgen/m9-final/after/spitter-attack.png)
- [brute-warden-attack.png](../../artifacts/nextgen/m9-final/after/brute-warden-attack.png)
- [carrier-matron-death-frost.png](../../artifacts/nextgen/m9-final/after/carrier-matron-death-frost.png)
- [crowd-run.png](../../artifacts/nextgen/m9-final/after/crowd-run.png)

## Bounds, clocks and ownership

Living enemy horizontal body translation is capped at .055m (1.76 simulation units). Vertical emergence plus impact stays within .135m for story actors and .19m for the legacy Queen; both axes are tested on all real rigs. Marine root translation remains exactly native, and actual skinned shoe correction is capped at .12m (3.84 units). Torso/limb pose rotation is separate from this root/body translation bound; existing physical torso/collider tests remain unchanged. Source buffers, actor geometry/material inventory, skin batching and native simulation results/timings/inputs are unchanged. Motion scratch/state is allocated at rig construction; no steady-frame temporary arrays/vectors/quaternions or new GPU resources/program variants are introduced.

Heavy source-animation holds are actor-local: enemy requests≤32ms scaled by hit weight/preferences with180ms retrigger cooldown; marine≤35ms with the same cooldown. Corpse requests≤32ms quantize down at120Hz to≤25 ms. Camera, living roots, other corpses, simulation and input continue. Reduced-motion/zero settings clear latent living-actor holds and suppress new corpse holds. A corpse hold already pending when settings change can finish its remaining≤25 ms after resume. Existing physics bounds remain8m/s linear and12rad/s angular, now including the initial vertical component.

Nine contact cases sample actual skinned sole vertices at 65/220/290 units per second, forward/strafe/backward. Mean planted-frame drift falls 75–89%; at normal speed it is 5.680→0.781 cm per 60Hz tick forward/strafe and 6.014→0.958 cm backward. This is a bounded correction, not zero slip; contact-count and full measurements remain in [sole-contact.json](../../artifacts/nextgen/m9-final/metrics/sole-contact.json).

## Snapshot/event fields and rewritten pins

No simulation, save or GameEffect fields added. Render`AfflictionStatus` now types the optional`shocked` field already returned by native`MutationRuntime.statuses()`. Existing source direction, warning duration/lock vector, damage, native velocity and last-living status feed the presentation. A status applied and killed before it was ever rendered can still miss the last-living elemental cue; no fake status is invented.

No existing assertions or presentation pins were removed, relaxed or rewritten. Setup guards were fixed to keep pre-actor renderer fixtures valid. New tests cover real-rig contacts/IK, sockets/neutral/death poses, local clocks, warning locking, reusable resources, all-family offsets, elemental GLB floor/joint support, initial velocity and local corpse activation.

## CPU comparison and gates

Gate results:

- `npm ci`: passed, 84 packages. Reinstalled after the shared-machine cleanup removed dependencies.
- `VITEST_MAX_WORKERS=1 npm run verify`: JavaScript `Test Files 412 passed | 2 skipped (414)`, `Tests 5403 passed | 2 skipped (5405)`, 812.60s; Cryo Node `pass 2 / fail 0`. Serialized to preserve one browser at a time. Python artifact, room-fit and distribution tests passed; monitor geometry stopped with `FileNotFoundError: blender`, the documented prerequisite gap. No asset gate was weakened.
- Final changed motion/death tests also pass in isolation with `VITEST_MAX_WORKERS=2`; final bounds test: 4/4. These cover the final ankle/preference corrections after the broad suite began.
- `npm run test:room-evidence`: Node `pass 28 / fail 0`; ragdoll demo `{passed:true,cpuOnly:true,checks:33}`.
- `npm run build`: TypeScript and Vite passed.
- `npm run test:smoke`: `Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.` Restart passed on the first final run; no E9 workaround or assertion change. Native every-weapon/ability combat inspection, checkpoint failure/recovery, graphics selection, keyboard flows and audio wiring passed.
- `npm run test:authored-smoke:all`: `Authored desktop smoke passed: 20 rooms, native move/fire, Continue/route, pause/resume, Low quality, no browser errors.`
- `npm run playtest:smoke`: `room-limit; 3 rooms cleared; 0 errors`. [Original campaign](../../artifacts/nextgen/m9-final/playtest/index.html).
- `npm run capture -- --label=review --scenarios=combat-heavy:containment-annulus --burst=12 --step-ms=33 --failure-evidence`: `12 PNGs verified`, zero failures/errors, 18–21 visible enemies. Opened full first/last PNGs and the native marine strip. [Originals](../../artifacts/nextgen/m9-final/native/heavy/index.html), [unresized strip](../../artifacts/nextgen/m9-final/native/heavy-strips/index.html).
- Native Brute/Spitter warning capture: `8 PNGs verified`, zero original guard failures/errors. Original K7 spacing stays 300ms despite the requested 33ms; Brute warning 850→550→250→0ms, Spitter 500→200→0→0ms. Opened the Brute strip and Spitter original warning/release frames. [Originals](../../artifacts/nextgen/m9-final/native/windup/index.html).

The stricter offline warning crop **failed**: the first Spitter full AABB is outside the original viewport while the camera settles (x2433–2664 at 1920px width). No complete native Spitter body strip is claimed. The untouched raw run, partial derivative diagnostics and [rejection receipt](../../artifacts/nextgen/m9-final/native/rejected-windup-crop/failure.json) remain. No crop/actor assertion was relaxed and no failed native parent erased. The complete isolated Spitter study remains explicitly presentation replay.

Bench command before and after: `npm run bench -- --label=<cohort> --rooms=containment-annulus --rigs=breacher --tiers=high --repeat=3 --seconds=10 --no-build`. Native 25-enemy replenished heavy combat, 1920×1080 High, Apple M1 Pro Metal, ordinary realtime submission with native effects/deaths. One local browser, no overlapping local test suite. Raw [before](../../artifacts/nextgen/m9-final/bench/before/benchmark.json) and [after](../../artifacts/nextgen/m9-final/bench/after/benchmark.json) retain every sample, host load and adaptive resolution; the sandbox EPERM attempt is retained separately.

| Cohort/trial | Frame p95 ms | CPU p50 / p95 ms | CPU average ms | Render p50 ms | Adaptive scale p50 | Max draws | New programs |
|---|---:|---:|---:|---:|---:|---:|---:|
| before/0 | 18.0 | 7.7 / 10.8 | 7.649 | 6.2 | 0.950 | 190 | 0 |
| before/1 | 17.9 | 7.7 / 11.7 | 8.020 | 6.3 | 0.975 | 184 | 0 |
| before/2 | 26.2 | 6.8 / 11.5 | 7.433 | 5.6 | 0.850 | 182 | 0 |
| after/0 | 18.1 | 8.3 / 12.0 | 8.421 | 6.9 | 0.950 | 197 | 0 |
| after/1 | 18.1 | 6.9 / 10.1 | 7.319 | 5.7 | 0.950 | 177 | 0 |
| after/2 | 18.0 | 7.3 / 10.0 | 7.668 | 6.1 | 0.950 | 186 | 0 |

Mean of trial-average native update+render CPU: **7.701→7.803ms, +0.102ms (+1.3%)**. Median trial CPU p50:7.7→7.3ms; median render p50:6.2→6.1ms. This whole-pipeline comparison does not isolate animation cost: host one-minute load was 15.23–16.39 before and 12.42–13.65 after, with native encounter variation and different adaptive histories. Final trial0 CPU p50=8.3ms misses the engineering 8ms target; the cohort mean stays below 8ms. All three final frame p95 values meet M9 ≤20ms, versus two of three before; the before 26.2ms miss remains. After raw max-frame stalls 759–783ms also remain, with no trimming or hardware-certification claim. Program inventory stays 115; no mid-combat compilation in any trial. Maximum final draws 197<350.

Broad-suite failure logs and final summaries remain under [gates/](../../artifacts/nextgen/m9-final/gates/). The initial sandbox browser-launch failure, two routing-fixture failures and legacy corpse-count failure were resolved through environment/code compatibility; existing assertions stayed unchanged. No additional rounds or proof system were added after the required gates passed.

## Integration and licensing

No code integration request. Native K7 first-frame Spitter framing remains an evidence limitation for integration review, with the rejected derivative retained. DepthRenderer changes are small M9-marked event/preferences/velocity/seed adapters. No world or room file changed. No runtime dependency or art asset added; existing MIT/third-party notices remain. Temporary Pillow environment is verification-only; Blender is not installed or bypassed.

## Weakest remaining motions

1. Backpedal/diagonal foot contact and rapid aim reversals still need close scrutiny; source gait is not an authored multidirectional locomotion set.
2. Carrier/Matron attacks and Stalker pain silhouettes remain understated. Contact-only attacks still have no simulation wind-up, so presentation cannot promise a pre-hit window.
3. Marine hit response and several instantaneous ability body poses are modest or share gestures; reload has no separate magazine prop.
4. Frost deaths retain a connected skeleton and small shards, not anatomical shattering; burn-out and arc terminal beats are procedural, not dedicated death clips.
5. Native receipts do not expose health overshoot. High-impulse deaths differ physically and in fragments; true damage-overkill choreography is not claimed.
6. Breach emergence is a bounded rise, not a family-authored climb through architecture.

## Scored actions

Scores are harsh body-motion judgments against a premium top-down reference. Means: marine 3.25→5.39; enemy/elite/guardian 3.27→4.79; crowd4→7. Full data: [scores.json](../../artifacts/nextgen/m9-final/scores.json).

### marine

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Restrained breathing, still a fairly rigid ready stance. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-idle.png) / [after](../../artifacts/nextgen/m9-final/after/marine-idle.png) |
| run-0 | 5→6 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-0.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-0.png) |
| run-45 | 4→6 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-45.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-45.png) |
| run-90 | 4→6 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-90.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-90.png) |
| run-135 | 4→5 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-135.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-135.png) |
| run-180 | 4→5 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-180.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-180.png) |
| run-225 | 4→5 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-225.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-225.png) |
| run-270 | 4→6 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-270.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-270.png) |
| run-315 | 4→6 | Calibrated travel and bounded stance response; rearward contact remains weakest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-run-315.png) / [after](../../artifacts/nextgen/m9-final/after/marine-run-315.png) |
| stop-start | 2→6 | Returns to neutral authored leg contacts over140ms. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-stop-start.png) / [after](../../artifacts/nextgen/m9-final/after/marine-stop-start.png) |
| fire-pistol | 3→6 | Class-specific shoulder recovery and compact muzzle/vent shapes; source socket retained. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-fire-pistol.png) / [after](../../artifacts/nextgen/m9-final/after/marine-fire-pistol.png) |
| fire-rifle | 3→6 | Class-specific shoulder recovery and compact muzzle/vent shapes; source socket retained. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-fire-rifle.png) / [after](../../artifacts/nextgen/m9-final/after/marine-fire-rifle.png) |
| fire-shotgun | 3→6 | Class-specific shoulder recovery and compact muzzle/vent shapes; source socket retained. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-fire-shotgun.png) / [after](../../artifacts/nextgen/m9-final/after/marine-fire-shotgun.png) |
| fire-plasma | 3→5 | Class-specific shoulder recovery and compact muzzle/vent shapes; source socket retained. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-fire-plasma.png) / [after](../../artifacts/nextgen/m9-final/after/marine-fire-plasma.png) |
| fire-rocket | 3→6 | Class-specific shoulder recovery and compact muzzle/vent shapes; source socket retained. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-fire-rocket.png) / [after](../../artifacts/nextgen/m9-final/after/marine-fire-rocket.png) |
| reload | 3→6 | Receiver-relative magazine-hand reach; no actual magazine prop swap. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-reload.png) / [after](../../artifacts/nextgen/m9-final/after/marine-reload.png) |
| weapon-switch | 2→6 | Readable lower/equip/settle with socket continuity. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-weapon-switch.png) / [after](../../artifacts/nextgen/m9-final/after/marine-weapon-switch.png) |
| dash | 4→5 | Compact native ability lean; source legs stay restrained at dash velocity. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-dash.png) / [after](../../artifacts/nextgen/m9-final/after/marine-dash.png) |
| hit | 1→4 | Direction and local hold now exist; silhouette remains modest. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-hit.png) / [after](../../artifacts/nextgen/m9-final/after/marine-hit.png) |
| death | 2→5 | 300ms eased roll, knee fold and torso curl; not a fully articulated marine ragdoll. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-death.png) / [after](../../artifacts/nextgen/m9-final/after/marine-death.png) |
| cast-ram | 4→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-ram.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-ram.png) |
| cast-seismic-slam | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-seismic-slam.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-seismic-slam.png) |
| cast-bulwark | 3→6 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-bulwark.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-bulwark.png) |
| cast-railbreaker | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-railbreaker.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-railbreaker.png) |
| cast-frost-trail | 4→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-frost-trail.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-frost-trail.png) |
| cast-cryo-nova | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-cryo-nova.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-cryo-nova.png) |
| cast-glacier | 3→6 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-glacier.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-glacier.png) |
| cast-whiteout | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-whiteout.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-whiteout.png) |
| cast-afterburn | 4→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-afterburn.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-afterburn.png) |
| cast-flashfire | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-flashfire.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-flashfire.png) |
| cast-napalm-charge | 3→6 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-napalm-charge.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-napalm-charge.png) |
| cast-meltdown | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-meltdown.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-meltdown.png) |
| cast-static-step | 4→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-static-step.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-static-step.png) |
| cast-overload | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-overload.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-overload.png) |
| cast-tesla-pylon | 3→6 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-tesla-pylon.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-tesla-pylon.png) |
| cast-overclock | 3→5 | Deployment hand separates from heavy brace; several abilities still share a body gesture. | [before](../../artifacts/nextgen/m9-final/before-fixed/marine-cast-overclock.png) / [after](../../artifacts/nextgen/m9-final/after/marine-cast-overclock.png) |

### crawler

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-idle.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-idle.png) |
| run | 5→6 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-run.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-run.png) |
| attack | 3→4 | Native contact has no anticipation window; source strike and recovery remain fairly quiet. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-attack.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-attack.png) |
| light-hit | 3→5 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-light-hit.png) |
| heavy-hit | 3→6 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-heavy-hit.png) |
| stagger | 2→6 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-burning.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-death.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-spawn.png) |

### spitter

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-idle.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-idle.png) |
| run | 3→5 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-run.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-run.png) |
| attack | 3→6 | Held body warning, locked native attack facing, fast release and recovery. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-attack.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-attack.png) |
| light-hit | 3→5 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-light-hit.png) |
| heavy-hit | 3→6 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-heavy-hit.png) |
| stagger | 2→6 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-burning.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-death.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-spawn.png) |

### brute

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-idle.png) / [after](../../artifacts/nextgen/m9-final/after/brute-idle.png) |
| run | 4→5 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-run.png) / [after](../../artifacts/nextgen/m9-final/after/brute-run.png) |
| attack | 4→7 | Held body warning, locked native attack facing, fast release and recovery. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-attack.png) / [after](../../artifacts/nextgen/m9-final/after/brute-attack.png) |
| light-hit | 3→5 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/brute-light-hit.png) |
| heavy-hit | 3→5 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/brute-heavy-hit.png) |
| stagger | 2→5 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/brute-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/brute-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-burning.png) / [after](../../artifacts/nextgen/m9-final/after/brute-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/brute-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-death.png) / [after](../../artifacts/nextgen/m9-final/after/brute-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/brute-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/brute-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/brute-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/brute-spawn.png) |

### stalker

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-idle.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-idle.png) |
| run | 5→6 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-run.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-run.png) |
| attack | 4→4 | Native contact has no anticipation window; source strike and recovery remain fairly quiet. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-attack.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-attack.png) |
| light-hit | 3→4 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-light-hit.png) |
| heavy-hit | 3→4 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-heavy-hit.png) |
| stagger | 2→4 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-burning.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-death.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-spawn.png) |

### carrier

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-idle.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-idle.png) |
| run | 3→4 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-run.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-run.png) |
| attack | 2→3 | Native contact has no anticipation window; source strike and recovery remain fairly quiet. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-attack.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-attack.png) |
| light-hit | 3→4 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-light-hit.png) |
| heavy-hit | 3→5 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-heavy-hit.png) |
| stagger | 2→5 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-burning.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-shocked.png) |
| death | 5→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-death.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-death-burn.png) |
| death-arc | 3→6 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-spawn.png) |

### crawler-elite

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-idle.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-idle.png) |
| run | 5→6 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-run.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-run.png) |
| attack | 3→4 | Native contact has no anticipation window; source strike and recovery remain fairly quiet. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-attack.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-attack.png) |
| light-hit | 3→5 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-light-hit.png) |
| heavy-hit | 3→6 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-heavy-hit.png) |
| stagger | 2→6 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-burning.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-death.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/crawler-elite-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/crawler-elite-spawn.png) |

### spitter-elite

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-idle.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-idle.png) |
| run | 3→5 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-run.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-run.png) |
| attack | 3→6 | Held body warning, locked native attack facing, fast release and recovery. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-attack.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-attack.png) |
| light-hit | 3→5 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-light-hit.png) |
| heavy-hit | 3→6 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-heavy-hit.png) |
| stagger | 2→6 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-burning.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-death.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/spitter-elite-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/spitter-elite-spawn.png) |

### brute-elite

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-idle.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-idle.png) |
| run | 4→5 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-run.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-run.png) |
| attack | 4→7 | Held body warning, locked native attack facing, fast release and recovery. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-attack.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-attack.png) |
| light-hit | 3→5 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-light-hit.png) |
| heavy-hit | 3→5 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-heavy-hit.png) |
| stagger | 2→5 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-burning.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-death.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-elite-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/brute-elite-spawn.png) |

### stalker-elite

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-idle.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-idle.png) |
| run | 5→6 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-run.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-run.png) |
| attack | 4→4 | Native contact has no anticipation window; source strike and recovery remain fairly quiet. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-attack.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-attack.png) |
| light-hit | 3→4 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-light-hit.png) |
| heavy-hit | 3→4 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-heavy-hit.png) |
| stagger | 2→4 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-burning.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-death.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/stalker-elite-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/stalker-elite-spawn.png) |

### carrier-elite

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-idle.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-idle.png) |
| run | 3→4 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-run.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-run.png) |
| attack | 2→3 | Native contact has no anticipation window; source strike and recovery remain fairly quiet. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-attack.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-attack.png) |
| light-hit | 3→4 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-light-hit.png) |
| heavy-hit | 3→5 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-heavy-hit.png) |
| stagger | 2→5 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-burning.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-shocked.png) |
| death | 5→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-death.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-death-burn.png) |
| death-arc | 3→6 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-elite-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-elite-spawn.png) |

### brute-warden

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-idle.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-idle.png) |
| run | 4→5 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-run.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-run.png) |
| attack | 4→7 | Held body warning, locked native attack facing, fast release and recovery. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-attack.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-attack.png) |
| light-hit | 3→5 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-light-hit.png) |
| heavy-hit | 3→5 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-heavy-hit.png) |
| stagger | 2→5 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-burning.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-shocked.png) |
| death | 6→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-death.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-death-burn.png) |
| death-arc | 3→5 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/brute-warden-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/brute-warden-spawn.png) |

### carrier-matron

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| idle | 3→4 | Small family breathing/head response, still understated. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-idle.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-idle.png) |
| run | 3→4 | Family source gait, native velocity scaling and id-seeded cycle; heavy bodies retain some sliding. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-run.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-run.png) |
| attack | 2→3 | Native contact has no anticipation window; source strike and recovery remain fairly quiet. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-attack.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-attack.png) |
| light-hit | 3→4 | Source family pain track plus signed restrained flinch. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-light-hit.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-light-hit.png) |
| heavy-hit | 3→5 | Pain pose, short local clip hold, compression and bounded directional return. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-heavy-hit.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-heavy-hit.png) |
| stagger | 2→5 | Readable longer recoil response; shares family heavy-pain vocabulary. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-stagger.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-stagger.png) |
| frozen | 6→6 | Stops source pose and retains cold body finish; no cycling while frozen. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-frozen.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-frozen.png) |
| burning | 2→3 | More agitated body breath; distress is still mostly external VFX. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-burning.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-burning.png) |
| shocked | 1→4 | Small native-status convulsion; understated at gameplay scale. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-shocked.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-shocked.png) |
| death | 5→6 | Family lift/torque/mass plus killing momentum and corpse-local hold. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-death.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-death.png) |
| death-frost | 4→5 | Retained cold finish, stiff low fall and small shards; connected skeleton remains. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-death-frost.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-death-frost.png) |
| death-burn | 3→5 | Darkened finish, low collapse, short vapor/embers; limited bespoke curl. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-death-burn.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-death-burn.png) |
| death-arc | 3→6 | Opposing articulated limb impulse and retained violet finish; no dedicated authored convulsion clip. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-death-arc.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-death-arc.png) |
| spawn | 3→4 | Bounded smooth emergence; small actors avoid scale popping, but no bespoke breach-climb. | [before](../../artifacts/nextgen/m9-final/before-fixed/carrier-matron-spawn.png) / [after](../../artifacts/nextgen/m9-final/after/carrier-matron-spawn.png) |

### crowd

| Action | Before→after | Final judgment | Before / after strips |
|---|---:|---|---|
| run | 4→7 | 2–3/6 same-time distinct source poses before,6/6 after; no synchronized reset wave. | [before](../../artifacts/nextgen/m9-final/before-crowd/crowd-run.png) / [after](../../artifacts/nextgen/m9-final/after/crowd-run.png) |
