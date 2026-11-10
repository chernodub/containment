# Stream G1 — Render pipeline, light, atmosphere, camera, combat VFX

You are the **graphics lead**. Read `docs/nextgen/00-VISION.md` (especially §2, §3, §5) and `docs/nextgen/01-ENGINEERING.md` first.
Goal: turn the current flat, evenly-lit top-down view into a cinematic, atmospheric, readable image that is an
unmistakable generational jump over `artifacts/nextgen/baseline/` — while holding the performance budget.

## You own
`src/render/**` (everything, including `DepthRenderer.ts`, `AttackEffects.ts`, `SceneLighting.ts`, `models.ts`,
`graphicsOptions.ts`; excluding `HitConfirmation.ts`, which the UI stream owns and will move) and the tests that cover those files. New code goes in new, readable modules under `src/render/`
(suggested: `post/`, `lighting/`, `atmosphere/`, `camera/`, `vfx/`). You may add capture scenarios (see `scripts/nextgen/README.md`).

## You do not touch
`src/main.ts`, `src/style.css`, `index.html`, `src/ui/**`, `src/HudLayout.ts`, `src/StatusHud.ts`, `src/WeaponHud.ts`,
`src/DepthGame.ts`, `src/InputController.ts`, `src/game/**`, `scripts/smoke*.mjs`, `scripts/authored-room-smoke.mjs`.
The public surface `main.ts` uses today (`new DepthRenderer(canvas)`, `setQuality`, `qualityTier`, `prepare`, `loadRoom`,
`roomLoading`, `render(game, dt, menu)`, `effect(e)`, `syncCorpse`, `resize`, `visible`, `pointer`, `playerScreenBounds`,
`canvas`, `renderer.info`) must keep working unchanged. Add new public API freely (list it in your report).

## Scope

### 1. HDR post pipeline (`src/render/post/`)
Replace the ad-hoc `EffectComposer → UnrealBloom → Output` chain with a deliberate pipeline:
- HDR scene target (half-float), MSAA on High; depth available to post.
- Ambient occlusion (GTAO-class; three's `GTAOPass` or the `n8ao` package are acceptable — pick by quality/cost on real captures).
- Bloom driven by genuinely hot emissives (raise emissive intensities deliberately; do not bloom the whole frame).
- One final composite shader: tone mapping (evaluate AgX vs ACES on our scenes), per-environment color grade
  (exposure, lift/gamma/gain or equivalent, saturation, split-tone), depth/height haze, vignette, edge chromatic fringe,
  fine animated grain, light sharpening, dithering against banding.
- A low-resolution **distortion buffer** that effects can draw into (shockwaves, heat haze, cryo shimmer), sampled by the composite.
- Everything driven by `GraphicsOptions` (`src/render/graphicsOptions.ts`): implement `renderer.setGraphicsOptions(partial)`
  and `renderer.graphicsOptions`; `setQuality(tier)` loads the tier preset. `low` must stay a genuinely cheap path
  (single forward pass, no post targets).

### 2. Light as art direction (`src/render/lighting/`)
- Data-driven **environment moods** for all ten environments (table in 00-VISION §3): key/fill/rim, ambient, fog, grade,
  exposure, accent/practical colors, animated behaviors (alarm strobe, flicker, pulsing growth, reactor throb).
  Rooms must look clearly different from each other at a glance.
- Soft, stable shadows on High; contact shadows/AO ground every prop and actor.
- **LightPool**: a fixed pool of dynamic point lights with priority and fade (High ≈ 8–12, Low 0–2). API for one-shot
  flashes (muzzle, impact, explosion, ability) and attached lights (burning/shocked enemies, plasma bolts, deployables).
- **Practical lights**: place real (pooled/static, budgeted) lights at the authored emissive fixtures so fixtures visibly
  light their surroundings; add volumetric-looking shafts/cones where motivated.
- The marine's lamp: a visible cone that lights where the player aims and sells depth.
- **Local reflections**: capture the loaded room once into a cube map → PMREM → `scene.environment` (replacing the generic
  RoomEnvironment), so metal and wet floors reflect the actual room; tune floor roughness per environment.

### 3. Atmosphere (`src/render/atmosphere/`)
Instanced, tier-gated ambient layers per environment: dust motes, frost mist, steam bursts, drifting spores, embers,
low ground fog, heat shimmer. Subtle parallax/depth. Must never reduce gameplay readability.

### 4. Camera (`src/render/camera/`)
- `CameraRig`: critically-damped follow, aim look-ahead, trauma-based shake, directional recoil kick, zoom punch.
  Public API such as `addTrauma(amount)`, `kick(angle, amount)`, `punch(amount, ms)`; wire the renderer's own existing
  effects to it (shots, explosions, player hurt). Scale by `graphicsOptions.screenShake` and honor reduced motion.
- **Perspective**: evaluate replacing the orthographic camera with a long-lens perspective camera (narrow FOV, matched to
  the current ground-plane framing) for parallax and depth. Adopt it if — and only if — aiming (`pointer`), visibility
  (`visible`), `playerScreenBounds`, room-bounds clamping and the desktop framing guarantees (the `*Framing*` tests'
  intent: the marine is never clipped or hidden at room edges) all hold. Otherwise keep orthographic and say why.
  Decide from side-by-side captures, not from theory.

### 5. Combat VFX upgrade (existing effects only — abilities come later) (`src/render/vfx/`)
- Tracers: tapered, HDR-bright, per-weapon identity (pistol/rifle amber streaks, shotgun pellets, plasma bolts with glow and
  trail, rocket with exhaust and smoke trail), each with light.
- Muzzle flash that lights the marine and nearby walls; ejecting shell casings that land and persist briefly.
- Impacts: sparks/dust/chips by surface, flesh/acid by enemy; **pooled decals** (bullet holes, scorch, acid burns, frost,
  blood) that persist within the room with a bounded budget.
- Explosions: flash → fireball → smoke → shockwave distortion → lingering light → scorch decal; camera trauma.
- Enemies: stronger silhouette (rim/fresnel), hit flash, death dissolve/burn-out, elite/champion aura; status effects light the scene.
- Player: clearer silhouette and facing; hurt feedback.
- Provide reusable building blocks for the later ability stream: ground **telegraph** primitives (circle, cone, line, wall,
  with fill progress), beam/lightning ribbons, shockwave ring, ground-zone material (fire/frost/electric), deployable shield
  material. Export them cleanly; a tiny demo scenario for each is enough.

## Method
Fan out: post, lighting/moods/reflections, atmosphere, camera and VFX are separable once you (the lead) have landed the
seams in `DepthRenderer.ts` first. Integrate continuously and re-capture.

Capture and critique against the baseline at least for: `title`, `combat-calm` and `combat-heavy` in six different
environments, `status-vfx`, `boss`. Check Low tier too.

## Acceptance
- Gates in 01-ENGINEERING pass (vitest, build, smoke, authored smoke, capture). No console/WebGL errors or warnings.
- Performance evidence in the report: draw calls, triangles, frame/update/render ms for heavy combat on High and Low,
  before vs after (the capture manifest records these).
- The ten environments are visually distinct and on-mood. Heavy combat is more exciting *and* more readable than baseline.
- No leaks across room changes / quality switches / context restore.
