# TITLE22 — Breach and first junction

Baseline at 0b97db74, captured in `artifacts/nextgen/title22-before/`. The three black arcs are Blender Bézier tubes named “Severed live cable”, with separate hot tips and sparks on the midground plate. Their upper ends appear unsupported against the opening. The fixed ceiling pipes and buckled support belong to the hull.

At 1920×1080, the old sculpt and its Cycles surface round the Warden’s forehead and shoulder into continuous ochre highlights. The lower body falls into an almost uninterrupted brown shadow, with little internal linework. The Crawler’s smooth tan cap has the same problem. The TITLE18 focus pull sharpened the silhouette but could not supply the newer game mesh’s facial planes or the engine’s ink edges. At the junction the floor stencil and grate have as much contrast as the small targets; the second Brute and oversized pods compete with the guardians.

## Rebuild

Use the models at the baseline commit. From the repository root with Pillow installed:

```sh
npm run studio -- tools/assets/u10-keyart/title22-studio.json --out=artifacts/nextgen/title22-final
python tools/assets/u10-keyart/title22_composite.py artifacts/nextgen/title22-final
python tools/assets/u10-keyart/title15_delivery.py artifacts/nextgen/title22-final --keep-hero
npm run studio -- '--only=^route-(plate-breaker|brood)$'
npm run build
npm run capture -- --label=title22-after --scenarios=title,run15-condition-route
```

The title uses the studio’s pooled game actors, native strike clips, actor materials and full-strength ink pass. Each actor is photographed separately so the attacking bodies can be banked around the old composition anchors. The background, foreground, fog and marine come from the shipped encodes. The black/white matte renders preserve the interior ink while extracting the subjects. A shadow curve brings the actors down to the breach exposure while retaining lantern peaks. The new midground contains only the three actors; the old midground's severed cables, hot tips and sparks drop out together.

The route images remain 1120×476 WebPs, just over twice their 533×227 image area in the captured desktop junction. Both use the isolated dark studio deck. The Warden is alone at the plasma impact. The Matron is the largest silhouette in its card, accompanied by a reduced pair of pods and an incoming rocket.

## Title delivery

| Image set | Shipped bytes | TITLE22 bytes |
|---|---:|---:|
| Midground 2560 WebP | 65,172 | 74,642 |
| Midground 1280 WebP | 38,474 | 32,690 |
| Midground 1280 PNG | 31,264 | 30,661 |
| Static title 2560 / 1920 / 1280 WebP | 91,862 / 66,298 / 42,146 | 98,680 / 71,336 / 43,034 |
| Static title 1280 JPEG | 77,323 | 79,537 |
| All title images, including retained layers | 663,831 | 681,872 |

The increase is 18,041 bytes (2.72%). The Warden was rendered on a 2800-pixel square, the Crawler on 1060 and the Stalker on 1080. Their posed silhouettes filled 2114×2240, 586×847 and 742×864 pixels respectively before banking and downsampling. The final placement widths on the 2560 plate are 940, 297 and 312 pixels. The shipped hero, background, foreground, fog and ending assets retain their original bytes.

## Desktop comparisons

Under `artifacts/nextgen/`, the capture directories are `title22-before` (shipped), `title22-study` (first in-engine proof) and `title22-after` (delivered). Each contains `title.png` and `run15-condition-route.png`. In the final directory the three-up strips append `-three-1920` or `-three-480` to each scene name, plus `-grey` for greyscale. Read panels from left to right in capture order.

The plate-breaker WebP went from 19,996 to 16,706 bytes; brood went from 27,192 to 15,448. In the first proof the plasma line crossed the Warden almost horizontally, and the Matron’s crest met the image edge. The final cards leave space around both crowns, angle the plasma into the front plate, and separate the rocket casing from its exhaust.

At desktop size I read the cast as one confrontation. The Warden’s split crown and the Crawler’s hooked limbs are sharper and more threatening than the shipped rounded silhouettes. The cyan visor and yellow shoulder still carry the broadest bright shapes. A final placement correction moved the Crawler off the last T in the title. The material difference is still visible up close: the marine has a gradual reflection across its shoulder, while the creature plates break into inked facets. At 480×270 the Stalker’s violet lantern holds up better than the small blades around its face.

The final production build passed. Both desktop scenarios completed and produced their 1920×1080 captures and comparison strips.

## TITLE23

At 1920×1080 the pale bars above the breach are cable-tray rungs and overhead pressure lines. Camera-ray picks on the Blender stage identified the bright bent line as the separate ruptured pipe. The marks are baked into the background. The Crawler’s dark upper shell nearly meets the last T, while the Stalker’s left scythe and lower leg disappear against the dark left jamb. Both creatures are already below the letters in the reviewed capture. Low edge contrast and near-tangencies make them look cut off.

Removed the ceiling service runs and ruptured pipe from the Cycles background. The folded aperture and corridor frames now carry the upper silhouette. Re-rendering the hull also cleaned up reflections from those runs inside the opening. The original studio cutouts keep the TITLE22 poses. The Crawler moves 109 pixels right and 39 up on the 2560 plate; the Stalker moves 65 right and 42 up. A narrow cool reflection follows the inside edge of their existing alpha mattes, strongest on the breach-facing rims. At native size the hook, left scythe and trailing leg have distinct edges. At 480×270 the Stalker’s narrowest points still depend on the rim for contrast.

The midground has no depth-of-field or CSS blur. Banking uses bicubic interpolation on supersampled cutouts followed by a Lanczos reduction, as in TITLE22. The fog plate is transparent over the airborne creatures. The visible loss came primarily from the dark ink against the jamb. The marine, Warden placement, typography and menu layout retain their TITLE22 framing.

To rebuild, use the TITLE22 studio cutouts from the original render above. The Blender stage requires the close-up hero source (`blender -b -P tools/assets/k12-hero/marine.py -- --hero` if absent). From the repository root:

```sh
blender -b --python-exit-code 1 -P tools/assets/u10-keyart/title.py -- --round=230 --background-only
mkdir -p artifacts/nextgen/title23
cp artifacts/nextgen/title22-final/{warden,crawler,stalker}.png artifacts/nextgen/title23/
python tools/assets/u10-keyart/title22_composite.py artifacts/nextgen/title23
python tools/assets/u10-keyart/title15_delivery.py artifacts/nextgen/title23 --keep-hero --background=artifacts/nextgen/ka12-title-review/round-230/background.png
npm run build
npm run capture -- --label=title23-after --scenarios=title
```

The build and 1920×1080 desktop capture passed. In `artifacts/nextgen/title23-after/`, `pair-1920.png` and `pair-480.png` compare TITLE22 on the left with TITLE23 on the right. Greyscale copies have the suffix `-grey`. All delivery filenames, dimensions and fallbacks are preserved. Total title image payload fell from 681,872 to 663,404 bytes (−2.71%).
