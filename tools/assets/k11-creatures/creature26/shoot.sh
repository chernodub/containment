#!/bin/sh
# usage: shoot.sh <tag> <dist>   -> artifacts/nextgen/c26-<tag>-* labels
T=$1; D=$2; C=artifacts/nextgen/creature26
node tools/assets/k11-creatures/creature26/heavies.mjs --dist=$D --out=$C/$T/heavies > $C/$T-heavies.log 2>&1 || echo heavies-fail
for s in value14-crowd-swarm-junction value14-crowd-relay-racks value14-brute-attack-relay-racks look25-dark-cryo value14-overlap-pyro; do
  npm run capture -- --label=c26-$T --scenarios=$s --dist=$D > $C/$T-cap-$s.log 2>&1 || echo "fail $s"
done
node scripts/nextgen/i13-native.mjs --dist=$D --rooms=crew-checkpoint --cases=warden --out=$C/$T/warden > $C/$T-warden.log 2>&1 || echo warden-fail
