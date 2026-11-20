# TITLE18 — Creatures at the breach

The Warden’s crown cuts clearly across the breach, but its face and broad shoulder plates merge into charcoal at 480×270. The Crawler and Stalker have almost the same grey shell, with a pink bar on the Crawler and a smaller lavender bar on the Stalker.

## Paint and lighting

The shipped title uses the Cycles materials in `title.py`. Its creature shader reduced atlas saturation to 0.06 and replaced the mapped lantern hues. The new material keeps the PNG-textured GLBs’ painted albedo, softens the white specular reflection and adds a little of the albedo to emission so turned-away plates retain colour. The Crawler, Stalker and Warden keep their TITLE15 transforms and the original linked bounce light. The first delivery (round 180) made the Crawler slit orange and gave the Stalker a lavender slit too close to its body colour. Round 181 adjusts channel gains on the lantern textures alone.

## Re-render

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

## Final review

The native pair exposed a duplicate 07 on the rebuilt marine’s shoulder. The delivery option `--keep-hero` uses the shipped hero plate for compositing and preserves all three original hero files. In colour the Crawler’s red slit sits inside a tan cap, the Stalker has a violet slit over mauve and cool grey, and the Warden’s ochre crown separates from its dark muzzle. In the 480×270 greyscale pair the marine’s visor and shoulder still carry the broadest bright shapes. The Crawler slit loses contrast in greyscale, and the Stalker’s scythes overlap its small silhouette.

All title image variants together went from 675,950 to 668,021 bytes (−1.17%). The midground PNG fallback is 33,543 bytes and the static JPEG fallback is 75,250 bytes. The final production build and desktop title capture passed.
