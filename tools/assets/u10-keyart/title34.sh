#!/bin/sh
# Run from the repository root. A clean checkout rebuilds the unchanged masters.
set -eu
export PYTHONDONTWRITEBYTECODE=1
raw=artifacts/nextgen/title33-studio
hull=artifacts/nextgen/ka12-title-review/round-330
if [ ! -f "$raw/breacher.png" ] || [ ! -f "$hull/background.png" ] || [ ! -f "$hull/fog.png" ]; then
    exec sh tools/assets/u10-keyart/title33.sh
fi
blender -b -t 6 --python-exit-code 1 -P tools/assets/u10-keyart/title33_cast.py -- "$raw"
python3 tools/assets/u10-keyart/title33_composite.py "$raw"
python3 tools/assets/u10-keyart/title15_delivery.py "$raw" --background="$hull/background.png" --scenery
