#!/bin/sh
# Run from the repository root with Python 3 and Pillow on PATH.
set -eu
export PYTHONDONTWRITEBYTECODE=1
sh tools/assets/u10-keyart/title33.sh
node scripts/nextgen/studio.mjs --creature-cards

blender -b -t 6 --python-exit-code 1 -P tools/assets/rw12-rewards/ending.py -- --round=title32
python3 tools/assets/u10-keyart/optimize.py --ui-only --ending-only --ending=artifacts/nextgen/rw12/ending/round-title32/composition.png
