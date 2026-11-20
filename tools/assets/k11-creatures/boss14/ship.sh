#!/bin/sh
# Ship regenerated creature GLBs: geometry pack -> KTX2 + plain fallback -> LOD; keep marine/weapons untouched.
set -e
cd "$(dirname "$0")/../../../.."
KEEP="marine pistol rifle shotgun plasma rocket"
restore() { for n in $KEEP; do git checkout -- public/assets/models/$n.glb public/assets/models/plain/$n.glb; done; }
node tools/assets/i11-models/optimize.mjs
restore
TOKTX=${TOKTX:-/tmp/t12-ktx/KTX-Software-4.4.2-Darwin-arm64-tools.pkg/Payload/usr/local/bin/toktx} node tools/assets/t12-textures/pack.mjs
restore
node tools/assets/i11-models/lod.mjs
restore
