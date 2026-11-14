#!/usr/bin/env node
/** Serial final gates, retaining the full verify prerequisite stop and later independent receipts. */
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const gates = [
  ['i11-frozen-verify','npm','run','verify'],
  ['i11-frozen-room-evidence','npm','run','test:room-evidence'],
  ['i11-frozen-build','npm','run','build'],
  ['i11-frozen-smoke','npm','run','test:smoke'],
  ['i11-frozen-authored20','npm','run','test:authored-smoke:all'],
  ['i11-frozen-playtest-smoke','npm','run','playtest:smoke','--','--storyboard-room=awakening-bay'],
];
const receipts = [];
for (const [label,...command] of gates) {
  console.log(`Starting ${label}`);
  const child = spawn(process.execPath, ['scripts/nextgen/i10-run.mjs',label,...command], {stdio:'inherit'});
  const code = await new Promise((resolve,reject) => { child.once('error',reject); child.once('close',resolve); });
  receipts.push({label,command,code});
  await writeFile('artifacts/nextgen/i11/gate-chain.json',JSON.stringify(receipts,null,2)+'\n');
}
console.log(JSON.stringify(receipts));
if (receipts.some(receipt => receipt.code !== 0)) process.exitCode = 1;
