#!/bin/sh
# CREATURE26 loop: rebuild the Brute caste (body, elite, Warden), ship it, build the game, shoot the heavies lineup.
# usage: TOKTX=<toktx> sh iterate.sh <tag> [extra build.py args]
set -e
cd "$(dirname "$0")/../../../.."
T=$1; shift; C=artifacts/nextgen/creature26; mkdir -p $C/$T
K11_THREADS=${K11_THREADS:-8} blender -b --factory-startup -P tools/assets/k11-creatures/build.py -- --caste=brute --review=$C/$T/k11 "$@" > $C/$T/build.log 2>&1 || { tail -20 $C/$T/build.log; exit 1; }
grep "K11 READY" $C/$T/build.log | cut -c1-400
sh tools/assets/k11-creatures/creature26/ship.sh > $C/$T/ship.log 2>&1
npm run build > $C/$T/vite.log 2>&1
node tools/assets/k11-creatures/creature26/heavies.mjs --out=$C/$T/heavies 2>&1 | tail -2
