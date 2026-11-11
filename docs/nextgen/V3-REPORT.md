# V3 ability spectacle finishing pass

Branch: `t3/ability-vfx-spectacle`. Renderer implementation: `55114ad6f2b3b383978b16c3642e123bf0dd3956`. The final handoff commit is recorded in the stream's final message; subsequent commits only contain evidence tooling/reporting. Integrated starting point: `93adf6d10870e94fd5b32d2b04eff1ef746f64d8`.

## What shipped

All sixteen signatures have stronger mass, temporal separation, local light and floor aftermath. Presentation still consumes authoritative events/snapshots. No simulation, UI, audio, smoke, room-loading or world-render ownership changes. No new dependencies or assets. Low keeps actual attack dimensions with fewer decorative layers. Reduced motion and flash intensity gate camera/flash responses.

| Ability | Before → V3 |
|---|---|
| Ram | Small amber line → angular pressure shield with dust shoulders, spark scrapes and two cooling skid scars along the observed dash, ending at the actual arrival. |
| Seismic Slam | Thin radius indicator → fast full-radius pressure front, low hot leading edge, 1.5m settling dust wall, 32 pooled chunks plus large plates, irregular deck fractures and ten-second crack aftermath. Hard white/amber light and two-frame camera punch. |
| Bulwark | Thin screen → 2.4m cover with visible thickness, three rows of hex cells, a floor projector, health-driven impact response, heavy unfold/collapse and distortion. |
| Railbreaker | Narrow ray → 600ms convergence/laser charge, ≥0.7m white core, layered corona/air trail, pressure collars, analytical wall slag and a twelve-second full-line trench that cools from orange to char. Strong camera response and accessibility-scaled exposure flash. |
| Frost Trail | Faint ice line → continuous ankle-high blue slab with irregular jagged plates and crystalline capsule edges. |
| Cryo Nova | Fine ring → thick full-radius rolling vapor, hard front and needles, softer fern frost across the complete floor footprint, six-and-a-half-second aftermath and faceted shells on actual frozen enemies. |
| Glacier | Floating diamonds → grounded irregular 2.05–2.85m columns, solid blue body with restrained translucent facets, ragged skirt, base frost and mist. Shatter throws 48 pooled shards plus secondary burst and cold pressure. |
| Whiteout | Strong existing aura → 96 driven snow streaks on High / 24 on Low, coherent wind, freeze pulses and frost glints on actual nearby blocker rims. |
| Flashfire | Empty cone with bright lip → dense seven-band rolling fire plus an exact transient fire sector, held through 350ms, hot muzzle, orange body, far smoke, strong light and an eight-second sector scorch. |
| Napalm Charge | Small spark/pool → visible lobbed canister/trail, stem-and-crown mushroom, flowing liquid surface, tall narrow tongues, embers, dark smoke, shimmer and 6–8m local illumination. |
| Afterburn | Spaced dots → twin suit jets and a continuous ≥0.8m flame wall along the authoritative strip. |
| Meltdown | Faint outer aura → burning body mantle and backpack jets, lower open boundary, ember storm, pooled burning footprints, fiery tracers/kill balls and subtle active warm grade. Final correction gives the marine priority over its rim. |
| Static Step | Small blink → articulated bolt silhouette, zigzag along observed travel, actual arrival burst, seven-second ground star and forks to real targets. |
| Overload | Fine links → thick layered braid/branches, 40ms native-hop rhythm, white core, 520ms air afterglow and target/floor light. |
| Tesla Pylon | Existing coil → landing pressure/chunks/scorch star, stronger live arcs, dark contact base and thicker industrial shaft for bright-floor contrast. |
| Overclock | Subtle color cue → separated time slices and counter-echo on activation/expiry, cool desaturation/violet edge grade, bounded visible hostile motion echoes, bright marine afterimages and long tracers. Low retains the time dial/echo vocabulary. |

Common marine cast pulses/ready vents, articulated afterimages, launched-body dust and full actor-bound faceted freeze shells complete the shared feedback. Fixed inventories remain 768 particles, 64 rings, 64 beams and 32 persistent scars; the new pressure batch holds 64 fronts. Instance and nine-local-light caps remain enforced. One retained torus mesh/geometry/material and one batched draw are added. No new full-screen pass.

## Art direction and evidence

Three complete critique → correction rounds are documented in `plans/V3.md`, each based on actual desktop sprite sheets and exact area-reduced 480×270 frames. Round one removed shiny bubble fronts, geometric frost grids and separated fire lips; round two corrected dark flame bodies, noisy frost and occluded Ram arrival evidence; round three corrected Meltdown body/rim hierarchy and Pylon bright-floor support contrast.

Baseline label `v3-before`: sixteen seven-phase abilities plus four 25-enemy Armory kits, 140 validated frames. Round labels: `v3-round1`, `v3-round2`, `v3-round3`, plus `v3-round3-env` for bright/dark/Low. Final source labels: `v3-shipped-core`, `v3-shipped-env`, `v3-shipped-recovery-settled`, all from the immutable `v3-shipped-dist` at the implementation SHA above. Desktop viewport is 1920×1080; 480×270 images are reductions for art judgment.

The original baseline command validated all 140 PNGs, then its embedded-HTML packaging exceeded Node's string limit (`RangeError: Invalid string length`). That nonzero command/log is retained. The bounded V3 review generator rebuilds only the file-linked gallery; the captured PNGs, simulation receipts and assertions are unchanged. Final captures use smaller serial batches and all finish successfully.

The unmodified `v2-recovery` first failed its HUD/player/overlay assertion because its direct `game.resume()` leaves the integrated “Graphics restored” acknowledgement open. Its failed manifest and image remain under `v3-shipped-recovery`; the initial additive attempt also retained a disabled-control timing failure under `v3-shipped-recovery-ack`. Additive `v3-recovery` retains the same tier/room/context restoration resource proof, then acknowledges restoration through `#graphics-continue` and `#resume`, as the existing G1 fixture does. No product UI or capture assertion is changed. This capture fixture uses control click handlers; the independent smoke gate covers native desktop actions.

Final gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/index.html`. `comparisons/` contains before-over-after seven-phase sheets for every ability and four matched Armory kits; `before-sheets/` retains native baseline sheets; `before-thumbnails/` and `review/` retain individual exact 480×270 frames and phase sheets. Original final full-resolution PNGs and native sprite sheets remain beside them. `sources/` retains unmodified provenance manifests; bright containment, dark infested and Low Armory fights cover each rig.

### Ten sheets to inspect first (absolute paths)

1. [Railbreaker comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-railbreaker.png)
2. [Seismic Slam comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-seismic-slam.png)
3. [Cryo Nova comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-cryo-nova.png)
4. [Glacier comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-glacier.png)
5. [Flashfire comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-flashfire.png)
6. [Napalm Charge comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-napalm-charge.png)
7. [Overload comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-overload.png)
8. [Overclock comparison](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/comparisons/v2-overclock.png)
9. [Pyro bright-room kit](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/review/v2-full-pyro-containment-annulus-containment-annulus-sheet.png)
10. [Cryo dark-room kit](/Users/chernodub/.t3/worktrees/containment-game/t3-6e8e32a3/artifacts/nextgen/v3-final/review/v2-full-cryo-infested-workshop-infested-workshop-sheet.png)

## Gates

Logs and host loads are retained under `artifacts/nextgen/v3-final/gates/`. `VITEST_MAX_WORKERS=2`; one capture/bench/gate browser runs at a time.

| Gate | Retained summary |
|---|---|
| `npm ci` | Passed before the baseline build/capture. |
| `npm run verify` | Exit 1 at the documented absent Blender check: `FileNotFoundError: [Errno 2] No such file or directory: 'blender'`. No assertions or scripts changed to bypass it. |
| Vitest inside verify | `Test Files 216 passed / 1 skipped (217)`; `Tests 2603 passed / 1 skipped (2604)`. Duration 113.93s; host load start 56.41 / 81.77 / 137.96. |
| Node model preview inside verify | `pass 2`, `fail 0`. |
| Independent `npm run build` | Exit 0, TypeScript and Vite green; existing large-chunk advisory. 4.95s at load 60.73 → 58.75. |
| Independent `npm run test:room-evidence` | `tests 28`, `pass 28`, `fail 0`; ragdoll self-test `passed:true`, `checks:33`. 5.64s at load 58.75 → 55.88. |
| Independent `npm run test:smoke` | `Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.` Exit 0; 144.52s at load 55.88 → 36.73. Recovery, resizing, native rig input and checkpoint feedback phases pass. |
| Authored desktop smoke | Exit 0 on the unchanged fresh-browser retry: all 20 rooms, `input: real keyboard move/fire`, `errors:[]`, including final-room explicit authorization. 176.42s at load 27.18 → 51.83. |
| Final captures | Core 140 frames/20 sheets + environment 84 frames/12 sheets + acknowledged recovery 1 frame = 225 validated frames; final manifests have no errors/failures. |

Recovery retains 158 geometries / 79 textures in each of three equivalent pre-loss room cycles, then 153 / 79 in each of two equivalent restored cycles; context is healthy and acknowledged through the existing controls. Restoration is allowed to rebuild resources, but equivalent cycles must remain stable. No desktop input, sizing, persistence, authored or graphics-recovery assertion was removed.

The first all-twenty authored attempt timed out on Awakening Bay's native Space-fire/ammunition assertion; its failure screenshot shows a dead marine with zero shots, and console/page errors are empty. Its 120s assertion timeout is unchanged. A fresh run of the same script/rooms passed all twenty without a source change. Failed evidence is retained in `gates/authored-initial-failure/`, the initial log in `gates/authored-20.log`, and the successful receipts in `gates/authored-passed-manifest.json` / `gates/authored-retry.log`. This is a recorded intermittent gate failure, not a claimed product fix.

## Before/after sustained benchmark

Final measured table: `artifacts/nextgen/v3-final/bench.md`, chart `bench.html`, matched receipts `bench.json`. Raw trials: `v3-before-bench/benchmark.json` and `v3-after-bench/benchmark.json`. Same legal sustained fixture, native audio, 25 replenished enemies with corpses retained, native cooldowns, two I4-selected rooms × four rigs × High/Low × three 20-second trials = 48 trials per build. One browser runs at a time.

Best CPU-p95 of three is reported per fixture; draws, ability instances and lights are worst peaks across all three, so a favorable CPU repeat cannot conceal a count peak. Every timing row includes that repeat's start load and raw files retain start/end loads for all runs. Baseline start-load range is 86.42–326.89 on a ten-core M1 Pro, ANGLE Metal. CPU includes update, submission, fixture driver and post-render HUD. The shared host is heavily contended; this is observational timing evidence, not isolated hardware certification. The baseline already reaches 375 draws, over the global 350 target. Any retained inherited or V3 budget misses must remain explicit in the final table.

The final main matrix has 48 valid trials, zero page/console/GL errors, no lost contexts, zero combat `createProgram` calls and all four accepted native ability receipts in every trial. All sixteen fixture groups pass the V3 +25 draw-delta limit (largest +21). Two CPU deltas initially miss +0.5ms: Awakening/Breacher/High +1.80ms and Awakening/Arc/Low +0.90ms; fourteen pass. Separate alternating preserved-build rechecks retain these original misses and all original rows.

Both misses pass the fresh matched recheck: three alternating before/after pairs per fixture (12 additional 20-second trials, source hashes verified against the immutable-build witness). Best-of-three Breacher High is 12.50 → 12.30ms at loads 34.08 → 52.19, worst draws 357 → 352; Arc Low is 7.90 → 7.80ms at loads 45.55 → 36.92, worst draws 176 → 180. No source change intervened. Recheck trials also have zero combat compiles, no errors and fixed inventories. See `recheck.md`, `recheck.json`, `rechecks/` and `gates/recheck.log`. This is evidence against a repeatable V3 delta regression in that window, not a replacement for the original matrix or a quiet-hardware signoff.

After start-load range: 13.29–150.35. Worst draws are 375 → 365. Six baseline trials and seven final trials exceed the absolute 350 target; the final benchmark correctly returns exit 2. No absolute frame/CPU/draw signoff is implied. Global zero-allocation/GC certification is also absent: these runs do not heap-profile the application, and benchmark sample storage intentionally allocates.

Prepared full-scene instanced-mesh inventories are 73/76 → 75/78 depending on room: one active pressure batch plus its existing MaterialWarmup prototype. They remain unchanged from start to end of every trial. Prepared program inventory peaks at 1174 → 1191 (+17 prepared variants); combat compiles remain zero. Scene light inventory remains 23, with at most nine active ability-pool lights on High. Aggregate visible ability instances peak at 1603 → 2503, chiefly Arc's layered ribbons; this includes the separate existing ribbon inventory and stays below the unchanged 4096 aggregate browser bound. The 2048 primitive-submission and 2048 ribbon caps are not raised. These counts make the increased spectacle cost explicit rather than equating batching with free rendering.

| Room / rig / tier | Load before → after | CPU p95 ms | Δ CPU | Draw peak | Δ draws | Ability instances | Lights | Delta checks |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| awakening-bay / breacher / high | 92.95 → 48.82 | 12.90 → 14.70 | 1.80 | 339 → 359 | 20 | 538 → 717 | 9 → 9 | CPU FAIL; draw pass |
| awakening-bay / breacher / low | 162.01 → 41.95 | 8.90 → 8.20 | -0.70 | 187 → 193 | 6 | 157 → 213 | 0 → 0 | CPU pass; draw pass |
| awakening-bay / cryo / high | 145.31 → 19.95 | 13.40 → 12.30 | -1.10 | 375 → 361 | -14 | 801 → 855 | 9 → 9 | CPU pass; draw pass |
| awakening-bay / cryo / low | 114.35 → 21.35 | 9.40 → 8.70 | -0.70 | 209 → 215 | 6 | 466 → 461 | 0 → 0 | CPU pass; draw pass |
| awakening-bay / pyro / high | 86.42 → 29.31 | 15.40 → 13.80 | -1.60 | 367 → 365 | -2 | 708 → 825 | 9 → 9 | CPU pass; draw pass |
| awakening-bay / pyro / low | 127.96 → 28.57 | 10.10 → 9.80 | -0.30 | 203 → 204 | 1 | 277 → 332 | 0 → 0 | CPU pass; draw pass |
| awakening-bay / arc / high | 119.12 → 86.83 | 12.10 → 11.60 | -0.50 | 326 → 330 | 4 | 1346 → 2441 | 9 → 9 | CPU pass; draw pass |
| awakening-bay / arc / low | 91.07 → 136.18 | 7.90 → 8.80 | 0.90 | 177 → 179 | 2 | 253 → 367 | 0 → 0 | CPU FAIL; draw pass |
| diagnostic-gallery / breacher / high | 98.47 → 99.15 | 12.80 → 12.50 | -0.30 | 284 → 288 | 4 | 547 → 759 | 9 → 9 | CPU pass; draw pass |
| diagnostic-gallery / breacher / low | 131.20 → 67.38 | 10.40 → 9.10 | -1.30 | 170 → 172 | 2 | 169 → 228 | 0 → 0 | CPU pass; draw pass |
| diagnostic-gallery / cryo / high | 159.73 → 55.09 | 13.60 → 13.10 | -0.50 | 280 → 301 | 21 | 777 → 836 | 9 → 9 | CPU pass; draw pass |
| diagnostic-gallery / cryo / low | 299.88 → 28.90 | 9.60 → 8.30 | -1.30 | 167 → 167 | 0 | 366 → 444 | 0 → 0 | CPU pass; draw pass |
| diagnostic-gallery / pyro / high | 322.67 → 16.33 | 13.90 → 12.70 | -1.20 | 302 → 296 | -6 | 715 → 799 | 9 → 9 | CPU pass; draw pass |
| diagnostic-gallery / pyro / low | 302.86 → 16.79 | 10.50 → 9.50 | -1.00 | 178 → 171 | -7 | 275 → 352 | 0 → 0 | CPU pass; draw pass |
| diagnostic-gallery / arc / high | 293.41 → 19.89 | 10.20 → 9.70 | -0.50 | 258 → 258 | 0 | 1603 → 2503 | 9 → 9 | CPU pass; draw pass |
| diagnostic-gallery / arc / low | 235.27 → 41.67 | 8.10 → 6.80 | -1.30 | 149 → 153 | 4 | 299 → 423 | 0 → 0 | CPU pass; draw pass |

### Alternating matched rechecks

| Original miss | Best-trial load before → after | CPU p95 ms | Δ CPU | Worst draws | Δ draws | Delta checks |
|---|---:|---:|---:|---:|---:|---|
| awakening-bay / breacher / high | 34.08 → 52.19 | 12.50 → 12.30 | -0.20 | 357 → 352 | -5 | CPU pass; draw pass |
| awakening-bay / arc / low | 45.55 → 36.92 | 7.90 → 7.80 | -0.10 | 176 → 180 | 4 | CPU pass; draw pass |

## Tests rewritten / removed

No tests or desktop invariants were deleted. Presentation assertions changed in these owned files:

- `AbilityBudgets.test.ts`: fixed mesh/geometry/material/draw ceilings each rise by exactly one for the single retained pressure batch; particle, instance, light, reused-buffer and lifecycle bounds stay intact.
- `InstanceBatch.test.ts`: adds the front primitive to transform/color/buffer reuse coverage.
- `breacher/breacher.test.ts`: old ring/thin-beam/dust pins become full-radius volume, 2.4m solid cover, ≥0.7m core, charge duration, cooling full-line scar, wall slag and observed dash/skid assertions; authoritative length/width/angle, expiration and Low guarantees remain.
- `cryo/CryoPresentation.test.ts`: old 36-shard/faint decal and nine simple-solid pins become volume/full-radius frost, 60 needles and nine irregular grounded column submissions, retaining facing/width/length, age growth, pause and authoritative snapshot lifecycle checks. Adds driven-snow/blocker-rim and shard-shatter coverage.
- `pyro/PyroPresentation.test.ts`: old narrow fire-card pins become all radial cone bands through 350ms, exact sector scorch and liquid pool, continuous ≥0.8m strip flames, open aura/body mantle and bounded footsteps; canister path, head clearance, authoritative geometry and cleanup remain.
- `arc/ArcPresentation.test.ts`: old thin-chain pins become multi-layer core/hop rhythm and stronger mechanical/arrival/time signatures, retaining endpoint, radius, pause, Low, pool and disposal guarantees.
- `system/SystemPresentation.test.ts`: first freeze facet is now centered on the actor as an enclosing shell instead of a detached glint; same actor bound, shard budget, visibility and buffer lifecycle remain.

New `SpectaclePrimitives.test.ts` covers exact front extents, Low height without footprint shrinkage, eight-second scar pause/expiry, fixed pool reuse, sector/line encoding and cooling, flash accessibility and two-frame punch duration.

## Shared-module hooks / integration requests

Only three files outside the owned abilities tree changed:

1. `src/render/DepthRenderer.ts`: passes `presentation: this.post` through the existing ability service binding.
2. `src/render/post/PostPipeline.ts`: one retained vector, optional `setAbilityPresentation` setter, and an existing-composite uniform; clears through the ability frame lifecycle. Low retains the forward path.
3. `src/render/post/shaders.ts`: accessibility-scaled exposure multiplier and warm/cool/violet presentation math in the existing composite. Hostile red/orange warning hues retain chroma.

The integrating performance stream needs to preserve that optional binding/uniform if it refactors the composite. No other integration change is required. No push, PR or merge was made.

## Honest visual ranking, strongest → weakest

1. **Railbreaker** — strongest charge/core/air/aftermath separation; still needs authored volumetric lighting to reach a premium cinematic beam.
2. **Seismic Slam** — broad floor event with dust/chunks and readable fracture aftermath; floor geometry itself does not deform.
3. **Flashfire** — unmistakable filled flamethrower fan at thumbnail size; layered cards remain visible at some camera angles.
4. **Cryo Nova** — strong broad cold roll and persistent footprint; procedural frost is less organic than authored texture work.
5. **Overload** — weighty native-hop braid with clear contact flashes; branches could have more irregular hand-authored timing.
6. **Whiteout** — dense driven weather and strong active boundary; prop frost is sparse analytical rim glints rather than accumulated coating.
7. **Napalm Charge** — readable projectile, mushroom and liquid pool; mushroom remains layered geometry and smoke is a bounded approximation.
8. **Bulwark** — now reads as thick cover with a clear industrial base; screen distortion approximates refraction.
9. **Afterburn** — continuous tall trail and twin jets; repeated flame texture is still detectable in quiet frames.
10. **Glacier** — grounded mass and strong shatter; faceted columns remain procedural crystal geometry, without true internal ice scattering.
11. **Tesla Pylon** — strong machinery, impact and live arcs; landing is less violent than the top abilities and the coil is small in a long-lens crowd.
12. **Static Step** — arrival/zigzag and electrical silhouette are clear; struck brutes can obscure the marine during its shortest peak.
13. **Frost Trail** — solid jagged strip with persistent edges; plates still repeat more than an authored ice sheet would.
14. **Meltdown** — burning body now leads the aura, with prints/embers/grade; needs richer suit-specific flame attachment and less sprite repetition.
15. **Overclock** — unmistakable dial/grade/echo state and time-slice activation; still less physical mass than destructive abilities, with procedural assembled marine ghosts. Low intentionally omits the expensive global composite grade.
16. **Ram** — pressure shield, actual-path skids and dust are a clear upgrade; its shortest arrival remains most vulnerable to struck-body occlusion at 480×270. Persistent skids help, but cannot replace an unobstructed leading pose.

This is a substantial silhouette/mass improvement over the integrated first pass, not a claim that procedural instancing alone reaches bespoke AAA effects. Shared front/debris/aftermath vocabulary gives the four rigs one visual language. Recommended follow-up is authored material/animation refinement of the weakest four, plus quiet-host hardware profiling alongside the renderer performance stream.
