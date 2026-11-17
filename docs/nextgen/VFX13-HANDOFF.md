# VFX13 handoff — flagship ability effects

Branch `t3/3fffdd93` (from `nextgen`). Review log: `docs/nextgen/plans/VFX13-review.md`.
Before/after sheets: `artifacts/nextgen/vfx13-final/` (also copied to the project artifacts folder):
`flashfire-`, `railbreaker-`, `cryo-nova-`, `overdrives-before-after.png`, `heavy-combat-high-and-low.png`.
Top row of every sheet = final6 baseline, bottom = VFX13.

## Done
1. **Flashfire**: procedural rolling flame volume (2 slices High, 1 Low), muzzle core, 30 embers thrown forward, cooling
   ember scorch fan (replaces the soot `scar('fan')`), heat distortion, two element lights. Struck enemies burn through the
   existing status flames.
2. **Railbreaker**: hair-thin lance with a 50 ms leading edge, segmented helical wake that cools into a heat trail,
   contact flare + sparks + light at each struck `targetIds` actor, wall contact ring, trench scar, existing camera/
   exposure/zoom response (honours `screenShake`/`flashIntensity` through ElementKit). The broad heavyBeam and the
   vertical shock-sprite rings are gone.
3. **Cryo Nova**: hard shock ring to the exact radius, crystal spike clusters erupting behind the front and sinking,
   creeping rime film (6.5 s) replacing the swirl frost decal; mist cards dimmed.
4. **Overdrive payoff** (`OverdrivePayoff.ts`, driven from the system presentation for every rig): activation beat on
   the overdrive `impact` (Railbreaker: `cast`, weight .6) — white + element shock rings, light pillar, exposure, camera,
   spark spray; sustained element floor field + suit light that follows the marine while `overdrive.active`; ending
   ring/pillar/spark fall on the falling edge.
5. Not done — see "Next" below.

## Technique (apply to the remaining abilities)
`src/render/abilities/FlagshipFx.ts` is a fixed pool of 24 meshes sharing **one** `PlaneGeometry(40×24)` and one shader
source; each mesh has its own uniforms. `ElementKit.fx` owns it under the ability root, so `MaterialWarmup` registers
the hidden meshes and the single program is compiled before combat (no new program at runtime: modes are uniforms).
`AbilityVisuals` binds the hostile priority mask to these materials, so friendly fx fade wherever hostile telegraphs are.

- `kit.fx.spawn(mode, x, z, life)` returns a slot; set `angle/arc/range/inner/h0/h1/color/intensity/param`. Owners may
  move a slot every frame (Flashfire tracks the muzzle; the Overdrive aura follows the marine). `commit()` in
  `kit.end()` writes uniforms. Slots are recycled oldest-first; never allocate.
- Geometry modes (vertex shader): **fan** (Fire, Scorch: u across the exact arc, v from `inner` to `range`; Fire pulls
  only the apex toward the muzzle), **strip** (Lance, Wake: `range` = length, `inner` = half width), **ring/disc**
  (Shock, Frost, Aura: `inner`..`range`). Outer extents never exceed the simulated shape.
- Fire recipe: anisotropic flow space (`q = (lateral*.72, radial*.42)*range` → tongues stretch along the jet) +
  isotropic billow octave, domain warp, sideways curl; erosion threshold grows with distance and age; temperature =
  depth inside the tongue (`(d-erosion)/.32`) → `fxHeat` ramp (dark red → orange → yellow → white). Keep body emission
  below ~1 (ACES turns bright orange to peach); only the core/spine goes HDR. An opaque dark-red rim inks tongue edges.
- Output convention: premultiplied (`rgb = base*alpha + emit`, alpha = occlusion), so smoke darkens and fire adds light.
- Low: fbm drops to 3 octaves, fewer slices/embers/spikes; distortion and extra lights are already suppressed by
  `ElementKit.distort/flash/lightAt` on Low.

## Next (item 5 and the rest)
- **Seismic Slam / Ram (kinetic)**: add a `Shock` ring (amber, hard edge) + a new `Crack` mode (copy Scorch, ridged
  `fxFbm` fissures radiating, amber glow cooling to grey dust) at the exact radius; keep the existing debris/dust motes.
- **Overload (arc)**: Wake-style strip per hop with high-frequency jitter (`fxNoise(along*20 - t*60)`) and white core;
  per-hop contact flare like Railbreaker's `targetIds` loop.
- Napalm pool, Afterburn strip and Meltdown suit flames still use the old salmon flame cards — move them to Fire-mode
  fans/discs (a 360° fan works as a pool).

## Verify
`npm run build`; `npm run capture -- --label=x --scenarios=v2-flashfire,v2-railbreaker,v2-cryo-nova,v2-whiteout,v2-meltdown,v2-overclock --burst=7`
(frames 03 = impact +30 ms, 04 = +150 ms, 05 = +600 ms). Also `v2-full-<rig>-armory` (heavy) and `v2-kit-<rig>-low-armory`.
Check: hostile red telegraphs readable through every effect; no shader compile (`v2Proof.programs` stays 0 — the V2
fixture throws if a program compiles during the timeline); Low keeps shapes. Not run by me: playtest bot, bench.

## Still weak (honest)
- Flashfire: a translucent sheet with procedural tongues, not true volumetric billow/self-shadowed smoke; the white
  muzzle core is small. Good indie, not top-tier.
- Railbreaker: per-target bursts rarely show because lane targets usually die that frame; the +600 ms wake is thin/red.
- Cryo Nova: +30 ms frame is modest; mist puffs are the old billboard cards.
- Overdrives: the 6 m activation wave is a broad translucent band for ~0.5 s; the light pillar is a flat ribbon.
- Not verified against reduced-motion/flash settings beyond code paths (fxIntensity scales with `flashIntensity`;
  time freezes under reduced motion).
