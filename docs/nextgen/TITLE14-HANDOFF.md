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
