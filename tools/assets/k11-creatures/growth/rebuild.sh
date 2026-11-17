#!/bin/sh
# Rebuild the Brood growth kit -> public/assets/brood-growth/ (GLB, normal atlas, manifest) + review renders.
set -eu
cd "$(dirname "$0")/../../../.."
blender -b --factory-startup -P tools/assets/k11-creatures/growth/build.py -- "$@"
