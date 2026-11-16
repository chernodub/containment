# KA12 — At the breach

Original rendered title / ending artwork, repository MIT. K12 close-up Crown–keel marine with KA12 rifle, read-only E9 ship kit and K11 Lantern Brood. Marine/creature skeleton and motion attribution remains in `/asset-credits.html`. No source marine or creature asset is modified by this pipeline.

Blender 5.3 and Pillow are required. Rebuild the missing local close-up source first if necessary:

```sh
blender -b -t 4 -P tools/assets/k12-hero/marine.py -- --hero
blender -b -t 4 -P tools/assets/u10-keyart/stage.py -- --round=16 --layers
blender -b -t 4 -P tools/assets/u10-keyart/stage.py -- --round=19 --ending
python tools/assets/u10-keyart/optimize.py --ui-only --raw=artifacts/nextgen/u10-rounds/16 --ending=artifacts/nextgen/u10-rounds/ending-19/composition.png
```

Final Cycles renders use 128 samples and denoising. Five aligned 2560×1440 RGBA plates (`background`, `midground`, `hero`, `foreground`, `fog`) retain the existing delivery sizes and filenames. WebP images have JPEG composite and transparent PNG fallbacks. Fog is delivered at 640/1280 with 12px source blur; foreground brightness is 85%. The immediate title composite is assembled from delivery plates.

The ending set remains an abandoned nave; the existing screen overlays the new K12 chosen-rig portrait as a terminated suit archive. It does not imply survival. Title motion, reduced motion, image ownership and nonblocking Start behavior are unchanged.

Review evidence: `artifacts/nextgen/ka12-final/index.html`; written critiques: `docs/nextgen/plans/KA12-review.md`.
