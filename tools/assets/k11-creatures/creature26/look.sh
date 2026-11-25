#!/bin/sh
# CREATURE29 quick look: preview one part in the four poses that matter, as one sheet.  usage: look.sh <out> [part] [extra preview args]
set -e
cd "$(dirname "$0")/../../../.."
O=$1; P=${2:-body}; shift; shift 2>/dev/null || true
blender -b --factory-startup -P tools/assets/k11-creatures/creature26/preview.py -- --caste=brute --out=$O --parts=$P \
  --poses=m10-idle@0.5,m10-waiting@0.6,m10-windup@0.95,m10-recovery@0.3 --facings=left,down "$@" > $O.log 2>&1 || { tail -30 $O.log; exit 1; }
grep "^POSE\|^PREVIEW" $O.log
node tools/assets/k11-creatures/creature26/grid.mjs $O/sheet.png 4 600 $O/plan-idle-0.5-left.png $O/plan-waiting-0.6-left.png $O/plan-windup-0.95-left.png $O/plan-recovery-0.3-left.png $O/plan-idle-0.5-down.png $O/plan-waiting-0.6-down.png $O/plan-windup-0.95-down.png $O/plan-recovery-0.3-down.png
node tools/assets/k11-creatures/creature26/grid.mjs $O/sil.png 4 400 $O/sil-idle-0.5-left.png $O/sil-waiting-0.6-left.png $O/sil-windup-0.95-left.png $O/sil-recovery-0.3-left.png $O/sil-idle-0.5-down.png $O/sil-waiting-0.6-down.png $O/sil-windup-0.95-down.png $O/sil-recovery-0.3-down.png
