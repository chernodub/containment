#!/bin/sh
# Rebuild the title's current cast and all studio cards featuring these families.
set -eu
sh tools/assets/u10-keyart/title34.sh
npm run build
node scripts/nextgen/studio.mjs --creature-cards
