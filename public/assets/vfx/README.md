# Containment effect textures

The V6 ability library is one 2048×2048 mipmapped RGBA atlas:
[manifest](containment-v6/atlas.json), [credits](containment-v6/CREDITS.md).
It ships 2,759,007 PNG bytes. GPU storage is about 21.3 MiB including the full
mip chain. All eight ability batches share one texture object. Low reduces
instances and projected alpha-card coverage; it shares the same atlas.

- Unity Labs Paris / Thomas Iche: Flame02 (64 frames), WispySmoke02 (64),
  Explosion01 (25), explicitly CC0. [Source hashes/license](unity-labs-v6/CREDITS.md).
- Kenney Particle Pack 1.1: spark_01, star_04, smoke_01, circle_05, explicitly
  CC0. [Source hashes/license](kenney-particle-v6/CREDITS.md).
- Original offline-generated bolt/mist frames, snow grain fields, frost,
  crystal facets, caustics, hex/scan patterns, glows and decals: repository MIT.

Tile addresses, padding, frame rates and SHA-256 are in the manifest. Atlas
pixels store straight RGBA; smoke/ice shaders premultiply their final output.
Fire/smoke interpolate neighboring frames. Alpha silhouettes stay continuous;
radiance is slightly banded to match the inked world. Atlas requests begin with
the first non-menu game frame. Strict first-room readiness can await the public
`AbilityVisuals.prepare()` hook before material warmup.

Regeneration: `tools/assets/vfx/build_atlas.py`, run from the repository root in
an isolated Pillow/NumPy environment. The only downloaded source archive lives
under ignored `tools/assets-src/`; never ship or execute its contents. Source
archive provenance, hashes and the data-only extraction procedure are retained.

The original PNGs in this folder remain unchanged for the existing weapon,
explosion and status systems. Their bytes are separate from the new atlas's
2.76 MB budget; their original notices remain in CREDITS.md and Explosion01-LICENSE.md.
