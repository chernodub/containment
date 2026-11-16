#!/bin/sh
set -eu
kit_root=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
cd "$kit_root"
for pack in structure security clinical industrial; do
  "${BLENDER:-blender}" -b --factory-startup -t 4 -P "tools/assets/e9-ship-kit/$pack.py"
done
