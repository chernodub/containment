# TITLE18 — Creatures at the breach

The Warden’s crown cuts clearly across the breach, but its face and broad shoulder plates merge into charcoal at 480×270. The Crawler and Stalker have almost the same grey shell, with a pink bar on the Crawler and a smaller lavender bar on the Stalker.

## First pass — paint and lighting

The shipped title uses the Cycles materials in `title.py`. Its creature shader reduced atlas saturation to 0.06 and replaced the mapped lantern hues. The new material keeps the PNG-textured GLBs’ painted albedo, softens the white specular reflection and adds a little of the albedo to emission so turned-away plates retain colour. The Crawler, Stalker and Warden keep their TITLE15 transforms and the original linked bounce light. The first delivery (round 180) made the Crawler slit orange and gave the Stalker a lavender slit too close to its body colour. Round 181 adjusts channel gains on the lantern textures alone.

## First-pass re-render (commit 9756cfbb)

From the repository root with Blender 5.3 and a Python environment containing Pillow:

```sh
npm ci --offline
npm run build
npm run capture -- --label=title18-before --scenarios=title
blender -b --python-exit-code 1 -P tools/assets/k12-hero/marine.py -- --hero
blender -b --python-exit-code 1 -P tools/assets/u10-keyart/title.py -- --round=181 --actor-plates
python tools/assets/u10-keyart/title15_delivery.py artifacts/nextgen/ka12-title-review/round-181 --keep-hero
npm run build
npm run capture -- --label=title18-after --scenarios=title
```

The before capture used the TITLE15 images before running the delivery script. Capture files are `artifacts/nextgen/title18-before/title.png` and `artifacts/nextgen/title18-after/title.png`. The latter directory also contains colour and greyscale pairs at 1920×1080 and 480×270 per panel, before on the left. The ending capture is `artifacts/nextgen/title18-review/u4-ending-reduced-motion.png`; the empty nave is visible and its three source images match the baseline byte for byte.

## First-pass review

The native pair exposed a duplicate 07 on the rebuilt marine’s shoulder. The delivery option `--keep-hero` uses the shipped hero plate for compositing and preserves all three original hero files. In colour the Crawler’s red slit sits inside a tan cap, the Stalker has a violet slit over mauve and cool grey, and the Warden’s ochre crown separates from its dark muzzle. In the 480×270 greyscale pair the marine’s visor and shoulder still carry the broadest bright shapes. The Crawler slit loses contrast in greyscale, and the Stalker’s scythes overlap its small silhouette.

All title image variants together went from 675,950 to 668,021 bytes (−1.17%). The midground PNG fallback is 33,543 bytes and the static JPEG fallback is 75,250 bytes. The final production build and desktop title capture passed.

## Shadow and focus revision

Round 182 removed the atlas-coloured front fill, moved the linked light behind the creatures and gave their shadow planes a cool floor. This pushed all three too far into silhouette. Round 183 recovered the painted planes with a soft transition based on the surface normal facing the breach. The final adjustment widened that transition on the airborne creatures, especially the Stalker, whose scythes face away from the light. The Warden gets a narrow segmented amber organ along the forehead seam below its crown. The original boss atlas has only a few non-black emission texels. The Crawler turns about its body centre to show its hooked legs in profile. Its red slit and the Stalker’s violet slit use their authored emissive maps.

The source and larger delivered midground are 2560×1440. The smaller WebP and transparent PNG fallback are 1280×720. CSS translates the plane for parallax with no blur filter. The old f/6 camera focused on the marine several metres in front of the breach. The midground insert now focuses at the creatures at f/11. The delivered marine is the original hero plate.

### Rebuild the revised plate

From the repository root, in a Python environment with Pillow:

```sh
blender -b --python-exit-code 1 -P tools/assets/k12-hero/marine.py -- --hero
blender -b --python-exit-code 1 -P tools/assets/u10-keyart/title.py -- --round=185 --midground-only
python tools/assets/u10-keyart/title15_delivery.py artifacts/nextgen/ka12-title-review/round-185 --keep-hero
npm run build
npm run capture -- --label=title18-after2 --scenarios=title
```

The final desktop capture is `artifacts/nextgen/title18-after2/title.png`. Beside it, `three-1920.png`, `three-1920-grey.png`, `three-480.png` and `three-480-grey.png` show the shipped plate on the left, the rejected first pass in the centre and the revision on the right. Each panel is at the size in the filename.

Measured on the delivered midground resized to 960×540, using opaque pixels in a polygon around each creature and 8-bit greyscale below 45 as the shadow cutoff:

| Creature | First-pass mean grey | Revised mean grey | Area in deep shadow |
|---|---:|---:|---:|
| Warden | 50 | 33 | 75% |
| Crawler | 89 | 38 | 67% |
| Stalker | 84 | 47 | 61% |

The revision is more threatening to my eye than the shipped plate. At 480×270 the Crawler’s hooks project beyond its dark belly, while the Warden reads first as a crown over a heavy muzzle. The marine’s yellow shoulder and cyan visor still dominate. The Crawler ended darker than the approximate exposure target. In greyscale the Warden’s lantern competes with a glint on the ridge beside it, and the Stalker’s lower scythe partly disappears against the hull. The production build and title capture passed. Total title payload is 663,831 bytes, down 1.79% from the shipped 675,950 bytes.
