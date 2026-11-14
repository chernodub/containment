#!/usr/bin/env node
/** One owned benchmark browser at a time; all raw trials and OS load remain in native reports. */
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {loadavg} from 'node:os';
const source = JSON.parse(await readFile('artifacts/nextgen/i11/frozen-source.json'));
const jobs = [
  ['i11-bench-five','npm','run','bench','--','--label=i11-bench-five','--repeat=5','--seconds=20','--no-build'],
  ...[1,2,3,4,5].map(n => [`i11-rooms-five-${n}`,'npm','run','bench:rooms','--',`--label=i11-rooms-five-${n}`,'--no-build']),
];
const receipts = [];
function inventory(ownerPid) {
  const rows = execFileSync('ps',['-axo','pid=,ppid=,%cpu=,comm='],{encoding:'utf8'}).trim().split('\n').map(line => {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(.+)$/);
    return match ? {pid:Number(match[1]),ppid:Number(match[2]),cpu:Number(match[3]),executable:match[4]} : null;
  }).filter(Boolean);
  const processes = new Map(rows.map(row => [row.pid,row]));
  const owned = row => {
    const seen = new Set();
    for (let pid=row.pid;pid&&!seen.has(pid);pid=processes.get(pid)?.ppid) {
      if (pid===ownerPid) return true;
      seen.add(pid);
    }
    return false;
  };
  const browser = row => /\/(?:Google Chrome for Testing|Chromium|chrome-headless-shell)$/.test(row.executable);
  return {at:new Date().toISOString(),load:loadavg(),browsers:rows.filter(browser).map(row => ({...row,owned:owned(row)})),ambientChrome:rows.filter(row => /\/Google Chrome$/.test(row.executable)).map(row => ({pid:row.pid,cpu:row.cpu}))};
}
for (const [label,...command] of jobs) {
  const before=inventory(null);
  assert.equal(before.browsers.length,0,`Another automation browser exists before ${label}`);
  console.log(`Starting isolated ${label}; load=${before.load}`);
  const snapshots=[before];
  const child=spawn(process.execPath,['scripts/nextgen/i10-run.mjs',label,...command,`--dist=${source.directory}`,`--dist-source-sha=${source.sourceSHA}`],{stdio:'inherit'});
  const timer=setInterval(() => snapshots.push(inventory(child.pid)),5000);
  const code=await new Promise((resolve,reject) => {child.once('error',reject);child.once('close',resolve);});
  clearInterval(timer);snapshots.push(inventory(child.pid));
  const receipt={label,code,command,browserOwnership:{samples:snapshots.length,maximumOwned:Math.max(...snapshots.map(s=>s.browsers.filter(b=>b.owned).length)),foreignAutomationBrowsers:snapshots.flatMap(s=>s.browsers.filter(b=>!b.owned)),snapshots}};
  receipts.push(receipt);
  await writeFile('artifacts/nextgen/i11/benchmark-ownership.json',JSON.stringify({source,receipts},null,2)+'\n');
  if(code!==0)console.log(`${label} retained a nonzero native benchmark exit: ${code}`);
}
console.log(JSON.stringify(receipts.map(({label,code,browserOwnership:b})=>({label,code,samples:b.samples,maximumOwned:b.maximumOwned,foreign:b.foreignAutomationBrowsers.length}))));
if(receipts.some(r=>r.code!==0||r.browserOwnership.foreignAutomationBrowsers.length||r.browserOwnership.maximumOwned!==1))process.exitCode=1;
