#!/bin/sh
# Run from the repository root with Python 3 and Pillow on PATH.
set -eu
raw=artifacts/nextgen/title28-studio
npm run build
node scripts/nextgen/studio.mjs tools/assets/u10-keyart/title28-studio.json --out="$raw"
python3 tools/assets/u10-keyart/title28_composite.py "$raw"
python3 tools/assets/u10-keyart/title15_delivery.py "$raw" --keep-hero
python3 tools/assets/u10-keyart/title28_composite.py "$raw" --alternate
python3 tools/assets/u10-keyart/title15_delivery.py "$raw/alternate" --keep-hero --out="$raw/alternate/u10"
node scripts/nextgen/studio.mjs --creature-cards
