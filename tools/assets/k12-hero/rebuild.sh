#!/bin/sh
# K12 hero marine: game GLB + close-up source + rig portraits + title hero layer. Blender 5.3, no other deps.
set -eu
cd "$(dirname "$0")/../../.."
B="blender -b -t 4"
$B -P tools/assets/k12-hero/marine.py -- --bake --hero      # public/assets/models/marine.glb, artifacts/.../hero/marine-hero.glb
$B -P tools/assets/k12-hero/portraits.py                     # public/assets/portraits/u10/{rig}-bust.png + webp
$B -P tools/assets/k12-hero/portraits.py -- --title          # artifacts/nextgen/k12-final/hero-layer-2560.png
