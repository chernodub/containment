#!/bin/sh
# CREATURE29 loop: rebuild the Brute caste, ship it, build the game, shoot the lineup and the Swarm Junction crowd,
# and write a base|now zoom of the crowd's Brutes.  usage: TOKTX=<toktx> sh iter29.sh <tag>
set -e
cd "$(dirname "$0")/../../../.."
T=$1; C=artifacts/nextgen/creature29; mkdir -p $C/$T
K11_THREADS=${K11_THREADS:-8} blender -b --factory-startup -P tools/assets/k11-creatures/build.py -- --caste=brute --review=$C/$T/k11 > $C/$T/build.log 2>&1 || { tail -20 $C/$T/build.log; exit 1; }
grep "flat cells" $C/$T/build.log | cut -c1-200
sh tools/assets/k11-creatures/creature26/ship.sh tyrant > $C/$T/ship.log 2>&1
npm run build > $C/$T/vite.log 2>&1
node tools/assets/k11-creatures/creature26/heavies.mjs --out=$C/$T/heavies 2>&1 | tail -2 | cut -c1-400
npm run capture -- --label=c29-$T --scenarios=${SCEN:-value14-crowd-swarm-junction} > $C/$T/cap.log 2>&1 || tail -3 $C/$T/cap.log
node -e "
const sharp=require('sharp');(async()=>{const o=[];for(const f of ['artifacts/nextgen/c29-base','artifacts/nextgen/c29-$T']){o.push(await sharp(f+'/value14-crowd-swarm-junction-swarm-junction-01.png').extract({left:940,top:240,width:480,height:460}).resize(960).toBuffer())}await sharp({create:{width:1920,height:920,channels:3,background:'#000'}}).composite([{input:o[0],left:0,top:0},{input:o[1],left:960,top:0}]).toFile('$C/$T/sj-zoom.png')})()"
