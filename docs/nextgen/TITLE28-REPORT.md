# TITLE28

Baseline desktop captures at 1920×1080 are in `artifacts/nextgen/title28-before/`. The same seed and six scenarios are used for the final comparisons.

## Re-render after a creature change

From the repository root, with npm dependencies, Playwright Chromium and Python 3 with Pillow installed, run:

```sh
tools/assets/u10-keyart/title28.sh
```

The full pass took 116 seconds on this M1 Pro. It builds the game, photographs the three title actors through the game renderer, composites them with the shipped marine and hull, and regenerates every studio card whose subjects include an enemy or brood pod. Run `npm run build` afterward to package the new images into dist. Title and settings still load static artwork.

The Warden uses its ram-charge pose. The Crawler’s pink stripe and the marine’s visor survive reduction to 480×270. The “07” shell is now gunmetal. The Warden’s overlapping dark upper plates still merge at small size, and its flat shading is conspicuous next to the marine. Both guardian cards use the Coolant Plant pump gallery, with the principal actor framed to 66% of image height. The Matron’s clutch reads more easily than the thin incoming plasma bolt. Other route variants retain their existing compositions.

Five original ink illustrations replace the armor, ammo, grenade, reroll and upgrade goods. The marked medical vial and case already read at card size. The disabled shop treatment suppresses the new colours. The Stalker lesson on the death screen uses the updated creature. The selector and ending captures match baseline pixel for pixel.

The production build and all six desktop captures completed. In `artifacts/nextgen/title28-sheets/`, each screen has a `-1920.png` and a `-480.png` pair, baseline on the left.
