#!/bin/sh
# CREATURE26: ship a rebuilt tyrant.glb (geometry pack -> KTX2 + plain -> LOD) and restore every other model
# before each later step (WARDEN25 rebuild trap). TOKTX=<path to toktx 4.4.2>.
set -e
cd "$(dirname "$0")/../../../.."
R() { for n in dretch basilisk marauder dragoon marine pistol rifle shotgun plasma rocket; do git checkout -- public/assets/models/$n.glb public/assets/models/plain/$n.glb; done; }
node tools/assets/i11-models/optimize.mjs && R && node tools/assets/t12-textures/pack.mjs && R && node tools/assets/i11-models/lod.mjs && R
