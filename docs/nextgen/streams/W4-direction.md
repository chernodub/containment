# Wave 4 — "one art standard, one visual priority" (lead's direction after R6)

Read `docs/nextgen/reviews/R6-verdict.md`. More bloom, particles or UI decoration will not move the game up a tier.
Two decisions by the lead:

## Decision 1 — Unify the art standard by stylizing, not by chasing realism
We cannot author film-quality props procedurally, and realistic actors beside simple props read as unfinished.
We commit to a **graphic, inked sci-fi look** that makes simple forms intentional and pulls actors and scenery together:
- **Ink pass**: screen-space contours from object-id + depth + normal discontinuities. Actors (marine, enemies, boss) get a
  clean dark silhouette contour (≈2 px at 1080p, slightly thicker for the marine/elites, colored cyan-white for the marine when occluded);
  props/architecture get thinner crease/silhouette lines (≈1 px) that read as panel lines. Lines fade with depth haze, never on
  particles/telegraphs/HUD. Overlapping enemies therefore always separate from each other (fixes AD-01 at the root).
- **Shading**: keep HDR lighting, pools and shadows, but simplify surface response into broad, deliberate value steps:
  soft 3–4 band diffuse ramp (not hard toon), reduced micro-normal noise, flat-ish albedo with authored gradients;
  actors' photographic albedo detail is reduced (texture detail attenuated/quantized, speculars tamed) so they match the props.
- **Forms**: every dominant prop gets consistent bevels/chamfers, a readable primary/secondary/tertiary shape breakup, and
  edge highlights that the ink pass and lighting can describe. Fewer, larger, cleaner shapes beat noisy detail.
- It ships as the default High look; Low keeps silhouette contours only (cheap) and skips crease lines.
- It must be judged A/B on real captures before being rolled out everywhere (see the G3 brief).

## Decision 2 — A strict visual priority in combat (highest first)
1. Incoming danger: hostile telegraphs and enemy projectiles — saturated red-orange, thick edge, hatched/pulsing interior with
   timing fill, dark underlay so they punch through anything; nothing friendly may reduce their contrast.
2. The marine and the cursor.
3. Enemies (contoured, family-distinct, visual footprint matching their collision radius; no stacked bodies).
4. Friendly ability effects — spectacular at the moment of impact, then they yield: sustained friendly effects are edge-weighted,
   low-coverage, and locally fade wherever a hostile telegraph, the marine or an enemy silhouette needs to read.
5. World.
6. HUD chrome stays out of the play area; explanatory UI never appears over combat uninvited.

Every wave-4 stream is judged against these two decisions at full size and at 480×270.
