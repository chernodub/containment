#!/bin/sh
# Rebuild original P11 packs sequentially; pass --render for beauty output.
set -eu
cd "$(dirname "$0")/../../.."
BLENDER_BIN=${BLENDER_BIN:-blender}
for script in comms_engineering habitation infested clinical_security control_heroes maintenance_containment incidents cargo kit_families; do
  "$BLENDER_BIN" -b --factory-startup -t 4 -P "tools/assets/p11-set-pieces/$script.py" -- "$@"
done
for script in structure security clinical industrial; do
  "$BLENDER_BIN" -b --factory-startup -t 4 -P "tools/assets/e9-ship-kit/$script.py"
done
