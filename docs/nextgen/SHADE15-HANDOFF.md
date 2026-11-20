# SHADE15 handoff — characters as value masses

Evidence (`artifacts/nextgen/shade15-final/`): `marine-native-{colour,grey}.png` and `marine-480-{colour,grey}.png`
(rows before/after; per rig: calm Crew Checkpoint, calm Relay Racks, heavy `value14-overlap-<rig>` frame 4),
`scenes-480-{colour,grey}.png` (before/after: `value14-crowd-{relay-racks,swarm-junction,crew-checkpoint}` and
the twenty-Brute `combat-heavy:communal-atrium`), `run90-before-after.png` (+ full strips), `portraits-after.png`,
`rig-select-after.png`, `identity-title-rigselect-game.png`. Before = merged nextgen `4d200481` build
(`artifacts/nextgen/shade15-before-dist`), after = this branch. Raw captures: `artifacts/nextgen/s15b-*`, `s15f-*`.
Playtest: `npm run playtest -- --rig=breacher --seed=1729 --rooms=5 --fast` → 5 rooms, 0 errors.

## Shading model (actor paths only; architecture untouched)
- `lighting/GraphicSurface.ts` (actor branch, `graphicSurfaceKind.x`): the three hard steps
  (.40/+.55/+.60 with 4 %-wide transitions) became **two soft bands**: `.62 + .38·smoothstep(.30,.62,incident)`
  (marine `.66 + .34·…`), i.e. shadow ≈ 62–66 % of lit with a short smooth terminator and no third highlight step.
  **Direct/indirect specular on actors × .08** (no clipped highlights). Architecture/floors keep their response.
- Marine quantizer: rig panels (chroma > .16) → pure rig hue × .74; plates → (.74,.78,.82); everything else →
  dark slate (.13,.14,.16) instead of near-black, so plate gaps stop reading as black panels.
- `vfx/ActorSurface.ts` marine: one even self-light (× .30 of albedo) instead of plate/panel-thresholded islands;
  **room-light neutralisation now removes only the light's hue, not the albedo's** (the HERO14 version desaturated
  the whole lit diffuse, which is why rig colours read tan); rig panels take .72 direct light so lit tops stay
  saturated. Creatures: the white dorsal "crest" emission is gone, shell lift dimmed to a cool .022–.038.
- `ActorIdentity.ts`: Brute lantern `0xfff0a8` (near-white, the "headlamp") → ochre `0xc8962a`.
- Ink: unchanged from HERO14 (marine interior region ink .22, outer contour kept).
- No new programs at combat time: same material count and warmup path; shader source changed inside the existing
  keys (`graphic-surface-v2` kept so StaticRoomBatching semantics are unchanged; actor keys bumped to
  `actor-surface-v10-shade15:marine` / `v11-shade15:alien`, which MaterialWarmup picks up through the same
  materials).

## Marine assets (k12-hero)
Every rig now carries the title's big pauldron (left; Pyro right) at 1.4× plus a 1.15× second pauldron, solid rig
colour with a "07" stencil baked into the atlas (no hazard stripes); crown stripes widened to ±10–30°. Max drawn
24,994 triangles. Rebuild:
```
blender -b -t 4 -P tools/assets/k12-hero/marine.py -- --bake --hero
# marine-only meshopt + KTX2/plain + LOD (see HERO14-HANDOFF for the exact sed/one-off commands), then
git checkout -- <non-marine public/assets/models files rewritten by pack.mjs>
npm run build && node scripts/nextgen/studio.mjs --only=portrait-
```
Portraits: `scripts/nextgen/studio-plan.mjs` — per-rig three-quarter facing and ability stance
(Breacher `ram`, Cryo `cryo-nova`, Pyro `flashfire`, Arc `overload`), `span 2.75`, override aims with `PB/PC/PP/PA`.
They render through the live game shading, so the death card / pause / rig select match gameplay.

## Rig coverage (calm frames, `tools/assets/k12-hero/shade15_coverage.py`)
Rig-hue pixels / figure pixels inside `marineBounds`: Breacher 5.6–6.3 % (before 3.2–3.9), Pyro 5.2–6.8 % (4.0–5.9),
Arc 3.5–4.0 % (2.1–2.7), Cryo ~20–23 % (inflated: the teal floor falls in its hue window). **Below the 15 % target.**
The fixture camera sees him mostly side-on; colour is now saturated and readable at 480×270 but small in area.
Raising it further needs either rig-coloured upper-arm/thigh plates (per-rig copies; the game LOD is at
24,994/25,000 triangles, so a budget decision) or a rig-mask channel letting the runtime tint chosen ceramic
plates per rig.

## Still weak
- Coverage above; the pack is the main rig read from above, pauldrons from the side.
- Plates/undersuit still show some two-tone pattern on the legs (geometry gaps between thigh/greave plates).
- Hostile warning wedge: it depth-tests already and draws behind his body; a light rim against bright fills was not
  added (the cool rim from HERO14 is the separation). Check `value14-overlap-*` before/after.
- Rig-select figure is full-body but occupies ~60 % of the frame height in the UI box; Cryo's tanks are partly hidden.
- Creatures: crowds read as dark masses; pale bone limbs and lanterns are the light planes. **Brute scale:** at the
  same values the Brute is only slightly larger than a Spitter in crowds; scaling it up ~15–20 % would help the
  silhouette but needs the collider change you mentioned.
- The isolated motion-strip tool renders without the room ink/lighting, so its frames read paler than play.
