# LIGHT13 — value hierarchy and lighting standard (handoff)

**Rule: the ship is dark; actors carry the light.** Priority by value: marine (+ his lamp pool) → hostile warnings/projectiles/lanterns/ability effects → creature silhouettes → room. Converted: Crew Checkpoint, Coolant Plant, Relay Racks. Evidence: `artifacts/nextgen/light13-final/contact-<room>.jpg` (rows: before colour, before grey, after colour, after grey; columns calm, tour 2, tour 4, heavy 02) and `contact-low.jpg` (Low calm ×3 + Cryo in Relay). Round notes: `docs/nextgen/plans/LIGHT13-review.md`.

## Target luminance bands (final frame sRGB, Rec.709 luma 0–255)
| Element | Target | Measured in the three rooms |
|---|---|---|
| Perimeter / corners / rack backs | 0–20 | 0–15 |
| Floor, outside pools | 20–45 | 12–45 |
| Floor, brightest pool (fight circle, lanes) | 60–95; always ≥100 below marine plates | 47–90 |
| Rig-lamp pool beside the marine | 110–135 | ~125 |
| Walls / props in light | 30–80, desaturated | — |
| Creature body | 45–80 (≈20–30%), cool rim on the silhouette edge | 45–80 |
| Lantern core | 200+ saturated family hue; elite/wind-up hotter | ~230 |
| Hostile warning fill / outline | fill ~110–130 saturated orange; outline brighter | ~115 fill |
| Marine light plates | 200–230 (p98 of his box) | 210–214 |
| Neutral fixtures (white strips/panels) | ≤ marine plates; never a blown white | capped |

## The system (all uniforms on existing materials)
- `src/render/lighting/RoomValueStandard.ts` — **the per-room data** (`ROOM_VALUE_PROFILES`) plus shared uniforms: four-pool value field + exit pool, and the marine rig-lamp position.
- `LocalLightShading.ts` (`setRoomValue`, cache key `local-light-rejection-v9-light13`) — after lighting, every room surface is desaturated, tinted, scaled, multiplied by the pool field (pool 0 = fight circle, 1–3 = named-space fixtures from `deckLightSources`, + exit) and receives the analytic rig-lamp glow. Neutral defaults are an exact no-op, so unconverted rooms are unchanged.
- `applyRoomMood.ts` — assigns floor vs wall values per material, dims neutral emitters (chroma < .45 → × `fixtures`, ceiling .7) and caps saturated emitters at 1.5 so they keep their hue; it recovers the base from its own last write. Skipped in `buildAhead` (`valueStandard=false`) so preparing the next room never re-grades the current one.
- `E10DeckSurfaces.ts` — the baked e9/e10 deck uses `floor.lit/unlit/edge` against the existing 256² bake (pool R, enclosure G); `DeckLightBake` takes `exit` gain.
- `SceneLighting.ts` — profile scales practical point lights (`practicals`) and hemisphere + fill (`ambient`); feeds the lamp glow every frame. `DepthRenderer` sets the field on room load.
- Actors (`vfx/ActorSurface.ts`, key `actor-surface-v6-light13`): creature albedo × .42, lantern emission × 1.8 (elite 2.3) with +35% saturation, rim pulled 60% toward cool blue. Marine: albedo-proportional self-light on light plates, rig accent (`RIG_ACCENTS`, set via `setRig`) on top-facing light surfaces, emissive (visor) × 2.6. Weapons: dark materials lifted 55% toward `0x5d666f` once (`models.ts`).

## Converting another room (fill one entry in `ROOM_VALUE_PROFILES`)
```
'room-id': profile({
  floor:{lit, unlit, edge},              // deck albedo × in pools / outside / at hull. Start .34–.45 / .18–.20 / .09–.10; dark rooms .7/.3/.14
  perimeter:{inner, outer, value, lane?}, // metres from pool centres; value = darkness outside pools (.22–.45); lane = secondary pool radius scale (.55; .7 for long lanes)
  wall:{value, saturation},              // .42–.62 / .55–.60
  floorSaturation,                       // .42–.55
  tint,                                  // room identity hue, pale (e.g. 0xd8e2f0 cold, 0xc4ddd6 teal)
  fixtures,                              // .2–.25
  practicals, ambient,                   // .4–.75 / .45–.6 (lower for pale rooms)
  marineGlow:1, exit:.9,
}),
```
Procedure: capture `combat-calm:<id>,room-tour:<id>,combat-heavy:<id>,g2-calm-low:<id>`; reduce to 480×270 + greyscale; check the squint order and the bands above; the brightest floor must stay ≥100 below the marine plates. Pale rooms (Crew-like) need the lowest `floor.lit`; already-dark rooms need higher `perimeter.value`/`lane` so tours do not go black.

## Cost (High must not rise)
No passes, lights, shadow maps, draws or textures added; pooled light count unchanged. Per-fragment adds on room materials: ~16 ALU for grade + 4 pool distances + exit + lamp (one branch on a uniform); creatures/marine a few ALU. One program-key bump each for room local-light, deck and actor finishes — same number of programs, compiled by the existing warm-up because they are the same materials (`StaticRoomBatching` key updated to match). No benchmark was run (per brief); the changes that could affect cost are the per-fragment field/grade on every room surface.

## Pitfalls
- Shared/session room finishes: values are per material object. Always set values on room load (`applyRoomMood`), never in preparation; unprofiled rooms reset to neutral.
- The field is world-space and arena/space-centred; rooms without `SHIP_ARCHITECTURE_PLANS` fall back to one pool at room centre — give them explicit pools before converting.
- Emitters animated per frame (growth veins) overwrite the fixture scale; the base is re-read from the live value.
- Fixture detection is chroma-based: a saturated fixture that should be dimmed needs an explicit material flag, not a lower threshold (red/green warning and route emitters must keep their hue).
- Do not lift the room again with grade/exposure — that undoes the hierarchy for every actor too.

## What remains weak
- Crew Checkpoint is better but still the palest: its floor centre is a mid-grey slab (p50 75); it needs real ceiling-fixture pools (more `deckLightSources` spaces or authored pool shapes), not a lower global value.
- Creature bodies sit at the top of the 20–30% band and carry a soft pale halo (existing ink/contact treatment), so in greyscale crowds on lit floor they merge more than they should.
- Marine rig colour on crown/pauldrons reads at full size but weakly at 480×270; plates carry the hierarchy, not hue.
- Hard light wedges from practical apertures are dimmed (practicals scale), not reshaped.
- The orange telegraph fill can cover the marine (Coolant heavy 02): warning beats marine there, as W4 priority intends, but his silhouette relies on the ink outline.
- Seventeen rooms unconverted; Low uses the same uniforms (verified on the three rooms only).
