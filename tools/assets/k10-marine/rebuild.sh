#!/bin/sh
# Original MIT anatomy, curved shell armour, arsenal and UI render handoff.
set -eu
cd "$(dirname "$0")/../../.."
blender -b -P tools/assets/k10-marine/marine.py -- --round=11 --helmet=3 --bake
blender -b -P tools/assets/k10-marine/weapons.py
blender -b -P tools/assets/k10-marine/portraits.py
blender -b -P tools/assets/k10-marine/pose_reviews.py
