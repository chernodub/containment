# TITLE15 — At the breach

The Breacher keeps the KA12 rifle grip, shoulder stencil and framing. The rebuilt HERO14 close-up adds its crown stripes. The title materials compensate for the warm key on the white ceramic, yellow paint and grey receiver. The dark fabric and cyan visor use the close-up shaders.

The Warden, Crawler and Stalker come from the current PNG-textured GLBs. Their authored bone zones catch a grazing bounce linked to the three creatures. The Crawler and Stalker carry hot-pink and violet emission through their own lantern maps. The Warden's crown reads in silhouette. Its broken outer horn is hard to distinguish at menu-thumbnail size.

## Review

The unchanged KA12 preview reproduced the camera, hero pose and torn hull. The current hero source brought in cooler ceramic, crown stripes and the updated rifle, while both the close-up amber palette and the title's shoulder override still supplied orange. Blender rendered the KTX2 creature textures as missing-texture magenta.

In the first study the Crawler crowded the breach and the ram face disappeared. Reducing the airborne creatures and adding a linked bounce opened space around the crown. In the second study the camera still saw the undersides of the lantern carriers. Banking both across the hull exposed their dorsal lanterns, while turning the Warden separated the horn tips. On the full-size plate the Crawler retained brown-orange shell paint. Desaturating its atlas independently of the lantern removed that colour. The existing dark plate seams and breach contrast carry the edges without an added ink pass.

## Re-render

From the repository root, using Blender 5.3 and a Python environment with Pillow installed:

```sh
blender -b -P tools/assets/k12-hero/marine.py -- --hero
blender -b -P tools/assets/u10-keyart/title.py -- --round=156 --actor-plates
python tools/assets/u10-keyart/title15_delivery.py artifacts/nextgen/ka12-title-review/round-156
npm run build
npm run capture -- --label=title15 --scenarios=title
```

The delivery step encodes the hero and midground at their existing widths and rebuilds the stills over the shipped background, foreground and fog. The ending depicts an empty nave.

## Delivery review

The real title capture passed at 1920×1080. At 480×270 the yellow shoulder, cyan visor and rifle remain distinct, and the horn crown still reads against the light. Across title, rig selection and Crew Checkpoint, the helmet, dark joints and white plates read as the same Breacher. The title gives the shoulder more prominence and its white plates pick up more warmth from the key.

The before/after pairs, three-screen comparison and iteration sheet are in `artifacts/nextgen/title15/`. On the iteration sheet the unchanged-script preview is upper left, followed in reading order by studies 151–153. Total title image delivery is 675,950 bytes, down from 766,944. The two new 1280-wide PNG fallbacks are 31,790 and 32,980 bytes. The final production build passed.
