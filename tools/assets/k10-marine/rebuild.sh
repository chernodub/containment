#!/bin/sh
# Rebuild original MIT geometry/textures on the retained animation contract.
set -eu
cd "$(dirname "$0")/../../.."
blender -b -P tools/assets/k10-marine/marine.py -- --round=4
blender -b -P tools/assets/k10-marine/weapons.py
blender -b -P tools/assets/k10-marine/pose_reviews.py
