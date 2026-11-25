#!/bin/sh
# Run from the repository root with Python 3 and Pillow on PATH.
set -eu
raw=artifacts/nextgen/title28-studio
npm run build
node scripts/nextgen/studio.mjs tools/assets/u10-keyart/title22-studio.json --out="$raw"
python3 tools/assets/u10-keyart/title22_composite.py "$raw"
python3 tools/assets/u10-keyart/title15_delivery.py "$raw" --keep-hero
node scripts/nextgen/studio.mjs --creature-cards
