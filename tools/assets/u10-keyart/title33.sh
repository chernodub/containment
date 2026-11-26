#!/bin/sh
# Run at the repository root with Blender and Pillow on PATH.
set -eu
export PYTHONDONTWRITEBYTECODE=1
raw=artifacts/nextgen/title33-studio
npm run build
node scripts/nextgen/studio.mjs '--only=^portrait-'
blender -b -t 6 --python-exit-code 1 -P tools/assets/k12-hero/selection24.py -- --title --out "$raw"
blender -b -t 6 --python-exit-code 1 -P tools/assets/u10-keyart/title33_cast.py -- "$raw"
python3 tools/assets/u10-keyart/title33_composite.py "$raw"
if [ ! -f artifacts/nextgen/k12-work/hero/marine-hero.glb ]; then
    blender -b -t 6 --python-exit-code 1 -P tools/assets/k12-hero/marine.py -- --hero
fi
blender -b -t 6 --python-exit-code 1 -P tools/assets/u10-keyart/title.py -- --round=330 --title33-scenery
python3 tools/assets/u10-keyart/title15_delivery.py "$raw" --background=artifacts/nextgen/ka12-title-review/round-330/background.png --scenery
