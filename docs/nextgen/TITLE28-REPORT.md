# TITLE28

Baseline desktop captures at 1920×1080 are in `artifacts/nextgen/title28-before/`. The same seed and six scenarios are used for the final comparisons.

## Re-render after a creature change

From the repository root, with npm dependencies, Playwright Chromium and Python 3 with Pillow installed, run:

```sh
tools/assets/u10-keyart/title28.sh
```

The full follow-up rebuild took 106 seconds on the M1 Pro. The command uses the production actor pool for the title and every card containing an enemy or brood pod. It writes composition A to the shipped UI directory and B’s replacement plates to `artifacts/nextgen/title28-studio/alternate/u10/`. Run `npm run build` afterward to package the images. Title and settings still load static artwork.

The Warden route uses the same Coolant Plant gallery as the Matron. The larger profile exposes the near shoulder plate. A blue-white plasma core and a pool of light meet on that plate. The rear leg still overlaps the torso at card size.

Five original ink illustrations replace the armor, ammo, grenade, reroll and upgrade goods. The marked medical vial and case already read at card size. The disabled shop treatment suppresses the new colours. The Stalker lesson on the death screen uses the updated creature. The selector and ending captures match baseline pixel for pixel.

The production build and all six desktop captures completed. In `artifacts/nextgen/title28-sheets/`, each screen has a `-1920.png` and a `-480.png` pair, baseline on the left.

## Backlit title studies

I would ship A. At 480×270 I read the title first, the amber maw second, then the swept crest and forward limb against the opening. A leaves daylight between the Crawler and crest. In B the larger, lower Warden pushes the maw towards the bottom edge and the Crawler meets the crest. A twelve-heading study of each current heavy favoured the Warden for its projecting crest and illuminated maw. Both compositions use the studio alpha for the rim and discard the shell colours.

The four-way sheets in `artifacts/nextgen/title28-followup-sheets/` read baseline, first TITLE28, A, B. The route and shop pairs in that directory compare first TITLE28 with the follow-up. All have native and 480×270 versions.
