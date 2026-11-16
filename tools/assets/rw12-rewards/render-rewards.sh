#!/bin/sh
set -eu

for family in cryo pyro arc kinetic acid recovery universal; do
 blender -b -t 4 -P tools/assets/rw12-rewards/studies.py -- --family=$family > /tmp/rw12-$family.log 2>&1 || exit 1
done
for pair in reserve-thruster:kinetic tactical-salvage:recovery drive-dynamo:arc slide-loader:universal afterquake:kinetic reinforced-bulwark:kinetic spreading-nova:cryo twin-glacier:cryo scorched-fan:pyro napalm-triplet:pyro forked-overload:arc twin-pylon:arc; do
 name=${pair%:*}
 family=${pair#*:}
 blender -b -t 4 -P tools/assets/rw12-rewards/studies.py -- --family=$family --id=$name > /tmp/rw12-$name.log 2>&1 || exit 1
done
"${RW12_PYTHON:-python3}" tools/assets/rw12-rewards/encode.py
