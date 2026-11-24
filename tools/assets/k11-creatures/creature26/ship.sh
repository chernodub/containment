#!/bin/sh
# Pack only the rebuilt caste. Set TOKTX to the toktx 4.4.2 executable.
set -e
cd "$(dirname "$0")/../../../.."
model=${1:-tyrant}
case "$model" in dretch|basilisk|marauder|dragoon|tyrant) ;; *) exit 2 ;; esac
export K11_PACK_MODEL="$model"
node tools/assets/i11-models/optimize.mjs
node tools/assets/t12-textures/pack.mjs
node tools/assets/i11-models/lod.mjs
