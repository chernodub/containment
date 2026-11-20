# HERO19 handoff — one marine from title to selector to play

## 1. Before (what failed to carry over)

Evidence: `artifacts/nextgen/hero19/before-identity.png` (columns: title crop, rig select, calm Crew Checkpoint,
Relay Racks crowd, Breacher overlap fight; rows: native colour, 480×270 colour, native grey, 480×270 grey), raw
captures `artifacts/nextgen/h19-before/`, Blender game-camera turnarounds `artifacts/nextgen/k12-work/review-h19a/`.
All five requested scenario ids existed.

1. **Visor (bake + shader):** the lens geometry is there, but the game atlas paints it near-black (`.008`) with emission
   only on a 6 mm strip, and the marine quantizer in `GraphicSurface` then snaps it to the undersuit black, so the title's
   cyan face becomes a black slit; the brow rim is a thin 11 mm panel, so there is no visible depth either (geometry).
2. **Shoulder dome (geometry):** the "big" pauldron is a 1.4× plate conformed 3 cm off a 17 cm shoulder loft, i.e. a cap
   that hugs the arm; from the high camera, with the marine facing right, it hides behind the helmet and the yellow that
   remains merges with the crown stripes, so play shows "a small yellow cap" instead of the title's helmet-sized dome.
3. **Black-and-white patches (shader first, geometry second):** the marine quantizer maps luma < .19 to `(.018,.021,.025)`
   and > .38 to `.77`, so every undersuit gap, graphite pectoral (MARINE17) and rear arm plate becomes a hard black island
   between white strips; the narrow limb plates (thigh/greave/vambrace) expose many such gaps.
4. **Gold headband (geometry/bake):** the rig-painted crown stripes at ±10–30° on the helmet top are what reads as a gold
   band from above; the title has only fine pinstripes there, so in the game LOD they should go.
