# TITLE14 handoff — title key art in the game's toon language

## Status after review round 2 (TITLE14b): not shipped — the previous KA12 title is restored

The lead's review found v1 consistent but less dramatic than the art it replaced. One bounded round (two
iterations) on a v2 composition did **not** produce a clearly better image, so `public/assets/ui/u10/` is restored
to the pre-TITLE14 KA12 title (commit `c5ef5497`) and every version stays selectable:

| Version | Script | State |
| --- | --- | --- |
| KA12 Cycles title (shipping) | `tools/assets/u10-keyart/title.py` + `optimize.py` (Pillow) | restored in `public/assets/ui/u10/` |
| TITLE14 v1 toon | `tools/assets/u10-keyart/title14_v1.py` (writes `public/` on a final run) | rejected: stiff back view, hidden rifle, flat breach |
| TITLE14 v2 toon (WIP) | `tools/assets/u10-keyart/title14.py` (`--preview`, `--frame`) | unfinished; final run would write `public/` |

Evidence: `artifacts/nextgen/title14-final/` — `before-1920.png` (KA12), `after-1920.png` (v1),
`v2-iteration2-failed.png`, `shipped-restored-1920.png` (real title screen after the restore), `before-after-480.png`.

### What v2 adds (reusable)
Breach as the light source (bulkhead with a jagged boolean opening, spherical white-violet gradient plane, haze
volume, high-power backlight casting his shadow toward camera), black hull shards and hanging cables, wet glossy
deck (EEVEE raytraced reflections), creatures as near-black toon silhouettes with a pale Layer-Weight rim and
lantern tint masked by their emission maps (crawlers hot pink), camera framing solved numerically (marine chest
at 76 % x, cropped mid-thigh), five real parallax plates via holdouts, posterised ≤150 KB PNG fallbacks.

### Why it is not done (honest)
- Geometry conflict in the brief: with the marine on the right third and the breach in the centre, the camera
  must sit behind his **left** shoulder; from there a right-handed rifle is occluded by his body. Iteration 1
  (behind-left) showed a large, crisp marine and a strong backlit Warden silhouette but no rifle; crawlers blew out
  (fixed: lantern tint now masked). Iteration 2 pushed the breach sideways for a more side-on camera and twisted
  the marine 22° toward it — the corridor walls are built relative to the breach offset, so the camera ended up
  facing a side wall, and the twist turned his back fully to camera.
- Next step (one iteration): build the corridor around the camera/marine instead of the breach offset
  (`side * (BS ± 5.6)` → fixed walls), drop `--twist`, use `--cb≈1.6 --cs≈3.2`, and pose the rifle higher
  (raise `ribs`/`upper_arm.R` so the barrel clears the left pauldron), or accept a front-left three-quarter as in
  the KA12 art, which is the only angle where marine-right, threat-centre and a visible rifle coexist.

---

# TITLE14 handoff — title key art in the game's toon language

Before/after: `artifacts/nextgen/title14-final/{before,after}-1920.png` (real title screen captures) and
`before-after-480.png` (exact 480×270 area reductions, before on top). Raw render:
`artifacts/nextgen/title14-work/title14-2560.png`.

## What changed
- New reproducible generator `tools/assets/u10-keyart/title14.py` (Blender 5.3, EEVEE, ~1 min):
  - HERO14 Breacher marine from the k12-hero close-up source, re-shaded in the gameplay palette (cool-white
    plates, near-black undersuit, yellow-amber rig panels and crown stripes, cyan visor/keel light, grey KA12
    rifle from `plain/`), three-quarter from behind-left, weapon raised, on the right third.
  - BOSS14 Brute Warden (`plain/tyrant.glb`, `k11-brute-boss` mesh, attack pose) centred, rim-lit by a violet
    breach; a crawler with its orange lantern and pale blades at his feet; a stalker behind (all read-only).
  - Banded shading: Diffuse → Shader-to-RGB → three constant bands × base colour (emission output);
    ink: inverted-hull outline on every actor and set piece (marine 1 cm, creatures scaled with height).
  - Dark ship corridor, the marine carries the key light and a floor glow; threats second.
- Delivery (same names/sizes, written by the script): `title-{1280,1920,2560}.webp`, `title-1280.jpg`, and
  `background-*` = the finished frame; `midground/hero/foreground/fog-*` are now transparent plates, so the existing
  layered title code and CSS work unchanged (parallax moves the whole frame as one background plate).
  Weights: title-2560.webp 67 KB (was 87 KB), title-1920 44 KB (61), title-1280.jpg 61 KB (73). The 1280 PNG
  background fallback is ~0.65 MB (was a 45 KB palette PNG; only used without WebP).
- Ending art untouched (it shows an empty nave; its suit-archive inset uses the already updated rig portraits).
- `title.py` (KA12 Cycles title) remains for reference; `title14.py` is the current title.

## Re-render
```
blender -b -t 4 -P tools/assets/u10-keyart/title14.py -- --preview   # 1280x720 review only
blender -b -t 4 -P tools/assets/u10-keyart/title14.py                # 2560x1440 + writes public/assets/ui/u10/
npm run build && npm run capture -- --label=title14 --scenarios=title
```
`--frame` prints where the marine/Warden/muzzle land (no render); `--ws=` (Warden side offset) and `--back=`
(camera distance behind) re-compose. Requires the close-up hero GLB from `marine.py -- --hero`.

## Still weak
- The rifle is mostly hidden behind the marine from this angle; "weapon raised" reads from the posture only.
- The Warden is seen three-quarter, so the six-horn crown reads as pale horns rather than a clear crown; its face
  is not frontal. Creature texture detail makes their banding busier than the clean marine.
- The breach is a flat violet disc; no haze, sparks or debris (the toon look deliberately drops GI/volumetrics).
- The breach disc touches the last letter of the wordmark at 1920×1080 (dimmed by the existing grade).
- Parallax depth is lost (single plate).
