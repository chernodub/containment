#!/bin/sh
# HEAVY47 value rule: scripts/nextgen/brood43-values.py on the resting crowds.
# The visor and leg rectangles are the gallery's hand labels (final27), valid
# because the fixtures place the marine identically. Usage: measure.sh <capture dir>
set -eu
dir=$1
labels=/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final27/creatures36/crowds
for room in crew-checkpoint swarm-junction transmission-chamber coolant-plant; do
  for kind in final26-crowd heavy47-heavies; do
    stem="$kind-$room-rest-$room"
    [ -f "$dir/$stem.png" ] || continue
    samples="$labels/final26-crowd-$room-rest-$room.samples.json"
    [ -f "$samples" ] || samples="$dir/$stem.samples.json"
    [ -f "$samples" ] || { echo "$stem: no visor/leg labels"; continue; }
    printf '\n%s\n' "$stem"
    python3 scripts/nextgen/brood43-values.py "$dir/$stem.png" "$samples" "$dir/$stem.zones.json"
  done
done
