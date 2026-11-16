#!/bin/sh
# Rebuild every Lantern Brood caste: sculpt -> bake -> GLB over public/assets/models/<asset>.glb,
# plus review renders in artifacts/nextgen/k11-final/<caste>/. Blender 5.3 (numpy + OpenVDB bundled).
# K11_THREADS limits render/bake threads (default 4; the machine is shared).
set -eu
cd "$(dirname "$0")/../../.."
for caste in crawler brute stalker spitter carrier; do
  blender -b --factory-startup -P tools/assets/k11-creatures/build.py -- --caste="$caste"
done
