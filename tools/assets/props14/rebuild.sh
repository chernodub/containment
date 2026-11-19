#!/bin/sh
set -eu
cd "$(dirname "$0")/../../.."
blender -b -t 4 --python-exit-code 1 -P tools/assets/props14/props.py
node tools/assets/props14/pack.mjs
