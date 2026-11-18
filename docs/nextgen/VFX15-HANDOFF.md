# VFX15 handoff — distinct Overdrive climaxes, Napalm, effect priority

Branch `t3/3fffdd93` (nextgen merged at 24c1d219). Review log: `docs/nextgen/plans/VFX15-review.md`.
Sheets in `artifacts/nextgen/vfx15-final/` (also in the project artifacts folder): `overdrives-before-after-480.png`,
`napalm-before-after.png`, `full-builds-before-after.png` (top = final7, bottom = VFX15), `climaxes-480-canvas-only.png`.

## Done
1. **Overdrives** — the shared ring template is gone (OverdrivePayoff rings, cryo pulse Shock/Aura, arc rings/front/
   timeField Aura, meltdown impact ring). `OverdrivePayoff.ts` now plays four different climaxes; floor states use the new
   FlagshipFx `Climax` mode (cell noise; one program, three element branches) with a thin exact element boundary line:
   - Whiteout: flash + shard burst; jagged frost wall racing out in uneven tongues; ice plates; freeze pulses travel the
     crack network; ice clusters climb enemies as the front reaches them; shard shatter at the end.
   - Meltdown: heat column (Pillar), molten cracks and glowing blisters spreading irregularly, standing flame on enemies
     within the native radius, kill-burst = small fireball (pyro `burst`), heat shimmer.
   - Overclock: chromatic snap (split white/cyan/violet lights, exposure, inward space kick), flickering glass-fracture
     field with chromatic offset, lightning re-struck ~9/s between nearby enemies and along nearby machinery edges,
     reverse snap with collapsing bolts at the end.
   - Railbreaker: activation = converging sparks + narrow amber column; lance and wake unchanged.
2. **Napalm** — new `Tongues` mode: eight camera-facing procedural flame tongues in one mesh (forked tips, lean,
   flicker, temperature by height); Fuel pool turned into a soft irregular soot underlay with sparse pockets and an
   orange-amber boiling edge at the exact radius (never the hostile red); landing fireball; thin landing outline in flight.
3. **Priority** — FlagshipFx `fxYield` budget: sustained surfaces share a 110 m² (Low 70 m²) area budget and thin out
   together (floor .45); impact beats and the first .9 s of a climax are exempt. Actor/warning holes come from the
   existing priority mask (bound to every FlagshipFx material). Shock fronts are broken arcs, not circles.
4. **Not done (Frost Trail, Ram)** — approach: Frost Trail → reuse the Whiteout branch of `Climax` on a strip (copy
   FrostStrip's capsule geometry, add the jagged-front and plate code along the strip axis, ice clusters on enemies
   inside the strip). Ram → `Pressure` fan + `Crack` mode in amber at the arrival point, dust motes along the shove
   direction, contact flares per `targetIds` like Railbreaker.

Pool size is now 32 slots (hidden meshes cost nothing; one program). Modes 14 (`Climax`) and 15 (`Tongues`) are uniforms
of the same program, so warm-up is unchanged; the V2 timeline captures (which throw on any mid-combat compile) passed.

## Verify
`npm run build`; `npm run capture -- --label=x --canvas-only --scenarios=v2-whiteout-crew-checkpoint,v2-meltdown-crew-checkpoint,v2-overclock-crew-checkpoint,v2-napalm-charge-relay-racks,v2-full-cryo-armory,v2-full-pyro-armory,v2-full-arc-armory --burst=7`.
Look at frames 03/05/06/07 at 480×270; check Low (`v2-kit-<rig>-low-armory`) keeps the shapes; check reduced motion
and flash settings (time freezes, intensity scales with `flashIntensity`). Not run: playtest bot, bench, Coolant Plant.

## Still weak
- Whiteout's +30 ms frame is mostly a flash; its frost film lifts dark floors (Relay Racks) noticeably.
- Overclock's fracture cells can read as a hex grid; hostile "dragged motion" was not added (existing echoes only).
- Meltdown heat column is whitish ribs; in Relay Racks the molten disc shows a flat rectangular patch over a lit floor
  plate (likely depth/overlap with that prop surface) — check.
- Napalm tongues are small from the steep camera and evenly spaced.
- Cryo full build at +150 ms is still the busiest frame (Nova arcs + Whiteout front + blizzard streaks).
